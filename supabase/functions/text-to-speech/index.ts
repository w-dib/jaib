import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { DOMParser } from "npm:linkedom";

// Helper function to set CORS headers
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

// Helper function to get plain text from HTML
function getPlainTextFromHTML(htmlString: string, requestId: string): string {
  console.log(
    `text-to-speech function: RID ${requestId} - getPlainTextFromHTML: Attempting to parse HTML (first 100 chars): ${htmlString.substring(
      0,
      100
    )}`
  );
  try {
    const doc = new DOMParser().parseFromString(htmlString, "text/html");
    if (!doc || !doc.documentElement) {
      console.error(
        `text-to-speech function: RID ${requestId} - getPlainTextFromHTML: Failed to parse HTML or documentElement is null.`
      );
      return "";
    }
    const text = doc.documentElement.textContent || "";
    console.log(
      `text-to-speech function: RID ${requestId} - getPlainTextFromHTML: Successfully parsed HTML. Extracted text length (using documentElement): ${text.length}`
    );
    return text.trim();
  } catch (e) {
    console.error(
      `text-to-speech function: RID ${requestId} - getPlainTextFromHTML: Error parsing HTML: ${e.message}, Stack: ${e.stack}`
    );
    return "";
  }
}

Deno.serve(async (req) => {
  const requestId = req.headers.get("x-request-id") || `local-${Date.now()}`;
  console.log(
    `text-to-speech function: START Request ID: ${requestId} - Method: ${req.method} - URL: ${req.url}`
  );

  if (req.method === "OPTIONS") {
    console.log(
      `text-to-speech function: RID ${requestId} - Handling OPTIONS request`
    );
    return new Response("ok", { headers: corsHeaders });
  }

  let plainText;
  try {
    console.log(
      `text-to-speech function: RID ${requestId} - Attempting to parse request body as JSON.`
    );
    const body = await req.json();
    const htmlInput = body.text; // Expecting HTML content in 'text' field

    if (!htmlInput || typeof htmlInput !== "string") {
      console.error(
        `text-to-speech function: RID ${requestId} - 'text' field (HTML) is missing or not a string in request body.`
      );
      return new Response(
        JSON.stringify({
          error:
            "Invalid request body: 'text' field (HTML) is missing or not a string.",
        }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }
    console.log(
      `text-to-speech function: RID ${requestId} - Successfully parsed JSON body. Received HTML input. Length: ${
        htmlInput.length
      }. First 100 chars: ${htmlInput.substring(0, 100)}`
    );

    plainText = getPlainTextFromHTML(htmlInput, requestId);

    if (!plainText) {
      console.error(
        `text-to-speech function: RID ${requestId} - Extracted plain text is empty. HTML input (first 100): ${htmlInput.substring(
          0,
          100
        )}`
      );
      return new Response(
        JSON.stringify({
          error: "Failed to extract text from HTML or extracted text is empty.",
        }),
        {
          status: 400, // Bad request as the content might be non-textual or parsing failed
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }
    console.log(
      `text-to-speech function: RID ${requestId} - Extracted plain text. Length: ${
        plainText.length
      }. First 100 chars of plain text: ${plainText.substring(0, 100)}`
    );
  } catch (jsonError) {
    console.error(
      `text-to-speech function: RID ${requestId} - Failed to parse request body as JSON: ${jsonError.message}, Stack: ${jsonError.stack}`
    );
    return new Response(JSON.stringify({ error: "Invalid JSON payload." }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    const HF_API_TOKEN = Deno.env.get("HF_API_TOKEN");
    if (!HF_API_TOKEN) {
      console.error(
        `text-to-speech function: RID ${requestId} - Hugging Face API token (HF_API_TOKEN) is not set.`
      );
      return new Response(
        JSON.stringify({ error: "TTS service configuration error." }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }
    console.log(
      `text-to-speech function: RID ${requestId} - HF_API_TOKEN is present.`
    );

    // Try a different model
    const model = "espnet/kan-bayashi_ljspeech_vits";
    // const model = "ResembleAI/chatterbox"; // Original model that caused 404
    const apiUrl = `https://api-inference.huggingface.co/models/${model}`;

    console.log(
      `text-to-speech function: RID ${requestId} - Calling Hugging Face Inference API with model ${model}. URL: ${apiUrl}`
    );
    const startTime = Date.now();

    const hfResponse = await fetch(apiUrl, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${HF_API_TOKEN}`,
        "Content-Type": "application/json",
        Accept: "audio/mpeg", // Explicitly accept mpeg, though HF usually sends this for TTS
      },
      body: JSON.stringify({ inputs: plainText }),
    });
    const durationMs = Date.now() - startTime;
    console.log(
      `text-to-speech function: RID ${requestId} - Hugging Face API call took ${durationMs}ms. Status: ${hfResponse.status}`
    );

    if (!hfResponse.ok) {
      let errorBody = "Could not read error body";
      try {
        errorBody = await hfResponse.text();
      } catch (e) {
        /* ignore */
      }
      console.error(
        `text-to-speech function: RID ${requestId} - Hugging Face API returned an error. Status: ${
          hfResponse.status
        }, Body: ${errorBody.substring(0, 500)}`
      ); // Log first 500 chars
      return new Response(
        JSON.stringify({
          error: `TTS service provider error. Status: ${hfResponse.status}`,
        }),
        {
          status: 502, // Bad Gateway
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const audioContentType = hfResponse.headers.get("Content-Type");
    console.log(
      `text-to-speech function: RID ${requestId} - Hugging Face response Content-Type: ${audioContentType}`
    );

    if (!audioContentType || !audioContentType.startsWith("audio/")) {
      let responseSample = "Could not read response body";
      try {
        responseSample = await hfResponse.text();
      } catch (e) {
        /* ignore */
      }
      console.error(
        `text-to-speech function: RID ${requestId} - Hugging Face response is not audio. Content-Type: ${audioContentType}. Response sample: ${responseSample.substring(
          0,
          200
        )}`
      );
      return new Response(
        JSON.stringify({ error: "TTS service returned non-audio data." }),
        {
          status: 502, // Bad Gateway
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const audioBlob = await hfResponse.blob();
    console.log(
      `text-to-speech function: RID ${requestId} - Successfully received audio blob from Hugging Face. Size: ${audioBlob.size}, Type: ${audioBlob.type}`
    );

    return new Response(audioBlob, {
      headers: {
        ...corsHeaders,
        "Content-Type": audioBlob.type || "audio/mpeg", // Use blob's type or default
      },
      status: 200,
    });
  } catch (error) {
    console.error(
      `text-to-speech function: RID ${requestId} - Uncaught error in main processing: ${error.message}, Stack: ${error.stack}`
    );
    return new Response(
      JSON.stringify({
        error: "Internal server error processing TTS request.",
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});

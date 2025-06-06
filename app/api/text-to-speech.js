import { Client } from "@gradio/client";

// This is a simple, on-demand TTS service.
// It receives a single chunk of text and returns its audio.
export default async function handler(request, response) {
  if (request.method !== "POST") {
    response.setHeader("Allow", ["POST"]);
    return response.status(405).end(`Method ${request.method} Not Allowed`);
  }

  const { text: textChunk } = request.body;

  if (
    !textChunk ||
    typeof textChunk !== "string" ||
    textChunk.trim().length === 0
  ) {
    return response
      .status(400)
      .json({ error: "Missing or invalid 'text' in request body" });
  }

  console.log(
    `[tts-chunk-service] Received request for text: "${textChunk.substring(
      0,
      50
    )}..."`
  );

  try {
    const client = await Client.connect("ResembleAI/Chatterbox");

    const result = await client.predict("/generate_tts_audio", {
      text_input: textChunk,
    });

    if (result.data && result.data[0] && result.data[0].url) {
      const audioUrl = result.data[0].url;
      const audioResponse = await fetch(audioUrl);

      if (!audioResponse.ok || !audioResponse.body) {
        throw new Error("Failed to fetch audio from Gradio Space.");
      }

      // Get the audio data as a Buffer
      const audioArrayBuffer = await audioResponse.arrayBuffer();
      const audioBuffer = Buffer.from(audioArrayBuffer);

      // Send the audio file back to the client
      response.setHeader("Content-Type", "audio/mpeg");
      return response.status(200).send(audioBuffer);
    } else {
      throw new Error("Invalid response structure from Gradio API.");
    }
  } catch (error) {
    console.error("[tts-chunk-service] Error during TTS processing:", error);
    const errorMessage = error.message || "Internal Server Error";
    return response.status(500).json({
      error: "Failed to process text-to-speech request.",
      details: errorMessage,
    });
  }
}

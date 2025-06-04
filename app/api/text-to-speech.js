export default async function handler(request, response) {
  if (request.method !== "POST") {
    response.setHeader("Allow", ["POST"]);
    return response.status(405).end(`Method ${request.method} Not Allowed`);
  }

  const { text: inputText } = request.body; // Assuming client sends { text: "..." }

  if (!inputText) {
    return response
      .status(400)
      .json({ error: "Missing 'text' in request body" });
  }

  const ELEVEN_LABS_API_TOKEN = process.env.ELEVEN_LABS_API_TOKEN;
  const VOICE_ID = "9BWtsMINqrJLrRacOk9x"; // Your provided voice ID
  // You can choose a specific model, e.g., "eleven_multilingual_v2" or "eleven_mono_v1"
  // If not specified, ElevenLabs might use a default. For clarity, let's pick one.
  // "eleven_turbo_v2" is often a good balance for speed and quality for English.
  // Or use "eleven_monolingual_v1" if you only need English.
  // Let's use eleven_monolingual_v1 as a common default.
  const MODEL_ID = "eleven_monolingual_v1";

  if (!ELEVEN_LABS_API_TOKEN) {
    console.error("ElevenLabs API token is not configured.");
    return response
      .status(500)
      .json({ error: "TTS service (ElevenLabs) not configured correctly." });
  }

  console.log(
    `[text-to-speech-elevenlabs] Received text for TTS (first 100 chars): ${inputText.substring(
      0,
      100
    )}`
  );

  const elevenLabsApiUrl = `https://api.elevenlabs.io/v1/text-to-speech/${VOICE_ID}/stream`;

  try {
    const elevenLabsResponse = await fetch(elevenLabsApiUrl, {
      method: "POST",
      headers: {
        Accept: "audio/mpeg", // Or your preferred audio format
        "Content-Type": "application/json",
        "xi-api-key": ELEVEN_LABS_API_TOKEN,
      },
      body: JSON.stringify({
        text: inputText,
        model_id: MODEL_ID, // Optional: "eleven_monolingual_v1", "eleven_multilingual_v2", etc.
        // voice_settings: { // Optional: Adjust voice settings if needed
        //   stability: 0.5,
        //   similarity_boost: 0.75,
        //   style: 0.5, // for model eleven_multilingual_v2, higher values make the speech more expressive
        //   use_speaker_boost: true // for model eleven_multilingual_v2
        // }
      }),
    });

    console.log(
      `[text-to-speech-elevenlabs] ElevenLabs API response status: ${elevenLabsResponse.status}`
    );

    if (!elevenLabsResponse.ok) {
      const errorBody = await elevenLabsResponse.json(); // ElevenLabs usually returns JSON errors
      console.error(
        `[text-to-speech-elevenlabs] ElevenLabs API error: ${elevenLabsResponse.status}`,
        errorBody
      );
      return response.status(elevenLabsResponse.status).json({
        error: `ElevenLabs API Error: ${elevenLabsResponse.statusText}`,
        details: errorBody,
      });
    }

    // Check content type from ElevenLabs
    const contentType = elevenLabsResponse.headers.get("content-type");
    if (!contentType || !contentType.startsWith("audio/")) {
      // Try to get text if it's not audio, might be a structured error not caught by .ok
      let errorDetails = "Unexpected content type received from ElevenLabs.";
      try {
        const errorText = await elevenLabsResponse.text();
        errorDetails = `Expected audio/*, got ${contentType}. Body: ${errorText.substring(
          0,
          200
        )}`;
      } catch {
        // ignore if can't read text
      }
      console.error(
        `[text-to-speech-elevenlabs] Unexpected content type from ElevenLabs: ${contentType}`
      );
      return response.status(500).json({
        error: "Unexpected response format from TTS service (ElevenLabs).",
        details: errorDetails,
      });
    }

    console.log(
      `[text-to-speech-elevenlabs] Streaming audio content type: ${contentType}`
    );
    response.setHeader("Content-Type", contentType);

    // Stream the response body directly to the client
    // Vercel's environment supports streaming Node.js's ReadableStream directly
    // For Node.js 18+ Readable.fromWeb(elevenLabsResponse.body) is preferred.
    // However, just piping response.body should work in many modern Node environments.
    // For maximum compatibility in Vercel serverless functions:
    if (elevenLabsResponse.body) {
      // Convert to Buffer to ensure compatibility
      const audioArrayBuffer = await elevenLabsResponse.arrayBuffer();
      const audioBuffer = Buffer.from(audioArrayBuffer);
      return response.status(200).send(audioBuffer);
    } else {
      console.error(
        "[text-to-speech-elevenlabs] Response body from ElevenLabs is null."
      );
      return response
        .status(500)
        .json({ error: "Failed to get audio stream from ElevenLabs." });
    }
  } catch (error) {
    console.error(
      "[text-to-speech-elevenlabs] Error during TTS processing:",
      error
    );
    return response
      .status(500)
      .json({ error: "Internal Server Error", details: error.message });
  }
}

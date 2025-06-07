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
    // Call the Kokoro TTS API running on RunPod
    const ttsResponse = await fetch(
      "https://rihvs6xrx448sc-8880.proxy.runpod.net/v1/audio/speech",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "kokoro",
          voice: "af_bella", // You can change this to any available voice
          input: textChunk,
          response_format: "mp3",
        }),
      }
    );

    if (!ttsResponse.ok) {
      throw new Error(`TTS API responded with status: ${ttsResponse.status}`);
    }

    // Get the audio data as a Buffer
    const audioArrayBuffer = await ttsResponse.arrayBuffer();
    const audioBuffer = Buffer.from(audioArrayBuffer);

    // Send the audio file back to the client
    response.setHeader("Content-Type", "audio/mpeg");
    return response.status(200).send(audioBuffer);
  } catch (error) {
    console.error("[tts-chunk-service] Error during TTS processing:", error);
    const errorMessage = error.message || "Internal Server Error";
    return response.status(500).json({
      error: "Failed to process text-to-speech request.",
      details: errorMessage,
    });
  }
}

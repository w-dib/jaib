    import io
    from fastapi import FastAPI, HTTPException
    from fastapi.responses import StreamingResponse
    from pydantic import BaseModel
    import torchaudio as ta
    from chatterbox.tts import ChatterboxTTS
    import torch

    # Initialize FastAPI app
    app = FastAPI()

    # Load the model on startup
    # This ensures the model is loaded once and ready for requests
    print("Loading Chatterbox TTS model...")
    model = ChatterboxTTS.from_pretrained(
        device="cuda" if torch.cuda.is_available() else "cpu"
    )
    print("Model loaded successfully.")

    # Define the request body model
    class TTSRequest(BaseModel):
        text: str

    @app.post("/generate/")
    async def generate_speech(request: TTSRequest):
        """
        Accepts text and returns a WAV audio file.
        """
        if not request.text:
            raise HTTPException(status_code=400, detail="Text input cannot be empty.")

        try:
            print(f"Generating speech for: '{request.text}'")
            # Generate the waveform
            wav = model.generate(request.text)

            # Save waveform to an in-memory file
            buffer = io.BytesIO()
            ta.save(buffer, wav, model.sr, format="wav")
            buffer.seek(0)

            print("Speech generated successfully.")
            # Return the audio as a streaming response
            return StreamingResponse(buffer, media_type="audio/wav")

        except Exception as e:
            print(f"An error occurred: {e}")
            raise HTTPException(status_code=500, detail=str(e))

    @app.get("/")
    def read_root():
        return {"status": "Chatterbox TTS API is running."}

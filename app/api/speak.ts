export default async function handler(req: { query: { text: any; }; }, res: { setHeader: (arg0: string, arg1: string) => void; send: (arg0: Buffer<ArrayBuffer>) => void; }) {
    const { text } = req.query;
  
    const ttsRes = await fetch("https://api.elevenlabs.io/v1/text-to-speech/a0rlowyH433kybNjNN/stream", {
      method: "POST",
      headers: {
        "xi-api-key": process.env.ELEVENLABS_API_KEY!,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        text,
        voice_settings: { stability: 0.4, similarity_boost: 0.8 }
      })
    });
  
    const audioBuffer = await ttsRes.arrayBuffer();
    res.setHeader("Content-Type", "audio/mpeg");
    res.send(Buffer.from(audioBuffer));
  }
  
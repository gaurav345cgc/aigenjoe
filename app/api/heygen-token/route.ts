// app/api/heygen-token/route.ts

export async function GET() {
  const response = await fetch("https://api.heygen.com/v1/streaming.create_token", {
    method: "POST",
    headers: {
      "x-api-key": process.env.NEXT_PUBLIC_HEYGEN_API_KEY!,
      "Content-Type": "application/json",
    },
  });

  const data = await response.json();

  return new Response(JSON.stringify({ token: data.data.token }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
}

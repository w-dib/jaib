export default function handler(request, response) {
  response.status(200).json({
    body: "Hello from Vercel Serverless Function!",
    query: request.query,
    cookies: request.cookies,
  });
}

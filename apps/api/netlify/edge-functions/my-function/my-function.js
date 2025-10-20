export default async (request, context) => {
  return new Response(JSON.stringify({
    message: "Hello from my-function!",
    timestamp: new Date().toISOString(),
    method: request.method,
    url: request.url
  }), {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization'
    }
  });
};

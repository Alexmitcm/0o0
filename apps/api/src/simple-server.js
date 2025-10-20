const http = require("node:http");

const server = http.createServer((req, res) => {
  res.writeHead(200, { "Content-Type": "application/json" });

  if (req.url === "/ping") {
    res.end(JSON.stringify({ ping: "pong" }));
  } else {
    res.end(JSON.stringify({ message: "Simple server is running" }));
  }
});

const port = 8080;

server.listen(port, "0.0.0.0", () => {
  console.log(`Simple server running on port ${port}`);
  console.log(`Test with: curl http://localhost:${port}/ping`);
});

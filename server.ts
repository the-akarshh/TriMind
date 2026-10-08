import { createServer } from "http";
import { parse } from "url";
import next from "next";
import { initSocketServer } from "./src/lib/realtime/socket-server";
import { gameEngine } from "./src/lib/engine/multiplayer-engine";

const dev = process.env.NODE_ENV !== "production";
const hostname = process.env.HOSTNAME || "localhost";
const port = parseInt(process.env.PORT || "3000", 10);

const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

async function main() {
  await app.prepare();

  const server = createServer(async (req, res) => {
    try {
      const parsedUrl = parse(req.url!, true);
      await handle(req, res, parsedUrl);
    } catch (err) {
      console.error("Error handling request:", err);
      res.statusCode = 500;
      res.end("Internal Server Error");
    }
  });

  // Attach Socket.IO real-time multiplayer server
  const io = initSocketServer(server, gameEngine);

  server.listen(port, () => {
    console.log(`> Aptitude Arena Server ready on http://${hostname}:${port}`);
    console.log(`> Real-time Socket.IO multiplayer engine attached and listening.`);
  });
}

main().catch((err) => {
  console.error("Error starting server:", err);
  process.exit(1);
});

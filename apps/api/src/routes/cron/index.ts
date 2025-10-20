import { Hono } from "hono";
import secretMiddleware from "../../middlewares/secretMiddleware";
import prisma from "../../prisma/client";
import syncSubscribersToGuild from "./guild/syncSubscribersToGuild";
import removeExpiredSubscribers from "./removeExpiredSubscribers";

const app = new Hono();

app.get("/syncSubscribersToGuild", secretMiddleware, syncSubscribersToGuild);
app.get(
  "/removeExpiredSubscribers",
  secretMiddleware,
  removeExpiredSubscribers
);

// Flip tournaments by time: Upcoming->Active, Active->Ended
app.post("/flipTournaments", secretMiddleware, async (c) => {
  const now = new Date();
  const [activated, ended] = await Promise.all([
    prisma.tournament.updateMany({
      data: { status: "Active" },
      where: { startDate: { lte: now }, status: "Upcoming" }
    }),
    prisma.tournament.updateMany({
      data: { status: "Ended" },
      where: { endDate: { lt: now }, status: "Active" }
    })
  ]);
  return c.json({ activated: activated.count, ended: ended.count });
});

export default app;

import prisma from "../prisma/client";

const main = async () => {
  const now = new Date();
  const later = new Date(Date.now() + 1000 * 60 * 60 * 24 * 3);

  const active = await prisma.tournament.create({
    data: {
      endDate: later,
      name: "Sample Active Tournament",
      prizePool: "500",
      startDate: now,
      status: "Active",
      type: "Balanced"
    }
  });

  const upcoming = await prisma.tournament.create({
    data: {
      endDate: new Date(later.getTime() + 1000 * 60 * 60 * 24 * 3),
      name: "Sample Upcoming Tournament",
      prizePool: "1000",
      startDate: later,
      status: "Upcoming",
      type: "Unbalanced"
    }
  });

  // Optionally add one participant to active to test calc/settle flows
  await prisma.tournamentParticipant.create({
    data: {
      coinsBurned: "10",
      eligibilityType: "Balanced",
      tournamentId: active.id,
      walletAddress: "0x000000000000000000000000000000000000dEaD"
    }
  });

  // eslint-disable-next-line no-console
  console.log("Seeded tournaments:", {
    active: active.id,
    upcoming: upcoming.id
  });
};

main().finally(async () => {
  await prisma.$disconnect();
});

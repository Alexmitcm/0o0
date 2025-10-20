import prisma from "../prisma/client";
import logger from "../utils/logger";

async function seedGameCategories() {
  try {
    logger.info("Starting to seed game categories...");

    // Create Play to Earn Games category
    const playToEarnCategory = await prisma.gameCategory.upsert({
      create: {
        color: "#f59e0b",
        description: "Play to earn games - requires premium subscription",
        icon: "💰",
        id: "play-to-earn",
        name: "Play to Earn Games",
        slug: "play-to-earn-games"
      },
      update: {},
      where: { slug: "play-to-earn-games" }
    });

    // Create Free to Play Games category
    const freeToPlayCategory = await prisma.gameCategory.upsert({
      create: {
        color: "#10b981",
        description: "Free to play games - available to all users",
        icon: "🎮",
        id: "free-to-play",
        name: "Free to Play Games",
        slug: "free-to-play-games"
      },
      update: {},
      where: { slug: "free-to-play-games" }
    });

    logger.info("Game categories seeded successfully!");
    logger.info(
      `Created categories: ${playToEarnCategory.name}, ${freeToPlayCategory.name}`
    );

    return {
      categories: [playToEarnCategory, freeToPlayCategory],
      success: true
    };
  } catch (error) {
    logger.error("Error seeding game categories:", error);
    throw error;
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  seedGameCategories()
    .then(() => {
      logger.info("Category seeding completed successfully!");
      process.exit(0);
    })
    .catch((error) => {
      logger.error("Category seeding failed:", error);
      process.exit(1);
    });
}

export default seedGameCategories;

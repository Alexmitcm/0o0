// Script to add sample P2E and F2P games directly to database
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const sampleGames = [
  // Free to Play Games
  {
    coverImageUrl: "https://picsum.photos/512/384?random=space",
    description:
      "An exciting space exploration game where you pilot a spaceship through asteroid fields and discover new planets. Perfect for casual gaming!",
    gameType: "FreeToPlay" as const,
    height: 720,
    iconUrl: "https://picsum.photos/512/512?random=space-icon",
    instructions:
      "Use arrow keys to move, spacebar to shoot, and collect power-ups to enhance your ship.",
    packageUrl: "https://cdn.htmlgames.com/SpaceAdventure",
    slug: "space-adventure",
    status: "Published" as const,
    title: "Space Adventure",
    width: 1280
  },
  {
    coverImageUrl: "https://picsum.photos/512/384?random=puzzle",
    description:
      "Challenge your mind with hundreds of brain-teasing puzzles. From simple jigsaws to complex logic puzzles, there's something for everyone!",
    gameType: "FreeToPlay" as const,
    height: 720,
    iconUrl: "https://picsum.photos/512/512?random=puzzle-icon",
    instructions:
      "Click and drag pieces to solve puzzles. Use hints if you get stuck!",
    packageUrl: "https://cdn.htmlgames.com/PuzzleMaster",
    slug: "puzzle-master",
    status: "Published" as const,
    title: "Puzzle Master",
    width: 1280
  },
  {
    coverImageUrl: "https://picsum.photos/512/384?random=racing",
    description:
      "Get behind the wheel and race against the clock in this high-speed racing game. Master different tracks and unlock new cars!",
    gameType: "FreeToPlay" as const,
    height: 720,
    iconUrl: "https://picsum.photos/512/512?random=racing-icon",
    instructions:
      "Use WASD or arrow keys to control your car. Avoid obstacles and collect boosters!",
    packageUrl: "https://cdn.htmlgames.com/RacingChampion",
    slug: "racing-champion",
    status: "Published" as const,
    title: "Racing Champion",
    width: 1280
  },

  // Play to Earn Games
  {
    coverImageUrl: "https://picsum.photos/512/384?random=crypto",
    description:
      "Embark on an epic adventure in the blockchain world! Complete quests, defeat monsters, and earn cryptocurrency rewards. Premium subscription required.",
    gameType: "PlayToEarn" as const,
    height: 720,
    iconUrl: "https://picsum.photos/512/512?random=crypto-icon",
    instructions:
      "Use WASD to move, mouse to attack. Complete quests to earn tokens and level up your character.",
    packageUrl: "https://cdn.htmlgames.com/CryptoQuest",
    slug: "crypto-quest",
    status: "Published" as const,
    title: "Crypto Quest",
    width: 1280
  },
  {
    coverImageUrl: "https://picsum.photos/512/384?random=nft",
    description:
      "Collect rare NFTs by playing this strategic card game. Trade, battle, and build your collection to earn real rewards!",
    gameType: "PlayToEarn" as const,
    height: 720,
    iconUrl: "https://picsum.photos/512/512?random=nft-icon",
    instructions:
      "Drag cards to play them. Build powerful combinations and defeat opponents to earn NFT rewards.",
    packageUrl: "https://cdn.htmlgames.com/NFTCollector",
    slug: "nft-collector",
    status: "Published" as const,
    title: "NFT Collector",
    width: 1280
  },
  {
    coverImageUrl: "https://picsum.photos/512/384?random=farm",
    description:
      "Manage your virtual farm and earn DeFi tokens! Plant crops, harvest rewards, and participate in yield farming. Premium features unlock real earnings!",
    gameType: "PlayToEarn" as const,
    height: 720,
    iconUrl: "https://picsum.photos/512/512?random=farm-icon",
    instructions:
      "Click to plant seeds, water crops, and harvest rewards. Upgrade your farm to increase earnings.",
    packageUrl: "https://cdn.htmlgames.com/DeFiFarmer",
    slug: "defi-farmer",
    status: "Published" as const,
    title: "DeFi Farmer",
    width: 1280
  }
];

async function addSampleGames() {
  console.log("🎮 Adding sample games directly to database...\n");

  try {
    // Check if games already exist
    const existingGames = await prisma.game.findMany({
      where: {
        slug: {
          in: sampleGames.map((game) => game.slug)
        }
      }
    });

    if (existingGames.length > 0) {
      console.log("⚠️  Some games already exist, skipping...");
      console.log(
        "Existing games:",
        existingGames.map((g) => g.title)
      );
    }

    // Add each sample game
    for (let i = 0; i < sampleGames.length; i++) {
      const game = sampleGames[i];
      console.log(`${i + 1}. Adding ${game.title} (${game.gameType})...`);

      try {
        // Check if game already exists
        const existing = await prisma.game.findUnique({
          where: { slug: game.slug }
        });

        if (existing) {
          console.log(`   ⏭️  ${game.title} already exists, skipping`);
          continue;
        }

        const createdGame = await prisma.game.create({
          data: {
            ...game,
            developerName: "Hey Games Studio",
            entryFilePath: "index.html",
            orientation: "Landscape",
            version: "1.0.0"
          }
        });

        console.log(`   ✅ ${game.title} added successfully`);
        console.log(`   🎮 Type: ${createdGame.gameType}`);
        console.log(`   📊 Status: ${createdGame.status}`);
        console.log(`   🔗 Slug: ${createdGame.slug}`);
      } catch (error) {
        console.log(
          `   ❌ Error adding ${game.title}:`,
          error instanceof Error ? error.message : String(error)
        );
      }
    }

    console.log("\n🎉 Sample games addition completed!");
    console.log("\n📝 Next steps:");
    console.log("1. ✅ Open Game Hub: http://localhost:4784/gaming-dashboard");
    console.log("2. 🔍 Check for new games in different categories");
    console.log(
      "3. 🔒 Test P2E games access (should be locked for non-premium users)"
    );
    console.log("4. 🎮 Test F2P games (should be accessible to all users)");
    console.log("5. 📊 Check admin panel for new games");
  } catch (error) {
    console.error(
      "❌ Error adding sample games:",
      error instanceof Error ? error.message : String(error)
    );
  } finally {
    await prisma.$disconnect();
  }
}

// Run the script
addSampleGames();

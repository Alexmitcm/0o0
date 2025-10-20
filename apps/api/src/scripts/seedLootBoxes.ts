import prisma from "../prisma/client";
import logger from "../utils/logger";

async function seedLootBoxes() {
  try {
    logger.info("🌱 Starting loot box seeding...");

    // Create Free Loot Box
    const freeLootBox = await prisma.lootBox.create({
      data: {
        name: "Daily Free Loot Box",
        description: "Open this loot box daily to earn coins! Watch an ad to claim your reward.",
        type: "Free",
        isActive: true,
        cooldownMinutes: 60, // 1 hour cooldown
        maxOpensPerDay: 3, // 3 times per day
        adRequired: true,
        adProvider: "google",
        adPlacementId: "rewarded_video",
        minCoinReward: 10,
        maxCoinReward: 50,
        coinType: "Experience"
      }
    });

    // Add coin rewards to free loot box
    await prisma.lootBoxReward.create({
      data: {
        lootBoxId: freeLootBox.id,
        rewardType: "Coins",
        rewardValue: JSON.stringify({
          type: "coins",
          amount: "random", // Will use min/max from loot box
          coinType: "Experience"
        }),
        probability: 1.0, // Always give coins
        isActive: true
      }
    });

    // Create Premium Loot Box
    const premiumLootBox = await prisma.lootBox.create({
      data: {
        name: "Premium Mystery Box",
        description: "Exclusive loot box for premium users! Contains NFTs, crypto, and rare rewards.",
        type: "Premium",
        isActive: true,
        cooldownMinutes: 1440, // 24 hours cooldown
        maxOpensPerDay: 1, // Once per day
        requiresPremium: true,
        minCoinReward: 100,
        maxCoinReward: 500,
        coinType: "Experience"
      }
    });

    // Add various rewards to premium loot box
    const premiumRewards = [
      {
        rewardType: "Coins" as const,
        rewardValue: JSON.stringify({
          type: "coins",
          amount: "random",
          coinType: "Experience"
        }),
        probability: 0.4 // 40% chance
      },
      {
        rewardType: "NFT" as const,
        rewardValue: JSON.stringify({
          type: "nft",
          collection: "system_nfts",
          rarity: "common"
        }),
        probability: 0.3 // 30% chance
      },
      {
        rewardType: "Crypto" as const,
        rewardValue: JSON.stringify({
          type: "crypto",
          symbol: "USDT",
          amount: "10"
        }),
        probability: 0.2 // 20% chance
      },
      {
        rewardType: "Crypto" as const,
        rewardValue: JSON.stringify({
          type: "crypto",
          symbol: "ETH",
          amount: "0.01"
        }),
        probability: 0.1 // 10% chance
      }
    ];

    for (const reward of premiumRewards) {
      await prisma.lootBoxReward.create({
        data: {
          lootBoxId: premiumLootBox.id,
          ...reward,
          isActive: true
        }
      });
    }

    // Create NFT Collection
    const nftCollection = await prisma.nFTCollection.create({
      data: {
        name: "System NFTs",
        description: "Official system NFT collection",
        contractAddress: "0x0000000000000000000000000000000000000000",
        chainId: 1,
        symbol: "SYS",
        imageUrl: "https://via.placeholder.com/300x300",
        isActive: true
      }
    });

    // Create some sample NFTs
    const sampleNFTs = [
      {
        tokenId: "1",
        name: "Common Card",
        description: "A common trading card",
        imageUrl: "https://via.placeholder.com/300x300?text=Common",
        rarity: "common"
      },
      {
        tokenId: "2",
        name: "Rare Card",
        description: "A rare trading card",
        imageUrl: "https://via.placeholder.com/300x300?text=Rare",
        rarity: "rare"
      },
      {
        tokenId: "3",
        name: "Epic Card",
        description: "An epic trading card",
        imageUrl: "https://via.placeholder.com/300x300?text=Epic",
        rarity: "epic"
      },
      {
        tokenId: "4",
        name: "Legendary Card",
        description: "A legendary trading card",
        imageUrl: "https://via.placeholder.com/300x300?text=Legendary",
        rarity: "legendary"
      }
    ];

    for (const nft of sampleNFTs) {
      await prisma.nFT.create({
        data: {
          collectionId: nftCollection.id,
          ...nft,
          isActive: true
        }
      });
    }

    // Create Crypto Rewards
    const cryptoRewards = [
      {
        symbol: "USDT",
        name: "Tether USD",
        contractAddress: "0xdAC17F958D2ee523a2206206994597C13D831ec7",
        chainId: 1,
        decimals: 6
      },
      {
        symbol: "ETH",
        name: "Ethereum",
        contractAddress: "0x0000000000000000000000000000000000000000",
        chainId: 1,
        decimals: 18
      }
    ];

    for (const crypto of cryptoRewards) {
      await prisma.cryptoReward.create({
        data: {
          ...crypto,
          isActive: true
        }
      });
    }

    // Create Ad Providers
    const adProviders = [
      {
        name: "google",
        displayName: "Google AdMob",
        config: {
          appId: "ca-app-pub-3940256099942544~3347511713",
          adUnitId: "ca-app-pub-3940256099942544/5224354917"
        }
      },
      {
        name: "unity",
        displayName: "Unity Ads",
        config: {
          gameId: "1234567",
          placementId: "rewardedVideo"
        }
      },
      {
        name: "ironsource",
        displayName: "IronSource",
        config: {
          appKey: "your-app-key",
          userId: "user-id"
        }
      }
    ];

    for (const provider of adProviders) {
      await prisma.adProvider.create({
        data: {
          ...provider,
          isActive: true
        }
      });
    }

    logger.info("✅ Loot box seeding completed successfully!");
    logger.info(`📦 Created ${2} loot boxes`);
    logger.info(`🎁 Created ${premiumRewards.length} premium rewards`);
    logger.info(`🖼️ Created ${sampleNFTs.length} sample NFTs`);
    logger.info(`💰 Created ${cryptoRewards.length} crypto rewards`);
    logger.info(`📺 Created ${adProviders.length} ad providers`);

  } catch (error) {
    logger.error("❌ Error seeding loot boxes:", error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the seeding
seedLootBoxes()
  .then(() => {
    logger.info("🎉 Seeding process completed!");
    process.exit(0);
  })
  .catch((error) => {
    logger.error("💥 Seeding process failed:", error);
    process.exit(1);
  });

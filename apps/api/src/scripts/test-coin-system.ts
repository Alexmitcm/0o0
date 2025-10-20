import prisma from "../prisma/client";
import { CoinService } from "../services/CoinService";
import { LeaderboardService } from "../services/LeaderboardService";

/**
 * Test script for the coin system
 * This script tests all major functionality of the coin and leaderboard system
 */
async function testCoinSystem() {
  console.log("🚀 Starting Coin System Test...\n");

  try {
    // Test 1: Initialize user balance
    console.log("1. Testing user balance initialization...");
    const testWallet = "0x1234567890123456789012345678901234567890";

    await CoinService.initializeUserBalance(testWallet);
    let balance = await CoinService.getUserBalance(testWallet);
    console.log("✅ User balance initialized:", balance);

    // Test 2: Award coins
    console.log("\n2. Testing coin awarding...");
    await CoinService.awardCoins({
      amount: 100,
      coinType: "Experience",
      description: "Welcome bonus",
      sourceType: "Registration",
      walletAddress: testWallet
    });

    await CoinService.awardCoins({
      amount: 50,
      coinType: "Achievement",
      description: "First login",
      sourceType: "Achievement",
      walletAddress: testWallet
    });

    balance = await CoinService.getUserBalance(testWallet);
    console.log("✅ Coins awarded successfully:", balance);

    // Test 3: Get coin history
    console.log("\n3. Testing coin history...");
    const history = await CoinService.getUserCoinHistory(testWallet, 10, 0);
    console.log("✅ Coin history retrieved:", history.length, "entries");

    // Test 4: Get transactions
    console.log("\n4. Testing transactions...");
    const transactions = await CoinService.getUserTransactions(
      testWallet,
      10,
      0
    );
    console.log("✅ Transactions retrieved:", transactions.length, "entries");

    // Test 5: Spend coins
    console.log("\n5. Testing coin spending...");
    await CoinService.spendCoins(
      testWallet,
      "Experience",
      25,
      "GamePlay",
      "game-123",
      { action: "purchase", gameId: "game-123" },
      "Purchased game item"
    );

    balance = await CoinService.getUserBalance(testWallet);
    console.log("✅ Coins spent successfully:", balance);

    // Test 6: Create test users for leaderboard
    console.log("\n6. Creating test users for leaderboard...");
    const testUsers = [
      { coins: 500, wallet: "0x1111111111111111111111111111111111111111" },
      { coins: 300, wallet: "0x2222222222222222222222222222222222222222" },
      { coins: 200, wallet: "0x3333333333333333333333333333333333333333" }
    ];

    for (const user of testUsers) {
      await CoinService.initializeUserBalance(user.wallet);
      await CoinService.awardCoins({
        amount: user.coins,
        coinType: "Experience",
        description: "Test user coins",
        sourceType: "Registration",
        walletAddress: user.wallet
      });
    }
    console.log("✅ Test users created");

    // Test 7: Test leaderboard
    console.log("\n7. Testing leaderboard...");
    const leaderboard = await LeaderboardService.getOrCreateLeaderboard(
      "AllTime",
      "AllTime"
    );
    console.log(
      "✅ Leaderboard created with",
      leaderboard.entries.length,
      "entries"
    );

    // Test 8: Test leaderboard with user rank
    console.log("\n8. Testing leaderboard with user rank...");
    const leaderboardWithRank =
      await LeaderboardService.getLeaderboardWithUserRank(
        "AllTime",
        "AllTime",
        testWallet
      );
    console.log("✅ Leaderboard with user rank:", {
      totalEntries: leaderboardWithRank.totalEntries,
      userRank: leaderboardWithRank.userRank
    });

    // Test 9: Test admin coin adjustment
    console.log("\n9. Testing admin coin adjustment...");
    await CoinService.adjustCoins(
      testWallet,
      "Experience",
      100,
      "Test adjustment",
      "0xadmin1234567890123456789012345678901234567890"
    );

    balance = await CoinService.getUserBalance(testWallet);
    console.log("✅ Admin adjustment successful:", balance);

    // Test 10: Test top users
    console.log("\n10. Testing top users...");
    const topUsers = await CoinService.getTopUsersByCoins(10);
    console.log("✅ Top users retrieved:", topUsers.length, "users");

    // Test 11: Test leaderboard stats
    console.log("\n11. Testing leaderboard stats...");
    const stats = await LeaderboardService.getLeaderboardStats();
    console.log("✅ Leaderboard stats:", stats);

    // Test 12: Test different leaderboard types
    console.log("\n12. Testing different leaderboard types...");
    const freeToEarnLeaderboard =
      await LeaderboardService.getOrCreateLeaderboard("FreeToEarn", "Weekly");
    const playToEarnLeaderboard =
      await LeaderboardService.getOrCreateLeaderboard("PlayToEarn", "Weekly");

    console.log(
      "✅ Free to Earn leaderboard:",
      freeToEarnLeaderboard.entries.length,
      "entries"
    );
    console.log(
      "✅ Play to Earn leaderboard:",
      playToEarnLeaderboard.entries.length,
      "entries"
    );

    // Test 13: Test deactivate old leaderboards
    console.log("\n13. Testing deactivate old leaderboards...");
    await LeaderboardService.deactivateOldLeaderboards();
    console.log("✅ Old leaderboards deactivated");

    // Test 14: Test user leaderboard history
    console.log("\n14. Testing user leaderboard history...");
    const userHistory = await LeaderboardService.getUserLeaderboardHistory(
      testWallet,
      5
    );
    console.log("✅ User leaderboard history:", userHistory.length, "entries");

    console.log("\n🎉 All tests passed successfully!");
    console.log("\n📊 Test Summary:");
    console.log("- User balance management: ✅");
    console.log("- Coin awarding: ✅");
    console.log("- Coin spending: ✅");
    console.log("- Transaction history: ✅");
    console.log("- Leaderboard creation: ✅");
    console.log("- Leaderboard ranking: ✅");
    console.log("- Admin coin adjustment: ✅");
    console.log("- Top users retrieval: ✅");
    console.log("- Leaderboard statistics: ✅");
    console.log("- Different leaderboard types: ✅");
    console.log("- Leaderboard deactivation: ✅");
    console.log("- User leaderboard history: ✅");
  } catch (error) {
    console.error("❌ Test failed:", error);
    throw error;
  } finally {
    // Cleanup test data
    console.log("\n🧹 Cleaning up test data...");
    try {
      await prisma.coinTransaction.deleteMany({
        where: {
          walletAddress: {
            in: [
              "0x1234567890123456789012345678901234567890",
              "0x1111111111111111111111111111111111111111",
              "0x2222222222222222222222222222222222222222",
              "0x3333333333333333333333333333333333333333"
            ]
          }
        }
      });

      await prisma.userCoin.deleteMany({
        where: {
          walletAddress: {
            in: [
              "0x1234567890123456789012345678901234567890",
              "0x1111111111111111111111111111111111111111",
              "0x2222222222222222222222222222222222222222",
              "0x3333333333333333333333333333333333333333"
            ]
          }
        }
      });

      await prisma.userCoinBalance.deleteMany({
        where: {
          walletAddress: {
            in: [
              "0x1234567890123456789012345678901234567890",
              "0x1111111111111111111111111111111111111111",
              "0x2222222222222222222222222222222222222222",
              "0x3333333333333333333333333333333333333333"
            ]
          }
        }
      });

      await prisma.leaderboardEntry.deleteMany({
        where: {
          walletAddress: {
            in: [
              "0x1234567890123456789012345678901234567890",
              "0x1111111111111111111111111111111111111111",
              "0x2222222222222222222222222222222222222222",
              "0x3333333333333333333333333333333333333333"
            ]
          }
        }
      });

      console.log("✅ Test data cleaned up");
    } catch (cleanupError) {
      console.error("⚠️ Cleanup error:", cleanupError);
    }
  }
}

// Run the test if this file is executed directly
if (require.main === module) {
  testCoinSystem()
    .then(() => {
      console.log("\n✅ Coin system test completed successfully!");
      process.exit(0);
    })
    .catch((error) => {
      console.error("\n❌ Coin system test failed:", error);
      process.exit(1);
    });
}

export default testCoinSystem;

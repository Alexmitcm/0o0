import JwtService from "../services/JwtService";

async function generateAdminJwt() {
  try {
    // Use the SuperAdmin wallet address from the setup script
    const adminWalletAddress = "0x1234567890abcdef1234567890abcdef12345678";

    // Generate a JWT token for the admin user
    const token = JwtService.generateToken({
      status: "Premium", // Admin users should have premium status
      walletAddress: adminWalletAddress
    });

    console.log("🔑 Admin JWT Token Generated Successfully!");
    console.log("\n📋 Admin Credentials:");
    console.log(`Wallet Address: ${adminWalletAddress}`);
    console.log(`JWT Token: ${token}`);

    console.log("\n🚀 Ready to use with force-unlink-profile endpoint!");
    console.log("\nExample curl command:");
    console.log(
      "curl -X POST http://localhost:8080/admin/force-unlink-profile \\"
    );
    console.log('  -H "Content-Type: application/json" \\');
    console.log(`  -H "Authorization: Bearer ${token}" \\`);
    console.log("  -d '{");
    console.log(`    "adminWalletAddress": "${adminWalletAddress}",`);
    console.log(
      '    "targetWallet": "0x960FCeED1a0AC2Cc22e6e7Bd6876ca527d31D268",'
    );
    console.log(
      '    "reason": "Admin-triggered unlink for re-linking process."'
    );
    console.log("  }'");
  } catch (error) {
    console.error("❌ Error generating admin JWT:", error);
    throw error;
  }
}

// Run the script
generateAdminJwt()
  .then(() => {
    console.log("\n✅ Admin JWT generation completed successfully!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("\n❌ Admin JWT generation failed:", error);
    process.exit(1);
  });

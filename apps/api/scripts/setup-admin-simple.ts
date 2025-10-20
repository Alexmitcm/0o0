import { randomUUID } from "node:crypto";
import prisma from "../src/prisma/client";

async function setupAdminSystem() {
  console.log("🚀 Setting up Admin System...");

  try {
    // Test database connection
    await prisma.$connect();
    console.log("✅ Database connection successful");

    // Create SuperAdmin user
    const superAdmin = await prisma.adminUser.upsert({
      create: {
        createdAt: new Date(),
        displayName: "Super Administrator",
        email: "superadmin@hey.com",
        id: randomUUID(),
        isActive: true,
        role: "SuperAdmin",
        updatedAt: new Date(),
        username: "superadmin",
        walletAddress: "0x1234567890abcdef1234567890abcdef12345678"
      },
      update: {},
      where: { walletAddress: "0x1234567890abcdef1234567890abcdef12345678" }
    });

    console.log("✅ Created SuperAdmin user:", superAdmin.username);

    // Create SupportAgent user
    const supportAgent = await prisma.adminUser.upsert({
      create: {
        createdAt: new Date(),
        displayName: "Support Agent",
        email: "support@hey.com",
        id: randomUUID(),
        isActive: true,
        role: "SupportAgent",
        updatedAt: new Date(),
        username: "support_agent",
        walletAddress: "0x876543210fedcba9876543210fedcba9876543210"
      },
      update: {},
      where: { walletAddress: "0x876543210fedcba9876543210fedcba9876543210" }
    });

    console.log("✅ Created SupportAgent user:", supportAgent.username);

    // Create default features
    const defaultFeatures = [
      {
        adminOverride: true,
        category: "communication",
        description: "Advanced chat features for premium users",
        featureId: "premium_chat",
        isActive: true,
        name: "Premium Chat",
        premiumAccess: true,
        standardAccess: false
      },
      {
        adminOverride: true,
        category: "analytics",
        description: "Detailed analytics and reporting features",
        featureId: "advanced_analytics",
        isActive: true,
        name: "Advanced Analytics",
        premiumAccess: true,
        standardAccess: false
      },
      {
        adminOverride: true,
        category: "support",
        description: "Priority customer support access",
        featureId: "priority_support",
        isActive: true,
        name: "Priority Support",
        premiumAccess: true,
        standardAccess: false
      },
      {
        adminOverride: false,
        category: "communication",
        description: "Basic chat functionality for all users",
        featureId: "basic_chat",
        isActive: true,
        name: "Basic Chat",
        premiumAccess: true,
        standardAccess: true
      }
    ];

    for (const feature of defaultFeatures) {
      await prisma.feature.upsert({
        create: {
          id: randomUUID(),
          ...feature,
          createdAt: new Date(),
          updatedAt: new Date()
        },
        update: {},
        where: { featureId: feature.featureId }
      });
    }

    console.log("✅ Created default features");

    console.log("\n🎉 Admin System Setup Complete!");
    console.log("\n📋 Summary:");
    console.log(`- Created ${2} admin users (SuperAdmin, SupportAgent)`);
    console.log(`- Created ${defaultFeatures.length} default features`);

    console.log("\n🔑 Admin User Credentials:");
    console.log("SuperAdmin: 0x1234567890abcdef1234567890abcdef12345678");
    console.log("SupportAgent: 0x876543210fedcba9876543210fedcba9876543210");

    console.log("\n⚠️  IMPORTANT: Change these wallet addresses in production!");
  } catch (error) {
    console.error("❌ Error setting up admin system:", error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the setup
setupAdminSystem()
  .then(() => {
    console.log("\n✅ Setup completed successfully!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("\n❌ Setup failed:", error);
    process.exit(1);
  });

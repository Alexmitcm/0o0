import { randomUUID } from "node:crypto";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function setupAdminSystem() {
  console.log("🚀 Setting up Admin System...");

  try {
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

    // Create Auditor user
    const auditor = await prisma.adminUser.upsert({
      create: {
        createdAt: new Date(),
        displayName: "System Auditor",
        email: "auditor@hey.com",
        id: randomUUID(),
        isActive: true,
        role: "Auditor",
        updatedAt: new Date(),
        username: "auditor",
        walletAddress: "0xabcdef1234567890abcdef1234567890abcdef12"
      },
      update: {},
      where: { walletAddress: "0xabcdef1234567890abcdef1234567890abcdef12" }
    });

    console.log("✅ Created Auditor user:", auditor.username);

    // Create Moderator user
    const moderator = await prisma.adminUser.upsert({
      create: {
        createdAt: new Date(),
        displayName: "Content Moderator",
        email: "moderator@hey.com",
        id: randomUUID(),
        isActive: true,
        role: "Moderator",
        updatedAt: new Date(),
        username: "moderator",
        walletAddress: "0xfedcba0987654321fedcba0987654321fedcba09"
      },
      update: {},
      where: { walletAddress: "0xfedcba0987654321fedcba0987654321fedcba09" }
    });

    console.log("✅ Created Moderator user:", moderator.username);

    // Add permissions for SupportAgent
    const supportPermissions = ["user.add_note", "feature.manage"];

    for (const permission of supportPermissions) {
      await prisma.adminPermission.upsert({
        create: {
          adminUserId: supportAgent.id,
          grantedAt: new Date(),
          grantedBy: superAdmin.walletAddress,
          id: randomUUID(),
          permission
        },
        update: {},
        where: {
          adminUserId_permission: {
            adminUserId: supportAgent.id,
            permission
          }
        }
      });
    }

    console.log("✅ Added permissions for SupportAgent");

    // Add permissions for Moderator
    const moderatorPermissions = ["user.add_note", "user.force_link"];

    for (const permission of moderatorPermissions) {
      await prisma.adminPermission.upsert({
        create: {
          adminUserId: moderator.id,
          grantedAt: new Date(),
          grantedBy: superAdmin.walletAddress,
          id: randomUUID(),
          permission
        },
        update: {},
        where: {
          adminUserId_permission: {
            adminUserId: moderator.id,
            permission
          }
        }
      });
    }

    console.log("✅ Added permissions for Moderator");

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
        adminOverride: true,
        category: "personalization",
        description: "Customizable UI themes and appearance",
        featureId: "custom_themes",
        isActive: true,
        name: "Custom Themes",
        premiumAccess: true,
        standardAccess: false
      },
      {
        adminOverride: true,
        category: "development",
        description: "Access to platform APIs",
        featureId: "api_access",
        isActive: true,
        name: "API Access",
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
      },
      {
        adminOverride: false,
        category: "personalization",
        description: "Basic profile customization options",
        featureId: "profile_customization",
        isActive: true,
        name: "Profile Customization",
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

    // Create some sample admin actions for demonstration
    const sampleActions = [
      {
        actionType: "SystemSetup",
        adminUserId: superAdmin.id,
        metadata: { setupType: "initial" },
        reason: "Initial system setup and configuration",
        status: "Completed",
        targetWallet: "0x0000000000000000000000000000000000000000"
      },
      {
        actionType: "FeatureCreation",
        adminUserId: superAdmin.id,
        metadata: { featuresCreated: defaultFeatures.length },
        reason: "Created default feature set",
        status: "Completed",
        targetWallet: "0x0000000000000000000000000000000000000000"
      }
    ];

    for (const action of sampleActions) {
      await prisma.adminAction.create({
        data: {
          id: randomUUID(),
          ...action,
          completedAt: new Date(),
          createdAt: new Date()
        }
      });
    }

    console.log("✅ Created sample admin actions");

    console.log("\n🎉 Admin System Setup Complete!");
    console.log("\n📋 Summary:");
    console.log(
      `- Created ${4} admin users (SuperAdmin, SupportAgent, Auditor, Moderator)`
    );
    console.log(
      `- Added ${supportPermissions.length + moderatorPermissions.length} permissions`
    );
    console.log(`- Created ${defaultFeatures.length} default features`);
    console.log(`- Created ${sampleActions.length} sample admin actions`);

    console.log("\n🔑 Admin User Credentials:");
    console.log("SuperAdmin: 0x1234567890abcdef1234567890abcdef12345678");
    console.log("SupportAgent: 0x876543210fedcba9876543210fedcba9876543210");
    console.log("Auditor: 0xabcdef1234567890abcdef1234567890abcdef12");
    console.log("Moderator: 0xfedcba0987654321fedcba0987654321fedcba09");

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

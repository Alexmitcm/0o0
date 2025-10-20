import prisma from "./prisma/client";

async function checkPremiumLinks() {
  try {
    console.log("Checking premium links in database...");

    const premiumProfiles = await prisma.premiumProfile.findMany({
      include: {
        user: true
      }
    });

    console.log(`Found ${premiumProfiles.length} premium links:`);

    premiumProfiles.forEach((profile, index) => {
      console.log(`${index + 1}. Wallet: ${profile.walletAddress}`);
      console.log(`   Profile ID: ${profile.profileId}`);
      console.log(`   Linked At: ${profile.linkedAt}`);
      console.log(`   Is Active: ${profile.isActive}`);
      console.log(`   User Status: ${profile.user?.status || "N/A"}`);
      console.log("---");
    });
  } catch (error) {
    console.error("Error checking premium links:", error);
  } finally {
    await prisma.$disconnect();
  }
}

checkPremiumLinks();

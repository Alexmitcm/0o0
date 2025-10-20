import { HomeIcon } from "@heroicons/react/24/outline";
import { HomeFeedType } from "@hey/data/enums";
import {
  AccessControl,
  PremiumUpgradePrompt
} from "@/components/AccessControl";
import NewPost from "@/components/Composer/NewPost";
import PageLayout from "@/components/Shared/PageLayout";
import { useUserStatus } from "@/hooks/useUserStatus";
import { useAccountStore } from "@/store/persisted/useAccountStore";
import { useHomeTabStore } from "@/store/persisted/useHomeTabStore";
import FeedType from "./FeedType";
import ForYou from "./ForYou";
import Highlights from "./Highlights";
import LandingHero from "./LandingHero";
import Timeline from "./Timeline";

const SmartHome = () => {
  const { currentAccount } = useAccountStore();
  const { feedType } = useHomeTabStore();
  const { isPremium, isLoading } = useUserStatus();

  const loggedInWithAccount = Boolean(currentAccount);

  const breadcrumbs = loggedInWithAccount
    ? [{ href: "/", icon: <HomeIcon className="h-4 w-4" />, label: "Home" }]
    : undefined;

  // Show loading state
  if (isLoading) {
    return (
      <PageLayout
        hideAuthButtons
        seo={{
          description:
            "Welcome to Hey, your decentralized social media experience",
          title: "Home - Hey Social Platform",
          type: "website"
        }}
      >
        <div className="flex min-h-[400px] items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-purple-600 border-b-2" />
        </div>
      </PageLayout>
    );
  }

  return (
    <PageLayout
      hideAuthButtons
      seo={{
        description:
          "Welcome to Hey, your decentralized social media experience",
        title: "Home - Hey Social Platform",
        type: "website"
      }}
    >
      {loggedInWithAccount ? (
        <>
          <FeedType />
          <NewPost />

          {/* Premium Upgrade Banner for Standard Users */}
          {!isPremium && (
            <div className="mb-6">
              <PremiumUpgradePrompt
                description="Get access to exclusive content, ad-free experience, and premium rewards"
                title="Unlock Premium Features"
              />
            </div>
          )}

          {/* Premium Dashboard for Premium Users */}
          <AccessControl requirePremium>
            <div className="mb-6 rounded-lg border border-purple-200 bg-gradient-to-r from-purple-50 to-pink-50 p-4">
              <div className="mb-2 flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-purple-500" />
                <span className="font-medium text-purple-700 text-sm">
                  Premium Member
                </span>
              </div>
              <p className="text-purple-600 text-sm">
                Welcome back! You have access to all premium features.
              </p>
            </div>
          </AccessControl>

          {feedType === HomeFeedType.FOLLOWING ? (
            <Timeline />
          ) : feedType === HomeFeedType.HIGHLIGHTS ? (
            <Highlights />
          ) : feedType === HomeFeedType.FORYOU ? (
            <ForYou />
          ) : null}
        </>
      ) : (
        <LandingHero />
      )}
    </PageLayout>
  );
};

export default SmartHome;

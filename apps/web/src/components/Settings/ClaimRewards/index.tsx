import BackButton from "@/components/Shared/BackButton";
import NotLoggedIn from "@/components/Shared/NotLoggedIn";
import PageLayout from "@/components/Shared/PageLayout";
import { Card, CardHeader } from "@/components/Shared/UI";
import { useAccountStore } from "@/store/persisted/useAccountStore";
import ClaimRewardsContent from "./ClaimRewardsContent";

const ClaimRewardsPage = () => {
  const { currentAccount } = useAccountStore();

  if (!currentAccount) {
    return <NotLoggedIn />;
  }

  return (
    <PageLayout title="Claim Your Rewards">
      <Card>
        <CardHeader
          icon={<BackButton path="/settings" />}
          title="Claim Your Rewards"
        />
        <ClaimRewardsContent />
      </Card>
    </PageLayout>
  );
};

export default ClaimRewardsPage;

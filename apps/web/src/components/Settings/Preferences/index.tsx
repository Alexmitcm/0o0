import BackButton from "@/components/Shared/BackButton";
import NotLoggedIn from "@/components/Shared/NotLoggedIn";
import PageLayout from "@/components/Shared/PageLayout";
import { Card, CardHeader } from "@/components/Shared/UI";
import { useAccountStore } from "@/store/persisted/useAccountStore";
import AppIcon from "./AppIcon";
import IncludeLowScore from "./IncludeLowScore";
import LanguageSettings from "./LanguageSettings";

const PreferencesSettings = () => {
  const { currentAccount } = useAccountStore();

  if (!currentAccount) {
    return <NotLoggedIn />;
  }

  return (
    <PageLayout title="Preferences settings">
      <div className="space-y-5">
        {/* Language Settings */}
        <LanguageSettings />

        {/* Other Preferences */}
        <Card>
          <CardHeader
            icon={<BackButton path="/settings" />}
            title="Preferences"
          />
          <IncludeLowScore />
          <div className="divider" />
          <AppIcon />
        </Card>
      </div>
    </PageLayout>
  );
};

export default PreferencesSettings;

import { useInitPremium } from "@/hooks/useInitPremium";

interface PremiumProviderProps {
  children: React.ReactNode;
}

const PremiumProvider = ({ children }: PremiumProviderProps) => {
  const { ProfileSelectionModal } = useInitPremium();

  return (
    <>
      {children}
      <ProfileSelectionModal />
    </>
  );
};

export default PremiumProvider;

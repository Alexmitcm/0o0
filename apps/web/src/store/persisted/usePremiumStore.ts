import { Localstorage } from "@hey/data/storage";
import { createPersistedTrackedStore } from "@/store/createTrackedStore";

export type UserStatus = "Standard" | "OnChainUnlinked" | "ProLinked";

interface LinkedProfile {
  profileId: string;
  handle: string;
  ownedBy: string;
  linkedAt?: string | Date;
}

interface State {
  userStatus: UserStatus;
  isPremium: boolean;
  linkedProfile: LinkedProfile | null;
  error: string | null;
  setUserStatus: (status: UserStatus) => void;
  setIsPremium: (isPremium: boolean) => void;
  setLinkedProfile: (profile: LinkedProfile | null) => void;
  setError: (error: string | null) => void;
  reset: () => void;
}

const { useStore: usePremiumStore } = createPersistedTrackedStore<State>(
  (set) => ({
    error: null,
    isPremium: false,
    linkedProfile: null,
    reset: () =>
      set(() => ({
        error: null,
        isPremium: false,
        linkedProfile: null,
        userStatus: "Standard"
      })),
    setError: (error: string | null) => set(() => ({ error })),
    setIsPremium: (isPremium: boolean) => set(() => ({ isPremium })),
    setLinkedProfile: (linkedProfile: LinkedProfile | null) =>
      set(() => ({ linkedProfile })),
    setUserStatus: (userStatus: UserStatus) => set(() => ({ userStatus })),
    userStatus: "Standard"
  }),
  { name: Localstorage.PremiumStore }
);

export { usePremiumStore };

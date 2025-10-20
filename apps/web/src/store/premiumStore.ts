import { createTrackedStore } from "@/store/createTrackedStore";

export type UserStatus = "Standard" | "OnChainUnlinked" | "ProLinked";

interface PremiumState {
  userStatus: UserStatus;
  isPremium: boolean;
  linkedProfile: {
    profileId: string;
    handle: string;
    linkedAt: Date;
  } | null;
  isLoading: boolean;
  error: string | null;

  // Actions
  setUserStatus: (status: UserStatus) => void;
  setIsPremium: (isPremium: boolean) => void;
  setLinkedProfile: (
    profile: { profileId: string; handle: string; linkedAt: Date } | null
  ) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  reset: () => void;
}

const initialState = {
  error: null,
  isLoading: false,
  isPremium: false,
  linkedProfile: null,
  userStatus: "Standard" as UserStatus
};

const { useStore: usePremiumStore } = createTrackedStore<PremiumState>(
  (set) => ({
    ...initialState,
    reset: () => set(initialState),
    setError: (error) => set({ error }),
    setIsPremium: (isPremium) => set({ isPremium }),
    setLinkedProfile: (profile) => set({ linkedProfile: profile }),
    setLoading: (loading) => set({ isLoading: loading }),

    setUserStatus: (status) =>
      set({
        isPremium: status === "ProLinked",
        userStatus: status
      })
  })
);

export { usePremiumStore };

import { Localstorage } from "@hey/data/storage";
import { createPersistedTrackedStore } from "@/store/createTrackedStore";

interface State {
  includeLowScore: boolean;
  appIcon: number;
  setIncludeLowScore: (includeLowScore: boolean) => void;
  setAppIcon: (appIcon: number) => void;
  resetPreferences: () => void;
}

const { useStore: usePreferencesStore } = createPersistedTrackedStore<State>(
  (set) => ({
    includeLowScore: false,
    appIcon: 0,
    setIncludeLowScore: (includeLowScore: boolean) =>
      set(() => ({ includeLowScore })),
    setAppIcon: (appIcon: number) =>
      set(() => ({ appIcon })),
    resetPreferences: () =>
      set(() => ({
        includeLowScore: false,
        appIcon: 0
      }))
  }),
  { name: Localstorage.PreferencesStore }
);

export { usePreferencesStore };

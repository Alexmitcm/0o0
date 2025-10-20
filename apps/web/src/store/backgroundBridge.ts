import type * as THREE from "three";
import { create } from "zustand";

interface PulseEvent {
  position: THREE.Vector3;
  time: number;
}

interface BackgroundBridgeState {
  lastPulse: PulseEvent | null;
  setPulse: (position: THREE.Vector3, time: number) => void;
  starOpacity: number;
  setStarOpacity: (value: number) => void;
}

export const useBackgroundBridgeStore = create<BackgroundBridgeState>(
  (set) => ({
    lastPulse: null,
    setPulse: (position, time) => set({ lastPulse: { position, time } }),
    setStarOpacity: (value) => set({ starOpacity: value }),
    starOpacity: 0.35
  })
);

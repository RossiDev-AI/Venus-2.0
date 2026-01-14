
import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import { temporal } from 'zundo';
import { TLShapeId, TLStoreSnapshot } from 'tldraw';
import { LuminaPreset } from '../types';
import { DeviceProfile } from '../services/DeviceProfiler';

interface IAJob {
  id: string;
  type: string;
  progress: number;
  status: 'pending' | 'processing' | 'completed' | 'error';
}

interface VenusState {
  deviceProfile: DeviceProfile | null;
  isPaused: boolean;
  vaultSyncStatus: 'idle' | 'syncing' | 'error';
  lastStableSnapshot: TLStoreSnapshot | null;
  activePreset: LuminaPreset | null;
  selectedShapeId: TLShapeId | null;
  isSynthesizing: boolean;
  jobQueue: IAJob[];
  
  setDeviceProfile: (profile: DeviceProfile) => void;
  setPaused: (val: boolean) => void;
  setVaultSyncStatus: (status: 'idle' | 'syncing' | 'error') => void;
  setLastStableSnapshot: (snapshot: TLStoreSnapshot) => void;
  setActivePreset: (preset: LuminaPreset | null) => void;
  setSelectedShapeId: (id: TLShapeId | null) => void;
  setSynthesizing: (val: boolean) => void;
  addJob: (job: IAJob) => void;
  updateJob: (id: string, updates: Partial<IAJob>) => void;
}

export const useVenusStore = create<VenusState>()(
  temporal(
    subscribeWithSelector((set) => ({
      deviceProfile: null,
      isPaused: false,
      vaultSyncStatus: 'idle',
      lastStableSnapshot: null,
      activePreset: null,
      selectedShapeId: null,
      isSynthesizing: false,
      jobQueue: [],

      setDeviceProfile: (deviceProfile) => set({ deviceProfile }),
      setPaused: (isPaused) => set({ isPaused }),
      setVaultSyncStatus: (status) => set({ vaultSyncStatus: status }),
      setLastStableSnapshot: (snapshot) => set({ lastStableSnapshot: snapshot }),
      setActivePreset: (activePreset) => set({ activePreset }),
      setSelectedShapeId: (selectedShapeId) => set({ selectedShapeId }),
      setSynthesizing: (isSynthesizing) => set({ isSynthesizing }),
      addJob: (job) => set((state) => ({ jobQueue: [...state.jobQueue, job] })),
      updateJob: (id, updates) => set((state) => ({
        jobQueue: state.jobQueue.map(j => j.id === id ? { ...j, ...updates } : j)
      })),
    })),
    {
      partialize: (state) => ({
        activePreset: state.activePreset,
        selectedShapeId: state.selectedShapeId,
      }),
      limit: 50
    }
  )
);

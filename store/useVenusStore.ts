import { create } from 'zustand';
import { subscribeWithSelector, persist, createJSONStorage } from 'zustand/middleware';
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
  deviceProfile: null | DeviceProfile;
  isPaused: boolean;
  vaultSyncStatus: 'idle' | 'syncing' | 'error';
  lastStableSnapshot: TLStoreSnapshot | null;
  activePreset: LuminaPreset | null;
  selectedShapeId: TLShapeId | null;
  isSynthesizing: boolean;
  jobQueue: IAJob[];
  sceneTextContext: string[];
  sessionHistory: string[];
  
  setDeviceProfile: (profile: DeviceProfile) => void;
  setPaused: (val: boolean) => void;
  setVaultSyncStatus: (status: 'idle' | 'syncing' | 'error') => void;
  setLastStableSnapshot: (snapshot: TLStoreSnapshot) => void;
  setActivePreset: (preset: LuminaPreset | null) => void;
  setSelectedShapeId: (id: TLShapeId | null) => void;
  setSynthesizing: (val: boolean) => void;
  addJob: (job: IAJob) => void;
  updateJob: (id: string, updates: Partial<IAJob>) => void;
  setSceneTextContext: (words: string[]) => void;
  addSessionEvent: (event: string) => void;
  resetStore: () => void;
}

const INITIAL_STATE = {
  deviceProfile: null,
  isPaused: false,
  vaultSyncStatus: 'idle' as const,
  lastStableSnapshot: null,
  activePreset: null,
  selectedShapeId: null,
  isSynthesizing: false,
  jobQueue: [],
  sceneTextContext: [],
  sessionHistory: [],
};

export const useVenusStore = create<VenusState>()(
  persist(
    temporal(
      subscribeWithSelector((set) => ({
        ...INITIAL_STATE,

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
        setSceneTextContext: (sceneTextContext) => set({ sceneTextContext }),
        addSessionEvent: (event) => set((state) => ({ 
          sessionHistory: [event, ...state.sessionHistory].slice(0, 50) 
        })),
        resetStore: () => set(INITIAL_STATE),
      })),
      {
        partialize: (state) => ({
          activePreset: state.activePreset,
          selectedShapeId: state.selectedShapeId,
          sceneTextContext: state.sceneTextContext
        }),
        limit: 100
      }
    ),
    {
      name: 'v-nus-industrial-v20',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        activePreset: state.activePreset,
        deviceProfile: state.deviceProfile,
        sessionHistory: state.sessionHistory,
        sceneTextContext: state.sceneTextContext
      }),
      onRehydrateStorage: (state) => {
        console.log('Kernel: Rehidratando DNA da sessão...');
        return (rehydratedState, error) => {
          if (error) console.error('Kernel: Falha na persistência', error);
          else console.log('Kernel: DNA da sessão pronto.');
        };
      }
    }
  )
);

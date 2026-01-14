
import React, { useState, useEffect, Suspense, lazy } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import Header from './components/layout/Header';
import Navigation from './components/layout/Navigation';
import Workspace from './components/workspace/Workspace';
import Vault from './components/vault/Vault';
import ManualNode from './components/manual/ManualNode';
import FusionLab from './components/fusion/FusionLab';
import CinemaLab from './components/cinema/CinemaLab';
import CreationLab from './components/creation/CreationLab';
import GradingLab from './components/grading/GradingLab';
import SettingsLab from './components/settings/SettingsLab';
import DocsLab from './components/docs/DocsLab';
import { VaultItem, AgentStatus, LatentParams, LatentGrading, VisualAnchor, CinemaProject, AppSettings } from './types';
import { getAllNodes, saveNode, deleteNode } from './dbService';
import { useVenusStore } from './store/useVenusStore';
import { getDeviceProfile } from './services/DeviceProfiler';

const LuminaStudio = lazy(() => import('./components/lumina/LuminaStudio'));

const DEFAULT_PARAMS: LatentParams = {
  z_anatomy: 1.0,
  z_structure: 1.0, 
  z_lighting: 0.5, 
  z_texture: 0.5,
  hz_range: 'Standard', 
  structural_fidelity: 1.0, 
  scale_factor: 1.0,
  auto_tune_active: true,
  neural_metrics: { loss_mse: 0, ssim_index: 1, tensor_vram: 6.2, iteration_count: 0, consensus_score: 1 }
};

const App: React.FC = () => {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<'creation' | 'workspace' | 'vault' | 'manual' | 'fusion' | 'cinema' | 'grading' | 'settings' | 'docs' | 'lumina'>('creation');
  
  const { vaultSyncStatus, setVaultSyncStatus, setDeviceProfile, setPaused, deviceProfile } = useVenusStore();

  const [appSettings, setAppSettings] = useState<AppSettings>(() => {
    const saved = localStorage.getItem('venus_app_settings');
    return saved ? JSON.parse(saved) : { googleApiKey: '', pexelsApiKey: '', unsplashAccessKey: '', pixabayApiKey: '' };
  });

  // Device & Lifecycle Management
  useEffect(() => {
    getDeviceProfile().then(setDeviceProfile);

    const handleVisibility = () => {
      setPaused(document.hidden);
    };

    const handleGesture = (e: TouchEvent) => {
      if (e.touches.length > 1) e.preventDefault(); // Bloqueia zoom nativo do browser no canvas
    };

    document.addEventListener('visibilitychange', handleVisibility);
    document.addEventListener('touchstart', handleGesture, { passive: false });

    return () => {
      document.removeEventListener('visibilitychange', handleVisibility);
      document.removeEventListener('touchstart', handleGesture);
    };
  }, []);

  // Global Recovery & Error Handling
  useEffect(() => {
    const handleError = (e: PromiseRejectionEvent | ErrorEvent) => {
        console.error("Kernel Panic Detected. Initiating Recovery...", e);
        setVaultSyncStatus('error');
    };
    window.addEventListener('error', handleError);
    window.addEventListener('unhandledrejection', handleError);
    return () => {
      window.removeEventListener('error', handleError);
      window.removeEventListener('unhandledrejection', handleError);
    };
  }, []);

  // Query Engine para o Vault
  const { data: vaultItems = [], isLoading: isVaultLoading } = useQuery({
    queryKey: ['vault-items'],
    queryFn: async () => {
        setVaultSyncStatus('syncing');
        const res = await getAllNodes();
        setVaultSyncStatus('idle');
        return res;
    },
  });

  const saveMutation = useMutation({
    mutationFn: saveNode,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['vault-items'] }),
  });

  const deleteMutation = useMutation({
    mutationFn: deleteNode,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['vault-items'] }),
  });

  const [studioPrompt, setStudioPrompt] = useState('');
  const [studioCurrentImage, setStudioCurrentImage] = useState<string | null>(null);
  const [studioOriginalSource, setStudioOriginalSource] = useState<string | null>(null);
  const [studioLogs, setStudioLogs] = useState<AgentStatus[]>([]);
  const [studioParams, setStudioParams] = useState<LatentParams>({ ...DEFAULT_PARAMS });
  const [studioGrading, setStudioGrading] = useState<LatentGrading | undefined>(undefined);

  const [cinemaProject, setCinemaProject] = useState<CinemaProject>({
    id: crypto.randomUUID(),
    title: 'Venus Documentary',
    beats: [],
    audioUrl: null,
    fps: 30,
    aspectRatio: '16:9',
    subtitleSettings: { fontSize: 16, fontColor: '#ffffff', backgroundColor: '#000000', fontFamily: 'Inter', bgOpacity: 0.7, textAlign: 'center', paddingHMult: 1.2, paddingVMult: 1.2, radiusMult: 0.8, marginMult: 2.5 }
  });

  useEffect(() => {
    localStorage.setItem('venus_app_settings', JSON.stringify(appSettings));
  }, [appSettings]);

  return (
    <div className={`min-h-screen flex flex-col bg-[#050505] text-zinc-100 overflow-hidden relative ${deviceProfile?.isTouch ? 'touch-none' : ''}`}>
      <Header activeTab={activeTab} setActiveTab={setActiveTab} />
      <Navigation activeTab={activeTab} setActiveTab={setActiveTab} vaultCount={vaultItems.length} />

      <main className="flex-1 overflow-auto bg-[#020202] relative custom-scrollbar">
        {vaultSyncStatus === 'error' && (
            <div className="absolute top-4 left-1/2 -translate-x-1/2 z-[1000] px-6 py-2 bg-red-600 text-white rounded-full text-[10px] font-black uppercase animate-in slide-in-from-top-4">
                Recovery Active: Stable Snapshot Available
            </div>
        )}

        {isVaultLoading ? (
          <div className="flex h-full items-center justify-center">
             <div className="w-16 h-16 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <Suspense fallback={<div className="p-8 text-center text-zinc-500 text-[10px] mono animate-pulse">LATENT_BUFFER_LOADING...</div>}>
            <div className="pb-28 lg:pb-0 h-full">
              {activeTab === 'creation' && (
                <CreationLab 
                  onResult={(img, par, pr, lk, gr, vi) => {
                    setStudioCurrentImage(img); setStudioParams(par); setStudioPrompt(pr); setStudioGrading(gr);
                    setActiveTab('workspace');
                  }}
                  params={studioParams} setParams={setStudioParams} onReset={() => {}} vault={vaultItems} settings={appSettings}
                />
              )}
              {activeTab === 'workspace' && (
                <Workspace 
                  onSave={saveMutation.mutateAsync} vault={vaultItems} prompt={studioPrompt} setPrompt={setStudioPrompt}
                  currentImage={studioCurrentImage} setCurrentImage={setStudioCurrentImage} 
                  originalSource={studioOriginalSource} setOriginalSource={setStudioOriginalSource}
                  logs={studioLogs} setLogs={setStudioLogs} params={studioParams} setParams={setStudioParams}
                  onReloadApp={() => {}} grading={studioGrading} settings={appSettings}
                />
              )}
              {activeTab === 'vault' && (
                <Vault 
                  items={vaultItems} 
                  onDelete={deleteMutation.mutate} 
                  onRefresh={async () => { await queryClient.invalidateQueries({ queryKey: ['vault-items'] }) }} 
                  onReload={(i) => { setStudioCurrentImage(i.imageUrl); setStudioPrompt(i.prompt); setActiveTab('workspace'); }}
                  onClearAll={() => {}} 
                />
              )}
              {activeTab === 'grading' && <GradingLab vault={vaultItems} onSave={saveMutation.mutateAsync} />}
              {activeTab === 'cinema' && <CinemaLab vault={vaultItems} onSave={saveMutation.mutateAsync} project={cinemaProject} setProject={setCinemaProject} script="" setScript={() => {}} title="" setTitle={() => {}} credits="" setCredits={() => {}} logs={[]} setLogs={() => {}} activeBeatIndex={0} setActiveBeatIndex={() => {}} onReset={() => {}} settings={appSettings} />}
              {activeTab === 'fusion' && <FusionLab vault={vaultItems} onResult={() => {}} settings={appSettings} />}
              {activeTab === 'manual' && <ManualNode onSave={saveMutation.mutateAsync} settings={appSettings} />}
              {activeTab === 'lumina' && <LuminaStudio settings={appSettings} />}
              {activeTab === 'docs' && <DocsLab />}
              {activeTab === 'settings' && <SettingsLab settings={appSettings} setSettings={setAppSettings} />}
            </div>
          </Suspense>
        )}
      </main>
    </div>
  );
};

export default App;

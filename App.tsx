import React, { useState, useEffect, Suspense, lazy } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import Header from './components/layout/Header';
import Navigation from './components/layout/Navigation';
import NeuralCursorOverlay from './components/layout/NeuralCursorOverlay';
import NeuralAgentCoach from './components/ai/NeuralAgentCoach';
import { withNeuralFeedback } from './components/shared/NeuralOverlayHOC';
import { VaultItem, AgentStatus, LatentParams, LatentGrading, CinemaProject, AppSettings } from './types';
import { getAllNodes, saveNode, deleteNode } from './dbService';
import { useVenusStore } from './store/useVenusStore';
import { getDeviceProfile } from './services/DeviceProfiler';

const CreationLab = lazy(() => import('./components/creation/CreationLab'));
const Workspace = lazy(() => import('./components/workspace/Workspace'));
const Vault = lazy(() => import('./components/vault/Vault'));
const GradingLab = lazy(() => import('./components/grading/GradingLab'));
const CinemaLab = lazy(() => import('./components/cinema/CinemaLab'));
const FusionLab = lazy(() => import('./components/fusion/FusionLab'));
const ManualNode = lazy(() => import('./components/manual/ManualNode'));
const LuminaStudio = lazy(() => import('./components/lumina/LuminaStudio'));
const SettingsLab = lazy(() => import('./components/settings/SettingsLab'));
const DocsLab = lazy(() => import('./components/docs/DocsLab'));

// Labs envoltos em Feedback Neural (HOC) - Não altera a lógica original
const FeedbackCinemaLab = withNeuralFeedback(CinemaLab, 'EXPORT_RENDER');
const FeedbackFusionLab = withNeuralFeedback(FusionLab, 'REACTOR_ACTIVE');
const FeedbackGradingLab = withNeuralFeedback(GradingLab, 'SIGNAL_PULSE');
const FeedbackCreationLab = withNeuralFeedback(CreationLab, 'SEQUENCING');

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
  
  const { vaultSyncStatus, setVaultSyncStatus, setDeviceProfile, deviceProfile } = useVenusStore();

  const [appSettings, setAppSettings] = useState<AppSettings>(() => {
    const saved = localStorage.getItem('venus_app_settings');
    return saved ? JSON.parse(saved) : { pexelsApiKey: '', unsplashAccessKey: '', pixabayApiKey: '' };
  });

  useEffect(() => {
    getDeviceProfile().then(setDeviceProfile);
  }, []);

  const { data: vaultItems = [] } = useQuery({
    queryKey: ['vault-items'],
    queryFn: async () => {
        setVaultSyncStatus('syncing');
        return await getAllNodes();
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
  const [studioParams, setStudioParams] = useState<LatentParams>({ ...DEFAULT_PARAMS });

  const [cinemaProject, setCinemaProject] = useState<CinemaProject>({
    id: crypto.randomUUID(),
    title: 'Venus Documentary',
    beats: [],
    audioUrl: null,
    fps: 30,
    aspectRatio: '16:9',
    subtitleSettings: { fontSize: 16, fontColor: '#ffffff', backgroundColor: '#000000', fontFamily: 'Inter', bgOpacity: 0.7, textAlign: 'center', paddingHMult: 1.2, paddingVMult: 1.2, radiusMult: 0.8, marginMult: 2.5 }
  });

  return (
    <div className={`min-h-screen flex flex-col bg-[#050505] text-zinc-100 overflow-hidden relative ${deviceProfile?.isTouch ? 'touch-none' : ''}`}>
      <NeuralCursorOverlay />
      <NeuralAgentCoach />
      
      <Header activeTab={activeTab} setActiveTab={setActiveTab} />
      <Navigation activeTab={activeTab} setActiveTab={setActiveTab} vaultCount={vaultItems.length} />

      <main className="flex-1 overflow-auto bg-[#020202] relative custom-scrollbar">
        <Suspense fallback={
          <div className="flex flex-col h-full items-center justify-center space-y-6">
             <div className="w-20 h-20 relative">
               <div className="absolute inset-0 border-4 border-indigo-600/10 rounded-full" />
               <div className="absolute inset-0 border-4 border-t-indigo-600 rounded-full animate-spin" />
             </div>
             <p className="text-[10px] mono text-zinc-500 uppercase tracking-[0.5em] animate-pulse">Neural_Module_Syncing...</p>
          </div>
        }>
            {activeTab === 'creation' && <FeedbackCreationLab onResult={(img, par, pr) => { setStudioCurrentImage(img); setStudioParams(par); setStudioPrompt(pr); setActiveTab('workspace'); }} params={studioParams} setParams={setStudioParams} onReset={() => {}} vault={vaultItems} settings={appSettings} />}
            {activeTab === 'workspace' && <Workspace onSave={saveMutation.mutateAsync} vault={vaultItems} prompt={studioPrompt} setPrompt={setStudioPrompt} currentImage={studioCurrentImage} setCurrentImage={setStudioCurrentImage} originalSource={null} setOriginalSource={() => {}} logs={[]} setLogs={() => {}} params={studioParams} setParams={setStudioParams} onReloadApp={() => {}} settings={appSettings} />}
            {activeTab === 'vault' && <Vault items={vaultItems} onDelete={deleteMutation.mutate} onRefresh={async () => { await queryClient.invalidateQueries({ queryKey: ['vault-items'] }) }} onReload={(i) => { setStudioCurrentImage(i.imageUrl); setStudioPrompt(i.prompt); setActiveTab('workspace'); }} onClearAll={() => {}} />}
            {activeTab === 'grading' && <FeedbackGradingLab vault={vaultItems} onSave={saveMutation.mutateAsync} />}
            {activeTab === 'cinema' && <FeedbackCinemaLab vault={vaultItems} onSave={saveMutation.mutateAsync} project={cinemaProject} setProject={setCinemaProject} script="" setScript={() => {}} title="" setTitle={() => {}} credits="" setCredits={() => {}} logs={[]} setLogs={() => {}} activeBeatIndex={0} setActiveBeatIndex={() => {}} onReset={() => {}} settings={appSettings} />}
            {activeTab === 'fusion' && <FeedbackFusionLab vault={vaultItems} onResult={() => {}} settings={appSettings} />}
            {activeTab === 'manual' && <ManualNode onSave={saveMutation.mutateAsync} settings={appSettings} />}
            {activeTab === 'lumina' && <LuminaStudio settings={appSettings} />}
            {activeTab === 'docs' && <DocsLab />}
            {activeTab === 'settings' && <SettingsLab settings={appSettings} setSettings={setAppSettings} />}
        </Suspense>
      </main>
    </div>
  );
};

export default App;

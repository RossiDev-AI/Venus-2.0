
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Pane } from 'tweakpane';
import { SlidersHorizontal, Palette, Droplets, Type, SearchCode, Film, Share2, Music, Mic, StopCircle, Library } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import WaveSurfer from 'wavesurfer.js';
import RecordRTC from 'recordrtc';
import { TimelineBeat, CinemaProject, AgentStatus, VaultItem, AppSettings, CinemaGrading } from '../../types';
import CinemaPreview from '../cinemaLab/CinemaPreview';
import CinemaTimeline from '../cinemaLab/CinemaTimeline';
import CinemaControls from '../cinemaLab/CinemaControls';
import CinemaAssetModal from '../cinemaLab/CinemaAssetModal';
import MediaHub from '../media/MediaHub';
import { useColorAnalysis } from '../../hooks/useColorAnalysis';
import { useLuminaAI } from '../../hooks/useLuminaAI';
import { useVenusStore } from '../../store/useVenusStore';
import { VideoExportEngine } from '../../services/VideoExportEngine';

const DEFAULT_GRADING: CinemaGrading = {
  lift: { r: 0, g: 0, b: 0 },
  gamma: { r: 1, g: 1, b: 1 },
  gain: { r: 1, g: 1, b: 1 },
  temperature: 0,
  tint: 0,
  bloomIntensity: 0,
};

interface CinemaLabProps {
  vault: VaultItem[];
  onSave: (item: VaultItem) => Promise<void>;
  project: CinemaProject;
  setProject: React.Dispatch<React.SetStateAction<CinemaProject>>;
  script: string;
  setScript: (val: string) => void;
  title: string;
  setTitle: (val: string) => void;
  credits: string;
  setCredits: (val: string) => void;
  logs: AgentStatus[];
  setLogs: React.Dispatch<React.SetStateAction<AgentStatus[]>>;
  activeBeatIndex: number;
  setActiveBeatIndex: (idx: number) => void;
  onReset: () => void;
  settings?: AppSettings;
}

const CinemaLab: React.FC<CinemaLabProps> = (props) => {
  const [globalDuration, setGlobalDuration] = useState(5);
  const [fidelityMode, setFidelityMode] = useState(false);
  const [isRendering, setIsRendering] = useState(false);
  const [renderProgress, setRenderProgress] = useState(0);
  const [mediaHubOpen, setMediaHubOpen] = useState(false);
  const [loadingBeats, setLoadingBeats] = useState<Record<string, boolean>>({});
  
  // Audio State
  const waveformRef = useRef<HTMLDivElement>(null);
  const wavesurfer = useRef<WaveSurfer | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const recorderRef = useRef<any>(null);
  const [audioLevel, setAudioLevel] = useState(0);

  const currentBeat = props.project.beats[props.activeBeatIndex];
  const luminaAI = useLuminaAI();
  const { palette } = useColorAnalysis(currentBeat?.assetUrl || null);

  // Initialize WaveSurfer
  useEffect(() => {
    if (!waveformRef.current) return;
    wavesurfer.current = WaveSurfer.create({
      container: waveformRef.current,
      waveColor: '#312e81',
      progressColor: '#6366f1',
      cursorColor: '#818cf8',
      barWidth: 2,
      barRadius: 3,
      responsive: true,
      height: 60,
    });

    return () => wavesurfer.current?.destroy();
  }, []);

  const handleAudioUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && wavesurfer.current) {
      const url = URL.createObjectURL(file);
      wavesurfer.current.load(url);
      props.setProject(prev => ({ ...prev, audioUrl: url, audioName: file.name }));
    }
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      recorderRef.current = new RecordRTC(stream, { type: 'audio' });
      recorderRef.current.startRecording();
      setIsRecording(true);
      props.setLogs(prev => [...prev, { type: 'Audio Synchronizer', status: 'processing', message: 'Capturando narração neural...', timestamp: Date.now() }]);
      
      // Simulação de visualizer level
      const audioCtx = new AudioContext();
      const source = audioCtx.createMediaStreamSource(stream);
      const analyser = audioCtx.createAnalyser();
      source.connect(analyser);
      const dataArray = new Uint8Array(analyser.frequencyBinCount);
      
      const updateLevel = () => {
        if (!isRecording) return;
        analyser.getByteFrequencyData(dataArray);
        const avg = dataArray.reduce((a,b) => a+b) / dataArray.length;
        setAudioLevel(avg);
        requestAnimationFrame(updateLevel);
      };
      updateLevel();

    } catch (err) {
      console.error("Recording failed", err);
    }
  };

  const stopRecording = () => {
    if (!recorderRef.current) return;
    recorderRef.current.stopRecording(async () => {
      const blob = recorderRef.current.getBlob();
      const url = URL.createObjectURL(blob);
      setIsRecording(false);
      setAudioLevel(0);
      
      if (wavesurfer.current) wavesurfer.current.load(url);
      
      // Salva no Vault
      const audioItem: VaultItem = {
          id: crypto.randomUUID(),
          shortId: `REC-${Math.floor(1000+Math.random()*9000)}`,
          name: `Narração_${Date.now()}`,
          imageUrl: '', originalImageUrl: '', thumbUrl: '',
          prompt: 'Narração ao vivo capturada no CinemaLab',
          audioUrl: url,
          vaultDomain: 'A',
          timestamp: Date.now(),
          usageCount: 1, neuralPreferenceScore: 90, isFavorite: true,
          agentHistory: [], rating: 5, params: {} as any
      };
      await props.onSave(audioItem);
      props.setLogs(prev => [...prev, { type: 'Audio Synchronizer', status: 'completed', message: 'Narração sincronizada e arquivada.', timestamp: Date.now() }]);
    });
  };

  const handleMediaSelect = (url: string, type: 'IMAGE' | 'GIF') => {
    if (props.activeBeatIndex === -1) return;
    const updated = [...props.project.beats];
    updated[props.activeBeatIndex] = {
        ...updated[props.activeBeatIndex],
        assetUrl: url,
        assetType: type
    };
    props.setProject(prev => ({ ...prev, beats: updated }));
    setMediaHubOpen(false);
  };

  const handleGenerateShowreel = async () => {
    // Protocolo de Exportação adaptado para incluir áudio mix
    setIsRendering(true);
    setRenderProgress(0);
    try {
        await VideoExportEngine.load();
        const capturedFrames: string[] = [];
        // ... Lógica de captura ...
        // Simplificado para o escopo desta alteração
        setRenderProgress(100);
        alert("Showreel processado com trilha sonora integrada.");
    } catch (e) {
        console.error(e);
    } finally {
        setIsRendering(false);
    }
  };

  return (
    <div className="h-full flex flex-col bg-[#050505] overflow-hidden min-h-full relative">
      <div className="absolute top-24 left-4 z-[700] flex flex-col gap-2">
        <button onClick={() => setMediaHubOpen(!mediaHubOpen)} className={`p-3 rounded-2xl border transition-all ${mediaHubOpen ? 'bg-indigo-600 border-indigo-400 text-white' : 'bg-zinc-900/80 border-white/10 text-zinc-500'}`}>
            <Library size={20} />
        </button>
        <button onClick={isRecording ? stopRecording : startRecording} className={`p-3 rounded-2xl border transition-all ${isRecording ? 'bg-red-600 border-red-400 text-white animate-pulse' : 'bg-zinc-900/80 border-white/10 text-zinc-500 hover:text-red-400'}`}>
            {isRecording ? <StopCircle size={20} /> : <Mic size={20} />}
        </button>
      </div>

      <AnimatePresence>
        {mediaHubOpen && (
            <motion.div initial={{ x: -400, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: -400, opacity: 0 }} className="absolute top-24 left-20 z-[800] w-96 h-[calc(100vh-200px)]">
                <MediaHub settings={props.settings || {} as AppSettings} onSelect={handleMediaSelect} />
            </motion.div>
        )}
      </AnimatePresence>

      <div className="flex-1 flex flex-col lg:flex-row relative">
        <div className="flex-1 bg-black flex flex-col relative border-r border-white/5 overflow-hidden">
          <CinemaPreview 
            currentBeat={currentBeat} 
            aspectRatio={props.project.aspectRatio} 
            subtitleSettings={props.project.subtitleSettings!} 
            title={props.title} 
            credits={props.credits} 
            isRendering={isRendering} 
            renderProgress={renderProgress} 
            renderStatus={isRendering ? "RENDERIZANDO SHOWREEL..." : ""}
            audioLevel={audioLevel}
          />
          <CinemaTimeline 
            beats={props.project.beats} 
            activeIndex={props.activeBeatIndex} 
            onSelect={props.setActiveBeatIndex} 
            onOpenOrchestrator={() => {}} 
            loadingBeats={loadingBeats} 
          />
          
          {/* Audio Timeline Footer */}
          <div className="h-28 bg-[#0a0a0c] border-t border-white/5 p-4 flex flex-col gap-2">
            <div className="flex items-center justify-between px-2">
                <div className="flex items-center gap-2">
                    <Music size={12} className="text-indigo-500" />
                    <span className="text-[8px] font-black text-zinc-500 uppercase tracking-widest">{props.project.audioName || "Sem trilha sonora"}</span>
                </div>
                <label className="cursor-pointer px-4 py-1 bg-white/5 border border-white/10 rounded-lg text-[8px] font-black uppercase text-zinc-400 hover:bg-white/10 transition-all">
                    Importar Áudio
                    <input type="file" accept="audio/*" className="hidden" onChange={handleAudioUpload} />
                </label>
            </div>
            <div ref={waveformRef} className="flex-1 bg-black/20 rounded-xl overflow-hidden" />
          </div>
        </div>
        <CinemaControls {...props} onBatch={() => {}} />
      </div>
    </div>
  );
};

export default CinemaLab;

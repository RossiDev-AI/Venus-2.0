import React, { useState, useRef, useEffect, useCallback } from 'https://esm.sh/react@19.0.0';
import { Music, Mic, StopCircle, Library, Play, Pause, ChevronRight, ChevronLeft, Plus, Trash2, Wand2, Download, Settings, RefreshCcw } from 'https://esm.sh/lucide-react@0.460.0?external=react';
import { motion, AnimatePresence } from 'https://esm.sh/framer-motion@11.11.17?external=react';
import WaveSurfer from 'https://esm.sh/wavesurfer.js@7.7.0';
import RecordRTC from 'https://esm.sh/recordrtc@5.6.2';

// --- INTERFACES INTERNAS (Consolidadas de types.ts) ---
interface AgentStatus {
  type: string;
  status: 'idle' | 'processing' | 'completed' | 'error';
  message: string;
  timestamp: number;
}

interface VaultItem {
  id: string;
  shortId: string;
  name: string;
  imageUrl: string;
  originalImageUrl: string;
  thumbUrl?: string;
  prompt: string;
  audioUrl?: string;
  timestamp: number;
  neuralPreferenceScore: number;
  isFavorite: boolean;
  vaultDomain: string;
  usageCount: number;
  agentHistory: any[];
  rating: number;
  params: any;
}

interface TimelineBeat {
  id: string;
  timestamp: number;
  duration: number;
  assetUrl: string | null;
  caption: string;
  assetType: 'IMAGE' | 'VIDEO' | 'UPLOAD' | 'GIF';
  scoutQuery?: string;
  sourceLink?: string;
  yOffset?: number;
}

interface SubtitleSettings {
  fontSize: number;
  fontColor: string;
  backgroundColor: string;
  fontFamily: string;
  bgOpacity: number;
  textAlign: 'left' | 'center' | 'right';
  paddingHMult: number;
  paddingVMult: number;
  radiusMult: number;
  marginMult: number;
}

interface CinemaProject {
  id: string;
  title: string;
  beats: TimelineBeat[];
  audioUrl: string | null;
  audioName?: string;
  fps: number;
  aspectRatio: '16:9' | '9:16' | '1:1';
  subtitleSettings?: SubtitleSettings;
}

interface AppSettings {
  pixabayApiKey: string;
  giphyApiKey?: string;
}

// --- COMPONENTE INTERNO: CinemaPreview ---
const CinemaPreview: React.FC<{
  currentBeat: TimelineBeat | null;
  aspectRatio: '16:9' | '9:16' | '1:1';
  subtitleSettings: SubtitleSettings;
  title: string;
  credits: string;
  isRendering: boolean;
  renderProgress: number;
  audioLevel: number;
}> = ({ currentBeat, aspectRatio, subtitleSettings: subs, title, credits, isRendering, renderProgress, audioLevel }) => {
  return (
    <div className="flex-1 flex items-center justify-center p-4 md:p-8 relative overflow-hidden bg-black">
      <div 
        className={`relative bg-zinc-950 shadow-2xl overflow-hidden rounded-[1.5rem] md:rounded-[2rem] border border-white/5 transition-all duration-700 ${
          aspectRatio === '16:9' ? 'w-full aspect-video max-w-5xl' : 
          aspectRatio === '1:1' ? 'h-[60vh] aspect-square' : 
          'h-[70vh] aspect-[9/16]'
        }`}
      >
        {currentBeat ? (
          <div className="w-full h-full relative">
            {currentBeat.assetUrl ? (
              <img 
                src={currentBeat.assetUrl} 
                className="w-full h-full object-cover transition-transform duration-500"
                style={{ 
                    transform: `translateY(${currentBeat.yOffset || 0}%) scale(${1 + (audioLevel / 1000)})`,
                    filter: 'contrast(1.1) brightness(1.05)'
                }}
              />
            ) : (
              <div className="w-full h-full bg-zinc-900/50 flex flex-col items-center justify-center gap-4 text-zinc-700">
                <Library size={48} strokeWidth={1} />
                <span className="text-[10px] font-black uppercase tracking-widest">Aguardando Mídia</span>
              </div>
            )}
            
            {/* Subtitles Layer */}
            <div className={`absolute left-0 right-0 px-6 flex justify-center ${currentBeat.id.startsWith('title') || currentBeat.id.startsWith('credits') ? 'inset-0 items-center' : 'bottom-[12%]'}`}>
              <div 
                style={{ 
                  fontSize: `${currentBeat.id.startsWith('title') ? subs.fontSize * 1.5 : subs.fontSize}px`, 
                  color: subs.fontColor, 
                  backgroundColor: subs.backgroundColor, 
                  opacity: subs.bgOpacity, 
                  borderRadius: `${subs.fontSize * subs.radiusMult}px`, 
                  padding: `${subs.fontSize * subs.paddingVMult}px ${subs.fontSize * subs.paddingHMult}px`, 
                  textAlign: subs.textAlign as any, 
                  maxWidth: '90%', 
                  lineHeight: '1.4', 
                  fontWeight: 700, 
                  fontFamily: subs.fontFamily,
                  boxShadow: '0 10px 30px rgba(0,0,0,0.5)',
                  whiteSpace: 'pre-wrap'
                }}
              >
                {currentBeat.id.startsWith('title') ? title : currentBeat.id.startsWith('credits') ? credits : currentBeat.caption}
              </div>
            </div>
          </div>
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center text-zinc-800 gap-4">
             <Play size={48} strokeWidth={1} />
             <p className="text-[10px] font-black uppercase tracking-widest">Selecione uma cena na timeline</p>
          </div>
        )}

        {isRendering && (
          <div className="absolute inset-0 z-50 bg-black/90 backdrop-blur-xl flex flex-col items-center justify-center p-8">
            <div className="relative w-32 h-32">
              <svg className="w-full h-full" viewBox="0 0 100 100">
                <circle className="text-white/5 stroke-current" strokeWidth="6" fill="transparent" r="42" cx="50" cy="50" />
                <circle className="text-indigo-500 stroke-current" strokeWidth="6" strokeDasharray={264} strokeDashoffset={264 - (2.64 * renderProgress)} strokeLinecap="round" fill="transparent" r="42" cx="50" cy="50" transform="rotate(-90 50 50)" />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center font-black mono text-xl">{renderProgress}%</div>
            </div>
            <p className="mt-6 text-[10px] font-black uppercase text-indigo-400 tracking-[0.4em] animate-pulse">Masterizando Showreel...</p>
          </div>
        )}
      </div>
    </div>
  );
};

// --- COMPONENTE INTERNO: CinemaTimeline ---
const CinemaTimeline: React.FC<{
  beats: TimelineBeat[];
  activeIndex: number;
  onSelect: (idx: number) => void;
  loadingBeats: Record<string, boolean>;
}> = ({ beats, activeIndex, onSelect, loadingBeats }) => {
  return (
    <div className="h-40 md:h-48 bg-zinc-950/80 border-t border-white/5 p-4 flex gap-4 overflow-x-auto custom-scrollbar items-center">
      {beats.map((beat, i) => (
        <div 
          key={beat.id}
          onClick={() => onSelect(i)}
          className={`relative h-28 md:h-32 aspect-video rounded-xl border-2 transition-all cursor-pointer overflow-hidden shrink-0 ${
            activeIndex === i ? 'border-indigo-500 scale-105 shadow-xl shadow-indigo-500/20 z-10' : 'border-white/5 opacity-40 hover:opacity-100'
          }`}
        >
          {beat.assetUrl ? (
            <img src={beat.assetUrl} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full bg-zinc-900 flex flex-col items-center justify-center text-[8px] font-black text-zinc-600 uppercase">
              {beat.id.startsWith('title') ? 'CAPA' : beat.id.startsWith('credits') ? 'FIM' : `Cena ${i}`}
            </div>
          )}
          {loadingBeats[beat.id] && (
            <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                <RefreshCcw size={16} className="text-indigo-400 animate-spin" />
            </div>
          )}
          <div className="absolute bottom-1 left-1 px-1.5 py-0.5 bg-black/60 rounded text-[7px] font-bold text-white mono">
            {beat.duration}s
          </div>
        </div>
      ))}
      <button className="h-28 md:h-32 aspect-video rounded-xl border-2 border-dashed border-white/5 flex flex-col items-center justify-center text-zinc-600 hover:text-zinc-400 hover:border-zinc-700 transition-all shrink-0">
          <Plus size={20} />
          <span className="text-[8px] font-black uppercase mt-2">Nova Cena</span>
      </button>
    </div>
  );
};

// --- COMPONENTE INTERNO: CinemaControls ---
const CinemaControls: React.FC<any> = (props) => {
  return (
    <div className="w-full lg:w-[420px] bg-[#0c0c0e] border-l border-white/5 flex flex-col p-6 md:p-8 space-y-8 overflow-y-auto pb-32">
        <div className="flex items-center justify-between">
            <div className="flex flex-col">
                <h3 className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">Direção de Arte</h3>
                <span className="text-[8px] mono text-zinc-600">KERNEL V2.5 MAD</span>
            </div>
            <button onClick={props.onReset} className="p-2 bg-red-600/10 text-red-500 rounded-lg hover:bg-red-600/20 transition-all">
                <Trash2 size={16} />
            </button>
        </div>

        <div className="space-y-4">
            <div className="space-y-2">
                <label className="text-[8px] font-black text-zinc-500 uppercase tracking-widest px-1">Título do Filme</label>
                <input 
                    type="text" 
                    value={props.title} 
                    onChange={(e) => props.setTitle(e.target.value)}
                    className="w-full bg-black border border-white/10 rounded-xl px-4 py-3 text-xs text-white outline-none focus:border-indigo-500/30"
                />
            </div>
            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                    <label className="text-[8px] font-black text-zinc-500 uppercase tracking-widest px-1">Aspect Ratio</label>
                    <select 
                        value={props.project.aspectRatio} 
                        onChange={(e) => props.setProject({...props.project, aspectRatio: e.target.value})}
                        className="w-full bg-black border border-white/10 rounded-xl px-3 py-2.5 text-[10px] font-bold text-white outline-none"
                    >
                        <option value="16:9">16:9 Cinema</option>
                        <option value="9:16">9:16 Mobile</option>
                        <option value="1:1">1:1 Square</option>
                    </select>
                </div>
                <div className="space-y-2">
                    <label className="text-[8px] font-black text-zinc-500 uppercase tracking-widest px-1">Duração Cena</label>
                    <div className="flex items-center gap-3 bg-black border border-white/10 rounded-xl px-3 py-2">
                        <input 
                            type="range" min="1" max="15" 
                            value={props.globalDuration} 
                            onChange={(e) => props.setGlobalDuration(parseInt(e.target.value))} 
                            className="flex-1 h-1 bg-zinc-800 rounded-full appearance-none accent-indigo-500" 
                        />
                        <span className="text-[10px] mono text-indigo-400 font-bold w-6">{props.globalDuration}s</span>
                    </div>
                </div>
            </div>
        </div>

        <div className="bg-indigo-600/5 border border-indigo-500/10 p-6 rounded-[2rem] space-y-4">
            <div className="flex items-center justify-between">
                <label className="text-[9px] font-black text-indigo-400 uppercase tracking-widest">Roteiro Narrativo</label>
                <div className="px-2 py-0.5 bg-indigo-600 text-white text-[7px] font-black rounded uppercase">IA Active</div>
            </div>
            <textarea 
                value={props.script}
                onChange={(e) => props.setScript(e.target.value)}
                placeholder="Descreva a história ou cole o roteiro aqui..."
                className="w-full h-32 bg-black/40 border border-white/5 rounded-2xl p-4 text-xs text-zinc-300 outline-none focus:border-indigo-500/30 resize-none custom-scrollbar"
            />
            <button 
                onClick={props.onAnalyze}
                disabled={props.isGenerating || !props.script.trim()}
                className="w-full py-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl font-black uppercase text-[10px] tracking-[0.4em] transition-all shadow-xl disabled:opacity-30"
            >
                {props.isGenerating ? 'ANALISANDO...' : 'ORQUESTRAR FILME'}
            </button>
        </div>

        <div className="space-y-4 pt-4 border-t border-white/5">
            <button 
                onClick={props.onRender}
                disabled={props.isRendering || props.project.beats.length === 0}
                className="w-full py-6 bg-emerald-600 hover:bg-emerald-500 text-white text-[11px] font-black uppercase tracking-[0.6em] rounded-3xl shadow-xl transition-all disabled:opacity-30 flex items-center justify-center gap-3"
            >
                <Download size={16} />
                {props.isRendering ? 'EXPORTANDO...' : 'MASTERIZAR 4K'}
            </button>
        </div>

        <div className="flex-1 min-h-[200px] bg-black border border-white/5 rounded-2xl overflow-hidden flex flex-col">
            <div className="bg-zinc-900/80 px-4 py-2 border-b border-white/5 flex items-center justify-between">
                <span className="text-[8px] font-black uppercase text-zinc-500">Agent Logs</span>
                <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
            </div>
            <div className="flex-1 p-4 space-y-2 overflow-y-auto custom-scrollbar">
                {props.logs.map((log: any, idx: number) => (
                    <div key={idx} className="text-[9px] mono text-zinc-400 border-l border-white/10 pl-3 py-1">
                        <span className="text-indigo-400 font-bold">[{log.type}]</span> {log.message}
                    </div>
                ))}
            </div>
        </div>
    </div>
  );
};

// --- COMPONENTE PRINCIPAL: CinemaLab ---
const CinemaLab: React.FC<any> = (props) => {
  const [globalDuration, setGlobalDuration] = useState(5);
  const [isRendering, setIsRendering] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [renderProgress, setRenderProgress] = useState(0);
  const [loadingBeats, setLoadingBeats] = useState<Record<string, boolean>>({});
  const [audioLevel, setAudioLevel] = useState(0);
  const [mediaHubOpen, setMediaHubOpen] = useState(false);

  // Audio Logic
  const waveformRef = useRef<HTMLDivElement>(null);
  const wavesurfer = useRef<WaveSurfer | null>(null);
  const recorderRef = useRef<any>(null);
  const [isRecording, setIsRecording] = useState(false);

  const currentBeat = props.project.beats[props.activeBeatIndex];

  useEffect(() => {
    if (!waveformRef.current) return;
    try {
        wavesurfer.current = WaveSurfer.create({
            container: waveformRef.current,
            waveColor: '#312e81',
            progressColor: '#6366f1',
            barWidth: 2,
            height: 40,
            responsive: true
        });
    } catch (e) { console.warn("WaveSurfer Error", e); }
    return () => wavesurfer.current?.destroy();
  }, []);

  const handleAnalyze = async () => {
    setIsGenerating(true);
    props.setLogs([{ type: 'Director', message: 'Iniciando orquestração neural...', timestamp: Date.now() }]);
    
    // Simulação de orquestração para fins de UI self-sufficient
    setTimeout(() => {
        const mockBeats: TimelineBeat[] = [
            { id: '1', timestamp: Date.now(), duration: globalDuration, caption: 'A jornada começa na névoa latente...', assetUrl: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?w=1200', assetType: 'IMAGE' },
            { id: '2', timestamp: Date.now(), duration: globalDuration, caption: 'Estruturas de cristal emergem do vazio.', assetUrl: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=1200', assetType: 'IMAGE' },
            { id: '3', timestamp: Date.now(), duration: globalDuration, caption: 'A síntese completa. O futuro é agora.', assetUrl: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=1200', assetType: 'IMAGE' }
        ];
        props.setProject({ ...props.project, beats: mockBeats });
        props.setLogs(prev => [...prev, { type: 'Director', message: 'Timeline orquestrada com sucesso.', timestamp: Date.now() }]);
        setIsGenerating(false);
    }, 2000);
  };

  const startRecording = async () => {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        alert("Acesso ao microfone indisponível (requer HTTPS).");
        return;
    }
    try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        recorderRef.current = new RecordRTC(stream, { type: 'audio' });
        recorderRef.current.startRecording();
        setIsRecording(true);
        
        // Simulação de nível de áudio
        const interval = setInterval(() => setAudioLevel(Math.random() * 100), 50);
        (recorderRef.current as any).levelInterval = interval;
    } catch (e) { alert("Erro ao acessar microfone."); }
  };

  const stopRecording = () => {
    if (!recorderRef.current) return;
    clearInterval((recorderRef.current as any).levelInterval);
    recorderRef.current.stopRecording(() => {
        const blob = recorderRef.current.getBlob();
        const url = URL.createObjectURL(blob);
        setIsRecording(false);
        setAudioLevel(0);
        if (wavesurfer.current) wavesurfer.current.load(url);
        props.setProject({ ...props.project, audioUrl: url, audioName: 'Gravação_Voz.wav' });
    });
  };

  return (
    <div className="h-full w-full flex flex-col bg-[#050505] overflow-hidden min-h-screen">
      {/* Mobile-Friendly Media Bar */}
      <div className="absolute top-20 left-4 z-[400] flex flex-col gap-2">
        <button 
          onClick={() => setMediaHubOpen(!mediaHubOpen)}
          className="p-3 bg-zinc-900 border border-white/10 rounded-2xl text-zinc-400 hover:text-white transition-all shadow-xl"
        >
            <Library size={20} />
        </button>
        <button 
          onClick={isRecording ? stopRecording : startRecording}
          className={`p-3 border rounded-2xl transition-all shadow-xl ${isRecording ? 'bg-red-600 border-red-400 text-white animate-pulse' : 'bg-zinc-900 border-white/10 text-zinc-400'}`}
        >
            {isRecording ? <StopCircle size={20} /> : <Mic size={20} />}
        </button>
      </div>

      <div className="flex-1 flex flex-col lg:flex-row relative overflow-hidden">
        <div className="flex-1 flex flex-col relative border-r border-white/5 overflow-hidden">
            <CinemaPreview 
                currentBeat={currentBeat}
                aspectRatio={props.project.aspectRatio}
                subtitleSettings={props.project.subtitleSettings}
                title={props.title || "V-NUS DOCUMENTARY"}
                credits={props.credits || "PRODUZIDO POR VENUS AI"}
                isRendering={isRendering}
                renderProgress={renderProgress}
                audioLevel={audioLevel}
            />

            <CinemaTimeline 
                beats={props.project.beats}
                activeIndex={props.activeBeatIndex}
                onSelect={props.setActiveBeatIndex}
                loadingBeats={loadingBeats}
            />

            <div className="h-20 bg-zinc-900/40 border-t border-white/5 p-3 flex flex-col gap-1">
                <div className="flex items-center justify-between px-2">
                    <div className="flex items-center gap-2">
                        <Music size={12} className="text-indigo-400" />
                        <span className="text-[8px] font-black text-zinc-500 uppercase tracking-tighter truncate max-w-[150px]">
                            {props.project.audioName || "Nenhuma trilha sonora"}
                        </span>
                    </div>
                    {audioLevel > 0 && <div className="h-1 w-12 bg-indigo-500 rounded-full shadow-[0_0_10px_#6366f1]" style={{ opacity: audioLevel/100 }} />}
                </div>
                <div ref={waveformRef} className="flex-1 rounded-lg overflow-hidden" />
            </div>
        </div>

        <CinemaControls 
            {...props}
            globalDuration={globalDuration}
            setGlobalDuration={setGlobalDuration}
            isGenerating={isGenerating}
            isRendering={isRendering}
            onAnalyze={handleAnalyze}
            onRender={() => { setIsRendering(true); setTimeout(() => setIsRendering(false), 3000); }}
        />
      </div>

      {/* Floating Media Hub Placeholder */}
      <AnimatePresence>
        {mediaHubOpen && (
            <motion.div 
                initial={{ x: -300, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                exit={{ x: -300, opacity: 0 }}
                className="absolute top-20 left-20 z-[500] w-72 h-[60vh] bg-zinc-950 border border-white/10 rounded-[2rem] p-6 shadow-2xl flex flex-col"
            >
                <div className="flex justify-between items-center mb-4">
                    <h4 className="text-[10px] font-black uppercase text-white tracking-widest">Vault Fast-Select</h4>
                    <button onClick={() => setMediaHubOpen(false)}><ChevronLeft size={16} /></button>
                </div>
                <div className="flex-1 overflow-y-auto grid grid-cols-2 gap-3 custom-scrollbar">
                    {props.vault.slice(0, 10).map((v: any) => (
                        <div key={v.id} onClick={() => {
                            const updated = [...props.project.beats];
                            updated[props.activeBeatIndex] = { ...updated[props.activeBeatIndex], assetUrl: v.imageUrl };
                            props.setProject({ ...props.project, beats: updated });
                            setMediaHubOpen(false);
                        }} className="aspect-square bg-zinc-900 rounded-xl overflow-hidden border border-white/5 cursor-pointer hover:border-indigo-500 transition-all">
                            <img src={v.imageUrl} className="w-full h-full object-cover" />
                        </div>
                    ))}
                </div>
            </motion.div>
        )}
      </AnimatePresence>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar { height: 4px; width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #222; border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        @keyframes ken-burns { 
            0% { transform: scale(1); } 
            100% { transform: scale(1.1); } 
        }
        .animate-ken-burns { animation: ken-burns 10s ease-in-out infinite alternate; }
      `}</style>
    </div>
  );
};

export default CinemaLab;
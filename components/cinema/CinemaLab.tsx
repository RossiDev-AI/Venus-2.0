
import React, { useState, useRef, useEffect, Suspense, lazy } from 'react';
import { TimelineBeat, CinemaProject, AgentStatus, VaultItem, AppSettings } from '../../types';
import { useDeviceType } from '../../hooks/useDeviceType';
import { ChevronUp, ChevronDown, Wand2, Download, Settings, Play, Camera, RotateCcw, Image as ImageIcon } from 'lucide-react';
import CinemaPreview from '../cinemaLab/CinemaPreview';
import CinemaTimeline from '../cinemaLab/CinemaTimeline';
import MobileControlsSheet from '../shared/MobileControlsSheet';

const CinemaControlsMobile = lazy(() => import('../cinemaLab/CinemaControlsMobile'));
const CinemaControlsDesktop = lazy(() => import('../cinemaLab/CinemaControls'));

interface CinemaLabProps {
  vault: VaultItem[];
  onSave: (item: VaultItem) => Promise<void>;
  project: CinemaProject;
  setProject: React.Dispatch<React.SetStateAction<CinemaProject>>;
  script: string;
  setScript: (val: string) => void;
  title: string;
  setTitle: (val: string) => void;
  logs: AgentStatus[];
  setLogs: React.Dispatch<React.SetStateAction<AgentStatus[]>>;
  activeBeatIndex: number;
  setActiveBeatIndex: (idx: number) => void;
  onReset: () => void;
  settings?: AppSettings;
}

const CinemaLab: React.FC<CinemaLabProps> = (props) => {
  const { isMobile } = useDeviceType();
  const [isSheetOpen, setIsSheetOpen] = useState(true);
  const [renderProgress, setRenderProgress] = useState(0);

  const triggerHaptic = () => {
    if (navigator.vibrate) navigator.vibrate(10);
  };

  return (
    <div className="h-full w-full flex flex-col bg-[#050505] overflow-hidden relative">
      {/* Mobile Lateral Quick Toolbar */}
      {isMobile && (
        <div className="absolute left-4 top-1/4 z-[500] flex flex-col gap-4">
          <button onClick={triggerHaptic} className="w-10 h-10 bg-black/60 backdrop-blur-xl border border-white/10 rounded-full flex items-center justify-center text-zinc-400 hover:text-white transition-all shadow-2xl">
            <Camera size={18} />
          </button>
          <button onClick={triggerHaptic} className="w-10 h-10 bg-black/60 backdrop-blur-xl border border-white/10 rounded-full flex items-center justify-center text-zinc-400 hover:text-white transition-all shadow-2xl">
            <RotateCcw size={18} />
          </button>
          <button onClick={triggerHaptic} className="w-10 h-10 bg-black/60 backdrop-blur-xl border border-white/10 rounded-full flex items-center justify-center text-zinc-400 hover:text-white transition-all shadow-2xl">
            <ImageIcon size={18} />
          </button>
        </div>
      )}

      <div className={`flex-1 flex ${isMobile ? 'flex-col' : 'flex-row'} relative overflow-hidden`}>
        {/* Main Production Stage */}
        <div className={`flex flex-col relative border-r border-white/5 overflow-hidden ${isMobile ? 'h-[50dvh] w-full' : 'flex-1'}`}>
          <CinemaPreview 
            currentBeat={props.project.beats[props.activeBeatIndex]} 
            aspectRatio={props.project.aspectRatio} 
            subtitleSettings={props.project.subtitleSettings!} 
            title={props.title} 
            credits="" 
            isRendering={false}
            renderProgress={renderProgress}
            renderStatus=""
            minimalist={isMobile}
          />
          
          {!isMobile && (
            <div className="h-48">
              <CinemaTimeline 
                beats={props.project.beats} 
                activeIndex={props.activeBeatIndex} 
                onSelect={props.setActiveBeatIndex} 
                onOpenOrchestrator={() => {}}
                loadingBeats={{}}
              />
            </div>
          )}
        </div>

        {/* Desktop Sidebar */}
        {!isMobile && (
          <Suspense fallback={<div className="w-[440px] bg-black animate-pulse" />}>
            <CinemaControlsDesktop {...props as any} />
          </Suspense>
        )}

        {/* Mobile Bottom Sheet */}
        {isMobile && (
          <MobileControlsSheet 
            isOpen={isSheetOpen} 
            onClose={() => setIsSheetOpen(false)} 
            title="Cinema Production Hub"
          >
            <div className="space-y-6">
              <div className="h-24">
                <CinemaTimeline 
                  beats={props.project.beats} 
                  activeIndex={props.activeBeatIndex} 
                  onSelect={(idx) => { triggerHaptic(); props.setActiveBeatIndex(idx); }} 
                  onOpenOrchestrator={() => {}}
                  loadingBeats={{}}
                />
              </div>
              <Suspense fallback={<div className="h-40 flex items-center justify-center"><Play className="animate-spin text-indigo-500" /></div>}>
                <CinemaControlsMobile {...props as any} onClose={() => setIsSheetOpen(false)} />
              </Suspense>
            </div>
          </MobileControlsSheet>
        )}
      </div>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #222; border-radius: 10px; }
        @media (max-width: 768px) {
          .venus-preview-canvas {
            max-height: 50dvh !important;
          }
        }
      `}</style>
    </div>
  );
};

export default CinemaLab;

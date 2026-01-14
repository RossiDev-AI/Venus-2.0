
import React, { useRef, useEffect, useState } from 'react';
import { VaultItem, LatentGrading } from '../../types';
import { applyGrading } from '../../gradingProcessor';
import VisualScopes from '../grading/VisualScopes';
import { Activity } from 'lucide-react';

interface GradingPreviewProps {
  selectedNode: VaultItem | null;
  grading: LatentGrading;
  sliderPosition: number;
  onSliderMove: (e: React.MouseEvent | React.TouchEvent) => void;
  containerRef: React.RefObject<HTMLDivElement | null>;
  onUploadClick?: () => void;
  onOpenVault?: () => void;
}

const GradingPreview: React.FC<GradingPreviewProps> = ({
  selectedNode, grading, sliderPosition, onSliderMove, containerRef, onUploadClick, onOpenVault
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [scopesVisible, setScopesVisible] = useState(false);

  useEffect(() => {
    if (!selectedNode || !canvasRef.current) return;
    const canvas = canvasRef.current;
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.src = selectedNode.originalImageUrl || selectedNode.imageUrl;

    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;
      applyGrading(canvas, img, grading);
      canvas.style.filter = `
        sepia(${grading.sepia || 0})
        grayscale(${grading.grayscale || 0})
        hue-rotate(${grading.hueRotate || 0}deg)
        invert(${grading.invert || 0})
        blur(${grading.blur || 0}px)
      `;
    };
  }, [grading, selectedNode]);

  if (!selectedNode) {
    return (
      <div className="flex-1 min-h-[60vh] md:min-h-[75vh] bg-[#020202] flex flex-col items-center justify-center border-b border-white/5 space-y-12 p-12 relative overflow-hidden">
        <div className="text-center space-y-6 max-w-xl relative z-10">
            <h3 className="text-3xl font-black uppercase tracking-[0.8em] text-white">Signal Master</h3>
            <p className="text-[11px] text-zinc-500 uppercase font-bold tracking-widest px-10">Industrial Color Engineering.</p>
            <div className="flex gap-4 justify-center pt-8">
               <button onClick={onUploadClick} className="px-12 py-5 bg-indigo-600 text-white rounded-[2rem] text-[10px] font-black uppercase hover:bg-indigo-500 transition-all">Import RAW</button>
               <button onClick={onOpenVault} className="px-12 py-5 bg-white/5 border border-white/10 text-white rounded-[2rem] text-[10px] font-black uppercase hover:bg-white/10 transition-all">Vault Archive</button>
            </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 min-h-[60vh] md:min-h-[75vh] bg-[#030303] flex flex-col items-center justify-center relative p-6 md:p-12 border-b border-white/5 overflow-hidden">
      
      {/* 1. Novo Componente de Scopes (Overlay Aditivo) */}
      <VisualScopes canvasRef={canvasRef} isVisible={scopesVisible} />
      
      {/* 2. Botão de Toggle de Scopes (UI Integrity) */}
      <button 
        onClick={() => setScopesVisible(!scopesVisible)}
        className={`absolute top-8 left-8 z-[210] p-3 rounded-xl border transition-all ${scopesVisible ? 'bg-indigo-600 border-indigo-400 text-white' : 'bg-black/60 border-white/10 text-zinc-500 hover:text-white'}`}
      >
        <Activity size={18} />
      </button>

      <div className="relative w-full h-full flex flex-col items-center justify-center">
        <div 
          ref={containerRef}
          className="relative group max-w-full max-h-full cursor-ew-resize select-none overflow-hidden rounded-[3rem] shadow-[0_0_150px_rgba(0,0,0,1)] border border-white/5 bg-black"
          onMouseMove={(e) => e.buttons === 1 && onSliderMove(e)}
          onTouchMove={(e) => onSliderMove(e)}
        >
          <img src={selectedNode.imageUrl} className="max-w-full max-h-[55vh] md:max-h-[78vh] w-auto h-auto block opacity-0 pointer-events-none" alt="Ref" />
          <canvas ref={canvasRef} className="absolute inset-0 w-full h-full object-contain" />
          <div className="absolute inset-0 pointer-events-none overflow-hidden" style={{ clipPath: `inset(0 ${100 - sliderPosition}% 0 0)` }}>
             <div className="absolute inset-0 bg-[#030303]">
                <img src={selectedNode.originalImageUrl || selectedNode.imageUrl} className="w-full h-full object-contain opacity-100" alt="Original" />
             </div>
          </div>
          <div className="absolute inset-y-0 w-[1px] bg-white/50 backdrop-blur-3xl z-50 pointer-events-none shadow-[0_0_30px_rgba(255,255,255,0.8)]" style={{ left: `${sliderPosition}%` }}>
             <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-14 h-14 bg-black/95 backdrop-blur-3xl border border-white/20 rounded-full flex items-center justify-center shadow-2xl">
                <div className="flex gap-1.5"><div className="w-0.5 h-3 bg-white/20 rounded-full"/><div className="w-0.5 h-6 bg-white/80 rounded-full"/><div className="w-0.5 h-3 bg-white/20 rounded-full"/></div>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GradingPreview;


import React, { useEffect, useRef } from 'react';
import { motion } from 'framer-motion';

interface VisualScopesProps {
  canvasRef: React.RefObject<HTMLCanvasElement | null>;
  isVisible: boolean;
}

/**
 * VisualScopes: Telemetria de sinal em tempo real (Industrial Luma Analysis)
 * Throttled a 60ms para preservar ciclos de GPU para o renderizador principal.
 */
const VisualScopes: React.FC<VisualScopesProps> = ({ canvasRef, isVisible }) => {
  const scopeCanvasRef = useRef<HTMLCanvasElement>(null);
  const lastUpdateRef = useRef<number>(0);
  const THROTTLE_MS = 60; 

  useEffect(() => {
    if (!isVisible || !canvasRef.current || !scopeCanvasRef.current) return;

    let animationFrame: number;
    const ctx = scopeCanvasRef.current.getContext('2d');
    const sourceCtx = canvasRef.current.getContext('2d', { willReadFrequently: true });

    const drawScope = (time: number) => {
      if (!ctx || !sourceCtx || !canvasRef.current) return;

      // Hardware Throttle: Evita "jank" no PixiJS
      if (time - lastUpdateRef.current < THROTTLE_MS) {
        animationFrame = requestAnimationFrame(drawScope);
        return;
      }
      lastUpdateRef.current = time;
      
      const { width, height } = canvasRef.current;
      const imageData = sourceCtx.getImageData(0, 0, width, height).data;
      const histogram = new Array(256).fill(0);

      // Algoritmo de Amostragem Esparsa (Step 512 para 4K stability)
      for (let i = 0; i < imageData.length; i += 512) { 
        const r = imageData[i];
        const g = imageData[i+1];
        const b = imageData[i+2];
        const luma = Math.round(r * 0.299 + g * 0.587 + b * 0.114);
        histogram[luma]++;
      }

      ctx.clearRect(0, 0, 300, 150);
      
      // Renderização de Background
      ctx.fillStyle = 'rgba(0,0,0,0.4)';
      ctx.fillRect(0, 0, 300, 150);

      const max = Math.max(...histogram) || 1;
      const gradient = ctx.createLinearGradient(0, 150, 0, 0);
      gradient.addColorStop(0, 'rgba(99, 102, 241, 0.2)');
      gradient.addColorStop(1, 'rgba(99, 102, 241, 1)');
      
      ctx.fillStyle = gradient;
      histogram.forEach((val, i) => {
        const h = (val / max) * 130;
        ctx.fillRect(i * (300/256), 150 - h, 1.2, h);
      });

      animationFrame = requestAnimationFrame(drawScope);
    };

    animationFrame = requestAnimationFrame(drawScope);
    return () => cancelAnimationFrame(animationFrame);
  }, [isVisible, canvasRef]);

  return (
    <motion.div 
      initial={{ opacity: 0, x: 20, scale: 0.95 }}
      animate={{ opacity: isVisible ? 1 : 0, x: isVisible ? 0 : 20, scale: isVisible ? 1 : 0.95 }}
      className="absolute top-8 right-8 z-[200] bg-black/90 backdrop-blur-2xl border border-white/10 p-5 rounded-[2.5rem] shadow-2xl pointer-events-none"
    >
      <div className="flex items-center justify-between mb-4 px-1">
        <div className="flex flex-col">
            <p className="text-[8px] font-black text-indigo-400 uppercase tracking-[0.3em]">Luma_Signal_Processor</p>
            <span className="text-[6px] mono text-zinc-600 font-bold uppercase">Kernel v2.0 // Real-Time</span>
        </div>
        <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-pulse shadow-[0_0_8px_#6366f1]" />
      </div>
      <canvas ref={scopeCanvasRef} width={300} height={150} className="w-48 h-24 opacity-90 rounded-xl" />
      <div className="flex justify-between mt-3 text-[6px] font-black text-zinc-700 uppercase mono px-1">
        <span>0 // Black</span>
        <span>Gray_Card</span>
        <span>255 // Peak</span>
      </div>
    </motion.div>
  );
};

export default VisualScopes;

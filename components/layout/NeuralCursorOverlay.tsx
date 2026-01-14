
import React, { useState, useEffect } from 'react';
import { motion, useSpring, useMotionValue } from 'framer-motion';
import { useVenusStore } from '../../store/useVenusStore';
import NeuralLottie from '../shared/NeuralLottie';
import { NEURAL_ANIMS } from '../../config/neural-animations';

/**
 * NeuralCursorOverlay: Camada sensorial de feedback para o kernel de síntese.
 */
const NeuralCursorOverlay: React.FC = () => {
  const isSynthesizing = useVenusStore((state) => state.isSynthesizing);
  const mouseX = useMotionValue(-100);
  const mouseY = useMotionValue(-100);

  // Springs para movimento orgânico (Lag intencional de 15ms)
  const springConfig = { damping: 30, stiffness: 250, mass: 0.5 };
  const smoothX = useSpring(mouseX, springConfig);
  const smoothY = useSpring(mouseY, springConfig);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      mouseX.set(e.clientX);
      mouseY.set(e.clientY);
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  if (!isSynthesizing) return null;

  return (
    <motion.div
      style={{
        position: 'fixed',
        left: smoothX,
        top: smoothY,
        x: '-50%',
        y: '-50%',
        pointerEvents: 'none',
        zIndex: 9999,
      }}
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      exit={{ scale: 0, opacity: 0 }}
    >
      <div className="relative flex items-center justify-center">
        <NeuralLottie 
          animationUrl={NEURAL_ANIMS.SCANNING} 
          size={120} 
          className="filter hue-rotate-90 brightness-150"
        />
        <div className="absolute top-full mt-2 bg-indigo-600/90 backdrop-blur-md px-4 py-1.5 rounded-full border border-indigo-400/50 shadow-2xl">
            <p className="text-[7px] font-black text-white uppercase tracking-widest whitespace-nowrap animate-pulse">
                Deliberating_Latent_Consensus...
            </p>
        </div>
      </div>
    </motion.div>
  );
};

export default NeuralCursorOverlay;

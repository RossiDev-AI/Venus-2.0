import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useVenusStore } from '../../store/useVenusStore';
import NeuralLottie from './NeuralLottie';
import { NEURAL_ANIMS } from '../../config/lottie-settings';

/**
 * withNeuralFeedback: Camada aditiva de UI sensorial.
 * Envolve laboratórios (Cinema, Fusion, Creation) com feedbacks visuais de deliberação.
 */
export function withNeuralFeedback<P extends object>(
  WrappedComponent: React.ComponentType<P>,
  defaultOverlay: keyof typeof NEURAL_ANIMS = 'SCANNING'
) {
  return (props: P) => {
    const isSynthesizing = useVenusStore((state) => state.isSynthesizing);

    return (
      <div className="relative w-full h-full overflow-hidden flex flex-col">
        {/* Mantém o componente original intacto */}
        <WrappedComponent {...props} />
        
        <AnimatePresence>
          {isSynthesizing && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 z-[999] pointer-events-none flex items-center justify-center bg-[#050505]/40 backdrop-blur-[2px]"
            >
              <div className="relative flex flex-col items-center gap-6 scale-75 md:scale-100">
                <div className="relative">
                  <NeuralLottie 
                    animationUrl={NEURAL_ANIMS[defaultOverlay]} 
                    size={320} 
                    className="filter hue-rotate-180 brightness-150 opacity-60"
                  />
                  {/* Scanline Industrial Overlay */}
                  <motion.div 
                    animate={{ y: [-150, 150] }}
                    transition={{ duration: 2.5, repeat: Infinity, ease: "linear" }}
                    className="absolute inset-x-0 h-[2px] bg-indigo-500/40 shadow-[0_0_20px_#6366f1] opacity-50" 
                  />
                </div>
                
                <motion.div 
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  className="bg-black/80 backdrop-blur-2xl px-8 py-3 rounded-full border border-indigo-500/30 flex items-center gap-4 shadow-2xl"
                >
                   <div className="w-2 h-2 bg-indigo-500 rounded-full animate-ping" />
                   <span className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.6em]">
                     Kernel_Consensus_In_Progress
                   </span>
                </motion.div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  };
}


import React, { Suspense, lazy } from 'react';
const Lottie = lazy(() => import('react-lottie-player'));

interface NeuralLottieProps {
  animationUrl: string;
  size?: number;
  className?: string;
  speed?: number;
  opacity?: number;
}

/**
 * NeuralLottie: Camada estética aditiva para feedback de IA.
 */
const NeuralLottie: React.FC<NeuralLottieProps> = ({ 
  animationUrl, 
  size = 100, 
  className, 
  speed = 1,
  opacity = 1 
}) => {
  return (
    <div 
      className={`flex items-center justify-center pointer-events-none ${className}`} 
      style={{ width: size, height: size, opacity }}
    >
      <Suspense fallback={<div className="w-2 h-2 bg-indigo-500 rounded-full animate-ping" />}>
        <Lottie
          loop
          play
          path={animationUrl}
          speed={speed}
          style={{ width: '100%', height: '100%' }}
        />
      </Suspense>
    </div>
  );
};

export default NeuralLottie;

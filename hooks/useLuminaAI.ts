import { useState, useEffect, useCallback, useRef } from 'react';

export function useLuminaAI() {
  const [isReady, setIsReady] = useState(false);
  const [progress, setProgress] = useState(0);
  const [isModelLoading, setIsModelLoading] = useState(false);
  const workerRef = useRef<Worker | null>(null);
  const pendingPromiseRef = useRef<{ resolve: (val: string) => void; reject: (err: any) => void } | null>(null);

  useEffect(() => {
    const worker = new Worker(new URL('../ia.worker.ts', import.meta.url), { type: 'module' });
    workerRef.current = worker;

    worker.onmessage = (event) => {
      const { type, data } = event.data;
      switch (type) {
        case 'progress':
          if (data.status === 'progress') setProgress(data.progress);
          break;
        case 'ready':
          setIsReady(true);
          setIsModelLoading(false);
          break;
        case 'segmented_click':
          pendingPromiseRef.current?.resolve(data);
          pendingPromiseRef.current = null;
          break;
        case 'error':
          console.error('Lumina Brain Failure:', data);
          pendingPromiseRef.current?.reject(data);
          pendingPromiseRef.current = null;
          setIsModelLoading(false);
          break;
      }
    };

    return () => worker.terminate();
  }, []);

  const loadModel = useCallback(() => {
    if (isReady || isModelLoading) return;
    setIsModelLoading(true);
    workerRef.current?.postMessage({ type: 'load' });
  }, [isReady, isModelLoading]);

  const segmentAtPoint = useCallback((imageUrl: string, x: number, y: number): Promise<string> => {
    return new Promise((resolve, reject) => {
      if (!isReady) {
        reject('Lumina Kernel not initialized');
        return;
      }
      pendingPromiseRef.current = { resolve, reject };
      workerRef.current?.postMessage({ 
        type: 'segment_click', 
        data: { imageUrl, point: { x, y } } 
      });
    });
  }, [isReady]);

  return { isReady, isModelLoading, progress, loadModel, segmentAtPoint };
}

import { useState, useEffect, useCallback, useRef } from 'react';

export function useLuminaAI() {
  const [isReady, setIsReady] = useState(false);
  const [progress, setProgress] = useState(0);
  const [isModelLoading, setIsModelLoading] = useState(false);
  const workerRef = useRef<Worker | null>(null);
  const pendingPromiseRef = useRef<{ resolve: (val: string) => void; reject: (err: any) => void } | null>(null);

  useEffect(() => {
    // Correct worker initialization using blob for esm compatibility in browsers if direct URL fails
    // Here we use the standard meta.url approach
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
        case 'segmented':
          pendingPromiseRef.current?.resolve(data);
          pendingPromiseRef.current = null;
          break;
        case 'error':
          console.error('Lumina Worker Error:', data);
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

  const segmentImage = useCallback((imageUrl: string): Promise<string> => {
    return new Promise((resolve, reject) => {
      if (!isReady) {
        reject('Model not ready');
        return;
      }
      pendingPromiseRef.current = { resolve, reject };
      workerRef.current?.postMessage({ type: 'segment', data: { imageUrl } });
    });
  }, [isReady]);

  return { isReady, isModelLoading, progress, loadModel, segmentImage };
}
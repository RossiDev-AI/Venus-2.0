
import { useState, useEffect, useCallback, useRef } from 'react';
import * as Comlink from 'comlink';
import { useVenusStore } from '../store/useVenusStore';

export function useLuminaAI() {
  const [isReady, setIsReady] = useState(false);
  const [isModelLoading, setIsModelLoading] = useState(false);
  const { deviceProfile } = useVenusStore();
  const workerApiRef = useRef<any>(null);

  useEffect(() => {
    const worker = new Worker(new URL('../ia.worker.ts', import.meta.url), { type: 'module' });
    workerApiRef.current = Comlink.wrap(worker);
    return () => worker.terminate();
  }, []);

  const loadModel = useCallback(async () => {
    if (isReady || isModelLoading) return;
    setIsModelLoading(true);
    try {
      await workerApiRef.current.init(deviceProfile?.tier === 'lite');
      setIsReady(true);
    } catch (e) {
      console.error("AI Kernel Init Failed", e);
    } finally {
      setIsModelLoading(false);
    }
  }, [isReady, isModelLoading, deviceProfile]);

  const segmentAtPoint = useCallback(async (imageUrl: string, x: number, y: number) => {
    if (!isReady) throw new Error("Kernel Not Ready");
    return await workerApiRef.current.segment(imageUrl, { x, y });
  }, [isReady]);

  const getDepthMap = useCallback(async (imageUrl: string) => {
    if (!isReady) throw new Error("Kernel Not Ready");
    return await workerApiRef.current.estimateDepth(imageUrl);
  }, [isReady]);

  const refineEdges = useCallback(async (imageDataUrl: string) => {
    if (!workerApiRef.current) throw new Error("Worker Down");
    return await workerApiRef.current.refine(imageDataUrl);
  }, []);

  return { isReady, isModelLoading, loadModel, segmentAtPoint, getDepthMap, refineEdges };
}

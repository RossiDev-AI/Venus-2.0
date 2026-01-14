import { useState, useEffect, useCallback, useRef } from 'react';
import * as Comlink from 'comlink';
import { useVenusStore } from '../store/useVenusStore';
import type { ILuminaWorker } from '../ia.worker';

let globalWorker: Worker | null = null;
let globalApi: Comlink.Remote<ILuminaWorker> | null = null;

export function useLuminaAI() {
  const [isReady, setIsReady] = useState(false);
  const [isModelLoading, setIsModelLoading] = useState(false);
  const { deviceProfile } = useVenusStore();

  useEffect(() => {
    if (!globalWorker) {
        try {
            // Robust origin-based URL construction for the worker.
            // Using window.location.href as a more resilient base if origin is null in sandboxed environments.
            const base = window.location.origin && window.location.origin !== 'null' 
                ? window.location.origin 
                : window.location.href;
            
            const workerUrl = new URL('/ia.worker.ts', base).href;
            
            globalWorker = new Worker(workerUrl, { type: 'module' });
            globalApi = Comlink.wrap<ILuminaWorker>(globalWorker);
        } catch (e) {
            console.error("Lumina AI: Critical failure initializing worker", e);
        }
    }
  }, []);

  const loadModel = useCallback(async () => {
    if (isReady || isModelLoading || !globalApi) return;
    setIsModelLoading(true);
    try {
      await globalApi.init(deviceProfile?.tier === 'lite');
      setIsReady(true);
    } catch (e) {
      console.debug("AI Kernel Init Silent Fail", e);
    } finally {
      setIsModelLoading(false);
    }
  }, [isReady, isModelLoading, deviceProfile]);

  const segmentAtPoint = useCallback(async (imageUrl: string, x: number, y: number) => {
    if (!isReady || !globalApi) throw new Error("Kernel Not Ready");
    return await globalApi.segment(imageUrl, { x, y });
  }, [isReady]);

  const getDepthMap = useCallback(async (imageUrl: string) => {
    if (!isReady || !globalApi) throw new Error("Kernel Not Ready");
    return await globalApi.estimateDepth(imageUrl);
  }, [isReady]);

  const recognizeOCR = useCallback(async (imageUrl: string) => {
    if (!isReady || !globalApi) throw new Error("Kernel Not Ready");
    return await globalApi.recognizeText(imageUrl);
  }, [isReady]);

  return { 
    isReady, 
    isModelLoading, 
    loadModel, 
    segmentAtPoint, 
    getDepthMap, 
    recognizeOCR,
    workerApiRef: { current: globalApi } 
  };
}
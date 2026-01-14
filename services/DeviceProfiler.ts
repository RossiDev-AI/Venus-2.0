
/**
 * V-nus 2.0 Device Profiler
 * Detecta capacidades de hardware para orquestração adaptativa.
 */

export interface DeviceProfile {
  isTouch: boolean;
  isMobile: boolean;
  tier: 'lite' | 'full';
  pixelRatio: number;
  maxTextureSize: number;
  gpuPerformance: 'low' | 'high';
}

export async function getDeviceProfile(): Promise<DeviceProfile> {
  const isTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
  const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  
  // Detecção heurística de performance da GPU
  let gpuPerformance: 'low' | 'high' = 'high';
  const canvas = document.createElement('canvas');
  const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
  
  if (gl) {
    const debugInfo = (gl as any).getExtension('WEBGL_debug_renderer_info');
    if (debugInfo) {
      const renderer = (gl as any).getParameter(debugInfo.UNMASKED_RENDERER_WEBGL).toLowerCase();
      if (renderer.includes('mali') || renderer.includes('adreno') || renderer.includes('intel')) {
        gpuPerformance = isMobile ? 'low' : 'high';
      }
    }
  }

  return {
    isTouch,
    isMobile,
    tier: isMobile || gpuPerformance === 'low' ? 'lite' : 'full',
    pixelRatio: Math.min(window.devicePixelRatio, isMobile ? 2 : 3),
    maxTextureSize: isMobile ? 4096 : 16384,
    gpuPerformance
  };
}

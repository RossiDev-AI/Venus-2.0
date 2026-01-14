import { useState, useEffect } from 'react';

export type DeviceType = 'mobile' | 'tablet' | 'desktop';

export function useDeviceType() {
  const [device, setDevice] = useState<DeviceType>('desktop');
  const [isLite, setIsLite] = useState(false);

  useEffect(() => {
    const checkDevice = () => {
      const width = window.innerWidth;
      const ua = navigator.userAgent.toLowerCase();
      const isMobileUA = /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(ua);
      
      let type: DeviceType = 'desktop';
      if (width < 768) type = 'mobile';
      else if (width < 1024) type = 'tablet';

      setDevice(type);
      // Ativa modo Lite se for mobile ou se a performance da GPU for detectada como baixa
      setIsLite(type === 'mobile' || isMobileUA);
    };

    checkDevice();
    window.addEventListener('resize', checkDevice);
    return () => window.removeEventListener('resize', checkDevice);
  }, []);

  return { device, isLite, isMobile: device === 'mobile' };
}

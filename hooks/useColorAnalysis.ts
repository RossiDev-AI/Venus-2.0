
import { useState, useEffect } from 'react';
import Vibrant from 'node-vibrant';

export interface PaletteColors {
  vibrant: string;
  muted: string;
  darkVibrant: string;
  darkMuted: string;
  lightVibrant: string;
}

export function useColorAnalysis(imageUrl: string | null) {
  const [palette, setPalette] = useState<PaletteColors | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  useEffect(() => {
    if (!imageUrl) {
      setPalette(null);
      return;
    }

    let isMounted = true;
    setIsAnalyzing(true);

    Vibrant.from(imageUrl)
      .getPalette()
      .then((swatches) => {
        if (!isMounted) return;
        
        const colors: PaletteColors = {
          vibrant: swatches.Vibrant?.getHex() || '#6366f1',
          muted: swatches.Muted?.getHex() || '#94a3b8',
          darkVibrant: swatches.DarkVibrant?.getHex() || '#4338ca',
          darkMuted: swatches.DarkMuted?.getHex() || '#1e293b',
          lightVibrant: swatches.LightVibrant?.getHex() || '#818cf8',
        };
        
        setPalette(colors);
      })
      .catch(err => console.error("Vibrant analysis failed", err))
      .finally(() => {
        if (isMounted) setIsAnalyzing(false);
      });

    return () => { isMounted = false; };
  }, [imageUrl]);

  return { palette, isAnalyzing };
}

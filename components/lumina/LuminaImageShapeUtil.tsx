import React, { useLayoutEffect, useRef, useEffect } from 'react';
import { ShapeUtil, HTMLContainer, Rectangle2d } from 'tldraw';
import * as PIXI from 'pixi.js';
import { LuminaImageShape } from '../../types';
import { LuminaShaderEngine } from './LuminaShaderEngine';
import { Loader2 } from 'lucide-react';

/**
 * LuminaImageComponent: Habilita a renderização do kernel PixiJS dentro do canvas do Tldraw.
 */
const LuminaImageComponent = ({ shape }: { shape: LuminaImageShape }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const pixiAppRef = useRef<PIXI.Application | null>(null);
  const mainSpriteRef = useRef<PIXI.Sprite | null>(null);

  useLayoutEffect(() => {
    let isMounted = true;
    const init = async () => {
      if (!containerRef.current) return;
      
      const app = new PIXI.Application();
      await app.init({
        width: (shape as any).props.w,
        height: (shape as any).props.h,
        backgroundAlpha: 0,
        antialias: true,
        resolution: window.devicePixelRatio || 1,
        autoDensity: true
      });

      if (!isMounted) {
        app.destroy(true, { children: true, texture: true, baseTexture: true });
        return;
      }

      pixiAppRef.current = app;
      containerRef.current.appendChild(app.canvas);
      app.canvas.style.width = '100%';
      app.canvas.style.height = '100%';

      const updateTexture = async () => {
        if (!isMounted || !app) return;
        
        if (mainSpriteRef.current) {
          app.stage.removeChild(mainSpriteRef.current);
          mainSpriteRef.current.destroy({ texture: true, baseTexture: true });
        }

        if (!(shape as any).props.url) return;

        try {
          const texture = await PIXI.Assets.load((shape as any).props.url);
          const sprite = new PIXI.Sprite(texture);
          sprite.width = (shape as any).props.w;
          sprite.height = (shape as any).props.h;
          app.stage.addChild(sprite);
          mainSpriteRef.current = sprite;

          await LuminaShaderEngine.apply(sprite, (shape as any).props, null);
        } catch (e) {
          console.debug("Lumina Graphics Layer: Texture load failed", e);
        }
      };

      updateTexture();
    };

    init();

    return () => {
      isMounted = false;
      if (pixiAppRef.current) {
        pixiAppRef.current.destroy(true, { children: true, texture: true, baseTexture: true });
      }
    };
  }, [(shape as any).props.url, (shape as any).props.w, (shape as any).props.h]);

  useEffect(() => {
    if (mainSpriteRef.current) {
      LuminaShaderEngine.apply(mainSpriteRef.current, (shape as any).props, null);
    }
  }, [
    (shape as any).props.brightness, 
    (shape as any).props.contrast, 
    (shape as any).props.exposure, 
    (shape as any).props.saturation, 
    (shape as any).props.grading
  ]);

  return (
    <HTMLContainer 
      ref={containerRef} 
      className="venus-lumina-image-container"
      style={{ width: (shape as any).props.w, height: (shape as any).props.h, overflow: 'hidden', position: 'relative', pointerEvents: 'none' }}
    >
      {(shape as any).props.isScanning && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/40 backdrop-blur-sm z-10">
          <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
        </div>
      )}
    </HTMLContainer>
  );
};

export class LuminaImageShapeUtil extends ShapeUtil<LuminaImageShape> {
  static type = 'lumina-image' as const;

  getDefaultProps(): any {
    return {
      w: 300,
      h: 300,
      url: '',
      depthThreshold: 0.5,
      parallaxIntensity: 1.0,
      showDepthPreview: false,
      isForegroundOverlay: false,
      depthDisplacement: 0,
      smartCropEnabled: true,
      exposure: 0,
      brightness: 1,
      contrast: 1,
      saturation: 1,
      hue: 0,
      blur: 0
    };
  }

  getGeometry(shape: LuminaImageShape) {
    return new Rectangle2d({
      width: (shape as any).props.w,
      height: (shape as any).props.h,
      isFilled: true,
    });
  }

  component(shape: LuminaImageShape) {
    return <LuminaImageComponent shape={shape} />;
  }

  indicator(shape: LuminaImageShape) {
    return <rect width={(shape as any).props.w} height={(shape as any).props.h} />;
  }
}
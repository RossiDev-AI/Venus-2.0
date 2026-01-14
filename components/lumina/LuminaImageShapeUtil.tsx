
import React, { useLayoutEffect, useRef, useEffect } from 'react';
import { ShapeUtil, HTMLContainer, Rectangle2d } from 'tldraw';
import * as PIXI from 'pixi.js';
import { LuminaImageShape } from '../../types';
import { LuminaShaderEngine } from './LuminaShaderEngine';
import { Loader2 } from 'lucide-react';
import { useDeviceType } from '../../hooks/useDeviceType';

const LuminaImageComponent = ({ shape }: { shape: LuminaImageShape }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const pixiAppRef = useRef<PIXI.Application | null>(null);
  const mainSpriteRef = useRef<PIXI.Sprite | null>(null);
  const { isLite } = useDeviceType();

  useLayoutEffect(() => {
    let isMounted = true;
    const init = async () => {
      if (!containerRef.current) return;
      
      const app = new PIXI.Application();
      await app.init({
        width: (shape as any).props.w,
        height: (shape as any).props.h,
        backgroundAlpha: 0,
        antialias: !isLite, // Desabilita AA no mobile para performance
        resolution: isLite ? 1 : (window.devicePixelRatio || 1),
        autoDensity: true
      });

      if (!isMounted) {
        app.destroy(true, { children: true, texture: true });
        return;
      }

      pixiAppRef.current = app;
      containerRef.current.appendChild(app.canvas);

      if (!(shape as any).props.url) return;

      try {
        const texture = await PIXI.Assets.load((shape as any).props.url);
        const sprite = new PIXI.Sprite(texture);
        sprite.width = (shape as any).props.w;
        sprite.height = (shape as any).props.h;
        app.stage.addChild(sprite);
        mainSpriteRef.current = sprite;

        await LuminaShaderEngine.apply(sprite, (shape as any).props, isLite);
        if (isLite) app.render(); // Force single render in lite mode
      } catch (e) {
        console.debug("Lumina Graphics Layer: Texture load failed", e);
      }
    };

    init();
    return () => {
      isMounted = false;
      if (pixiAppRef.current) pixiAppRef.current.destroy(true, { children: true, texture: true });
    };
  }, [(shape as any).props.url, (shape as any).props.w, (shape as any).props.h, isLite]);

  useEffect(() => {
    if (mainSpriteRef.current) {
      LuminaShaderEngine.apply(mainSpriteRef.current, (shape as any).props, isLite);
      if (isLite && pixiAppRef.current) pixiAppRef.current.render();
    }
  }, [
    (shape as any).props.brightness, 
    (shape as any).props.contrast, 
    (shape as any).props.exposure, 
    (shape as any).props.saturation, 
    (shape as any).props.grading,
    isLite
  ]);

  return (
    <HTMLContainer className="venus-lumina-image-container" style={{ width: '100%', height: '100%', pointerEvents: 'none' }}>
      <div 
        ref={containerRef} 
        style={{ width: (shape as any).props.w, height: (shape as any).props.h, overflow: 'hidden', position: 'relative' }}
      >
        {(shape as any).props.isScanning && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/40 backdrop-blur-sm z-10">
            <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
          </div>
        )}
      </div>
    </HTMLContainer>
  );
};

export class LuminaImageShapeUtil extends ShapeUtil<LuminaImageShape> {
  static type = 'lumina-image' as const;
  getDefaultProps(): any { return { w: 300, h: 300, url: '', exposure: 0, brightness: 1, contrast: 1, saturation: 1, hue: 0, blur: 0 }; }
  getGeometry(shape: LuminaImageShape) { return new Rectangle2d({ width: (shape as any).props.w, height: (shape as any).props.h, isFilled: true }); }
  component(shape: LuminaImageShape) { return <LuminaImageComponent shape={shape} />; }
  indicator(shape: LuminaImageShape) { return <rect width={(shape as any).props.w} height={(shape as any).props.h} />; }
}

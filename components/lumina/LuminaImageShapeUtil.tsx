
import React, { useLayoutEffect, useRef, useEffect, useState } from 'react';
import { ShapeUtil, HTMLContainer, TLOnResizeHandler } from 'tldraw';
import * as PIXI from 'pixi.js';
import { Assets } from 'pixi.js';
import { GIF } from '@pixi/gif';
import { LuminaImageShape } from '../../types';
import { LuminaShaderEngine } from './LuminaShaderEngine';
import { Loader2, Zap } from 'lucide-react';

export class LuminaImageShapeUtil extends ShapeUtil<LuminaImageShape> {
  static type = 'lumina-image' as const;

  isAspectRatioLocked = () => false;
  canResize = () => true;

  getDefaultProps(): any {
    return {
      w: 800, h: 600, url: '',
      depthMapUrl: '', depthThreshold: 0.5, parallaxIntensity: 0.03,
      depthDisplacement: 0.05, smartCropEnabled: true,
      isScanning: false, assetType: 'IMAGE',
      exposure: 0, brightness: 1, contrast: 1, saturation: 1
    };
  }

  component(shape: LuminaImageShape) {
    const containerRef = useRef<HTMLDivElement>(null);
    const pixiAppRef = useRef<PIXI.Application | null>(null);
    const mainSpriteRef = useRef<PIXI.Sprite | null>(null);
    const currentProps = (shape as any).props;

    useLayoutEffect(() => {
      let isMounted = true;
      const init = async () => {
        if (!containerRef.current || !currentProps.url) return;
        
        const app = new PIXI.Application();
        await app.init({ width: currentProps.w, height: currentProps.h, backgroundAlpha: 0 });
        if (!isMounted) { app.destroy(true); return; }
        
        pixiAppRef.current = app;
        containerRef.current.appendChild(app.canvas);

        let displayObject: PIXI.Sprite | GIF;

        if (currentProps.assetType === 'GIF') {
            displayObject = await Assets.load({
                src: currentProps.url,
                loadParser: 'loadGif'
            });
        } else {
            const tex = await Assets.load(currentProps.url);
            displayObject = new PIXI.Sprite(tex);
        }

        displayObject.anchor.set(0.5);
        displayObject.x = app.screen.width / 2;
        displayObject.y = app.screen.height / 2;
        
        const ratio = Math.max(app.screen.width / (displayObject as any).width, app.screen.height / (displayObject as any).height);
        displayObject.scale.set(ratio);
        
        if (currentProps.subjectFocus) {
            displayObject.x = app.screen.width / 2 - (currentProps.subjectFocus.x - 0.5) * (displayObject as any).width;
            displayObject.y = app.screen.height / 2 - (currentProps.subjectFocus.y - 0.5) * (displayObject as any).height;
        }

        app.stage.addChild(displayObject);
        mainSpriteRef.current = displayObject as PIXI.Sprite;

        await LuminaShaderEngine.apply(displayObject as PIXI.Sprite, currentProps, null);
      };

      init();

      return () => { 
        isMounted = false; 
        if (pixiAppRef.current) pixiAppRef.current.destroy(true, { children: true, texture: true });
      };
    }, [currentProps.w, currentProps.h, currentProps.url, currentProps.subjectFocus]);

    return (
      <div className="relative w-full h-full">
        <HTMLContainer ref={containerRef} style={{ width: currentProps.w, height: currentProps.h, pointerEvents: 'none', overflow: 'hidden', borderRadius: '24px', opacity: currentProps.isScanning ? 0.3 : 1, transition: 'opacity 0.5s' }} />
        
        {currentProps.isScanning && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-indigo-600/10 backdrop-blur-sm rounded-[24px] border-2 border-indigo-500/40 animate-pulse">
                <div className="relative">
                    <Loader2 size={32} className="text-indigo-400 animate-spin" />
                    <Zap size={14} className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-white" />
                </div>
                <span className="mt-3 text-[8px] font-black text-indigo-400 uppercase tracking-widest">Neural Optimizing...</span>
            </div>
        )}
      </div>
    );
  }

  getBounds(shape: LuminaImageShape) {
    const props = (shape as any).props;
    return { minX: 0, minY: 0, maxX: props.w, maxY: props.h, width: props.w, height: props.h };
  }
}

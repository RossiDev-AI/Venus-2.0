import React, { useLayoutEffect, useRef, useState } from 'react';
import { ShapeUtil, HTMLContainer, TLOnResizeHandler, useEditor } from 'tldraw';
import * as PIXI from 'pixi.js';
import { LuminaImageShape } from '../../types';
import { LuminaFilters } from './LuminaFilters';

export class LuminaImageShapeUtil extends ShapeUtil<LuminaImageShape> {
  static type = 'lumina-image' as const;

  isAspectRatioLocked = () => true;
  canResize = () => true;

  getDefaultProps(): any {
    return {
      w: 800,
      h: 600,
      url: '',
      thumbUrl: '',
      exposure: 0,
      brightness: 1,
      contrast: 1,
      saturation: 1,
      hue: 0,
      blur: 0,
      isProcessingMask: false,
      isScanning: false,
      guidanceIntensity: 0.5,
    };
  }

  component(shape: LuminaImageShape) {
    const containerRef = useRef<HTMLDivElement>(null);
    const pixiAppRef = useRef<PIXI.Application | null>(null);
    const mainSpriteRef = useRef<PIXI.Sprite | null>(null);
    const oldSpriteRef = useRef<PIXI.Sprite | null>(null);
    const maskSpriteRef = useRef<PIXI.Sprite | null>(null);

    const currentProps = (shape as any).props;

    useLayoutEffect(() => {
      let isMounted = true;
      const init = async () => {
        if (!containerRef.current) return;
        const app = new PIXI.Application();
        await app.init({
          width: currentProps.w,
          height: currentProps.h,
          backgroundAlpha: 0,
          antialias: true,
          preference: 'webgl'
        });
        if (!isMounted) return;
        pixiAppRef.current = app;
        containerRef.current.appendChild(app.canvas);

        const tex = await PIXI.Assets.load(currentProps.url);
        const sprite = new PIXI.Sprite(tex);
        sprite.anchor.set(0.5);
        sprite.x = app.screen.width / 2;
        sprite.y = app.screen.height / 2;
        const ratio = Math.min(app.screen.width / tex.width, app.screen.height / tex.height);
        sprite.scale.set(ratio);
        app.stage.addChild(sprite);
        mainSpriteRef.current = sprite;
        LuminaFilters.apply(sprite, currentProps);
      };
      init();
      return () => { 
        isMounted = false; 
        if (pixiAppRef.current) pixiAppRef.current.destroy(true, { children: true, texture: true });
      };
    }, []);

    // Reactive Updates: Crossfade & Filters
    useLayoutEffect(() => {
        const app = pixiAppRef.current;
        const main = mainSpriteRef.current;
        if (!app || !main) return;

        const updateTexture = async () => {
            if (main.texture.label !== currentProps.url) {
                // Inicia Crossfade
                const oldTex = main.texture;
                const oldSprite = new PIXI.Sprite(oldTex);
                oldSprite.anchor.copyFrom(main.anchor);
                oldSprite.position.copyFrom(main.position);
                oldSprite.scale.copyFrom(main.scale);
                app.stage.addChildAt(oldSprite, app.stage.getChildIndex(main));
                
                const newTex = await PIXI.Assets.load(currentProps.url);
                main.texture = newTex;
                main.alpha = 0;

                // Tween manual simple
                let step = 0;
                const fade = () => {
                    step += 0.05;
                    main.alpha = step;
                    oldSprite.alpha = 1 - step;
                    if (step < 1) requestAnimationFrame(fade);
                    else {
                        app.stage.removeChild(oldSprite);
                        oldSprite.destroy();
                    }
                };
                fade();
            }
            LuminaFilters.apply(main, currentProps);
        };

        updateTexture();
    }, [currentProps.url, currentProps.exposure, currentProps.brightness, currentProps.lutPreset]);

    return (
      <HTMLContainer
        ref={containerRef}
        style={{
          width: currentProps.w,
          height: currentProps.h,
          pointerEvents: 'none',
          backgroundColor: '#050505',
          borderRadius: '16px',
          overflow: 'hidden',
          boxShadow: currentProps.isProcessingMask ? '0 0 100px rgba(99, 102, 241, 0.4)' : '0 10px 40px rgba(0,0,0,0.5)',
        }}
      >
        {currentProps.isProcessingMask && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/40 backdrop-blur-md">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-16 h-16 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
                    <span className="text-[10px] font-black text-white uppercase tracking-[0.5em] mono animate-pulse">Style_Aware_Synthesis...</span>
                </div>
            </div>
        )}
      </HTMLContainer>
    );
  }

  getBounds(shape: LuminaImageShape) {
    const p = (shape as any).props;
    return { minX: 0, minY: 0, maxX: p.w, maxY: p.h, width: p.w, height: p.h };
  }

  onResize: TLOnResizeHandler<LuminaImageShape> = (shape, info) => {
    return { props: { w: info.initialBounds.width * info.scaleX, h: info.initialBounds.height * info.scaleY } };
  };

  indicator(shape: LuminaImageShape) {
    const p = (shape as any).props;
    return <rect width={p.w} height={p.h} rx="16" ry="16" />;
  }
}

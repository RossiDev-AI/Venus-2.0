import React, { useLayoutEffect, useRef } from 'react';
import { ShapeUtil, HTMLContainer, TLOnResizeHandler } from 'tldraw';
import * as PIXI from 'pixi.js';
import { LuminaImageShape } from '../../types';

export class LuminaImageShapeUtil extends ShapeUtil<LuminaImageShape> {
  static type = 'lumina-image' as const;

  isAspectRatioLocked = () => true;
  canResize = () => true;

  getDefaultProps(): any {
    return {
      w: 800,
      h: 600,
      url: 'https://picsum.photos/800/600',
      brightness: 1,
      contrast: 1,
      saturation: 1,
      blur: 0,
      isProcessingMask: false,
    };
  }

  getBounds(shape: LuminaImageShape) {
    const props = (shape as any).props;
    return {
      minX: 0,
      minY: 0,
      maxX: props.w,
      maxY: props.h,
      width: props.w,
      height: props.h,
    };
  }

  onResize: TLOnResizeHandler<LuminaImageShape> = (shape, info) => {
    return {
      props: {
        w: info.initialBounds.width * info.scaleX,
        h: info.initialBounds.height * info.scaleY,
      },
    };
  };

  component(shape: LuminaImageShape) {
    const containerRef = useRef<HTMLDivElement>(null);
    const pixiAppRef = useRef<PIXI.Application | null>(null);
    const spriteRef = useRef<PIXI.Sprite | null>(null);
    const maskRef = useRef<PIXI.Sprite | null>(null);
    const colorMatrixFilterRef = useRef<PIXI.ColorMatrixFilter | null>(null);
    const blurFilterRef = useRef<PIXI.BlurFilter | null>(null);

    const currentProps = (shape as any).props;

    useLayoutEffect(() => {
      let isMounted = true;

      const initPixi = async () => {
        if (!containerRef.current) return;

        const app = new PIXI.Application();
        const p = (shape as any).props;
        
        // Inicialização assíncrona da PIXI v8
        await app.init({
          width: p.w,
          height: p.h,
          backgroundAlpha: 0,
          resolution: window.devicePixelRatio || 1,
          autoDensity: true,
          antialias: true,
        });

        if (!isMounted) {
          app.destroy(true, { children: true, texture: true });
          return;
        }

        pixiAppRef.current = app;
        containerRef.current.appendChild(app.canvas);

        try {
          const texture = await PIXI.Assets.load(p.url);
          if (!isMounted) return;

          const sprite = new PIXI.Sprite(texture);
          sprite.anchor.set(0.5);
          sprite.x = app.screen.width / 2;
          sprite.y = app.screen.height / 2;
          
          const ratio = Math.min(app.screen.width / sprite.width, app.screen.height / sprite.height);
          sprite.scale.set(ratio);

          app.stage.addChild(sprite);
          spriteRef.current = sprite;

          // Configuração de Filtros
          const colorMatrix = new PIXI.ColorMatrixFilter();
          const blurFilter = new PIXI.BlurFilter();
          sprite.filters = [colorMatrix, blurFilter];
          colorMatrixFilterRef.current = colorMatrix;
          blurFilterRef.current = blurFilter;

          if (p.maskUrl) await applyMask(p.maskUrl);
          syncProps();
        } catch (error) {
          console.error('Lumina Engine Critical Failure:', error);
        }
      };

      const applyMask = async (maskUrl: string) => {
        const app = pixiAppRef.current;
        const sprite = spriteRef.current;
        if (!app || !sprite) return;
        try {
          const maskTexture = await PIXI.Assets.load(maskUrl);
          const maskSprite = new PIXI.Sprite(maskTexture);
          maskSprite.anchor.set(0.5);
          maskSprite.x = sprite.x;
          maskSprite.y = sprite.y;
          maskSprite.scale.set(sprite.scale.x);
          app.stage.addChild(maskSprite);
          sprite.mask = maskSprite;
          maskRef.current = maskSprite;
        } catch (e) {}
      };

      const syncProps = () => {
        const cm = colorMatrixFilterRef.current;
        const bf = blurFilterRef.current;
        const p = (shape as any).props;
        if (cm) {
          cm.reset();
          cm.brightness(p.brightness, false);
          cm.contrast(p.contrast, false);
          cm.saturate(p.saturation - 1, true);
        }
        if (bf) bf.blur = p.blur;
      };

      initPixi();

      return () => {
        isMounted = false;
        if (pixiAppRef.current) {
          // Cleanup rigoroso para evitar memory leaks
          pixiAppRef.current.destroy(true, { children: true, texture: true });
          pixiAppRef.current = null;
        }
      };
    }, []);

    // Sincronização reativa de propriedades (Resize, Filtros e Máscaras)
    useLayoutEffect(() => {
      const app = pixiAppRef.current;
      const sprite = spriteRef.current;
      const mask = maskRef.current;
      if (!app || !sprite) return;

      const p = (shape as any).props;
      app.renderer.resize(p.w, p.h);
      sprite.x = app.screen.width / 2;
      sprite.y = app.screen.height / 2;
      const ratio = Math.min(app.screen.width / sprite.texture.width, app.screen.height / sprite.texture.height);
      sprite.scale.set(ratio);
      
      if (mask) {
        mask.x = sprite.x;
        mask.y = sprite.y;
        mask.scale.set(sprite.scale.x);
      }

      if (colorMatrixFilterRef.current) {
        const cm = colorMatrixFilterRef.current;
        cm.reset();
        cm.brightness(p.brightness, false);
        cm.saturate(p.saturation - 1, true);
        const c = p.contrast;
        if (c !== 1) {
            const matrix = cm.matrix;
            const o = -0.5 * c + 0.5;
            matrix[0] *= c; matrix[5] *= c; matrix[10] *= c;
            matrix[4] += o; matrix[9] += o; matrix[14] += o;
        }
      }
      if (blurFilterRef.current) blurFilterRef.current.blur = p.blur;

    }, [currentProps.w, currentProps.h, currentProps.brightness, currentProps.contrast, currentProps.saturation, currentProps.blur, currentProps.maskUrl]);

    return (
      <HTMLContainer
        ref={containerRef}
        style={{
          width: currentProps.w,
          height: currentProps.h,
          pointerEvents: 'none',
          backgroundColor: 'transparent',
          overflow: 'hidden',
          borderRadius: '16px',
          boxShadow: currentProps.isProcessingMask ? '0 0 50px rgba(99, 102, 241, 0.4)' : '0 20px 50px rgba(0,0,0,0.5)',
          transition: 'box-shadow 0.4s cubic-bezier(0.23, 1, 0.32, 1)',
        }}
      >
        {currentProps.isProcessingMask && (
          <div className="absolute inset-0 bg-indigo-600/10 backdrop-blur-[4px] flex items-center justify-center">
            <div className="flex flex-col items-center gap-3">
              <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin shadow-[0_0_20px_rgba(99,102,241,0.4)]" />
              <span className="text-[9px] font-black text-indigo-400 uppercase tracking-[0.3em] mono animate-pulse">Neural_Synthesis_Active</span>
            </div>
          </div>
        )}
      </HTMLContainer>
    );
  }

  indicator(shape: LuminaImageShape) {
    const props = (shape as any).props;
    return <rect width={props.w} height={props.h} rx="16" ry="16" />;
  }
}

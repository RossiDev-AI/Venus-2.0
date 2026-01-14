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
      w: 400,
      h: 400,
      url: 'https://picsum.photos/400/400',
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
        await app.init({
          width: p.w,
          height: p.h,
          backgroundAlpha: 0,
          resolution: window.devicePixelRatio || 1,
          autoDensity: true,
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

          const colorMatrix = new PIXI.ColorMatrixFilter();
          const blurFilter = new PIXI.BlurFilter();
          
          sprite.filters = [colorMatrix, blurFilter];
          colorMatrixFilterRef.current = colorMatrix;
          blurFilterRef.current = blurFilter;

          // Check for existing mask
          if (p.maskUrl) {
            await applyMask(p.maskUrl);
          }

          syncFilters();
        } catch (error) {
          console.error('Lumina Pixi Load Error:', error);
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
        } catch (e) {
          console.error("Mask Apply Error:", e);
        }
      };

      const syncFilters = () => {
        const cm = colorMatrixFilterRef.current;
        const bf = blurFilterRef.current;
        const p = (shape as any).props;
        if (cm) {
          cm.reset();
          cm.brightness(p.brightness, false);
          cm.contrast(p.contrast, false);
          cm.saturate(p.saturation - 1, true);
        }
        if (bf) {
          bf.blur = p.blur;
        }
      };

      initPixi();

      return () => {
        isMounted = false;
        if (pixiAppRef.current) {
          pixiAppRef.current.destroy(true, { children: true, texture: true });
          pixiAppRef.current = null;
        }
      };
    }, []);

    // Sync Props (Resize, Filters, and New Mask)
    useLayoutEffect(() => {
      const app = pixiAppRef.current;
      const sprite = spriteRef.current;
      const mask = maskRef.current;
      if (!app || !sprite) return;

      const p = (shape as any).props;

      // Handle Resize
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

      // Handle Mask logic (if changed)
      const loadNewMask = async () => {
        if (p.maskUrl && (!mask || mask.texture.label !== p.maskUrl)) {
             try {
                const tex = await PIXI.Assets.load(p.maskUrl);
                if (mask) app.stage.removeChild(mask);
                const newMask = new PIXI.Sprite(tex);
                newMask.anchor.set(0.5);
                newMask.x = sprite.x;
                newMask.y = sprite.y;
                newMask.scale.set(sprite.scale.x);
                app.stage.addChild(newMask);
                sprite.mask = newMask;
                maskRef.current = newMask;
             } catch(e){}
        }
      };
      loadNewMask();

      // Filters
      if (colorMatrixFilterRef.current) {
        const cm = colorMatrixFilterRef.current;
        cm.reset();
        cm.brightness(p.brightness, false);
        const sat = p.saturation;
        if (sat !== 1) cm.saturate(sat, true);
        const c = p.contrast;
        if (c !== 1) {
            const matrix = cm.matrix;
            const o = -0.5 * c + 0.5;
            matrix[0] *= c; matrix[5] *= c; matrix[10] *= c;
            matrix[4] += o; matrix[9] += o; matrix[14] += o;
        }
      }
      if (blurFilterRef.current) {
        blurFilterRef.current.blur = p.blur;
      }
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
          borderRadius: '12px',
          boxShadow: currentProps.isProcessingMask ? '0 0 40px rgba(99, 102, 241, 0.5)' : '0 10px 30px rgba(0,0,0,0.5)',
          transition: 'box-shadow 0.3s ease',
        }}
      >
        {currentProps.isProcessingMask && (
          <div className="absolute inset-0 bg-indigo-600/10 backdrop-blur-[2px] flex items-center justify-center">
            <div className="flex flex-col items-center gap-2">
              <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
              <span className="text-[7px] font-black text-indigo-400 uppercase tracking-widest">Auto_Magic_Cutout...</span>
            </div>
          </div>
        )}
      </HTMLContainer>
    );
  }

  indicator(shape: LuminaImageShape) {
    const props = (shape as any).props;
    return <rect width={props.w} height={props.h} />;
  }
}
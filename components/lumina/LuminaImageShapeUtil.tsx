
import React, { useLayoutEffect, useRef, useEffect } from 'react';
import { ShapeUtil, HTMLContainer, TLOnResizeHandler } from 'tldraw';
import * as PIXI from 'pixi.js';
import { LuminaImageShape } from '../../types';
import { LuminaShaderEngine } from './LuminaShaderEngine';
import { useVenusStore } from '../../store/useVenusStore';

export class LuminaImageShapeUtil extends ShapeUtil<LuminaImageShape> {
  static type = 'lumina-image' as const;

  isAspectRatioLocked = () => false;
  canResize = () => true;

  getDefaultProps(): any {
    return {
      w: 800, h: 600, url: '',
      depthMapUrl: '', depthThreshold: 0.5, parallaxIntensity: 0.03,
      depthDisplacement: 0.05, smartCropEnabled: true,
      exposure: 0, brightness: 1, contrast: 1, saturation: 1
    };
  }

  component(shape: LuminaImageShape) {
    const containerRef = useRef<HTMLDivElement>(null);
    const pixiAppRef = useRef<PIXI.Application | null>(null);
    const mainSpriteRef = useRef<PIXI.Sprite | null>(null);
    const depthTextureRef = useRef<PIXI.Texture | null>(null);
    const currentProps = (shape as any).props;

    useEffect(() => {
        const handleMove = (e: MouseEvent) => {
            const x = (e.clientX / window.innerWidth - 0.5) * 0.1;
            const y = (e.clientY / window.innerHeight - 0.5) * 0.1;
            LuminaShaderEngine.updateOffset(x, y);
        };
        window.addEventListener('mousemove', handleMove);
        return () => window.removeEventListener('mousemove', handleMove);
    }, []);

    useLayoutEffect(() => {
      let isMounted = true;
      const init = async () => {
        if (!containerRef.current) return;
        const app = new PIXI.Application();
        await app.init({ width: currentProps.w, height: currentProps.h, backgroundAlpha: 0 });
        if (!isMounted) return;
        pixiAppRef.current = app;
        containerRef.current.appendChild(app.canvas);

        const tex = await PIXI.Assets.load(currentProps.url);
        const sprite = new PIXI.Sprite(tex);
        sprite.anchor.set(0.5);
        sprite.x = app.screen.width / 2;
        sprite.y = app.screen.height / 2;
        
        // Lógica de Smart Crop no preenchimento do sprite
        const ratio = Math.max(app.screen.width / tex.width, app.screen.height / tex.height);
        sprite.scale.set(ratio);
        
        if (currentProps.subjectFocus) {
            sprite.x = app.screen.width / 2 - (currentProps.subjectFocus.x - 0.5) * sprite.width;
            sprite.y = app.screen.height / 2 - (currentProps.subjectFocus.y - 0.5) * sprite.height;
        }

        app.stage.addChild(sprite);
        mainSpriteRef.current = sprite;

        if (currentProps.depthMapUrl) {
            depthTextureRef.current = await PIXI.Assets.load(currentProps.depthMapUrl);
        }
        LuminaShaderEngine.apply(sprite, currentProps, depthTextureRef.current);
      };
      init();
      return () => { 
        isMounted = false; 
        if (pixiAppRef.current) pixiAppRef.current.destroy(true, { children: true, texture: true });
      };
    }, [currentProps.w, currentProps.h, currentProps.subjectFocus]);

    return (
      <HTMLContainer ref={containerRef} style={{ width: currentProps.w, height: currentProps.h, pointerEvents: 'none', overflow: 'hidden', borderRadius: '24px' }} />
    );
  }

  onResize: TLOnResizeHandler<LuminaImageShape> = (shape, info) => {
    const newW = info.initialBounds.width * info.scaleX;
    const newH = info.initialBounds.height * info.scaleY;
    
    // Added fix: Used type casting to access 'props' and 'editor' to resolve property access errors.
    const shapeAny = shape as any;
    if (shapeAny.props.smartCropEnabled) {
        const ai = (window as any).luminaAI;
        ai.analyzeSubject(shapeAny.props.url, newW, newH).then((crop: any) => {
            (this as any).editor.updateShape({ 
                id: shape.id, 
                props: { subjectFocus: { x: crop.x / shapeAny.props.w, y: crop.y / shapeAny.props.h } } 
            } as any);
        });
    }

    return { props: { w: newW, h: newH } };
  };

  getBounds(shape: LuminaImageShape) {
    // Added fix: Used type casting to access 'props' on LuminaImageShape.
    const props = (shape as any).props;
    return { minX: 0, minY: 0, maxX: props.w, maxY: props.h, width: props.w, height: props.h };
  }
}


import React, { useRef, useEffect, useLayoutEffect, useState } from 'react';
import * as PIXI from 'pixi.js';
import { TimelineBeat, SubtitleSettings } from '../../types';
import { LuminaShaderEngine } from '../lumina/LuminaShaderEngine';

interface CinemaPreviewProps {
  currentBeat: TimelineBeat | null;
  aspectRatio: '16:9' | '9:16' | '1:1';
  subtitleSettings: SubtitleSettings;
  title: string;
  credits: string;
  isRendering: boolean;
  renderProgress: number;
  renderStatus: string;
  minimalist?: boolean;
  isScanningOCR?: boolean;
  audioLevel?: number; // Recebe o nível de áudio em tempo real
}

const CinemaPreview: React.FC<CinemaPreviewProps> = ({
  currentBeat, aspectRatio, subtitleSettings, title, credits, isRendering, renderProgress, renderStatus, minimalist, isScanningOCR, audioLevel = 0
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const pixiAppRef = useRef<PIXI.Application | null>(null);
  const mainSpriteRef = useRef<PIXI.Sprite | null>(null);
  const laserRef = useRef<PIXI.Graphics | null>(null);

  useLayoutEffect(() => {
    let isMounted = true;
    const init = async () => {
      if (!containerRef.current) return;
      const app = new PIXI.Application();
      
      let width = 1280, height = 720;
      if (aspectRatio === '9:16') { width = 720; height = 1280; }
      else if (aspectRatio === '1:1') { width = 720; height = 720; }

      await app.init({
        width, height,
        background: '#0a0a0c',
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
      app.canvas.style.objectFit = 'contain';
      app.canvas.classList.add('venus-preview-canvas');

      const laser = new PIXI.Graphics();
      laser.rect(0, 0, width, 4);
      laser.fill({ color: 0x6366f1, alpha: 0.8 });
      laser.visible = false;
      app.stage.addChild(laser);
      laserRef.current = laser;

      app.ticker.add((ticker) => {
        if (laser.visible) {
            laser.y += 4 * ticker.deltaTime;
            if (laser.y >= height) laser.y = 0;
        }
      });
    };

    init();

    return () => { 
        isMounted = false; 
        if (pixiAppRef.current) {
            pixiAppRef.current.destroy(true, { children: true, texture: true, baseTexture: true });
        }
    };
  }, [aspectRatio]);

  // Audio Reactive Pulse
  useEffect(() => {
    if (mainSpriteRef.current) {
      const baseScale = mainSpriteRef.current.userData?.baseScale || 1;
      const pulse = 1 + (audioLevel / 500); // Sensibilidade
      mainSpriteRef.current.scale.set(baseScale * pulse);
    }
  }, [audioLevel]);

  useEffect(() => {
    const updatePreview = async () => {
        const app = pixiAppRef.current;
        if (!app || !currentBeat) return;
        
        if (mainSpriteRef.current) {
            app.stage.removeChild(mainSpriteRef.current);
            mainSpriteRef.current.destroy({ texture: true, baseTexture: true });
        }

        if (currentBeat.assetUrl) {
            try {
                const tex = await PIXI.Assets.load(currentBeat.assetUrl);
                const sprite = new PIXI.Sprite(tex);
                sprite.anchor.set(0.5);
                sprite.x = app.screen.width / 2;
                sprite.y = app.screen.height / 2;
                
                const ratio = Math.max(app.screen.width / tex.width, app.screen.height / tex.height);
                sprite.scale.set(ratio);
                sprite.userData = { baseScale: ratio }; // Armazena escala base para pulsação
                
                sprite.y += (currentBeat.yOffset || 0) * (app.screen.height / 100);

                app.stage.addChildAt(sprite, 0);
                mainSpriteRef.current = sprite;

                await LuminaShaderEngine.apply(sprite, { grading: currentBeat.grading }, null);
            } catch (e) {
                console.debug("Asset load error suppressed", e);
            }
        }
    };
    updatePreview();
  }, [currentBeat]);

  const subs = subtitleSettings;
  
  return (
    <div className="flex-1 flex items-center justify-center p-8 relative overflow-hidden">
      <div className={`relative bg-zinc-950 shadow-2xl overflow-hidden rounded-[2rem] border border-white/5 transition-all duration-700 ${aspectRatio === '16:9' ? 'w-full max-w-5xl aspect-video' : aspectRatio === '1:1' ? 'h-full max-h-[80vh] aspect-square' : 'h-full max-h-[80vh] aspect-[9/16]'}`}>
        
        <div ref={containerRef} className="w-full h-full relative z-0" />

        {isScanningOCR && (
            <div className="absolute top-10 left-1/2 -translate-x-1/2 px-6 py-2 bg-indigo-600/90 backdrop-blur-md rounded-full border border-indigo-400/50 flex items-center gap-3 z-50">
                <div className="w-2 h-2 bg-white rounded-full animate-ping" />
                <span className="text-[10px] font-black text-white uppercase tracking-widest">Neural OCR Active</span>
            </div>
        )}

        {currentBeat && !minimalist && (
          <div className="absolute inset-0 pointer-events-none">
            <div className={`absolute left-0 right-0 px-10 flex justify-center ${currentBeat.id.startsWith('title') || currentBeat.id.startsWith('credits') ? 'inset-0 items-center' : 'bottom-[15%]'}`}>
              <div 
                style={{ 
                  fontSize: `${(currentBeat.id.startsWith('credits') || currentBeat.id.startsWith('title')) ? subs.fontSize * 0.85 : subs.fontSize}px`, 
                  color: subs.fontColor, 
                  backgroundColor: subs.backgroundColor, 
                  opacity: subs.bgOpacity, 
                  borderRadius: `${subs.fontSize * subs.radiusMult}px`, 
                  padding: `${subs.fontSize * subs.paddingVMult}px ${subs.fontSize * subs.paddingHMult}px`, 
                  textAlign: subs.textAlign, 
                  maxWidth: '90%', 
                  lineHeight: '1.4', 
                  fontWeight: 600, 
                  fontFamily: subs.fontFamily,
                  border: '1px solid rgba(255,255,255,0.1)',
                  whiteSpace: 'pre-wrap',
                  boxShadow: '0 20px 40px rgba(0,0,0,0.4)'
                }}
                dangerouslySetInnerHTML={{ __html: currentBeat.id.startsWith('title') ? title : currentBeat.id.startsWith('credits') ? credits : currentBeat.caption }}
              />
            </div>
          </div>
        )}

        {isRendering && (
          <div className="absolute inset-0 z-[100] bg-black/98 backdrop-blur-2xl flex flex-col items-center justify-center p-12 text-center animate-in fade-in">
            <div className="relative w-48 h-48">
              <svg className="w-full h-full" viewBox="0 0 100 100">
                <circle className="text-white/5 stroke-current" strokeWidth="6" fill="transparent" r="42" cx="50" cy="50" />
                <circle 
                  className="text-indigo-500 stroke-current transition-all duration-300" 
                  strokeWidth="6" 
                  strokeDasharray={2 * Math.PI * 42} 
                  strokeDashoffset={2 * Math.PI * 42 * (1 - renderProgress / 100)} 
                  strokeLinecap="round" 
                  fill="transparent" 
                  r="42" cx="50" cy="50" 
                  transform="rotate(-90 50 50)"
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-4xl font-black text-white mono">{renderProgress}%</span>
              </div>
            </div>
            <h4 className="mt-8 text-[11px] font-black uppercase tracking-[0.4em] text-indigo-400 animate-pulse">{renderStatus}</h4>
          </div>
        )}
      </div>
    </div>
  );
};

export default CinemaPreview;

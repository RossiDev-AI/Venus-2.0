import React, { useMemo, useState } from 'react';
import { Tldraw, createTLStore, defaultShapeUtils, TLUiOverrides, Editor, TLShapeId, createShapeId, exportToCanvas } from 'tldraw';
import { AppSettings } from '../../types';
import { LuminaImageShapeUtil } from './LuminaImageShapeUtil';
import { useLuminaAI } from '../../hooks/useLuminaAI';
import { executeGenerativeInpaint } from '../../LuminaGeminiService';

interface LuminaStudioProps {
  settings: AppSettings;
}

const customShapeUtils = [LuminaImageShapeUtil, ...defaultShapeUtils];

const LuminaStudio: React.FC<LuminaStudioProps> = ({ settings }) => {
  const { isReady, isModelLoading, progress, loadModel, segmentImage } = useLuminaAI();
  const [magicPrompt, setMagicPrompt] = useState('');
  const [isSynthesizing, setIsSynthesizing] = useState(false);
  const [selectedImageId, setSelectedImageId] = useState<TLShapeId | null>(null);
  
  const store = useMemo(() => createTLStore({ shapeUtils: customShapeUtils }), []);

  const handleMount = (editor: Editor) => {
    (window as any).luminaEditor = editor;
    
    // Listen for selection changes to show/hide the Magic Toolbar
    editor.sideEffects.registerAfterChange('instance_state', (_prev, next) => {
      const selected = editor.getSelectedShapeIds();
      if (selected.length === 1) {
        const shape = editor.getShape(selected[0]);
        if (shape?.type === 'lumina-image') {
          setSelectedImageId(shape.id);
          return;
        }
      }
      setSelectedImageId(null);
    });
  };

  const prepareAIPayload = async (editor: Editor, shapeId: TLShapeId) => {
    const shape = editor.getShape(shapeId);
    if (!shape || shape.type !== 'lumina-image') return null;

    // 1. Capture Base Image from PixiJS
    // We access the Pixi canvas inside the shape. 
    // Since we don't have a direct ref here, we can use tldraw's export logic 
    // but filtered for just the image, or better, ask the Pixi instance.
    // For simplicity in this architecture, we'll use the original URL or the current processed URL.
    const baseImageBase64 = (shape.props as any).url;

    // 2. Generate Binary Mask from drawings
    const bounds = editor.getShapePageBounds(shapeId)!;
    const drawings = editor.getCurrentPageShapes().filter(s => 
      s.type === 'draw' && editor.getShapePageBounds(s.id)?.overlaps(bounds)
    );

    if (drawings.length === 0) {
      alert("Lumina Oracle: Nenhum desenho (máscara) detectado sobre o buffer.");
      return null;
    }

    // Export drawings as a binary mask
    // We create a temporary canvas to render drawings in white on black background
    const canvas = document.createElement('canvas');
    canvas.width = (shape.props as any).w;
    canvas.height = (shape.props as any).h;
    const ctx = canvas.getContext('2d')!;
    
    ctx.fillStyle = 'black';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // We use tldraw to export the drawings to a canvas, then draw it onto our mask canvas
    const maskCanvas = await exportToCanvas(editor, drawings.map(d => d.id), {
        background: false,
        padding: 0,
        bounds: bounds,
    });

    // Draw the drawings in white (mask area)
    ctx.globalCompositeOperation = 'source-over';
    ctx.filter = 'brightness(0) invert(1)'; // Turn drawings white
    ctx.drawImage(maskCanvas, 0, 0, canvas.width, canvas.height);
    
    return {
      base: baseImageBase64,
      mask: canvas.toDataURL('image/png'),
    };
  };

  const handleGenerativeInpaint = async () => {
    const editor = (window as any).luminaEditor as Editor;
    if (!editor || !selectedImageId || !magicPrompt.trim()) return;

    setIsSynthesizing(true);
    try {
      const payload = await prepareAIPayload(editor, selectedImageId);
      if (!payload) {
        setIsSynthesizing(false);
        return;
      }

      const resultUrl = await executeGenerativeInpaint({
        baseImageBase64: payload.base,
        maskBase64: payload.mask,
        prompt: magicPrompt,
        settings,
      });

      // Undo/Redo Snapshot is handled by editor.mark()
      editor.mark('lumina-inpaint');

      // Update the shape with the new image
      editor.updateShape({
        id: selectedImageId,
        type: 'lumina-image',
        props: {
          ...editor.getShape(selectedImageId)!.props,
          url: resultUrl,
          maskUrl: undefined, // Clear old segmentation mask
        }
      } as any);

      setMagicPrompt('');
      alert("Lumina Oracle: Síntese regenerativa concluída e injetada no buffer.");
    } catch (e) {
      alert("Lumina Error: " + e);
    } finally {
      setIsSynthesizing(false);
    }
  };

  const overrides: TLUiOverrides = {
    tools(editor, tools) {
      return {
        ...tools,
        'venus-gen': {
          id: 'venus-gen',
          icon: 'external-link',
          label: 'Gerar com V-nus',
          kbd: 'g',
          onSelect: () => {
            const editor = (window as any).luminaEditor as Editor;
            if (!editor) return;
            const url = `https://picsum.photos/seed/${Math.random()}/800/600`;
            editor.createShape({
              type: 'lumina-image',
              x: editor.getViewportPageBounds().centerX - 400,
              y: editor.getViewportPageBounds().centerY - 300,
              props: { w: 800, h: 600, url, brightness: 1, contrast: 1.1, saturation: 1.2, blur: 0 },
            });
          },
        },
      }
    },
    contextMenu(editor, schema) {
      schema.addMenuItem('venus-group', {
        id: 'venus-cutout',
        label: 'Auto-Magic Cutout',
        icon: 'magic-wand',
        onSelect: async () => {
            const selected = editor.getSelectedShapes();
            if (selected.length === 0 || selected[0].type !== 'lumina-image') return;
            if (!isReady) {
              if (confirm("Lumina Oracle: O 'Cérebro' de segmentação (~20MB) precisa ser inicializado. Prosseguir?")) loadModel();
              return;
            }
            const shape = selected[0];
            editor.updateShape({ id: shape.id, type: 'lumina-image', props: { ...shape.props, isProcessingMask: true } } as any);
            try {
              const maskUrl = await segmentImage((shape.props as any).url);
              editor.updateShape({ id: shape.id, type: 'lumina-image', props: { ...shape.props, maskUrl, isProcessingMask: false } } as any);
            } catch (e) {
              editor.updateShape({ id: shape.id, type: 'lumina-image', props: { ...shape.props, isProcessingMask: false } } as any);
            }
        },
      });
      return schema;
    }
  };

  return (
    <div className="w-full h-full bg-[#020202] relative overflow-hidden flex flex-col">
      {/* Lumina Status Bar */}
      <div className="h-8 bg-zinc-900/50 border-b border-white/5 flex items-center justify-between px-6 z-50 pointer-events-none">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <div className={`w-1.5 h-1.5 rounded-full ${isReady ? 'bg-emerald-500 shadow-[0_0_8px_#10b981]' : 'bg-indigo-500 animate-pulse'}`} />
            <span className="text-[8px] mono font-black text-indigo-400 uppercase tracking-widest">
                {isReady ? 'Lumina_IA_Core_Ready' : 'Lumina_Engine_Standby'}
            </span>
          </div>
          <span className="text-[8px] mono text-zinc-700 font-bold uppercase">Buffer: PixiJS_v8.0</span>
        </div>
        <div className="flex gap-4">
          <span className="text-[8px] mono text-zinc-700 font-bold uppercase">Synthesizing: {isSynthesizing ? 'Active' : 'Idle'}</span>
          <span className="text-[8px] mono text-zinc-700 font-bold uppercase">Kernel: v16_Generative_Inpaint</span>
        </div>
      </div>

      {/* Magic Toolbar (Floating) */}
      {selectedImageId && (
        <div className="absolute top-16 left-1/2 -translate-x-1/2 z-[300] animate-in slide-in-from-top-4 duration-500">
           <div className="bg-zinc-900/90 backdrop-blur-2xl border border-white/10 p-2 rounded-[2rem] shadow-[0_30px_60px_rgba(0,0,0,0.8)] flex items-center gap-3 w-[450px]">
              <div className="pl-4 pr-1">
                 <svg className="w-5 h-5 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M13.5 3L11 8.5L5.5 11L11 13.5L13.5 19L16 13.5L21.5 11L16 8.5L13.5 3Z" strokeWidth={2}/></svg>
              </div>
              <input 
                value={magicPrompt}
                onChange={(e) => setMagicPrompt(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleGenerativeInpaint()}
                placeholder="Descreva a alteração na máscara (ex: adicione óculos)..."
                className="flex-1 bg-transparent border-none outline-none text-xs text-white placeholder:text-zinc-600 font-bold"
              />
              <button 
                onClick={handleGenerativeInpaint}
                disabled={isSynthesizing || !magicPrompt.trim()}
                className={`px-5 py-2.5 rounded-full font-black text-[9px] uppercase tracking-widest transition-all ${isSynthesizing ? 'bg-indigo-600/50 animate-pulse text-white/50' : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-xl active:scale-95'}`}
              >
                {isSynthesizing ? 'Processando...' : 'Transformar'}
              </button>
           </div>
           <div className="mt-2 text-center">
              <span className="text-[7px] mono text-zinc-600 font-black uppercase tracking-widest">Dica: Use o Lápis (Pen) para desenhar a máscara de inpainting</span>
           </div>
        </div>
      )}

      {/* Main Tldraw Canvas */}
      <div className="flex-1 relative">
        <Tldraw 
          store={store}
          overrides={overrides}
          components={{
            SharePanel: () => (
              <div className="absolute top-4 right-4 z-[200] flex flex-col items-end gap-2">
                <div className="flex gap-2">
                    {!isReady && !isModelLoading && (
                      <button onClick={loadModel} className="bg-zinc-800 hover:bg-zinc-700 text-zinc-400 px-4 py-2.5 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all border border-white/5">Ativar IA_Cortex</button>
                    )}
                </div>
                {isModelLoading && (
                   <div className="w-full max-w-[200px] space-y-1.5 animate-in slide-in-from-top-2">
                      <div className="flex justify-between items-center text-[7px] mono font-black text-indigo-400 uppercase tracking-widest">
                         <span>Download_Brain: Segformer_b0</span>
                         <span>{Math.round(progress * 100)}%</span>
                      </div>
                      <div className="h-1 bg-zinc-900 rounded-full border border-white/5 overflow-hidden">
                         <div className="h-full bg-indigo-500 transition-all duration-300" style={{ width: `${progress * 100}%` }} />
                      </div>
                   </div>
                )}
              </div>
            ),
            MainMenu: null,
          }}
          onMount={handleMount}
          inferDarkMode
          className="venus-lumina-canvas"
        />
      </div>

      <style>{`
        .venus-lumina-canvas .tl-ui-layout { background-color: transparent !important; }
        .venus-lumina-canvas .tl-canvas { background-color: #020202 !important; }
        .venus-lumina-canvas .tl-toolbar {
           background-color: rgba(10, 10, 12, 0.8) !important;
           backdrop-filter: blur(20px) !important;
           border: 1px solid rgba(255, 255, 255, 0.05) !important;
           border-radius: 20px !important;
           bottom: 30px !important;
        }
        .venus-lumina-canvas .tl-ui-button { color: #666 !important; }
        .venus-lumina-canvas .tl-ui-button:hover { color: #fff !important; background-color: rgba(99, 102, 241, 0.1) !important; }
        .venus-lumina-canvas .tl-ui-button[data-state="active"] { color: #6366f1 !important; }
      `}</style>
    </div>
  );
};

export default LuminaStudio;

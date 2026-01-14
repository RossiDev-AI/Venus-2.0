import React, { useMemo, useState } from 'react';
import { Tldraw, createTLStore, defaultShapeUtils, TLUiOverrides, Editor, TLShapeId, exportToCanvas } from 'tldraw';
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
    
    // Side Effect para monitorar seleção e exibir Toolbar Mágica
    editor.sideEffects.registerAfterChange('instance_state', () => {
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

    const bounds = editor.getShapePageBounds(shapeId)!;
    
    // Captura apenas os desenhos feitos com a caneta sobre o shape selecionado
    const drawings = editor.getCurrentPageShapes().filter(s => 
      s.type === 'draw' && editor.getShapePageBounds(s.id)?.overlaps(bounds)
    );

    if (drawings.length === 0) {
      alert("Lumina Oracle: Desenhe uma máscara com a ferramenta Lápis (P) sobre a imagem para editar.");
      return null;
    }

    // Rasterização da Máscara Binária
    const canvas = document.createElement('canvas');
    canvas.width = (shape.props as any).w;
    canvas.height = (shape.props as any).h;
    const ctx = canvas.getContext('2d')!;
    
    // Background Preto (Área protegida)
    ctx.fillStyle = 'black';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Exporta apenas os desenhos para um canvas temporário
    const maskContentCanvas = await exportToCanvas(editor, drawings.map(d => d.id), {
        background: false,
        padding: 0,
        bounds: bounds,
    });

    // Inverte e rasteriza em Branco (Área de alteração)
    ctx.globalCompositeOperation = 'source-over';
    ctx.filter = 'brightness(0) invert(1)'; 
    ctx.drawImage(maskContentCanvas, 0, 0, canvas.width, canvas.height);
    
    return {
      base: (shape.props as any).url,
      mask: canvas.toDataURL('image/png'),
    };
  };

  const handleMagicRefine = async () => {
    const editor = (window as any).luminaEditor as Editor;
    if (!editor || !selectedImageId || !magicPrompt.trim()) return;

    setIsSynthesizing(true);
    editor.updateShape({ id: selectedImageId, type: 'lumina-image', props: { isProcessingMask: true } } as any);

    try {
      const payload = await prepareAIPayload(editor, selectedImageId);
      if (!payload) throw new Error("Payload falhou.");

      const resultUrl = await executeGenerativeInpaint({
        baseImageBase64: payload.base,
        maskBase64: payload.mask,
        prompt: magicPrompt,
        settings,
      });

      // Salva snapshot para Undo/Redo
      editor.mark('lumina-refine');

      editor.updateShape({
        id: selectedImageId,
        type: 'lumina-image',
        props: {
          ...editor.getShape(selectedImageId)!.props,
          url: resultUrl,
          isProcessingMask: false,
          maskUrl: undefined, 
        }
      } as any);

      // Limpa os desenhos da máscara após o processamento bem sucedido
      const bounds = editor.getShapePageBounds(selectedImageId)!;
      const drawings = editor.getCurrentPageShapes().filter(s => 
        s.type === 'draw' && editor.getShapePageBounds(s.id)?.overlaps(bounds)
      );
      editor.deleteShapes(drawings.map(d => d.id));

      setMagicPrompt('');
      alert("Lumina Oracle: Realidade alternativa injetada com sucesso.");
    } catch (e) {
      editor.updateShape({ id: selectedImageId, type: 'lumina-image', props: { isProcessingMask: false } } as any);
      alert("Lumina Kernel Error: Falha na síntese neural.");
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
            const url = `https://picsum.photos/seed/${Math.floor(Math.random() * 1000)}/1024/768`;
            editor.createShape({
              type: 'lumina-image',
              x: editor.getViewportPageBounds().centerX - 400,
              y: editor.getViewportPageBounds().centerY - 300,
              props: { w: 1024, h: 768, url, brightness: 1, contrast: 1.05, saturation: 1.1, blur: 0 },
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
              if (confirm("Ativar IA Cortex Local (Segformer ~20MB)?")) loadModel();
              return;
            }
            const shape = selected[0];
            editor.updateShape({ id: shape.id, type: 'lumina-image', props: { isProcessingMask: true } } as any);
            try {
              const maskUrl = await segmentImage((shape.props as any).url);
              editor.updateShape({ id: shape.id, type: 'lumina-image', props: { maskUrl, isProcessingMask: false } } as any);
            } catch (e) {
              editor.updateShape({ id: shape.id, type: 'lumina-image', props: { isProcessingMask: false } } as any);
            }
        },
      });
      return schema;
    }
  };

  return (
    <div className="w-full h-full bg-[#020202] relative overflow-hidden flex flex-col">
      {/* Lumina Terminal Status */}
      <div className="h-8 bg-zinc-900/80 border-b border-white/5 flex items-center justify-between px-6 z-50 pointer-events-none backdrop-blur-xl">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <div className={`w-1.5 h-1.5 rounded-full ${isReady ? 'bg-emerald-500 shadow-[0_0_8px_#10b981]' : 'bg-indigo-500 animate-pulse'}`} />
            <span className="text-[8px] mono font-black text-indigo-400 uppercase tracking-widest">
                {isReady ? 'Lumina_IA_Core_Ready' : 'Lumina_Engine_Standby'}
            </span>
          </div>
          <span className="text-[8px] mono text-zinc-600 font-bold uppercase tracking-tighter">GPU_Buffer: Pixi_v8.0</span>
        </div>
        <div className="flex gap-6">
          <span className="text-[8px] mono text-zinc-700 font-bold uppercase">Kernel: v17_Generative_Refine</span>
          <span className="text-[8px] mono text-zinc-700 font-bold uppercase">Memory: {isSynthesizing ? 'Locked' : 'Available'}</span>
        </div>
      </div>

      {/* Magic Toolbar */}
      {selectedImageId && (
        <div className="absolute top-14 left-1/2 -translate-x-1/2 z-[300] animate-in slide-in-from-top-4 duration-700 ease-out">
           <div className="bg-zinc-900/90 backdrop-blur-3xl border border-white/10 p-2.5 rounded-[2.5rem] shadow-[0_40px_100px_rgba(0,0,0,0.9)] flex items-center gap-4 w-[500px]">
              <div className="pl-5">
                 <svg className={`w-6 h-6 ${isSynthesizing ? 'text-indigo-400 animate-spin' : 'text-indigo-500'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M13.5 3L11 8.5L5.5 11L11 13.5L13.5 19L16 13.5L21.5 11L16 8.5L13.5 3Z" strokeWidth={2.5}/></svg>
              </div>
              <input 
                value={magicPrompt}
                onChange={(e) => setMagicPrompt(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleMagicRefine()}
                placeholder="Descreva a alteração na máscara..."
                className="flex-1 bg-transparent border-none outline-none text-xs text-white placeholder:text-zinc-700 font-black uppercase tracking-widest"
              />
              <button 
                onClick={handleMagicRefine}
                disabled={isSynthesizing || !magicPrompt.trim()}
                className={`px-8 py-3 rounded-full font-black text-[10px] uppercase tracking-[0.2em] transition-all ${isSynthesizing ? 'bg-indigo-600/20 text-indigo-400/50 cursor-wait' : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-2xl active:scale-95'}`}
              >
                Magic Refine
              </button>
           </div>
           <div className="mt-3 text-center opacity-40">
              <span className="text-[7px] mono text-white font-black uppercase tracking-[0.4em]">Use Pen (P) to define refinement zone</span>
           </div>
        </div>
      )}

      {/* Tldraw Canvas */}
      <div className="flex-1 relative">
        <Tldraw 
          store={store}
          overrides={overrides}
          components={{
            SharePanel: () => (
              <div className="absolute top-4 right-4 z-[200] flex flex-col items-end gap-3">
                <div className="flex gap-3">
                    {!isReady && !isModelLoading && (
                      <button onClick={loadModel} className="bg-zinc-800/80 hover:bg-zinc-700 text-zinc-400 px-5 py-2.5 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all border border-white/5 backdrop-blur-md">Init IA_Cortex</button>
                    )}
                </div>
                {isModelLoading && (
                   <div className="w-48 space-y-2 bg-black/60 p-3 rounded-2xl border border-white/5 backdrop-blur-xl animate-in fade-in slide-in-from-right-4">
                      <div className="flex justify-between items-center text-[7px] mono font-black text-indigo-400 uppercase tracking-widest">
                         <span>Down_Brain: Segformer</span>
                         <span>{Math.round(progress * 100)}%</span>
                      </div>
                      <div className="h-1 bg-zinc-900 rounded-full overflow-hidden">
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
           background-color: rgba(10, 10, 12, 0.85) !important;
           backdrop-filter: blur(30px) !important;
           border: 1px solid rgba(255, 255, 255, 0.08) !important;
           border-radius: 24px !important;
           bottom: 40px !important;
           box-shadow: 0 20px 60px rgba(0,0,0,0.6) !important;
        }
        .venus-lumina-canvas .tl-ui-button { color: #555 !important; }
        .venus-lumina-canvas .tl-ui-button:hover { color: #fff !important; background-color: rgba(99, 102, 241, 0.15) !important; }
        .venus-lumina-canvas .tl-ui-button[data-state="active"] { color: #6366f1 !important; }
      `}</style>
    </div>
  );
};

export default LuminaStudio;

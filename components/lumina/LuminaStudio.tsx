import React, { useMemo, useState, useEffect, useRef } from 'react';
import { Tldraw, createTLStore, defaultShapeUtils, TLUiOverrides, Editor, TLShapeId, debounce } from 'tldraw';
import { AppSettings, LuminaImageShape, LuminaPreset } from '../../types';
import { LuminaImageShapeUtil } from './LuminaImageShapeUtil';
import { SmartSelectorTool } from './SmartSelectorTool';
import { executeStyleAwareInpaint } from '../../InpaintingService';
import { saveSession, getAllUserPresets, savePreset } from '../../dbService';
import { LUMINA_PRESETS } from '../../presets';

interface LuminaStudioProps {
  settings: AppSettings;
}

const customShapeUtils = [LuminaImageShapeUtil, ...defaultShapeUtils];
const customTools = [SmartSelectorTool];

const LuminaStudio: React.FC<LuminaStudioProps> = ({ settings }) => {
  const [selectedId, setSelectedId] = useState<TLShapeId | null>(null);
  const [inpaintingPrompt, setInpaintingPrompt] = useState('');
  const [isSynthesizing, setIsSynthesizing] = useState(false);
  const [activePreset, setActivePreset] = useState<LuminaPreset | null>(null);
  const [userPresets, setUserPresets] = useState<LuminaPreset[]>([]);
  const editorRef = useRef<Editor | null>(null);
  
  const allPresets = useMemo(() => [...LUMINA_PRESETS, ...userPresets], [userPresets]);

  useEffect(() => {
    getAllUserPresets().then(setUserPresets);
  }, []);

  const store = useMemo(() => createTLStore({ shapeUtils: customShapeUtils }), []);

  useEffect(() => {
    if (!editorRef.current) return;
    const saveLoop = debounce(() => {
        const snapshot = editorRef.current!.store.getSnapshot();
        saveSession({
            id: 'default_session',
            name: 'V-nus Master Session',
            snapshot,
            timestamp: Date.now()
        });
    }, 5000);
    return editorRef.current!.store.listen(saveLoop);
  }, []);

  const handleMount = (editor: Editor) => {
    editorRef.current = editor;
    (window as any).luminaEditor = editor;
    editor.sideEffects.registerAfterChange('instance_state', () => {
      const selected = editor.getSelectedShapeIds();
      if (selected.length === 1 && editor.getShape(selected[0])?.type === 'lumina-image') {
          setSelectedId(selected[0]);
      } else {
          setSelectedId(null);
      }
    });
  };

  const applyPresetToSelected = (preset: LuminaPreset) => {
    setActivePreset(preset);
    if (!selectedId || !editorRef.current) return;
    
    editorRef.current.updateShape({
        id: selectedId,
        type: 'lumina-image',
        props: {
            // Added fix: Cast to any to avoid 'props' access error on generic TLShape
            ...(editorRef.current.getShape(selectedId) as any).props,
            ...preset.grading,
            activePresetId: preset.id
        }
    } as any);
  };

  const handleSaveCurrentAsPreset = async () => {
      if (!selectedId || !editorRef.current) return;
      // Added fix: Cast shape to any to avoid 'props' access error on LuminaImageShape
      const shape = editorRef.current.getShape(selectedId) as any;
      const name = prompt("Nome do seu estilo customizado:");
      if (!name) return;

      const newPreset: LuminaPreset = {
          id: `custom-${Date.now()}`,
          name,
          description: 'Estilo customizado do usuário.',
          promptSuffix: 'high quality, professional grading',
          grading: {
              exposure: shape.props.exposure,
              brightness: shape.props.brightness,
              contrast: shape.props.contrast,
              saturation: shape.props.saturation,
              hue: shape.props.hue,
              blur: shape.props.blur,
              lutPreset: shape.props.lutPreset
          },
          isCustom: true
      };

      await savePreset(newPreset);
      setUserPresets(prev => [...prev, newPreset]);
      alert("Estilo capturado e guardado no Vault.");
  };

  const handleStyleInpaint = async () => {
    if (!selectedId || !inpaintingPrompt.trim()) return;
    const editor = editorRef.current!;
    const shape = editor.getShape(selectedId) as LuminaImageShape;
    setIsSynthesizing(true);
    editor.updateShape({ id: selectedId, type: 'lumina-image', props: { isProcessingMask: true } } as any);

    try {
        const bounds = editor.getShapePageBounds(selectedId)!;
        const drawings = editor.getCurrentPageShapes().filter(s => s.type === 'draw' && editor.getShapePageBounds(s.id)?.overlaps(bounds));
        const svg = await editor.getSvg(drawings.map(d => d.id), { bounds, padding: 0 });
        const canvas = document.createElement('canvas');
        canvas.width = (shape as any).props.w; canvas.height = (shape as any).props.h;
        const ctx = canvas.getContext('2d')!;
        ctx.fillStyle = 'black'; ctx.fillRect(0,0,canvas.width, canvas.height);
        const svgData = new XMLSerializer().serializeToString(svg!);
        const img = new Image();
        img.src = `data:image/svg+xml;base64,${btoa(svgData)}`;
        await new Promise(r => img.onload = r);
        ctx.filter = 'brightness(0) invert(1)';
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

        const resultUrl = await executeStyleAwareInpaint({
            image: (shape as any).props.url,
            mask: canvas.toDataURL('image/png'),
            prompt: inpaintingPrompt,
            props: (shape as any).props,
            settings,
            activePreset: activePreset || undefined
        });

        editor.updateShape({
            id: selectedId,
            type: 'lumina-image',
            props: { ...(shape as any).props, url: resultUrl, isProcessingMask: false }
        } as any);
        editor.deleteShapes(drawings.map(d => d.id));
        setInpaintingPrompt('');
    } catch (e) {
        editor.updateShape({ id: selectedId, type: 'lumina-image', props: { isProcessingMask: false } } as any);
    } finally {
        setIsSynthesizing(false);
    }
  };

  const overrides: TLUiOverrides = {
    tools(editor, tools) {
      return { ...tools, 'smart-selector': { id: 'smart-selector', icon: 'select-face', label: 'Local IA', kbd: 's', onSelect: () => editor.setCurrentTool('smart-selector') } }
    },
    toolbar(editor, toolbar) {
        toolbar.push({ id: 'smart-selector', type: 'item', toolItem: { id: 'smart-selector', icon: 'select-face', label: 'Smart Selector', kbd: 's' } });
        return toolbar;
    }
  };

  return (
    <div className="w-full h-full bg-[#020202] relative overflow-hidden flex flex-col">
      {/* Sidebar de Presets */}
      <div className="absolute top-20 left-4 bottom-28 w-16 hover:w-64 transition-all duration-500 z-[500] bg-zinc-950/80 backdrop-blur-3xl border border-white/5 rounded-[2rem] overflow-hidden flex flex-col group shadow-2xl">
          <div className="p-4 border-b border-white/5 flex items-center justify-between">
              <span className="text-[10px] font-black text-indigo-400 uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity">Style Presets</span>
              <svg className="w-4 h-4 text-zinc-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M4 6h16M4 12h16m-7 6h7" strokeWidth={3}/></svg>
          </div>
          <div className="flex-1 overflow-y-auto p-2 space-y-2 custom-scrollbar">
              {allPresets.map(preset => (
                  <button 
                    key={preset.id}
                    onClick={() => applyPresetToSelected(preset)}
                    className={`w-full group/item flex items-center gap-4 p-2 rounded-2xl transition-all ${activePreset?.id === preset.id ? 'bg-indigo-600/20 border border-indigo-500/30' : 'hover:bg-white/5 border border-transparent'}`}
                  >
                      <div className="w-10 h-10 rounded-xl bg-zinc-900 shrink-0 flex items-center justify-center border border-white/5 overflow-hidden">
                          {/* Mini Preview Placeholder */}
                          <div className={`w-full h-full opacity-20 ${preset.id === 'analog-film' ? 'bg-amber-500' : preset.id === 'noir-industrial' ? 'bg-zinc-100' : 'bg-indigo-500'}`} />
                      </div>
                      <div className="flex flex-col text-left opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap overflow-hidden">
                          <span className="text-[10px] font-black text-white uppercase tracking-tighter">{preset.name}</span>
                          <span className="text-[8px] text-zinc-500 line-clamp-1 truncate">{preset.description}</span>
                      </div>
                  </button>
              ))}
          </div>
          {selectedId && (
            <button onClick={handleSaveCurrentAsPreset} className="p-4 bg-indigo-600 hover:bg-indigo-500 text-white flex items-center gap-4 opacity-0 group-hover:opacity-100 transition-opacity">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M12 4v16m8-8H4" strokeWidth={3}/></svg>
                <span className="text-[9px] font-black uppercase tracking-widest">Freeze DNA</span>
            </button>
          )}
      </div>

      {selectedId && (
          <div className="absolute top-16 left-1/2 -translate-x-1/2 z-[400] animate-in slide-in-from-top-6 duration-700">
              <div className="bg-zinc-900/90 backdrop-blur-3xl border border-white/10 p-2 rounded-[2.5rem] shadow-2xl flex items-center gap-4 min-w-[500px]">
                  <div className="flex-1 flex items-center gap-3 pl-6">
                      <div className="w-2 h-2 bg-indigo-500 rounded-full animate-pulse" />
                      <input 
                        value={inpaintingPrompt}
                        onChange={(e) => setInpaintingPrompt(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleStyleInpaint()}
                        placeholder="Synthesis Instruction..."
                        className="bg-transparent border-none outline-none text-xs text-white font-black uppercase tracking-widest flex-1"
                      />
                  </div>
                  <div className="flex gap-2">
                      <button onClick={handleStyleInpaint} disabled={isSynthesizing} className="bg-indigo-600 hover:bg-indigo-500 text-white px-8 py-3 rounded-full text-[10px] font-black uppercase tracking-widest active:scale-95 transition-all">Refine</button>
                  </div>
              </div>
          </div>
      )}

      <div className="flex-1 relative">
        <Tldraw 
          store={store}
          overrides={overrides}
          tools={customTools}
          onMount={handleMount}
          inferDarkMode
          className="venus-lumina-canvas"
        />
      </div>

      <style>{`
        .venus-lumina-canvas .tl-ui-layout { background-color: transparent !important; }
        .venus-lumina-canvas .tl-canvas { background-color: #020202 !important; }
        .venus-lumina-canvas .tl-toolbar { background-color: rgba(10,10,12,0.85) !important; border-radius: 24px !important; bottom: 40px !important; border: 1px solid rgba(255,255,255,0.05) !important; }
        .custom-scrollbar::-webkit-scrollbar { width: 3px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 10px; }
      `}</style>
    </div>
  );
};

export default LuminaStudio;
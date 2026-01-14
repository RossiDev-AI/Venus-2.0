import React from 'react';
import {
  Tldraw,
  createTLStore,
  defaultShapeUtils,
  Editor,
  ShapeUtil,
  HTMLContainer,
  Rectangle2d,
  StateNode,
  TLShapeId
} from 'tldraw';
import * as PIXI from 'pixi.js';
import { motion, AnimatePresence, PanInfo } from 'framer-motion';
import {
  MousePointer2,
  Wand2,
  Download,
  Cpu,
  Palette,
  Sun,
  Database,
  ChevronUp,
  ChevronDown,
  Loader2,
  Maximize2,
  Minimize2,
  Trash2,
  Menu,
  X,
  Camera,
  Layers
} from 'lucide-react';
import { useVenusStore } from '../../store/useVenusStore';
import { LUMINA_PRESETS } from '../../presets';
import { useDeviceType } from '../../hooks/useDeviceType';
import { LuminaShaderEngine } from './LuminaShaderEngine';

// --- REACT HOOKS FIX ---
// Destructuring hooks from the default export guarantees we use the 
// specific React instance loaded in this module scope.
const {
  useState,
  useEffect,
  useRef,
  useMemo,
  useLayoutEffect,
  useCallback
} = React;

// --- TYPES ---
interface LuminaImageProps {
  w: number;
  h: number;
  url: string;
  isScanning?: boolean;
  brightness: number;
  contrast: number;
  exposure: number;
  saturation: number;
  hue: number;
  blur: number;
  grading?: any;
}

type LuminaImageShape = import('tldraw').TLBaseShape<'lumina-image', LuminaImageProps>;

const INITIAL_PRESET = {
  name: 'Standard',
  grading: {
    brightness: 1,
    contrast: 1,
    exposure: 0,
    saturation: 1,
    hue: 0,
    blur: 0
  }
};

// --- INLINED COMPONENTS TO PREVENT HOOK CONTEXT LOSS ---

// 1. LuminaImageComponent (Rendered inside Tldraw Canvas)
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
        antialias: !isLite,
        resolution: isLite ? 1 : (window.devicePixelRatio || 1),
        autoDensity: true
      });

      if (!isMounted) {
        app.destroy(true, { children: true, texture: true, baseTexture: true });
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
        if (isLite) app.render();
      } catch (e) {
        console.warn("PIXI Load Error", e);
      }
    };
    init();
    return () => {
      isMounted = false;
      if (pixiAppRef.current) pixiAppRef.current.destroy(true, { children: true, texture: true, baseTexture: true });
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
    <HTMLContainer 
      ref={containerRef} 
      style={{ width: (shape as any).props.w, height: (shape as any).props.h, overflow: 'hidden', position: 'relative', pointerEvents: 'none' }}
    >
      {(shape as any).props.isScanning && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/40 backdrop-blur-sm z-10">
          <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
        </div>
      )}
    </HTMLContainer>
  );
};

// 2. Shape Util Definition
class LuminaImageShapeUtil extends ShapeUtil<LuminaImageShape> {
  static type = 'lumina-image' as const;
  getDefaultProps(): any { 
    return { w: 300, h: 300, url: '', isScanning: false, brightness: 1, contrast: 1, exposure: 0, saturation: 1, hue: 0, blur: 0 }; 
  }
  getGeometry(shape: LuminaImageShape) { 
    return new Rectangle2d({ width: (shape as any).props.w, height: (shape as any).props.h, isFilled: true }); 
  }
  component(shape: LuminaImageShape) { return <LuminaImageComponent shape={shape} />; }
  indicator(shape: LuminaImageShape) { return <rect width={(shape as any).props.w} height={(shape as any).props.h} />; }
}

// 3. Smart Tool Definition
class SmartSelectorTool extends StateNode {
  static id = 'smart-selector';
  onPointerDown() {
    const editor = (this as any).editor as Editor;
    const point = editor.inputs.currentPagePoint;
    const hitShape = [...editor.getCurrentPageShapes()].reverse().find((s: any) => {
      if (s.type !== 'lumina-image') return false;
      const bounds = editor.getShapePageBounds(s.id)!;
      return bounds.expandBy(5).containsPoint(point);
    });
    if (hitShape) this.processSelection(hitShape.id);
  }
  async processSelection(shapeId: TLShapeId) {
    const editor = (this as any).editor as Editor;
    const shape = editor.getShape(shapeId)!;
    editor.updateShape({ id: shapeId, type: 'lumina-image', props: { ...shape.props, isScanning: true } } as any);
    
    // Simulating async process for visual feedback
    setTimeout(() => {
      editor.updateShape({ id: shapeId, type: 'lumina-image', props: { ...shape.props, isScanning: false } } as any);
      editor.setSelectedShapes([shapeId]);
    }, 1000);
  }
}

// 4. Mobile HUD Component
const MobileBottomHUD: React.FC<{ 
  onRegenerate: () => void, 
  activePreset: any, 
  onUpdateProps: (key: string, val: number) => void,
  isVisible: boolean
}> = ({ onRegenerate, activePreset, onUpdateProps, isVisible }) => {
  const { setSynthesizing } = useVenusStore();
  const [activeTab, setActiveTab] = useState<'Geração' | 'Croma' | 'Luz' | 'Vault'>('Geração');
  const [isOpen, setIsOpen] = useState(false);

  const handleDragEnd = (_: any, info: PanInfo) => {
    if (info.velocity.y > 20 || info.offset.y > 100) setIsOpen(false);
    else if (info.velocity.y < -20 || info.offset.y < -100) setIsOpen(true);
  };

  const renderSlider = (label: string, key: string, min: number, max: number, step: number) => {
    const val = (activePreset.grading as any)?.[key] ?? (min + max) / 2;
    return (
      <div className="space-y-4 py-2">
        <div className="flex justify-between items-center px-1">
          <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">{label}</span>
          <span className="text-[10px] font-bold text-indigo-400">{val.toFixed(2)}</span>
        </div>
        <div className="relative h-6 flex items-center">
          <div className="absolute w-full h-[2px] bg-zinc-800 rounded-full" />
          <div className="absolute h-[2px] bg-indigo-500" style={{ width: `${((val - min) / (max - min)) * 100}%` }} />
          <input type="range" min={min} max={max} step={step} value={val} onChange={(e) => onUpdateProps(key, parseFloat(e.target.value))} className="absolute w-full h-full opacity-0 cursor-pointer z-10" />
          <div className="absolute w-5 h-5 bg-white border-2 border-indigo-500 rounded-full shadow-lg pointer-events-none" style={{ left: `calc(${((val - min) / (max - min)) * 100}% - 10px)` }} />
        </div>
      </div>
    );
  };

  return (
    <motion.div
      initial="closed"
      animate={isOpen ? "open" : "closed"}
      variants={{ open: { y: '0%' }, closed: { y: '88%' } }}
      drag="y"
      dragConstraints={{ top: 0, bottom: 0 }}
      dragElastic={0.05}
      onDragEnd={handleDragEnd}
      className="fixed inset-x-0 bottom-0 z-[1000] bg-black/80 backdrop-blur-2xl border-t border-indigo-500/20 rounded-t-[2.5rem] flex flex-col h-[65vh] shadow-[0_-20px_50px_rgba(0,0,0,0.8)]"
    >
      <div className="flex flex-col items-center py-4 shrink-0">
        <div className="w-12 h-1 bg-zinc-800 rounded-full mb-4" />
        <div className="flex justify-around w-full px-4">
          {[
            { id: 'Geração', icon: <Wand2 size={18} /> },
            { id: 'Croma', icon: <Palette size={18} /> },
            { id: 'Luz', icon: <Sun size={18} /> },
            { id: 'Vault', icon: <Database size={18} /> }
          ].map(tab => (
            <button key={tab.id} onClick={() => { setActiveTab(tab.id as any); setIsOpen(true); }} className={`p-3 rounded-2xl transition-all flex flex-col items-center gap-1 ${activeTab === tab.id ? 'text-indigo-400 scale-110' : 'text-zinc-600'}`}>{tab.icon}<span className="text-[7px] font-black uppercase">{tab.id}</span></button>
          ))}
        </div>
      </div>
      <div className="flex-1 overflow-y-auto px-8 pb-12 custom-scrollbar">
        <AnimatePresence mode="wait">
          <motion.div key={activeTab} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-8 pt-4">
            {activeTab === 'Geração' && (
              <div className="space-y-6">
                <div className="space-y-2">
                  <label className="text-[9px] font-black text-zinc-500 uppercase tracking-widest px-1">Meta-Directive</label>
                  <textarea className="w-full h-24 bg-white/5 border border-white/10 rounded-2xl p-4 text-xs text-white outline-none focus:border-indigo-500/40" placeholder="Refine a síntese aqui..." />
                </div>
                <button onClick={onRegenerate} className="w-full py-5 bg-indigo-600 text-white rounded-2xl font-black uppercase tracking-[0.4em] text-[10px] shadow-xl shadow-indigo-900/40">Regenerar DNA</button>
              </div>
            )}
            {activeTab === 'Croma' && <div className="space-y-4">{renderSlider('Saturação', 'saturation', 0, 2, 0.01)}{renderSlider('Contraste', 'contrast', 0.5, 1.5, 0.01)}{renderSlider('Matiz (Hue)', 'hue', -180, 180, 1)}</div>}
            {activeTab === 'Luz' && <div className="space-y-4">{renderSlider('Exposição', 'exposure', -2, 2, 0.01)}{renderSlider('Brilho', 'brightness', 0.5, 1.5, 0.01)}</div>}
            {activeTab === 'Vault' && <div className="grid grid-cols-3 gap-3">{[1, 2, 3, 4, 5, 6].map(i => <div key={i} className="aspect-square bg-white/5 border border-white/10 rounded-xl animate-pulse" />)}</div>}
          </motion.div>
        </AnimatePresence>
      </div>
      <button onClick={() => setIsOpen(!isOpen)} className="absolute -top-12 left-1/2 -translate-x-1/2 w-10 h-10 bg-indigo-600 rounded-full flex items-center justify-center border border-indigo-400 shadow-2xl text-white md:hidden">
        <motion.div animate={{ rotate: isOpen ? 180 : 0 }}><ChevronUp size={20} /></motion.div>
      </button>
    </motion.div>
  );
};

// --- MAIN STUDIO ---

const LuminaStudio: React.FC<{ settings?: any }> = ({ settings }) => {
  const editorRef = useRef<Editor | null>(null);
  const { isMobile } = useDeviceType();
  const [activePreset, setActivePreset] = useState(INITIAL_PRESET);
  const [isSynthesizing, setSynthesizing] = useState(false);
  const [isUIVisible, setIsUIVisible] = useState(true);
  const [isQuickMenuOpen, setIsQuickMenuOpen] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const customShapeUtils = [LuminaImageShapeUtil, ...defaultShapeUtils];
  const customTools = [SmartSelectorTool];

  const handleMount = (editor: Editor) => {
    editorRef.current = editor;
    editor.setCurrentTool('select');
    if (isMobile) {
      editor.updateInstanceState({ isRulerMode: false, isGridMode: false });
    }
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().then(() => setIsFullscreen(true)).catch(() => {});
    } else {
      document.exitFullscreen().then(() => setIsFullscreen(false)).catch(() => {});
    }
    setIsQuickMenuOpen(false);
  };

  const handleExport = async () => {
    if (!editorRef.current) return;
    const selectedIds = editorRef.current.getSelectedShapeIds();
    const ids = selectedIds.length > 0 ? selectedIds : editorRef.current.getCurrentPageShapeIds();
    const svg = await editorRef.current.getSvg(Array.from(ids));
    if (svg) {
      const svgString = new XMLSerializer().serializeToString(svg);
      const blob = new Blob([svgString], { type: 'image/svg+xml' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `LUMINA_EXPORT_${Date.now()}.svg`;
      link.click();
    }
    setIsQuickMenuOpen(false);
  };

  const handleClear = () => {
    if (editorRef.current) {
      editorRef.current.selectAll().deleteShapes(editorRef.current.getSelectedShapeIds());
    }
    setIsQuickMenuOpen(false);
  };

  const updateProps = (key: string, val: number) => {
    setActivePreset(prev => ({ ...prev, grading: { ...prev.grading, [key]: val } }));
    if (editorRef.current) {
      editorRef.current.getSelectedShapeIds().forEach(id => {
        const shape = editorRef.current?.getShape(id);
        if (shape?.type === 'lumina-image') {
          editorRef.current?.updateShape({ id, type: 'lumina-image', props: { ...shape.props, [key]: val } } as any);
        }
      });
    }
  };

  return (
    <div 
      className="w-[100vw] h-[100dvh] bg-[#020202] relative overflow-hidden flex flex-col"
      style={{ touchAction: 'none' }}
    >
      <AnimatePresence>
        {isUIVisible && (
          <motion.div 
            initial={{ y: -50, opacity: 0 }} 
            animate={{ y: 0, opacity: 1 }} 
            exit={{ y: -50, opacity: 0 }}
            className="absolute top-4 left-4 right-4 z-[500] flex justify-between items-center pointer-events-none"
          >
            <div className="bg-black/80 backdrop-blur-xl border border-white/10 px-4 py-2 rounded-full flex items-center gap-3 pointer-events-auto shadow-2xl">
              <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_10px_#10b981]" />
              <span className="text-[8px] font-black text-white uppercase tracking-widest">Kernel v1.5 Stable</span>
            </div>
            {isSynthesizing && (
              <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} className="bg-indigo-600 px-4 py-2 rounded-full border border-indigo-400 flex items-center gap-2">
                <Cpu size={12} className="animate-spin text-white" />
                <span className="text-[8px] font-black text-white uppercase tracking-widest">Synthesizing...</span>
              </motion.div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex-1 w-full relative z-10">
        <Tldraw 
          store={useMemo(() => createTLStore({ shapeUtils: customShapeUtils }), [])} 
          onMount={handleMount}
          tools={customTools}
          inferDarkMode 
          className="venus-lumina-canvas" 
          onPointerDown={() => isMobile && setIsUIVisible(false)}
          onPointerUp={() => isMobile && setIsUIVisible(true)}
        />
      </div>

      {/* Floating Action Button & Menu */}
      <div className="absolute bottom-6 right-6 z-[2000] flex flex-col items-end gap-4 pointer-events-auto">
        <AnimatePresence>
          {isQuickMenuOpen && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.8, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.8, y: 20 }}
              className="bg-black/90 backdrop-blur-2xl border border-white/10 p-2 rounded-[2rem] shadow-2xl flex flex-col gap-2 min-w-[200px]"
            >
              <button onClick={toggleFullscreen} className="flex items-center gap-3 w-full p-4 hover:bg-white/5 rounded-2xl transition-all">
                {isFullscreen ? <Minimize2 size={18} className="text-zinc-400" /> : <Maximize2 size={18} className="text-zinc-400" />}
                <span className="text-[10px] font-black text-white uppercase">{isFullscreen ? 'Sair Fullscreen' : 'Tela Cheia'}</span>
              </button>
              <button onClick={handleExport} className="flex items-center gap-3 w-full p-4 hover:bg-white/5 rounded-2xl transition-all">
                <Camera size={18} className="text-indigo-400" />
                <span className="text-[10px] font-black text-white uppercase">Exportar Cena</span>
              </button>
              <button onClick={handleClear} className="flex items-center gap-3 w-full p-4 hover:bg-red-500/10 rounded-2xl transition-all">
                <Trash2 size={18} className="text-red-500" />
                <span className="text-[10px] font-black text-red-500 uppercase">Limpar Canvas</span>
              </button>
            </motion.div>
          )}
        </AnimatePresence>
        
        <button 
          onClick={() => setIsQuickMenuOpen(!isQuickMenuOpen)}
          className={`w-16 h-16 rounded-full flex items-center justify-center transition-all shadow-2xl border border-white/10 ${isQuickMenuOpen ? 'bg-zinc-800 rotate-90' : 'bg-indigo-600'}`}
        >
          {isQuickMenuOpen ? <X size={24} className="text-white" /> : <Menu size={24} className="text-white" />}
        </button>
      </div>

      {isMobile ? (
        <MobileBottomHUD 
          activePreset={activePreset} 
          onUpdateProps={updateProps} 
          isVisible={isUIVisible}
          onRegenerate={() => {
            setSynthesizing(true);
            setTimeout(() => setSynthesizing(false), 2000);
          }} 
        />
      ) : (
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-[600] flex items-center gap-2 bg-black/90 backdrop-blur-2xl border border-white/10 p-2 rounded-[2.5rem] shadow-2xl">
          <button onClick={() => editorRef.current?.setCurrentTool('select')} className="p-4 rounded-full text-zinc-500 hover:text-white transition-all"><MousePointer2 size={20} /></button>
          <button onClick={() => editorRef.current?.setCurrentTool('smart-selector')} className="p-4 rounded-full text-indigo-400 hover:text-white transition-all"><Wand2 size={20} /></button>
          <button onClick={handleExport} className="p-4 rounded-full text-zinc-500 hover:text-white transition-all"><Download size={20} /></button>
        </div>
      )}

      <style>{`
        .venus-lumina-canvas .tl-ui-layout { display: none !important; }
        @media (min-width: 1024px) {
          .venus-lumina-canvas .tl-ui-layout { display: block !important; }
        }
        .tl-ruler, .tl-grid { display: none !important; }
        input[type='range']::-webkit-slider-thumb {
          -webkit-appearance: none;
          appearance: none;
          width: 24px;
          height: 24px;
          background: transparent;
          cursor: pointer;
        }
      `}</style>
    </div>
  );
};

export default LuminaStudio;
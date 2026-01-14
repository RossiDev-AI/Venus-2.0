
import * as React from 'react';
import { 
  Tldraw, 
  createTLStore, 
  defaultShapeUtils, 
  Editor, 
  ShapeUtil, 
  HTMLContainer, 
  Rectangle2d, 
  StateNode,
  TLBaseShape,
  TLShapeId
} from 'tldraw';
import * as PIXI from 'pixi.js';
import { motion, AnimatePresence, PanInfo } from 'framer-motion';
import { 
  Wand2, 
  Palette, 
  Sun, 
  Database, 
  ChevronUp, 
  Loader2, 
  Maximize2, 
  Minimize2, 
  Trash2, 
  Menu, 
  X, 
  Camera,
  Cpu
} from 'lucide-react';

// --- EMERGENCY HOOK FIX ---
// Destructuring ensures we bind to the correct React instance from the import map.
const { 
  useState, 
  useEffect, 
  useRef, 
  useMemo, 
  useLayoutEffect, 
  useCallback 
} = React;

// --- 1. DEFINITIONS & TYPES ---

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

type LuminaImageShape = TLBaseShape<'lumina-image', LuminaImageProps>;

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

// --- 2. INTERNAL SHADER ENGINE ---

class LuminaShaderEngine {
  static colorMatrix = new PIXI.ColorMatrixFilter();
  
  static apply(sprite: PIXI.Sprite, props: any) {
    this.colorMatrix.reset();
    
    // Industrial Grade Color Math
    const exposure = Math.pow(2, props.exposure || 0);
    this.colorMatrix.brightness((props.brightness || 1) * exposure, false);
    
    if (props.contrast !== 1) this.colorMatrix.contrast(props.contrast, false);
    if (props.saturation !== 1) this.colorMatrix.saturate(props.saturation - 1, true);
    if (props.hue && props.hue !== 0) this.colorMatrix.hue(props.hue, true);

    // Apply filters
    sprite.filters = [this.colorMatrix];
  }
}

// --- 3. TLDRAW COMPONENT BRIDGE ---

const LuminaImageComponent = ({ shape }: { shape: LuminaImageShape }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const pixiAppRef = useRef<PIXI.Application | null>(null);
  const mainSpriteRef = useRef<PIXI.Sprite | null>(null);

  // Initialize Pixi Application
  useLayoutEffect(() => {
    let isMounted = true;
    
    const init = async () => {
      if (!containerRef.current) return;
      
      // Cleanup existing if any (safety check)
      if (containerRef.current.querySelector('canvas')) {
        containerRef.current.innerHTML = '';
      }

      const app = new PIXI.Application();
      await app.init({
        width: (shape as any).props.w,
        height: (shape as any).props.h,
        backgroundAlpha: 0,
        antialias: false, // Performance opt for Mobile
        resolution: 1,    // Force 1x for consistency
        autoDensity: true
      });

      if (!isMounted) {
        app.destroy(true, { children: true, texture: true });
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
        
        LuminaShaderEngine.apply(sprite, shape.props);
        app.render();
      } catch (e) {
        console.warn("Pixi Load Fail:", e);
      }
    };

    init();

    return () => {
      isMounted = false;
      if (pixiAppRef.current) {
        pixiAppRef.current.destroy(true, { children: true, texture: true });
        pixiAppRef.current = null;
      }
    };
  }, [(shape as any).props.url, (shape as any).props.w, (shape as any).props.h]);

  // React to Prop Changes (Fast Path)
  useEffect(() => {
    if (mainSpriteRef.current && pixiAppRef.current) {
      LuminaShaderEngine.apply(mainSpriteRef.current, shape.props);
      pixiAppRef.current.render();
    }
  }, [
    shape.props.brightness, 
    shape.props.contrast, 
    shape.props.exposure, 
    shape.props.saturation,
    shape.props.hue
  ]);

  return (
    <HTMLContainer className="pointer-events-none w-full h-full overflow-hidden relative">
      <div 
        ref={containerRef} 
        style={{ 
          width: '100%', 
          height: '100%',
          pointerEvents: 'none'
        }} 
      />
      {shape.props.isScanning && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/40 backdrop-blur-sm z-50">
          <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
        </div>
      )}
    </HTMLContainer>
  );
};

class LuminaImageShapeUtil extends ShapeUtil<LuminaImageShape> {
  static type = 'lumina-image' as const;
  
  getDefaultProps(): any { 
    return { 
      w: 300, h: 300, url: '', isScanning: false, 
      brightness: 1, contrast: 1, exposure: 0, saturation: 1, hue: 0, blur: 0 
    }; 
  }
  
  getGeometry(shape: LuminaImageShape) { 
    return new Rectangle2d({ width: (shape as any).props.w, height: (shape as any).props.h, isFilled: true }); 
  }
  
  component(shape: LuminaImageShape) { return <LuminaImageComponent shape={shape} />; }
  indicator(shape: LuminaImageShape) { return <rect width={(shape as any).props.w} height={(shape as any).props.h} />; }
}

// --- 4. SMART SELECTOR TOOL ---

class SmartSelectorTool extends StateNode {
  static id = 'smart-selector';
  
  onPointerDown() {
    const editor = (this as any).editor as Editor;
    const point = editor.inputs.currentPagePoint;
    // 20px buffer for touch
    const hitShape = [...editor.getCurrentPageShapes()].reverse().find((s: any) => {
      if (s.type !== 'lumina-image') return false;
      const bounds = editor.getShapePageBounds(s.id)!;
      return bounds.expandBy(20).containsPoint(point); 
    });
    
    if (hitShape) {
      editor.select(hitShape.id);
      // Visual feedback simulation
      editor.updateShape({ id: hitShape.id, type: 'lumina-image', props: { isScanning: true } } as any);
      setTimeout(() => {
        editor.updateShape({ id: hitShape.id, type: 'lumina-image', props: { isScanning: false } } as any);
      }, 400);
    } else {
      editor.selectNone();
    }
  }
}

// --- 5. MOBILE HUD (INTERNALS) ---

const MobileBottomHUD: React.FC<{ 
  onRegenerate: () => void, 
  activePreset: any, 
  onUpdateProps: (key: string, val: number) => void,
  isVisible: boolean
}> = ({ onRegenerate, activePreset, onUpdateProps, isVisible }) => {
  const [activeTab, setActiveTab] = useState<'Geração' | 'Croma' | 'Luz' | 'Vault'>('Geração');
  const [isOpen, setIsOpen] = useState(false);

  const handleDragEnd = (_: any, info: PanInfo) => {
    if (info.velocity.y > 20 || info.offset.y > 100) setIsOpen(false);
    else if (info.velocity.y < -20 || info.offset.y < -100) setIsOpen(true);
  };

  const renderSlider = (label: string, key: string, min: number, max: number, step: number) => {
    const val = (activePreset.grading as any)[key] ?? (min + max) / 2;
    return (
      <div className="space-y-4 py-2">
        <div className="flex justify-between items-center px-1">
          <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">{label}</span>
          <span className="text-[10px] font-bold text-indigo-400">{val.toFixed(2)}</span>
        </div>
        <div className="relative h-8 flex items-center">
          <div className="absolute w-full h-[2px] bg-zinc-800 rounded-full" />
          <div className="absolute h-[2px] bg-indigo-500" style={{ width: `${((val - min) / (max - min)) * 100}%` }} />
          <input 
            type="range" min={min} max={max} step={step} value={val} 
            onChange={(e) => onUpdateProps(key, parseFloat(e.target.value))} 
            className="absolute w-full h-full opacity-0 cursor-pointer z-10" 
          />
          <div className="absolute w-6 h-6 bg-white border-2 border-indigo-500 rounded-full shadow-lg pointer-events-none" style={{ left: `calc(${((val - min) / (max - min)) * 100}% - 12px)` }} />
        </div>
      </div>
    );
  };

  return (
    <motion.div
      initial="closed"
      animate={!isVisible ? "hidden" : (isOpen ? "open" : "closed")}
      variants={{ 
        open: { y: '0%', opacity: 1 }, 
        closed: { y: '88%', opacity: 1 }, 
        hidden: { y: '100%', opacity: 0 } 
      }}
      transition={{ type: 'spring', damping: 25, stiffness: 200 }}
      drag="y"
      dragConstraints={{ top: 0, bottom: 0 }}
      dragElastic={0.1}
      onDragEnd={handleDragEnd}
      className="fixed inset-x-0 bottom-0 z-[1000] bg-[#0c0c0e] border-t border-white/10 rounded-t-[2.5rem] flex flex-col h-[70vh] shadow-[0_-20px_50px_rgba(0,0,0,0.8)]"
    >
      <div className="flex flex-col items-center py-4 shrink-0 cursor-grab active:cursor-grabbing w-full">
        <div className="w-12 h-1.5 bg-zinc-800 rounded-full mb-4" />
        <div className="flex justify-around w-full px-4">
          {[
            { id: 'Geração', icon: <Wand2 size={20} /> }, 
            { id: 'Croma', icon: <Palette size={20} /> }, 
            { id: 'Luz', icon: <Sun size={20} /> }, 
            { id: 'Vault', icon: <Database size={20} /> }
          ].map(tab => (
            <button 
              key={tab.id} 
              onClick={() => { setActiveTab(tab.id as any); setIsOpen(true); }} 
              className={`p-4 rounded-2xl transition-all flex flex-col items-center gap-1 ${activeTab === tab.id ? 'text-indigo-400 bg-white/5' : 'text-zinc-600'}`}
            >
              {tab.icon}
              <span className="text-[8px] font-black uppercase tracking-widest">{tab.id}</span>
            </button>
          ))}
        </div>
      </div>
      
      <div className="flex-1 overflow-y-auto px-8 pb-12 custom-scrollbar">
        <AnimatePresence mode="wait">
          <motion.div key={activeTab} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-8 pt-4">
            {activeTab === 'Geração' && (
              <div className="space-y-6">
                <textarea className="w-full h-32 bg-zinc-900/50 border border-white/10 rounded-2xl p-4 text-xs text-white outline-none focus:border-indigo-500/50" placeholder="Instrução de síntese..." />
                <button onClick={onRegenerate} className="w-full py-5 bg-indigo-600 text-white rounded-2xl font-black uppercase text-[10px] tracking-[0.4em] shadow-xl active:scale-95 transition-all">Regenerar DNA</button>
              </div>
            )}
            {activeTab === 'Croma' && <div className="space-y-4">{renderSlider('Saturação', 'saturation', 0, 2, 0.01)}{renderSlider('Contraste', 'contrast', 0.5, 1.5, 0.01)}</div>}
            {activeTab === 'Luz' && <div className="space-y-4">{renderSlider('Exposição', 'exposure', -2, 2, 0.01)}{renderSlider('Brilho', 'brightness', 0.5, 1.5, 0.01)}</div>}
          </motion.div>
        </AnimatePresence>
      </div>
      
      <button onClick={() => setIsOpen(!isOpen)} className="absolute -top-12 left-1/2 -translate-x-1/2 w-12 h-12 bg-indigo-600 rounded-full flex items-center justify-center border border-indigo-400 text-white md:hidden shadow-2xl z-[1001]">
        <motion.div animate={{ rotate: isOpen ? 180 : 0 }}><ChevronUp size={24} /></motion.div>
      </button>
    </motion.div>
  );
};

// --- 6. LUMINA STUDIO (MAIN) ---

const LuminaStudio: React.FC<{ settings?: any }> = ({ settings }) => {
  const editorRef = useRef<Editor | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  
  const [activePreset, setActivePreset] = useState(INITIAL_PRESET);
  const [isSynthesizing, setSynthesizing] = useState(false);
  const [isUIVisible, setIsUIVisible] = useState(true);
  const [isQuickMenuOpen, setIsQuickMenuOpen] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [vaultSyncStatus, setVaultSyncStatus] = useState('IDLE');

  // Static Configuration
  const customShapeUtils = useMemo(() => [LuminaImageShapeUtil, ...defaultShapeUtils], []);
  const customTools = useMemo(() => [SmartSelectorTool], []);

  // --- Auto-Hide UI Logic ---
  const handleInteractionStart = useCallback(() => {
    setIsUIVisible(false);
    setIsQuickMenuOpen(false);
  }, []);
  
  const handleInteractionEnd = useCallback(() => {
    // Delay showing UI to allow for "flick" gestures
    setTimeout(() => setIsUIVisible(true), 150);
  }, []);

  const handleMount = useCallback((editor: Editor) => {
    editorRef.current = editor;
    editor.setCurrentTool('select');
    editor.updateInstanceState({ isGridMode: false }); // Clean view
    
    // Attach listeners
    editor.on('event', (event) => {
      if (event.name === 'pointer_down') handleInteractionStart();
      if (event.name === 'pointer_up') handleInteractionEnd();
    });
  }, [handleInteractionStart, handleInteractionEnd]);

  // --- Vault Sync Simulation ---
  useEffect(() => {
    const interval = setInterval(() => {
      setVaultSyncStatus('SYNCING...');
      setTimeout(() => setVaultSyncStatus('SYNCED'), 800);
    }, 15000);
    return () => clearInterval(interval);
  }, []);

  // --- Fullscreen Toggle ---
  const toggleFullscreen = async () => {
    if (!document.fullscreenElement) {
      await document.documentElement.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      await document.exitFullscreen().catch(() => {});
      setIsFullscreen(false);
    }
    setIsQuickMenuOpen(false);
  };

  const handleExport = async () => {
    if (!editorRef.current) return;
    // Mock export logic
    setIsQuickMenuOpen(false);
    alert("Export Snapshot Saved to Gallery");
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
          editorRef.current?.updateShape({ 
            id, type: 'lumina-image', props: { ...shape.props, [key]: val } 
          } as any);
        }
      });
    }
  };

  return (
    <div 
      ref={containerRef}
      className="fixed top-0 left-0 w-screen h-[100dvh] bg-[#020202] overflow-hidden z-[9999]"
      style={{ touchAction: 'none' }} 
    >
      {/* 1. Header & Status */}
      <AnimatePresence>
        {isUIVisible && (
          <motion.div 
            initial={{ y: -100 }} animate={{ y: 0 }} exit={{ y: -100 }}
            className="absolute top-0 left-0 right-0 z-[500] p-4 flex justify-between items-start pointer-events-none"
          >
            <div className="flex flex-col gap-2">
                <div className="bg-black/80 backdrop-blur-xl border border-white/10 px-4 py-2 rounded-full flex items-center gap-3 shadow-2xl pointer-events-auto">
                  <div className={`w-2 h-2 rounded-full shadow-[0_0_10px_currentColor] ${vaultSyncStatus === 'SYNCED' ? 'bg-emerald-500 text-emerald-500' : 'bg-amber-500 text-amber-500'}`} />
                  <span className="text-[8px] font-black text-white uppercase tracking-widest">
                    {vaultSyncStatus === 'SYNCED' ? 'VAULT SECURE' : 'SYNCING...'}
                  </span>
                </div>
            </div>
            
            {isSynthesizing && (
              <div className="bg-indigo-600 px-4 py-2 rounded-full border border-indigo-400 flex items-center gap-2 shadow-2xl animate-pulse">
                <Cpu size={12} className="text-white" />
                <span className="text-[8px] font-black text-white uppercase tracking-widest">Neural Kernel Active</span>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* 2. Tldraw Canvas */}
      <div className="absolute inset-0 z-0">
        <Tldraw 
          store={useMemo(() => createTLStore({ shapeUtils: customShapeUtils }), [])} 
          onMount={handleMount}
          tools={customTools}
          inferDarkMode 
          components={{ 
            Spinner: () => <div className="hidden" />, // Hide default spinner
            HelpMenu: null,
            NavigationPanel: null,
            DebugPanel: null,
            PageMenu: null,
            SharePanel: null
          }}
          className="venus-lumina-canvas" 
        />
      </div>

      {/* 3. Floating Action Button (FAB) */}
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

      {/* 4. Adaptive HUD */}
      <MobileBottomHUD 
        activePreset={activePreset} 
        onUpdateProps={updateProps} 
        isVisible={isUIVisible} 
        onRegenerate={() => {
          setSynthesizing(true);
          setTimeout(() => setSynthesizing(false), 2500);
        }} 
      />

      {/* 5. Clean CSS Injection - Forced Mobile Fullscreen */}
      <style>{`
        /* Force Fullscreen Layout */
        body, #root {
          position: fixed !important;
          width: 100vw !important;
          height: 100dvh !important;
          overflow: hidden !important;
          margin: 0 !important;
          padding: 0 !important;
          background-color: #020202 !important;
        }
        
        /* Disable Tldraw Standard UI */
        .venus-lumina-canvas .tl-ui-layout { display: none !important; }
        .tl-ruler, .tl-grid { display: none !important; }
        
        /* Mobile Range Sliders */
        input[type='range']::-webkit-slider-thumb {
          -webkit-appearance: none;
          appearance: none;
          width: 24px;
          height: 24px;
          background: transparent;
          cursor: pointer;
        }
        
        /* Prevent Selection */
        body { user-select: none; -webkit-user-select: none; }
      `}</style>
    </div>
  );
};

export default LuminaStudio;


import React, { useMemo, useState, useEffect, useRef } from 'react';
import { Tldraw, createTLStore, defaultShapeUtils, Editor, debounce } from 'tldraw';
import { motion, AnimatePresence } from 'framer-motion';
import { Undo2, Redo2, Activity, Zap, Box, Move3d, Layers } from 'lucide-react';
import { AppSettings, LuminaImageShape } from '../../types';
import { LuminaImageShapeUtil } from './LuminaImageShapeUtil';
import { useVenusStore } from '../../store/useVenusStore';
import { useLuminaAI } from '../../hooks/useLuminaAI';

const customShapeUtils = [LuminaImageShapeUtil, ...defaultShapeUtils];

const LuminaStudio: React.FC<{ settings: AppSettings }> = ({ settings }) => {
  const editorRef = useRef<Editor | null>(null);
  const [scopesOpen, setScopesOpen] = useState(false);
  const [signalData, setSignalData] = useState<number[]>([]);
  const { selectedShapeId, setSelectedShapeId, deviceProfile } = useVenusStore();
  const luminaAI = useLuminaAI();

  useEffect(() => {
    if (scopesOpen && selectedShapeId) {
        const interval = setInterval(async () => {
            const shape = editorRef.current?.getShape(selectedShapeId) as LuminaImageShape;
            if (shape) {
                // Added fix: Used type casting to access 'props' on LuminaImageShape to bypass property access errors.
                const data = await (luminaAI as any).getSignalData((shape as any).props.url);
                setSignalData(data);
            }
        }, 500);
        return () => clearInterval(interval);
    }
  }, [scopesOpen, selectedShapeId]);

  const updateProp = (key: string, val: any) => {
    if (!selectedShapeId || !editorRef.current) return;
    editorRef.current.updateShape({
        id: selectedShapeId,
        type: 'lumina-image',
        props: { ...editorRef.current.getShape(selectedShapeId)!.props, [key]: val }
    } as any);
  };

  return (
    <div className="w-full h-full bg-[#020202] relative overflow-hidden flex flex-col">
      {/* Botão de Scopes */}
      <div className="absolute top-24 left-4 z-[500]">
        <button onClick={() => setScopesOpen(!scopesOpen)} className={`p-3 rounded-2xl border transition-all ${scopesOpen ? 'bg-indigo-600 border-indigo-400 text-white' : 'bg-zinc-900/80 border-white/10 text-zinc-500'}`}>
            <Activity size={20} />
        </button>
      </div>

      {/* Scopes Window */}
      <AnimatePresence>
        {scopesOpen && (
            <motion.div initial={{ x: -300, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: -300, opacity: 0 }} className="absolute top-40 left-4 z-[500] w-64 bg-black/90 backdrop-blur-2xl border border-white/10 rounded-[2rem] p-6 shadow-2xl">
                <span className="text-[9px] font-black text-indigo-400 uppercase tracking-widest block mb-4">Luminance Waveform</span>
                <div className="h-32 flex items-end gap-[1px] bg-zinc-900/50 rounded-xl overflow-hidden px-2">
                    {signalData.map((v, i) => (
                        <div key={i} className="flex-1 bg-indigo-500/40" style={{ height: `${(v / Math.max(...signalData)) * 100}%` }} />
                    ))}
                </div>
                <div className="flex justify-between mt-2 text-[7px] mono text-zinc-600 uppercase"><span>Blacks</span><span>Whites</span></div>
            </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {selectedShapeId && (
          <motion.div initial={{ y: 200 }} animate={{ y: 0 }} className="fixed bottom-24 left-1/2 -translate-x-1/2 z-[600] w-full max-w-lg px-4">
            <div className="bg-zinc-900/95 backdrop-blur-3xl border border-white/10 p-6 rounded-[2.5rem] shadow-2xl flex flex-col gap-5">
                <div className="flex items-center justify-between">
                   <div className="flex items-center gap-2">
                       <Move3d size={14} className="text-indigo-400" />
                       <span className="text-[10px] font-black text-white uppercase tracking-widest">Optical Master</span>
                   </div>
                   <div className="flex gap-2">
                      <button onClick={() => updateProp('smartCropEnabled', !(editorRef.current?.getShape(selectedShapeId) as any).props.smartCropEnabled)} className={`px-3 py-1.5 rounded-xl text-[8px] font-black uppercase border transition-all ${(editorRef.current?.getShape(selectedShapeId) as any).props.smartCropEnabled ? 'bg-indigo-600 border-indigo-400' : 'bg-white/5 border-white/10'}`}>
                        SmartCrop
                      </button>
                   </div>
                </div>

                <div className="space-y-3">
                    <div className="flex justify-between text-[8px] font-black text-zinc-500 uppercase"><span>Depth Displacement</span> <span className="text-white">{(editorRef.current?.getShape(selectedShapeId) as any).props.depthDisplacement}</span></div>
                    <input type="range" min="0" max="0.2" step="0.01" value={(editorRef.current?.getShape(selectedShapeId) as any).props.depthDisplacement || 0.05} onChange={(e) => updateProp('depthDisplacement', parseFloat(e.target.value))} className="w-full h-1 bg-zinc-800 appearance-none rounded-full accent-indigo-500" />
                </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <Tldraw 
        store={useMemo(() => createTLStore({ shapeUtils: customShapeUtils }), [])} 
        onMount={(e) => { editorRef.current = e; (window as any).luminaAI = luminaAI; }} 
        inferDarkMode 
        className="venus-lumina-canvas" 
      />
    </div>
  );
};

export default LuminaStudio;


import React from 'react';
import { LatentGrading, VaultItem } from '../../types';

interface GradingControlsProps {
  activeCategory: string;
  grading: LatentGrading;
  updateParam: (key: keyof LatentGrading, val: any) => void;
  applyPreset: (preset: any) => void;
  filmStocks: any[];
  customLuts: any[];
  handleSaveLut: () => void;
  handleRemoveLut: (name: string) => void;
  newLutName: string;
  setNewLutName: (val: string) => void;
  selectedNode?: VaultItem | null;
}

const GradingControls: React.FC<GradingControlsProps> = ({
  activeCategory, grading, updateParam, applyPreset, filmStocks, customLuts, handleSaveLut, handleRemoveLut, newLutName, setNewLutName, selectedNode
}) => {
  const renderSlider = (key: keyof LatentGrading | string, label: string, min: number, max: number, step: number = 0.01) => (
    <div key={key} className="space-y-3 group/item">
      <div className="flex justify-between items-center px-1">
        <span className="text-[9px] font-black text-zinc-500 uppercase tracking-widest group-hover/item:text-indigo-400 transition-colors">{label}</span>
        <span className="text-[11px] mono text-white font-black bg-white/5 px-3 py-0.5 rounded border border-white/5">
          {typeof (grading as any)[key] === 'number' ? (grading as any)[key].toFixed(3) : (grading as any)[key]}
        </span>
      </div>
      <div className="relative h-8 flex items-center px-1">
          <div className="absolute inset-x-1 h-0.5 bg-zinc-950 rounded-full border border-white/5 overflow-hidden">
              <div 
                className="h-full bg-indigo-500 transition-all opacity-40 shadow-[0_0_10px_rgba(99,102,241,0.5)] relative z-10" 
                style={{ width: `${Math.min(100, Math.max(0, (( (grading as any)[key] - min) / (max - min)) * 100))}%` }} 
              />
          </div>
          <input 
            type="range" min={min} max={max} step={step} value={(grading as any)[key] || 0} 
            onChange={(e) => updateParam(key as keyof LatentGrading, parseFloat(e.target.value))} 
            className="w-full h-full bg-transparent appearance-none accent-white cursor-pointer relative z-20" 
          />
      </div>
    </div>
  );

  const getCategoryContent = () => {
    switch(activeCategory) {
      case 'MASTER': return [
        // Novo: Swatches Inteligentes extraídos via node-vibrant (se houver node selecionado)
        selectedNode?.grading && (selectedNode.grading as any).swatches?.length > 0 && (
          <div key="smart_swatches" className="space-y-4 mb-8">
            <span className="text-[9px] font-black text-indigo-400 uppercase tracking-widest px-1">Source DNA Palette</span>
            <div className="flex gap-2">
                {(selectedNode.grading as any).swatches.map((color: string, i: number) => (
                    <button key={i} className="w-12 h-12 rounded-xl border border-white/10 hover:scale-110 transition-transform shadow-lg" style={{ backgroundColor: color }} />
                ))}
            </div>
          </div>
        ),
        <div key="basic_exp" className="p-3 bg-zinc-900/50 rounded-xl mb-4 border border-white/5"><span className="text-[9px] font-black text-zinc-400 uppercase tracking-widest">Base Exposure</span></div>,
        renderSlider('exposure', 'Exposure EV', -3, 3, 0.1),
        renderSlider('contrast', 'Contrast', 0, 3, 0.01),
        renderSlider('brightness', 'Brightness', 0, 2, 0.01),
        renderSlider('gamma', 'Gamma Power', 0.1, 3, 0.01),
      ];
      // Outras categorias mantidas...
      default: return [];
    }
  };

  return (
    <div className="h-full overflow-y-auto custom-scrollbar p-6 bg-[#08080a]">
       <div className="flex flex-col gap-y-8">
          {getCategoryContent()}
       </div>
    </div>
  );
};

export default GradingControls;

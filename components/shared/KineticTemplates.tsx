import React from 'react';
import { motion } from 'framer-motion';
import { Sparkles, Zap, Shield, Target } from 'lucide-react';
import { KINETIC_RECIPES, KineticRecipe } from '../../config/kinetic-recipes';
import { LatentParams } from '../../types';

interface KineticTemplatesProps {
  onApply: (recipe: KineticRecipe) => void;
  activeId?: string;
}

const KineticTemplates: React.FC<KineticTemplatesProps> = ({ onApply, activeId }) => {
  return (
    <div className="bg-zinc-900/40 p-6 rounded-[2.5rem] border border-white/5 space-y-5 shadow-2xl backdrop-blur-md">
      <div className="flex items-center justify-between px-2">
        <div className="flex items-center gap-2">
          <Sparkles size={14} className="text-indigo-400" />
          <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Kinetic Recipes</span>
        </div>
        <div className="px-2 py-0.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-[7px] font-black text-indigo-400 uppercase">Industrial v1.0</div>
      </div>

      <div className="grid grid-cols-1 gap-3">
        {KINETIC_RECIPES.map((recipe) => (
          <button
            key={recipe.id}
            onClick={() => onApply(recipe)}
            className={`flex flex-col gap-2 p-4 rounded-3xl border transition-all group text-left relative overflow-hidden ${
              activeId === recipe.id 
                ? 'bg-white text-black border-white' 
                : 'bg-black/20 border-white/5 hover:border-indigo-500/30'
            }`}
          >
            <div className="flex justify-between items-center relative z-10">
              <span className="text-[11px] font-black uppercase tracking-tight">{recipe.name}</span>
              {activeId === recipe.id ? <Target size={12} /> : <Zap size={12} className="text-zinc-700 group-hover:text-indigo-400" />}
            </div>
            <p className={`text-[9px] leading-relaxed relative z-10 ${activeId === recipe.id ? 'text-zinc-600' : 'text-zinc-500'}`}>
              {recipe.description}
            </p>
            {activeId === recipe.id && (
              <motion.div 
                layoutId="recipe-active"
                className="absolute inset-0 bg-gradient-to-r from-indigo-500/10 to-transparent pointer-events-none"
              />
            )}
          </button>
        ))}
      </div>
    </div>
  );
};

export default KineticTemplates;

import React, { useState } from 'react';
import { motion, useDragControls, PanInfo } from 'framer-motion';
import { ChevronUp, ChevronDown, GripHorizontal } from 'lucide-react';

interface MobileControlsSheetProps {
  children: React.ReactNode;
  isOpen: boolean;
  onClose: () => void;
  title?: string;
}

type SheetState = 'hidden' | 'compact' | 'expanded';

const MobileControlsSheet: React.FC<MobileControlsSheetProps> = ({ children, isOpen, onClose, title }) => {
  const [sheetState, setSheetState] = useState<SheetState>('compact');

  const variants = {
    hidden: { y: '92%' },
    compact: { y: '60%' },
    expanded: { y: '10%' }
  };

  const handleDragEnd = (event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    if (info.offset.y < -50) {
      if (sheetState === 'hidden') setSheetState('compact');
      else if (sheetState === 'compact') setSheetState('expanded');
    } else if (info.offset.y > 50) {
      if (sheetState === 'expanded') setSheetState('compact');
      else if (sheetState === 'compact') setSheetState('hidden');
    }
  };

  if (!isOpen) return null;

  return (
    <motion.div
      initial="hidden"
      animate={sheetState}
      variants={variants}
      transition={{ type: 'spring', damping: 25, stiffness: 200 }}
      drag="y"
      dragConstraints={{ top: 0, bottom: 0 }}
      dragElastic={0.1}
      onDragEnd={handleDragEnd}
      className="fixed inset-x-0 bottom-0 z-[800] bg-[#0c0c0e] border-t border-white/10 rounded-t-[3rem] shadow-[0_-20px_50px_rgba(0,0,0,0.5)] flex flex-col h-[90vh]"
    >
      <div className="flex flex-col items-center py-4 cursor-grab active:cursor-grabbing shrink-0">
        <div className="w-12 h-1.5 bg-zinc-800 rounded-full mb-2" />
        {title && <span className="text-[10px] font-black uppercase text-zinc-500 tracking-[0.3em]">{title}</span>}
      </div>

      <div className="flex-1 overflow-y-auto px-6 pb-24 custom-scrollbar">
        {children}
      </div>

      {/* Floating Toggle State Button */}
      <button 
        onClick={() => setSheetState(sheetState === 'expanded' ? 'compact' : 'expanded')}
        className="absolute -top-12 left-1/2 -translate-x-1/2 w-10 h-10 bg-indigo-600 rounded-full flex items-center justify-center border border-indigo-400 shadow-2xl text-white md:hidden"
      >
        {sheetState === 'expanded' ? <ChevronDown size={20} /> : <ChevronUp size={20} />}
      </button>
    </motion.div>
  );
};

export default MobileControlsSheet;
import React, { useState, useEffect, useRef } from 'react';
import { VaultItem, LatentGrading } from '../../types';
import { applyGrading } from '../../gradingProcessor';
import { useDeviceType } from '../../hooks/useDeviceType';

// Subcomponents
import GradingPreview from '../gradingLab/GradingPreview';
import GradingToolbar from '../gradingLab/GradingToolbar';
import GradingNavigation from '../gradingLab/GradingNavigation';
import GradingControls from '../gradingLab/GradingControls';
import GradingQueue from '../gradingLab/GradingQueue';

interface GradingLabProps {
  vault: VaultItem[];
  onSave: (item: VaultItem) => Promise<void>;
}

const INITIAL_GRADING: LatentGrading = {
  preset_name: 'LINEAR_RAW', css_filter_string: 'none',
  exposure: 0, contrast: 1, pivot: 0.5, brightness: 1, saturation: 1, vibrance: 1,
  temperature: 0, tint: 0, hueRotate: 0, gamma: 1, offset: 0, lift: 0, gain: 1,
  invert: 0, opacity: 1,
  lift_r: 0, lift_g: 0, lift_b: 0, gamma_r: 1, gamma_g: 1, gamma_b: 1,
  gain_r: 1, gain_g: 1, gain_b: 1, offset_r: 0, offset_g: 0, offset_b: 0,
  mix_red_red: 1, mix_red_green: 0, mix_red_blue: 0,
  mix_green_red: 0, mix_green_green: 1, mix_green_blue: 0,
  mix_blue_red: 0, mix_blue_green: 0, mix_blue_blue: 1,
  hue_red: 0, sat_red: 0, hue_orange: 0, sat_orange: 0, hue_yellow: 0, sat_yellow: 0,
  hue_green: 0, sat_green: 0, hue_cyan: 0, sat_cyan: 0, hue_blue: 0, sat_blue: 0,
  hue_magenta: 0, sat_magenta: 0, hue_purple: 0, sat_purple: 0,
  split_shadow_hue: 240, split_shadow_sat: 0, split_mid_hue: 45, split_mid_sat: 0,
  split_highlight_hue: 45, split_highlight_sat: 0, split_balance: 0,
  grain: 0, grain_size: 1, grain_roughness: 0.5, grain_color: 0, grain_shadows: 0, grain_highlights: 0,
  halation: 0, halation_threshold: 0.8, halation_radius: 0, film_breath: 0,
  lens_distortion: 0, chromatic_aberration: 0, vignette: 0, vignette_roundness: 0, vignette_feather: 0.5,
  vignette_center_x: 0, vignette_center_y: 0, bloom: 0, bloom_threshold: 0.8, bloom_radius: 0,
  diffusion: 0, anamorphic_squeeze: 1,
  sharpness: 0, unsharp_mask: 0, structure: 0, clarity: 0,
  dehaze: 0, denoise: 0, denoise_chroma: 0, blur: 0, noise_gate: 0, texture: 0,
  skin_protect: 0, skin_hue: 0, skin_sat: 0, skin_smooth: 0,
  feature_pop: 0, eye_clarity: 0, face_warp: 0, teeth_whitening: 0,
  crop_zoom: 0, pan_x: 0, pan_y: 0, rotate: 0, perspective_x: 0, perspective_y: 0,
  tint_r: 1, tint_g: 1, tint_b: 1, sepia: 0, grayscale: 0,
  tonal_value: 1, highlight_rolloff: 0, shadow_rolloff: 0,
  whites: 1, blacks: 0, shadows: 0, midtones: 1, highlights: 1,
  selective_hue: 0, selective_threshold: 40, selective_mix: 0, selective_target_sat: 0,
  hue_vs_hue_curve: 0, hue_vs_sat_curve: 0, sat_vs_sat_curve: 0, lum_vs_sat_curve: 0,
  lens_center_x: 0, lens_center_y: 0, polar_coordinates: 0, lip_saturation: 0, halation_hue: 0,
  skin_smoothing: 0, blemish_removal: 0, skin_hue_legacy: 0, skin_saturation: 0,
  geometry_y: 1
} as LatentGrading;

const GradingLab: React.FC<GradingLabProps> = ({ vault, onSave }) => {
  const { isMobile } = useDeviceType();
  const [selectedNode, setSelectedNode] = useState<VaultItem | null>(null);
  const [grading, setGrading] = useState<LatentGrading>(INITIAL_GRADING);
  const [isSaving, setIsSaving] = useState(false);
  const [isDraggingSlider, setIsDraggingSlider] = useState(false);
  const [sliderPosition, setSliderPosition] = useState(50);
  const [activeCategory, setActiveCategory] = useState<string>('MASTER');
  const [isControlsHidden, setIsControlsHidden] = useState(false);
  
  const containerRef = useRef<HTMLDivElement>(null);
  const touchStartY = useRef<number>(0);

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartY.current = e.touches[0].clientY;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    const deltaY = e.changedTouches[0].clientY - touchStartY.current;
    if (deltaY > 100) {
      setIsControlsHidden(true); // Swipe Down to hide
    } else if (deltaY < -100) {
      setIsControlsHidden(false); // Swipe Up to show
    }
  };

  const updateParam = (key: keyof LatentGrading, val: any) => {
    setGrading(prev => ({ ...prev, [key]: val }));
  };

  return (
    <div 
      className="h-full flex flex-col bg-[#010101] overflow-hidden min-h-full"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      <div className={`flex-1 flex flex-col md:flex-row overflow-hidden relative transition-all duration-500 ${isControlsHidden ? 'h-full' : 'h-[40dvh]'}`}>
        <GradingPreview 
          selectedNode={selectedNode} 
          grading={grading} 
          sliderPosition={sliderPosition} 
          onSliderMove={(e) => {
            if (!containerRef.current) return;
            const r = containerRef.current.getBoundingClientRect();
            const x = 'touches' in e ? e.touches[0].clientX : (e as React.MouseEvent).clientX;
            setSliderPosition(Math.max(0, Math.min(100, ((x - r.left) / r.width) * 100)));
          }} 
          containerRef={containerRef} 
          // Otimização: No mobile, desativamos scopes durante drag via prop implícita ou estado
          scopesDisabled={isMobile && isDraggingSlider}
        />
      </div>

      {!isControlsHidden && (
        <div className={`w-full md:w-[400px] lg:w-[460px] bg-[#08080a] border-l border-white/5 flex flex-col shadow-2xl z-20 overflow-hidden relative text-zinc-100 ${isMobile ? 'h-[60dvh]' : ''}`}>
          <GradingToolbar 
            onCommit={() => {}} onDownload={() => {}} onReset={() => setGrading(INITIAL_GRADING)} 
            isSaving={isSaving} disabled={!selectedNode} 
          />

          <GradingNavigation categories={[]} activeCategory={activeCategory} setActiveCategory={setActiveCategory} />
          
          <div className="flex-1 overflow-hidden">
            <GradingControls 
              activeCategory={activeCategory} 
              grading={grading} 
              updateParam={updateParam} 
              applyPreset={() => {}} 
              filmStocks={[]} 
              customLuts={[]} 
              handleSaveLut={() => {}} 
              handleRemoveLut={() => {}} 
              newLutName="" 
              setNewLutName={() => {}} 
              onSliderStart={() => setIsDraggingSlider(true)}
              onSliderEnd={() => setIsDraggingSlider(false)}
            />
          </div>

          <GradingQueue favoriteNodes={vault.filter(i => i.isFavorite)} selectedNodeId={selectedNode?.id} onSelectNode={setSelectedNode} />
        </div>
      )}

      {isControlsHidden && isMobile && (
        <button 
          onClick={() => setIsControlsHidden(false)}
          className="fixed bottom-10 left-1/2 -translate-x-1/2 px-8 py-3 bg-indigo-600 text-white rounded-full font-black uppercase text-[10px] tracking-widest shadow-2xl animate-bounce"
        >
          Mostrar Controles
        </button>
      )}
    </div>
  );
};

export default GradingLab;
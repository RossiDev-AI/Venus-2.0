import { TLBaseShape } from 'tldraw';

export type AgentType = 
  | 'Director' | 'Meta-Prompt Translator' | 'Consensus Judge' | 'Scriptwriter' | 'Visual Scout'
  | 'Anatomy Specialist' | 'Texture Master' | 'Lighting Architect'
  | 'Anatomy Critic' | 'Luminance Critic' | 'Epidermal Specialist'
  | 'Lens Specialist' | 'Composition Analyst'
  | 'Neural Alchemist' | 'Latent Optimizer'
  | 'Puppeteer Agent' | 'Pose Extractor' | 'IK Solver'
  | 'Temporal Architect' | 'Motion Sculptor' | 'Fluidity Critic'
  | 'Identity Guard' | 'Visual Quality Judge' | 'Visual Archivist'
  | 'Digital DNA Curator' | 'Noise & Geometry Critic'
  | 'VAE Agent' | 'Texture Artist' | 'Lighting Lead' | 'Rigging Supervisor'
  | 'Surgical Repair Specialist' | 'Garment Architect' | 'Material Physicist'
  | 'Perspective Architect' | 'Gravity Analyst'
  | 'Style Transfer Specialist' | 'Chromatic Aberration Manager' | 'Lighting Harmonizer'
  | 'Semantic Router' | 'Vault Prioritizer'
  | 'Identity Anchor Manager' | 'Fabric Tension Analyst'
  | 'Spatial Synchronizer' | 'Vanishing Point Analyst'
  | 'Master Colorist' | 'Ray-Trace Agent' | 'Aesthetic Critic'
  | 'Vault Kernel' | 'Heuristic Optimizer'
  | 'Attribute Mapper' | 'Schema Validator'
  | 'Physics Analyst' | 'Shadow Projectionist' | 'Collision Engine'
  | 'Grading Specialist' | 'Chroma Manager' | 'Frequency Analyst'
  | 'Timeline Editor' | 'Audio Synchronizer' | 'Script Analyzer'
  | 'Canvas Orchestrator' | 'Pixi Neural Buffer' | 'Lumina Optimizer';

export interface LuminaImageShape extends TLBaseShape<'lumina-image', {
  w: number;
  h: number;
  url: string;
  maskUrl?: string;
  isProcessingMask?: boolean;
  brightness: number;
  contrast: number;
  saturation: number;
  blur: number;
}> {}

export interface IAImage {
  id: string;
  url: string;
  prompt: string;
  maskLayer?: any; // Prepared for PixiJS Graphics/Sprite
  isBackgroundRemoved: boolean;
  metadata: {
    seed: number;
    model: string;
    vram_usage: string;
    timestamp: number;
  };
}

export interface AppSettings {
  googleApiKey: string;
  pexelsApiKey: string;
  unsplashAccessKey: string;
  pixabayApiKey: string;
}

export type VaultDomain = 'X' | 'Y' | 'Z' | 'L';

export interface SubtitleSettings {
  fontSize: number;
  fontColor: string;
  backgroundColor: string;
  fontFamily: 'sans-serif' | 'serif' | 'monospace' | 'Inter' | string;
  bgOpacity: number;
  textAlign: 'left' | 'center' | 'right';
  paddingHMult: number;
  paddingVMult: number;
  radiusMult: number;
  marginMult: number;
}

export interface TimelineBeat {
  id: string;
  timestamp: number;
  duration: number;
  assetUrl: string | null;
  caption: string;
  assetType: 'IMAGE' | 'VIDEO' | 'UPLOAD';
  scoutQuery?: string;
  sourceUrl?: string;
  manualSourceUrl?: string;
  yOffset?: number; 
  sourceLink?: string; 
}

export interface CinemaProject {
  id: string;
  title: string;
  beats: TimelineBeat[];
  audioUrl: string | null;
  audioName?: string;
  fps: number;
  aspectRatio: '16:9' | '9:16' | '1:1';
  subtitleSettings?: SubtitleSettings;
}

export type ProcessingSpeed = 'Fast' | 'Balanced' | 'Deliberate' | 'Debug';

export interface AgentAuthority {
  lighting: number;
  texture: number;
  structure: number;
  anatomy: number;
}

export interface LatentParams {
  z_anatomy: number;
  z_structure: number; 
  z_lighting: number;  
  z_texture: number;
  hz_range: string;
  structural_fidelity: number;
  scale_factor: number;
  temporal_stability?: number;
  motion_bias?: number;
  auto_tune_active?: boolean;
  neural_metrics: {
    loss_mse: number;
    ssim_index: number;
    tensor_vram: number;
    iteration_count: number;
    consensus_score: number;
    projection_coherence?: number;
    qc_verdict?: string;
    visual_critique?: string;
  };
  dna?: any;
  agent_authority?: AgentAuthority;
  vault_domain?: VaultDomain;
  active_slots?: Partial<Record<VaultDomain, string | null>>;
  processing_speed?: ProcessingSpeed;
  pose_control?: PoseData;
  dna_type?: string;
}

export interface LatentGrading {
  // --- KERNEL META ---
  preset_name: string;
  css_filter_string: string;

  // --- PRIMARY CORRECTION (15) ---
  exposure: number;
  contrast: number;
  pivot: number; // Contrast Pivot
  brightness: number;
  saturation: number;
  vibrance: number;
  temperature: number; // Kelvin offset
  tint: number; // Magenta/Green
  hueRotate: number;
  gamma: number;
  offset: number;
  lift: number; // Global Lift
  gain: number; // Global Gain
  invert: number;
  opacity: number;

  // --- LOG WHEELS (LGG) (12) ---
  lift_r: number; lift_g: number; lift_b: number;
  gamma_r: number; gamma_g: number; gamma_b: number;
  gain_r: number; gain_g: number; gain_b: number;
  offset_r: number; offset_g: number; offset_b: number;

  // --- CHANNEL MIXER (Matrix 3x3) (9) ---
  mix_red_red: number; mix_red_green: number; mix_red_blue: number;
  mix_green_red: number; mix_green_green: number; mix_green_blue: number;
  mix_blue_red: number; mix_blue_green: number; mix_blue_blue: number;

  // --- HSL VECTOR SCOPE (Specific Hue Shifts) (16) ---
  hue_red: number;    sat_red: number;
  hue_orange: number; sat_orange: number;
  hue_yellow: number; sat_yellow: number;
  hue_green: number;  sat_green: number;
  hue_cyan: number;   sat_cyan: number;
  hue_blue: number;   sat_blue: number;
  hue_magenta: number; sat_magenta: number;
  hue_purple: number; sat_purple: number;

  // --- SPLIT TONING (6) ---
  split_shadow_hue: number;
  split_shadow_sat: number;
  split_highlight_hue: number;
  split_highlight_sat: number;
  split_mid_hue: number; // New
  split_mid_sat: number; // New
  split_balance: number;

  // --- FILM EMULSION SYNTHESIS (10) ---
  grain: number; // Global Amount
  grain_size: number;
  grain_roughness: number;
  grain_color: number; // Chromatic noise
  grain_shadows: number; // Bias
  grain_highlights: number; // Bias
  halation: number; // Red bloom
  halation_threshold: number;
  halation_radius: number;
  film_breath: number; // Micro exposure flicker

  // --- OPTICAL PHYSICS (Lens Engine) (12) ---
  lens_distortion: number; // Barrel/Pincushion
  chromatic_aberration: number; // Lateral
  vignette: number;
  vignette_roundness: number;
  vignette_feather: number;
  vignette_center_x: number;
  vignette_center_y: number;
  bloom: number; // Global Glow
  bloom_threshold: number;
  bloom_radius: number;
  diffusion: number; // Mist/ProMist
  anamorphic_squeeze: number; // X-Stretch

  // --- DETAIL & TEXTURE (Spatial) (8) ---
  sharpness: number;
  unsharp_mask: number; // Radius
  structure: number; // Micro-contrast
  clarity: number; // Mid-frequency contrast
  dehaze: number; // Low-frequency removal
  denoise: number;
  denoise_chroma: number;
  blur: number;
  noise_gate: number;
  texture: number;

  // --- SKIN & BEAUTY (Face Engine) (8) ---
  skin_protect: number; // Masking
  skin_hue: number;
  skin_sat: number;
  skin_smooth: number;
  feature_pop: number;
  eye_clarity: number;
  face_warp: number; // Liquify simulation
  teeth_whitening: number;

  // --- COMPOSITION (Transform) (6) ---
  crop_zoom: number;
  pan_x: number;
  pan_y: number;
  rotate: number;
  perspective_x: number;
  perspective_y: number;

  // --- LEGACY/COMPATIBILITY (Do not remove) ---
  tint_r: number; tint_g: number; tint_b: number;
  sepia: number; grayscale: number;
  tonal_value: number; highlight_rolloff: number; shadow_rolloff: number;
  whites: number; blacks: number; shadows: number; midtones: number; highlights: number;
  selective_hue: number; selective_threshold: number; selective_mix: number; selective_target_sat: number;
  hue_vs_hue_curve: number; hue_vs_sat_curve: number; sat_vs_sat_curve: number; lum_vs_sat_curve: number;
  lens_center_x: number; lens_center_y: number; polar_coordinates: number; lip_saturation: number; halation_hue: number;
  skin_smoothing: number; blemish_removal: number; skin_hue_legacy: number; skin_saturation: number;
}

export interface VaultItem {
  id: string;
  shortId: string;
  name: string; 
  imageUrl: string;
  originalImageUrl: string;
  prompt: string;
  agentHistory: AgentStatus[];
  params: LatentParams;
  rating: number;
  timestamp: number;
  dna?: any;
  usageCount: number;
  neuralPreferenceScore: number;
  isFavorite: boolean;
  vaultDomain: VaultDomain;
  grading?: LatentGrading;
}

export interface AgentStatus {
  type: AgentType;
  status: 'idle' | 'processing' | 'completed' | 'error';
  message: string;
  timestamp: number;
  department?: string;
  flow_to?: AgentType;
}

export interface ScoutData {
  candidates: ScoutCandidate[];
  consensus_report: string;
  winner_id: string;
  search_stats: {
    premium_hits: number;
    internal_hits: number;
  };
}

export interface DeliberationStep {
  from: string;
  to: string;
  action: string;
  impact: string;
  timestamp: number;
}

export interface PoseData {
  imageUrl: string;
  strength: number;
  symmetry_strength?: number;
  rigid_integrity?: number;
  preserveIdentity?: boolean;
  enabled?: boolean;
  warpMethod?: WarpMethod;
  dna?: any;
  technicalDescription?: string;
}

export interface PoseSkeleton {
  keypoints: any[];
}

export interface DNAToken {
  id: string;
  domain: VaultDomain;
  data: any;
}

export interface FusionManifest {
  pep_id: string;
  pop_id: string;
  pov_id: string;
  amb_id: string;
  weights: { pep: number; pop: number; pov: number; amb: number };
  style_modifiers: string[];
  surgicalSwap: boolean;
  fusionIntent: string;
  protectionStrength: number;
}

export interface VisualAnchor {
  id: string;
  type: string;
}

export interface CategorizedDNA {
  character?: string;
  environment?: string;
  pose?: string;
  technical_tags?: string[];
  spatial_metadata?: {
    camera_angle?: string;
  };
  aesthetic_dna?: {
    lighting_setup?: string;
  };
}

export type ComponentType = 'PEP' | 'POP' | 'POV' | 'AMB';

export interface ScoutCandidate {
  id: string;
  title: string;
  source_layer: string;
  composite_score: number;
  quality_metrics: {
    technical: number;
    aesthetic: number;
  };
  votes: Array<{
    agent: string;
    score: number;
    critique: string;
  }>;
  dna_preview: {
    z_anatomy?: number;
    z_structure?: number;
    z_lighting?: number;
    z_texture?: number;
  };
}

export type WarpMethod = 'affine' | 'thin_plate' | 'deformation';
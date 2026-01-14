import { LatentParams } from '../types';

export interface KineticRecipe {
  id: string;
  name: string;
  description: string;
  params: Partial<LatentParams>;
  promptMod: string;
  color: string;
}

export const KINETIC_RECIPES: KineticRecipe[] = [
  {
    id: 'industrial-raw',
    name: 'Industrial RAW',
    description: 'Fidelidade absoluta em estruturas metálicas e texturas densas.',
    params: { z_structure: 1.3, z_texture: 1.1, structural_fidelity: 1.0 },
    promptMod: 'industrial raw photography, high fidelity structures, dense metallic textures, 8k technical capture',
    color: 'emerald'
  },
  {
    id: 'neural-flux',
    name: 'Neural Flux',
    description: 'Fluidez anatômica e iluminação volumétrica dinâmica.',
    params: { z_anatomy: 1.2, z_lighting: 1.4, scale_factor: 1.2 },
    promptMod: 'neural flux aesthetics, dynamic volumetric lighting, organic fluidity, high energy latent space',
    color: 'pink'
  },
  {
    id: 'cinematic-bolt',
    name: 'Cinematic Bolt',
    description: 'Contraste dramático e composição de lente anamórfica.',
    params: { z_lighting: 1.5, z_structure: 0.9, structural_fidelity: 0.7 },
    promptMod: 'cinematic bolt style, anamorphic lens flare, high dramatic contrast, deep shadows, cinematic master grade',
    color: 'indigo'
  }
];

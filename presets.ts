import { LuminaPreset } from "./types";

export const LUMINA_PRESETS: LuminaPreset[] = [
  {
    id: 'analog-film',
    name: 'Analog Film',
    description: 'Estética de película 35mm com cores quentes e grão orgânico.',
    promptSuffix: 'analog film style, shot on 35mm, kodak portra 400 aesthetics, slight film grain, soft highlights, vintage atmosphere',
    grading: {
      exposure: 0.1,
      contrast: 1.05,
      saturation: 1.15,
      hue: 0,
      blur: 0.5,
      lutPreset: 'KODAK_VISION'
    }
  },
  {
    id: 'noir-industrial',
    name: 'Noir Industrial',
    description: 'Alto contraste P&B com sombras profundas e iluminação dramática.',
    promptSuffix: 'film noir style, cinematic black and white, hard shadows, high contrast, moody lighting, industrial atmosphere, sharp details',
    grading: {
      exposure: -0.2,
      contrast: 1.4,
      saturation: 0,
      hue: 0,
      blur: 0,
      lutPreset: 'BLEACH_BYPASS'
    }
  },
  {
    id: 'cyber-neon',
    name: 'Cyber Neon',
    description: 'Vibração futurista com cores elétricas e iluminação volumétrica.',
    promptSuffix: 'cyberpunk aesthetics, neon lighting, vibrant purple and teal color palette, volumetric fog, futuristic city vibe, highly detailed',
    grading: {
      exposure: 0.1,
      contrast: 1.2,
      saturation: 1.5,
      hue: -10,
      blur: 0.2,
      lutPreset: 'TEAL_ORANGE'
    }
  },
  {
    id: 'hyper-real',
    name: 'Hyper Realistic',
    description: 'Fidelidade absoluta em texturas e iluminação natural de estúdio.',
    promptSuffix: 'hyper-realistic photography, 8k resolution, extreme detail, realistic textures, macro photography, soft studio lighting, neutral colors',
    grading: {
      exposure: 0,
      contrast: 1.0,
      saturation: 1.0,
      hue: 0,
      blur: 0,
      lutPreset: undefined
    }
  }
];

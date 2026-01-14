import * as PIXI from 'pixi.js';

export class LuminaFilters {
  static apply(sprite: PIXI.Sprite, props: any) {
    let colorMatrix: PIXI.ColorMatrixFilter;
    
    // Recupera ou cria o filtro
    if (sprite.filters && sprite.filters[0] instanceof PIXI.ColorMatrixFilter) {
      colorMatrix = sprite.filters[0] as PIXI.ColorMatrixFilter;
    } else {
      colorMatrix = new PIXI.ColorMatrixFilter();
      sprite.filters = [colorMatrix];
    }

    colorMatrix.reset();

    // 1. Exposição e Brilho (Mapeamento Linear)
    const totalBrightness = (props.brightness || 1) * (1 + (props.exposure || 0));
    colorMatrix.brightness(totalBrightness, false);

    // 2. Contraste
    if (props.contrast !== 1) {
      colorMatrix.contrast(props.contrast, false);
    }

    // 3. Saturação
    if (props.saturation !== 1) {
      colorMatrix.saturate(props.saturation - 1, true);
    }

    // 4. Hue Rotation
    if (props.hue && props.hue !== 0) {
      colorMatrix.hue(props.hue, true);
    }

    // 5. Presets LUT Cinematográficos (Simulação via Matrix)
    if (props.lutPreset) {
      this.applyLUT(colorMatrix, props.lutPreset);
    }
  }

  private static applyLUT(filter: PIXI.ColorMatrixFilter, preset: string) {
    switch (preset) {
      case 'KODAK_VISION':
        filter.night(false); // Aproximação de azulado/quente
        filter.contrast(1.1, true);
        break;
      case 'BLEACH_BYPASS':
        filter.desaturate();
        filter.contrast(1.5, true);
        break;
      case 'TEAL_ORANGE':
        // Matriz customizada para Teal & Orange
        filter.matrix = [
          1.2, 0.1, -0.1, 0, 0.1,
          0, 1.0, 0.1, 0, 0,
          -0.2, 0.1, 1.4, 0, 0.1,
          0, 0, 0, 1, 0
        ];
        break;
    }
  }
}
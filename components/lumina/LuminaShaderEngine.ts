
import * as PIXI from 'pixi.js';

const DEPTH_DISPLACEMENT_FRAG = `
    precision mediump float;
    varying vec2 vTextureCoord;
    uniform sampler2D uSampler;
    uniform sampler2D uDepthMap;
    uniform float uDisplacement;
    uniform vec2 uMouseOffset;

    void main() {
        float depth = texture2D(uDepthMap, vTextureCoord).r;
        
        // Deslocamento de paralaxe distorcido (simulando curvatura da lente)
        vec2 distort = uMouseOffset * (depth - 0.5) * uDisplacement;
        
        // Amostra a imagem original com o deslocamento calculado via profundidade
        vec4 color = texture2D(uSampler, vTextureCoord + distort);
        
        gl_FragColor = color;
    }
`;

// Shaders anteriores (PARALLAX, CLIPPING) preservados...

export class LuminaShaderEngine {
  private static colorMatrix: PIXI.ColorMatrixFilter;
  private static displacementFilter: PIXI.Filter | null = null;

  static async apply(sprite: PIXI.Sprite, props: any, depthMapTexture: PIXI.Texture | null) {
    if (!this.colorMatrix) this.colorMatrix = new PIXI.ColorMatrixFilter();
    
    this.colorMatrix.reset();
    const exposure = Math.pow(2, props.exposure || 0);
    this.colorMatrix.brightness((props.brightness || 1) * exposure, false);
    if (props.contrast !== 1) this.colorMatrix.contrast(props.contrast, false);
    if (props.saturation !== 1) this.colorMatrix.saturate(props.saturation - 1, true);

    const filters: PIXI.Filter[] = [this.colorMatrix];

    if (depthMapTexture && props.depthDisplacement > 0) {
        if (!this.displacementFilter) {
            this.displacementFilter = new PIXI.Filter({
                glProgram: PIXI.GlProgram.from({
                    vertex: PIXI.defaultFilterVert,
                    fragment: DEPTH_DISPLACEMENT_FRAG
                }),
                resources: {
                    uDepthMap: depthMapTexture.source,
                    uSampler: sprite.texture.source,
                    displacementUniforms: {
                        uMouseOffset: { value: [0, 0], type: 'vec2<f32>' },
                        uDisplacement: { value: props.depthDisplacement || 0.05, type: 'f32' }
                    }
                }
            });
        }
        (this.displacementFilter.resources as any).displacementUniforms.uDisplacement = props.depthDisplacement;
        filters.push(this.displacementFilter);
    }

    sprite.filters = filters;
  }

  static updateOffset(x: number, y: number) {
    if (this.displacementFilter) {
        (this.displacementFilter.resources as any).displacementUniforms.uMouseOffset = [x, y];
    }
  }
}

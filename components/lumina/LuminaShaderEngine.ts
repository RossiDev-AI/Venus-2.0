import * as PIXI from 'pixi.js';

const ANAMORPHIC_BLOOM_FRAG = `
    precision mediump float;
    varying vec2 vTextureCoord;
    uniform sampler2D uSampler;
    uniform float uBloom;
    uniform float uBlackPoint;
    uniform float uTime;

    void main() {
        vec4 color = texture2D(uSampler, vTextureCoord);
        color.rgb = max(color.rgb - uBlackPoint, 0.0) / (1.0 - uBlackPoint);
        float luma = dot(color.rgb, vec3(0.299, 0.587, 0.114));

        if (uBloom > 0.0) {
            float threshold = 0.75;
            vec3 streaks = vec3(0.0);
            for(float i = -5.0; i <= 5.0; i += 1.0) { // Reduzido de 10 para 5 samples no mobile
                float weight = 1.0 - abs(i / 5.0);
                vec2 offset = vec2(i * 0.004, 0.0);
                vec4 sample = texture2D(uSampler, vTextureCoord + offset);
                float sampleLuma = dot(sample.rgb, vec3(0.299, 0.587, 0.114));
                streaks += sample.rgb * max(sampleLuma - threshold, 0.0) * weight;
            }
            color.rgb += streaks * 0.2 * uBloom;
        }
        gl_FragColor = color;
    }
`;

export class LuminaShaderEngine {
  private static colorMatrix: PIXI.ColorMatrixFilter;
  private static postFilter: PIXI.Filter | null = null;

  static async apply(sprite: PIXI.Sprite, props: any, isLite: boolean = false) {
    if (!this.colorMatrix) this.colorMatrix = new PIXI.ColorMatrixFilter();
    this.colorMatrix.reset();
    
    const exposure = Math.pow(2, props.exposure || 0);
    this.colorMatrix.brightness((props.brightness || 1) * exposure, false);
    
    if (props.contrast !== 1) this.colorMatrix.contrast(props.contrast, false);
    if (!isLite && props.saturation !== 1) { // Só aplica saturação complexa se não for lite
        this.colorMatrix.saturate(props.saturation - 1, true);
    }

    const filters: PIXI.Filter[] = [this.colorMatrix];

    // No modo Lite, ignoramos o Bloom Anamórfico pesado
    if (!isLite && props.grading?.bloomIntensity > 0) {
        if (!this.postFilter) {
            this.postFilter = new PIXI.Filter({
                glProgram: PIXI.GlProgram.from({
                    vertex: PIXI.defaultFilterVert,
                    fragment: ANAMORPHIC_BLOOM_FRAG
                }),
                resources: {
                    uSampler: sprite.texture.source,
                    postUniforms: {
                        uBloom: { value: 0, type: 'f32' },
                        uBlackPoint: { value: 0, type: 'f32' },
                        uTime: { value: 0, type: 'f32' }
                    }
                }
            });
        }
        const pu = (this.postFilter.resources as any).postUniforms;
        pu.uBloom = props.grading?.bloomIntensity || 0;
        pu.uBlackPoint = props.grading?.autoBlackPoint || 0;
        pu.uTime = performance.now() / 1000;
        filters.push(this.postFilter);
    }

    sprite.filters = filters;
    
    // Se for mobile, desabilita renderização contínua para economizar bateria
    if (sprite.parent?.parent instanceof PIXI.Application) {
        const app = sprite.parent.parent as PIXI.Application;
        if (isLite) {
            app.stop(); // Render on Demand
            app.render();
        } else {
            app.start();
        }
    }
  }
}

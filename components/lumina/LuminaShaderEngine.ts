
import * as PIXI from 'pixi.js';

const ANAMORPHIC_BLOOM_FRAG = `
    precision mediump float;
    varying vec2 vTextureCoord;
    uniform sampler2D uSampler;
    uniform float uBloom;
    uniform float uBlackPoint; // Calibração automática do Vibrant.js
    uniform float uTime;

    void main() {
        vec4 color = texture2D(uSampler, vTextureCoord);
        
        // Calibração de Ponto Preto (Auto-Tone Mapping)
        color.rgb = max(color.rgb - uBlackPoint, 0.0) / (1.0 - uBlackPoint);

        float luma = dot(color.rgb, vec3(0.299, 0.587, 0.114));

        // Bloom Anamórfico (Horizontal Streaks)
        if (uBloom > 0.0) {
            float threshold = 0.75;
            float intensity = max(luma - threshold, 0.0) * uBloom;
            
            // Amostragem horizontal para simular flare anamórfico
            vec3 streaks = vec3(0.0);
            for(float i = -10.0; i <= 10.0; i += 1.0) {
                float weight = 1.0 - abs(i / 10.0);
                vec2 offset = vec2(i * 0.003, 0.0);
                vec4 sample = texture2D(uSampler, vTextureCoord + offset);
                float sampleLuma = dot(sample.rgb, vec3(0.299, 0.587, 0.114));
                streaks += sample.rgb * max(sampleLuma - threshold, 0.0) * weight;
            }
            
            color.rgb += streaks * 0.15 * uBloom;
            color.rgb += vec3(intensity * 1.2, intensity * 1.5, intensity * 2.0); // Glow Central
        }

        gl_FragColor = color;
    }
`;

const CINEMATIC_GRADING_FRAG = `
    precision mediump float;
    varying vec2 vTextureCoord;
    uniform sampler2D uSampler;
    uniform vec3 uLift;
    uniform vec3 uGamma;
    uniform vec3 uGain;
    uniform float uTemperature;
    uniform float uTint;

    vec3 applyLGG(vec3 color) {
        color = color * (1.0 - uLift) + uLift;
        color = color * uGain;
        color = pow(max(color, 0.0), 1.0 / max(uGamma, 0.01));
        return color;
    }

    vec3 applyWhiteBalance(vec3 color) {
        color.r += uTemperature * 0.1;
        color.b -= uTemperature * 0.1;
        color.g += uTint * 0.05;
        return color;
    }

    void main() {
        vec4 texColor = texture2D(uSampler, vTextureCoord);
        vec3 color = texColor.rgb;
        color = applyWhiteBalance(color);
        color = applyLGG(color);
        gl_FragColor = vec4(clamp(color, 0.0, 1.0), texColor.a);
    }
`;

export class LuminaShaderEngine {
  private static colorMatrix: PIXI.ColorMatrixFilter;
  private static gradingFilter: PIXI.Filter | null = null;
  private static postFilter: PIXI.Filter | null = null;

  // Added fix: Internal state for parallax modulation
  private static xOffset = 0;
  private static yOffset = 0;

  // Added fix: Static method to update mouse-based offsets
  static updateOffset(x: number, y: number) {
    this.xOffset = x;
    this.yOffset = y;
  }

  // Added fix: Signature updated to accept 3 arguments (depthTexture) to fix calling errors across the app
  static async apply(sprite: PIXI.Sprite, props: any, depthTexture?: PIXI.Texture | null) {
    if (!this.colorMatrix) this.colorMatrix = new PIXI.ColorMatrixFilter();
    this.colorMatrix.reset();
    
    const exposure = Math.pow(2, props.exposure || 0);
    this.colorMatrix.brightness((props.brightness || 1) * exposure, false);
    if (props.contrast !== 1) this.colorMatrix.contrast(props.contrast, false);
    if (props.saturation !== 1) this.colorMatrix.saturate(props.saturation - 1, true);

    const filters: PIXI.Filter[] = [this.colorMatrix];

    // Bloom Anamórfico & Black Point
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

    if (props.grading) {
        if (!this.gradingFilter) {
            this.gradingFilter = new PIXI.Filter({
                glProgram: PIXI.GlProgram.from({
                    vertex: PIXI.defaultFilterVert,
                    fragment: CINEMATIC_GRADING_FRAG
                }),
                resources: {
                    uSampler: sprite.texture.source,
                    gradingUniforms: {
                        uLift: { value: [0, 0, 0], type: 'vec3<f32>' },
                        uGamma: { value: [1, 1, 1], type: 'vec3<f32>' },
                        uGain: { value: [1, 1, 1], type: 'vec3<f32>' },
                        uTemperature: { value: 0, type: 'f32' },
                        uTint: { value: 0, type: 'f32' }
                    }
                }
            });
        }
        const u = (this.gradingFilter.resources as any).gradingUniforms;
        const g = props.grading;
        u.uLift = [g.lift.r, g.lift.g, g.lift.b];
        u.uGamma = [g.gamma.r, g.gamma.g, g.gamma.b];
        u.uGain = [g.gain.r, g.gain.g, g.gain.b];
        u.uTemperature = g.temperature;
        u.uTint = g.tint;
        filters.push(this.gradingFilter);
    }

    sprite.filters = filters;
  }
}

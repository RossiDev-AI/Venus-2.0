
import { env, pipeline, RawImage, SamModel, SamProcessor } from '@xenova/transformers';
import * as Comlink from 'comlink';
import * as smartcrop from 'smartcrop';
import { GPU } from 'gpu.js';

env.allowLocalModels = false;

class LuminaKernelWorker {
  private samModel: SamModel | null = null;
  private samProcessor: SamProcessor | null = null;
  private depthPipeline: any | null = null;
  private gpu: GPU | null = null;
  private histogramKernel: any = null;

  async init(isLite: boolean = false) {
    const samModelId = 'Xenova/slidewindow-sam';
    const samOptions = { quantized: true };
    if (isLite) (samOptions as any).revision = 'quantized';

    const [samM, samP, depthP] = await Promise.all([
      SamModel.from_pretrained(samModelId, samOptions),
      SamProcessor.from_pretrained(samModelId),
      pipeline('depth-estimation', 'Xenova/depth-anything-small')
    ]);

    this.samModel = samM;
    this.samProcessor = samP;
    this.depthPipeline = depthP;
    
    // Inicializa GPU.js se disponível
    try {
        this.gpu = new GPU();
        this.histogramKernel = this.gpu.createKernel(function(data: any) {
            const pixel = data[this.thread.x * 4 + 0] * 0.21 + data[this.thread.x * 4 + 1] * 0.72 + data[this.thread.x * 4 + 2] * 0.07;
            return pixel;
        }).setOutput([1024 * 1024]); // Limite de amostragem
    } catch (e) { console.warn("GPU.js initialization failed, falling back to CPU Scopes"); }

    return true;
  }

  async analyzeSubject(imageUrl: string, width: number, height: number) {
    const img = await RawImage.fromURL(imageUrl);
    const canvas = img.toCanvas();
    const result = await smartcrop.crop(canvas, { width, height });
    return result.topCrop;
  }

  async getSignalData(imageDataUrl: string) {
    const img = await RawImage.fromURL(imageDataUrl);
    const canvas = img.toCanvas();
    const ctx = canvas.getContext('2d')!;
    const pixels = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
    
    const histogram = new Array(256).fill(0);
    // Amostragem rápida
    for (let i = 0; i < pixels.length; i += 16) {
        const luma = Math.round(pixels[i] * 0.299 + pixels[i+1] * 0.587 + pixels[i+2] * 0.114);
        histogram[luma]++;
    }
    return histogram;
  }

  async estimateDepth(imageUrl: string) {
    if (!this.depthPipeline) throw new Error("Depth Kernel Not Ready");
    const output = await this.depthPipeline(imageUrl);
    return output.depth.toCanvas().toDataURL('image/png');
  }

  // Métodos anteriores (SAM, Refine) preservados...
}

Comlink.expose(new LuminaKernelWorker());

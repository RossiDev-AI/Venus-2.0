import { env, pipeline, RawImage, SamModel, SamProcessor } from '@xenova/transformers';
import * as Comlink from 'comlink';
import * as smartcrop from 'smartcrop';
import * as faceapi from 'face-api.js';
import Tesseract from 'tesseract.js';

env.allowLocalModels = false;

class LuminaKernelWorker {
  private samModel: SamModel | null = null;
  private samProcessor: SamProcessor | null = null;
  private depthPipeline: any | null = null;
  private tesseractWorker: Tesseract.Worker | null = null;

  async init(isLite: boolean = false) {
    console.log(`Kernel: Booting Industrial Engine (Lite Mode: ${isLite})...`);
    
    try {
        const samModelId = 'Xenova/slidewindow-sam';
        const samOptions = { quantized: true };
        
        // No mobile, sempre usamos a versão quantizada para evitar estouro de VRAM
        const [samM, samP, depthP] = await Promise.all([
          SamModel.from_pretrained(samModelId, samOptions),
          SamProcessor.from_pretrained(samModelId),
          pipeline('depth-estimation', 'Xenova/depth-anything-small')
        ]);

        this.samModel = samM;
        this.samProcessor = samP;
        this.depthPipeline = depthP;
        
        const MODEL_URL = 'https://raw.githubusercontent.com/justadudewhohacks/face-api.js/master/weights';
        await faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL);

        this.tesseractWorker = await Tesseract.createWorker('eng+por');
        console.log('Kernel: Industrial Pipeline Fully Synchronized.');
        return true;
    } catch (err) {
        console.error('Kernel: Initialization Failed!', err);
        return false;
    }
  }

  async segment(imageUrl: string, point: { x: number, y: number }) {
    if (!this.samModel || !this.samProcessor) throw new Error("SAM_KERNEL_OFFLINE");
    
    try {
        const image = await RawImage.fromURL(imageUrl);
        const inputs = await this.samProcessor(image, {
          input_points: [[[point.x * image.width, point.y * image.height]]],
          input_labels: [[1]]
        });

        const { pred_masks } = await this.samModel(inputs);
        const mask = RawImage.fromTensor(pred_masks[0][0], 'L');
        return mask.toCanvas().toDataURL('image/png');
    } catch (e) {
        console.error("Segmentation Logic Error", e);
        throw e;
    }
  }

  async analyzeSubject(imageUrl: string, width: number, height: number) {
    const img = await RawImage.fromURL(imageUrl);
    const canvas = img.toCanvas();
    const result = await smartcrop.crop(canvas, { width, height });
    return result.topCrop;
  }

  async estimateDepth(imageUrl: string) {
    if (!this.depthPipeline) throw new Error("DEPTH_KERNEL_OFFLINE");
    const output = await this.depthPipeline(imageUrl);
    return output.depth.toCanvas().toDataURL('image/png');
  }

  async recognizeText(imageUrl: string) {
    if (!this.tesseractWorker) return { fullText: "", keywords: [] };
    const { data: { text } } = await this.tesseractWorker.recognize(imageUrl);
    const words = text.split(/[\s,.\n]+/).filter(w => w.length > 3);
    return { fullText: text, keywords: Array.from(new Set(words)) };
  }
}

export type ILuminaWorker = LuminaKernelWorker;
Comlink.expose(new LuminaKernelWorker());
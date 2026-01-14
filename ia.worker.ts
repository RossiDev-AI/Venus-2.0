import { pipeline, env } from '@xenova/transformers';

// Configuration for local environment
env.allowLocalModels = false;

let segmentationPipeline: any = null;

self.onmessage = async (event) => {
  const { type, data } = event.data;

  if (type === 'load') {
    try {
      segmentationPipeline = await pipeline('image-segmentation', 'Xenova/segformer-b0-finetuned-ade-512-512', {
        progress_callback: (p: any) => {
          self.postMessage({ type: 'progress', data: p });
        },
        device: 'webgpu' as any // Attempt WebGPU, falls back to wasm automatically
      });
      self.postMessage({ type: 'ready' });
    } catch (error: any) {
      self.postMessage({ type: 'error', data: error.message });
    }
  }

  if (type === 'segment') {
    if (!segmentationPipeline) {
      self.postMessage({ type: 'error', data: 'Model not loaded' });
      return;
    }

    try {
      const results = await segmentationPipeline(data.imageUrl);
      // For background removal, we find the "person" or largest central object
      // Xenova ADE20K Person is label 12
      const personMask = results.find((r: any) => r.label === 'person');
      const mask = personMask ? personMask.mask : results[0].mask;
      
      // Convert mask to canvas for extraction
      const maskDataUrl = mask.toCanvas().toDataURL();
      self.postMessage({ type: 'segmented', data: maskDataUrl });
    } catch (error: any) {
      self.postMessage({ type: 'error', data: error.message });
    }
  }
};
import { pipeline, env, AutoModel, AutoProcessor, RawImage, SamModel, SamProcessor } from '@xenova/transformers';

env.allowLocalModels = false;

let model: SamModel | null = null;
let processor: SamProcessor | null = null;
let currentImageEmbeddings: any = null;
let lastImageUrl: string | null = null;

self.onmessage = async (event) => {
  const { type, data } = event.data;

  if (type === 'load') {
    try {
      const modelId = 'Xenova/slidewindow-sam'; // Versão otimizada para navegador
      model = await SamModel.from_pretrained(modelId);
      processor = await SamProcessor.from_pretrained(modelId);
      self.postMessage({ type: 'ready' });
    } catch (error: any) {
      self.postMessage({ type: 'error', data: error.message });
    }
  }

  if (type === 'segment_click') {
    if (!model || !processor) return;

    try {
      const { imageUrl, point } = data; // point = { x, y } normalized 0-1
      
      // Cache de Embeddings para performance instantânea após o primeiro clique
      if (imageUrl !== lastImageUrl) {
        const image = await RawImage.fromURL(imageUrl);
        const inputs = await processor(image);
        currentImageEmbeddings = await model.get_image_embeddings(inputs);
        lastImageUrl = imageUrl;
      }

      // Preparação de pontos para o SAM
      // Formato esperado: [batch_size, num_points, 2]
      const inputPoints = [[ [point.x, point.y] ]];
      const inputLabels = [[ 1 ]]; // 1 = Foreground point

      const maskInputs = await processor.preprocess_points(inputPoints, inputLabels);
      const { pred_masks } = await model({
        ...currentImageEmbeddings,
        ...maskInputs,
      });

      // Pós-processamento: converter tensor de máscara em imagem binária
      const masks = await processor.postprocess_masks(pred_masks, [1024, 1024], [1024, 1024]);
      const maskCanvas = masks[0].toCanvas();
      
      self.postMessage({ 
        type: 'segmented_click', 
        data: maskCanvas.toDataURL('image/png') 
      });
    } catch (error: any) {
      self.postMessage({ type: 'error', data: error.message });
    }
  }
};

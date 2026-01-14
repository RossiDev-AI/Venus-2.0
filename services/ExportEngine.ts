
import { Editor, TLShapeId } from 'tldraw';

/**
 * V-nus 2.0 Export Engine
 * Combina o kernel de renderização PixiJS com o SVG do Tldraw.
 */
export async function exportNeuralComposite(editor: Editor, shapeId: TLShapeId, prompt: string): Promise<void> {
  const bounds = editor.getShapePageBounds(shapeId)!;
  
  // 1. Captura o SVG das anotações (Tldraw)
  const drawings = editor.getCurrentPageShapes().filter(s => 
    s.type === 'draw' && editor.getShapePageBounds(s.id)?.overlaps(bounds)
  );
  const svg = await editor.getSvg(drawings.map(d => d.id), { bounds, padding: 0 });

  // 2. Captura o Frame processado pelo PixiJS
  // Acessamos o canvas via o ShapeUtil que está montado
  const canvasElement = document.querySelector(`[data-shape-id="${shapeId}"] canvas`) as HTMLCanvasElement;
  if (!canvasElement) throw new Error("PixiJS Buffer not found");

  const finalCanvas = document.createElement('canvas');
  finalCanvas.width = canvasElement.width;
  finalCanvas.height = canvasElement.height;
  const ctx = finalCanvas.getContext('2d')!;

  // Layer 0: PixiJS Base (Grading + Shaders)
  ctx.drawImage(canvasElement, 0, 0);

  // Layer 1: Tldraw Annotations (SVG Overlay)
  const svgData = new XMLSerializer().serializeToString(svg!);
  const img = new Image();
  const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
  const url = URL.createObjectURL(svgBlob);
  
  await new Promise((resolve) => {
    img.onload = resolve;
    img.src = url;
  });
  
  ctx.drawImage(img, 0, 0, finalCanvas.width, finalCanvas.height);
  URL.revokeObjectURL(url);

  // 3. Export com Prompt Meta-Data (Simulado via Filename/Header)
  const blob = await new Promise<Blob>((resolve) => finalCanvas.toBlob(b => resolve(b!), 'image/png'));
  const downloadUrl = URL.createObjectURL(blob);
  const link = document.createElement('a');
  
  // Injeta o prompt no nome do arquivo para persistência básica de "receita"
  const safePrompt = prompt.slice(0, 30).replace(/[^a-z0-9]/gi, '_');
  link.download = `V-NUS_COMPOSITE_${safePrompt}_${Date.now()}.png`;
  link.href = downloadUrl;
  link.click();
  
  URL.revokeObjectURL(downloadUrl);
}

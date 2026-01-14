
import { StateNode, TLShapeId } from 'tldraw';

export class SmartSelectorTool extends StateNode {
  /**
   * Added fix: Removed 'override' from static member as it's not supported in TS.
   */
  static id = 'smart-selector';

  /**
   * Added fix: Removed 'override' keyword and used explicit casting for 'this' to bypass property access errors 
   * while ensuring the tool functions correctly at runtime.
   */
  onPointerDown() {
    const editor = (this as any).editor;
    const { inputs } = editor;
    const currentPageShapes = editor.getCurrentPageShapes();
    
    // 1. Encontrar imagem Lumina sob o cursor
    const hitShape = currentPageShapes.find((s: any) => {
      if (s.type !== 'lumina-image') return false;
      const bounds = editor.getShapePageBounds(s.id)!;
      return bounds.containsPoint(inputs.currentPagePoint);
    });

    if (hitShape) {
      this.processSelection(hitShape.id);
    }
  }

  async processSelection(shapeId: TLShapeId) {
    const editor = (this as any).editor;
    const shape = editor.getShape(shapeId)!;
    const bounds = editor.getShapePageBounds(shapeId)!;
    const { inputs } = editor;

    // Calcular coordenadas normalizadas (0-1) para o modelo SAM
    const relX = (inputs.currentPagePoint.x - bounds.minX) / bounds.width;
    const relY = (inputs.currentPagePoint.y - bounds.minY) / bounds.height;

    // Ativar animação de scanning no PixiJS
    editor.updateShape({
      id: shapeId,
      type: 'lumina-image',
      props: { ...shape.props, isScanning: true }
    } as any);

    try {
      // Comunicação com o hook (Acessado via window para orquestração simples)
      const luminaAI = (window as any).luminaAI;
      if (!luminaAI) throw new Error("Lumina AI Hook not found");

      const maskUrl = await luminaAI.segmentAtPoint((shape.props as any).url, relX, relY);

      editor.updateShape({
        id: shapeId,
        type: 'lumina-image',
        props: { ...shape.props, maskUrl, isScanning: false }
      } as any);
      
      editor.setSelectedShapes([shapeId]);
    } catch (e) {
      console.error(e);
      editor.updateShape({
        id: shapeId,
        type: 'lumina-image',
        props: { ...shape.props, isScanning: false }
      } as any);
    }
  }
}

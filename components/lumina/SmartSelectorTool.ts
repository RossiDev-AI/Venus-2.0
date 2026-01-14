import { StateNode, TLShapeId } from 'tldraw';

export class SmartSelectorTool extends StateNode {
  static id = 'smart-selector';

  onPointerDown() {
    const editor = (this as any).editor;
    const { inputs } = editor;
    
    // Suporte a multi-toque e precisão mobile
    const point = inputs.currentPagePoint;
    const currentPageShapes = editor.getCurrentPageShapes();
    
    // 1. Encontrar imagem Lumina sob o cursor com margem de erro (hitbox) maior para toque
    const hitShape = [...currentPageShapes].reverse().find((s: any) => {
      if (s.type !== 'lumina-image') return false;
      const bounds = editor.getShapePageBounds(s.id)!;
      // Adiciona margem de 5px para facilitar seleção no mobile
      return bounds.expandBy(5).containsPoint(point);
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

    // Feedback Visual Imediato
    editor.updateShape({
      id: shapeId,
      type: 'lumina-image',
      props: { ...shape.props, isScanning: true }
    } as any);

    try {
      const luminaAI = (window as any).luminaAI;
      if (!luminaAI || !luminaAI.isReady) {
        throw new Error("Neural Kernel not initialized for selection.");
      }

      const maskUrl = await luminaAI.segmentAtPoint((shape.props as any).url, relX, relY);

      editor.updateShape({
        id: shapeId,
        type: 'lumina-image',
        props: { ...shape.props, maskUrl, isScanning: false }
      } as any);
      
      editor.setSelectedShapes([shapeId]);
    } catch (e) {
      console.error("SmartSelector Critical Error:", e);
      editor.updateShape({
        id: shapeId,
        type: 'lumina-image',
        props: { ...shape.props, isScanning: false }
      } as any);
      
      // Notificação silenciosa se falhar
      if (typeof window !== 'undefined') {
          (window as any).alert?.("Falha na segmentação: Certifique-se que o Kernel está ativo.");
      }
    }
  }
}
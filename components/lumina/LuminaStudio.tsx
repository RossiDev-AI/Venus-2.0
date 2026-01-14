
import React, { useMemo, useState, useEffect, useRef } from 'react';
import { Tldraw, createTLStore, defaultShapeUtils, Editor, createShapeId } from 'tldraw';
import { motion, AnimatePresence } from 'framer-motion';
import { Activity, Camera, Move3d } from 'lucide-react';
import { animate, spring, inertia } from 'popmotion';
import { AppSettings, LuminaImageShape, VaultItem } from '../../types';
import { LuminaImageShapeUtil } from './LuminaImageShapeUtil';
import { useVenusStore } from '../../store/useVenusStore';
import { useLuminaAI } from '../../hooks/useLuminaAI';
import { saveNode } from '../../dbService';

const customShapeUtils = [LuminaImageShapeUtil, ...defaultShapeUtils];

const LuminaStudio: React.FC<{ settings: AppSettings }> = ({ settings }) => {
  const editorRef = useRef<Editor | null>(null);
  const [scopesOpen, setScopesOpen] = useState(false);
  const { selectedShapeId } = useVenusStore();
  const luminaAI = useLuminaAI();

  // Configuração Global de Drop no Tldraw
  const handleMount = (editor: Editor) => {
    editorRef.current = editor;
    (window as any).luminaAI = luminaAI;

    const container = editor.getContainer();
    
    container.addEventListener('dragover', (e) => e.preventDefault());
    container.addEventListener('drop', async (e) => {
      e.preventDefault();
      const url = e.dataTransfer?.getData('v-nus/media-url');
      const type = e.dataTransfer?.getData('v-nus/media-type') as 'IMAGE' | 'GIF';
      
      if (!url) return;

      const point = editor.screenToPage({ x: e.clientX, y: e.clientY });
      const shapeId = createShapeId();

      // 1. Ghost Shape (Loading UI)
      editor.createShape({
        id: shapeId,
        type: 'lumina-image',
        x: point.x - 150,
        y: point.y - 150,
        props: {
            url,
            w: 300,
            h: 300,
            isScanning: true, // Aciona spinner no Util
            assetType: type
        }
      } as any);

      // 2. Background Neural Optimization
      try {
        const crop = await luminaAI.workerApiRef.current.analyzeSubject(url, 1024, 1024);
        
        editor.updateShape({
            id: shapeId,
            props: {
                isScanning: false,
                subjectFocus: { x: crop.x / 1024, y: crop.y / 1024, width: crop.width / 1024, height: crop.height / 1024 }
            }
        } as any);

        // 3. Instant Vaulting
        const vaultItem: VaultItem = {
            id: crypto.randomUUID(),
            shortId: `DRP-${Math.floor(1000+Math.random()*9000)}`,
            name: `Extern_${type}_${Date.now()}`,
            imageUrl: url,
            originalImageUrl: url,
            prompt: `Importado via SmartDrop: ${url}`,
            agentHistory: [],
            params: {} as any,
            rating: 5,
            timestamp: Date.now(),
            usageCount: 1,
            neuralPreferenceScore: 70,
            isFavorite: false,
            vaultDomain: 'Z'
        };
        await saveNode(vaultItem);
        
      } catch (err) {
        console.error("Drop optimization failed", err);
        editor.updateShape({ id: shapeId, props: { isScanning: false } } as any);
      }
    });
  };

  useEffect(() => {
    if (!editorRef.current) return;
    const editor = editorRef.current;
    
    const handleWheel = (e: WheelEvent) => {
        if (!e.ctrlKey) return;
        e.preventDefault();
        const currentCamera = editor.getCamera();
        const targetZoom = e.deltaY > 0 ? currentCamera.z * 0.9 : currentCamera.z * 1.1;
        animate({
            from: currentCamera.z,
            to: targetZoom,
            type: "spring",
            stiffness: 120,
            damping: 20,
            onUpdate: (v) => editor.setCamera({ ...currentCamera, z: v })
        });
    };

    window.addEventListener('wheel', handleWheel, { passive: false });
    return () => window.removeEventListener('wheel', handleWheel);
  }, []);

  return (
    <div className="w-full h-full bg-[#020202] relative overflow-hidden flex flex-col">
      <Tldraw 
        store={useMemo(() => createTLStore({ shapeUtils: customShapeUtils }), [])} 
        onMount={handleMount} 
        inferDarkMode 
        className="venus-lumina-canvas" 
      />
    </div>
  );
};

export default LuminaStudio;

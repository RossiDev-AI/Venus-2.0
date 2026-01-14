
import React, { useState, useEffect, useMemo } from 'react';
import Uppy from '@uppy/core';
import { Dashboard } from '@uppy/react';
import ImageEditor from '@uppy/image-editor';
import Compressor from '@uppy/compressor';
import { Archive, Wand2, Database, Scan, Plus, Check } from 'lucide-react';
import { VaultItem, CategorizedDNA, AppSettings } from '../../types';
import { extractDeepDNA } from '../../geminiService';

interface ManualNodeProps {
  onSave: (item: VaultItem) => Promise<void>;
  settings?: AppSettings;
}

const ManualNode: React.FC<ManualNodeProps> = ({ onSave, settings }) => {
  const [image, setImage] = useState<string | null>(null);
  const [dna, setDna] = useState<CategorizedDNA | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [isIndexing, setIsIndexing] = useState(false);

  const uppy = useMemo(() => {
    return new Uppy({
      id: 'industrial-uploader',
      restrictions: { maxNumberOfFiles: 1, allowedFileTypes: ['image/*'] },
      autoProceed: true
    })
    .use(ImageEditor, { quality: 0.8 })
    .use(Compressor, { quality: 0.8, maxWidth: 2048 });
  }, []);

  useEffect(() => {
    uppy.on('complete', (result) => {
      if (result.successful[0]) {
        const file = result.successful[0].data;
        const reader = new FileReader();
        reader.onload = (e) => {
            setImage(e.target?.result as string);
            setDna(null);
        };
        reader.readAsDataURL(file);
      }
    });
  }, [uppy]);

  const handleMagicBiopsy = async () => {
    if (!image || isScanning) return;
    setIsScanning(true);
    try {
      const result = await extractDeepDNA(image, settings);
      setDna(result);
    } catch (err) {
      alert('Neural Biopsy Protocol Interrupted.');
    } finally {
      setIsScanning(false);
    }
  };

  const handleIndex = async () => {
    if (!image || !dna || isIndexing) return;
    setIsIndexing(true);
    try {
      const item: VaultItem = {
        id: crypto.randomUUID(),
        shortId: `LCP-${Math.floor(10000 + Math.random() * 90000)}`,
        name: dna.character?.slice(0, 15) || 'Node',
        imageUrl: image,
        originalImageUrl: image,
        prompt: dna.technical_tags?.join(', ') || 'Latent Signal',
        agentHistory: [{ type: 'Visual Archivist', status: 'completed', message: 'Indexed via Uppy Industrial.', timestamp: Date.now() }],
        params: { 
          z_anatomy: 1, z_structure: 1, z_lighting: 1, z_texture: 1, 
          hz_range: "Industrial", structural_fidelity: 1.0, scale_factor: 1.0,
          neural_metrics: { loss_mse: 0, ssim_index: 1, tensor_vram: 0, iteration_count: 0, consensus_score: 1.0 } 
        },
        dna,
        rating: 5,
        timestamp: Date.now(),
        usageCount: 0,
        neuralPreferenceScore: 65,
        isFavorite: false,
        vaultDomain: 'X'
      };
      await onSave(item);
      setImage(null);
      setDna(null);
      uppy.reset();
    } finally {
      setIsIndexing(false);
    }
  };

  return (
    <div className="h-full p-6 md:p-12 bg-[#050505] overflow-y-auto">
      <div className="max-w-6xl mx-auto space-y-12">
        <div className="flex justify-between items-center">
            <div className="space-y-1">
                <h2 className="text-3xl font-black text-white uppercase tracking-tight flex items-center gap-3">
                    <Archive className="text-indigo-500" /> Indexação Industrial
                </h2>
                <p className="text-[10px] mono text-zinc-500 uppercase tracking-widest">Uppy Compressor v4.0 + Gemini Biopsy</p>
            </div>
            {image && (
                <button 
                  onClick={handleMagicBiopsy}
                  className={`px-6 py-3 bg-indigo-600/10 border border-indigo-500/20 text-indigo-400 rounded-2xl font-black text-[10px] uppercase tracking-widest flex items-center gap-3 transition-all ${isScanning ? 'animate-pulse' : 'hover:bg-indigo-600/20'}`}
                >
                    <Wand2 size={16} /> {isScanning ? 'Sequenciando...' : 'Neural Biopsy'}
                </button>
            )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            <div className="space-y-6">
                {!image ? (
                   <div className="rounded-[3rem] overflow-hidden border border-white/5">
                      <Dashboard 
                        uppy={uppy} 
                        width="100%" 
                        height={450} 
                        theme="dark"
                        proudlyDisplayPoweredByUppy={false}
                      />
                   </div>
                ) : (
                    <div className="relative aspect-square rounded-[3rem] overflow-hidden border border-white/5 bg-zinc-900 group">
                        <img src={image} className={`w-full h-full object-cover transition-all duration-700 ${isScanning ? 'blur-md grayscale' : ''}`} />
                        <button onClick={() => { setImage(null); uppy.reset(); }} className="absolute top-6 right-6 p-3 bg-black/60 rounded-full border border-white/10 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Plus size={20} className="rotate-45" />
                        </button>
                    </div>
                )}
            </div>

            <div className="space-y-8">
                {dna ? (
                    <div className="bg-zinc-900/40 border border-white/5 p-8 rounded-[3rem] space-y-6 animate-in slide-in-from-right-4">
                        <div className="flex items-center gap-3">
                            <Scan className="text-indigo-400" size={18} />
                            <span className="text-[10px] font-black uppercase text-zinc-400 tracking-widest">DNA Analysis Report</span>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="p-4 bg-black/40 rounded-2xl border border-white/5">
                                <span className="text-[8px] text-zinc-600 font-bold uppercase block">Character Identity</span>
                                <p className="text-[11px] text-white font-bold">{dna.character}</p>
                            </div>
                            <div className="p-4 bg-black/40 rounded-2xl border border-white/5">
                                <span className="text-[8px] text-zinc-600 font-bold uppercase block">Environment Context</span>
                                <p className="text-[11px] text-white font-bold">{dna.environment}</p>
                            </div>
                        </div>
                        <div className="space-y-2">
                            <span className="text-[8px] text-zinc-600 font-bold uppercase block px-1">Technical Tags</span>
                            <div className="flex flex-wrap gap-2">
                                {dna.technical_tags.map((t, i) => (
                                    <span key={i} className="px-3 py-1 bg-white/5 rounded-full border border-white/5 text-[9px] mono text-indigo-400 font-bold">{t}</span>
                                ))}
                            </div>
                        </div>
                        <button 
                          onClick={handleIndex}
                          disabled={isIndexing}
                          className="w-full py-6 bg-white text-black rounded-[2rem] font-black uppercase tracking-[0.4em] text-[10px] shadow-2xl active:scale-95 transition-all flex items-center justify-center gap-2"
                        >
                            {isIndexing ? 'Indexing...' : <><Check size={14} /> Commit to Vault</>}
                        </button>
                    </div>
                ) : (
                    <div className="h-full flex flex-col items-center justify-center border-2 border-dashed border-white/5 rounded-[3rem] opacity-20">
                        <Database size={48} className="mb-4" />
                        <p className="text-[10px] font-black uppercase tracking-widest">Awaiting Neural Biopsy Sequence...</p>
                    </div>
                )}
            </div>
        </div>
      </div>
    </div>
  );
};

export default ManualNode;

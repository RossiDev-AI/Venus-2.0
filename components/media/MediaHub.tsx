
import React, { useState, useEffect } from 'react';
import { useInfiniteQuery } from '@tanstack/react-query';
import { Search, Image as ImageIcon, Film, Sticker, Loader2 } from 'lucide-react';
import { AppSettings } from '../../types';

interface MediaHubProps {
  settings: AppSettings;
  onSelect: (url: string, type: 'IMAGE' | 'GIF') => void;
}

const MediaHub: React.FC<MediaHubProps> = ({ settings, onSelect }) => {
  const [query, setQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'pixabay' | 'giphy'>('pixabay');

  const fetchPixabay = async ({ pageParam = 1 }) => {
    const key = settings.pixabayApiKey || '47596236-49f3e46c753065b7582b135ba';
    const url = `https://pixabay.com/api/?key=${key}&q=${encodeURIComponent(query)}&page=${pageParam}&per_page=20&image_type=photo`;
    const res = await fetch(url);
    return res.json();
  };

  const fetchGiphy = async ({ pageParam = 0 }) => {
    const key = settings.giphyApiKey || 'dc6zaTOxFJmzC';
    const url = `https://api.giphy.com/v1/stickers/search?api_key=${key}&q=${encodeURIComponent(query)}&limit=20&offset=${pageParam}`;
    const res = await fetch(url);
    return res.json();
  };

  const handleDragStart = (e: React.DragEvent, url: string, type: 'IMAGE' | 'GIF') => {
    e.dataTransfer.setData('v-nus/media-url', url);
    e.dataTransfer.setData('v-nus/media-type', type);
    e.dataTransfer.effectAllowed = 'copy';
  };

  const {
    data: pixabayData,
    fetchNextPage: fetchNextPixabay,
    hasNextPage: hasNextPixabay,
    isFetching: isFetchingPixabay,
  } = useInfiniteQuery({
    queryKey: ['pixabay', query],
    queryFn: fetchPixabay,
    initialPageParam: 1,
    getNextPageParam: (lastPage, allPages) => lastPage.hits.length > 0 ? allPages.length + 1 : undefined,
    enabled: activeTab === 'pixabay' && query.length > 2,
  });

  const {
    data: giphyData,
    fetchNextPage: fetchNextGiphy,
    hasNextPage: hasNextGiphy,
    isFetching: isFetchingGiphy,
  } = useInfiniteQuery({
    queryKey: ['giphy', query],
    queryFn: fetchGiphy,
    initialPageParam: 0,
    getNextPageParam: (lastPage, allPages) => lastPage.data.length > 0 ? allPages.length * 20 : undefined,
    enabled: activeTab === 'giphy' && query.length > 2,
  });

  return (
    <div className="flex flex-col h-full bg-[#0a0a0c] border border-white/5 rounded-[2.5rem] overflow-hidden shadow-2xl">
      <div className="p-6 space-y-4 bg-zinc-900/40">
        <div className="flex items-center justify-between">
            <h3 className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">Mídias Globais</h3>
            <div className="flex gap-1 bg-black/40 p-1 rounded-xl border border-white/5">
                <button onClick={() => setActiveTab('pixabay')} className={`px-3 py-1 text-[8px] font-black uppercase rounded-lg transition-all ${activeTab === 'pixabay' ? 'bg-indigo-600 text-white' : 'text-zinc-500'}`}>Pixabay</button>
                <button onClick={() => setActiveTab('giphy')} className={`px-3 py-1 text-[8px] font-black uppercase rounded-lg transition-all ${activeTab === 'giphy' ? 'bg-pink-600 text-white' : 'text-zinc-500'}`}>Stickers</button>
            </div>
        </div>
        <div className="relative">
          <input 
            type="text" 
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Arraste para o canvas..."
            className="w-full bg-black/60 border border-white/10 rounded-2xl px-12 py-3 text-xs text-white outline-none focus:border-indigo-500/30 transition-all"
          />
          <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-600" />
          {(isFetchingPixabay || isFetchingGiphy) && <Loader2 size={16} className="absolute right-4 top-1/2 -translate-y-1/2 text-indigo-500 animate-spin" />}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
        {activeTab === 'pixabay' ? (
          <div className="grid grid-cols-2 gap-4">
             {pixabayData?.pages.flatMap(p => p.hits).map((hit: any) => (
                <div 
                  key={hit.id} 
                  draggable
                  onDragStart={(e) => handleDragStart(e, hit.largeImageURL, 'IMAGE')}
                  onClick={() => onSelect(hit.largeImageURL, 'IMAGE')}
                  className="group relative aspect-video bg-zinc-900 rounded-2xl overflow-hidden cursor-move hover:ring-2 ring-indigo-500 transition-all"
                >
                   <img src={hit.webformatURL} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                </div>
             ))}
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-3">
             {giphyData?.pages.flatMap(p => p.data).map((sticker: any) => (
                <div 
                  key={sticker.id} 
                  draggable
                  onDragStart={(e) => handleDragStart(e, sticker.images.original.url, 'GIF')}
                  onClick={() => onSelect(sticker.images.original.url, 'GIF')}
                  className="group relative aspect-square bg-zinc-900/40 rounded-xl overflow-hidden cursor-move hover:ring-2 ring-pink-500 transition-all flex items-center justify-center p-2"
                >
                   <img src={sticker.images.fixed_height_small.url} className="max-w-full max-h-full object-contain group-hover:scale-110 transition-transform" />
                </div>
             ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default MediaHub;

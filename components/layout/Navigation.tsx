
import React from 'react';
import { 
  Plus, Layout, Monitor, Palette, Video, 
  Layers, Database, FileText, Settings, Zap, Scan 
} from 'lucide-react';

interface NavItemProps {
  id: string;
  label: string;
  icon: React.ReactNode;
  badge?: number;
  activeTab: string;
  setActiveTab: (tab: any) => void;
  isMobile?: boolean;
}

const NavItem: React.FC<NavItemProps> = ({ id, label, icon, badge, activeTab, setActiveTab, isMobile }) => {
  const isActive = activeTab === id;
  return (
    <button 
      onClick={() => setActiveTab(id)} 
      className={`relative flex flex-col items-center justify-center md:flex-row gap-1 md:gap-3 px-2 md:px-5 py-2 rounded-xl md:rounded-full transition-all duration-500 group
        ${isActive ? 'text-white' : 'text-zinc-500 hover:text-zinc-300'}`}
    >
      {isActive && (
        <div className="absolute inset-0 bg-indigo-600/10 md:bg-indigo-600 rounded-xl md:rounded-full opacity-100 animate-in fade-in zoom-in-95" />
      )}
      <div className="relative flex flex-col md:flex-row items-center gap-1 md:gap-2 z-10">
         <span className={`transition-transform duration-300 group-hover:scale-110 ${isActive ? 'text-white' : 'text-zinc-500 group-hover:text-indigo-400'}`}>
          {icon}
         </span>
         <span className="text-[7px] md:text-[10px] font-black uppercase tracking-widest whitespace-nowrap overflow-hidden max-w-[45px] md:max-w-none text-center">
           {label}
         </span>
         {badge !== undefined && badge > 0 && (
           <span className="absolute -top-1 -right-1 md:static md:ml-1 px-1 min-w-[12px] h-[12px] bg-indigo-500 text-white text-[6px] md:text-[8px] font-black rounded-full flex items-center justify-center">
             {badge > 99 ? '99+' : badge}
           </span>
         )}
      </div>
    </button>
  );
};

interface NavigationProps {
  activeTab: string;
  setActiveTab: (tab: any) => void;
  vaultCount: number;
}

const Navigation: React.FC<NavigationProps> = ({ activeTab, setActiveTab, vaultCount }) => {
  const NAVIGATION_ITEMS = [
    { id: 'creation', label: 'Criar', icon: <Plus size={20} strokeWidth={3} /> },
    { id: 'workspace', label: 'Estúdio', icon: <Monitor size={20} strokeWidth={2.5} /> },
    { id: 'lumina', label: 'Lumina', icon: <Layers size={20} strokeWidth={2.5} /> },
    { id: 'grading', label: 'Cores', icon: <Palette size={20} strokeWidth={2.5} /> },
    { id: 'cinema', label: 'Cinema', icon: <Video size={20} strokeWidth={2.5} /> },
    { id: 'fusion', label: 'Fusion', icon: <Zap size={20} strokeWidth={2.5} /> },
    { id: 'manual', label: 'Index', icon: <Scan size={20} strokeWidth={2.5} /> },
    { id: 'vault', label: 'Vault', icon: <Database size={20} strokeWidth={2.5} />, badge: vaultCount },
    { id: 'docs', label: 'Docs', icon: <FileText size={20} strokeWidth={2.5} /> },
    { id: 'settings', label: 'Config', icon: <Settings size={20} strokeWidth={2.5} /> }
  ];

  return (
    <>
      <nav className="hidden lg:flex items-center absolute top-[14px] left-1/2 -translate-x-1/2 z-[600] bg-zinc-900/60 backdrop-blur-3xl border border-white/10 p-1 rounded-full shadow-2xl origin-center">
        {NAVIGATION_ITEMS.map((item) => (
          <NavItem key={item.id} {...item} activeTab={activeTab} setActiveTab={setActiveTab} />
        ))}
      </nav>

      <nav className="lg:hidden fixed bottom-4 left-2 right-2 z-[500] bg-black/85 backdrop-blur-3xl border border-white/10 h-20 rounded-[2.5rem] flex items-center justify-around px-2 shadow-2xl">
        {NAVIGATION_ITEMS.map((item) => (
          <NavItem key={item.id} {...item} activeTab={activeTab} setActiveTab={setActiveTab} isMobile />
        ))}
      </nav>
    </>
  );
};

export default Navigation;

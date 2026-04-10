import { useSelector } from 'react-redux';
import { ChevronDown, User } from 'lucide-react';

export default function Topbar() {
  const { user } = useSelector((state) => state.adminAuth);

  return (
    <div className="h-[72px] border-b border-white/5 bg-[#0B0D17] flex items-center justify-between px-6 shadow-2xl">
      {/* Left side info */}
      <div className="flex items-center gap-4 text-xl font-black text-white tracking-tighter uppercase italic">
         <span className="hidden md:inline-block w-[1px] h-6 bg-white/10 mr-2 -ml-2"></span>
         Registry Administrator
      </div>
      
      {/* Right Actions */}
      <div className="flex items-center gap-6">
        {/* Profile Dropdown */}
        <div className="flex items-center gap-4 px-5 py-2.5 bg-white/[0.03] border border-white/5 rounded-2xl cursor-pointer group hover:bg-white/[0.06] transition-all shadow-lg active:scale-95">
          <div className="w-9 h-9 rounded-xl bg-blue-600/20 border border-blue-500/30 flex items-center justify-center shadow-inner">
             <span className="text-sm font-black text-blue-500 uppercase">{user?.name?.[0] || 'A'}</span>
          </div>
          <div className="flex flex-col">
            <span className="text-[11px] font-black text-white tracking-widest uppercase leading-none">{user?.name || 'Admin'}</span>
            <span className="text-[8px] font-black text-zinc-600 uppercase tracking-[0.2em] mt-1.5">Authorized Access</span>
          </div>
          <ChevronDown className="w-3.5 h-3.5 text-zinc-600 group-hover:text-blue-500 transition-colors ml-2" />
        </div>
      </div>
    </div>
  );
}

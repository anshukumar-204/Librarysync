import React from 'react';
import StudentTable from '../features/students/StudentTable';
import StudentEditModal from '../features/students/StudentEditModal';
import { Plus } from 'lucide-react';

import { useDispatch } from 'react-redux';
import { openEditModal } from '../features/students/studentSlice';
import { Search } from 'lucide-react';

export default function StudentManagementPage() {
  const dispatch = useDispatch();
  const [searchTerm, setSearchTerm] = React.useState('');

  return (
    <div className="w-full max-w-7xl mx-auto pb-10">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mt-8 mb-4 px-2">
        <div className="flex flex-col gap-1">
          <h1 className="text-4xl font-black text-white tracking-tighter uppercase italic leading-none">Student Records</h1>
          <p className="text-[10px] text-zinc-500 font-black uppercase tracking-[0.3em] ml-1">Archive & Registry Control</p>
        </div>
        
        <div className="flex flex-col sm:flex-row items-center gap-4 flex-1 max-w-2xl justify-end">
          <div className="relative w-full max-w-md group">
            <div className="absolute inset-y-0 left-5 flex items-center pointer-events-none text-zinc-500 group-focus-within:text-emerald-500 transition-colors">
              <Search className="w-4 h-4" strokeWidth={3} />
            </div>
            <input 
              type="text" 
              placeholder="SEARCH IDENTITY (NAME/EMAIL/MOBILE)..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-[#121521]/60 backdrop-blur-xl border border-white/5 rounded-[24px] py-4 pl-14 pr-6 text-white text-[10px] font-black uppercase tracking-widest focus:outline-none focus:border-emerald-500/50 transition-all placeholder:text-zinc-600 shadow-2xl"
            />
          </div>

          <button 
            onClick={() => dispatch(openEditModal(null))}
            className="w-full sm:w-auto flex items-center justify-center gap-3 px-8 py-4 rounded-[24px] bg-emerald-600 text-white font-black text-[11px] uppercase tracking-[0.2em] shadow-2xl shadow-emerald-500/20 hover:scale-[1.02] active:scale-95 transition-all shrink-0"
          >
          <Plus className="w-4 h-4" strokeWidth={3} />
          <span>Register Student</span>
        </button>
      </div>
    </div>

      <StudentTable searchTerm={searchTerm} />
      <StudentEditModal />
    </div>
  );
}

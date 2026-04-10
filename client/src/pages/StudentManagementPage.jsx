import React from 'react';
import StudentTable from '../features/students/StudentTable';
import StudentEditModal from '../features/students/StudentEditModal';
import { Plus } from 'lucide-react';

import { useDispatch } from 'react-redux';
import { openEditModal } from '../features/students/studentSlice';

export default function StudentManagementPage() {
  const dispatch = useDispatch();

  return (
    <div className="w-full max-w-7xl mx-auto pb-10">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mt-4">
        <h1 className="text-3xl font-black text-white tracking-tighter uppercase italic">Registry Hub</h1>
        <button 
          onClick={() => dispatch(openEditModal(null))}
          className="flex items-center gap-3 px-8 py-4 rounded-[24px] bg-emerald-600 text-white font-black text-[11px] uppercase tracking-[0.2em] shadow-2xl shadow-emerald-500/20 hover:scale-[1.02] active:scale-95 transition-all shrink-0"
        >
          <Plus className="w-4 h-4" strokeWidth={3} />
          <span>Onboard Student</span>
        </button>
      </div>

      <StudentTable />
      <StudentEditModal />
    </div>
  );
}

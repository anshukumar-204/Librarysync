import { MoreHorizontal, PenLine, ChevronLeft, ChevronRight, Eye, Loader2, AlertCircle, Search } from 'lucide-react';
import { cn } from '../../utils/cn';
import { calculateFeeStatus } from '../../utils/feeUtils';
import { fetchStudents, openEditModal } from './studentSlice';
import { useDispatch, useSelector } from 'react-redux';
import { useEffect } from 'react';

export default function StudentTable({ searchTerm }) {
  const dispatch = useDispatch();
  const { students, loading, error } = useSelector((state) => state.students);

  useEffect(() => {
    dispatch(fetchStudents());
  }, [dispatch]);

  const filteredStudents = students.filter(student => {
    if (!searchTerm) return true;
    const searchLower = searchTerm.toLowerCase();
    const name = (student.fullName || student.name || '').toLowerCase();
    const email = (student.email || student.user?.email || '').toLowerCase();
    const mobile = (student.mobile || student.user?.mobile || '').toLowerCase();
    const id = student.id?.toString() || '';
    
    return name.includes(searchLower) || 
           email.includes(searchLower) || 
           mobile.includes(searchLower) ||
           id.includes(searchLower);
  });

  if (loading && students.length === 0) {
    return (
      <div className="w-full h-96 flex flex-col items-center justify-center bg-[#121521]/40 backdrop-blur-xl rounded-[40px] border border-white/5 mt-8">
        <Loader2 className="w-12 h-12 text-blue-500 animate-spin mb-4" />
        <p className="text-zinc-500 font-black uppercase tracking-[0.3em] text-[10px]">Accessing Core Registry...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full h-96 flex flex-col items-center justify-center bg-[#121521]/40 backdrop-blur-xl rounded-[40px] border border-rose-500/20 mt-8">
        <AlertCircle className="w-12 h-12 text-rose-500 mb-4" />
        <p className="text-rose-500 font-black uppercase tracking-[0.3em] text-[10px]">Registry Authentication Failed</p>
        <p className="text-zinc-500 text-xs mt-2">{error}</p>
        <button onClick={() => dispatch(fetchStudents())} className="mt-6 px-8 py-3 bg-white/[0.03] hover:bg-white/[0.08] text-white rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all border border-white/5 shadow-xl">Retry Sync</button>
      </div>
    );
  }

  return (
    <div className="w-full bg-[#121521]/40 backdrop-blur-xl rounded-[40px] border border-white/5 shadow-[0_32px_80px_rgba(0,0,0,0.5)] overflow-hidden mt-8 flex flex-col">
      <div className="overflow-x-auto custom-scrollbar">
        <table className="w-full text-left text-[11px] whitespace-nowrap border-collapse">
          <thead>
            <tr className="bg-white/[0.02] text-zinc-500 border-b border-white/[0.05] uppercase font-black tracking-[0.3em] text-[9px]">
              <th className="px-10 py-7">ID_CODE</th>
              <th className="px-6 py-7">CORE_IDENTITY</th>
              <th className="px-6 py-7">PROXY_UNIT</th>
              <th className="px-6 py-7">COMMS_NODE</th>
              <th className="px-6 py-7 text-center">STATUS</th>
              <th className="px-6 py-7 text-center">FINANCIALS</th>
              <th className="px-10 py-7 text-right">OPERATIONS</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/[0.02]">
            {filteredStudents.length === 0 && (
              <tr>
                <td colSpan="7" className="px-10 py-20 text-center">
                   <div className="flex flex-col items-center justify-center opacity-40">
                      <Search className="w-10 h-10 mb-4 text-zinc-600" />
                      <p className="text-[10px] font-black uppercase tracking-[0.4em] text-zinc-500">No matching nodes found in registry</p>
                   </div>
                </td>
              </tr>
            )}
            {filteredStudents.map((student, idx) => (
              <tr
                key={student.id || idx}
                className="group hover:bg-white/[0.01] transition-all duration-300"
              >
                <td className="px-10 py-6 font-black text-zinc-600 group-hover:text-blue-500 transition-colors uppercase tracking-widest text-[10px]">
                  #{student.id?.toString().padStart(3, '0') || '000'}
                </td>
                <td className="px-6 py-6 font-black">
                  <div className="flex items-center gap-4">
                    <div className="w-11 h-11 rounded-2xl bg-zinc-900 border border-white/5 flex items-center justify-center text-[12px] font-black text-blue-500 uppercase shadow-inner overflow-hidden shrink-0">
                      {student.profileImage ? (
                        <img src={student.profileImage} className="w-full h-full object-cover" alt="p" />
                      ) : (
                        (student.fullName || student.name || 'S')?.[0]
                      )}
                    </div>
                    <div className="flex flex-col">
                      <span className="text-white tracking-tight text-sm uppercase leading-none">{student.fullName || student.name}</span>
                      <span className="text-[9px] text-zinc-500 font-black uppercase tracking-widest mt-1.5 opacity-60">Auth-ID Verified</span>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-6">
                  <div className="flex flex-col gap-1.5">
                    <span className="text-zinc-400 font-bold italic tracking-tight uppercase text-[11px] leading-none">{student.fatherName || 'N/A'}</span>
                    <span className="text-[9px] text-zinc-600 font-black uppercase tracking-widest leading-none">Guardian Unit</span>
                  </div>
                </td>
                <td className="px-6 py-6">
                  <div className="flex flex-col gap-2">
                    <span className="text-zinc-300 font-bold text-[11px] leading-none">{student.email || student.user?.email || 'N/A'}</span>
                    <span className="text-[10px] text-zinc-500 font-black tracking-widest leading-none">{student.mobile || student.user?.mobile || 'N/A'}</span>
                  </div>
                </td>
                <td className="px-6 py-6">
                  <div className="flex justify-center">
                    <span className={cn(
                      "px-4 py-2 text-[9px] font-black uppercase tracking-widest rounded-full border",
                      (student.status?.toLowerCase() === 'active' || student.user?.status?.toLowerCase() === 'active')
                        ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20"
                        : "bg-rose-500/10 text-rose-500 border-rose-500/20"
                    )}>
                      {student.status || student.user?.status || 'Active'}
                    </span>
                  </div>
                </td>
                <td className="px-6 py-6 border-l border-white/[0.02]">
                  <div className="flex flex-col items-center gap-1">
                    {(() => {
                        const fee = calculateFeeStatus(student);
                        const colors = {
                            emerald: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20 shadow-[0_0_15px_rgba(16,185,129,0.1)]",
                            rose: "bg-rose-500/20 text-rose-400 border-rose-500/20 animate-pulse shadow-[0_0_15px_rgba(244,63,94,0.1)]",
                            blue: "bg-blue-500/10 text-blue-500 border-blue-500/20 shadow-[0_0_15px_rgba(59,130,246,0.1)]",
                            zinc: "bg-zinc-500/10 text-zinc-500 border-zinc-500/20"
                        };
                        return (
                            <span className={cn("px-4 py-1.5 rounded-xl text-[8px] font-black uppercase tracking-[0.2em] border transition-all", colors[fee.color])}>
                                {fee.label}
                            </span>
                        );
                    })()}
                  </div>
                </td>
                <td className="px-10 py-6">
                  <div className="flex items-center justify-end gap-3.5">
                    <button
                      onClick={() => dispatch(openEditModal({ student, mode: 'view' }))}
                      className="p-3 bg-white/[0.03] text-zinc-600 hover:text-blue-500 hover:bg-white/[0.08] rounded-2xl transition-all shadow-xl"
                      title="View Full Profile"
                    >
                      <Eye size={15} strokeWidth={2.5} />
                    </button>
                    <button
                      onClick={() => dispatch(openEditModal({ student, mode: 'edit' }))}
                      className="p-3 bg-white/[0.03] text-zinc-600 hover:text-emerald-500 hover:bg-white/[0.08] rounded-2xl transition-all shadow-xl"
                      title="Modify Record"
                    >
                      <PenLine size={14} strokeWidth={2.5} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer */}
      <div className="px-10 py-6 border-t border-white/[0.03] flex items-center justify-between bg-white/[0.01] text-[9px] font-black text-zinc-500 uppercase tracking-widest">
        <div>Registry Index: {filteredStudents.length} / {students.length} NODES</div>
        <div className="flex items-center gap-4">
          <button className="hover:text-white transition-colors cursor-not-allowed opacity-30"><ChevronLeft size={16} /></button>
          <div className="flex items-center gap-2">
            <button className="w-8 h-8 flex items-center justify-center rounded-xl bg-blue-600/20 text-blue-500 border border-blue-500/20 shadow-lg">01</button>
          </div>
          <button className="hover:text-white transition-colors"><ChevronRight size={16} /></button>
        </div>
      </div>
    </div>
  );
}

import React from 'react';
import { 
  Mail, Phone, Award, Clock, Briefcase, FileText, GraduationCap, MapPin, Home, Building2
} from "lucide-react";

export default function StudentProfileView({ student }) {
  if (!student) return null;

  const infoItems = [
    { icon: <Mail size={14}/>, label: "Official Email", value: student.email || student.user?.email || "N/A", color: "text-blue-500" },
    { icon: <Phone size={14}/>, label: "Primary Mobile", value: student.mobile || student.user?.mobile || "N/A", color: "text-emerald-500" },
    { icon: <Briefcase size={14}/>, label: "Parental Proxy", value: student.fatherName || "N/A", color: "text-indigo-500" },
    { icon: <Home size={14}/>, label: "Village / Locality", value: student.village || "N/A", color: "text-cyan-500" },
    { icon: <Building2 size={14}/>, label: "Post Office", value: student.post || "N/A", color: "text-purple-500" },
    { icon: <MapPin size={14}/>, label: "District Registry", value: student.district || "N/A", color: "text-rose-500" },
    { icon: <Clock size={14}/>, label: "Cloud Synchronization", value: "Real-time Verified", color: "text-emerald-400" },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-in fade-in slide-in-from-bottom-3 duration-700">
      {infoItems.map((item, idx) => (
        <div 
          key={idx} 
          className="p-5 bg-zinc-900/40 border border-white/[0.03] rounded-[28px] group hover:bg-zinc-900/60 hover:border-white/[0.08] transition-all duration-300"
        >
          <div className="flex items-center gap-3.5 mb-3">
            <div className={`p-2.5 bg-zinc-950 rounded-xl ${item.color} shadow-inner group-hover:scale-110 transition-transform duration-500`}>
              {item.icon}
            </div>
            <span className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em]">{item.label}</span>
          </div>
          <p className="text-[13px] font-black text-white ml-12 tracking-tight">
            {item.value}
          </p>
        </div>
      ))}
      
      {/* Physical Address Section - Full Width */}
      <div className="col-span-full mt-2 p-7 bg-gradient-to-br from-zinc-900/50 to-transparent border border-white/[0.03] rounded-[36px] relative overflow-hidden group">
        <div className="absolute -top-24 -right-24 w-48 h-48 bg-emerald-500/5 blur-[80px] rounded-full group-hover:bg-emerald-500/10 transition-colors" />
        
        <div className="flex items-center gap-2 mb-4">
            <MapPin size={14} className="text-emerald-500" />
            <h4 className="text-[10px] font-black text-emerald-500 uppercase tracking-[0.3em] italic">Full Physical Address</h4>
        </div>

        <p className="text-[13px] text-zinc-400 leading-[1.8] font-medium max-w-[95%]">
          {student.address || "No secondary physical address details identified for this student profile."}
          <br/>
          <span className="text-[11px] text-zinc-600 italic">
            State: {student.state || "N/A"} | Pincode: {student.pincode || "N/A"}
          </span>
        </p>

        <div className="mt-8 flex items-start gap-3 p-5 bg-white/[0.02] border border-white/5 rounded-[24px]">
           <FileText size={16} className="text-zinc-600 mt-1 shrink-0" />
           <div className="space-y-1">
              <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Administrative Bio</span>
              <p className="text-[12px] text-zinc-500 leading-relaxed italic">
                 {student.bio || "No behavioral notes or internal metadata assigned to this entity."}
              </p>
           </div>
        </div>

        {/* Metadata Footer */}
        <div className="mt-6 pt-6 border-t border-white/[0.03] flex items-center justify-between">
            <div className="flex items-center gap-2">
                <div className={`w-1.5 h-1.5 rounded-full ${student.status === 'Active' || student.user?.status === 'active' ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                <span className="text-[9px] font-black text-zinc-500 uppercase tracking-widest">
                    Operational Status: {student.status || student.user?.status || "Hold"}
                </span>
            </div>
            <span className="text-[9px] font-bold text-zinc-700 uppercase tracking-tighter italic">Cloud ID: {student.userId || "Node-0"}</span>
        </div>
      </div>
    </div>
  );
}

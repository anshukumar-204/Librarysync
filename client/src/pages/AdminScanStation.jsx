import React from 'react';
import { QRCodeCanvas } from 'qrcode.react';
import { motion } from 'framer-motion';
import { ShieldCheck, MapPin, GraduationCap, ArrowLeft, RefreshCw, Printer } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function AdminScanStation() {
  const qrValue = import.meta.env.VITE_LIBRARY_STATION_SECRET || "LIBRARY_NODE_QR_MOCK"; // Secure QR for the library station

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="min-h-screen bg-[#0B0D17] text-gray-300 font-sans selection:bg-blue-500/30 overflow-hidden relative">
      {/* Background Ambience */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-[-10%] right-[-5%] w-[40%] h-[40%] bg-blue-600/5 blur-[120px] rounded-full" />
        <div className="absolute bottom-[-10%] left-[-5%] w-[40%] h-[40%] bg-indigo-600/5 blur-[120px] rounded-full" />
      </div>

      <nav className="relative z-10 border-b border-white/5 bg-[#0B0D17]/50 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link to="/admin/dashboard" className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition-all">
                <ArrowLeft size={18} />
            </Link>
            <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-lg shadow-blue-500/20">
              <GraduationCap size={24} />
            </div>
            <span className="text-xl font-bold text-white tracking-tight">Admin<span className="text-blue-500">Portal</span></span>
          </div>
          <div className="text-[10px] uppercase font-bold tracking-[0.2em] text-gray-500 px-4 py-2 border border-white/5 rounded-full">
            Live Scan Station Active
          </div>
        </div>
      </nav>

      <main className="relative z-10 max-w-4xl mx-auto px-6 py-12 flex flex-col items-center">
        <div className="text-center mb-12">
            <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center justify-center gap-2 text-blue-400 text-xs font-bold uppercase tracking-[0.2em] mb-4"
            >
                <ShieldCheck size={16} />
                Secure Attendance Scanner
            </motion.div>
            <h1 className="text-4xl md:text-5xl font-bold text-white tracking-tight mb-4">
                Library Check-in Station
            </h1>
            <p className="text-gray-400 max-w-lg mx-auto leading-relaxed">
                Display this QR code at the library entrance. Students scan this code via their portal to automatically mark arrival and departure.
            </p>
        </div>

        <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="p-12 relative"
        >
            {/* Corner Markers */}
            <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-blue-500/50 rounded-tl-xl" />
            <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-blue-500/50 rounded-tr-xl" />
            <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-blue-500/50 rounded-bl-xl" />
            <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-blue-500/50 rounded-br-xl" />

            <div className="bg-white p-10 rounded-[2.5rem] shadow-2xl shadow-blue-500/5 print:p-4 print:shadow-none">
                <QRCodeCanvas 
                    value={qrValue} 
                    size={320}
                    level="H"
                    includeMargin={false}
                />
            </div>
            
            <div className="mt-8 flex flex-col items-center gap-2">
                <div className="flex items-center gap-2 text-gray-500 font-mono text-xs uppercase tracking-widest bg-white/5 px-4 py-2 rounded-full border border-white/5">
                    <MapPin size={12} className="text-blue-500" />
                    Station ID: MAIN_HUB_01
                </div>
            </div>
        </motion.div>

        <div className="mt-16 flex items-center gap-6 no-print">
            <button 
                onClick={handlePrint}
                className="group flex items-center gap-3 px-8 py-4 rounded-2xl bg-white/5 border border-white/5 hover:border-blue-500/30 hover:bg-blue-500/5 transition-all duration-300 font-bold text-white shadow-xl"
            >
                <Printer size={20} className="group-hover:scale-110 transition-transform" />
                Print Station QR
            </button>
            <button 
                className="group flex items-center gap-3 px-8 py-4 rounded-2xl bg-white/5 border border-white/5 hover:border-emerald-500/30 hover:bg-emerald-500/5 transition-all duration-300 font-bold text-emerald-400 group shadow-xl"
            >
                <RefreshCw size={20} className="group-hover:rotate-180 transition-transform duration-700" />
                Refresh Station
            </button>
        </div>

        {/* Print Styles */}
        <style dangerouslySetInnerHTML={{ __html: `
          @media print {
            .no-print { display: none !important; }
            body { background: white !important; color: black !important; }
            .bg-[#0B0D17] { background: white !important; }
            .glass-card { border: none !important; box-shadow: none !important; }
            nav { display: none !important; }
            h1 { color: black !important; }
            p { color: #333 !important; }
          }
        `}} />
      </main>
    </div>
  );
}

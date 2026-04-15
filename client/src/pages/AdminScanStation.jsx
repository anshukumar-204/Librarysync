import React from 'react';
import { QRCodeCanvas } from 'qrcode.react';
import { motion } from 'framer-motion';
import { ShieldCheck, MapPin, GraduationCap, ArrowLeft, RefreshCw, Printer } from 'lucide-react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';

export default function AdminScanStation() {
  const qrValue = import.meta.env.VITE_LIBRARY_STATION_SECRET || "LIBRARY_NODE_QR_MOCK"; // Secure QR for the library station
  const [lastRefreshTime, setLastRefreshTime] = React.useState(new Date());
  const qrSize = typeof window !== 'undefined' && window.innerWidth < 640 ? 220 : 320;

  const handlePrint = () => {
    window.print();
  };

  const handleRefreshStation = () => {
    setLastRefreshTime(new Date());
    toast.success('Station QR verified and refreshed.');
  };

  return (
    <div className="min-h-screen bg-[#0B0D17] text-gray-300 font-sans selection:bg-blue-500/30 overflow-hidden relative">
      {/* Background Ambience */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-[-10%] right-[-5%] w-[40%] h-[40%] bg-blue-600/5 blur-[120px] rounded-full" />
        <div className="absolute bottom-[-10%] left-[-5%] w-[40%] h-[40%] bg-indigo-600/5 blur-[120px] rounded-full" />
      </div>

      <nav className="relative z-10 border-b border-white/5 bg-[#0B0D17]/50 backdrop-blur-xl">
        <div className="mx-auto flex min-h-20 max-w-7xl flex-col gap-4 px-4 py-4 sm:h-20 sm:flex-row sm:items-center sm:justify-between sm:px-6 sm:py-0">
          <div className="flex items-center gap-3">
            <Link to="/admin/dashboard" className="rounded-lg bg-white/5 p-2 text-gray-400 transition-all hover:bg-white/10 hover:text-white">
                <ArrowLeft size={18} />
            </Link>
            <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-lg shadow-blue-500/20">
              <GraduationCap size={24} />
            </div>
            <span className="text-lg font-bold tracking-tight text-white sm:text-xl">Admin<span className="text-blue-500">Portal</span></span>
          </div>
          <div className="w-full rounded-full border border-white/5 px-4 py-2 text-center text-[10px] font-bold uppercase tracking-[0.2em] text-gray-500 sm:w-auto">
            Live Scan Station Active
          </div>
        </div>
      </nav>

      <main className="relative z-10 mx-auto flex max-w-4xl flex-col items-center px-4 py-8 sm:px-6 sm:py-12">
        <div className="mb-10 text-center sm:mb-12">
            <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-4 flex items-center justify-center gap-2 text-center text-[11px] font-bold uppercase tracking-[0.2em] text-blue-400 sm:text-xs"
            >
                <ShieldCheck size={16} />
                Secure Attendance Scanner
            </motion.div>
            <h1 className="mb-4 text-3xl font-bold tracking-tight text-white sm:text-4xl md:text-5xl">
                Library Check-in Station
            </h1>
            <p className="mx-auto max-w-lg px-2 leading-relaxed text-gray-400 sm:px-0">
                Display this QR code at the library entrance. Students scan this code via their portal to automatically mark arrival and departure.
            </p>
        </div>

        <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="relative w-full max-w-[22rem] p-6 sm:max-w-none sm:p-12"
        >
            {/* Corner Markers */}
            <div className="absolute left-0 top-0 h-6 w-6 rounded-tl-xl border-l-4 border-t-4 border-blue-500/50 sm:h-8 sm:w-8" />
            <div className="absolute right-0 top-0 h-6 w-6 rounded-tr-xl border-r-4 border-t-4 border-blue-500/50 sm:h-8 sm:w-8" />
            <div className="absolute bottom-0 left-0 h-6 w-6 rounded-bl-xl border-b-4 border-l-4 border-blue-500/50 sm:h-8 sm:w-8" />
            <div className="absolute bottom-0 right-0 h-6 w-6 rounded-br-xl border-b-4 border-r-4 border-blue-500/50 sm:h-8 sm:w-8" />

            <div className="rounded-[2rem] bg-white p-5 shadow-2xl shadow-blue-500/5 sm:rounded-[2.5rem] sm:p-10 print:p-4 print:shadow-none">
                <QRCodeCanvas 
                    value={qrValue} 
                    size={qrSize}
                    level="H"
                    includeMargin={false}
                />
            </div>
            
            <div className="mt-6 flex flex-col items-center gap-3 sm:mt-8">
                <div className="flex items-center gap-2 rounded-full border border-white/5 bg-white/5 px-4 py-2 text-center font-mono text-[11px] uppercase tracking-widest text-gray-500 sm:text-xs">
                    <MapPin size={12} className="text-blue-500" />
                    Station ID: MAIN_HUB_01
                </div>
                <div className="rounded-full border border-emerald-500/10 bg-emerald-500/5 px-4 py-2 text-center text-[10px] font-bold uppercase tracking-[0.2em] text-emerald-400">
                  Last verified {lastRefreshTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </div>
            </div>
        </motion.div>

        <div className="no-print mt-10 grid w-full max-w-xl grid-cols-1 gap-4 sm:mt-16 sm:grid-cols-2 sm:gap-6">
            <button 
                onClick={handlePrint}
                className="group flex w-full items-center justify-center gap-3 rounded-2xl border border-white/5 bg-white/5 px-6 py-4 font-bold text-white shadow-xl transition-all duration-300 hover:border-blue-500/30 hover:bg-blue-500/5"
            >
                <Printer size={20} className="group-hover:scale-110 transition-transform" />
                Print Station QR
            </button>
            <button 
                onClick={handleRefreshStation}
                className="group flex w-full items-center justify-center gap-3 rounded-2xl border border-white/5 bg-white/5 px-6 py-4 font-bold text-emerald-400 shadow-xl transition-all duration-300 hover:border-emerald-500/30 hover:bg-emerald-500/5"
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

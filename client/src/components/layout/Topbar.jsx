import React from 'react';
import { Search, Calendar, Bell, ChevronDown } from 'lucide-react';

export default function Topbar() {
  return (
    <div className="h-[72px] border-b border-white/5 bg-[#0B0D17] flex items-center justify-between px-6">
      {/* Title / Breadcrumbs could go here, or we let the page handle it. Left side padding */}
      <div className="flex items-center gap-4 text-xl font-semibold text-gray-200">
         <span className="hidden md:inline-block w-[1px] h-6 bg-white/10 mr-2 -ml-2"></span>
         Student Management
      </div>
      
      {/* Right Actions */}
      <div className="flex items-center gap-6">
        {/* Search */}
        <div className="relative hidden md:block">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
          <input 
            type="text" 
            placeholder="Search" 
            className="bg-[#121521] border border-white/5 text-sm rounded-full pl-9 pr-4 py-1.5 focus:outline-none focus:border-primary-500/50 focus:ring-1 focus:ring-primary-500/50 w-64 text-gray-200 placeholder-gray-500 transition-all"
          />
        </div>
        
        {/* Icons */}
        <div className="flex items-center gap-4">
          <button className="text-gray-400 hover:text-gray-200 transition-colors">
            <Calendar className="w-5 h-5" />
          </button>
          <button className="text-gray-400 hover:text-gray-200 transition-colors relative">
            <Bell className="w-5 h-5" />
            <span className="absolute top-0 right-0 w-2 h-2 bg-red-500 rounded-full border-[2px] border-[#0B0D17]"></span>
          </button>
        </div>

        {/* Profile Dropdown */}
        <div className="flex items-center gap-3 cursor-pointer group">
          <div className="w-8 h-8 rounded-full bg-surface border border-white/10 flex items-center justify-center">
             <span className="text-sm font-medium text-gray-300">A</span>
          </div>
          <span className="text-sm font-medium text-gray-300 group-hover:text-white transition-colors">Admin</span>
          <ChevronDown className="w-4 h-4 text-gray-500 group-hover:text-gray-300 transition-colors" />
        </div>
      </div>
    </div>
  );
}

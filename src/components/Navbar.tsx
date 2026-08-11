import React from 'react';
import {
  Search,
  Bell,
  User,
  Settings,
  Moon,
  ShieldCheck,
  Radio,
  Cpu
} from 'lucide-react';
import { activeProject } from '../mockData';
import type { Survey } from '../types';

interface NavbarProps {
  deviceConnected: boolean;
  selectedSurvey: Survey | null;
  activeTab: string;
}

export const Navbar: React.FC<NavbarProps> = ({ selectedSurvey, activeTab }) => {
  return (
    <header className="w-full h-[60px] bg-[#06080E] border-b border-white/5 flex items-center justify-between px-6 z-40 select-none font-sans text-slate-100 shrink-0 shadow-lg">
      
      {/* Left: Logo, Project Name, Breadcrumb */}
      <div className="flex items-center gap-4">
        <img src="/dats_logo.png" alt="DATS Logo" className="h-[26px] w-auto select-none" />
        <div className="h-4 w-[1px] bg-white/10" />
        <div className="flex items-center gap-2 text-[11px] text-[#94A3B8] font-medium font-sans">
          <span className="text-[#3B82F6] font-bold font-mono tracking-[1.5px] text-[10.5px]">NIRIKSHAN</span>
          <span>/</span>
          <span className="text-slate-500 uppercase tracking-wider text-[9px] font-bold font-mono">
            {activeTab === 'live_survey' ? 'Live Stream' : 'GIS'}
          </span>
        </div>
      </div>

      {/* Right: Global Search, Notifications, Theme Toggle, Settings, User Profile */}
      <div className="flex items-center gap-3.5 shrink-0">
        
        {/* Global Search */}
        <div className="relative w-[180px] hidden md:block">
          <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Global Search..."
            className="w-full bg-[#202B3D]/50 border border-white/5 rounded-xl pl-9 pr-3.5 py-1 text-[11px] text-white placeholder-slate-500 outline-none focus:border-[#3B82F6] focus:ring-1 focus:ring-[#3B82F6]/30 transition-all font-sans"
          />
        </div>

        {/* Notifications */}
        <button 
          className="relative p-2 hover:bg-[#182132] rounded-xl border border-white/5 text-slate-400 hover:text-white transition-all"
          title="Notifications"
        >
          <Bell className="w-4 h-4" />
          <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-[#EF4444] animate-pulse" />
        </button>

        {/* Theme Toggle */}
        <button 
          className="p-2 hover:bg-[#182132] rounded-xl border border-white/5 text-slate-400 hover:text-white transition-all"
          title="Toggle Theme"
        >
          <Moon className="w-4 h-4" />
        </button>

        {/* Settings */}
        <button 
          className="p-2 hover:bg-[#182132] rounded-xl border border-white/5 text-slate-400 hover:text-white transition-all"
          title="Settings"
        >
          <Settings className="w-4 h-4" />
        </button>

        {/* User Profile */}
        <div className="flex items-center gap-2.5 pl-2.5 border-l border-white/10">
          <div className="w-8 h-8 rounded-xl bg-[#182132] border border-white/10 flex items-center justify-center shadow-inner">
            <User className="w-4 h-4 text-[#3B82F6]" />
          </div>
          <div className="flex flex-col text-left font-sans leading-none">
            <span className="text-[11px] font-semibold text-white">A. Kumar</span>
            <span className="text-[8px] text-[#94A3B8] font-bold uppercase mt-0.5 tracking-wider font-mono">Lead Analyst</span>
          </div>
        </div>
      </div>

    </header>
  );
};

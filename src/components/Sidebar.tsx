import React from 'react';
import {
  Map,
  History,
  FileText,
  Cpu,
  Users,
  Settings,
  ChevronLeft,
  ChevronRight,
  Activity,
  Server,
  SlidersHorizontal,
  ShieldCheck,
  UserCheck
} from 'lucide-react';
import type { UserItem } from '../types';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  isCollapsed: boolean;
  setIsCollapsed: (collapsed: boolean) => void;
  currentUser?: UserItem | null;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  setActiveTab,
  isCollapsed,
  setIsCollapsed,
  currentUser
}) => {
  const userRole = currentUser?.role || 'VIEWER';
  const isSuperAdmin = userRole === 'SUPER_ADMIN';
  const isSupervisor = userRole === 'SUPERVISOR';
  const isOperatorOrViewer = userRole === 'OPERATOR' || userRole === 'VIEWER';

  const workspaceItems = [
    { id: 'gis_workspace', label: 'GIS Workspace', icon: Map }
  ];

  const surveysItems = [
    { id: 'survey_explorer', label: 'Survey Explorer', icon: SlidersHorizontal },
    { id: 'survey_history', label: 'Survey History', icon: History }
  ];

  // Management items dynamically filtered
  const managementItems = [
    { id: 'edge_devices', label: 'Edge Node Devices', icon: Cpu }
  ];

  if (isSuperAdmin || isSupervisor) {
    managementItems.push({ id: 'users', label: 'User Directory', icon: Users });
  } else {
    managementItems.push({ id: 'users', label: 'My Profile', icon: UserCheck });
  }

  // Admin items dynamically filtered
  const adminItems = [
    { id: 'reports', label: 'Reports', icon: FileText }
  ];

  if (isSuperAdmin) {
    adminItems.push({ id: 'permissions', label: 'Permission Config', icon: ShieldCheck });
  }

  adminItems.push({ id: 'settings', label: 'Settings', icon: Settings });

  const renderNavGroup = (title: string, items: Array<{ id: string; label: string; icon: any; live?: boolean }>) => {
    return (
      <div className="space-y-1">
        {!isCollapsed && (
          <span className="text-[#94A3B8] text-[8px] font-bold uppercase tracking-widest block px-3.5 mb-2 font-mono">
            {title}
          </span>
        )}
        <div className="space-y-1">
          {items.map((item) => {
            const Icon = item.icon;
            const active = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-full h-[38px] flex items-center rounded-xl transition-all duration-200 relative text-[11px] font-medium ${
                  isCollapsed ? 'justify-center px-0' : 'justify-between px-3.5'
                } ${
                  active
                    ? 'text-white bg-gradient-to-r from-[#3B82F6]/20 to-[#3B82F6]/5 shadow-[0_0_12px_rgba(59,130,246,0.12)]'
                    : 'text-slate-400 hover:text-slate-100 hover:bg-[#182132]/45'
                }`}
                title={item.label}
              >
                {/* Active left glowing bar indicator */}
                {active && (
                  <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-4.5 bg-[#3B82F6] rounded-r-full shadow-[0_0_8px_#3B82F6]" />
                )}

                <div className="flex items-center gap-3 min-w-0">
                  <Icon className={`w-4 h-4 shrink-0 transition-colors ${
                    active ? 'text-[#3B82F6]' : 'text-slate-500'
                  }`} />
                  {!isCollapsed && <span className="truncate">{item.label}</span>}
                </div>
              </button>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <aside
      className={`h-full bg-[#121826] border-r border-white/5 flex flex-col shrink-0 select-none z-30 font-sans transition-all duration-300 shadow-[0_8px_32px_rgba(0,0,0,0.35)] ${
        isCollapsed ? 'w-[58px]' : 'w-[180px]'
      }`}
    >
      {/* Header Panel branding */}
      <div className="h-[52px] border-b border-white/5 flex items-center justify-between px-3.5 shrink-0">
        {!isCollapsed ? (
          <span className="text-[#3B82F6] font-bold text-[10px] tracking-[2px] uppercase font-mono">
            NIRIKSHAN
          </span>
        ) : (
          <span className="text-[#3B82F6] font-black text-[13px] uppercase font-mono mx-auto">
            N
          </span>
        )}
        {!isCollapsed && (
          <button
            onClick={() => setIsCollapsed(true)}
            className="p-1 rounded-lg border border-white/5 bg-[#202B3D]/50 hover:bg-[#182132] text-slate-400 hover:text-white transition-all"
            title="Collapse Panel"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Collapse Trigger in Collapsed state */}
      {isCollapsed && (
        <div className="py-2.5 border-b border-white/5 flex justify-center shrink-0">
          <button
            onClick={() => setIsCollapsed(false)}
            className="p-1 rounded-lg border border-white/5 bg-[#202B3D]/50 hover:bg-[#182132] text-slate-400 hover:text-white transition-all"
            title="Expand Panel"
          >
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Navigation Groups List */}
      <div className="flex-grow py-4 px-2.5 space-y-6 overflow-y-auto">
        {renderNavGroup('Workspace', workspaceItems)}
        {renderNavGroup('Surveys', surveysItems)}
        {renderNavGroup('Management', managementItems)}
        {renderNavGroup('Administration', adminItems)}
      </div>

      {/* EDGE Connection Status Box */}
      {!isCollapsed && (
        <div className="px-4 py-3 mx-3 mb-4 rounded-xl border border-white/5 bg-[#182132]/60 font-mono text-[9px] select-none shrink-0 space-y-2.5">
          <div className="flex justify-between items-center text-slate-500 font-bold uppercase text-[7.5px] font-sans">
            <span>EDGE STATUS</span>
            <span className="text-[#10B981] flex items-center gap-1 font-mono text-[8px] font-bold">
              <span className="w-1.5 h-1.5 rounded-full bg-[#10B981] animate-pulse" /> ONLINE
            </span>
          </div>
          
          <div className="flex justify-between items-center text-[#94A3B8] border-t border-white/5 pt-2">
            <span className="flex items-center gap-1"><Activity className="w-3 h-3 text-[#3B82F6]" /> Latency</span>
            <span className="text-white font-bold">24 ms</span>
          </div>

          <div className="flex justify-between items-center text-[#94A3B8] border-t border-white/5 pt-2">
            <span className="flex items-center gap-1"><Server className="w-3 h-3 text-[#3B82F6]" /> Core Engine</span>
            <span className="text-slate-400">v1.0.0</span>
          </div>
        </div>
      )}

      {/* Collapsed state status indicator */}
      {isCollapsed && (
        <div className="py-4 border-t border-white/5 flex justify-center shrink-0">
          <div className="w-1.5 h-1.5 rounded-full bg-[#10B981] animate-pulse" title="System online" />
        </div>
      )}
    </aside>
  );
};

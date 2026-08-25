import React, { useState, useRef, useEffect } from 'react';
import { Search, ChevronDown, Layers, MapPin, Calendar, CheckCircle2, Clock, AlertTriangle } from 'lucide-react';
import { GISOverlayLayers } from './GISOverlayLayers';
import type { Survey } from '../types';

interface SurveySelectorProps {
  surveys: Survey[];
  selectedSurvey: Survey | null;
  onSelectSurvey: (survey: Survey) => void;
  layersState: Record<string, boolean>;
  onToggleLayer?: (layerId: string, active: boolean) => void;
}

export const SurveySelector: React.FC<SurveySelectorProps> = ({
  surveys,
  selectedSurvey,
  onSelectSurvey,
  layersState,
  onToggleLayer
}) => {
  // Mutually exclusive dropdown state: 'survey' | 'layers' | null
  const [openDropdown, setOpenDropdown] = useState<'survey' | 'layers' | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setOpenDropdown(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filteredSurveys = surveys.filter((srv) => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return true;
    return (
      srv.id.toLowerCase().includes(q) ||
      (srv.roadName && srv.roadName.toLowerCase().includes(q)) ||
      (srv.date && srv.date.toLowerCase().includes(q)) ||
      (srv.vehicleId && srv.vehicleId.toLowerCase().includes(q)) ||
      (srv.operatorName && srv.operatorName.toLowerCase().includes(q)) ||
      (srv.status && srv.status.toLowerCase().includes(q))
    );
  });

  const getStatusBadge = (status: string) => {
    const st = (status || '').toLowerCase();
    if (st === 'completed') {
      return <span className="inline-flex items-center gap-1 text-[9px] font-semibold text-[#10B981] bg-[#10B981]/10 px-1.5 py-0.5 rounded border border-[#10B981]/20"><CheckCircle2 className="w-2.5 h-2.5" /> COMPLETED</span>;
    }
    if (st === 'processing' || st === 'running') {
      return <span className="inline-flex items-center gap-1 text-[9px] font-semibold text-[#3B82F6] bg-[#3B82F6]/10 px-1.5 py-0.5 rounded border border-[#3B82F6]/20"><Clock className="w-2.5 h-2.5 animate-spin" /> PROCESSING</span>;
    }
    return <span className="inline-flex items-center gap-1 text-[9px] font-semibold text-[#F59E0B] bg-[#F59E0B]/10 px-1.5 py-0.5 rounded border border-[#F59E0B]/20"><AlertTriangle className="w-2.5 h-2.5" /> PENDING</span>;
  };

  const toggleSurveyDropdown = () => {
    setOpenDropdown(prev => (prev === 'survey' ? null : 'survey'));
  };

  const toggleLayersDropdown = () => {
    setOpenDropdown(prev => (prev === 'layers' ? null : 'layers'));
  };

  return (
    <div className="flex items-center gap-2.5 font-sans select-none" ref={containerRef}>
      
      {/* 1. SELECT SURVEY DROPDOWN CONTAINER */}
      <div className="relative">
        <div className="text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-1 font-mono flex items-center gap-1">
          <MapPin className="w-3 h-3 text-[#3B82F6]" /> SELECT SURVEY
        </div>

        {/* Trigger Button */}
        <button
          onClick={toggleSurveyDropdown}
          className={`h-[36px] min-w-[230px] bg-[#121826]/95 hover:bg-[#182132] border rounded-lg px-3 flex items-center justify-between shadow-2xl backdrop-blur-md transition-all text-left ${
            openDropdown === 'survey' ? 'border-[#3B82F6] shadow-[0_0_12px_rgba(59,130,246,0.3)]' : 'border-white/10 hover:border-white/20'
          }`}
        >
          <div className="flex items-center gap-2 min-w-0">
            <span className="font-mono text-[12px] font-bold text-white tracking-wide truncate">
              {selectedSurvey ? selectedSurvey.id : 'Select Survey...'}
            </span>
          </div>
          <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform duration-200 shrink-0 ml-2 ${openDropdown === 'survey' ? 'rotate-180 text-[#3B82F6]' : ''}`} />
        </button>

        {/* Survey List Menu Overlay */}
        {openDropdown === 'survey' && (
          <div className="absolute top-[calc(100%+6px)] left-0 w-[300px] bg-[#111827]/98 border border-white/10 rounded-xl shadow-2xl backdrop-blur-xl z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            {/* Search Box */}
            <div className="p-2.5 border-b border-white/10 bg-[#172033]/60">
              <div className="relative flex items-center">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 pointer-events-none" />
                <input
                  type="text"
                  placeholder="Search surveys (ID, Road, Date)..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  autoFocus
                  className="w-full bg-[#0C111A] text-white text-[11px] font-mono pl-8 pr-3 py-1.5 rounded-lg border border-white/10 focus:outline-none focus:border-[#3B82F6] placeholder-slate-500"
                />
              </div>
            </div>

            {/* Surveys List */}
            <div className="max-h-[260px] overflow-y-auto divide-y divide-white/5 py-1">
              {filteredSurveys.length === 0 ? (
                <div className="p-4 text-center text-slate-400 text-[11px]">
                  No matching surveys found
                </div>
              ) : (
                filteredSurveys.map((srv) => {
                  const isSelected = selectedSurvey?.id === srv.id;
                  return (
                    <button
                      key={srv.id}
                      onClick={() => {
                        onSelectSurvey(srv);
                        setOpenDropdown(null);
                      }}
                      className={`w-full text-left px-3.5 py-2.5 hover:bg-[#182132]/80 transition-colors flex flex-col gap-1 ${
                        isSelected ? 'bg-[#3B82F6]/15 border-l-2 border-[#3B82F6]' : ''
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-mono text-[11.5px] font-bold text-white tracking-wide">
                          {srv.id}
                        </span>
                        {getStatusBadge(srv.status)}
                      </div>

                      <div className="flex items-center justify-between text-[10px] text-slate-400 font-medium">
                        <span className="truncate max-w-[170px] text-slate-300">
                          {srv.roadName || 'Unnamed Road'}
                        </span>
                        <span className="flex items-center gap-1 font-mono text-slate-400 shrink-0">
                          <Calendar className="w-2.5 h-2.5" />
                          {srv.date || '05 Aug 2026'}
                        </span>
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </div>
        )}
      </div>

      {/* 2. LAYERS SELECTION DROPDOWN CONTAINER (BESIDE SELECT SURVEY) */}
      <div className="relative">
        <div className="text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-1 font-mono flex items-center gap-1">
          <Layers className="w-3 h-3 text-[#2563EB]" /> LAYERS
        </div>

        {/* Trigger Button */}
        <button
          onClick={toggleLayersDropdown}
          className={`h-[36px] px-3.5 rounded-lg border flex items-center gap-2 shadow-2xl backdrop-blur-md transition-all text-[11px] font-medium ${
            openDropdown === 'layers'
              ? 'bg-[#2563EB] text-white border-[#2563EB] shadow-[0_0_12px_rgba(37,99,235,0.4)]'
              : 'bg-[#121826]/95 border-white/10 hover:border-white/20 text-slate-300 hover:text-white'
          }`}
          title="GIS Layer Selection"
        >
          <Layers className="w-3.5 h-3.5" />
          <span className="font-mono text-[11px] font-bold">All Layers</span>
          <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${openDropdown === 'layers' ? 'rotate-180' : ''}`} />
        </button>

        {/* GIS Layers Overlay Panel */}
        {openDropdown === 'layers' && (
          <div className="absolute top-[calc(100%+6px)] left-0 w-[240px] bg-[#111827]/98 border border-white/10 backdrop-blur-xl rounded-xl shadow-2xl z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <GISOverlayLayers layersState={layersState} onToggleLayer={onToggleLayer} />
          </div>
        )}
      </div>

    </div>
  );
};

import React, { useState } from 'react';
import { 
  Search, 
  SlidersHorizontal, 
  X, 
  MapPin, 
  Activity, 
  Compass, 
  User, 
  Calendar 
} from 'lucide-react';
import type { Survey } from '../types';

interface SurveyExplorerProps {
  surveys: Survey[];
  selectedSurvey: Survey | null;
  onSelectSurvey: (survey: Survey) => void;
}

export const SurveyExplorer: React.FC<SurveyExplorerProps> = ({
  surveys,
  selectedSurvey,
  onSelectSurvey
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [districtFilter, setDistrictFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [operatorFilter, setOperatorFilter] = useState('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [activeListTab, setActiveListTab] = useState('all');

  // Filter Logic
  const filteredSurveys = surveys.filter(srv => {
    // Search
    const query = searchQuery.toLowerCase();
    const matchSearch = srv.roadName.toLowerCase().includes(query) || srv.id.toLowerCase().includes(query);
    
    // Status Tab
    const matchTab = activeListTab === 'all' || srv.status === activeListTab;
    
    // District (mock filter)
    const matchDistrict = districtFilter === 'all' || 
      (districtFilter === 'guntur' && srv.roadName.includes('Guntur')) ||
      (districtFilter === 'vijayawada' && srv.roadName.includes('Vijayawada'));

    // Status Dropdown
    const matchStatus = statusFilter === 'all' || srv.status === statusFilter;

    // Operator Dropdown
    const matchOperator = operatorFilter === 'all' || srv.operatorName === operatorFilter;

    return matchSearch && matchTab && matchDistrict && matchStatus && matchOperator;
  });

  return (
    <aside className="w-full h-full bg-transparent flex flex-col shrink-0 overflow-hidden font-sans select-none">
      
      {/* Header operations and Search Bar */}
      <div className="p-4 border-b border-white/5 bg-slate-900/10 shrink-0 space-y-3">
        <span className="text-[#3B82F6] text-[10px] font-bold uppercase tracking-wider block font-mono">
          Survey Explorer
        </span>
        
        {/* Search Input */}
        <div className="flex items-center w-full h-[32px] bg-[#202B3D]/50 border border-white/5 rounded-xl px-3 gap-2 relative">
          <Search className="w-3.5 h-3.5 text-slate-500 shrink-0" />
          <input
            type="text"
            placeholder="Search campaigns..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="bg-transparent border-none outline-none text-[11px] text-slate-300 w-full placeholder-slate-500 focus:ring-0 py-0"
          />
          {searchQuery && (
            <button onClick={() => setSearchQuery('')} className="text-slate-500 hover:text-white transition-colors">
              <X className="w-3 h-3" />
            </button>
          )}
          <span className="text-slate-700 text-[10px]">|</span>
          <button className="text-slate-550 hover:text-white transition-colors">
            <SlidersHorizontal className="w-3 h-3" />
          </button>
        </div>

        {/* List status filter tabs */}
        <div className="flex border-b border-white/5 text-[9.5px] font-mono pt-1 text-slate-500 justify-between">
          {[
            { id: 'all', count: filteredSurveys.length, label: 'All' },
            { id: 'completed', count: filteredSurveys.filter(s => s.status === 'completed').length, label: 'Completed' },
            { id: 'running', count: filteredSurveys.filter(s => s.status === 'running').length, label: 'Active' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveListTab(tab.id)}
              className={`pb-1.5 px-1 relative transition-all duration-150 ${
                activeListTab === tab.id 
                  ? 'text-white border-b-2 border-[#3B82F6] font-bold' 
                  : 'text-slate-500 hover:text-slate-300'
              }`}
            >
              <span>{tab.label}</span>
              <span className="ml-1 px-1 bg-white/5 text-[8.5px] rounded text-slate-400 font-normal">
                {tab.count}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Campaigns list container */}
      <div className="flex-grow overflow-y-auto p-4 space-y-4">
        {filteredSurveys.length === 0 ? (
          <div className="text-center py-8 text-[11px] text-slate-500 font-mono">
            NO CAMPAIGNS FOUND MATCHING FILTER
          </div>
        ) : (
          filteredSurveys.map((srv) => {
            const active = selectedSurvey?.id.toLowerCase() === srv.id.toLowerCase();
            
            // Distress Count logic
            const distressCount = srv.detections?.length || 0;
            
            // Status Pills colors
            const statusColor = srv.status === 'running' 
              ? 'bg-[#EF4444]/15 text-[#EF4444] border-[#EF4444]/20 animate-pulse' 
              : srv.status === 'completed'
              ? 'bg-[#10B981]/15 text-[#10B981] border-[#10B981]/20'
              : 'bg-slate-500/10 text-slate-400 border-white/5';

            // Average Speed calculations
            const avgSpeedVal = srv.durationSeconds > 0 
              ? (srv.distanceCoveredKm / (srv.durationSeconds / 3600)).toFixed(1)
              : '52.8';

             return (
              <div
                key={srv.id}
                onClick={() => onSelectSurvey(srv)}
                className={`rounded-xl p-3 border cursor-pointer transition-all duration-200 flex flex-col gap-2 transform ${
                  active
                    ? 'bg-[#182132] border-[#3B82F6] shadow-[0_4px_20px_rgba(59,130,246,0.12)] scale-[1.01]'
                    : 'bg-[#121826] border-white/5 hover:border-white/10 hover:bg-[#182132]/40 hover:-translate-y-0.5 hover:shadow-md'
                }`}
              >
                {/* Top Row: Title & Status */}
                <div className="flex items-start justify-between gap-1">
                  <div>
                    <span className="text-white text-[12px] font-bold block truncate max-w-[140px] uppercase">
                      {srv.roadName}
                    </span>
                    <span className="text-[#3B82F6] text-[9.5px] font-bold font-mono tracking-wider block">
                      {srv.id}
                    </span>
                  </div>

                  <span className={`text-[8px] px-2 py-0.5 rounded-full border font-mono font-bold uppercase shrink-0 ${
                    srv.status === 'completed'
                      ? 'bg-[#10B981]/15 text-[#10B981] border-[#10B981]/20'
                      : srv.status === 'processing' || srv.status === 'running'
                      ? 'bg-[#3B82F6]/15 text-[#3B82F6] border-[#3B82F6]/20 animate-pulse'
                      : 'bg-[#EAB308]/15 text-[#EAB308] border-[#EAB308]/20'
                  }`}>
                    {srv.status === 'completed'
                      ? '● COMPLETED'
                      : srv.status === 'processing' || srv.status === 'running'
                      ? '● PROCESSING'
                      : '● PENDING PROCESSING'}
                  </span>
                </div>

                {/* Metadata attributes grid */}
                <div className="grid grid-cols-2 gap-x-2 gap-y-1.5 border-t border-white/5 pt-2 text-[9px] font-mono text-slate-400">
                  <div>
                    <span className="text-slate-500 text-[7px] block uppercase font-sans font-bold">Date</span>
                    <span className="text-slate-200 font-semibold">{srv.date}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 text-[7px] block uppercase font-sans font-bold">Distance</span>
                    <span className="text-slate-200 font-semibold">
                      {srv.distanceCoveredKm > 0 ? `${srv.distanceCoveredKm.toFixed(1)} km` : '4.5 km'}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-500 text-[7px] block uppercase font-sans font-bold">Avg Speed</span>
                    <span className="text-slate-200 font-semibold">
                      {srv.averageSpeed && srv.averageSpeed > 0
                        ? `${srv.averageSpeed.toFixed(1)} km/h`
                        : srv.durationSeconds > 120 && srv.distanceCoveredKm > 0 && (srv.distanceCoveredKm / (srv.durationSeconds / 3600)) <= 120
                        ? `${(srv.distanceCoveredKm / (srv.durationSeconds / 3600)).toFixed(1)} km/h`
                        : '52.8 km/h'}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-500 text-[7px] block uppercase font-sans font-bold">Detections</span>
                    <span className={srv.status === 'completed' ? 'text-[#10B981] font-bold' : 'text-slate-500 font-normal'}>
                      {srv.status === 'completed' ? `${srv.totalDetections}` : 'Pending'}
                    </span>
                  </div>
                </div>

                {/* Card Action Button */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onSelectSurvey(srv);
                  }}
                  className={`w-full py-1.5 rounded-lg text-[9px] font-mono font-bold uppercase transition-colors border mt-1 ${
                    srv.status === 'completed'
                      ? 'bg-[#10B981]/10 text-[#10B981] border-[#10B981]/30 hover:bg-[#10B981]/20'
                      : 'bg-[#3B82F6]/10 text-[#3B82F6] border-[#3B82F6]/30 hover:bg-[#3B82F6]/20'
                  }`}
                >
                  {srv.status === 'completed' ? 'VIEW RESULTS' : 'OPEN SURVEY'}
                </button>
              </div>
            );
          })
        )}
      </div>

      {/* Explorer Footer text */}
      <div className="p-3 bg-slate-900/10 border-t border-white/5 text-[9px] font-mono text-slate-500 text-center shrink-0">
        NIRIKSHAN GIS ENGINE • CAMPAIGNS: {surveys.length}
      </div>

    </aside>
  );
};

import React, { useState } from 'react';
import type { Survey, GpsCoords } from '../types';
import {
  Cpu,
  Activity,
  HardDrive,
  Wifi,
  ChevronRight,
  ChevronLeft,
  Zap,
  Search
} from 'lucide-react';

interface RightInspectorPanelProps {
  activeSurvey: Survey | null;
  currentLocation: GpsCoords | null;
  surveysList: Survey[];
  onSelectSurvey: (survey: Survey) => void;
}

const Row: React.FC<{ label: string; value: React.ReactNode }> = ({ label, value }) => (
  <div className="flex items-center justify-between py-1 border-b border-[#111927] last:border-b-0">
    <span className="text-[10px] text-[#3d5070] font-medium">{label}</span>
    <span className="text-[10px] font-mono">{value}</span>
  </div>
);

const SectionTitle: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div className="text-[9px] text-[#2d3f56] font-bold uppercase tracking-[1.5px] pt-2 pb-0.5 px-0">{children}</div>
);

export const RightInspectorPanel: React.FC<RightInspectorPanelProps> = ({
  activeSurvey,
  currentLocation,
  surveysList,
  onSelectSurvey
}) => {
  const [isOpen, setIsOpen] = useState(true);
  const [search, setSearch] = useState('');

  const status = (val: string) => {
    const v = val.toLowerCase();
    if (v.includes('online') || v.includes('recording') || v.includes('connected') || v.includes('running') || v.includes('active') || v.includes('completed'))
      return <span className="text-emerald-400">{val}</span>;
    if (v.includes('offline') || v.includes('critical') || v.includes('lost'))
      return <span className="text-red-400">{val}</span>;
    return <span className="text-[#4a5568]">{val}</span>;
  };

  const filtered = surveysList.filter(s =>
    s.roadName.toLowerCase().includes(search.toLowerCase()) ||
    s.id.toLowerCase().includes(search.toLowerCase())
  );

  if (!isOpen) {
    return (
      <div className="absolute right-0 top-1/2 -translate-y-1/2 z-50">
        <button
          onClick={() => setIsOpen(true)}
          className="p-2 rounded-l bg-[#080d18] border-l border-y border-[#1a2332] text-[#3d5070] hover:text-[#94a3b8] transition-colors"
        >
          <ChevronLeft className="w-3.5 h-3.5" />
        </button>
      </div>
    );
  }

  return (
    <div className="w-[260px] h-full flex flex-col bg-[#080d18] border-l border-[#1a2332] relative shrink-0 z-40">

      {/* Header */}
      <div className="h-[40px] flex items-center justify-between px-4 border-b border-[#1a2332] shrink-0 bg-[#080d18]">
        <span className="text-[9px] text-[#2d3f56] font-bold uppercase tracking-[1.5px]">Inspector Deck</span>
        <button
          onClick={() => setIsOpen(false)}
          className="p-1 text-[#2d3f56] hover:text-[#64748b] transition-colors"
        >
          <ChevronRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Survey Explorer list section */}
      <div className="h-[180px] flex flex-col border-b border-[#1a2332] overflow-hidden shrink-0 bg-[#0d1626]/10">
        <div className="p-2 flex items-center gap-2 bg-[#080d18]/50">
          <div className="flex-1 flex items-center h-6 bg-[#0d1626] border border-[#1a2332] rounded px-2 gap-1.5">
            <Search className="w-3 h-3 text-[#3d5070]" />
            <input
              type="text"
              placeholder="Search surveys..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="bg-transparent border-none outline-none text-[10px] text-slate-300 w-full placeholder-slate-600 focus:ring-0"
            />
          </div>
        </div>
        <div className="flex-1 overflow-y-auto px-2 pb-2 space-y-1 select-none">
          {filtered.map((srv) => {
            const active = activeSurvey?.id === srv.id;
            return (
              <div
                key={srv.id}
                onClick={() => onSelectSurvey(srv)}
                className={`p-2 rounded border cursor-pointer transition-colors text-left ${
                  active
                    ? 'bg-[#0d1626] border-[#3B82F6]'
                    : 'bg-transparent border-[rgba(255,255,255,0.02)] hover:bg-[#0d1626]/40'
                }`}
              >
                <div className="flex justify-between items-start gap-1">
                  <span className="text-[10px] font-bold text-white truncate max-w-[160px]">{srv.roadName}</span>
                  <span className={`text-[6.5px] px-1 py-0.2 rounded font-bold uppercase ${
                    srv.status === 'completed' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-amber-500/10 text-amber-400'
                  }`}>
                    {srv.status}
                  </span>
                </div>
                <div className="flex justify-between items-center mt-1 text-[8px] text-[#3d5070] font-mono">
                  <span>{srv.id}</span>
                  <span className="text-slate-400 font-bold">{srv.distanceCoveredKm} km</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Parameters */}
      <div className="flex-1 overflow-y-auto px-4 pb-4 text-[11px]">

        <SectionTitle>Survey Identity</SectionTitle>
        <Row label="Session ID" value={<span className="text-[#94a3b8]">{activeSurvey ? activeSurvey.id : 'SRV-IDLE'}</span>} />
        <Row label="Road" value={<span className="text-[#94a3b8] max-w-[130px] truncate block">{activeSurvey ? activeSurvey.roadName : '—'}</span>} />
        <Row label="Status" value={status(activeSurvey ? (activeSurvey.status === 'completed' ? 'Completed' : 'Recording') : 'Idle')} />
        <Row label="Operator" value={<span className="text-[#94a3b8]">{activeSurvey ? activeSurvey.operatorName : '—'}</span>} />

        <SectionTitle>GPS Stream</SectionTitle>
        <Row
          label="Latitude"
          value={<span className="text-[#94a3b8]">{currentLocation ? currentLocation.lat.toFixed(6) : '16.430000'}°</span>}
        />
        <Row
          label="Longitude"
          value={<span className="text-[#94a3b8]">{currentLocation ? currentLocation.lng.toFixed(6) : '80.560000'}°</span>}
        />
        <Row label="Heading" value={<span className="text-[#94a3b8]">{currentLocation ? '45.0° NE' : '—'}</span>} />
        <Row
          label="Speed"
          value={<span className="text-[#60a5fa]">{currentLocation ? '42.8 km/h' : '0.0 km/h'}</span>}
        />
        <Row label="GPS Lock" value={status(currentLocation ? 'Online' : 'Offline')} />

        <SectionTitle>Edge Diagnostics</SectionTitle>
        <Row
          label={<span className="flex items-center gap-1"><Cpu className="w-3 h-3" />CPU Temp</span> as unknown as string}
          value={<span className="text-[#94a3b8]">{activeSurvey ? '52.4°C' : '38.2°C'}</span>}
        />
        <Row
          label={<span className="flex items-center gap-1"><Activity className="w-3 h-3" />Device</span> as unknown as string}
          value={status(activeSurvey ? 'Active' : 'Idle')}
        />
        <Row
          label={<span className="flex items-center gap-1"><Zap className="w-3 h-3" />Power</span> as unknown as string}
          value={status('Connected')}
        />
        <Row
          label={<span className="flex items-center gap-1"><HardDrive className="w-3 h-3" />SSD</span> as unknown as string}
          value={<span className="text-[#94a3b8]">18.2% used</span>}
        />
        <Row
          label={<span className="flex items-center gap-1"><Wifi className="w-3 h-3" />Wi-Fi</span> as unknown as string}
          value={status('Online')}
        />

      </div>
    </div>
  );
};

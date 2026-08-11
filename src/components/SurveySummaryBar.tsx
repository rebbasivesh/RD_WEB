import React from 'react';
import {
  Compass,
  Hash,
  Activity,
  CheckCircle2,
  Cpu,
  Cloud,
  Milestone,
  Navigation
} from 'lucide-react';
import type { Survey } from '../types';

interface SurveySummaryBarProps {
  selectedSurvey: Survey | null;
  isLive: boolean;
  liveStats?: {
    distance: number;
    potholes: number;
    longitudinal: number;
    transverse: number;
    alligator: number;
    iri: number;
    score: number;
  };
}

export const SurveySummaryBar: React.FC<SurveySummaryBarProps> = ({
  selectedSurvey,
  isLive,
  liveStats
}) => {
  if (!selectedSurvey && !isLive) {
    return (
      <div className="h-[36px] w-full bg-[#06080E] border-b border-white/5 flex items-center px-6 text-slate-500 text-[10px] select-none font-mono tracking-wider shrink-0">
        NO ACTIVE INSPECTION CAMPAIGN INITIALIZED
      </div>
    );
  }

  const displayData = isLive && liveStats ? {
    roadName: selectedSurvey?.roadName || 'SH-35 Bypass Corridor',
    id: selectedSurvey?.id || 'LIVE-SIM',
    distance: `${liveStats.distance.toFixed(1)} km`,
    iri: `${liveStats.iri.toFixed(2)} m/km`,
    score: `${liveStats.score.toFixed(1)} / 5`,
    status: 'RECORDING',
    edgeDevice: 'EDGE-01',
    cloudSync: 'SYNCING',
  } : {
    roadName: selectedSurvey?.roadName || 'N/A',
    id: selectedSurvey?.id || 'N/A',
    distance: `${selectedSurvey?.distanceCoveredKm?.toFixed(1) || '0.0'} km`,
    iri: `${selectedSurvey?.avgIri?.toFixed(2) || '0.00'} m/km`,
    score: `${selectedSurvey?.roadScore ? selectedSurvey.roadScore.toFixed(1) : '4.2'} / 5`,
    status: selectedSurvey?.status?.toUpperCase() || 'COMPLETED',
    edgeDevice: 'EDGE-01',
    cloudSync: 'SYNCED',
  };

  const separator = <span className="text-white/10 text-[11px] self-stretch flex items-center select-none px-1">|</span>;

  return (
    <div className="h-[36px] w-full bg-[#06080E] border-b border-white/5 flex items-center px-6 gap-3 text-[9.5px] select-none font-mono tracking-tight shrink-0 overflow-x-auto whitespace-nowrap text-slate-350">
      
      {/* Route */}
      <div className="flex items-center gap-1.5 shrink-0">
        <Compass className="w-3.5 h-3.5 text-[#3B82F6]" />
        <span className="text-slate-500 font-bold uppercase text-[7px] font-sans">Route</span>
        <span className="text-white font-extrabold max-w-[130px] truncate leading-none">{displayData.roadName}</span>
      </div>

      {separator}

      {/* Survey ID */}
      <div className="flex items-center gap-1.5 shrink-0">
        <Hash className="w-3.5 h-3.5 text-[#3B82F6]" />
        <span className="text-slate-500 font-bold uppercase text-[7px] font-sans">Survey ID</span>
        <span className="text-slate-300 font-semibold leading-none">{displayData.id}</span>
      </div>

      {separator}

      {/* Distance */}
      <div className="flex items-center gap-1.5 shrink-0">
        <Milestone className="w-3.5 h-3.5 text-[#3B82F6]" />
        <span className="text-slate-500 font-bold uppercase text-[7px] font-sans">Distance</span>
        <span className="text-white font-bold leading-none">{displayData.distance}</span>
      </div>

      {separator}

      {/* Average IRI */}
      <div className="flex items-center gap-1.5 shrink-0">
        <Activity className="w-3.5 h-3.5 text-[#10B981]" />
        <span className="text-slate-500 font-bold uppercase text-[7px] font-sans">Avg IRI</span>
        <span className="text-[#10B981] font-bold leading-none">{displayData.iri}</span>
      </div>



    </div>
  );
};

import React, { useState } from 'react';
import {
  FileText,
  AlertTriangle,
  Image as ImageIcon,
  Database,
  Download,
  Play,
  Pause,
  Video as VideoIcon,
  Maximize2,
  ZoomIn
} from 'lucide-react';
import type { Survey, Detection } from '../types';

const getIriColorClass = (iri: number) => {
  if (iri < 1.5) return 'text-[#10B981]'; // Excellent
  if (iri < 2.5) return 'text-[#EAB308]'; // Good
  if (iri < 3.5) return 'text-[#F59E0B]'; // Fair
  return 'text-[#EF4444]'; // Poor
};

interface InspectionWorkspaceProps {
  selectedSurvey: Survey | null;
  playbackIndex: number;
  setPlaybackIndex: (index: number) => void;
  isPlaying: boolean;
  setIsPlaying: (playing: boolean) => void;
  onCenterMap: (lat: number, lng: number) => void;
  onSelectDetection: (det: Detection) => void;
  selectedDetection: Detection | null;
  bottomTab: string;
  setBottomTab: (tab: string) => void;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
  onProcessSurvey?: (surveyId: string) => void;
}

export const InspectionWorkspace: React.FC<InspectionWorkspaceProps> = ({
  selectedSurvey,
  playbackIndex,
  setPlaybackIndex,
  isPlaying,
  setIsPlaying,
  onCenterMap,
  onSelectDetection,
  selectedDetection,
  bottomTab,
  setBottomTab,
  isCollapsed = false,
  onToggleCollapse,
  onProcessSurvey
}) => {

  if (!selectedSurvey) {
    return (
      <div className="h-full w-full bg-gis-panel border-t border-gis-border flex items-center justify-center text-slate-500 font-mono text-[10.5px]">
        NO CAMPAIGN RECORD SPECIFIED · SELECT A ROUTE FROM THE EXPLORER
      </div>
    );
  }

  const detections = selectedSurvey.detections || [];
  const currentCoords = selectedSurvey.gpsPath[playbackIndex] || selectedSurvey.gpsPath[0];

  // Find distress near current playback index
  const currentPlaybackCoord = selectedSurvey.gpsPath[playbackIndex];
  const activeFrameDetection = detections.find(d => {
    if (!currentPlaybackCoord) return false;
    const latDiff = Math.abs(d.location.lat - currentPlaybackCoord.lat);
    const lngDiff = Math.abs(d.location.lng - currentPlaybackCoord.lng);
    return latDiff < 0.005 && lngDiff < 0.005;
  });

  const [previewModalItem, setPreviewModalItem] = useState<{ det: Detection; idx: number; imgUrl: string } | null>(null);

  const handleRowClick = (det: Detection) => {
    onSelectDetection(det);
    onCenterMap(det.location.lat, det.location.lng);
    
    // Find closest coordinate index in path
    const closestIdx = selectedSurvey.gpsPath.reduce((closest, coord, idx) => {
      const dist = Math.pow(coord.lat - det.location.lat, 2) + Math.pow(coord.lng - det.location.lng, 2);
      return dist < closest.dist ? { idx, dist } : closest;
    }, { idx: 0, dist: Infinity }).idx;
    setPlaybackIndex(closestIdx);
  };

  // Generate SVG points for IRI Trend
  const pathLength = selectedSurvey.gpsPath.length;
  const iriPoints = selectedSurvey.gpsPath.map((_, idx) => {
    // Semi-randomized but consistent engineering roughness curve matching 2.45 avg
    return 1.3 + Math.sin(idx * 0.45) * 0.65 + (idx > 12 ? 1.4 : 0) + (idx % 5 === 0 ? 0.3 : 0);
  });

  // Chart proportions
  const width = 460;
  const height = 160;
  const maxIri = 10.0; // Y axis maximum IRI in screenshot is 10
  
  // Custom spline path generator for smooth curve rendering
  const getCurvePath = () => {
    if (iriPoints.length === 0) return '';
    let d = `M 0,${height - (iriPoints[0] / maxIri) * height}`;
    for (let i = 0; i < iriPoints.length - 1; i++) {
      const x1 = (i / (pathLength - 1)) * width;
      const y1 = height - (iriPoints[i] / maxIri) * height;
      const x2 = ((i + 1) / (pathLength - 1)) * width;
      const y2 = height - (iriPoints[i + 1] / maxIri) * height;
      const cpX1 = x1 + (x2 - x1) / 2;
      const cpY1 = y1;
      const cpX2 = x1 + (x2 - x1) / 2;
      const cpY2 = y2;
      d += ` C ${cpX1},${cpY1} ${cpX2},${cpY2} ${x2},${y2}`;
    }
    return d;
  };

  const curvePathD = getCurvePath();
  const fillPathD = curvePathD ? `${curvePathD} L ${width},${height} L 0,${height} Z` : '';
  const indicatorX = (playbackIndex / (pathLength - 1)) * width;

  // Count distress types
  const countDistress = (type: string) => detections.filter(d => d.type === type).length;
  
  const displayData = {
    roadName: selectedSurvey.roadName,
    id: selectedSurvey.id,
    roadLength: `${selectedSurvey.distanceCoveredKm.toFixed(1)} km`,
    operatorName: selectedSurvey.operatorName,
    vehicleId: selectedSurvey.vehicleId,
    startTime: `${selectedSurvey.date} ${selectedSurvey.startTime}`,
    endTime: `${selectedSurvey.date} 09:37:14`,
    duration: '52m 14s',
    distanceCovered: `${selectedSurvey.distanceCoveredKm.toFixed(1)} km`,
    avgSpeed: '52.8 km/h',
    avgIri: `${selectedSurvey.avgIri.toFixed(2)} m/km`,
    roadScore: `${selectedSurvey.roadScore ? selectedSurvey.roadScore.toFixed(1) : '4.2'} / 5`,
    potholes: countDistress('Pothole'),
    longitudinal: countDistress('Longitudinal Crack'),
    transverse: countDistress('Transverse Crack'),
    alligator: countDistress('Alligator Crack'),
    status: selectedSurvey.status
  };

  // SVG Donut Chart calculations for Distress Summary (Column 3)
  const totalAnomalies = displayData.potholes + displayData.longitudinal + displayData.transverse + displayData.alligator;
  
  // Percentages
  const potPct = totalAnomalies ? (displayData.potholes / totalAnomalies) * 100 : 0;
  const longPct = totalAnomalies ? (displayData.longitudinal / totalAnomalies) * 100 : 0;
  const transPct = totalAnomalies ? (displayData.transverse / totalAnomalies) * 100 : 0;
  const alligPct = totalAnomalies ? (displayData.alligator / totalAnomalies) * 100 : 0;

  // Donut circumference for r=35 is 2*PI*35 = 219.91
  const c = 219.91;
  const potDash = (potPct / 100) * c;
  const longDash = (longPct / 100) * c;
  const transDash = (transPct / 100) * c;
  const alligDash = (alligPct / 100) * c;

  const potOffset = 0;
  const longOffset = -potDash;
  const transOffset = -(potDash + longDash);
  const alligOffset = -(potDash + longDash + transDash);

  // Placeholder images
  const mockImagesList = [
    { type: 'Pothole', ch: 'CH 12+450', img: 'https://images.unsplash.com/photo-1515162305285-0293e4767cc2?auto=format&fit=crop&q=80&w=150' },
    { type: 'Alligator Crack', ch: 'CH 12+480', img: 'https://images.unsplash.com/photo-1599740831418-47c33b0e3639?auto=format&fit=crop&q=80&w=150' },
    { type: 'Longitudinal Crack', ch: 'CH 12+530', img: 'https://images.unsplash.com/photo-1621293954908-907141447fc9?auto=format&fit=crop&q=80&w=150' },
    { type: 'Transverse Crack', ch: 'CH 12+570', img: 'https://images.unsplash.com/photo-1515162305285-0293e4767cc2?auto=format&fit=crop&q=80&w=150' }
  ];

  return (
    <div className="h-full w-full bg-[#111827]/90 backdrop-blur-md border-t border-white/5 flex flex-col shrink-0 overflow-hidden font-sans select-none z-20">
      
      {/* Tab Selectors Ribbon */}
      <div className="flex border-b border-gis-border bg-[#08111D]/30 text-[10px] font-bold uppercase tracking-wider text-slate-500 font-mono shrink-0 h-10 items-center px-6 justify-between">
        <div className="flex gap-6 h-full items-center">
          {[
            { id: 'Overview', label: 'Overview', icon: FileText },
            { id: 'Road Distresses', label: 'Road Distresses', icon: AlertTriangle },
            { id: 'Survey Details', label: 'Survey Details', icon: Database },
            { id: 'Images', label: 'Images', icon: ImageIcon },
            { id: 'Video', label: 'Video', icon: VideoIcon },
            { id: 'Reports', label: 'Reports', icon: FileText },
            { id: 'Telemetry', label: 'Telemetry', icon: Database }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setBottomTab(tab.id)}
              className={`pb-3.5 pt-3.5 px-1 relative transition-all duration-200 whitespace-nowrap flex items-center gap-1.5 border-b-2 font-bold tracking-wide ${
                bottomTab === tab.id 
                  ? 'text-[#2563EB] border-[#2563EB]' 
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              <tab.icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
            </button>
          ))}
        </div>

        <div className="flex items-center gap-4 text-[10px] text-slate-500 font-mono">
          <div>
            COORDS: <span className="text-white font-bold">{currentCoords.lat.toFixed(6)}°N, {currentCoords.lng.toFixed(6)}°E</span>
          </div>
          {onToggleCollapse && (
            <button
              onClick={onToggleCollapse}
              className="p-1 rounded hover:bg-white/5 border border-white/5 hover:text-white transition-colors"
              title={isCollapsed ? "Expand panel" : "Collapse panel"}
            >
              {isCollapsed ? (
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 15.75l7.5-7.5 7.5 7.5" />
                </svg>
              ) : (
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                </svg>
              )}
            </button>
          )}
        </div>
      </div>

      {/* Main Tab content split */}
      <div className="flex-grow flex overflow-hidden">
        
        {/* Tab Content Panel (flex-grow) */}
        <div className="flex-grow min-w-0 bg-transparent scroll-smooth overflow-y-auto p-3.5">
          {/* SURVEY DETAILS TAB (3-Column Layout from Screenshot) */}
          {bottomTab === 'Survey Details' && (
            <div className="flex h-full w-full gap-0 items-stretch select-none text-sans">
              
              {/* Left Column (32%) - Survey Information */}
              <div className="w-[32%] pr-6 border-r border-white/5 flex flex-col justify-between select-text">
                <div>
                  <span className="text-slate-400 text-[11px] font-bold uppercase tracking-wider block mb-2 font-sans">
                    Survey Information
                  </span>
                  
                  <div className="grid grid-cols-2 gap-x-4 gap-y-1 font-sans">
                    <div className="flex flex-col">
                      <span className="text-slate-500 text-[8px] uppercase font-bold tracking-wider font-mono mb-0.5">Road Name</span>
                      <span className="text-white text-[11px] font-semibold truncate max-w-[130px]" title={displayData.roadName}>
                        {displayData.roadName}
                      </span>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-slate-500 text-[8px] uppercase font-bold tracking-wider font-mono mb-0.5">Survey ID</span>
                      <span className="text-white text-[11px] font-semibold truncate">
                        {displayData.id}
                      </span>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-slate-500 text-[8px] uppercase font-bold tracking-wider font-mono mb-0.5">Operator</span>
                      <span className="text-slate-200 text-[11px] font-medium truncate" title={displayData.operatorName}>
                        {displayData.operatorName}
                      </span>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-slate-500 text-[8px] uppercase font-bold tracking-wider font-mono mb-0.5">Vehicle</span>
                      <span className="text-slate-200 text-[11px] font-medium truncate">
                        {displayData.vehicleId}
                      </span>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-slate-500 text-[8px] uppercase font-bold tracking-wider font-mono mb-0.5">Survey Start</span>
                      <span className="text-slate-300 text-[11px] font-medium truncate">
                        {displayData.startTime}
                      </span>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-slate-500 text-[8px] uppercase font-bold tracking-wider font-mono mb-0.5">Survey End</span>
                      <span className="text-slate-300 text-[11px] font-medium truncate">
                        {displayData.endTime}
                      </span>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-slate-500 text-[8px] uppercase font-bold tracking-wider font-mono mb-0.5">Duration</span>
                      <span className="text-slate-100 text-[11px] font-semibold">
                        {displayData.duration}
                      </span>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-slate-500 text-[8px] uppercase font-bold tracking-wider font-mono mb-0.5">Distance</span>
                      <span className="text-white text-[11px] font-bold">
                        {displayData.distanceCovered}
                      </span>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-slate-500 text-[8px] uppercase font-bold tracking-wider font-mono mb-0.5">Average Speed</span>
                      <span className="text-slate-200 text-[11px] font-medium">
                        {displayData.avgSpeed}
                      </span>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-slate-500 text-[8px] uppercase font-bold tracking-wider font-mono mb-0.5">Processing Status</span>
                      <span className={`text-[10px] font-bold uppercase font-mono ${
                        selectedSurvey.status === 'completed'
                          ? 'text-[#10B981]'
                          : selectedSurvey.status === 'processing' || selectedSurvey.status === 'running'
                          ? 'text-[#3B82F6]'
                          : 'text-[#EAB308]'
                      }`}>
                        {selectedSurvey.status === 'completed'
                          ? 'COMPLETED'
                          : selectedSurvey.status === 'processing' || selectedSurvey.status === 'running'
                          ? 'PROCESSING...'
                          : 'PENDING PROCESSING'}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col mt-2 pt-2 border-t border-white/5 gap-2">
                  {selectedSurvey.status !== 'completed' && (
                    <button
                      disabled={selectedSurvey.status === 'processing' || selectedSurvey.status === 'running'}
                      onClick={() => onProcessSurvey && onProcessSurvey(selectedSurvey.id)}
                      className={`w-full py-2 rounded-lg text-[10px] font-mono font-bold uppercase transition-all shadow-md flex items-center justify-center gap-2 ${
                        selectedSurvey.status === 'processing' || selectedSurvey.status === 'running'
                          ? 'bg-[#3B82F6]/20 text-[#3B82F6] border border-[#3B82F6]/30 cursor-not-allowed animate-pulse'
                          : 'bg-[#3B82F6] hover:bg-blue-600 text-white border border-blue-400'
                      }`}
                    >
                      {selectedSurvey.status === 'processing' || selectedSurvey.status === 'running'
                        ? 'PROCESSING SURVEY... PLEASE WAIT'
                        : 'PROCESS SURVEY'}
                    </button>
                  )}
                </div>
              </div>

              {/* Center Column (44%) - Large IRI Roughness Trend Chart */}
              <div className="w-[44%] px-6 border-r border-white/5 flex flex-col justify-between">
                <div className="flex justify-between items-center mb-1 select-none">
                  <span className="text-slate-400 text-[11px] font-bold uppercase tracking-wider block font-sans">
                    IRI Roughness Trend
                  </span>
                  <div className="flex gap-3 text-[10px] text-slate-400 items-center">
                    <div className="flex gap-2 text-[9px] font-semibold text-slate-500">
                      <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-[#EF4444]" /> Poor</span>
                      <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-[#F59E0B]" /> Fair</span>
                      <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-[#EAB308]" /> Good</span>
                      <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-[#10B981]" /> Excellent</span>
                    </div>
                    <span className="text-[10px]">Avg: <b className={`${getIriColorClass(selectedSurvey.avgIri)} text-[11px] font-bold`}>{displayData.avgIri}</b></span>
                  </div>
                </div>
                
                {/* SVG line chart plot */}
                <div className="flex-grow flex items-center justify-center relative max-h-[160px] mt-1">
                  <svg width="100%" height="100%" viewBox="-30 -10 515 200" className="overflow-visible select-none">
                    {/* Quality bands ranges backgrounds */}
                    {/* Excellent (< 1.5) */}
                    <rect x="0" y={160 - (1.5 / 10) * 160} width="460" height={(1.5 / 10) * 160} fill="rgba(16, 185, 129, 0.02)" />
                    {/* Good (1.5 - 2.5) */}
                    <rect x="0" y={160 - (2.5 / 10) * 160} width="460" height={((2.5 - 1.5) / 10) * 160} fill="rgba(234, 179, 8, 0.015)" />
                    {/* Fair (2.5 - 3.5) */}
                    <rect x="0" y={160 - (3.5 / 10) * 160} width="460" height={((3.5 - 2.5) / 10) * 160} fill="rgba(245, 158, 11, 0.015)" />
                    {/* Poor (> 3.5) */}
                    <rect x="0" y="0" width="460" height={160 - (3.5 / 10) * 160} fill="rgba(239, 68, 68, 0.02)" />

                    {/* Horizontal Gridlines */}
                    <line x1="0" y1="0" x2="460" y2="0" stroke="rgba(255,255,255,0.03)" strokeDasharray="3,3" />
                    <line x1="0" y1={160 * 0.25} x2="460" y2={160 * 0.25} stroke="rgba(255,255,255,0.03)" strokeDasharray="3,3" />
                    <line x1="0" y1={160 * 0.5} x2="460" y2={160 * 0.5} stroke="rgba(255,255,255,0.03)" strokeDasharray="3,3" />
                    <line x1="0" y1={160 * 0.75} x2="460" y2={160 * 0.75} stroke="rgba(255,255,255,0.03)" strokeDasharray="3,3" />
                    <line x1="0" y1={160} x2="460" y2={160} stroke="rgba(255,255,255,0.05)" />

                    {/* Horizontal threshold dashlines */}
                    <line x1="0" y1={160 - (3.5 / 10) * 160} x2="460" y2={160 - (3.5 / 10) * 160} stroke="rgba(239, 68, 68, 0.2)" strokeWidth="0.8" strokeDasharray="4,4" />
                    <line x1="0" y1={160 - (2.5 / 10) * 160} x2="460" y2={160 - (2.5 / 10) * 160} stroke="rgba(245, 158, 11, 0.2)" strokeWidth="0.8" strokeDasharray="4,4" />
                    <line x1="0" y1={160 - (1.5 / 10) * 160} x2="460" y2={160 - (1.5 / 10) * 160} stroke="rgba(16, 185, 129, 0.2)" strokeWidth="0.8" strokeDasharray="4,4" />

                    {/* Quality Band Labels on the Right side */}
                    <text x="465" y="52" fill="#EF4444" fontSize="8" fontWeight="bold" dominantBaseline="middle" opacity="0.75">Poor</text>
                    <text x="465" y="112" fill="#F59E0B" fontSize="8" fontWeight="bold" dominantBaseline="middle" opacity="0.75">Fair</text>
                    <text x="465" y="128" fill="#EAB308" fontSize="8" fontWeight="bold" dominantBaseline="middle" opacity="0.75">Good</text>
                    <text x="465" y="148" fill="#10B981" fontSize="8" fontWeight="bold" dominantBaseline="middle" opacity="0.75">Excellent</text>

                    {/* Gradient under curve */}
                    {fillPathD && (
                      <path
                        d={fillPathD}
                        fill="url(#iriRedesignGradient)"
                      />
                    )}

                    {/* Spline curve path line */}
                    {curvePathD && (
                      <path
                        d={curvePathD}
                        fill="none"
                        stroke="#3B82F6"
                        strokeWidth="2.5"
                      />
                    )}

                    {/* Vertical timeline tracker line */}
                    <line
                      x1={(playbackIndex / (pathLength - 1)) * 460}
                      y1="0"
                      x2={(playbackIndex / (pathLength - 1)) * 460}
                      y2={160}
                      stroke="#10B981"
                      strokeWidth="1.5"
                    />

                    {/* Active coordinate point dot indicator */}
                    {playbackIndex < pathLength && (
                      <g>
                        <circle
                          cx={(playbackIndex / (pathLength - 1)) * 460}
                          cy={160 - (iriPoints[playbackIndex] / 10) * 160}
                          r="5"
                          fill="#10B981"
                          stroke="#FFFFFF"
                          strokeWidth="1.5"
                        />
                        {/* Tooltip */}
                        <rect
                          x={(playbackIndex / (pathLength - 1)) * 460 > 460 - 60 
                            ? ((playbackIndex / (pathLength - 1)) * 460) - 38 
                            : ((playbackIndex / (pathLength - 1)) * 460) + 8}
                          y={Math.max(2, (160 - (iriPoints[playbackIndex] / 10) * 160) - 9)}
                          width="30"
                          height="16"
                          rx="4"
                          fill="#1F2937"
                          stroke="rgba(255,255,255,0.1)"
                          strokeWidth="1"
                        />
                        <text
                          x={(playbackIndex / (pathLength - 1)) * 460 > 460 - 60 
                            ? ((playbackIndex / (pathLength - 1)) * 460) - 20 
                            : ((playbackIndex / (pathLength - 1)) * 460) + 20}
                          y={Math.max(2, (160 - (iriPoints[playbackIndex] / 10) * 160) - 9) + 11}
                          fill="#FFFFFF"
                          fontSize="8.5"
                          fontWeight="bold"
                          textAnchor="middle"
                        >
                          {iriPoints[playbackIndex]?.toFixed(2)}
                        </text>
                      </g>
                    )}

                    {/* Y-Axis Label Numbers */}
                    <text x="-8" y={160 * 1.0 + 3} fill="#64748B" fontSize="9" textAnchor="end">0.0</text>
                    <text x="-8" y={160 * 0.75 + 3} fill="#64748B" fontSize="9" textAnchor="end">2.5</text>
                    <text x="-8" y={160 * 0.5 + 3} fill="#64748B" fontSize="9" textAnchor="end">5.0</text>
                    <text x="-8" y={160 * 0.25 + 3} fill="#64748B" fontSize="9" textAnchor="end">7.5</text>
                    <text x="-8" y={160 * 0.0 + 3} fill="#64748B" fontSize="9" textAnchor="end">10.0</text>

                    {/* X-Axis Label Numbers */}
                    <text x="0" y={160 + 14} fill="#94A3B8" fontSize="9" textAnchor="middle">0.0</text>
                    <text x={460 * 0.25} y={160 + 14} fill="#64748B" fontSize="9" textAnchor="middle">{(selectedSurvey.distanceCoveredKm * 0.25).toFixed(1)}</text>
                    <text x={460 * 0.5} y={160 + 14} fill="#64748B" fontSize="9" textAnchor="middle">{(selectedSurvey.distanceCoveredKm * 0.5).toFixed(1)}</text>
                    <text x={460 * 0.75} y={160 + 14} fill="#64748B" fontSize="9" textAnchor="middle">{(selectedSurvey.distanceCoveredKm * 0.75).toFixed(1)}</text>
                    <text x={460} y={160 + 14} fill="#94A3B8" fontSize="9" textAnchor="middle">{selectedSurvey.distanceCoveredKm.toFixed(1)} km</text>

                    {/* SVG Definitions */}
                    <defs>
                      <linearGradient id="iriRedesignGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#3B82F6" stopOpacity="0.25" />
                        <stop offset="100%" stopColor="#3B82F6" stopOpacity="0.0" />
                      </linearGradient>
                    </defs>
                  </svg>
                </div>
              </div>

              {/* Right Column (24%) - Distress Summary */}
              <div className="w-[24%] pl-6 flex flex-col justify-between select-none">
                <span className="text-slate-400 text-[11px] font-bold uppercase tracking-wider block mb-2 font-sans">
                  Distress Summary
                </span>
                
                <div className="flex-grow flex flex-col justify-center items-center">
                  <div className="relative w-[90px] h-[90px] shrink-0 flex items-center justify-center mb-1">
                    <svg width="80" height="80" viewBox="0 0 100 100" className="-rotate-90">
                      {/* Donut Background Circle */}
                      <circle cx="50" cy="50" r="35" fill="transparent" stroke="rgba(255,255,255,0.03)" strokeWidth="8" />
                      
                      {/* Potholes segment */}
                      {displayData.potholes > 0 && (
                        <circle
                          cx="50"
                          cy="50"
                          r="35"
                          fill="transparent"
                          stroke="#EF4444"
                          strokeWidth="8"
                          strokeDasharray={`${potDash} ${c - potDash}`}
                          strokeDashoffset={potOffset}
                          strokeLinecap="round"
                        />
                      )}
                      {/* Longitudinal Segment */}
                      {displayData.longitudinal > 0 && (
                        <circle
                          cx="50"
                          cy="50"
                          r="35"
                          fill="transparent"
                          stroke="#F59E0B"
                          strokeWidth="8"
                          strokeDasharray={`${longDash} ${c - longDash}`}
                          strokeDashoffset={longOffset}
                          strokeLinecap="round"
                        />
                      )}
                      {/* Transverse Segment */}
                      {displayData.transverse > 0 && (
                        <circle
                          cx="50"
                          cy="50"
                          r="35"
                          fill="transparent"
                          stroke="#3B82F6"
                          strokeWidth="8"
                          strokeDasharray={`${transDash} ${c - transDash}`}
                          strokeDashoffset={transOffset}
                          strokeLinecap="round"
                        />
                      )}
                      {/* Alligator Segment */}
                      {displayData.alligator > 0 && (
                        <circle
                          cx="50"
                          cy="50"
                          r="35"
                          fill="transparent"
                          stroke="#8B5CF6"
                          strokeWidth="8"
                          strokeDasharray={`${alligDash} ${c - alligDash}`}
                          strokeDashoffset={alligOffset}
                          strokeLinecap="round"
                        />
                      )}
                    </svg>

                    {/* Donut central counts */}
                    <div className="absolute flex flex-col items-center justify-center leading-none">
                      <span className="text-[9px] text-slate-500 font-semibold uppercase tracking-wide font-sans whitespace-nowrap">Total</span>
                      <span className="text-white font-extrabold text-[16px] mt-0.5 font-mono">{totalAnomalies}</span>
                    </div>
                  </div>

                  {/* Donut Legend metrics list */}
                  <div className="w-full space-y-1 text-[10.5px] font-medium font-sans">
                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-2 min-w-0">
                        <span className="w-2.5 h-2.5 rounded-full bg-[#EF4444] shrink-0" />
                        <span className="text-slate-440 truncate">Potholes</span>
                      </span>
                      <span className="flex items-baseline gap-1 shrink-0 text-white font-semibold font-mono text-[11px]">
                        <span>{displayData.potholes}</span>
                        <span className="text-slate-500 text-[9px] font-sans font-normal">({potPct.toFixed(0)}%)</span>
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-2 min-w-0">
                        <span className="w-2.5 h-2.5 rounded-full bg-[#F59E0B] shrink-0" />
                        <span className="text-slate-440 truncate">Longitudinal</span>
                      </span>
                      <span className="flex items-baseline gap-1 shrink-0 text-white font-semibold font-mono text-[11px]">
                        <span>{displayData.longitudinal}</span>
                        <span className="text-slate-500 text-[9px] font-sans font-normal">({longPct.toFixed(0)}%)</span>
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-2 min-w-0">
                        <span className="w-2.5 h-2.5 rounded-full bg-[#3B82F6] shrink-0" />
                        <span className="text-slate-440 truncate">Transverse</span>
                      </span>
                      <span className="flex items-baseline gap-1 shrink-0 text-white font-semibold font-mono text-[11px]">
                        <span>{displayData.transverse}</span>
                        <span className="text-slate-500 text-[9px] font-sans font-normal">({transPct.toFixed(0)}%)</span>
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-2 min-w-0">
                        <span className="w-2.5 h-2.5 rounded-full bg-[#8B5CF6] shrink-0" />
                        <span className="text-slate-440 truncate">Alligator</span>
                      </span>
                      <span className="flex items-baseline gap-1 shrink-0 text-white font-semibold font-mono text-[11px]">
                        <span>{displayData.alligator}</span>
                        <span className="text-slate-500 text-[9px] font-sans font-normal">({alligPct.toFixed(0)}%)</span>
                      </span>
                    </div>
                  </div>
                </div>
              </div>

            </div>
          )}

          {/* OVERVIEW TAB */}
          {bottomTab === 'Overview' && (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-10 gap-y-5.5 font-mono text-[13px] text-slate-400 py-1.5">
              <div>
                <span className="block text-slate-500 text-[10px] uppercase font-bold tracking-wider leading-none mb-1.5 font-sans">ROAD NAME</span>
                <span className="text-white font-bold block">{selectedSurvey.roadName}</span>
              </div>
              <div>
                <span className="block text-slate-500 text-[10px] uppercase font-bold tracking-wider leading-none mb-1.5 font-sans">SURVEY ID</span>
                <span className="text-white font-bold block">{selectedSurvey.id}</span>
              </div>
              <div>
                <span className="block text-slate-500 text-[10px] uppercase font-bold tracking-wider leading-none mb-1.5 font-sans">ROAD LENGTH</span>
                <span className="text-white font-bold block">{selectedSurvey.distanceCoveredKm.toFixed(1)} km</span>
              </div>
              <div>
                <span className="block text-slate-500 text-[10px] uppercase font-bold tracking-wider leading-none mb-1.5 font-sans">OPERATOR</span>
                <span className="text-slate-300 block">{selectedSurvey.operatorName}</span>
              </div>
              <div>
                <span className="block text-slate-500 text-[10px] uppercase font-bold tracking-wider leading-none mb-1.5 font-sans">VEHICLE</span>
                <span className="text-slate-300 block">{selectedSurvey.vehicleId}</span>
              </div>
              <div>
                <span className="block text-slate-500 text-[10px] uppercase font-bold tracking-wider leading-none mb-1.5 font-sans">SURVEY START</span>
                <span className="text-slate-300 block">{selectedSurvey.date} {selectedSurvey.startTime}</span>
              </div>
              <div>
                <span className="block text-slate-500 text-[10px] uppercase font-bold tracking-wider leading-none mb-1.5 font-sans">SURVEY END</span>
                <span className="text-slate-300 block">{selectedSurvey.endTime || '09:37:14'}</span>
              </div>
              <div>
                <span className="block text-slate-500 text-[10px] uppercase font-bold tracking-wider leading-none mb-1.5 font-sans">DURATION</span>
                <span className="text-slate-300 block">52m 14s</span>
              </div>
              <div>
                <span className="block text-slate-500 text-[10px] uppercase font-bold tracking-wider leading-none mb-1.5 font-sans">DISTANCE</span>
                <span className="text-white font-bold block">{selectedSurvey.distanceCoveredKm.toFixed(1)} km</span>
              </div>
              <div>
                <span className="block text-slate-500 text-[10px] uppercase font-bold tracking-wider leading-none mb-1.5 font-sans">AVERAGE SPEED</span>
                <span className="text-slate-300 block">52.0 km/h</span>
              </div>
              <div>
                <span className="block text-slate-500 text-[10px] uppercase font-bold tracking-wider leading-none mb-1.5 font-sans">AVERAGE IRI</span>
                <span className={`${getIriColorClass(selectedSurvey.avgIri)} font-bold block`}>{selectedSurvey.avgIri.toFixed(2)} m/km</span>
              </div>
              <div>
                <span className="block text-slate-500 text-[10px] uppercase font-bold tracking-wider leading-none mb-1.5 font-sans">ROAD SCORE</span>
                <span className="text-white block font-bold">{selectedSurvey.roadScore ? selectedSurvey.roadScore.toFixed(1) : '4.2'} / 5</span>
              </div>
              <div>
                <span className="block text-slate-500 text-[10px] uppercase font-bold tracking-wider leading-none mb-1.5 font-sans">PROCESSING STATUS</span>
                <span className="text-emerald-400 font-bold block">● {selectedSurvey.status.toUpperCase()}</span>
              </div>
            </div>
          )}

          {/* ROAD DISTRESSES TAB */}
          {bottomTab === 'Road Distresses' && (
            <div className="h-full overflow-y-auto select-text font-mono text-[10.5px]">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-gis-border text-slate-500 pb-2">
                    <th className="py-2.5 font-bold uppercase tracking-wider text-[8px] font-sans">DISTRESS</th>
                    <th className="py-2.5 font-bold uppercase tracking-wider text-[8px] font-sans">SEVERITY</th>
                    <th className="py-2.5 font-bold uppercase tracking-wider text-[8px] font-sans">CHAINAGE</th>
                    <th className="py-2.5 font-bold uppercase tracking-wider text-[8px] font-sans">LATITUDE</th>
                    <th className="py-2.5 font-bold uppercase tracking-wider text-[8px] font-sans">LONGITUDE</th>
                    <th className="py-2.5 font-bold uppercase tracking-wider text-[8px] font-sans">CONFIDENCE</th>
                    <th className="py-2.5 font-bold uppercase tracking-wider text-[8px] font-sans">FRAME NUMBER</th>
                    <th className="py-2.5 font-bold uppercase tracking-wider text-[8px] font-sans">TIMESTAMP</th>
                    <th className="py-2.5 font-bold uppercase tracking-wider text-[8px] font-sans">STATUS</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {detections.map((det, idx) => {
                    const isSelected = selectedDetection?.id === det.id;
                    const typeColor = 
                      det.type === 'Pothole' 
                        ? 'text-danger font-bold' 
                        : det.type === 'Alligator Crack'
                        ? 'text-purple-400 font-bold'
                        : 'text-warning font-bold';

                    return (
                      <tr
                        key={det.id}
                        onClick={() => handleRowClick(det)}
                        className={`hover:bg-[#172033]/30 cursor-pointer transition-colors duration-150 ${
                          isSelected ? 'bg-primary/10 text-white font-bold' : 'text-slate-355'
                        }`}
                      >
                        <td className="py-3 flex items-center gap-2">
                          <span className={`w-1.5 h-1.5 rounded-full ${
                            det.type === 'Pothole' ? 'bg-danger' : det.type === 'Alligator Crack' ? 'bg-purple-500' : 'bg-warning'
                          }`} />
                          <span className={typeColor}>{det.type}</span>
                        </td>
                        <td className="py-3 uppercase text-[8.5px]">
                          <span className={`px-1.5 py-0.5 rounded border font-sans font-bold ${
                            det.roadScore >= 4 
                              ? 'bg-danger/10 text-danger border-danger/25' 
                              : 'bg-warning/10 text-warning border-warning/25'
                          }`}>
                            {det.roadScore >= 4 ? 'CRITICAL' : 'FAIR'}
                          </span>
                        </td>
                        <td className="py-3">CH 12+450</td>
                        <td className="py-3">{det.location.lat.toFixed(6)}°N</td>
                        <td className="py-3">{det.location.lng.toFixed(6)}°E</td>
                        <td className="py-3 font-extrabold text-slate-200">{(det.confidence * 100).toFixed(0)}%</td>
                        <td className="py-3 text-[#2563EB]">#FR-{(1250 + idx).toString()}</td>
                        <td className="py-3 text-slate-500">{det.timestamp}</td>
                        <td className="py-3 text-success font-bold text-[8.5px] font-sans">VALIDATED</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* IMAGES GALLERY TAB */}
          {bottomTab === 'Images' && (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-[9px] text-[#2563EB] font-bold uppercase tracking-wider block font-mono">
                  Pavement Distress Frame Gallery ({detections.length} AI Frames Detected)
                </span>
                <span className="text-[8px] text-slate-500 font-mono">
                  Click any frame to inspect high-resolution AI annotations
                </span>
              </div>
              
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3.5">
                {detections.map((det, idx) => {
                  const mockImg = mockImagesList[idx % mockImagesList.length];
                  const displayImgUrl = det.imageUrl || mockImg.img;

                  return (
                    <div 
                      key={det.id}
                      onClick={() => setPreviewModalItem({ det, idx, imgUrl: displayImgUrl })}
                      className="bg-gis-panel border border-white/10 hover:border-[#3B82F6]/50 p-2 rounded-xl flex flex-col justify-between cursor-pointer transition-all duration-200 hover:scale-[1.02] hover:shadow-[0_0_15px_rgba(59,130,246,0.15)] group"
                    >
                      <div className="relative overflow-hidden rounded-lg mb-2 bg-slate-950 h-28 flex items-center justify-center border border-white/5">
                        <img 
                          src={displayImgUrl} 
                          onError={(e) => {
                            (e.currentTarget as HTMLImageElement).src = mockImg.img;
                          }}
                          className="h-full w-full object-contain transition-transform group-hover:scale-105 duration-200" 
                          alt="Distress frame preview" 
                        />
                        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center gap-2 transition-opacity duration-200 backdrop-blur-[1px]">
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              handleRowClick(det);
                            }}
                            className="p-2 bg-[#172033]/90 border border-white/10 rounded-lg text-white hover:text-[#3B82F6] hover:bg-slate-800 transition-colors shadow-lg"
                            title="Zoom Map to Distress"
                          >
                            <ZoomIn className="w-4 h-4" />
                          </button>
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              setPreviewModalItem({ det, idx, imgUrl: displayImgUrl });
                            }}
                            className="p-2 bg-[#172033]/90 border border-white/10 rounded-lg text-white hover:text-[#3B82F6] hover:bg-slate-800 transition-colors shadow-lg"
                            title="Inspect Fullscreen Frame"
                          >
                            <Maximize2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>

                      <div className="font-mono text-[9px] text-slate-400 space-y-0.5 px-1 pb-1">
                        <div className="flex justify-between font-bold text-white leading-tight">
                          <span className="truncate pr-1">{det.type}</span>
                          <span className="text-danger shrink-0">{(det.confidence * 100).toFixed(0)}%</span>
                        </div>
                        <div className="flex justify-between text-slate-500 text-[8.5px]">
                          <span>{mockImg.ch}</span>
                          <span>#FR-{(1250 + idx).toString()}</span>
                        </div>
                        <div className="text-[7.5px] truncate text-slate-500 mt-1 flex justify-between items-center font-mono">
                          <span>{det.location.lat.toFixed(5)}°N, {det.location.lng.toFixed(5)}°E</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Fullscreen Image Lightbox Inspection Modal */}
          {previewModalItem && (
            <div 
              className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4 sm:p-8 animate-fadeIn"
              onClick={() => setPreviewModalItem(null)}
            >
              <div 
                className="bg-[#0C111A] border border-white/15 rounded-2xl max-w-4xl w-full overflow-hidden shadow-[0_0_50px_rgba(0,0,0,0.8)] flex flex-col relative"
                onClick={(e) => e.stopPropagation()}
              >
                {/* Modal Header */}
                <div className="px-6 py-4 border-b border-white/10 flex justify-between items-center bg-[#121826]">
                  <div className="flex items-center gap-3 font-mono">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#EF4444] animate-pulse" />
                    <div>
                      <h3 className="text-white font-bold text-sm tracking-wide font-sans">
                        {previewModalItem.det.type} <span className="text-[#EF4444] ml-2">{(previewModalItem.det.confidence * 100).toFixed(0)}% Confidence</span>
                      </h3>
                      <span className="text-[10px] text-slate-400 font-mono">
                        Frame #FR-{(1250 + previewModalItem.idx).toString()} • Chainage CH 12+{(450 + previewModalItem.idx * 10).toString()} • {previewModalItem.det.timestamp}
                      </span>
                    </div>
                  </div>
                  <button 
                    onClick={() => setPreviewModalItem(null)}
                    className="p-1.5 rounded-lg border border-white/10 bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700 transition-colors"
                  >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                {/* High-Res Image Display Container */}
                <div className="relative bg-slate-950 p-4 flex items-center justify-center max-h-[65vh] overflow-hidden">
                  <img 
                    src={previewModalItem.imgUrl} 
                    onError={(e) => {
                      const mockImg = mockImagesList[previewModalItem.idx % mockImagesList.length];
                      (e.currentTarget as HTMLImageElement).src = mockImg.img;
                    }}
                    className="max-h-[60vh] w-auto object-contain rounded-xl border border-white/10 shadow-2xl" 
                    alt="Full Inspection Frame" 
                  />
                </div>

                {/* Modal Footer Telemetry Summary */}
                <div className="px-6 py-3.5 bg-[#121826] border-t border-white/10 flex flex-wrap items-center justify-between gap-4 font-mono text-[11px] text-slate-400">
                  <div className="flex gap-6">
                    <div>
                      <span className="block text-[8.5px] uppercase text-slate-500 font-sans font-bold">LATITUDE</span>
                      <span className="text-white font-bold">{previewModalItem.det.location.lat.toFixed(6)}°N</span>
                    </div>
                    <div>
                      <span className="block text-[8.5px] uppercase text-slate-500 font-sans font-bold">LONGITUDE</span>
                      <span className="text-white font-bold">{previewModalItem.det.location.lng.toFixed(6)}°E</span>
                    </div>
                    <div>
                      <span className="block text-[8.5px] uppercase text-slate-500 font-sans font-bold">AI STATUS</span>
                      <span className="text-emerald-400 font-bold">● VERIFIED ANOMALY</span>
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <button 
                      onClick={() => {
                        handleRowClick(previewModalItem.det);
                        setPreviewModalItem(null);
                      }}
                      className="px-4 py-2 rounded-xl bg-[#3B82F6] hover:bg-[#2563EB] text-white font-bold text-xs tracking-wider transition-colors font-sans flex items-center gap-2"
                    >
                      <ZoomIn className="w-4 h-4" /> Locate on GIS Map
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* VIDEO PLAYER TAB */}
          {bottomTab === 'Video' && (
            <div className="flex gap-6 h-full items-stretch">
              
              <div className="w-[260px] h-[190px] bg-black border border-white/5 rounded-lg relative overflow-hidden flex flex-col shrink-0">
                <svg className="absolute inset-0 w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
                  <rect x="0" y="0" width="100" height="100" fill="#1C1F26" />
                  <rect x="0" y="0" width="100" height="35" fill="#0D0E11" />
                  <path d="M 0 100 L 45 35 M 100 100 L 55 35" stroke="#334155" strokeWidth="0.8" />
                  <path d="M 50 100 L 50 35" stroke="#EAB308" strokeWidth="0.8" strokeDasharray="3,3" />

                  {activeFrameDetection && (
                    <ellipse 
                      cx="50" 
                      cy="75" 
                      rx={activeFrameDetection.type === 'Pothole' ? "8" : "15"} 
                      ry={activeFrameDetection.type === 'Pothole' ? "4" : "2"} 
                      fill={activeFrameDetection.type === 'Pothole' ? "#0B0C0E" : "transparent"} 
                      stroke={activeFrameDetection.type === 'Pothole' ? "#333" : activeFrameDetection.type === 'Alligator Crack' ? "#8B5CF6" : "#F59E0B"} 
                      strokeWidth="1.5" 
                    />
                  )}
                </svg>

                {activeFrameDetection && (
                  <div className={`absolute inset-x-8 top-[105px] bottom-[25px] border border-dashed flex flex-col justify-between p-1 select-none pointer-events-none ${
                    activeFrameDetection.type === 'Pothole' 
                      ? 'border-danger bg-danger/10' 
                      : activeFrameDetection.type === 'Alligator Crack'
                      ? 'border-purple-500 bg-purple-500/10'
                      : 'border-warning bg-warning/10'
                  }`}>
                    <span className={`text-[8px] px-1 font-mono font-bold text-white rounded self-start ${
                      activeFrameDetection.type === 'Pothole' ? 'bg-danger' : activeFrameDetection.type === 'Alligator Crack' ? 'bg-purple-600' : 'bg-warning'
                    }`}>
                      {activeFrameDetection.type.toUpperCase()} ({(activeFrameDetection.confidence * 100).toFixed(0)}%)
                    </span>
                    <span className="text-[7.5px] text-slate-350 font-mono text-right">
                      CH: 12+450
                    </span>
                  </div>
                )}

                <div className="absolute top-2 left-2 flex flex-col font-mono text-[7px] text-slate-400 bg-gis-bg/60 px-1 py-0.5 rounded">
                  <span>VIDEO PLAYER: LOCKED</span>
                  <span>1080P FHD 30FPS</span>
                </div>
                
                <div className="absolute top-2 right-2 font-mono text-[7px] text-red-500 flex items-center gap-1 bg-gis-bg/60 px-1 py-0.5 rounded">
                  <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
                  <span>FRAME #{1250 + playbackIndex}</span>
                </div>
              </div>

              <div className="flex-1 flex flex-col justify-between font-mono text-[10px] text-slate-400">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <VideoIcon className="w-4 h-4 text-primary" />
                    <span className="text-white font-bold">ch12_tenali_bypass_feed.mp4</span>
                  </div>
                  <p className="text-[10px] text-slate-500 font-sans leading-relaxed">
                    Visual frames are synchronized with GPS location logs. Use the timeline controls below the GIS map or the play/pause button to trace road defects dynamically.
                  </p>
                </div>

                <div className="space-y-2 border-t border-white/5 pt-3">
                  <div className="flex justify-between text-[9px] text-slate-500 mb-1">
                    <span>FRAME CONTROL: SONY RIG</span>
                    <span>30 fps</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => setIsPlaying(!isPlaying)}
                      className={`px-3 py-1 rounded border border-white/5 font-bold flex items-center gap-1.5 text-[9.5px] tracking-wider transition-colors ${
                        isPlaying 
                          ? 'bg-warning/10 border-warning/30 text-warning hover:bg-warning/20' 
                          : 'bg-primary/10 border-primary/30 text-primary hover:bg-primary/20'
                      }`}
                    >
                      {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                      {isPlaying ? 'PAUSE PLAYBACK' : 'PLAY PLAYBACK'}
                    </button>
                    <span className="text-slate-300 font-bold">
                      Offset: 00m {playbackIndex * 3}s / 52m 14s
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* REPORTS TAB */}
          {bottomTab === 'Reports' && (
            <div className="space-y-4 font-mono text-[11px] text-slate-400">
              <div>
                <span className="text-[#2563EB] text-[8px] font-bold uppercase tracking-wider block font-sans mb-1.5">
                  Generate Assessment Register Downloads
                </span>
                <p className="font-sans text-[10.5px] text-slate-500 leading-relaxed mb-4 max-w-xl">
                  Compile and export the complete pavement evaluation register containing geolocated distress indexes, average roughness parameters, chainage reports, and RTK GPS traces.
                </p>
              </div>

              <div className="flex flex-wrap gap-2.5">
                <button 
                  onClick={() => alert('PDF report compilation started...')}
                  className="px-3.5 py-1.5 bg-gis-bg border border-white/5 hover:border-white/10 hover:bg-[#172033] text-slate-300 rounded font-bold uppercase flex items-center gap-2 text-[10px] transition-all"
                >
                  Generate PDF
                </button>
                <button 
                  onClick={() => alert('Excel spreadsheet generated.')}
                  className="px-3.5 py-1.5 bg-gis-bg border border-white/5 hover:border-white/10 hover:bg-[#172033] text-slate-300 rounded font-bold uppercase flex items-center gap-2 text-[10px] transition-all"
                >
                  Generate Excel
                </button>
                <button 
                  onClick={() => alert('CSV file compiled.')}
                  className="px-3.5 py-1.5 bg-gis-bg border border-white/5 hover:border-white/10 hover:bg-[#172033] text-slate-300 rounded font-bold uppercase flex items-center gap-2 text-[10px] transition-all"
                >
                  Generate CSV
                </button>
                <button 
                  onClick={() => alert('GeoJSON layer compiled.')}
                  className="px-3.5 py-1.5 bg-gis-bg border border-white/5 hover:border-white/10 hover:bg-[#172033] text-slate-300 rounded font-bold uppercase flex items-center gap-2 text-[10px] transition-all"
                >
                  Generate GeoJSON
                </button>
              </div>
            </div>
          )}

          {/* TELEMETRY TAB */}
          {bottomTab === 'Telemetry' && (
            <div className="font-mono text-[10.5px] text-slate-400 space-y-4">
              <span className="text-[#2563EB] text-[8.5px] font-bold uppercase tracking-wider block font-sans">
                LIVE HARDWARE ENGINE LOGGER
              </span>
              <div className="bg-black/40 border border-white/5 rounded-lg p-4 font-mono text-[9.5px] leading-relaxed max-h-[190px] overflow-y-auto space-y-1">
                <div>[11:42:01] EDGE CORE INITIALIZATION: Success. CPU Load: 12.4%, RAM: 2.8GB/8.0GB</div>
                <div>[11:42:15] GPS MODULE CONNECTED: NMEA protocol detected. Satellite locks: 14. RTK Fix acquired.</div>
                <div>[11:42:30] SONY IMX477 DRIVER LOADED: Resolving video feed at 1920x1080 @ 30 FPS.</div>
                <div>[11:42:45] AI MODULE READY: Loading tensor core inference models...</div>
                <div>[11:42:50] EDGE SIMULATOR LOG: Live assessment streams syncing to main workspace...</div>
                <div className="text-success font-bold animate-pulse">[11:43:28] TRANSMITTING TELEMETRY DATA STRIP PACKET #{(playbackIndex + 1250).toString()} {"->"} NODE: EDGE-01</div>
              </div>
            </div>
          )}

        </div>

      </div>

    </div>
  );
};

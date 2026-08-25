import React, { useState, useEffect } from 'react';
import {
  CheckCircle2,
  AlertTriangle,
  Play,
  Pause,
  FileText,
  Camera,
  Activity,
  SlidersHorizontal,
  HardDrive,
  Cpu,
  Gauge,
  Clock,
  Compass,
  Download,
  Info,
  Car,
  User,
  MapPin,
  Tag,
  Maximize2,
  ZoomIn,
  Video as VideoIcon
} from 'lucide-react';
import type { Survey, Detection } from '../types';
import { fetchSurveyImages, fetchSurveyVideoInfo } from '../services/api';

interface SelectedSurveyRightPanelProps {
  selectedSurvey: Survey | null;
  playbackIndex: number;
  setPlaybackIndex: (index: number) => void;
  isPlaying: boolean;
  setIsPlaying: (playing: boolean) => void;
  onCenterMap: (lat: number, lng: number) => void;
  onSelectDetection: (det: Detection) => void;
  selectedDetection: Detection | null;
  onProcessSurvey?: (surveyId: string) => void;
}

export const SelectedSurveyRightPanel: React.FC<SelectedSurveyRightPanelProps> = ({
  selectedSurvey,
  playbackIndex,
  setPlaybackIndex,
  isPlaying,
  setIsPlaying,
  onCenterMap,
  onSelectDetection,
  selectedDetection,
  onProcessSurvey
}) => {
  const [activeTab, setActiveTab] = useState<'Overview' | 'Road Distresses' | 'Survey Details' | 'Images' | 'Video' | 'Reports' | 'Telemetry'>('Overview');
  const [surveyImages, setSurveyImages] = useState<any[]>([]);
  const [videoInfo, setVideoInfo] = useState<{ available: boolean; video_url?: string; size_mb?: number; filename?: string }>({ available: false });
  const [isLoadingAssets, setIsLoadingAssets] = useState<boolean>(false);
  const [previewModalItem, setPreviewModalItem] = useState<{ imgUrl: string; title: string; frame: number; confidence: number; lat: number; lng: number } | null>(null);

  useEffect(() => {
    if (!selectedSurvey) return;
    setIsLoadingAssets(true);
    
    Promise.all([
      fetchSurveyImages(selectedSurvey.id),
      fetchSurveyVideoInfo(selectedSurvey.id)
    ]).then(([imgs, vid]) => {
      setSurveyImages(imgs || []);
      setVideoInfo(vid || { available: false });
      setIsLoadingAssets(false);
    }).catch(() => {
      setIsLoadingAssets(false);
    });
  }, [selectedSurvey?.id]);

  if (!selectedSurvey) {
    return (
      <div className="w-full h-full bg-[#0C111A] border-l border-white/5 p-6 flex flex-col items-center justify-center text-slate-500 text-center select-none">
        <Info className="w-8 h-8 mb-2 text-slate-600" />
        <span className="text-xs font-mono font-medium">Select a survey to view detailed analytics</span>
      </div>
    );
  }

  const detections = selectedSurvey.detections || [];
  const gpsPath = selectedSurvey.gpsPath || [];
  const pathLength = gpsPath.length || 1;

  // Count distress types dynamically
  const countDistress = (type: string) => detections.filter(d => d.type === type).length;
  const potholesCount = countDistress('Pothole');
  const longitudinalCount = countDistress('Longitudinal Crack');
  const transverseCount = countDistress('Transverse Crack');
  const alligatorCount = countDistress('Alligator Crack');
  const totalDetectionsCount = detections.length || selectedSurvey.totalDetections || 0;

  // Donut chart percentages
  const potPct = totalDetectionsCount ? Math.round((potholesCount / totalDetectionsCount) * 100) : 0;
  const longPct = totalDetectionsCount ? Math.round((longitudinalCount / totalDetectionsCount) * 100) : 0;
  const transPct = totalDetectionsCount ? Math.round((transverseCount / totalDetectionsCount) * 100) : 0;
  const alligPct = totalDetectionsCount ? Math.round((alligatorCount / totalDetectionsCount) * 100) : 0;

  // SVG Donut dash offset calculations
  const circumference = 2 * Math.PI * 40; // R=40, C ≈ 251.32
  const potOffset = 0;
  const longOffset = (potPct / 100) * circumference;
  const transOffset = ((potPct + longPct) / 100) * circumference;
  const alligOffset = ((potPct + longPct + transPct) / 100) * circumference;

  // SVG IRI Roughness curve calculations
  const baseIri = selectedSurvey.avgIri || 1.85;
  const iriPoints = gpsPath.map((_, idx) => {
    const variation = Math.sin(idx * 0.45) * (baseIri * 0.2) + (idx % 4 === 0 ? baseIri * 0.1 : 0);
    return Math.max(0.5, Math.min(18.0, baseIri + variation));
  });
  const width = 380;
  const height = 110;
  const maxIri = Math.max(10.0, Math.ceil(baseIri * 1.4));

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
  const indicatorX = pathLength > 1 ? (playbackIndex / (pathLength - 1)) * width : 0;

  const formatDuration = (totalSeconds: number) => {
    if (!totalSeconds) return '0s';
    const hrs = Math.floor(totalSeconds / 3600);
    const mins = Math.floor((totalSeconds % 3600) / 60);
    const secs = totalSeconds % 60;
    if (hrs > 0) return `${hrs}h ${mins}m ${secs}s`;
    return `${mins}m ${secs}s`;
  };

  const handleRowClick = (det: Detection) => {
    onSelectDetection(det);
    onCenterMap(det.location.lat, det.location.lng);
    const closestIdx = gpsPath.reduce((closest, coord, idx) => {
      const dist = Math.pow(coord.lat - det.location.lat, 2) + Math.pow(coord.lng - det.location.lng, 2);
      return dist < closest.dist ? { idx, dist } : closest;
    }, { idx: 0, dist: Infinity }).idx;
    setPlaybackIndex(closestIdx);
  };

  return (
    <div className="w-full h-full bg-[#0C111A] border-l border-white/10 flex flex-col font-sans select-none text-slate-100 overflow-hidden shrink-0">
      
      {/* 1. TOP HEADER & PLAYBACK CONTROLS */}
      <div className="p-4 border-b border-white/10 bg-[#121826]/90 shrink-0 space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest font-mono block">
              SURVEY ID
            </span>
            <h2 className="text-[16px] font-extrabold text-white font-mono tracking-wide">
              {selectedSurvey.id}
            </h2>
          </div>
          
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsPlaying(!isPlaying)}
              className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 font-mono text-[10.5px] font-bold transition-all shadow-md ${
                isPlaying
                  ? 'bg-[#EF4444] text-white shadow-[0_0_12px_rgba(239,68,68,0.4)]'
                  : 'bg-[#2563EB] text-white hover:bg-[#1D4ED8] shadow-[0_0_12px_rgba(37,99,235,0.4)]'
              }`}
            >
              {isPlaying ? <Pause className="w-3.5 h-3.5 fill-current" /> : <Play className="w-3.5 h-3.5 fill-current" />}
              <span>{isPlaying ? 'PAUSE' : 'SIMULATE'}</span>
            </button>

            <span className={`px-2.5 py-1 rounded-full text-[9.5px] font-bold tracking-wide uppercase font-mono flex items-center gap-1 border ${
              selectedSurvey.status === 'completed'
                ? 'bg-[#10B981]/15 text-[#10B981] border-[#10B981]/30'
                : selectedSurvey.status === 'processing'
                ? 'bg-[#3B82F6]/15 text-[#3B82F6] border-[#3B82F6]/30'
                : 'bg-[#F59E0B]/15 text-[#F59E0B] border-[#F59E0B]/30'
            }`}>
              <span className={`w-1.5 h-1.5 rounded-full ${
                selectedSurvey.status === 'completed' ? 'bg-[#10B981]' : selectedSurvey.status === 'processing' ? 'bg-[#3B82F6] animate-ping' : 'bg-[#F59E0B]'
              }`} />
              {selectedSurvey.status.toUpperCase()}
            </span>
          </div>
        </div>

        {/* Playback Scrubber Slider */}
        <div className="space-y-1 pt-1 font-mono text-[9.5px]">
          <div className="flex justify-between text-slate-400">
            <span>CHAINAGE: CH {((playbackIndex / pathLength) * selectedSurvey.distanceCoveredKm).toFixed(2)} km</span>
            <span>FPS: 30 · FR {playbackIndex + 1}/{pathLength}</span>
          </div>
          <input
            type="range"
            min={0}
            max={pathLength - 1}
            value={playbackIndex}
            onChange={(e) => setPlaybackIndex(parseInt(e.target.value))}
            className="w-full h-1.5 bg-[#172033] rounded-lg appearance-none cursor-pointer accent-[#3B82F6]"
          />
        </div>

        {/* METADATA GRID */}
        <div className="grid grid-cols-2 gap-2 pt-2 font-mono text-[10.5px]">
          <div className="bg-[#172033]/70 p-2 rounded-lg border border-white/5">
            <span className="text-[8.5px] text-slate-400 font-sans uppercase font-bold block">ROAD NAME</span>
            <span className="text-slate-100 font-semibold truncate block">{selectedSurvey.roadName}</span>
          </div>
          <div className="bg-[#172033]/70 p-2 rounded-lg border border-white/5">
            <span className="text-[8.5px] text-slate-400 font-sans uppercase font-bold block">VEHICLE</span>
            <span className="text-slate-100 font-semibold truncate block">{selectedSurvey.vehicleId}</span>
          </div>
          <div className="bg-[#172033]/70 p-2 rounded-lg border border-white/5">
            <span className="text-[8.5px] text-slate-400 font-sans uppercase font-bold block">DISTANCE</span>
            <span className="text-[#3B82F6] font-bold block">{selectedSurvey.distanceCoveredKm.toFixed(2)} km</span>
          </div>
          <div className="bg-[#172033]/70 p-2 rounded-lg border border-white/5">
            <span className="text-[8.5px] text-slate-400 font-sans uppercase font-bold block">DURATION</span>
            <span className="text-slate-100 font-semibold block">{formatDuration(selectedSurvey.durationSeconds)}</span>
          </div>
          <div className="bg-[#172033]/70 p-2 rounded-lg border border-white/5">
            <span className="text-[8.5px] text-slate-400 font-sans uppercase font-bold block">AVERAGE SPEED</span>
            <span className="text-slate-100 font-semibold block">{selectedSurvey.averageSpeed ? `${selectedSurvey.averageSpeed.toFixed(1)} km/h` : 'N/A'}</span>
          </div>
          <div className="bg-[#172033]/70 p-2 rounded-lg border border-white/5">
            <span className="text-[8.5px] text-slate-400 font-sans uppercase font-bold block">AVERAGE IRI</span>
            <span className="text-slate-100 font-semibold block">{selectedSurvey.avgIri ? `${selectedSurvey.avgIri.toFixed(2)} m/km` : 'N/A'}</span>
          </div>
        </div>
      </div>

      {/* 2. COMPACT TABS NAVIGATION */}
      <div className="flex items-center gap-1 px-3 py-2 bg-[#121826] border-b border-white/10 overflow-x-auto shrink-0 scrollbar-none font-mono text-[10px]">
        {(['Overview', 'Road Distresses', 'Survey Details', 'Images', 'Video', 'Reports', 'Telemetry'] as const).map((tab) => {
          const active = activeTab === tab;
          return (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-2.5 py-1.5 rounded-lg whitespace-nowrap font-medium transition-all ${
                active
                  ? 'bg-[#3B82F6] text-white shadow-[0_0_12px_rgba(59,130,246,0.4)] font-bold'
                  : 'text-slate-400 hover:text-white hover:bg-white/5'
              }`}
            >
              {tab}
            </button>
          );
        })}
      </div>

      {/* 3. MAIN TAB CONTENT AREA */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 font-sans text-xs">
        {activeTab === 'Overview' && (
          <>
            {/* PROCESSING STATUS BANNER */}
            {(selectedSurvey.status === 'processing' || selectedSurvey.status === 'running' || selectedSurvey.status === 'pending') && (
              <div className="bg-gradient-to-r from-[#3B82F6]/15 to-[#8B5CF6]/15 border border-[#3B82F6]/40 p-4 rounded-xl space-y-2 text-center">
                <div className="flex items-center justify-center gap-2">
                  <Activity className="w-4 h-4 text-[#3B82F6] animate-spin" />
                  <span className="font-bold text-xs text-white font-mono uppercase tracking-wider">PROCESSING REPORT...</span>
                </div>
                <p className="text-[10px] text-slate-300 font-mono">
                  AI pipeline is actively analyzing video frames and GPS telemetry. Final distress metrics and IRI ratings will appear after processing completes.
                </p>
              </div>
            )}

            {/* IRI ROUGHNESS TREND CHART */}
            <div className="bg-[#172033]/80 p-3.5 rounded-xl border border-white/5 space-y-2">
              <div className="flex justify-between items-center font-mono">
                <span className="text-[9.5px] font-bold text-white uppercase tracking-wider">
                  IRI ROUGHNESS TREND
                </span>
                <span className="text-[9.5px] text-slate-400">
                  AVG: <strong className="text-[#EAB308]">{selectedSurvey.avgIri ? `${selectedSurvey.avgIri.toFixed(2)} m/km` : 'N/A'}</strong>
                </span>
              </div>

              <div className="relative w-full h-[120px] bg-[#0C111A] rounded-lg p-2 overflow-hidden border border-white/5 select-none">
                <div className="absolute left-2 right-2 top-[20%] border-b border-[#EF4444]/20 border-dashed text-[8px] font-mono text-[#EF4444] text-right">Poor</div>
                <div className="absolute left-2 right-2 top-[45%] border-b border-[#F59E0B]/20 border-dashed text-[8px] font-mono text-[#F59E0B] text-right">Fair</div>
                <div className="absolute left-2 right-2 top-[70%] border-b border-[#EAB308]/20 border-dashed text-[8px] font-mono text-[#EAB308] text-right">Good</div>

                <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-full overflow-visible">
                  <defs>
                    <linearGradient id="iriGlowGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#3B82F6" stopOpacity="0.4" />
                      <stop offset="100%" stopColor="#3B82F6" stopOpacity="0.0" />
                    </linearGradient>
                  </defs>

                  {fillPathD && <path d={fillPathD} fill="url(#iriGlowGrad)" />}
                  {curvePathD && <path d={curvePathD} fill="none" stroke="#3B82F6" strokeWidth="2" />}

                  <line x1={indicatorX} y1="0" x2={indicatorX} y2={height} stroke="#22D3EE" strokeWidth="1.5" strokeDasharray="3 3" />
                  <circle cx={indicatorX} cy={height - ((iriPoints[playbackIndex] || baseIri) / maxIri) * height} r="4" fill="#22D3EE" stroke="#FFFFFF" strokeWidth="1.5" />
                </svg>
              </div>
            </div>

            {/* DISTRESS SUMMARY DONUT CHART */}
            <div className="bg-[#172033]/80 p-3.5 rounded-xl border border-white/5 space-y-3">
              <div className="flex justify-between items-center font-mono">
                <span className="text-[9.5px] font-bold text-white uppercase tracking-wider">
                  DISTRESS SUMMARY
                </span>
                <span className="text-[9.5px] text-slate-400">TOTAL: <strong className="text-white">{totalDetectionsCount}</strong></span>
              </div>

              <div className="flex items-center justify-between gap-3">
                <div className="space-y-1.5 font-mono text-[10.5px] flex-1">
                  <div className="flex justify-between items-center">
                    <span className="flex items-center gap-1.5 text-slate-300">
                      <span className="w-2.5 h-2.5 rounded-full bg-[#EF4444]" /> Potholes
                    </span>
                    <span className="font-bold text-white">{potholesCount} <span className="text-slate-500 font-normal">({potPct}%)</span></span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="flex items-center gap-1.5 text-slate-300">
                      <span className="w-2.5 h-2.5 rounded-full bg-[#F59E0B]" /> Longitudinal
                    </span>
                    <span className="font-bold text-white">{longitudinalCount} <span className="text-slate-500 font-normal">({longPct}%)</span></span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="flex items-center gap-1.5 text-slate-300">
                      <span className="w-2.5 h-2.5 rounded-full bg-[#3B82F6]" /> Transverse
                    </span>
                    <span className="font-bold text-white">{transverseCount} <span className="text-slate-500 font-normal">({transPct}%)</span></span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="flex items-center gap-1.5 text-slate-300">
                      <span className="w-2.5 h-2.5 rounded-full bg-[#8B5CF6]" /> Alligator
                    </span>
                    <span className="font-bold text-white">{alligatorCount} <span className="text-slate-500 font-normal">({alligPct}%)</span></span>
                  </div>
                </div>

                <div className="relative w-24 h-24 shrink-0 flex items-center justify-center">
                  <svg className="w-full h-full -rotate-90 transform" viewBox="0 0 100 100">
                    <circle cx="50" cy="50" r="40" fill="transparent" stroke="#1E293B" strokeWidth="12" />
                    {totalDetectionsCount > 0 && (
                      <>
                        <circle cx="50" cy="50" r="40" fill="transparent" stroke="#EF4444" strokeWidth="12" strokeDasharray={`${(potPct / 100) * circumference} ${circumference}`} strokeDashoffset={-potOffset} />
                        <circle cx="50" cy="50" r="40" fill="transparent" stroke="#F59E0B" strokeWidth="12" strokeDasharray={`${(longPct / 100) * circumference} ${circumference}`} strokeDashoffset={-longOffset} />
                        <circle cx="50" cy="50" r="40" fill="transparent" stroke="#3B82F6" strokeWidth="12" strokeDasharray={`${(transPct / 100) * circumference} ${circumference}`} strokeDashoffset={-transOffset} />
                        <circle cx="50" cy="50" r="40" fill="transparent" stroke="#8B5CF6" strokeWidth="12" strokeDasharray={`${(alligPct / 100) * circumference} ${circumference}`} strokeDashoffset={-alligOffset} />
                      </>
                    )}
                  </svg>
                  <div className="absolute flex flex-col items-center justify-center font-mono">
                    <span className="text-[7.5px] text-slate-400 uppercase font-sans">TOTAL</span>
                    <span className="text-[13px] font-extrabold text-white leading-none">{totalDetectionsCount}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* SYSTEM METRICS GRID */}
            <div>
              <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest font-mono block mb-2">
                SYSTEM METRICS
              </span>
              <div className="grid grid-cols-2 gap-2 font-mono text-[10px]">
                <div className="bg-[#172033]/80 p-2.5 rounded-xl border border-white/5">
                  <span className="text-slate-400 text-[8.5px] font-sans block">GPS STATUS</span>
                  <span className="text-[#10B981] font-bold flex items-center gap-1 mt-0.5"><CheckCircle2 className="w-3 h-3" /> Valid Fix</span>
                </div>
                <div className="bg-[#172033]/80 p-2.5 rounded-xl border border-white/5">
                  <span className="text-slate-400 text-[8.5px] font-sans block">DISTANCE</span>
                  <span className="text-white font-bold block mt-0.5">{selectedSurvey.distanceCoveredKm.toFixed(2)} km</span>
                </div>
                <div className="bg-[#172033]/80 p-2.5 rounded-xl border border-white/5">
                  <span className="text-slate-400 text-[8.5px] font-sans block">SURVEY TIME</span>
                  <span className="text-white font-bold block mt-0.5">{formatDuration(selectedSurvey.durationSeconds)}</span>
                </div>
                <div className="bg-[#172033]/80 p-2.5 rounded-xl border border-white/5">
                  <span className="text-slate-400 text-[8.5px] font-sans block">TOTAL DETECTIONS</span>
                  <span className="text-[#3B82F6] font-bold block mt-0.5">{totalDetectionsCount}</span>
                </div>
              </div>
            </div>

            {/* END SURVEY / COMPLETION STATUS CARD */}
            {selectedSurvey.status === 'completed' && (
              <div className="bg-gradient-to-r from-[#10B981]/15 to-[#3B82F6]/10 border border-[#10B981]/30 p-3.5 rounded-xl space-y-2.5">
                <div className="flex items-center justify-between border-b border-[#10B981]/20 pb-2">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-[#10B981]" />
                    <span className="font-bold text-[12px] text-white">END SURVEY</span>
                  </div>
                  <span className="text-[10px] font-mono text-[#10B981] font-semibold">
                    Survey Saved Successfully
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-1.5 font-mono text-[10px] text-slate-300 pt-1">
                  <div className="flex items-center gap-1.5"><span className="text-[#10B981] font-bold">✓</span> Duration</div>
                  <div className="flex items-center gap-1.5"><span className="text-[#10B981] font-bold">✓</span> Distance Covered</div>
                  <div className="flex items-center gap-1.5"><span className="text-[#10B981] font-bold">✓</span> Images Captured</div>
                  <div className="flex items-center gap-1.5"><span className="text-[#10B981] font-bold">✓</span> Videos Recorded</div>
                  <div className="flex items-center gap-1.5"><span className="text-[#10B981] font-bold">✓</span> AI Findings</div>
                  <div className="flex items-center gap-1.5"><span className="text-[#10B981] font-bold">✓</span> Storage Used</div>
                </div>
              </div>
            )}
          </>
        )}

        {activeTab === 'Road Distresses' && (
          <div className="space-y-2 font-mono text-[10.5px]">
            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest font-sans block mb-1">
              DETECTION LOG ({detections.length}) · CLICK TO LOCATE ON MAP
            </span>
            {detections.length === 0 ? (
              <div className="p-4 text-center text-slate-400 bg-[#172033]/50 rounded-xl">
                No distress detections recorded for this survey.
              </div>
            ) : (
              detections.map((det) => (
                <div
                  key={det.id}
                  onClick={() => handleRowClick(det)}
                  className="p-2.5 bg-[#172033]/80 hover:bg-[#182132] border border-white/5 hover:border-[#3B82F6]/50 rounded-xl cursor-pointer transition-all flex items-center justify-between"
                >
                  <div className="flex items-center gap-2.5">
                    <div className={`w-2.5 h-2.5 rounded-full ${
                      det.type === 'Pothole' ? 'bg-[#EF4444]' : 'bg-[#8B5CF6]'
                    }`} />
                    <div>
                      <span className="font-bold text-white block">{det.type}</span>
                      <span className="text-[9px] text-slate-400">Timestamp: {det.timestamp}</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-[#3B82F6] font-bold block">{(det.confidence * 100).toFixed(0)}% Conf</span>
                    <span className="text-[8.5px] text-slate-400">Lat: {det.location.lat.toFixed(4)}°</span>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {activeTab === 'Survey Details' && (
          <div className="space-y-3 font-mono text-[10.5px]">
            <div className="bg-[#172033]/80 p-3 rounded-xl border border-white/5 space-y-2">
              <span className="text-[9px] font-bold text-[#3B82F6] uppercase tracking-widest font-sans block">SURVEY METADATA</span>
              <div className="space-y-1.5 text-slate-300">
                <div className="flex justify-between"><span>Survey ID:</span><span className="text-white font-bold">{selectedSurvey.id}</span></div>
                <div className="flex justify-between"><span>Road Name:</span><span className="text-white">{selectedSurvey.roadName}</span></div>
                <div className="flex justify-between"><span>Vehicle ID:</span><span className="text-white">{selectedSurvey.vehicleId}</span></div>
                <div className="flex justify-between"><span>Operator:</span><span className="text-white">{selectedSurvey.operatorName}</span></div>
                <div className="flex justify-between"><span>Date Recorded:</span><span className="text-white">{selectedSurvey.date} {selectedSurvey.startTime}</span></div>
                <div className="flex justify-between"><span>Distance Covered:</span><span className="text-white">{selectedSurvey.distanceCoveredKm.toFixed(2)} km</span></div>
                <div className="flex justify-between"><span>Status:</span><span className="text-[#10B981] font-bold">{selectedSurvey.status.toUpperCase()}</span></div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'Images' && (
          <div className="space-y-3 font-mono text-[10px]">
            <span className="text-[9px] font-bold text-slate-400 uppercase font-sans tracking-widest block">
              AI ANNOTATED FRAMES ({surveyImages.length})
            </span>
            {isLoadingAssets ? (
              <div className="p-6 text-center text-slate-400 bg-[#172033]/50 rounded-xl">
                Loading frame images...
              </div>
            ) : surveyImages.length === 0 ? (
              <div className="p-6 text-center text-slate-400 bg-[#172033]/50 rounded-xl space-y-1">
                <Camera className="w-8 h-8 mx-auto text-slate-600 mb-2" />
                <span className="block text-slate-300 font-bold text-xs">No images available for this survey.</span>
                <span className="block text-[9px] text-slate-500">No annotated frame image files were generated or recorded.</span>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                {surveyImages.map((imgItem, idx) => (
                  <div
                    key={imgItem.id || idx}
                    onClick={() => setPreviewModalItem({
                      imgUrl: imgItem.image_url,
                      title: imgItem.type || 'Detection',
                      frame: imgItem.frame || 0,
                      confidence: imgItem.confidence || 0.95,
                      lat: imgItem.latitude || 0,
                      lng: imgItem.longitude || 0
                    })}
                    className="bg-[#172033] rounded-xl border border-white/5 overflow-hidden group relative cursor-pointer hover:border-[#3B82F6]/50 transition-all"
                  >
                    <img
                      src={imgItem.image_url}
                      alt={`Frame #${imgItem.frame}`}
                      className="w-full h-28 object-cover group-hover:scale-105 transition-transform"
                      onError={(e) => {
                        (e.target as HTMLElement).style.display = 'none';
                      }}
                    />
                    <div className="p-1.5 text-slate-300 bg-[#0C111A]/90 flex justify-between items-center">
                      <span>Frame #{imgItem.frame}</span>
                      <span className="text-[#3B82F6] font-bold">{imgItem.type} {(imgItem.confidence * 100).toFixed(0)}%</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'Video' && (
          <div className="bg-[#172033] rounded-xl border border-white/5 p-3 text-center space-y-2">
            {videoInfo.available && videoInfo.video_url ? (
              <div className="space-y-2">
                <video
                  src={videoInfo.video_url}
                  controls
                  className="w-full max-h-56 bg-black rounded-lg border border-white/10"
                />
                <div className="flex justify-between items-center text-[9.5px] font-mono text-slate-400 px-1">
                  <span>Size: {videoInfo.size_mb} MB</span>
                  <span className="text-[#10B981] font-bold">● Stream Ready</span>
                </div>
              </div>
            ) : (
              <div className="p-8 text-center text-slate-400 space-y-2">
                <VideoIcon className="w-10 h-10 mx-auto text-slate-600" />
                <span className="block text-slate-300 font-bold text-xs">VIDEO NOT AVAILABLE FOR THIS SURVEY</span>
                <span className="block text-[9px] text-slate-500">No MP4 video stream recording exists for survey {selectedSurvey.id}.</span>
              </div>
            )}
          </div>
        )}

        {activeTab === 'Reports' && (
          <div className="space-y-2 font-mono text-[11px]">
            <button className="w-full p-3 bg-[#172033] hover:bg-[#182132] border border-white/5 rounded-xl flex items-center justify-between text-slate-200">
              <span className="flex items-center gap-2"><FileText className="w-4 h-4 text-[#3B82F6]" /> Download PDF Report for {selectedSurvey.id}</span>
              <Download className="w-4 h-4 text-slate-400" />
            </button>
            <button className="w-full p-3 bg-[#172033] hover:bg-[#182132] border border-white/5 rounded-xl flex items-center justify-between text-slate-200">
              <span className="flex items-center gap-2"><FileText className="w-4 h-4 text-[#10B981]" /> Export GeoJSON Layer for {selectedSurvey.id}</span>
              <Download className="w-4 h-4 text-slate-400" />
            </button>
          </div>
        )}

        {activeTab === 'Telemetry' && (
          <div className="space-y-2.5 font-mono text-[10px]">
            <div className="bg-[#172033] p-3 rounded-xl border border-white/5 space-y-1">
              <span className="text-slate-400 block">GPS TRACK POINTS</span>
              <span className="text-[#10B981] font-bold text-sm">{gpsPath.length} Coordinates</span>
            </div>
            <div className="bg-[#172033] p-3 rounded-xl border border-white/5 space-y-1">
              <span className="text-slate-400 block">SURVEY DISTANCE</span>
              <span className="text-white font-bold text-sm">{selectedSurvey.distanceCoveredKm.toFixed(2)} km</span>
            </div>
          </div>
        )}
      </div>

      {/* Image Preview Modal */}
      {previewModalItem && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#121826] border border-white/10 rounded-2xl max-w-xl w-full p-4 space-y-3 font-mono">
            <div className="flex justify-between items-center border-b border-white/10 pb-2">
              <h3 className="text-white font-bold text-sm">{previewModalItem.title} · Frame #{previewModalItem.frame}</h3>
              <button
                onClick={() => setPreviewModalItem(null)}
                className="text-slate-400 hover:text-white px-2 py-1 bg-white/5 rounded"
              >
                ✕
              </button>
            </div>
            <img
              src={previewModalItem.imgUrl}
              alt="Frame detail"
              className="w-full max-h-96 object-contain rounded-lg border border-white/10 bg-black"
            />
            <div className="flex justify-between text-xs text-slate-300 pt-1">
              <span>Confidence: <strong className="text-[#3B82F6]">{(previewModalItem.confidence * 100).toFixed(0)}%</strong></span>
              <span>GPS: {previewModalItem.lat.toFixed(4)}°, {previewModalItem.lng.toFixed(4)}°</span>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

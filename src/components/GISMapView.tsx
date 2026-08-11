import React, { useEffect, useRef, useState } from 'react';

const getIriColorClass = (iri: number) => {
  if (iri < 1.5) return 'text-[#10B981]'; // Excellent
  if (iri < 2.5) return 'text-[#EAB308]'; // Good
  if (iri < 3.5) return 'text-[#F59E0B]'; // Fair
  return 'text-[#EF4444]'; // Poor
};
import L from 'leaflet';
import {
  Layers,
  MapPin,
  Compass,
  Ruler,
  Play,
  Pause,
  ArrowLeft,
  ArrowRight,
  Maximize2,
  Navigation,
  Camera,
  Download,
  Info,
  Layers2,
  Check,
  ChevronDown,
  X,
  FileText,
  Tv,
  Image as ImageIcon,
  Activity,
  Cpu,
  Database,
  Grid,
  Search
} from 'lucide-react';
import { GISOverlayLayers } from './GISOverlayLayers';
import { mockPathCoordinates, mockDetections } from '../mockData';

interface SurveyItem {
  id: string;
  roadName: string;
  projectName: string;
  status: 'Processing' | 'Completed' | 'Failed';
  length: number;
  vehicle: string;
  operator: string;
  time: string;
  avgIri: number;
  pci: number;
  pcr: number;
  mci: number;
  gradeBadge: 'Good' | 'Fair' | 'Poor' | 'Very Poor';
  lastSync: string;
  uploadStatus: string;
  edgeDeviceId: string;
  distanceCovered: number;
  avgSpeed: number;
  duration: string;
  roadScore: number;
  recordingStatus: 'Recording' | 'Idle' | 'Uploading';
  thumbnailUrl: string;
}

const mockSurveysList: SurveyItem[] = [
  {
    id: 'SRV-101',
    roadName: 'NH-16 Vijayawada Bypass',
    projectName: 'Pavement Quality Survey',
    status: 'Completed',
    length: 45.2,
    distanceCovered: 45.2,
    avgSpeed: 52,
    duration: '52m 14s',
    roadScore: 4.2,
    recordingStatus: 'Idle',
    vehicle: 'DL-1AB-1234',
    operator: 'Ravi Kumar',
    time: '03-Aug-2026 08:45 AM',
    avgIri: 2.45,
    pci: 68,
    pcr: 72,
    mci: 6.2,
    gradeBadge: 'Fair',
    lastSync: '10m ago',
    uploadStatus: '100% Uploaded',
    edgeDeviceId: 'EDGE-NODE-90A',
    thumbnailUrl: 'https://images.unsplash.com/photo-1524661135-423995f22d0b?auto=format&fit=crop&q=80&w=150'
  },
  {
    id: 'SRV-102',
    roadName: 'NH-65 Guntur - Tenali Corridor',
    projectName: 'Pavement Quality Survey',
    status: 'Completed',
    length: 32.8,
    distanceCovered: 32.8,
    avgSpeed: 48,
    duration: '41m 08s',
    roadScore: 4.6,
    recordingStatus: 'Idle',
    vehicle: 'AP-07CD-5678',
    operator: 'Suresh Babu',
    time: '03-Aug-2026 07:30 AM',
    avgIri: 1.82,
    pci: 88,
    pcr: 91,
    mci: 8.5,
    gradeBadge: 'Good',
    lastSync: '2h ago',
    uploadStatus: '100% Uploaded',
    edgeDeviceId: 'EDGE-NODE-12B',
    thumbnailUrl: 'https://images.unsplash.com/photo-1524661135-423995f22d0b?auto=format&fit=crop&q=80&w=150'
  },
  {
    id: 'SRV-103',
    roadName: 'SH-35 Mangalagiri - Ponnur Route',
    projectName: 'Pavement Quality Survey',
    status: 'Processing',
    length: 28.6,
    distanceCovered: 12.4,
    avgSpeed: 42,
    duration: '18m 42s',
    roadScore: 3.8,
    recordingStatus: 'Recording',
    vehicle: 'DL-1XY-9876',
    operator: 'Arun Das',
    time: '03-Aug-2026 05:15 AM',
    avgIri: 3.12,
    pci: 52,
    pcr: 60,
    mci: 5.1,
    gradeBadge: 'Poor',
    lastSync: '4m ago',
    uploadStatus: '45% Syncing',
    edgeDeviceId: 'EDGE-NODE-45D',
    thumbnailUrl: 'https://images.unsplash.com/photo-1524661135-423995f22d0b?auto=format&fit=crop&q=80&w=150'
  }
];

export const GISMapView: React.FC = () => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const vehicleMarkerRef = useRef<L.Marker | null>(null);

  // Layout States
  const [selectedSurvey, setSelectedSurvey] = useState<SurveyItem>(mockSurveysList[0]);
  const [isLayersOpen, setIsLayersOpen] = useState(true);
  const [activeBottomTab, setActiveBottomTab] = useState<string>('Overview');
  const [searchSurveyQuery, setSearchSurveyQuery] = useState('');
  
  // Navigation Coords
  const [cursorCoords, setCursorCoords] = useState<{ lat: number; lng: number }>({ lat: 16.3500, lng: 80.6000 });
  const [basemap, setBasemap] = useState<'dark' | 'satellite' | 'street'>('dark');
  const [playbackIndex, setPlaybackIndex] = useState(15);
  const [isPlaying, setIsPlaying] = useState(false);

  // Initialize Map
  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (mapRef.current) {
      mapRef.current.remove();
    }

    const baseUrls = {
      dark: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{y}/{x}.png',
      satellite: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
      street: 'https://{s}.tile.openstreetmap.org/{z}/{y}/{x}.png'
    };

    const map = L.map(mapContainerRef.current, {
      center: [16.3500, 80.6000],
      zoom: 12,
      zoomControl: false,
      attributionControl: false
    });
    mapRef.current = map;

    L.tileLayer(baseUrls[basemap]).addTo(map);

    // Track cursor coordinates
    map.on('mousemove', (e: L.LeafletMouseEvent) => {
      setCursorCoords({
        lat: Number(e.latlng.lat.toFixed(6)),
        lng: Number(e.latlng.lng.toFixed(6))
      });
    });

    // 1. Cyan Survey Route Polyline
    const polyCoords: [number, number][] = mockPathCoordinates.map(c => [c.lat, c.lng]);
    const routePoly = L.polyline(polyCoords, {
      color: '#22D3EE',
      weight: 4,
      opacity: 0.9
    }).addTo(map);

    map.fitBounds(routePoly.getBounds(), { padding: [20, 20] });

    // 2. Road Quality segments
    const quarter = Math.floor(polyCoords.length / 4);
    const colors = ['#10B981', '#EAB308', '#F59E0B', '#EF4444'];
    for (let i = 0; i < 4; i++) {
      const startIdx = i * quarter;
      const endIdx = Math.min((i + 1) * quarter + 1, polyCoords.length);
      const segmentCoords = polyCoords.slice(startIdx, endIdx);
      if (segmentCoords.length < 2) continue;

      L.polyline(segmentCoords, {
        color: colors[i],
        weight: 6,
        opacity: 0.85
      }).addTo(map);
    }

    // 3. AI distress markers
    mockDetections.forEach((det) => {
      const color = det.type === 'Pothole' ? '#EF4444' : det.type === 'Longitudinal Crack' ? '#F59E0B' : '#8B5CF6';
      const marker = L.circleMarker([det.location.lat, det.location.lng], {
        radius: 6,
        fillColor: color,
        color: '#FFFFFF',
        weight: 1,
        fillOpacity: 0.95
      }).addTo(map);

      marker.bindPopup(`
        <div style="font-family: monospace; font-size: 10px; background-color: #121212; color: #fff; padding: 6px; border: 1px solid rgba(255,255,255,0.06); border-radius: 4px;">
          <b>${det.type.toUpperCase()}</b><br/>
          CH: CH 12+450<br/>
          LAT: ${det.location.lat.toFixed(5)}<br/>
          LNG: ${det.location.lng.toFixed(5)}
        </div>
      `);
    });

    // 4. Blue Arrow vehicle marker
    const vehicleIcon = L.divIcon({
      className: 'custom-vehicle-arrow',
      html: `<div style="transform: rotate(45deg); width: 14px; height: 14px; border-left: 4px solid #3B82F6; border-top: 4px solid #3B82F6;"></div>`,
      iconSize: [14, 14],
      iconAnchor: [7, 7]
    });

    const initialCoords = polyCoords[playbackIndex] || polyCoords[0];
    const marker = L.marker(initialCoords, { icon: vehicleIcon }).addTo(map);
    vehicleMarkerRef.current = marker;

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, [selectedSurvey, basemap]);

  // Synchronized playback trail
  useEffect(() => {
    if (!isPlaying) return;
    const interval = setInterval(() => {
      setPlaybackIndex((prev) => {
        const next = prev < mockPathCoordinates.length - 1 ? prev + 1 : 0;
        if (mockPathCoordinates[next] && vehicleMarkerRef.current) {
          vehicleMarkerRef.current.setLatLng([mockPathCoordinates[next].lat, mockPathCoordinates[next].lng]);
        }
        return next;
      });
    }, 400);
    return () => clearInterval(interval);
  }, [isPlaying]);

  const selectSurveyCampaign = (srv: SurveyItem) => {
    setSelectedSurvey(srv);
    setPlaybackIndex(15);
    setIsPlaying(false);
  };

  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const idx = parseInt(e.target.value);
    setPlaybackIndex(idx);
    const targetCoords = mockPathCoordinates[idx];
    if (targetCoords && vehicleMarkerRef.current) {
      vehicleMarkerRef.current.setLatLng([targetCoords.lat, targetCoords.lng]);
    }
  };

  const highlightDistressCoords = (lat: number, lng: number) => {
    if (mapRef.current) {
      mapRef.current.setView([lat, lng], 16);
      L.popup()
        .setLatLng([lat, lng])
        .setContent(`
          <div style="font-family: monospace; font-size: 10px; background-color: #121212; color: #fff; padding: 4px;">
            <b>HIGHLIGHTED ANOMALY</b><br/>
            COORDS: ${lat.toFixed(5)}, ${lng.toFixed(5)}
          </div>
        `)
        .openOn(mapRef.current);
    }
  };

  const filteredSurveys = mockSurveysList.filter(s =>
    s.roadName.toLowerCase().includes(searchSurveyQuery.toLowerCase()) ||
    s.id.toLowerCase().includes(searchSurveyQuery.toLowerCase())
  );

  return (
    <div className="flex-1 flex flex-col overflow-hidden w-full h-full bg-[#121212] text-slate-100 font-sans select-none relative">
      
      {/* TOP VIEWSPACE AREA (62vh height) */}
      <div className="h-[62vh] w-full flex overflow-hidden relative shrink-0 border-b border-[rgba(255,255,255,0.06)]">
        
        {/* LEAFLET GIS MAP Center Canvas (80% width) */}
        <div className="flex-1 h-full relative bg-[#121212] border-r border-[rgba(255,255,255,0.06)]">
          <div ref={mapContainerRef} className="w-full h-full z-0" />

          {/* Floating layers overlay drawer */}
          <div className="absolute top-3 left-3 z-10 flex gap-2 items-start">
            <button
              onClick={() => setIsLayersOpen(!isLayersOpen)}
              className="w-8 h-8 bg-[#1A1A1A] border border-[rgba(255,255,255,0.06)] hover:bg-slate-800 text-white rounded flex items-center justify-center shadow-lg"
              title="Toggle GIS Layers"
            >
              <Layers className="w-4 h-4 text-[#3B82F6]" />
            </button>
            {isLayersOpen && (
              <div className="w-60 h-[310px] bg-[#1A1A1A] border border-[rgba(255,255,255,0.06)] rounded shadow-2xl overflow-hidden">
                <GISOverlayLayers />
              </div>
            )}
          </div>

          {/* Floating map controls */}
          <div className="absolute top-3 right-3 z-10 flex flex-col gap-1 select-none font-mono">
            <div className="flex flex-col bg-[#1A1A1A] border border-[rgba(255,255,255,0.06)] rounded overflow-hidden">
              <button onClick={() => mapRef.current?.zoomIn()} className="w-7 h-7 hover:bg-slate-800 text-white flex items-center justify-center font-bold border-b border-slate-805">+</button>
              <button onClick={() => mapRef.current?.zoomOut()} className="w-7 h-7 hover:bg-slate-800 text-white flex items-center justify-center font-bold">-</button>
            </div>
            
            <button onClick={() => mapRef.current?.setView([16.3500, 80.6000], 12)} className="w-7 h-7 bg-[#1A1A1A] border border-[rgba(255,255,255,0.06)] rounded flex items-center justify-center text-slate-400" title="Compass">
              <Compass className="w-3.5 h-3.5" />
            </button>
            
            <button onClick={() => mapRef.current?.setView([16.3500, 80.6000], 12)} className="w-7 h-7 bg-[#1A1A1A] border border-[rgba(255,255,255,0.06)] rounded flex items-center justify-center text-[#3B82F6]" title="Center Fleet">
              <Navigation className="w-3 h-3 rotate-45" />
            </button>

            <button onClick={() => alert('Map expanded.')} className="w-7 h-7 bg-[#1A1A1A] border border-[rgba(255,255,255,0.06)] rounded flex items-center justify-center text-slate-400" title="Fullscreen">
              <Maximize2 className="w-3 h-3" />
            </button>

            <button onClick={() => alert('Measure active.')} className="w-7 h-7 bg-[#1A1A1A] border border-[rgba(255,255,255,0.06)] rounded flex items-center justify-center text-amber-500" title="Measure">
              <Ruler className="w-3 h-3" />
            </button>

            <div className="bg-[#1A1A1A] border border-[rgba(255,255,255,0.06)] p-0.5 rounded flex flex-col gap-0.5 items-center">
              <select
                value={basemap}
                onChange={(e) => setBasemap(e.target.value as any)}
                className="bg-[#121212] border border-slate-800 text-[7px] text-slate-200 px-1 py-0.5 rounded focus:outline-none"
              >
                <option value="dark">Dark</option>
                <option value="satellite">Sat</option>
                <option value="street">Street</option>
              </select>
            </div>
          </div>

          {/* Mouse coords coordinates scale */}
          <div className="absolute bottom-14 left-3 z-10 bg-[#1A1A1A]/90 border border-[rgba(255,255,255,0.06)] px-2 py-0.5 rounded text-[8px] font-mono text-slate-450">
            <span>LAT: {cursorCoords.lat.toFixed(5)}° N</span>
            <span className="ml-3.5">LNG: {cursorCoords.lng.toFixed(5)}° E</span>
          </div>

          {/* Playback timeline slider */}
          <div className="absolute bottom-3 left-3 right-3 z-10 bg-[#1A1A1A] border border-[rgba(255,255,255,0.06)] p-2 rounded flex items-center gap-3 text-[10px] font-mono shadow-xl">
            <button
              onClick={() => setIsPlaying(!isPlaying)}
              className="p-1 bg-[#121212] hover:bg-slate-800 border border-slate-700 text-white rounded flex items-center justify-center shrink-0"
              title="Play/Pause"
            >
              {isPlaying ? <Pause className="w-3.5 h-3.5 text-amber-500" /> : <Play className="w-3.5 h-3.5 text-emerald-400" />}
            </button>

            <button
              onClick={() => {
                const next = playbackIndex > 0 ? playbackIndex - 1 : 0;
                setPlaybackIndex(next);
                if (mockPathCoordinates[next] && vehicleMarkerRef.current) {
                  vehicleMarkerRef.current.setLatLng([mockPathCoordinates[next].lat, mockPathCoordinates[next].lng]);
                }
              }}
              className="p-1 bg-[#121212] hover:bg-slate-800 border border-slate-700 text-slate-350 rounded"
            >
              <ArrowLeft className="w-3 h-3" />
            </button>

            <button
              onClick={() => {
                const next = playbackIndex < mockPathCoordinates.length - 1 ? playbackIndex + 1 : playbackIndex;
                setPlaybackIndex(next);
                if (mockPathCoordinates[next] && vehicleMarkerRef.current) {
                  vehicleMarkerRef.current.setLatLng([mockPathCoordinates[next].lat, mockPathCoordinates[next].lng]);
                }
              }}
              className="p-1 bg-[#121212] hover:bg-slate-800 border border-slate-700 text-slate-350 rounded"
            >
              <ArrowRight className="w-3 h-3" />
            </button>

            <div className="flex-1 flex items-center gap-2">
              <input
                type="range"
                min="0"
                max={mockPathCoordinates.length - 1}
                value={playbackIndex}
                onChange={handleSliderChange}
                className="w-full h-1 bg-slate-800 rounded appearance-none cursor-pointer accent-[#3B82F6]"
              />
              <span className="text-slate-400 font-bold shrink-0">Frame: #{1024 + playbackIndex}</span>
            </div>
            <span className="text-slate-500 font-bold font-sans">Timestamp: {selectedSurvey.time}</span>
          </div>

        </div>

        {/* RIGHT PANEL: Survey Explorer & Selected Survey Summary (approx 320px wide) */}
        <aside className="w-[320px] h-full bg-[#1A1A1A] flex flex-col shrink-0 overflow-hidden font-sans">
          {/* Search Box */}
          <div className="p-3 border-b border-[rgba(255,255,255,0.06)] bg-[#121212]/30 space-y-2 shrink-0">
            <span className="text-[#3B82F6] text-[8px] font-bold uppercase tracking-wider block font-mono">Survey Explorer</span>
            <div className="flex items-center w-full h-[28px] bg-[#121212] border border-[rgba(255,255,255,0.06)] rounded px-2.5 gap-2">
              <Search className="w-3 h-3 text-slate-500" />
              <input
                type="text"
                placeholder="Search survey..."
                value={searchSurveyQuery}
                onChange={(e) => setSearchSurveyQuery(e.target.value)}
                className="bg-transparent border-none outline-none text-[10.5px] text-slate-350 w-full placeholder-slate-655"
              />
            </div>
          </div>

          {/* List area */}
          <div className="flex-1 overflow-y-auto p-2.5 space-y-1.5 bg-[#121212]/15 border-b border-slate-800">
            {filteredSurveys.map((srv) => {
              const active = selectedSurvey.id === srv.id;
              return (
                <div
                  key={srv.id}
                  onClick={() => selectSurveyCampaign(srv)}
                  className={`p-2 rounded border transition-all duration-155 cursor-pointer flex justify-between items-center ${
                    active
                      ? 'bg-[#121212] border-[#3B82F6]'
                      : 'bg-transparent border-[rgba(255,255,255,0.04)] hover:bg-[#121212]/40'
                  }`}
                >
                  <div className="min-w-0">
                    <span className="text-white text-[10.5px] font-bold block truncate max-w-[190px]">{srv.roadName}</span>
                    <span className="text-[8px] text-slate-500 block font-mono mt-0.5">{srv.id} · {srv.length} km</span>
                  </div>
                  <span className={`text-[7px] px-1 py-0.5 rounded font-bold uppercase ${
                    srv.status === 'Completed' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-amber-500/10 text-amber-400'
                  }`}>
                    {srv.status}
                  </span>
                </div>
              );
            })}
          </div>

          {/* Survey Summary panel */}
          <div className="p-3 bg-[#121212]/60 font-mono text-[9px] text-slate-400 shrink-0 space-y-1.5 border-t border-slate-800">
            <span className="text-[#3B82F6] text-[8px] font-bold uppercase tracking-wider block font-sans">Campaign Summary</span>
            <div className="flex justify-between border-b border-slate-850 pb-0.5">
              <span>SURVEY ID:</span>
              <span className="text-white font-bold">{selectedSurvey.id}</span>
            </div>
            <div className="flex justify-between border-b border-slate-850 pb-0.5">
              <span>ROAD NAME:</span>
              <span className="text-white font-bold max-w-[155px] truncate">{selectedSurvey.roadName}</span>
            </div>
            <div className="flex justify-between border-b border-slate-850 pb-0.5">
              <span>OPERATOR:</span>
              <span className="text-white">{selectedSurvey.operator}</span>
            </div>
            <div className="flex justify-between">
              <span>VEHICLE:</span>
              <span className="text-white">{selectedSurvey.vehicle}</span>
            </div>
          </div>

        </aside>

      </div>

      {/* DETAILED INSPECTION BOTTOM WORKSPACE (38vh height tabbed panel) */}
      <div className="h-[38vh] w-full bg-[#1A1A1A] flex flex-col overflow-hidden shrink-0">
        
        {/* Tab selectors */}
        <div className="flex border-b border-slate-800 bg-[#121212]/50 text-[10px] font-bold uppercase tracking-wider text-slate-500 font-mono scrollbar-none shrink-0 h-9 items-center px-4 gap-4 select-none">
          {[
            { id: 'Overview', label: 'Overview' },
            { id: 'Road Distresses', label: 'Road Distresses' },
            { id: 'Survey Details', label: 'Survey Details' },
            { id: 'Images', label: 'Images' },
            { id: 'Videos', label: 'Videos' },
            { id: 'Telemetry', label: 'Telemetry' },
            { id: 'Reports', label: 'Reports' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveBottomTab(tab.id)}
              className={`pb-1 px-1 relative transition-all duration-150 whitespace-nowrap ${
                activeBottomTab === tab.id ? 'text-[#3B82F6] font-extrabold' : 'hover:text-slate-300'
              }`}
            >
              {activeBottomTab === tab.id && (
                <span className="absolute bottom-0 left-0 right-0 h-[2px] bg-[#3B82F6]" />
              )}
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab Contents body */}
        <div className="flex-1 overflow-y-auto p-4 text-slate-305 text-xs font-sans">
          
          {activeBottomTab === 'Overview' && (
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-5 font-mono text-[10px]">
              <div><span className="block text-slate-550 text-[7.5px] uppercase">ROAD NAME</span><span className="text-white font-bold block mt-0.5">{selectedSurvey.roadName}</span></div>
              <div><span className="block text-slate-550 text-[7.5px] uppercase">SURVEY ID</span><span className="text-white font-bold block mt-0.5">{selectedSurvey.id}</span></div>
              <div><span className="block text-slate-550 text-[7.5px] uppercase">ROAD LENGTH</span><span className="text-white font-bold block mt-0.5">{selectedSurvey.length} km</span></div>
              <div><span className="block text-slate-550 text-[7.5px] uppercase">SURVEY DATE</span><span className="text-white block mt-0.5">{selectedSurvey.time}</span></div>
              <div><span className="block text-slate-550 text-[7.5px] uppercase">OPERATOR</span><span className="text-white block mt-0.5">{selectedSurvey.operator}</span></div>
              <div><span className="block text-slate-550 text-[7.5px] uppercase">VEHICLE ID</span><span className="text-white block mt-0.5">{selectedSurvey.vehicle}</span></div>
              <div><span className="block text-slate-550 text-[7.5px] uppercase">DISTANCE COVERED</span><span className="text-white font-bold block mt-0.5">{selectedSurvey.distanceCovered} km</span></div>
              <div><span className="block text-slate-550 text-[7.5px] uppercase">AVERAGE SPEED</span><span className="text-white block mt-0.5">{selectedSurvey.avgSpeed} km/h</span></div>
              <div><span className="block text-slate-550 text-[7.5px] uppercase">SURVEY DURATION</span><span className="text-white block mt-0.5">{selectedSurvey.duration}</span></div>
              <div><span className="block text-slate-550 text-[7.5px] uppercase">AVERAGE IRI</span><span className={`${getIriColorClass(selectedSurvey.avgIri)} font-bold block mt-0.5`}>{selectedSurvey.avgIri} m/km</span></div>
              <div><span className="block text-slate-550 text-[7.5px] uppercase">ROAD SCORE</span><span className="text-white block mt-0.5">{selectedSurvey.roadScore} / 5</span></div>
              <div><span className="block text-slate-550 text-[7.5px] uppercase">PROCESSING STATUS</span><span className="text-emerald-400 font-bold block mt-0.5">● {selectedSurvey.status}</span></div>
            </div>
          )}

          {activeBottomTab === 'Road Distresses' && (
            <div className="overflow-x-auto select-text font-mono text-[9.5px]">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-500">
                    <th className="py-1">TYPE</th>
                    <th className="py-1">SEVERITY</th>
                    <th className="py-1">LATITUDE</th>
                    <th className="py-1">LONGITUDE</th>
                    <th className="py-1">CHAINAGE</th>
                    <th className="py-1">CONFIDENCE</th>
                    <th className="py-1">TIMESTAMP</th>
                    <th className="py-1">STATUS</th>
                  </tr>
                </thead>
                <tbody>
                  <tr 
                    className="border-b border-slate-800/40 text-slate-350 hover:bg-[#121212] cursor-pointer"
                    onClick={() => highlightDistressCoords(16.3521, 80.6023)}
                  >
                    <td className="py-1 text-red-400 font-bold">● Pothole Anomaly</td>
                    <td>High</td>
                    <td>16.35210° N</td>
                    <td>80.60230° E</td>
                    <td>CH 12+450</td>
                    <td>95%</td>
                    <td>08:45:12 AM</td>
                    <td><span className="text-emerald-400">Validated</span></td>
                  </tr>
                  <tr 
                    className="border-b border-slate-800/40 text-slate-350 hover:bg-[#121212] cursor-pointer"
                    onClick={() => highlightDistressCoords(16.3552, 80.6054)}
                  >
                    <td className="py-1 text-amber-500">● Longitudinal Crack</td>
                    <td>Medium</td>
                    <td>16.35520° N</td>
                    <td>80.60540° E</td>
                    <td>CH 12+480</td>
                    <td>88%</td>
                    <td>08:45:34 AM</td>
                    <td><span className="text-emerald-400">Validated</span></td>
                  </tr>
                  <tr 
                    className="border-b border-slate-800/40 text-slate-350 hover:bg-[#121212] cursor-pointer"
                    onClick={() => highlightDistressCoords(16.3584, 80.6081)}
                  >
                    <td className="py-1 text-purple-400">● Alligator Crack Grid</td>
                    <td>High</td>
                    <td>16.35840° N</td>
                    <td>80.60810° E</td>
                    <td>CH 12+530</td>
                    <td>92%</td>
                    <td>08:46:02 AM</td>
                    <td><span className="text-amber-400">Review Pending</span></td>
                  </tr>
                </tbody>
              </table>
            </div>
          )}

          {activeBottomTab === 'Survey Details' && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 font-mono text-[10px]">
              <div><span className="block text-slate-550 text-[7.5px] uppercase">SURVEY START</span><span className="text-white block mt-0.5">03-Aug-2026 08:45 AM</span></div>
              <div><span className="block text-slate-550 text-[7.5px] uppercase">SURVEY END</span><span className="text-white block mt-0.5">03-Aug-2026 09:37 AM</span></div>
              <div><span className="block text-slate-550 text-[7.5px] uppercase">CAMERA MODEL</span><span className="text-white block mt-0.5">Sony IMX477 FHD lens</span></div>
              <div><span className="block text-slate-550 text-[7.5px] uppercase">GPS ACCURACY</span><span className="text-emerald-400 block mt-0.5">&lt; 1.2 meters (RTK)</span></div>
              <div><span className="block text-slate-550 text-[7.5px] uppercase">TOTAL IMAGES</span><span className="text-white block mt-0.5">14,250 frames</span></div>
              <div><span className="block text-slate-550 text-[7.5px] uppercase">TOTAL VIDEOS</span><span className="text-white block mt-0.5">1 FHD stream (.mp4)</span></div>
              <div><span className="block text-slate-550 text-[7.5px] uppercase">STORAGE USED</span><span className="text-white block mt-0.5">18.4 GB</span></div>
              <div><span className="block text-slate-550 text-[7.5px] uppercase">UPLOAD STATUS</span><span className="text-emerald-400 font-bold block mt-0.5">100% Completed</span></div>
            </div>
          )}

          {activeBottomTab === 'Images' && (
            <div className="space-y-4">
              <span className="text-[7.5px] text-slate-500 font-bold uppercase tracking-wider block font-mono">Image gallery & frames</span>
              <div className="flex gap-4 overflow-x-auto pb-2">
                {[
                  { ch: 'CH 12+450', lat: 16.3521, lng: 80.6023, img: 'https://images.unsplash.com/photo-1515162305285-0293e4767cc2?auto=format&fit=crop&q=80&w=150' },
                  { ch: 'CH 12+480', lat: 16.3552, lng: 80.6054, img: 'https://images.unsplash.com/photo-1515162305285-0293e4767cc2?auto=format&fit=crop&q=80&w=150' }
                ].map((item, idx) => (
                  <div 
                    key={idx} 
                    onClick={() => highlightDistressCoords(item.lat, item.lng)}
                    className="bg-slate-900 border border-slate-800 p-2 rounded cursor-zoom-in text-center shrink-0 w-36"
                  >
                    <img src={item.img} className="h-16 w-full object-cover rounded mb-1.5" alt="frame snap" />
                    <span className="block text-[8px] text-slate-400 font-mono font-bold">{item.ch}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeBottomTab === 'Videos' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 font-mono text-[10px]">
              <div className="h-28 bg-[#121212] border border-slate-800 rounded flex flex-col items-center justify-center gap-2">
                <Tv className="w-6 h-6 text-slate-500" />
                <span className="text-[9px]">ch12_bypass_recording_fhd.mp4</span>
              </div>
              <div className="space-y-2">
                <span className="text-[7.5px] text-slate-550 uppercase font-bold block">Playback timeline controller</span>
                <div className="flex items-center gap-3">
                  <button onClick={() => setIsPlaying(!isPlaying)} className="px-2 py-1 bg-slate-900 rounded border border-slate-800 text-white flex items-center justify-center font-bold">
                    {isPlaying ? 'PAUSE' : 'PLAY'}
                  </button>
                  <span className="text-white">Offset: 01m 42s / 52m 14s</span>
                </div>
              </div>
            </div>
          )}

          {activeBottomTab === 'Telemetry' && (
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 font-mono text-[10px]">
              <div><span className="block text-slate-550 text-[7.5px] uppercase">CPU UTILIZATION</span><span className="text-white block mt-0.5">42%</span></div>
              <div><span className="block text-slate-550 text-[7.5px] uppercase">GPU UTILIZATION</span><span className="text-white block mt-0.5">68%</span></div>
              <div><span className="block text-slate-550 text-[7.5px] uppercase">TEMPERATURE</span><span className="text-amber-500 block mt-0.5">48°C</span></div>
              <div><span className="block text-slate-550 text-[7.5px] uppercase">RAM ALLOCATION</span><span className="text-white block mt-0.5">3.8 GB / 8.0 GB</span></div>
              <div><span className="block text-slate-550 text-[7.5px] uppercase">BATTERY</span><span className="text-emerald-450 block mt-0.5">100% (Charging)</span></div>
              <div><span className="block text-slate-550 text-[7.5px] uppercase">STORAGE CAPACITY</span><span className="text-white block mt-0.5">128 GB Free</span></div>
            </div>
          )}

          {activeBottomTab === 'Reports' && (
            <div className="space-y-3 font-mono text-[11px]">
              <span className="text-[8px] text-slate-500 font-bold uppercase tracking-wider block font-sans">Download assessment registers</span>
              <div className="flex gap-2">
                <button onClick={() => alert('PDF export generated.')} className="px-3 py-1.5 bg-[#121212] border border-slate-800 hover:bg-slate-800 text-white rounded text-[10px] uppercase font-bold flex items-center gap-1.5"><Download className="w-3.5 h-3.5" /> PDF</button>
                <button onClick={() => alert('Excel export generated.')} className="px-3 py-1.5 bg-[#121212] border border-slate-800 hover:bg-slate-800 text-white rounded text-[10px] uppercase font-bold flex items-center gap-1.5"><Download className="w-3.5 h-3.5" /> Excel</button>
                <button onClick={() => alert('CSV export generated.')} className="px-3 py-1.5 bg-[#121212] border border-slate-800 hover:bg-slate-800 text-white rounded text-[10px] uppercase font-bold flex items-center gap-1.5"><Download className="w-3.5 h-3.5" /> CSV</button>
                <button onClick={() => alert('GeoJSON export generated.')} className="px-3 py-1.5 bg-[#121212] border border-slate-800 hover:bg-slate-800 text-white rounded text-[10px] uppercase font-bold flex items-center gap-1.5"><Download className="w-3.5 h-3.5" /> GeoJSON</button>
              </div>
            </div>
          )}

        </div>

      </div>

    </div>
  );
};
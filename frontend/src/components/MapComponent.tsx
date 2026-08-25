import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import type { Detection, GpsCoords } from '../types';

interface MapComponentProps {
  gpsPath: GpsCoords[];
  detections: Detection[];
  currentLocation: GpsCoords | null;
  mapCenter?: GpsCoords;
  zoom?: number;
  selectedDetection?: Detection | null;
}

// Tactical SVG templates for AI Detections
const getDetectionSvg = (type: string, color: string) => {
  let innerIcon = '';
  if (type === 'Pothole') {
    innerIcon = `<ellipse cx="12" cy="13" rx="5" ry="3" fill="${color}" fill-opacity="0.2" stroke="${color}" stroke-width="2"/><path d="M4 9h1.5v1.5H4zm3-4h1v1H7zm8-1h1.5v1h-1.5zm4 4.5h1v1H19zm-2 6.5h1.5v1H17zm-6 1h1.5v1H11zm-7-2h1.5v1H4z" fill="${color}"/>`;
  } else if (type === 'Longitudinal Crack') {
    innerIcon = `<path d="M12 2v20" stroke="currentColor" stroke-width="1.5" stroke-dasharray="3 3" stroke-opacity="0.3"/><path d="M11.5 2l1.5 3-2 3.5 2.5 4-1.5 3.5 2 3-1.5 3" stroke="${color}" stroke-width="2.5" fill="none" stroke-linecap="round" stroke-linejoin="round"/>`;
  } else if (type === 'Transverse Crack') {
    innerIcon = `<path d="M12 2v20" stroke="currentColor" stroke-width="1.5" stroke-dasharray="3 3" stroke-opacity="0.3"/><path d="M2 12.5l3-2 4 2.5 3.5-3 4.5 3.5 3-2 2 .5" stroke="${color}" stroke-width="2.5" fill="none" stroke-linecap="round" stroke-linejoin="round"/>`;
  } else if (type === 'Alligator Crack') {
    innerIcon = `<path d="M12 3l5 3v5.5l-5 3-5-3V6l5-3zM12 14.5l5 3v4.5l-5 2-5-2v-4.5l5-3zM17 6l5 3v5.5l-5 3M7 6L2 9v5.5l5 3M12 9v5.5M12 9l5-3M12 9L7 6M12 14.5l5 3M12 14.5l-5 3" stroke="${color}" stroke-width="1.5" fill="none" stroke-linecap="round" stroke-linejoin="round"/>`;
  } else {
    innerIcon = `<circle cx="12" cy="12" r="6" fill="${color}"/>`;
  }

  return `<div class="relative group">
            <div class="w-7 h-7 rounded-xl border border-slate-700/60 bg-slate-900/90 flex items-center justify-center shadow-lg transition-transform hover:scale-110" style="box-shadow: 0 0 10px ${color}35;">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                ${innerIcon}
              </svg>
            </div>
          </div>`;
};

const createVehicleMarkerIcon = (heading: number = 0) => {
  return L.divIcon({
    html: `<div class="w-8 h-8 rounded-full bg-primary flex items-center justify-center border-2 border-white shadow-glow live-pulse-dot" style="transform: rotate(${heading}deg);">
             <span class="text-white text-xs font-bold font-sans">▲</span>
           </div>`,
    className: 'custom-leaflet-vehicle',
    iconSize: [32, 32],
    iconAnchor: [16, 16],
  });
};

// Premium tactical popup card
const createPopupHtml = (title: string, details: { [key: string]: string | number }) => {
  return `
    <div class="p-4 text-slate-100 bg-slate-900 border border-slate-800 rounded-xl min-w-[260px] font-sans">
      <div class="border-b border-slate-800 pb-2 mb-2 flex justify-between items-center">
        <span class="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none">GIS Inspections Info</span>
        <span class="text-[8px] font-bold bg-primary/20 text-primary-light px-1.5 py-0.5 rounded uppercase leading-none">NH-16 campaign</span>
      </div>
      <h4 class="text-white text-xs font-bold uppercase mb-3 tracking-wider leading-none">${title}</h4>
      <div class="grid grid-cols-2 gap-2 text-[9px] font-mono text-slate-400 mb-4">
        ${Object.entries(details).map(([key, val]) => `
          <div class="flex flex-col">
            <span class="text-slate-600 text-[8px] uppercase font-bold leading-none mb-0.5">${key}</span>
            <span class="text-slate-200 font-semibold leading-none">${val}</span>
          </div>
        `).join('')}
      </div>
      <div class="flex gap-2 pt-2 border-t border-slate-800/80">
        <button onclick="alert('Viewing high-res frames captured by Edge camera...')" class="flex-1 bg-primary hover:bg-primary-dark text-white text-[8px] font-bold uppercase py-1.5 rounded transition-all">
          View Images
        </button>
        <button onclick="alert('Loading GPS trajectory replay...')" class="flex-1 bg-slate-800 hover:bg-slate-700 text-slate-300 text-[8px] font-bold uppercase py-1.5 rounded transition-all">
          Replay Survey
        </button>
      </div>
    </div>
  `;
};

export const MapComponent: React.FC<MapComponentProps> = ({
  gpsPath,
  detections,
  currentLocation,
  mapCenter = { lat: 16.3500, lng: 80.6000 }, // Center around Guntur area
  zoom = 11, // Zoom level 11
  selectedDetection,
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  
  // Layer Group references
  const roadQualityGroupRef = useRef<L.LayerGroup | null>(null);
  const surveyRouteGroupRef = useRef<L.LayerGroup | null>(null);
  const detectionsGroupRef = useRef<L.LayerGroup | null>(null);
  const vehicleGroupRef = useRef<L.LayerGroup | null>(null);

  // Simplified essential Layer States
  const [layers, setLayers] = useState({
    surveyRoute: true,
    vehicleLocation: true,
    roadQuality: true,
    potholes: true,
    longitudinalCracks: true,
    transverseCracks: true,
    alligatorCracks: true,
  });

  const [mouseCoords, setMouseCoords] = useState<GpsCoords>({ lat: 16.3500, lng: 80.6000 });

  // Initialize Map
  useEffect(() => {
    if (!mapContainerRef.current) return;

    const map = L.map(mapContainerRef.current, {
      center: [mapCenter.lat, mapCenter.lng],
      zoom: zoom,
      zoomControl: false,
      attributionControl: false,
    });

    // Default CartoDB Dark Matter base tile
    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
      maxZoom: 20,
    }).addTo(map);

    L.control.zoom({ position: 'topright' }).addTo(map);
    L.control.scale({ position: 'bottomleft', imperial: false }).addTo(map);

    mapRef.current = map;

    // Initialize Layer groups
    roadQualityGroupRef.current = L.layerGroup().addTo(map);
    surveyRouteGroupRef.current = L.layerGroup().addTo(map);
    detectionsGroupRef.current = L.layerGroup().addTo(map);
    vehicleGroupRef.current = L.layerGroup().addTo(map);

    // Mouse movement coordinates track
    map.on('mousemove', (e: L.LeafletMouseEvent) => {
      setMouseCoords({ lat: e.latlng.lat, lng: e.latlng.lng });
    });

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, []);

  // Sync Road Quality & Survey Routes segments (color graded)
  useEffect(() => {
    const roadQualityGroup = roadQualityGroupRef.current;
    if (!roadQualityGroup) return;

    roadQualityGroup.clearLayers();

    if (!layers.roadQuality || gpsPath.length < 2) return;

    // Segment drawing
    for (let i = 0; i < gpsPath.length - 1; i++) {
      const start = gpsPath[i];
      const end = gpsPath[i + 1];

      // Gradually change colors along different sections
      let color = '#10B981'; // Green (Excellent)
      let grade = 'Excellent';
      let iri = 1.45;
      let pcr = 96;
      let potholesCount = 0;
      let cracksCount = 0;

      if (i > 14) {
        color = '#EF4444'; // Red (Critical)
        grade = 'Critical';
        iri = 3.65;
        pcr = 54;
        potholesCount = 3;
        cracksCount = 18;
      } else if (i > 10) {
        color = '#F59E0B'; // Orange (Poor)
        grade = 'Poor';
        iri = 2.92;
        pcr = 72;
        potholesCount = 1;
        cracksCount = 12;
      } else if (i > 6) {
        color = '#EAB308'; // Yellow (Fair)
        grade = 'Fair';
        iri = 2.18;
        pcr = 84;
        potholesCount = 0;
        cracksCount = 5;
      } else if (i > 3) {
        color = '#84CC16'; // Light Green (Good)
        grade = 'Good';
        iri = 1.78;
        pcr = 90;
        potholesCount = 0;
        cracksCount = 2;
      }

      const segment = L.polyline([[start.lat, start.lng], [end.lat, end.lng]], {
        color: color,
        weight: 6,
        opacity: 0.85,
        lineCap: 'round',
      });

      segment.bindPopup(createPopupHtml('Road Segment NH-16', {
        'Road ID': `NH16-S0${20 + i}`,
        'Road Name': 'NH-16',
        'Segment Length': '350 m',
        'Road Grade': grade,
        'IRI Index': `${iri} m/km`,
        'PCR score': pcr,
        'Potholes': potholesCount,
        'Cracks': cracksCount,
        'Survey Date': '28 July 2026',
        'Operator': 'Sivesh',
        'Edge Device': 'EDGE-001'
      }));

      roadQualityGroup.addLayer(segment);
    }
  }, [gpsPath, layers.roadQuality]);

  // Sync GPS Survey Route Line
  useEffect(() => {
    const surveyRouteGroup = surveyRouteGroupRef.current;
    if (!surveyRouteGroup) return;

    surveyRouteGroup.clearLayers();

    if (!layers.surveyRoute || gpsPath.length < 2) return;

    const trail = L.polyline(gpsPath.map(c => [c.lat, c.lng]), {
      color: '#3B82F6', // Blue GPS route
      weight: 3,
      opacity: 0.75,
      dashArray: '5, 10',
    });

    surveyRouteGroup.addLayer(trail);
  }, [gpsPath, layers.surveyRoute]);

  // Sync AI Detections Markers (Potholes, Longitudinal Cracks, Transverse Cracks, Alligator Cracks only)
  useEffect(() => {
    const detectionsGroup = detectionsGroupRef.current;
    if (!detectionsGroup) return;

    detectionsGroup.clearLayers();

    detections.forEach(det => {
      // Toggle checks based on specific simplified layers
      if (det.type === 'Pothole' && !layers.potholes) return;
      if (det.type === 'Longitudinal Crack' && !layers.longitudinalCracks) return;
      if (det.type === 'Transverse Crack' && !layers.transverseCracks) return;
      if (det.type === 'Alligator Crack' && !layers.alligatorCracks) return;

      let color = '#EF4444'; // Pothole Red
      if (det.type === 'Longitudinal Crack') color = '#3B82F6'; // Blue
      else if (det.type === 'Transverse Crack') color = '#F97316'; // Orange
      else if (det.type === 'Alligator Crack') color = '#10B981'; // Green

      const marker = L.marker([det.location.lat, det.location.lng], {
        icon: L.divIcon({
          html: getDetectionSvg(det.type, color),
          className: 'tactical-ai-pin',
          iconSize: [28, 28],
          iconAnchor: [14, 14],
        })
      });

      marker.bindPopup(createPopupHtml(det.type, {
        'Confidence': `${(det.confidence * 100).toFixed(0)}%`,
        'Location Lat': det.location.lat.toFixed(5),
        'Location Lng': det.location.lng.toFixed(5),
        'Road Score': `Class ${det.roadScore}`,
        'Survey Date': '28 July 2026',
        'AI engine': 'EDGE-YOLOv8',
        'Edge Node': 'EDGE-001'
      }));

      detectionsGroup.addLayer(marker);
    });
  }, [detections, layers.potholes, layers.longitudinalCracks, layers.transverseCracks, layers.alligatorCracks]);

  // Sync Live Moving Vehicle Location
  useEffect(() => {
    const vehicleGroup = vehicleGroupRef.current;
    if (!vehicleGroup) return;

    vehicleGroup.clearLayers();

    if (!layers.vehicleLocation) return;

    if (currentLocation) {
      const marker = L.marker([currentLocation.lat, currentLocation.lng], {
        icon: createVehicleMarkerIcon(45), // Facing NE heading
      });

      marker.bindPopup(`
        <div class="p-3 bg-slate-900 border border-slate-800 text-slate-100 rounded-lg min-w-[200px] font-sans">
          <span class="block text-[8px] font-bold text-primary-light uppercase tracking-wider mb-1">Active vehicle lock</span>
          <h4 class="font-bold text-white text-xs mb-2">Survey Vessel: AP-07-TJ-1044</h4>
          <div class="grid grid-cols-2 gap-1.5 text-[9px] font-mono text-slate-400">
            <span>Speed: 52 km/h</span>
            <span>Heading: North</span>
            <span>Status: Running</span>
            <span>Precision: 0.85m</span>
          </div>
        </div>
      `);

      vehicleGroup.addLayer(marker);
    } else {
      // Place near Mangalagiri as default static location if simulation is idle
      const defaultVehicleCoords = { lat: 16.4300, lng: 80.5600 };
      const marker = L.marker([defaultVehicleCoords.lat, defaultVehicleCoords.lng], {
        icon: createVehicleMarkerIcon(0),
      });

      marker.bindPopup(`
        <div class="p-3 bg-slate-900 border border-slate-800 text-slate-100 rounded-lg min-w-[200px] font-sans">
          <span class="block text-[8px] font-bold text-primary-light uppercase tracking-wider mb-1">Vehicle Standby</span>
          <h4 class="font-bold text-white text-xs mb-2">Survey Vessel: AP-07-TJ-1044</h4>
          <div class="grid grid-cols-2 gap-1.5 text-[9px] font-mono text-slate-400">
            <span>Speed: 0 km/h</span>
            <span>Status: Standby</span>
            <span>Location: Mangalagiri</span>
          </div>
        </div>
      `);

      vehicleGroup.addLayer(marker);
    }
  }, [currentLocation, layers.vehicleLocation]);

  // Sync selection zoom to AI defect marker
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !selectedDetection) return;

    map.setView([selectedDetection.location.lat, selectedDetection.location.lng], 16);
  }, [selectedDetection]);

  // Click handler utilities
  const handleResetView = () => {
    const map = mapRef.current;
    if (!map) return;
    map.setView([16.3500, 80.6000], 11);
  };

  const handleLocateVehicle = () => {
    const map = mapRef.current;
    if (!map) return;
    if (currentLocation) {
      map.setView([currentLocation.lat, currentLocation.lng], 15);
    } else {
      map.setView([16.4300, 80.5600], 15); // Default vehicle location near Mangalagiri
    }
  };

  const toggleLayer = (key: keyof typeof layers) => {
    setLayers(prev => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <div className="w-full h-full relative bg-slate-950 rounded-2xl border border-slate-800 overflow-hidden shadow-2xl flex">
      {/* Map Container Element */}
      <div ref={mapContainerRef} className="flex-1 h-full z-0" />

      {/* Floating Tactical Overlay Controls (Top Right) */}
      <div className="absolute top-4 right-4 z-[1000] flex flex-col gap-2">
        <div className="bg-slate-900/90 border border-slate-800 rounded-lg p-1 flex flex-col gap-1 shadow-lg floating-overlay">
          <button 
            onClick={handleResetView}
            className="p-2 rounded text-[10px] font-bold uppercase text-slate-400 hover:text-white hover:bg-slate-800/80 transition-all"
            title="Reset to center view"
          >
            Reset view
          </button>
          <button 
            onClick={handleLocateVehicle}
            className="p-2 rounded text-[10px] font-bold uppercase text-slate-400 hover:text-white hover:bg-slate-800/80 transition-all font-mono"
            title="Locate survey vehicle"
          >
            Locate Vehicle
          </button>
        </div>
      </div>

      {/* Floating Essential GIS Overlay Layers panel menu drawer (Top Left) */}
      <div className="absolute top-4 left-4 bg-[#0a0f1e]/95 border border-[#1e293b]/85 rounded-xl p-3.5 shadow-2xl z-[1000] floating-overlay text-[10.5px] font-mono text-slate-400 w-60 select-none space-y-3 backdrop-blur-md">
        <div className="border-b border-[#1e293b]/80 pb-2 flex flex-col gap-0.5">
          <span className="text-[8px] font-bold text-slate-500 uppercase tracking-widest leading-none">GIS Operations</span>
          <span className="text-white font-bold text-[11px] uppercase tracking-wider">Overlay Layers</span>
        </div>
        
        <div className="space-y-1.5 font-sans">
          {/* Survey Route */}
          <div className="w-full flex items-center justify-between px-2.5 py-2 rounded-lg bg-slate-800/10 border border-[#1e293b]/60 hover:border-slate-700/50 transition-all">
            <div className="flex items-center gap-3">
              <svg className="w-4 h-4 text-[#2563EB]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="6" cy="19" r="3" />
                <circle cx="18" cy="5" r="3" />
                <path d="M9 17a6 6 0 0 0 6-6" />
                <path d="M15 11a3 3 0 0 1 3-3" />
              </svg>
              <span className="text-slate-200 text-[11.5px]">Survey Route</span>
            </div>
            <button 
              onClick={() => toggleLayer('surveyRoute')}
              className={`relative inline-flex h-[18px] w-8 shrink-0 cursor-pointer rounded-full border border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${layers.surveyRoute ? 'bg-[#2563EB]' : 'bg-[#1e293b]'}`}
            >
              <span className={`pointer-events-none inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow transition duration-200 ease-in-out ${layers.surveyRoute ? 'translate-x-3.5' : 'translate-x-0'}`} />
            </button>
          </div>

          {/* Vehicle Location */}
          <div className="w-full flex items-center justify-between px-2.5 py-2 rounded-lg bg-slate-800/10 border border-[#1e293b]/60 hover:border-slate-700/50 transition-all">
            <div className="flex items-center gap-3">
              <svg className="w-4 h-4 text-[#06B6D4]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.4 2.9A3.7 3.7 0 0 0 2 12v4c0 .6.4 1 1 1h2" />
                <circle cx="7" cy="17" r="2" />
                <circle cx="17" cy="17" r="2" />
              </svg>
              <span className="text-slate-200 text-[11.5px]">Vehicle Location</span>
            </div>
            <button 
              onClick={() => toggleLayer('vehicleLocation')}
              className={`relative inline-flex h-[18px] w-8 shrink-0 cursor-pointer rounded-full border border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${layers.vehicleLocation ? 'bg-[#2563EB]' : 'bg-[#1e293b]'}`}
            >
              <span className={`pointer-events-none inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow transition duration-200 ease-in-out ${layers.vehicleLocation ? 'translate-x-3.5' : 'translate-x-0'}`} />
            </button>
          </div>

          {/* Road Quality */}
          <div className="w-full flex items-center justify-between px-2.5 py-2 rounded-lg bg-slate-800/10 border border-[#1e293b]/60 hover:border-slate-700/50 transition-all">
            <div className="flex items-center gap-3">
              <svg className="w-4 h-4 text-[#10B981]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M4 22V2h16v20" />
                <path d="M12 2v20" strokeDasharray="4 4" />
                <path d="M8 6h2M14 10h2" />
              </svg>
              <span className="text-slate-200 text-[11.5px]">Road Quality</span>
            </div>
            <button 
              onClick={() => toggleLayer('roadQuality')}
              className={`relative inline-flex h-[18px] w-8 shrink-0 cursor-pointer rounded-full border border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${layers.roadQuality ? 'bg-[#2563EB]' : 'bg-[#1e293b]'}`}
            >
              <span className={`pointer-events-none inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow transition duration-200 ease-in-out ${layers.roadQuality ? 'translate-x-3.5' : 'translate-x-0'}`} />
            </button>
          </div>

          <div className="border-t border-[#1e293b]/80 my-2"></div>

          {/* Potholes */}
          <div className="w-full flex items-center justify-between px-2.5 py-2 rounded-lg bg-slate-800/10 border border-[#1e293b]/60 hover:border-slate-700/50 transition-all">
            <div className="flex items-center gap-3">
              <svg className="w-4 h-4 text-[#EF4444]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <ellipse cx="12" cy="13" rx="5" ry="3" fill="#EF4444" fillOpacity="0.2" stroke="#EF4444" strokeWidth="1.5" />
                <path d="M4 9h1.5v1.5H4zm3-4h1v1H7zm8-1h1.5v1h-1.5zm4 4.5h1v1H19zm-2 6.5h1.5v1H17zm-6 1h1.5v1H11zm-7-2h1.5v1H4z" fill="currentColor" />
              </svg>
              <span className="text-slate-200 text-[11.5px]">Potholes</span>
            </div>
            <button 
              onClick={() => toggleLayer('potholes')}
              className={`relative inline-flex h-[18px] w-8 shrink-0 cursor-pointer rounded-full border border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${layers.potholes ? 'bg-[#2563EB]' : 'bg-[#1e293b]'}`}
            >
              <span className={`pointer-events-none inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow transition duration-200 ease-in-out ${layers.potholes ? 'translate-x-3.5' : 'translate-x-0'}`} />
            </button>
          </div>

          {/* Longitudinal Crack */}
          <div className="w-full flex items-center justify-between px-2.5 py-2 rounded-lg bg-slate-800/10 border border-[#1e293b]/60 hover:border-slate-700/50 transition-all">
            <div className="flex items-center gap-3">
              <svg className="w-4 h-4 text-[#3B82F6]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 2v20" stroke="currentColor" strokeWidth="1.5" strokeDasharray="3 3" strokeOpacity="0.4" />
                <path d="M11.5 2l1.5 3-2 3.5 2.5 4-1.5 3.5 2 3-1.5 3" stroke="currentColor" strokeWidth="2" />
              </svg>
              <span className="text-slate-200 text-[11.5px]">Longitudinal Crack</span>
            </div>
            <button 
              onClick={() => toggleLayer('longitudinalCracks')}
              className={`relative inline-flex h-[18px] w-8 shrink-0 cursor-pointer rounded-full border border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${layers.longitudinalCracks ? 'bg-[#2563EB]' : 'bg-[#1e293b]'}`}
            >
              <span className={`pointer-events-none inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow transition duration-200 ease-in-out ${layers.longitudinalCracks ? 'translate-x-3.5' : 'translate-x-0'}`} />
            </button>
          </div>

          {/* Transverse Crack */}
          <div className="w-full flex items-center justify-between px-2.5 py-2 rounded-lg bg-slate-800/10 border border-[#1e293b]/60 hover:border-slate-700/50 transition-all">
            <div className="flex items-center gap-3">
              <svg className="w-4 h-4 text-[#F97316]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 2v20" stroke="currentColor" strokeWidth="1.5" strokeDasharray="3 3" strokeOpacity="0.4" />
                <path d="M2 12.5l3-2 4 2.5 3.5-3 4.5 3.5 3-2 2 .5" stroke="currentColor" strokeWidth="2" />
              </svg>
              <span className="text-slate-200 text-[11.5px]">Transverse Crack</span>
            </div>
            <button 
              onClick={() => toggleLayer('transverseCracks')}
              className={`relative inline-flex h-[18px] w-8 shrink-0 cursor-pointer rounded-full border border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${layers.transverseCracks ? 'bg-[#2563EB]' : 'bg-[#1e293b]'}`}
            >
              <span className={`pointer-events-none inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow transition duration-200 ease-in-out ${layers.transverseCracks ? 'translate-x-3.5' : 'translate-x-0'}`} />
            </button>
          </div>

          {/* Alligator Crack */}
          <div className="w-full flex items-center justify-between px-2.5 py-2 rounded-lg bg-slate-800/10 border border-[#1e293b]/60 hover:border-slate-700/50 transition-all">
            <div className="flex items-center gap-3">
              <svg className="w-4 h-4 text-[#10B981]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 3l5 3v5.5l-5 3-5-3V6l5-3zM12 14.5l5 3v4.5l-5 2-5-2v-4.5l5-3zM17 6l5 3v5.5l-5 3M7 6L2 9v5.5l5 3M12 9v5.5M12 9l5-3M12 9L7 6M12 14.5l5 3M12 14.5l-5 3" />
              </svg>
              <span className="text-slate-200 text-[11.5px]">Alligator Crack</span>
            </div>
            <button 
              onClick={() => toggleLayer('alligatorCracks')}
              className={`relative inline-flex h-[18px] w-8 shrink-0 cursor-pointer rounded-full border border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${layers.alligatorCracks ? 'bg-[#2563EB]' : 'bg-[#1e293b]'}`}
            >
              <span className={`pointer-events-none inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow transition duration-200 ease-in-out ${layers.alligatorCracks ? 'translate-x-3.5' : 'translate-x-0'}`} />
            </button>
          </div>
        </div>
      </div>

      {/* Floating Tactical Coordinates panel (Bottom Right) */}
      <div className="absolute bottom-4 right-4 bg-slate-900/90 border border-slate-800 rounded-lg px-3 py-2 text-[9px] font-mono text-slate-400 flex flex-col gap-0.5 shadow-lg z-[1000] floating-overlay">
        <div className="flex justify-between gap-4">
          <span className="text-slate-500 uppercase">CURSOR LAT:</span>
          <span className="text-slate-300 font-bold">{mouseCoords.lat.toFixed(6)}°</span>
        </div>
        <div className="flex justify-between gap-4">
          <span className="text-slate-500 uppercase">CURSOR LNG:</span>
          <span className="text-slate-300 font-bold">{mouseCoords.lng.toFixed(6)}°</span>
        </div>
        <div className="flex justify-between gap-4">
          <span className="text-slate-500 uppercase">GIS DATUM:</span>
          <span className="text-slate-300">WGS 84</span>
        </div>
      </div>

      {/* Floating Legend (Bottom Left) */}
      <div className="absolute bottom-4 left-4 bg-[#0a0f1e]/90 border border-[#1e293b]/85 rounded-lg px-3 py-2 shadow-lg z-[1000] floating-overlay text-[9px] font-mono text-slate-400 flex items-center gap-3.5 select-none">
        <span className="text-[8px] font-bold text-slate-500 uppercase tracking-widest block leading-none">ROAD GRADE INDEX</span>
        <div className="h-3.5 w-px bg-slate-800"></div>
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
          <span>Excellent (&lt;1.5)</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-lime-500"></span>
          <span>Good (&lt;2.0)</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-yellow-500"></span>
          <span>Fair (&lt;2.5)</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-amber-500"></span>
          <span>Poor (&lt;3.0)</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-red-500"></span>
          <span>Critical (&gt;3.0)</span>
        </div>
      </div>

    </div>
  );
};

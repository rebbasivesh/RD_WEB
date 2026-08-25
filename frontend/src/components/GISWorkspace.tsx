import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import {
  Layers,
  Compass
} from 'lucide-react';
import { GISOverlayLayers } from './GISOverlayLayers';
import { DefectSummaryCards } from './DefectSummaryCards';
import { SurveySelector } from './SurveySelector';
import type { Survey, Detection, GpsCoords } from '../types';

interface GISWorkspaceProps {
  surveys?: Survey[];
  selectedSurvey: Survey | null;
  onSelectSurvey?: (survey: Survey) => void;
  playbackIndex: number;
  setPlaybackIndex: (index: number) => void;
  isPlaying: boolean;
  setIsPlaying: (playing: boolean) => void;
  selectedDetection: Detection | null;
  onSelectDetection: (det: Detection | null) => void;
  onMapInit?: (map: L.Map) => void;
}

// Calculate bearing bearing between coordinates
function calculateBearing(start: GpsCoords, end: GpsCoords): number {
  const lat1 = (start.lat * Math.PI) / 180;
  const lat2 = (end.lat * Math.PI) / 180;
  const dLon = ((end.lng - start.lng) * Math.PI) / 180;
  const y = Math.sin(dLon) * Math.cos(lat2);
  const x = Math.cos(lat1) * Math.sin(lat2) - Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLon);
  const brng = (Math.atan2(y, x) * 180) / Math.PI;
  return (brng + 360) % 360;
}

export const GISWorkspace: React.FC<GISWorkspaceProps> = ({
  surveys = [],
  selectedSurvey,
  onSelectSurvey = () => {},
  playbackIndex,
  setPlaybackIndex,
  isPlaying,
  setIsPlaying,
  selectedDetection,
  onSelectDetection,
  onMapInit
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const vehicleMarkerRef = useRef<L.Marker | null>(null);
  const gpsTrailPolylineRef = useRef<L.Polyline | null>(null);
  const accuracyCircleRef = useRef<L.Circle | null>(null);

  // Layers toggle state
  const [layersState, setLayersState] = useState<Record<string, boolean>>({
    survey_route: true,
    vehicle_location: true,
    road_quality: true,
    potholes: true,
    longitudinal_crack: true,
    transverse_crack: true,
    alligator_crack: true
  });

  const [cursorCoords, setCursorCoords] = useState<{ lat: number; lng: number }>({ lat: 16.3500, lng: 80.6000 });
  const [mapError, setMapError] = useState<string | null>(null);

  // Map elements refs
  const routePolylineRef = useRef<L.Polyline | null>(null);
  const qualitySegmentsRef = useRef<L.Polyline[]>([]);
  const distressMarkersRef = useRef<{ detId: string; marker: any; type: string }[]>([]);

  // Initialize Map canvas
  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (mapRef.current) {
      mapRef.current.remove();
    }

    // Set correct template placeholders: {z}/{x}/{y} instead of {z}/{y}/{x}
    const basemapUrl = 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png';

    const map = L.map(mapContainerRef.current, {
      center: [16.3500, 80.6000],
      zoom: 12,
      zoomControl: false,
      attributionControl: false
    });
    mapRef.current = map;

    // Create custom panes for strict layering z-index ordering
    map.createPane('roadPane');
    map.getPane('roadPane')!.style.zIndex = '401';

    map.createPane('routePane');
    map.getPane('routePane')!.style.zIndex = '405';

    map.createPane('detectionPane');
    map.getPane('detectionPane')!.style.zIndex = '601';

    map.createPane('vehiclePane');
    map.getPane('vehiclePane')!.style.zIndex = '602';

    if (onMapInit) {
      onMapInit(map);
    }

    const tileLayer = L.tileLayer(basemapUrl, {
      opacity: 1.0,
      zIndex: 1
    }).addTo(map);

    // Diagnostics monitor: catch and report tile download errors
    tileLayer.on('tileerror', () => {
      setMapError("Offline: Failed to load map tiles. Please check your internet connection.");
    });

    // Track cursor coords
    map.on('mousemove', (e: L.LeafletMouseEvent) => {
      setCursorCoords({
        lat: Number(e.latlng.lat.toFixed(6)),
        lng: Number(e.latlng.lng.toFixed(6))
      });
    });

    // Resize observer to handle container size changes dynamically (avoids grey blank sections)
    const resizeObserver = new ResizeObserver(() => {
      if (mapRef.current) {
        mapRef.current.invalidateSize();
      }
    });

    if (mapContainerRef.current) {
      resizeObserver.observe(mapContainerRef.current);
    }

    return () => {
      resizeObserver.disconnect();
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, []);

  // Update survey tracks, distresses and path segments
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !selectedSurvey) return;

    // Clean previous polylines
    if (routePolylineRef.current) routePolylineRef.current.remove();
    if (gpsTrailPolylineRef.current) gpsTrailPolylineRef.current.remove();
    
    qualitySegmentsRef.current.forEach(p => p.remove());
    qualitySegmentsRef.current = [];

    distressMarkersRef.current.forEach(m => m.marker.remove());
    distressMarkersRef.current = [];

    if (vehicleMarkerRef.current) {
      vehicleMarkerRef.current.remove();
      vehicleMarkerRef.current = null;
    }

    if (accuracyCircleRef.current) {
      accuracyCircleRef.current.remove();
      accuracyCircleRef.current = null;
    }

    const polyCoords: [number, number][] = selectedSurvey.gpsPath.map(c => [c.lat, c.lng]);
    if (polyCoords.length === 0) return;

    // 1. Actual Survey Route Polyline from real GPS telemetry
    if (layersState.survey_route !== false) {
      const routePoly = L.polyline(polyCoords, {
        color: '#22D3EE',
        weight: 5,
        opacity: 0.9,
        lineCap: 'round',
        lineJoin: 'round',
        pane: 'routePane'
      }).addTo(map);
      routePolylineRef.current = routePoly;
    }

    // Always fit map bounds to actual survey route coordinates
    if (polyCoords.length >= 2) {
      const routeBounds = L.latLngBounds(polyCoords);
      map.invalidateSize();
      map.fitBounds(routeBounds, { 
        padding: [45, 45],
        maxZoom: 16
      });
    }

    // 2. Real Road Quality Segments rendering (color-coded ASTM condition buffers)
    if (layersState.road_quality !== false) {
      const rqSegments = selectedSurvey.roadQualitySegments;
      if (rqSegments && rqSegments.length > 0) {
        rqSegments.forEach((seg) => {
          const segCoords: [number, number][] = seg.coordinates.map(c => [c.lat, c.lng]);
          if (segCoords.length < 2) return;

          // Outer glowing condition buffer
          const glowPoly = L.polyline(segCoords, {
            color: seg.color,
            weight: 12,
            opacity: 0.35,
            lineCap: 'round',
            lineJoin: 'round',
            pane: 'roadPane'
          }).addTo(map);
          qualitySegmentsRef.current.push(glowPoly);

          // Core condition line
          const qualityPoly = L.polyline(segCoords, {
            color: seg.color,
            weight: 6.5,
            opacity: 0.95,
            lineCap: 'round',
            lineJoin: 'round',
            pane: 'roadPane'
          }).addTo(map);
          qualitySegmentsRef.current.push(qualityPoly);

          // Segment click popup showing real IRI & Condition
          qualityPoly.on('click', (e) => {
            L.popup()
              .setLatLng(e.latlng)
              .setContent(`
                <div style="font-family: monospace; font-size: 10px; background-color: #172033; color: #fff; padding: 8px 12px; border: 1px solid rgba(255,255,255,0.08); border-radius: 6px;">
                  <b style="color: ${seg.color}">ROAD QUALITY CONDITION</b><br/>
                  SEGMENT: #${seg.segmentNumber}<br/>
                  CONDITION: ${seg.roadGrade.toUpperCase()}<br/>
                  IRI ROUGHNESS: ${seg.iri.toFixed(2)} m/km
                </div>
              `)
              .openOn(map);
          });
        });
      }
    }

    // 3. AI Distress markers with vector SVGs and hover popups
    selectedSurvey.detections.forEach((det, idx) => {
      const typeLower = (det.type || '').toLowerCase();
      const isTypeVisible = 
        (typeLower.includes('pothole') && layersState.potholes !== false) ||
        (typeLower.includes('longitudinal') && layersState.longitudinal_crack !== false) ||
        (typeLower.includes('transverse') && layersState.transverse_crack !== false) ||
        (typeLower.includes('alligator') && layersState.alligator_crack !== false);

      if (!isTypeVisible) return;

      const markerColor = 
        det.type === 'Pothole' 
          ? '#EF4444' 
          : det.type === 'Alligator Crack' 
          ? '#8B5CF6' 
          : det.type === 'Transverse Crack'
          ? '#EAB308'
          : '#F59E0B';

      // Design distinct vector SVGs for each distress type
      let markerSvgHtml = '';
      if (det.type === 'Pothole') {
        markerSvgHtml = `
          <div class="hover:scale-125 transition-transform duration-200" style="filter: drop-shadow(0 0 5px rgba(239, 68, 68, 0.8));">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="#EF4444" stroke="#FFFFFF" stroke-width="1.5">
              <circle cx="12" cy="12" r="10" />
              <circle cx="12" cy="12" r="4" fill="#FFFFFF" />
            </svg>
          </div>
        `;
      } else if (det.type === 'Alligator Crack') {
        markerSvgHtml = `
          <div class="hover:scale-125 transition-transform duration-200" style="filter: drop-shadow(0 0 5px rgba(139, 92, 246, 0.85));">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="#8B5CF6" stroke="#FFFFFF" stroke-width="1.5">
              <rect x="2" y="2" width="20" height="20" rx="4" />
              <path d="M7 2v20M17 2v20M2 7h20M2 17h20" stroke="rgba(255,255,255,0.4)" stroke-width="1.2" />
            </svg>
          </div>
        `;
      } else if (det.type === 'Longitudinal Crack') {
        markerSvgHtml = `
          <div class="hover:scale-125 transition-transform duration-200" style="filter: drop-shadow(0 0 5px rgba(245, 158, 11, 0.85));">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="#F59E0B" stroke="#FFFFFF" stroke-width="1.5">
              <circle cx="12" cy="12" r="9" />
              <line x1="12" y1="5" x2="12" y2="19" stroke="#FFFFFF" stroke-width="2" />
            </svg>
          </div>
        `;
      } else {
        // Transverse Crack
        markerSvgHtml = `
          <div class="hover:scale-125 transition-transform duration-200" style="filter: drop-shadow(0 0 5px rgba(251, 191, 36, 0.85));">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="#EAB308" stroke="#FFFFFF" stroke-width="1.5">
              <circle cx="12" cy="12" r="9" />
              <line x1="5" y1="12" x2="19" y2="12" stroke="#FFFFFF" stroke-width="2" />
            </svg>
          </div>
        `;
      }

      const markerIcon = L.divIcon({
        className: 'custom-distress-vector-icon',
        html: markerSvgHtml,
        iconSize: [16, 16],
        iconAnchor: [8, 8]
      });

      const distressMarker = L.marker([det.location.lat, det.location.lng], {
        icon: markerIcon,
        pane: 'detectionPane'
      }).addTo(map);

      // Detailed hover popup html with image preview
      const severityStr = det.roadScore >= 4 ? 'CRITICAL' : 'MODERATE';
      const mockThumb = 'https://images.unsplash.com/photo-1515162305285-0293e4767cc2?auto=format&fit=crop&q=80&w=40';

      distressMarker.bindPopup(`
        <div style="font-family: monospace; font-size: 9px; background-color: #172033; color: #fff; padding: 8px 12px; border: 1px solid rgba(255,255,255,0.08); border-radius: 6px; display: flex; gap: 10px; align-items: center; min-width: 210px; pointer-events: none;">
          <img src="${mockThumb}" style="width: 44px; height: 33px; object-fit: cover; border-radius: 3px; border: 1px solid rgba(255,255,255,0.1);" />
          <div>
            <b style="color: ${markerColor}; font-size: 10.5px;">${det.type.toUpperCase()}</b><br/>
            SEVERITY: ${severityStr}<br/>
            CONFIDENCE: ${(det.confidence * 100).toFixed(0)}% · CH 12+450<br/>
            TIMESTAMP: ${det.timestamp}
          </div>
        </div>
      `, {
        closeButton: false,
        offset: [0, -5]
      });

      // Hover bindings
      distressMarker.on('mouseover', (e) => {
        e.target.openPopup();
      });
      distressMarker.on('mouseout', (e) => {
        e.target.closePopup();
      });

      // Click binding
      distressMarker.on('click', () => {
        onSelectDetection(det);
      });

      distressMarkersRef.current.push({
        detId: det.id,
        marker: distressMarker,
        type: det.type
      });
    });

    // 4. Vehicle location arrow marker (with pulsing radar ring & vector chevron)
    if (layersState.vehicle_location) {
      const vehicleIcon = L.divIcon({
        className: 'custom-vehicle-arrow-wrapper-premium',
        html: `
          <div class="flex flex-col items-center select-none pointer-events-none relative" style="transform: translateY(-8px);">
            <div class="vehicle-pulse-ring"></div>
            <svg class="arrow-dir transition-transform duration-200" style="width: 22px; height: 22px; filter: drop-shadow(0 0 5px #2563EB); fill: #2563EB;" viewBox="0 0 24 24">
              <path d="M12,2L4.5,20.29L5.21,21L12,18L18.79,21L19.5,20.29L12,2Z"/>
            </svg>
            <div style="background-color: rgba(23, 32, 51, 0.92); border: 1px solid rgba(255,255,255,0.08); color: #fff; font-family: monospace; font-size: 8px; padding: 2px 5px; border-radius: 3px; white-space: nowrap; margin-top: 4px; box-shadow: 0 4px 12px rgba(0,0,0,0.55); backdrop-filter: blur(8px);">
              52 km/h · FR-${1250 + playbackIndex}
            </div>
          </div>
        `,
        iconSize: [120, 50],
        iconAnchor: [60, 11]
      });

      const initialCoords = polyCoords[playbackIndex] || polyCoords[0];
      const marker = L.marker(initialCoords, { 
        icon: vehicleIcon,
        pane: 'vehiclePane'
      }).addTo(map);
      vehicleMarkerRef.current = marker;

      // Add GPS Accuracy Circle representing standard error threshold
      const accuracyCircle = L.circle(initialCoords, {
        radius: 18,
        fillColor: '#2563EB',
        fillOpacity: 0.08,
        color: '#2563EB',
        weight: 1,
        opacity: 0.25,
        pane: 'roadPane'
      }).addTo(map);
      accuracyCircleRef.current = accuracyCircle;
    }

    // 5. GPS Trail Polyline
    const trailCoords: L.LatLngTuple[] = selectedSurvey.gpsPath.slice(0, playbackIndex + 1).map(c => [c.lat, c.lng] as L.LatLngTuple);
    const trailPoly = L.polyline(trailCoords, {
      color: '#2563EB',
      weight: 6.5,
      opacity: 0.9,
      lineCap: 'round',
      lineJoin: 'round',
      pane: 'routePane'
    }).addTo(map);
    gpsTrailPolylineRef.current = trailPoly;

  }, [selectedSurvey, layersState]);

  // Synchronize playback indicator trail and rotation headings
  useEffect(() => {
    if (!selectedSurvey) return;
    
    const coords = selectedSurvey.gpsPath[playbackIndex];
    if (coords && vehicleMarkerRef.current) {
      vehicleMarkerRef.current.setLatLng([coords.lat, coords.lng]);
      
      // Update accuracy circle coordinates dynamically
      if (accuracyCircleRef.current) {
        accuracyCircleRef.current.setLatLng([coords.lat, coords.lng]);
      }

      // Calculate bearing rotation angle
      let angle = 0;
      if (playbackIndex < selectedSurvey.gpsPath.length - 1) {
        const nextCoords = selectedSurvey.gpsPath[playbackIndex + 1];
        angle = calculateBearing(coords, nextCoords);
      } else if (playbackIndex > 0) {
        const prevCoords = selectedSurvey.gpsPath[playbackIndex - 1];
        angle = calculateBearing(prevCoords, coords);
      }

      // Update arrow rotation transform
      const markerElement = vehicleMarkerRef.current.getElement();
      if (markerElement) {
        const arrowElement = markerElement.querySelector('.arrow-dir');
        if (arrowElement) {
          (arrowElement as HTMLElement).style.transform = `rotate(${angle}deg)`;
        }
        
        // Update frame index label dynamically
        const labelElement = markerElement.querySelector('div[style*="background-color"]');
        if (labelElement) {
          labelElement.innerHTML = `52 km/h · FR-${1250 + playbackIndex}`;
        }
      }
    }

    // Update GPS trail polyline path coordinates
    if (gpsTrailPolylineRef.current) {
      const trailCoords: L.LatLngTuple[] = selectedSurvey.gpsPath.slice(0, playbackIndex + 1).map(c => [c.lat, c.lng] as L.LatLngTuple);
      gpsTrailPolylineRef.current.setLatLngs(trailCoords);
    }
  }, [playbackIndex, selectedSurvey]);

  // Highlight distress coordinates on click
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !selectedDetection) return;

    map.setView([selectedDetection.location.lat, selectedDetection.location.lng], 16);
    
    // Find Leaflet marker and trigger popup open
    const match = distressMarkersRef.current.find(m => m.detId === selectedDetection.id);
    if (match) {
      match.marker.openPopup();
    }
  }, [selectedDetection]);

  const handleToggleLayer = (layerId: string, active: boolean) => {
    setLayersState(prev => ({ ...prev, [layerId]: active }));
  };

  return (
    <div className="flex-grow h-full relative bg-[#08111D] flex flex-col min-w-0">
      
      {/* MAP CANVAS CONTAINER */}
      <div ref={mapContainerRef} className="flex-1 w-full h-full z-0" />

      {/* Map error banner */}
      {mapError && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-50 bg-danger border border-danger/25 text-white text-[10px] font-mono px-4 py-2.5 rounded-lg shadow-2xl flex items-center gap-2 select-none animate-pulse">
          <span>⚠️</span>
          <span>{mapError}</span>
          <button onClick={() => setMapError(null)} className="ml-2 font-bold hover:text-slate-200">×</button>
        </div>
      )}

      {/* Top Left Floating GIS Survey & Layer Selection Overlay */}
      <div className="absolute top-4 left-4 z-20 flex flex-col gap-2 items-start">
        <SurveySelector
          surveys={surveys}
          selectedSurvey={selectedSurvey}
          onSelectSurvey={onSelectSurvey}
          layersState={layersState}
          onToggleLayer={handleToggleLayer}
        />
      </div>

      {/* Floating map controls with premium glass effect */}
      <div className="absolute top-4 right-4 z-10 flex flex-col gap-2">
        <div className="flex flex-col bg-[#172033]/95 border border-white/5 rounded-lg overflow-hidden shadow-2xl backdrop-blur-md">
          <button 
            onClick={() => mapRef.current?.zoomIn()} 
            className="w-8 h-8 hover:bg-white/5 text-slate-300 hover:text-white flex items-center justify-center font-mono font-bold border-b border-white/5 transition-colors"
          >
            +
          </button>
          <button 
            onClick={() => mapRef.current?.zoomOut()} 
            className="w-8 h-8 hover:bg-white/5 text-slate-300 hover:text-white flex items-center justify-center font-mono font-bold transition-colors"
          >
            -
          </button>
        </div>

        <button 
          onClick={() => {
            if (mapRef.current && routePolylineRef.current) {
              mapRef.current.invalidateSize();
              mapRef.current.fitBounds(routePolylineRef.current.getBounds(), { 
                padding: [45, 45],
                maxZoom: 15
              });
            }
          }}
          className="w-8 h-8 bg-[#172033]/95 border border-white/5 hover:border-white/10 hover:bg-[#172033] text-slate-400 hover:text-white rounded-lg flex items-center justify-center shadow-2xl backdrop-blur-md transition-colors"
          title="Center route bounds"
        >
          <Compass className="w-4 h-4" />
        </button>
      </div>

      {/* Cursor coordinates scale overlay */}
      <div className="absolute bottom-4 left-4 z-10 bg-[#172033]/90 border border-white/5 px-2.5 py-1.5 rounded-lg text-[9px] font-mono text-slate-400 select-none shadow-2xl backdrop-blur-sm">
        <span>LAT: {cursorCoords.lat.toFixed(6)}° N</span>
        <span className="ml-4">LNG: {cursorCoords.lng.toFixed(6)}° E</span>
      </div>

      {/* Unobtrusive Map Legend (Requirement 20) */}
      <div className="absolute bottom-4 right-4 z-10 bg-[#121826]/90 border border-white/10 rounded-xl px-3 py-2 text-[9.5px] font-mono text-slate-300 backdrop-blur-md shadow-2xl flex items-center gap-3 select-none">
        <span className="text-[8.5px] font-bold text-slate-400 uppercase font-sans tracking-wider">CONDITION</span>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-[#10B981]" />
          <span>GOOD (1-2)</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-[#EAB308]" />
          <span>FAIR (2-3)</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-[#F59E0B]" />
          <span>POOR (3-4)</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-[#EF4444]" />
          <span>CRITICAL (4-5)</span>
        </div>
      </div>

    </div>
  );
};

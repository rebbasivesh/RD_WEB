import React, { useState, useEffect, useRef } from 'react';
import { MapComponent } from './MapComponent';
import { LiveAIDetectionsTimeline } from './LiveAIDetectionsTimeline';
import { BottomConsolePanel } from './BottomConsolePanel';
import type { Survey, Detection, GpsCoords } from '../types';
import { mockPathCoordinates, generateLiveDetection, activeProject } from '../mockData';
import { 
  PlayIcon, 
  PauseIcon, 
  StopIcon
} from '@heroicons/react/24/solid';

interface LiveSurveyViewProps {
  deviceConnected: boolean;
  onSurveyCompleted: (survey: Survey) => void;
  activeSurvey: Survey | null;
  setActiveSurvey: React.Dispatch<React.SetStateAction<Survey | null>>;
  gpsPath: GpsCoords[];
  setGpsPath: React.Dispatch<React.SetStateAction<GpsCoords[]>>;
  detections: Detection[];
  setDetections: React.Dispatch<React.SetStateAction<Detection[]>>;
  currentLocation: GpsCoords | null;
  setCurrentLocation: (coords: GpsCoords | null) => void;
  selectedDetection: Detection | null;
  setSelectedDetection: (det: Detection | null) => void;
}

export const LiveSurveyView: React.FC<LiveSurveyViewProps> = ({
  deviceConnected,
  onSurveyCompleted,
  activeSurvey,
  setActiveSurvey,
  gpsPath,
  setGpsPath,
  detections,
  setDetections,
  currentLocation,
  setCurrentLocation,
  selectedDetection,
  setSelectedDetection
}) => {
  const [isPaused, setIsPaused] = useState(false);
  const timerRef = useRef<number | null>(null);
  const coordsIndexRef = useRef(0);

  const handleStartSurvey = () => {
    if (!deviceConnected) return;

    const newSurvey: Survey = {
      id: `SRV-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`,
      projectName: activeProject.projectName,
      roadName: activeProject.roadName,
      operatorName: activeProject.operatorName,
      vehicleId: activeProject.vehicleId,
      status: 'running',
      date: new Date().toISOString().split('T')[0],
      startTime: new Date().toLocaleTimeString(),
      distanceCoveredKm: 0.0,
      durationSeconds: 0,
      avgIri: 1.6,
      avgPcr: 94.0,
      totalDetections: 0,
      gpsPath: [],
      detections: [],
      assets: [],
    };

    setActiveSurvey(newSurvey);
    setGpsPath([]);
    setDetections([]);
    setIsPaused(false);
    coordsIndexRef.current = 0;
  };

  useEffect(() => {
    if (!activeSurvey || activeSurvey.status !== 'running' || isPaused) {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      return;
    }

    if (!timerRef.current) {
      timerRef.current = window.setInterval(() => {
        const nextIndex = coordsIndexRef.current;
        if (nextIndex >= mockPathCoordinates.length) {
          handleStopSurvey();
          return;
        }

        const nextCoords = mockPathCoordinates[nextIndex];
        setCurrentLocation(nextCoords);

        setGpsPath(prev => {
          const updated = [...prev, nextCoords];
          if (activeSurvey) {
            const distance = updated.length * 0.04;
            setActiveSurvey((prevSurvey: Survey | null) => {
              if (!prevSurvey) return null;
              return {
                ...prevSurvey,
                gpsPath: updated,
                distanceCoveredKm: parseFloat(distance.toFixed(2)),
                durationSeconds: prevSurvey.durationSeconds + 1,
              };
            });
          }
          return updated;
        });

        // Simulating periodic AI detections
        if (Math.random() > 0.75) {
          const liveDet = generateLiveDetection(nextCoords);
          setDetections(prev => {
            const updated = [liveDet, ...prev];
            setActiveSurvey((prevSurvey: Survey | null) => {
              if (!prevSurvey) return null;
              return {
                ...prevSurvey,
                totalDetections: updated.length,
                detections: updated,
              };
            });
            return updated;
          });
        } else {
          setActiveSurvey((prevSurvey: Survey | null) => {
            if (!prevSurvey) return null;
            return {
              ...prevSurvey,
              durationSeconds: prevSurvey.durationSeconds + 1,
            };
          });
        }

        coordsIndexRef.current += 1;
      }, 1000);
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [activeSurvey, isPaused]);

  const handlePauseSurvey = () => {
    setIsPaused(!isPaused);
    setActiveSurvey((prev: Survey | null) => {
      if (!prev) return null;
      return {
        ...prev,
        status: isPaused ? 'running' : 'paused',
      };
    });
  };

  const handleStopSurvey = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    if (activeSurvey) {
      const finalSurvey: Survey = {
        ...activeSurvey,
        status: 'completed',
        endTime: new Date().toLocaleTimeString(),
        avgIri: parseFloat((2.0 + Math.random() * 0.4).toFixed(2)),
        avgPcr: parseFloat((81 + Math.random() * 14).toFixed(1)),
      };

      onSurveyCompleted(finalSurvey);
      setActiveSurvey(null);
      setCurrentLocation(null);
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden bg-slate-950">
      
      {/* Simulation Controls Top Toolbar */}
      <div className="p-4 z-10 bg-slate-900 border-b border-slate-800 flex items-center justify-between select-none">
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1.5 text-[10px] text-slate-500 font-bold uppercase tracking-wider">
            <span className={`w-2.5 h-2.5 rounded-full ${activeSurvey ? (isPaused ? 'bg-amber-500' : 'bg-red-500 animate-pulse') : 'bg-slate-700'}`}></span>
            SIM STATE: {activeSurvey ? (isPaused ? 'PAUSED' : 'LOGGING SURVEY') : 'IDLE'}
          </span>
          {activeSurvey && (
            <span className="text-[10px] text-slate-400 font-mono font-bold bg-slate-950 px-3 py-1 rounded border border-slate-800">
              Length: {activeSurvey.distanceCoveredKm.toFixed(2)} km | Defects: {activeSurvey.totalDetections}
            </span>
          )}
        </div>

        {/* Start / Stop triggers */}
        <div className="flex items-center gap-3">
          {!activeSurvey ? (
            <button 
              onClick={handleStartSurvey}
              disabled={!deviceConnected}
              className="bg-primary hover:bg-primary-dark disabled:opacity-50 text-white font-bold text-xs uppercase px-4 py-2 rounded flex items-center gap-1.5 transition-all shadow-glow"
            >
              <PlayIcon className="w-4 h-4" /> Start Survey
            </button>
          ) : (
            <>
              <button 
                onClick={handlePauseSurvey}
                className="bg-warning hover:bg-amber-600 text-white font-bold text-xs uppercase px-4 py-2 rounded flex items-center gap-1.5 transition-all"
              >
                {isPaused ? <PlayIcon className="w-4 h-4" /> : <PauseIcon className="w-4 h-4" />}
                {isPaused ? 'Resume' : 'Pause'}
              </button>
              <button 
                onClick={handleStopSurvey}
                className="bg-danger hover:bg-red-600 text-white font-bold text-xs uppercase px-4 py-2 rounded flex items-center gap-1.5 transition-all shadow-glow"
              >
                <StopIcon className="w-4 h-4" /> Save Survey
              </button>
            </>
          )}
        </div>
      </div>

      {/* Workspace Grid */}
      <div className="flex-1 flex min-h-0 relative">
        
        {/* Leaflet Map center */}
        <div className="flex-1 h-full z-0 relative">
          <MapComponent 
            gpsPath={gpsPath} 
            detections={detections} 
            currentLocation={currentLocation}
            selectedDetection={selectedDetection}
          />
        </div>

        {/* Live scrolling AI distress drawer */}
        <LiveAIDetectionsTimeline 
          detections={detections} 
          selectedDetection={selectedDetection} 
          setSelectedDetection={setSelectedDetection} 
        />

      </div>

      {/* Bottom telemetry indicators */}
      <BottomConsolePanel 
        deviceConnected={deviceConnected} 
        surveysCount={1} 
      />

    </div>
  );
};

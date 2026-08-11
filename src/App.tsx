import { useState, useEffect } from 'react';
import { Sidebar } from './components/Sidebar';
import { Navbar } from './components/Navbar';
import { SurveySummaryBar } from './components/SurveySummaryBar';
import { GISWorkspace } from './components/GISWorkspace';
import { SurveyExplorer } from './components/SurveyExplorer';
import { InspectionWorkspace } from './components/InspectionWorkspace';
import { DefectSummaryCards } from './components/DefectSummaryCards';

// Existing sub-views for settings, users, devices, reports, projects
import { SettingsView } from './components/SettingsView';
import { UsersView } from './components/UsersView';
import { DevicesView } from './components/DevicesView';
import { ReportsView } from './components/ReportsView';
import { HistoryView } from './components/HistoryView';

import type { Survey, Detection, GpsCoords } from './types';
import { mockSurveys, mockPathCoordinates, mockDetections } from './mockData';
import { X } from 'lucide-react';

function App() {
  // Navigation states
  const [activeTab, setActiveTab] = useState<string>('gis_workspace');
  const [bottomTab, setBottomTab] = useState<string>('Survey Details');
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState<boolean>(false);
  const [activeModal, setActiveModal] = useState<string | null>(null);
  const [deviceConnected] = useState<boolean>(true);

  // Survey Data state
  const [surveys, setSurveys] = useState<Survey[]>(mockSurveys);

  const handleDeleteSurvey = (id: string) => {
    setSurveys((prev) => prev.filter((s) => s.id !== id));
  };

  // Survey Inspection state
  const [selectedSurvey, setSelectedSurvey] = useState<Survey | null>(mockSurveys[0]);
  const [playbackIndex, setPlaybackIndex] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [selectedDetection, setSelectedDetection] = useState<Detection | null>(null);
  const [isBottomCollapsed, setIsBottomCollapsed] = useState<boolean>(false);

  // Live Survey simulation state
  const [liveDetections, setLiveDetections] = useState<Detection[]>([]);
  const [liveStats, setLiveStats] = useState({
    distance: 0,
    potholes: 0,
    longitudinal: 0,
    transverse: 0,
    alligator: 0,
    iri: 1.45,
    score: 4.8
  });

  // Handle Tab Switch
  const handleSelectTab = (tab: string) => {
    setIsPlaying(false);
    setSelectedDetection(null);

    // Sidebar items mapping to popups
    if (['settings', 'users', 'edge_devices', 'survey_history'].includes(tab)) {
      setActiveModal(tab);
    } else {
      setActiveModal(null);
      if (tab === 'ai_detections') {
        setActiveTab('gis_workspace');
        setBottomTab('Road Distresses');
      } else if (tab === 'reports') {
        setActiveTab('gis_workspace');
        setBottomTab('Reports');
      } else {
        setActiveTab(tab);
        setBottomTab('Survey Details');
        if (tab === 'live_survey') {
          setPlaybackIndex(0);
          setLiveDetections([]);
          setLiveStats({
            distance: 0,
            potholes: 0,
            longitudinal: 0,
            transverse: 0,
            alligator: 0,
            iri: 1.45,
            score: 4.8
          });
        } else if (tab === 'gis_workspace' || tab === 'survey_history') {
          setSelectedSurvey(mockSurveys[0]);
          setPlaybackIndex(0);
        }
      }
    }
  };

  // Construct a Virtual Survey object during live mode
  const getActiveSurvey = (): Survey | null => {
    if (activeTab === 'live_survey') {
      return {
        id: 'LIVE-SRV-999',
        projectName: 'Pavement Quality Campaign',
        roadName: 'SH-35 Bypass Corridor (Live)',
        operatorName: 'A. Kumar (Edge Remote)',
        vehicleId: 'AP-07-TJ-1044',
        status: 'running',
        date: '2026-08-04',
        startTime: '11:58:00',
        distanceCoveredKm: liveStats.distance,
        durationSeconds: playbackIndex * 3,
        avgIri: liveStats.iri,
        avgPcr: 82,
        totalDetections: liveDetections.length,
        gpsPath: mockPathCoordinates,
        detections: liveDetections,
        assets: []
      };
    }
    return selectedSurvey;
  };

  // Playback & Simulation Loop
  useEffect(() => {
    if (!isPlaying) return;

    const intervalTime = activeTab === 'live_survey' ? 1200 : 400;

    const interval = setInterval(() => {
      const activeSurveyObj = getActiveSurvey();
      if (!activeSurveyObj) return;

      const pathLength = activeSurveyObj.gpsPath.length;

      setPlaybackIndex((prev) => {
        if (prev >= pathLength - 1) {
          setIsPlaying(false);
          if (activeTab === 'live_survey') {
            // Mark live survey as completed
            setLiveStats(s => ({ ...s, status: 'completed' } as any));
          }
          return prev;
        }

        const nextIndex = prev + 1;
        const currentCoord = activeSurveyObj.gpsPath[nextIndex];

        // If in live mode, dynamically trigger AI distresses at specific checkpoints
        if (activeTab === 'live_survey') {
          const distanceInc = (nextIndex) * 2.26; // Simulate distance covered
          const calculatedIri = 1.35 + Math.sin(nextIndex * 0.4) * 0.7 + (nextIndex > 10 ? 1.3 : 0);
          const computedScore = Math.max(1.0, Math.min(5.0, 5.0 - (calculatedIri * 0.7)));

          // Distress Spawning Logic
          let spawnedDet: Detection | null = null;
          let newPotholes = liveStats.potholes;
          let newLong = liveStats.longitudinal;
          let newTrans = liveStats.transverse;
          let newAlligator = liveStats.alligator;

          const nowStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false });

          if (nextIndex === 3) {
            spawnedDet = {
              id: `det_live_1`,
              timestamp: nowStr,
              type: 'Pothole',
              confidence: 0.96,
              location: currentCoord,
              roadScore: 5
            };
            newPotholes++;
          } else if (nextIndex === 6) {
            spawnedDet = {
              id: `det_live_2`,
              timestamp: nowStr,
              type: 'Alligator Crack',
              confidence: 0.91,
              location: currentCoord,
              roadScore: 4
            };
            newAlligator++;
          } else if (nextIndex === 11) {
            spawnedDet = {
              id: `det_live_3`,
              timestamp: nowStr,
              type: 'Longitudinal Crack',
              confidence: 0.88,
              location: currentCoord,
              roadScore: 3
            };
            newLong++;
          } else if (nextIndex === 15) {
            spawnedDet = {
              id: `det_live_4`,
              timestamp: nowStr,
              type: 'Transverse Crack',
              confidence: 0.94,
              location: currentCoord,
              roadScore: 2
            };
            newTrans++;
          }

          if (spawnedDet) {
            setLiveDetections(prevDets => [...prevDets, spawnedDet as Detection]);
            setSelectedDetection(spawnedDet);
          }

          setLiveStats({
            distance: distanceInc,
            iri: calculatedIri,
            score: computedScore,
            potholes: newPotholes,
            longitudinal: newLong,
            transverse: newTrans,
            alligator: newAlligator
          });
        }

        return nextIndex;
      });
    }, intervalTime);

    return () => clearInterval(interval);
  }, [isPlaying, activeTab, liveStats]);

  // Center Map Callback
  const handleCenterMap = (lat: number, lng: number) => {
    // Handled by GISWorkspace listening to selectedDetection
  };

  const renderModalContent = () => {
    switch (activeModal) {
      case 'settings':
        return <SettingsView />;
      case 'users':
        return <UsersView />;
      case 'edge_devices':
        return <DevicesView />;
      case 'survey_history':
        return (
          <HistoryView 
            surveys={surveys} 
            onDeleteSurvey={handleDeleteSurvey} 
            onSelectSurvey={(srv) => {
              setSelectedSurvey(srv);
              setPlaybackIndex(0);
              setIsPlaying(false);
              setSelectedDetection(null);
              setActiveModal(null);
              setActiveTab('gis_workspace');
            }}
          />
        );
      case 'reports':
        return <ReportsView />;
      default:
        return null;
    }
  };

  const activeSurveyData = getActiveSurvey();

  return (
    <div className="flex flex-col w-screen h-screen overflow-hidden bg-gis-bg text-slate-100 font-sans select-none relative">
      {/* 1. TOP: Enterprise Navigation Bar (58px fixed) */}
      <Navbar deviceConnected={deviceConnected} selectedSurvey={activeSurveyData} activeTab={activeTab} />

      {/* Main Section */}
      <div className="flex-1 flex overflow-hidden w-full h-[calc(100vh-60px)]">
        {/* 2. LEFT: Application Navigation (collapsed 72px / expanded 220px) */}
        <Sidebar
          activeTab={activeTab === 'gis_workspace' || activeTab === 'survey_history' ? 'gis_workspace' : activeTab}
          setActiveTab={handleSelectTab}
          isCollapsed={isSidebarCollapsed}
          setIsCollapsed={setIsSidebarCollapsed}
        />

        {/* Center, Right, Bottom Master Panel Container */}
        <div className="flex-1 flex flex-col overflow-hidden h-full relative min-w-0 bg-[#0C111A]">
          

          {/* Map + Explorer Horizontal splitter */}
          <div className="flex-1 flex overflow-hidden w-full relative min-h-0">
            {/* 3B. CENTER: GIS Workspace (Fills all remaining width dynamically) */}
            <div className="flex-grow h-full flex flex-col relative min-h-0">
              <GISWorkspace
                selectedSurvey={activeSurveyData}
                playbackIndex={playbackIndex}
                setPlaybackIndex={setPlaybackIndex}
                isPlaying={isPlaying}
                setIsPlaying={setIsPlaying}
                selectedDetection={selectedDetection}
                onSelectDetection={setSelectedDetection}
              />
            </div>

            {/* 4. RIGHT SIDEBAR: Survey Explorer (20% width) */}
            {activeTab !== 'live_survey' && (
              <div className="w-[20%] h-full flex flex-col relative border-l border-white/5 bg-[#0C111A] overflow-hidden shrink-0">
                <SurveyExplorer
                  surveys={surveys}
                  selectedSurvey={activeSurveyData}
                  onSelectSurvey={(srv) => {
                    setSelectedSurvey(srv);
                    setPlaybackIndex(0);
                    setIsPlaying(false);
                    setSelectedDetection(null);
                  }}
                />
              </div>
            )}
          </div>

          {/* 5. BOTTOM: Inspection Workspace */}
          <div className={`transition-all duration-350 ease-in-out shrink-0 overflow-hidden ${isBottomCollapsed ? 'h-[40px]' : 'h-[270px]'}`}>
            <InspectionWorkspace
              selectedSurvey={activeSurveyData}
              playbackIndex={playbackIndex}
              setPlaybackIndex={setPlaybackIndex}
              isPlaying={isPlaying}
              setIsPlaying={setIsPlaying}
              onCenterMap={handleCenterMap}
              onSelectDetection={setSelectedDetection}
              selectedDetection={selectedDetection}
              bottomTab={bottomTab}
              setBottomTab={setBottomTab}
              isCollapsed={isBottomCollapsed}
              onToggleCollapse={() => setIsBottomCollapsed(!isBottomCollapsed)}
            />
          </div>
        </div>
      </div>

      {/* Floating System Admin Modal Overlays */}
      {activeModal && (
        <div className="fixed inset-0 bg-gis-bg/85 backdrop-blur-md z-50 flex items-center justify-center p-6">
          <div className={`bg-gis-panel border border-gis-border rounded-xl w-full overflow-hidden shadow-2xl flex flex-col relative font-sans ${
            activeModal === 'survey_history' ? 'max-w-[90vw] h-[85vh]' : 'max-w-4xl max-h-[85vh]'
          }`}>
            
            {/* Modal Header */}
            <div className="p-4 border-b border-gis-border bg-gis-bg/40 flex justify-between items-center shrink-0">
              <div>
                <span className="text-[9px] text-[#2563EB] font-bold uppercase tracking-wider block font-mono">
                  PLATFORM SYSTEM PANEL
                </span>
                <h3 className="text-white text-[13px] font-black uppercase tracking-wide mt-0.5">
                  {activeModal === 'survey_history' ? 'Survey History Log' : `${activeModal.replace('_', ' ')} Settings`}
                </h3>
              </div>
              <button
                onClick={() => setActiveModal(null)}
                className="p-1.5 hover:bg-slate-800 text-slate-400 hover:text-white rounded-lg transition-colors border border-gis-border"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Contents */}
            <div className="flex-grow overflow-y-auto p-6 bg-gis-bg/10">
              {renderModalContent()}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;

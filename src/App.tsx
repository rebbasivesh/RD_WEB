import { useState, useEffect } from 'react';
import { Sidebar } from './components/Sidebar';
import { Navbar } from './components/Navbar';
import { GISWorkspace } from './components/GISWorkspace';
import { SurveyExplorer } from './components/SurveyExplorer';
import { SurveyExplorerPage } from './components/SurveyExplorerPage';
import { InspectionWorkspace } from './components/InspectionWorkspace';

// Views for settings, users, devices, reports, survey history, permissions
import { SettingsView } from './components/SettingsView';
import { UsersView } from './components/UsersView';
import { PermissionsView } from './components/PermissionsView';
import { DevicesView } from './components/DevicesView';
import { ReportsView } from './components/ReportsView';
import { HistoryView } from './components/HistoryView';

import { LoginPage } from './components/LoginPage';

import type { Survey, Detection, UserItem } from './types';
import { mockSurveys } from './mockData';
import { fetchSurveys, triggerProcessSurvey, fetchSurveyStatus, getMeApi, logoutApi } from './services/api';

function App() {
  // Authentication State
  const [authToken, setAuthToken] = useState<string | null>(
    sessionStorage.getItem('dats_token') || localStorage.getItem('dats_token')
  );
  const [currentUser, setCurrentUser] = useState<UserItem | null>(null);

  // Navigation states
  const [activeTab, setActiveTab] = useState<string>('gis_workspace');
  const [bottomTab, setBottomTab] = useState<string>('Survey Details');
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState<boolean>(false);
  const [activeModal, setActiveModal] = useState<string | null>(null);
  const [deviceConnected] = useState<boolean>(true);

  // Survey Data state
  const [surveys, setSurveys] = useState<Survey[]>(mockSurveys);
  const [selectedSurvey, setSelectedSurvey] = useState<Survey | null>(mockSurveys[0]);

  // Session verification on mount
  useEffect(() => {
    if (authToken) {
      getMeApi()
        .then((data) => {
          setCurrentUser(data.user);
        })
        .catch(() => {
          setAuthToken(null);
          sessionStorage.removeItem('dats_token');
          localStorage.removeItem('dats_token');
        });
    }
  }, [authToken]);

  const handleLogout = async () => {
    await logoutApi();
    setAuthToken(null);
    setCurrentUser(null);
    setActiveTab('gis_workspace');
    setActiveModal(null);
  };

  const loadSurveysFromBackend = () => {
    fetchSurveys().then((realSurveys) => {
      if (realSurveys && realSurveys.length > 0) {
        setSurveys(realSurveys);
        if (selectedSurvey) {
          const updatedSelected = realSurveys.find(s => s.id.toLowerCase() === selectedSurvey.id.toLowerCase());
          if (updatedSelected) setSelectedSurvey(updatedSelected);
        } else {
          setSelectedSurvey(realSurveys[0]);
        }
      }
    });
  };

  useEffect(() => {
    loadSurveysFromBackend();
  }, []);

  const handleProcessSurvey = async (surveyId: string) => {
    setSurveys(prev => prev.map(s => s.id.toLowerCase() === surveyId.toLowerCase() ? { ...s, status: 'processing' } : s));
    if (selectedSurvey && selectedSurvey.id.toLowerCase() === surveyId.toLowerCase()) {
      setSelectedSurvey(prev => prev ? { ...prev, status: 'processing' } : null);
    }

    const ok = await triggerProcessSurvey(surveyId);
    if (!ok) {
      alert(`Could not start processing for survey ${surveyId}`);
      return;
    }

    const pollTimer = setInterval(async () => {
      const currentStatus = await fetchSurveyStatus(surveyId);
      if (currentStatus === 'completed') {
        clearInterval(pollTimer);
        loadSurveysFromBackend();
      } else if (currentStatus === 'failed') {
        clearInterval(pollTimer);
        alert(`Processing failed for survey ${surveyId}`);
        loadSurveysFromBackend();
      }
    }, 3000);
  };

  const handleDeleteSurvey = (id: string) => {
    setSurveys(prev => prev.filter(s => s.id.toLowerCase() !== id.toLowerCase()));
    if (selectedSurvey && selectedSurvey.id.toLowerCase() === id.toLowerCase()) {
      setSelectedSurvey(surveys.find(s => s.id.toLowerCase() !== id.toLowerCase()) || null);
    }
  };

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

    if (['settings', 'users', 'edge_devices', 'survey_history', 'reports'].includes(tab)) {
      setActiveModal(tab);
    } else {
      setActiveModal(null);
      if (tab === 'ai_detections') {
        setActiveTab('gis_workspace');
        setBottomTab('Road Distresses');
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
        } else if (tab === 'gis_workspace') {
          if (surveys.length > 0 && !selectedSurvey) {
            setSelectedSurvey(surveys[0]);
          }
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
        gpsPath: [
          { lat: 16.3500, lng: 80.6000 },
          { lat: 16.3512, lng: 80.6015 },
          { lat: 16.3525, lng: 80.6030 },
          { lat: 16.3538, lng: 80.6045 },
          { lat: 16.3550, lng: 80.6060 },
          { lat: 16.3562, lng: 80.6075 },
          { lat: 16.3575, lng: 80.6090 }
        ],
        detections: liveDetections,
        assets: [],
        roadScore: liveStats.score
      };
    }
    return selectedSurvey;
  };

  // Simulated Live Survey Loop
  useEffect(() => {
    let interval: any = null;
    if (!isPlaying) return;

    const activeSurveyObj = getActiveSurvey();
    if (!activeSurveyObj || !activeSurveyObj.gpsPath || activeSurveyObj.gpsPath.length === 0) return;

    const pathLen = activeSurveyObj.gpsPath.length;
    const intervalTime = activeTab === 'live_survey' ? 3000 : 1200;

    interval = setInterval(() => {
      setPlaybackIndex((prev) => {
        if (prev >= pathLen - 1) {
          setIsPlaying(false);
          return prev;
        }

        const nextIndex = prev + 1;
        const currentCoord = activeSurveyObj.gpsPath[nextIndex];

        if (activeTab === 'live_survey') {
          const distanceInc = (nextIndex) * 2.26;
          const calculatedIri = 1.35 + Math.sin(nextIndex * 0.4) * 0.7 + (nextIndex > 10 ? 1.3 : 0);
          const computedScore = Math.max(1.0, Math.min(5.0, 5.0 - (calculatedIri * 0.7)));

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
          }

          if (spawnedDet) {
            setLiveDetections(prevDets => [...prevDets, spawnedDet!]);
            setSelectedDetection(spawnedDet);
          }

          setLiveStats({
            distance: distanceInc,
            iri: parseFloat(calculatedIri.toFixed(2)),
            score: parseFloat(computedScore.toFixed(1)),
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

  const handleCenterMap = (lat: number, lng: number) => {
    // Handled by GISWorkspace
  };

  const refreshCurrentUser = () => {
    if (authToken) {
      getMeApi()
        .then((data) => setCurrentUser(data.user))
        .catch(() => {});
    }
  };

  const renderModalContent = () => {
    switch (activeModal) {
      case 'settings':
        return <SettingsView />;
      case 'users':
        return <UsersView currentUser={currentUser} onRefreshCurrentUser={refreshCurrentUser} />;
      case 'permissions':
        return <PermissionsView currentUser={currentUser} />;
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

  const [bottomHeight, setBottomHeight] = useState<number>(320);
  const [isResizing, setIsResizing] = useState<boolean>(false);

  const handleMouseDownResize = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsResizing(true);

    const onMouseMove = (moveEvent: MouseEvent) => {
      const newHeight = window.innerHeight - moveEvent.clientY;
      const clamped = Math.max(40, Math.min(newHeight, window.innerHeight - 100));
      setBottomHeight(clamped);
      if (clamped > 60 && isBottomCollapsed) {
        setIsBottomCollapsed(false);
      }
    };

    const onMouseUp = () => {
      setIsResizing(false);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
    };

    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
  };

  // AUTHENTICATION GATE
  if (!authToken) {
    return (
      <LoginPage
        onLoginSuccess={(token, user) => {
          setAuthToken(token);
          setCurrentUser(user);
        }}
      />
    );
  }

  return (
    <div className={`flex flex-col w-screen h-screen overflow-hidden bg-gis-bg text-slate-100 font-sans select-none relative ${isResizing ? 'cursor-ns-resize' : ''}`}>
      {/* 1. TOP: Enterprise Navigation Bar */}
      <Navbar
        deviceConnected={deviceConnected}
        selectedSurvey={activeSurveyData}
        activeTab={activeModal || activeTab}
        currentUser={currentUser}
        onLogout={handleLogout}
      />

      {/* Main Section */}
      <div className="flex-1 flex overflow-hidden w-full h-[calc(100vh-60px)]">
        {/* 2. LEFT: Application Navigation Sidebar */}
        <Sidebar
          activeTab={activeModal || activeTab}
          setActiveTab={handleSelectTab}
          isCollapsed={isSidebarCollapsed}
          setIsCollapsed={setIsSidebarCollapsed}
          currentUser={currentUser}
        />

        {/* Center, Right, Bottom Master Panel Container */}
        <div className="flex-1 flex flex-col overflow-hidden h-full relative min-w-0 bg-[#0C111A]">
          {activeModal ? (
            <div className="flex-1 h-full w-full bg-[#0C111A] overflow-y-auto p-6 z-30 relative">
              {renderModalContent()}
            </div>
          ) : activeTab === 'survey_explorer' ? (
            <SurveyExplorerPage
              surveys={surveys}
              onSelectSurvey={(srv) => {
                setSelectedSurvey(srv);
                setPlaybackIndex(0);
                setIsPlaying(false);
                setSelectedDetection(null);
                setActiveTab('gis_workspace');
              }}
            />
          ) : (
            <>
              {/* Map + Explorer Horizontal splitter */}
              <div className="flex-1 flex overflow-hidden w-full relative min-h-0">
                {/* CENTER: GIS Workspace */}
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

                {/* RIGHT SIDEBAR: Survey Explorer */}
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

              {/* Drag Resize Handle Bar */}
              <div
                onMouseDown={handleMouseDownResize}
                className="h-2 w-full bg-[#121826] hover:bg-[#3B82F6]/60 cursor-ns-resize flex items-center justify-center border-t border-white/10 group transition-colors shrink-0 z-30 relative"
                title="Drag up or down to resize inspection panel"
              >
                <div className="w-12 h-1 bg-slate-600 group-hover:bg-white rounded-full transition-colors" />
              </div>

              {/* BOTTOM: Inspection Workspace */}
              <div
                style={{ height: isBottomCollapsed ? '40px' : `${bottomHeight}px` }}
                className={`transition-all ${isResizing ? 'duration-0' : 'duration-200'} shrink-0 overflow-hidden relative`}
              >
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
                  onProcessSurvey={handleProcessSurvey}
                />
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default App;

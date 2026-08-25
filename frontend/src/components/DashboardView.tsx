import React, { useState, useEffect } from 'react';
import { KPICards } from './KPICards';
import { MapComponent } from './MapComponent';
import { RightInspectorPanel } from './RightInspectorPanel';
import { BottomConsolePanel } from './BottomConsolePanel';
import { mockPathCoordinates, mockDetections, mockSurveys } from '../mockData';
import type { Survey, GpsCoords } from '../types';

interface DashboardViewProps {
  deviceConnected: boolean;
}

const localSurveysList: Survey[] = [
  mockSurveys[0],
  {
    id: 'NH65-S102',
    projectName: 'Pavement Quality Campaign',
    roadName: 'NH-65 Guntur - Tenali Corridor',
    operatorName: 'Suresh Babu',
    vehicleId: 'AP-07-CD-5678',
    status: 'completed',
    date: '2026-08-01',
    startTime: '08:15:00',
    endTime: '09:02:14',
    distanceCoveredKm: 45.2,
    durationSeconds: 2834,
    avgIri: 1.45,
    avgPcr: 91.2,
    totalDetections: 3,
    gpsPath: mockPathCoordinates.slice(0, 12),
    detections: mockDetections.slice(0, 3),
    assets: [],
  },
  {
    id: 'SH35-S044',
    projectName: 'Pavement Quality Campaign',
    roadName: 'SH-35 Mangalagiri Route',
    operatorName: 'Arun Das',
    vehicleId: 'DL-1XY-9876',
    status: 'completed',
    date: '2026-08-02',
    startTime: '10:30:00',
    endTime: '11:42:15',
    distanceCoveredKm: 28.6,
    durationSeconds: 4335,
    avgIri: 2.75,
    avgPcr: 68.4,
    totalDetections: 12,
    gpsPath: mockPathCoordinates.slice(5, 18),
    detections: mockDetections.slice(2, 6),
    assets: [],
  }
];

export const DashboardView: React.FC<DashboardViewProps> = ({ deviceConnected }) => {
  const [selectedSurvey, setSelectedSurvey] = useState<Survey>(localSurveysList[0]);
  const currentLocation = selectedSurvey.gpsPath[selectedSurvey.gpsPath.length - 1];

  const stats = {
    distanceCovered: selectedSurvey.distanceCoveredKm,
    roadQuality: selectedSurvey.avgPcr,
    avgIri: selectedSurvey.avgIri,
    totalDetections: selectedSurvey.totalDetections,
    potholesCount: Math.floor(selectedSurvey.totalDetections * 0.4),
    cracksCount: selectedSurvey.totalDetections - Math.floor(selectedSurvey.totalDetections * 0.4),
    activeDevices: 1,
    syncProgress: 98
  };

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden bg-[#080d18] text-slate-100 font-sans">
      {/* 1. KPI Ribbon */}
      <KPICards stats={stats} />

      {/* 2. Map & Right Telemetry Column */}
      <div className="flex-1 flex overflow-hidden relative">
        
        {/* Left Map component (Primary workspace) */}
        <div className="flex-1 h-full relative">
          <MapComponent
            gpsPath={selectedSurvey.gpsPath}
            detections={selectedSurvey.detections}
            currentLocation={currentLocation}
            selectedDetection={null}
          />
        </div>

        {/* Right Telemetry panel */}
        <RightInspectorPanel
          activeSurvey={selectedSurvey}
          currentLocation={currentLocation}
          surveysList={localSurveysList}
          onSelectSurvey={setSelectedSurvey}
        />

      </div>

      {/* 3. Bottom Pavement Quality Tab Panels */}
      <BottomConsolePanel
        deviceConnected={deviceConnected}
        surveysCount={localSurveysList.length}
      />
    </div>
  );
};

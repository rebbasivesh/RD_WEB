import type { Device, Survey, Detection, GpsCoords, RoadAsset } from './types';

// Mock Connected Edge Devices
export const mockDevices: Device[] = [
  {
    id: 'edge_node_01',
    name: 'EDGE-001 (Primary)',
    isOnline: true,
    ipAddress: '192.168.4.1',
    health: {
      cpuUsage: 42.5,
      gpuUsage: 68.0,
      ramUsage: 3.2,
      temperature: 52.4,
      storageUsed: 28.4,
      storageTotal: 128.0,
      cameraConnected: true,
      dockerRunning: true,
      internetOnline: true,
    }
  },
  {
    id: 'edge_node_02',
    name: 'EDGE-002 (Backup)',
    isOnline: false,
    ipAddress: '192.168.4.2',
    health: {
      cpuUsage: 0.0,
      gpuUsage: 0.0,
      ramUsage: 0.0,
      temperature: 28.1,
      storageUsed: 42.1,
      storageTotal: 256.0,
      cameraConnected: false,
      dockerRunning: false,
      internetOnline: false,
    }
  }
];

// Active Project Info
export const activeProject = {
  projectName: 'Pavement Quality Campaign',
  roadName: 'NH-16 (Tenali - Vijayawada Sec)',
  operatorName: 'Sivesh',
  vehicleId: 'AP-07-TJ-1044',
  cameraModel: 'Sony IMX477 FHD'
};

// Realistic AP Survey Route Coordinates
export const mockPathCoordinates: GpsCoords[] = [
  // Tenali (Start)
  { lat: 16.2395, lng: 80.6450 },
  { lat: 16.2550, lng: 80.6380 },
  { lat: 16.2720, lng: 80.6300 },
  { lat: 16.2900, lng: 80.6220 },
  { lat: 16.3100, lng: 80.6120 },
  { lat: 16.3300, lng: 80.6020 },
  { lat: 16.3500, lng: 80.5920 },
  { lat: 16.3700, lng: 80.5820 },
  { lat: 16.3900, lng: 80.5720 },
  { lat: 16.4100, lng: 80.5650 },
  // Mangalagiri (Vehicle default start near this)
  { lat: 16.4300, lng: 80.5600 },
  { lat: 16.4420, lng: 80.5700 },
  { lat: 16.4520, lng: 80.5800 },
  { lat: 16.4620, lng: 80.5900 },
  { lat: 16.4720, lng: 80.6000 },
  // Tadepalli
  { lat: 16.4820, lng: 80.6100 },
  { lat: 16.4880, lng: 80.6200 },
  { lat: 16.4940, lng: 80.6300 },
  { lat: 16.5000, lng: 80.6400 },
  // Vijayawada (End)
  { lat: 16.5062, lng: 80.6480 },
];

// Mock Detections along the route (Potholes, Longitudinal Cracks, Transverse Cracks, Alligator Cracks only)
export const mockDetections: Detection[] = [
  {
    id: 'det_01',
    timestamp: '15:10:12',
    type: 'Pothole',
    confidence: 0.97,
    location: { lat: 16.2720, lng: 80.6300 },
    roadScore: 4,
  },
  {
    id: 'det_02',
    timestamp: '15:15:30',
    type: 'Alligator Crack',
    confidence: 0.92,
    location: { lat: 16.3300, lng: 80.6020 },
    roadScore: 3,
  },
  {
    id: 'det_03',
    timestamp: '15:22:45',
    type: 'Longitudinal Crack',
    confidence: 0.89,
    location: { lat: 16.3900, lng: 80.5720 },
    roadScore: 2,
  },
  {
    id: 'det_04',
    timestamp: '15:30:18',
    type: 'Transverse Crack',
    confidence: 0.94,
    location: { lat: 16.4420, lng: 80.5700 },
    roadScore: 2,
  },
  {
    id: 'det_05',
    timestamp: '15:35:00',
    type: 'Pothole',
    confidence: 0.98,
    location: { lat: 16.4620, lng: 80.5900 },
    roadScore: 5,
  },
  {
    id: 'det_06',
    timestamp: '15:42:10',
    type: 'Alligator Crack',
    confidence: 0.91,
    location: { lat: 16.4940, lng: 80.6300 },
    roadScore: 4,
  }
];

// Historical Survey Records
export const mockSurveys: Survey[] = [
  {
    id: 'SRV-101',
    projectName: 'Pavement Quality Campaign',
    roadName: 'NH-16 Vijayawada Bypass',
    operatorName: 'Ravi Kumar',
    vehicleId: 'DL-1AB-1234',
    status: 'completed',
    date: '2026-08-03',
    startTime: '08:45:00',
    endTime: '09:37:14',
    distanceCoveredKm: 45.2,
    durationSeconds: 3134,
    avgIri: 2.45,
    avgPcr: 72.0,
    totalDetections: 6,
    gpsPath: mockPathCoordinates,
    detections: mockDetections,
    assets: [],
  },
  {
    id: 'SRV-102',
    projectName: 'Pavement Quality Campaign',
    roadName: 'NH-65 Guntur - Tenali Corridor',
    operatorName: 'Suresh Babu',
    vehicleId: 'AP-07CD-5678',
    status: 'running',
    date: '2026-08-02',
    startTime: '07:30:00',
    endTime: '08:11:08',
    distanceCoveredKm: 32.8,
    durationSeconds: 2468,
    avgIri: 1.82,
    avgPcr: 91.0,
    totalDetections: 4,
    gpsPath: mockPathCoordinates.slice(0, 15), // distinct path subset
    detections: mockDetections.slice(0, 4),
    assets: [],
  },
  {
    id: 'SRV-103',
    projectName: 'Pavement Quality Campaign',
    roadName: 'SH-35 Mangalagiri - Ponnur Route',
    operatorName: 'Arun Das',
    vehicleId: 'DL-1XY-9876',
    status: 'completed', // Let's keep as completed so it loads immediately on select
    date: '2026-08-01',
    startTime: '05:15:00',
    endTime: '05:58:42',
    distanceCoveredKm: 28.6,
    durationSeconds: 2622,
    avgIri: 3.12,
    avgPcr: 60.0,
    totalDetections: 3,
    gpsPath: mockPathCoordinates.slice(5, 20), // distinct path subset
    detections: mockDetections.slice(3, 6),
    assets: [],
  }
];

const defectTypes: ('Pothole' | 'Crack' | 'Longitudinal Crack' | 'Alligator Crack' | 'Road Patch' | 'Utility Cover' | 'Water Logging')[] = [
  'Pothole',
  'Longitudinal Crack',
  'Alligator Crack',
];

export const generateLiveDetection = (coords: GpsCoords): Detection => {
  const randomType = defectTypes[Math.floor(Math.random() * defectTypes.length)];
  const randomConfidence = 0.88 + Math.random() * 0.11;
  const now = new Date();
  const timestamp = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}:${now.getSeconds().toString().padStart(2, '0')}`;
  
  let score = 2; // Good
  if (randomType === 'Pothole') {
    score = 5; // Critical
  } else if (randomType === 'Alligator Crack') {
    score = 4; // Poor
  } else if (randomType === 'Longitudinal Crack') {
    score = 3; // Fair
  }

  // Map "Crack" string literally to Transverse Crack for live simulation occasionally
  const finalType = randomType === 'Alligator Crack' && Math.random() > 0.5 ? 'Transverse Crack' : randomType;

  return {
    id: `det_${now.getTime()}`,
    timestamp,
    type: finalType as any,
    confidence: parseFloat(randomConfidence.toFixed(2)),
    location: coords,
    roadScore: score,
  };
};
export const mockAssets: RoadAsset[] = [];

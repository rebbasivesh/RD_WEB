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
    id: 'RS_0508_1',
    projectName: 'Pavement Quality Campaign',
    roadName: 'Tenali',
    operatorName: 'A. Kumar',
    vehicleId: 'AP-07-TJ-1044',
    status: 'completed',
    date: '05 Aug 2026',
    startTime: '10:05 AM',
    endTime: '10:35 AM',
    distanceCoveredKm: 4.5,
    durationSeconds: 306,
    avgIri: 1.85,
    avgPcr: 88.0,
    averageSpeed: 52.8,
    totalDetections: 656,
    gpsPath: [
      { lat: 16.255504, lng: 80.631259 },
      { lat: 16.262000, lng: 80.635000 },
      { lat: 16.271890, lng: 80.638572 }
    ],
    detections: mockDetections,
    assets: [],
  },
  {
    id: 'RS_0508_2',
    projectName: 'Pavement Quality Campaign',
    roadName: 'Tenali – Vadlamudi',
    operatorName: 'A. Kumar',
    vehicleId: 'AP-07-TJ-1044',
    status: 'completed',
    date: '03 Aug 2026',
    startTime: '09:37 AM',
    endTime: '10:15 AM',
    distanceCoveredKm: 6.0,
    durationSeconds: 435,
    avgIri: 2.10,
    avgPcr: 82.0,
    averageSpeed: 49.6,
    totalDetections: 842,
    gpsPath: [
      { lat: 16.233221, lng: 80.612345 },
      { lat: 16.245000, lng: 80.628000 },
      { lat: 16.256712, lng: 80.645812 }
    ],
    detections: mockDetections,
    assets: [],
  },
  {
    id: 'RS_0508_3',
    projectName: 'Pavement Quality Campaign',
    roadName: 'NH-16',
    operatorName: 'Sivesh',
    vehicleId: 'AP-07-TJ-1045',
    status: 'processing',
    date: '02 Aug 2026',
    startTime: '02:15 PM',
    endTime: '03:00 PM',
    distanceCoveredKm: 8.2,
    durationSeconds: 482,
    avgIri: 2.45,
    avgPcr: 75.0,
    averageSpeed: 61.3,
    totalDetections: 1203,
    gpsPath: [
      { lat: 16.145612, lng: 80.589123 },
      { lat: 16.180000, lng: 80.640000 },
      { lat: 16.205451, lng: 80.701234 }
    ],
    detections: [],
    assets: [],
  },
  {
    id: 'RS_0508_4',
    projectName: 'Pavement Quality Campaign',
    roadName: 'Guntur Bypass',
    operatorName: 'Ravi Kumar',
    vehicleId: 'AP-07-TJ-1044',
    status: 'processing',
    date: '01 Aug 2026',
    startTime: '11:40 AM',
    endTime: '12:15 PM',
    distanceCoveredKm: 3.7,
    durationSeconds: 294,
    avgIri: 1.95,
    avgPcr: 85.0,
    averageSpeed: 45.2,
    totalDetections: 412,
    gpsPath: [
      { lat: 16.280112, lng: 80.410221 },
      { lat: 16.290000, lng: 80.420000 },
      { lat: 16.298776, lng: 80.432112 }
    ],
    detections: [],
    assets: [],
  },
  {
    id: 'RS_0508_5',
    projectName: 'Pavement Quality Campaign',
    roadName: 'Vijayawada Ring Road',
    operatorName: 'Suresh Babu',
    vehicleId: 'AP-07-TJ-1046',
    status: 'pending',
    date: '01 Aug 2026',
    startTime: '08:55 AM',
    endTime: '',
    distanceCoveredKm: 7.1,
    durationSeconds: 472,
    avgIri: 0,
    avgPcr: 0,
    averageSpeed: 54.1,
    totalDetections: 798,
    gpsPath: [
      { lat: 16.506123, lng: 80.612987 },
      { lat: 16.520000, lng: 80.630000 },
      { lat: 16.548764, lng: 80.658932 }
    ],
    detections: [],
    assets: [],
  },
  {
    id: 'RS_0731_1',
    projectName: 'Pavement Quality Campaign',
    roadName: 'Guntur – Bapatla',
    operatorName: 'Arun Das',
    vehicleId: 'AP-07-TJ-1044',
    status: 'completed',
    date: '31 Jul 2026',
    startTime: '05:30 PM',
    endTime: '06:15 PM',
    distanceCoveredKm: 9.6,
    durationSeconds: 598,
    avgIri: 1.72,
    avgPcr: 91.0,
    averageSpeed: 57.7,
    totalDetections: 1112,
    gpsPath: [
      { lat: 16.305221, lng: 80.320112 },
      { lat: 16.340000, lng: 80.380000 },
      { lat: 16.371223, lng: 80.452332 }
    ],
    detections: mockDetections,
    assets: [],
  },
  {
    id: 'RS_0731_2',
    projectName: 'Pavement Quality Campaign',
    roadName: 'Ongole Road',
    operatorName: 'Sivesh',
    vehicleId: 'AP-07-TJ-1047',
    status: 'failed',
    date: '31 Jul 2026',
    startTime: '03:10 PM',
    endTime: '03:30 PM',
    distanceCoveredKm: 5.2,
    durationSeconds: 390,
    avgIri: 0,
    avgPcr: 0,
    averageSpeed: 48.0,
    totalDetections: 532,
    gpsPath: [
      { lat: 15.506221, lng: 80.044221 },
      { lat: 15.540000, lng: 80.080000 },
      { lat: 15.572213, lng: 80.112345 }
    ],
    detections: [],
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

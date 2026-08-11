export interface DeviceHealth {
  cpuUsage: number;
  gpuUsage: number;
  ramUsage: number;
  temperature: number;
  storageUsed: number;
  storageTotal: number;
  cameraConnected: boolean;
  dockerRunning: boolean;
  internetOnline: boolean;
}

export interface Device {
  id: string;
  name: string;
  isOnline: boolean;
  ipAddress: string;
  health: DeviceHealth;
}

export interface GpsCoords {
  lat: number;
  lng: number;
}

export interface Detection {
  id: string;
  timestamp: string;
  type: 'Pothole' | 'Longitudinal Crack' | 'Transverse Crack' | 'Alligator Crack';
  confidence: number;
  location: GpsCoords;
  roadScore: number; // 1-5 scale
  imageUrl?: string;
}

export interface RoadAsset {
  id: string;
  type: 'Traffic Signal' | 'Traffic Sign' | 'Street Light' | 'Guard Rail' | 'Electric Pole' | 'Trees' | 'Bus Stop';
  location: GpsCoords;
}

export type SurveyStatus = 'idle' | 'running' | 'paused' | 'completed';

export interface Survey {
  id: string;
  projectName: string;
  roadName: string;
  operatorName: string;
  vehicleId: string;
  status: SurveyStatus;
  date: string;
  startTime: string;
  endTime?: string;
  distanceCoveredKm: number;
  durationSeconds: number;
  avgIri: number;
  avgPcr: number;
  totalDetections: number;
  gpsPath: GpsCoords[];
  detections: Detection[];
  assets: RoadAsset[];
  roadScore?: number;
}

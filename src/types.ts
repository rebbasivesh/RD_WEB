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

export type SurveyStatus = 'pending' | 'processing' | 'completed' | 'failed' | 'idle' | 'running' | 'paused';

export interface RoadQualitySegment {
  id: string;
  segmentNumber: number;
  roadScore: number;
  roadGrade: string;
  iri: number;
  coordinates: GpsCoords[];
  color: string;
}

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
  roadQualitySegments?: RoadQualitySegment[];
  detections: Detection[];
  assets: RoadAsset[];
  roadScore?: number;
  averageSpeed?: number;
}

export type UserRole = 'SUPER_ADMIN' | 'SUPERVISOR' | 'OPERATOR' | 'VIEWER' | 'ADMIN';
export type UserStatus = 'active' | 'inactive' | 'locked' | 'pending';

export interface UserItem {
  id: string; // USR-001
  name: string;
  loginId: string;
  email: string;
  phone?: string;
  org: string;
  department?: string;
  scopeRegion?: string;
  createdBy?: string;
  role: UserRole;
  status: UserStatus;
  failedLoginAttempts?: number;
  forcePasswordChange?: boolean;
  lastLogin?: string;
  createdAt?: string;
  permissions?: string[];
}

export interface AuditLogItem {
  id: number;
  actorUserId: string;
  actorLoginId: string;
  action: string;
  targetUserId: string;
  details: string;
  ipAddress: string;
  timestamp: string;
}


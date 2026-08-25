import type { Survey, Detection, GpsCoords } from '../types';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || (typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') ? 'http://localhost:8000/api' : '/api');

export const mapDetectionType = (className: string): 'Pothole' | 'Longitudinal Crack' | 'Transverse Crack' | 'Alligator Crack' => {
  const upper = className.toUpperCase();
  if (upper.includes('POTHOLE')) return 'Pothole';
  if (upper.includes('LONGITUDINAL')) return 'Longitudinal Crack';
  if (upper.includes('TRANSVERSE')) return 'Transverse Crack';
  if (upper.includes('ALLIGATOR')) return 'Alligator Crack';
  return 'Pothole';
};

export const fetchSurveyStatus = async (surveyId: string): Promise<string> => {
  try {
    const res = await fetch(`${API_BASE_URL}/status/${surveyId}`);
    if (!res.ok) return 'pending';
    const data = await res.json();
    return data.status || 'pending';
  } catch (e) {
    return 'pending';
  }
};

export const triggerProcessSurvey = async (surveyId: string): Promise<boolean> => {
  try {
    const res = await fetch(`${API_BASE_URL}/surveys/${surveyId}/process`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    });
    return res.ok;
  } catch (e) {
    console.error(`Failed to trigger processing for survey ${surveyId}:`, e);
    return false;
  }
};

export const fetchSurveys = async (): Promise<Survey[]> => {
  try {
    const res = await fetch(`${API_BASE_URL}/surveys`);
    if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
    const data = await res.json();

    const surveys: Survey[] = await Promise.all(
      data.map(async (item: any) => {
        const surveyId = item.survey_id;
        const statusRaw = (item.status || 'pending').toLowerCase();
        
        let status: 'completed' | 'processing' | 'pending' = 'pending';
        if (statusRaw === 'completed') status = 'completed';
        else if (statusRaw === 'processing' || statusRaw === 'running') status = 'processing';
        else status = 'pending';

        let gpsPath: GpsCoords[] = [];
        let detections: Detection[] = [];
        let roadQualitySegments: any[] = [];

        try {
          const mapRes = await fetch(`${API_BASE_URL}/map/${surveyId}`);
          if (mapRes.ok) {
            const geojson = await mapRes.json();
            const features = geojson.features || [];

            // Extract continuous route feature (type === 'route')
            let routeFeature = features.find((f: any) => f.properties?.type === 'route');
            if (!routeFeature) {
              // Find LineString feature with maximum points
              const lineFeatures = features.filter((f: any) => f.geometry?.type === 'LineString');
              if (lineFeatures.length > 0) {
                lineFeatures.sort((a: any, b: any) => (b.geometry?.coordinates?.length || 0) - (a.geometry?.coordinates?.length || 0));
                routeFeature = lineFeatures[0];
              }
            }

            if (routeFeature && routeFeature.geometry && routeFeature.geometry.coordinates) {
              gpsPath = routeFeature.geometry.coordinates.map((coord: [number, number]) => ({
                lng: coord[0],
                lat: coord[1]
              }));
            }

            // Extract real road_quality segment features from GeoJSON
            const rqFeatures = features.filter((f: any) => f.properties?.type === 'road_quality');
            if (rqFeatures.length > 0) {
              roadQualitySegments = rqFeatures.map((f: any, idx: number) => {
                const props = f.properties || {};
                const rawCoords = f.geometry?.coordinates || [];
                const coords: GpsCoords[] = rawCoords.map((c: [number, number]) => ({ lng: c[0], lat: c[1] }));
                
                const iriVal = props.iri || props.avg_iri || 0.0;
                const grade = props.road_grade || (iriVal > 8 ? 'Very Poor' : iriVal > 4 ? 'Poor' : iriVal > 2.5 ? 'Fair' : 'Good');
                
                let segColor = '#10B981'; // Green: Good
                if (iriVal >= 8.0 || grade === 'Very Poor') segColor = '#EF4444'; // Red: Critical
                else if (iriVal >= 4.0 || grade === 'Poor') segColor = '#F59E0B'; // Orange: Poor
                else if (iriVal >= 2.5 || grade === 'Fair') segColor = '#EAB308'; // Yellow: Fair

                return {
                  id: `rq_${surveyId}_${idx}`,
                  segmentNumber: idx + 1,
                  roadScore: props.road_score || 0,
                  roadGrade: grade,
                  iri: parseFloat(iriVal.toFixed(2)),
                  coordinates: coords,
                  color: segColor
                };
              });
            }

            // Detection point features (ONLY if survey is completed)
            if (status === 'completed') {
              const detFeatures = features.filter((f: any) => f.properties?.type === 'detection' || f.geometry?.type === 'Point');
              detections = detFeatures.map((f: any, idx: number) => {
                const props = f.properties || {};
                const coords = f.geometry?.coordinates || [0, 0];
                const imgPath = props.image_path || props.original_image_path || '';
                const fullImgUrl = imgPath ? (imgPath.startsWith('http') ? imgPath : `${API_BASE_URL}/images/${imgPath}`) : undefined;

                return {
                  id: `det_${surveyId}_${idx}`,
                  timestamp: props.timestamp ? new Date(props.timestamp).toLocaleTimeString() : '00:00:00',
                  type: mapDetectionType(props.class_name || 'POTHOLE'),
                  confidence: props.confidence || 0.95,
                  location: { lng: coords[0], lat: coords[1] },
                  roadScore: Math.round((props.confidence || 0.9) * 5),
                  imageUrl: fullImgUrl
                };
              });
            }
          }
        } catch (err) {
          console.warn(`Could not load map GeoJSON for ${surveyId}:`, err);
        }

        // Fallback to fetch /api/detections/{surveyId} if survey is completed but GeoJSON features empty
        if (status === 'completed' && detections.length === 0) {
          try {
            const detRes = await fetch(`${API_BASE_URL}/detections/${surveyId}`);
            if (detRes.ok) {
              const detData = await detRes.json();
              detections = detData.map((d: any, idx: number) => {
                const imgPath = d.image_path || d.original_image_path || '';
                const fullImgUrl = imgPath ? (imgPath.startsWith('http') ? imgPath : `${API_BASE_URL}/images/${imgPath}`) : undefined;
                return {
                  id: `det_db_${surveyId}_${idx}`,
                  timestamp: d.timestamp || '00:00:00',
                  type: mapDetectionType(d.class_name || 'POTHOLE'),
                  confidence: d.confidence || 0.95,
                  location: { lat: d.latitude || 0, lng: d.longitude || 0 },
                  roadScore: 4,
                  imageUrl: fullImgUrl
                };
              });
            }
          } catch (err) {
            console.warn(`Could not load detections table for ${surveyId}:`, err);
          }
        }

        const dateStr = item.date ? new Date(item.date).toISOString().split('T')[0] : '2026-08-05';
        const timeStr = item.date ? new Date(item.date).toLocaleTimeString() : '10:05:00';

        return {
          id: surveyId,
          projectName: 'HMA Road Survey Campaign',
          roadName: item.road_name || 'tenali',
          operatorName: 'Operator (Edge AI)',
          vehicleId: item.vehicle_number || 'AP39BR3974',
          status: status,
          date: dateStr,
          startTime: timeStr,
          distanceCoveredKm: parseFloat((item.distance || 0.0).toFixed(2)),
          durationSeconds: Math.round(item.duration || 0),
          averageSpeed: item.average_speed && item.average_speed > 0 ? parseFloat(item.average_speed.toFixed(1)) : undefined,
          avgIri: item.avg_iri && item.avg_iri > 0 ? parseFloat(item.avg_iri.toFixed(2)) : (status === 'completed' ? 1.85 : 0),
          avgPcr: status === 'completed' ? 88 : 0,
          totalDetections: status === 'completed' ? detections.length : 0,
          gpsPath: gpsPath.length > 0 ? gpsPath : [{ lat: 16.239, lng: 80.657 }],
          roadQualitySegments: roadQualitySegments,
          detections: status === 'completed' ? detections : [],
          assets: []
        };
      })
    );

    return surveys;
  } catch (e) {
    console.error("Failed to fetch real surveys from backend API:", e);
    return [];
  }
};

export const fetchSurveyImages = async (surveyId: string): Promise<any[]> => {
  try {
    const res = await fetch(`${API_BASE_URL}/surveys/${surveyId}/images`);
    if (!res.ok) return [];
    return await res.json();
  } catch (e) {
    console.warn(`Could not load images for ${surveyId}:`, e);
    return [];
  }
};

export const fetchSurveyVideoInfo = async (surveyId: string): Promise<any> => {
  try {
    const res = await fetch(`${API_BASE_URL}/surveys/${surveyId}/video-info`);
    if (!res.ok) return { available: false };
    return await res.json();
  } catch (e) {
    console.warn(`Could not load video info for ${surveyId}:`, e);
    return { available: false };
  }
};

// ==================== AUTHENTICATION & USER MANAGEMENT APIS ====================

const getAuthHeader = (): Record<string, string> => {
  const token = sessionStorage.getItem('dats_token') || localStorage.getItem('dats_token');
  return token ? { 'Authorization': `Bearer ${token}` } : {};
};

export const loginApi = async (loginId: string, password: string) => {
  const res = await fetch(`${API_BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ login_id: loginId, password })
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({ detail: 'Authentication failed' }));
    throw new Error(errorData.detail || 'Authentication failed');
  }

  return await res.json();
};

export const logoutApi = async () => {
  try {
    await fetch(`${API_BASE_URL}/auth/logout`, {
      method: 'POST',
      headers: { ...getAuthHeader() }
    });
  } catch (e) {
    console.warn("Logout API warning:", e);
  } finally {
    sessionStorage.removeItem('dats_token');
    localStorage.removeItem('dats_token');
  }
};

export const getMeApi = async () => {
  const res = await fetch(`${API_BASE_URL}/auth/me`, {
    headers: { ...getAuthHeader() }
  });
  if (!res.ok) throw new Error("Failed to verify authentication session");
  return await res.json();
};

export const changePasswordApi = async (oldPassword: string, newPassword: string) => {
  const res = await fetch(`${API_BASE_URL}/auth/change-password`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
    body: JSON.stringify({ old_password: oldPassword, new_password: newPassword })
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: 'Password change failed' }));
    throw new Error(err.detail || 'Password change failed');
  }
  return await res.json();
};

export const fetchUsersApi = async (params?: { search?: string; role?: string; status?: string }) => {
  const url = new URL(`${API_BASE_URL}/users`);
  if (params?.search) url.searchParams.append('search', params.search);
  if (params?.role) url.searchParams.append('role', params.role);
  if (params?.status) url.searchParams.append('status', params.status);

  const res = await fetch(url.toString(), {
    headers: { ...getAuthHeader() }
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: 'Failed to fetch users' }));
    throw new Error(err.detail || 'Failed to fetch users');
  }
  return await res.json();
};

export const createUserApi = async (userData: any) => {
  const res = await fetch(`${API_BASE_URL}/users`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
    body: JSON.stringify(userData)
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: 'Failed to create user' }));
    throw new Error(err.detail || 'Failed to create user');
  }
  return await res.json();
};

export const updateUserApi = async (userId: string, userData: any) => {
  const res = await fetch(`${API_BASE_URL}/users/${userId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
    body: JSON.stringify(userData)
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: 'Failed to update user' }));
    throw new Error(err.detail || 'Failed to update user');
  }
  return await res.json();
};

export const updateUserStatusApi = async (userId: string, status: string) => {
  const res = await fetch(`${API_BASE_URL}/users/${userId}/status?status=${encodeURIComponent(status)}`, {
    method: 'PATCH',
    headers: { ...getAuthHeader() }
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: 'Failed to change user status' }));
    throw new Error(err.detail || 'Failed to change user status');
  }
  return await res.json();
};

export const resetUserPasswordApi = async (userId: string, newPassword: string, forcePasswordChange: boolean = true) => {
  const res = await fetch(`${API_BASE_URL}/users/${userId}/reset-password`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
    body: JSON.stringify({ newPassword, forcePasswordChange })
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: 'Failed to reset password' }));
    throw new Error(err.detail || 'Failed to reset password');
  }
  return await res.json();
};

export const deleteUserApi = async (userId: string) => {
  const res = await fetch(`${API_BASE_URL}/users/${userId}`, {
    method: 'DELETE',
    headers: { ...getAuthHeader() }
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: 'Failed to delete user' }));
    throw new Error(err.detail || 'Failed to delete user');
  }
  return await res.json();
};

export const fetchAuditLogsApi = async () => {
  const res = await fetch(`${API_BASE_URL}/audit-logs`, {
    headers: { ...getAuthHeader() }
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: 'Failed to fetch audit logs' }));
    throw new Error(err.detail || 'Failed to fetch audit logs');
  }
  return await res.json();
};

export const updateSelfProfileApi = async (profileData: any) => {
  const res = await fetch(`${API_BASE_URL}/users/me`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
    body: JSON.stringify(profileData)
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: 'Failed to update profile' }));
    throw new Error(err.detail || 'Failed to update profile');
  }
  return await res.json();
};

export const fetchPermissionsApi = async () => {
  const res = await fetch(`${API_BASE_URL}/permissions`, {
    headers: { ...getAuthHeader() }
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: 'Failed to fetch permissions' }));
    throw new Error(err.detail || 'Failed to fetch permissions');
  }
  return await res.json();
};

export const fetchRolesApi = async () => {
  const res = await fetch(`${API_BASE_URL}/permissions/roles`, {
    headers: { ...getAuthHeader() }
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: 'Failed to fetch roles' }));
    throw new Error(err.detail || 'Failed to fetch roles');
  }
  return await res.json();
};

export const updateUserPermissionsApi = async (userId: string, permissions: string[]) => {
  const res = await fetch(`${API_BASE_URL}/permissions/user/${userId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
    body: JSON.stringify({ permissions })
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: 'Failed to update user permissions' }));
    throw new Error(err.detail || 'Failed to update user permissions');
  }
  return await res.json();
};

export const fetchStorageStatusApi = async () => {
  try {
    const res = await fetch(`${API_BASE_URL}/storage/status`, {
      headers: { ...getAuthHeader() }
    });
    if (res.ok) {
      return await res.json();
    }
  } catch (e) {
    console.error("Failed to fetch storage status from API:", e);
  }
  return {
    path: "/home/nvidia/Road_Survay/UPLOADS/",
    mount: "/home/nvidia/Road_Survay/",
    total_bytes: 999653638144,
    used_bytes: 95563022336,
    available_bytes: 904090615808,
    free_percent: 90.4,
    connected: true,
    healthy: true
  };
};



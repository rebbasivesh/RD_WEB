import React, { useState, useEffect } from 'react';
import { MapComponent } from './MapComponent';
import {
  Truck,
  User,
  Compass,
  BatteryCharging,
  Fuel,
  Activity,
  Calendar,
  AlertCircle,
  CheckCircle,
  Navigation
} from 'lucide-react';
import type { GpsCoords } from '../types';

interface Vehicle {
  id: string;
  driver: string;
  road: string;
  speed: number;
  todayDist: number;
  status: 'moving' | 'idle' | 'offline';
  fuel: number;
  battery: number;
  gps: GpsCoords;
}

const mockVehicles: Vehicle[] = [
  { id: 'AP-07-TJ-1044', driver: 'Sivesh Kumar', road: 'NH-16 Bypass (Vijayawada bound)', speed: 52, todayDist: 142.4, status: 'moving', fuel: 74, battery: 98, gps: { lat: 16.4300, lng: 80.5600 } },
  { id: 'AP-07-TK-9023', driver: 'Ramesh Reddy', road: 'State Highway 2 (Tenali Sec)', speed: 0, todayDist: 88.2, status: 'idle', fuel: 52, battery: 94, gps: { lat: 16.2395, lng: 80.6450 } },
  { id: 'AP-09-TL-4812', driver: 'Prasad M.', road: 'NH-16 (Guntur Section)', speed: 65, todayDist: 210.5, status: 'moving', fuel: 89, battery: 100, gps: { lat: 16.3100, lng: 80.6120 } },
  { id: 'AP-08-TX-0941', driver: 'Anil Naidu', road: 'MDR-20 (Mangalagiri road)', speed: 38, todayDist: 45.0, status: 'moving', fuel: 42, battery: 89, gps: { lat: 16.4820, lng: 80.6100 } },
  { id: 'AP-07-TZ-3844', driver: 'Vikram Singh', road: 'Out of Service / Garage', speed: 0, todayDist: 0.0, status: 'offline', fuel: 15, battery: 45, gps: { lat: 16.5062, lng: 80.6480 } }
];

export const LiveVehiclesView: React.FC = () => {
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle>(mockVehicles[0]);
  const [vehicles, setVehicles] = useState<Vehicle[]>(mockVehicles);

  // Live Speed Simulation
  useEffect(() => {
    const interval = setInterval(() => {
      setVehicles(prev => prev.map(v => {
        if (v.status === 'moving') {
          const deltaSpeed = Math.floor(Math.random() * 7) - 3;
          return {
            ...v,
            speed: Math.max(30, Math.min(80, v.speed + deltaSpeed)),
            todayDist: parseFloat((v.todayDist + 0.02).toFixed(2))
          };
        }
        return v;
      }));
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  // Keep selected vehicle stats updated
  useEffect(() => {
    const current = vehicles.find(v => v.id === selectedVehicle.id);
    if (current) {
      setSelectedVehicle(current);
    }
  }, [vehicles]);

  const mapPath: GpsCoords[] = vehicles.map(v => v.gps);

  return (
    <div className="space-y-6 max-w-[1600px] mx-auto p-4 select-none">
      {/* Header Title */}
      <div className="bg-slate-900 border border-slate-800 p-5 rounded-xl">
        <span className="text-[9px] text-slate-500 font-bold uppercase tracking-widest block mb-0.5">Fleet operations</span>
        <h2 className="text-white text-md font-bold uppercase tracking-wider">Live Vehicle Tracking Dashboard</h2>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left column: Vehicles list */}
        <div className="lg:col-span-4 space-y-4 max-h-[600px] overflow-y-auto pr-1">
          {vehicles.map((v) => {
            const active = selectedVehicle.id === v.id;
            return (
              <div
                key={v.id}
                onClick={() => setSelectedVehicle(v)}
                className={`p-4 rounded-xl border cursor-pointer transition-all ${
                  active 
                    ? 'bg-[#2563EB]/8 border-[#2563EB]' 
                    : 'bg-slate-900 border-slate-800 hover:border-slate-700'
                }`}
              >
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${active ? 'bg-primary/20 text-primary-light' : 'bg-slate-950/60 text-slate-500'}`}>
                      <Truck className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="text-white font-mono font-bold text-xs">{v.id}</h4>
                      <p className="text-[10px] text-slate-400 font-sans mt-0.5">{v.driver}</p>
                    </div>
                  </div>
                  <span className={`text-[8px] px-2 py-0.5 rounded font-bold uppercase ${
                    v.status === 'moving' ? 'bg-emerald-500/10 text-emerald-400' :
                    v.status === 'idle' ? 'bg-amber-500/10 text-amber-400' : 'bg-slate-950/60 text-slate-500'
                  }`}>
                    {v.status}
                  </span>
                </div>

                <div className="mt-4 grid grid-cols-3 gap-2 text-center text-[10px] font-mono text-slate-400 border-t border-slate-800/60 pt-3">
                  <div>
                    <span className="text-[8px] text-slate-600 uppercase block font-bold">Speed</span>
                    <span className="text-slate-200 font-bold">{v.speed} km/h</span>
                  </div>
                  <div>
                    <span className="text-[8px] text-slate-650 uppercase block font-bold">Today</span>
                    <span className="text-slate-200 font-bold">{v.todayDist} km</span>
                  </div>
                  <div>
                    <span className="text-[8px] text-slate-650 uppercase block font-bold">Fuel</span>
                    <span className="text-slate-200 font-bold">{v.fuel}%</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Right column: Map & Telemetry view */}
        <div className="lg:col-span-8 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
            {/* Live Leaflet Map */}
            <div className="md:col-span-8 bg-slate-900 border border-slate-800 rounded-xl overflow-hidden relative h-[380px]">
              <MapComponent 
                gpsPath={mapPath}
                detections={[]}
                currentLocation={selectedVehicle.gps}
              />
              <div className="absolute top-4 left-4 bg-slate-950/90 border border-slate-800 px-3 py-1.5 rounded-lg z-10 text-[9px] font-mono text-slate-300">
                🛰️ ACTIVE GPS TRACK: {selectedVehicle.gps.lat.toFixed(5)}, {selectedVehicle.gps.lng.toFixed(5)}
              </div>
            </div>

            {/* Selected Vehicle Telemetry */}
            <div className="md:col-span-4 bg-slate-900 border border-slate-800 p-5 rounded-xl space-y-5 flex flex-col justify-between">
              <div>
                <span className="text-[8px] font-bold text-slate-500 uppercase tracking-widest block">Operational Telemetry</span>
                <h3 className="text-white text-xs font-bold uppercase mt-1 tracking-wider">{selectedVehicle.id}</h3>
              </div>

              <div className="space-y-3.5 text-[11px] font-mono">
                <div className="flex justify-between items-start">
                  <span className="text-slate-500">Current Corridor:</span>
                  <span className="text-slate-200 font-sans text-right max-w-[120px] truncate">{selectedVehicle.road}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Active Driver:</span>
                  <span className="text-slate-200 font-sans">{selectedVehicle.driver}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-500">Signal Integrity:</span>
                  <span className="text-emerald-400 font-bold flex items-center gap-1"><Activity className="w-3.5 h-3.5 text-emerald-400" /> EXCELLENT</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-500">Fuel Level:</span>
                  <span className="text-slate-200 flex items-center gap-1.5"><Fuel className="w-3.5 h-3.5 text-slate-500" /> {selectedVehicle.fuel}%</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-500">Battery Charge:</span>
                  <span className="text-slate-200 flex items-center gap-1.5"><BatteryCharging className="w-3.5 h-3.5 text-slate-500" /> {selectedVehicle.battery}%</span>
                </div>
              </div>

              <button
                onClick={() => alert(`Opening raw NMEA diagnostic console stream for ${selectedVehicle.id}...`)}
                className="w-full bg-slate-950/60 hover:bg-slate-800 border border-slate-800 text-primary-light hover:text-white py-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5"
              >
                <Compass className="w-4 h-4" />
                NMEA DIAGNOSTIC STREAM
              </button>
            </div>
          </div>

          {/* Historical Trips Timeline */}
          <div className="bg-slate-900 border border-slate-800 p-5 rounded-xl">
            <h4 className="text-white text-xs font-bold uppercase mb-4 tracking-wider">Operational Activity logs</h4>
            <div className="space-y-4">
              {[
                { time: '11:42:05', alert: 'Inspection campaign completed: NH-16 Sector 23 (35.0 KM logged)', type: 'success' },
                { time: '09:12:44', alert: 'Vehicle logged in at Tenali Corridor Base station', type: 'info' },
                { time: '08:30:12', alert: 'Daily camera calibration and system checks: OK', type: 'info' }
              ].map((log, idx) => (
                <div key={idx} className="flex gap-3 text-[11px] font-mono">
                  <span className="text-slate-500">{log.time}</span>
                  <div className="flex items-center gap-1.5">
                    {log.type === 'success' ? (
                      <CheckCircle className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                    ) : (
                      <Navigation className="w-3.5 h-3.5 text-slate-650 shrink-0" />
                    )}
                    <span className="text-slate-350">{log.alert}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
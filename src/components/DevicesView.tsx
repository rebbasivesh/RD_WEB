import React, { useState } from 'react';
import {
  Cpu,
  RefreshCw,
  HardDrive,
  Settings2,
  Terminal,
  Activity,
  CheckCircle,
  AlertTriangle,
  Wifi
} from 'lucide-react';
import { mockDevices } from '../mockData';

export const DevicesView: React.FC = () => {
  const [devices, setDevices] = useState(mockDevices);
  const [selectedDevice, setSelectedDevice] = useState(mockDevices[0]);
  const [cameraRes, setCameraRes] = useState('1080p');
  const [fps, setFps] = useState('30');
  const [syncFreq, setSyncFreq] = useState('instant');

  const handleReboot = (id: string) => {
    alert(`Sending secure SSH SIGTERM signal to node ${id}... System reboot scheduled in 5 seconds.`);
  };

  const handleUpdateFirmware = (id: string) => {
    alert(`Checking DATS package repository... Firmware at latest stable build (v3.2.0) on node ${id}.`);
  };

  const saveConfig = () => {
    alert('Writing config JSON overlay directly to Edge disk via channel... Configuration sync completed.');
  };

  return (
    <div className="space-y-6 max-w-[1600px] mx-auto p-4 select-none">
      {/* Header */}
      <div className="bg-slate-900 border border-slate-800 p-5 rounded-xl">
        <span className="text-[9px] text-slate-500 font-bold uppercase tracking-widest block mb-0.5">Hardware Management</span>
        <h2 className="text-white text-md font-bold uppercase tracking-wider">Edge Nodes Infrastructure</h2>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Devices list */}
        <div className="lg:col-span-4 space-y-4">
          {devices.map((dev) => {
            const active = selectedDevice.id === dev.id;
            return (
              <div
                key={dev.id}
                onClick={() => setSelectedDevice(dev)}
                className={`p-5 rounded-xl border cursor-pointer transition-all ${
                  active 
                    ? 'bg-[#2563EB]/8 border-[#2563EB]' 
                    : 'bg-slate-900 border-slate-800 hover:border-slate-700'
                }`}
              >
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${active ? 'bg-primary/25 text-primary-light' : 'bg-slate-950/60 text-slate-500'}`}>
                      <Cpu className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="text-white font-mono font-bold text-xs">{dev.name}</h4>
                      <span className="text-[9px] text-slate-500 font-mono mt-0.5 block">{dev.ipAddress}</span>
                    </div>
                  </div>
                  <span className={`text-[8px] px-2 py-0.5 rounded font-bold uppercase ${
                    dev.isOnline ? 'bg-emerald-500/10 text-emerald-400' : 'bg-slate-950/60 text-slate-500'
                  }`}>
                    {dev.isOnline ? 'Online' : 'Offline'}
                  </span>
                </div>

                {dev.isOnline && (
                  <div className="mt-4 grid grid-cols-3 gap-2 text-center text-[10px] font-mono text-slate-400 border-t border-slate-800/60 pt-3">
                    <div>
                      <span className="text-[8px] text-slate-605 uppercase block font-bold">CPU load</span>
                      <span className="text-slate-205 font-bold">{dev.health.cpuUsage.toFixed(0)}%</span>
                    </div>
                    <div>
                      <span className="text-[8px] text-slate-650 uppercase block font-bold">GPU temp</span>
                      <span className="text-slate-205 font-bold">{dev.health.temperature.toFixed(0)}°C</span>
                    </div>
                    <div>
                      <span className="text-[8px] text-slate-650 uppercase block font-bold">Disk Space</span>
                      <span className="text-slate-205 font-bold">{dev.health.storageUsed.toFixed(0)} GB</span>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Right configuration panel */}
        <div className="lg:col-span-8 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Device parameters */}
            <div className="bg-slate-900 border border-slate-800 p-5 rounded-xl space-y-4 flex flex-col justify-between">
              <div>
                <span className="text-[9px] font-bold text-slate-500 uppercase block tracking-wider mb-1">System parameters</span>
                <h3 className="text-white text-xs font-bold uppercase font-mono">{selectedDevice.name} Diagnostic</h3>
              </div>

              {selectedDevice.isOnline ? (
                <div className="space-y-3.5 text-[11px] font-mono text-slate-400">
                  <div className="flex justify-between">
                    <span>Camera Status:</span>
                    <span className="text-emerald-400 font-bold flex items-center gap-1"><CheckCircle className="w-3.5 h-3.5" /> CONNECTED</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Docker Container:</span>
                    <span className="text-emerald-400 font-bold flex items-center gap-1"><CheckCircle className="w-3.5 h-3.5" /> RUNNING</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Network Latency:</span>
                    <span className="text-emerald-400 font-bold flex items-center gap-1"><Wifi className="w-3.5 h-3.5" /> 14ms (5G)</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Storage capacity:</span>
                    <span>{selectedDevice.health.storageUsed} / {selectedDevice.health.storageTotal} GB Used</span>
                  </div>
                </div>
              ) : (
                <div className="p-4 bg-slate-950/40 border border-slate-850 rounded-lg flex items-center gap-2.5 text-xs text-slate-400 font-mono">
                  <AlertTriangle className="w-5 h-5 text-slate-650 shrink-0" />
                  <span>Node offline. Diagnostics unavailable. Verify power cord connectivity.</span>
                </div>
              )}

              <div className="flex gap-2">
                <button
                  disabled={!selectedDevice.isOnline}
                  onClick={() => handleReboot(selectedDevice.id)}
                  className="flex-1 bg-slate-800 hover:bg-slate-750 border border-slate-700/50 disabled:opacity-40 disabled:hover:bg-slate-800 text-slate-300 text-[10px] font-bold uppercase py-2 rounded-lg transition-colors flex items-center justify-center gap-1"
                >
                  <RefreshCw className="w-3.5 h-3.5" /> REBOOT NODE
                </button>
                <button
                  disabled={!selectedDevice.isOnline}
                  onClick={() => handleUpdateFirmware(selectedDevice.id)}
                  className="flex-1 bg-slate-800 hover:bg-slate-750 border border-slate-700/50 disabled:opacity-40 disabled:hover:bg-slate-800 text-[#38BDF8] text-[10px] font-bold uppercase py-2 rounded-lg transition-colors flex items-center justify-center gap-1"
                >
                  <Settings2 className="w-3.5 h-3.5" /> UPDATE FIRMWARE
                </button>
              </div>
            </div>

            {/* Edge config profile */}
            <div className="bg-slate-900 border border-slate-800 p-5 rounded-xl space-y-4">
              <h4 className="text-white text-xs font-bold uppercase tracking-wider">Device Configuration Override</h4>
              
              <div className="space-y-3.5 text-xs">
                <div className="space-y-1">
                  <span className="text-[9px] text-slate-500 font-bold uppercase tracking-widest block font-mono">Camera Recording Resolution</span>
                  <select
                    value={cameraRes}
                    onChange={(e) => setCameraRes(e.target.value)}
                    className="w-full bg-slate-950/60 border border-slate-850 text-slate-300 text-xs px-2.5 py-1.5 rounded-lg focus:outline-none"
                  >
                    <option value="1080p">1080p FHD (IMX477)</option>
                    <option value="720p">720p HD (High FPS Mode)</option>
                    <option value="4k">4K UHD (High Storage Load)</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <span className="text-[9px] text-slate-505 font-bold uppercase tracking-widest block font-mono">Frame Rate Capture Limit</span>
                  <select
                    value={fps}
                    onChange={(e) => setFps(e.target.value)}
                    className="w-full bg-slate-950/60 border border-slate-850 text-slate-300 text-xs px-2.5 py-1.5 rounded-lg focus:outline-none"
                  >
                    <option value="15">15 Frames Per Second</option>
                    <option value="30">30 Frames Per Second</option>
                    <option value="60">60 Frames Per Second</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <span className="text-[9px] text-slate-505 font-bold uppercase tracking-widest block font-mono">Telemetry Sync frequency</span>
                  <select
                    value={syncFreq}
                    onChange={(e) => setSyncFreq(e.target.value)}
                    className="w-full bg-slate-950/60 border border-slate-850 text-slate-300 text-xs px-2.5 py-1.5 rounded-lg focus:outline-none"
                  >
                    <option value="instant">Instant Realtime stream</option>
                    <option value="batch">Batch upload on Wifi sync</option>
                    <option value="daily">Daily report export package</option>
                  </select>
                </div>
              </div>

              <button
                onClick={saveConfig}
                className="w-full bg-primary hover:bg-primary-dark text-white text-xs font-bold py-2 rounded-lg transition-colors flex items-center justify-center gap-1.5"
              >
                <HardDrive className="w-4 h-4" />
                SAVE OVERLAY CONFIGURATION
              </button>
            </div>
          </div>

          {/* Terminal log console */}
          <div className="bg-slate-900 border border-slate-800 p-5 rounded-xl">
            <h4 className="text-white text-xs font-bold uppercase mb-4 tracking-wider flex items-center gap-1.5">
              <Terminal className="w-4 h-4 text-slate-400" />
              Node Kernel Logs Console
            </h4>
            <div className="bg-slate-950 p-4 rounded-lg font-mono text-[10px] text-emerald-500 h-36 overflow-y-auto space-y-1.5">
              <div>[2026-08-03 11:32:04] dats-node-agent: starting pipeline capture on /dev/video0</div>
              <div>[2026-08-03 11:32:05] dats-node-agent: calibrated Sony IMX477 - focal settings locked</div>
              <div>[2026-08-03 11:32:07] dats-node-agent: GPS connection locked. satellites: 14</div>
              <div>[2026-08-03 11:32:10] dats-node-agent: inference thread initialized successfully. (model: yolov8)</div>
              <div>[2026-08-03 11:35:12] dats-node-agent: heartbeat sent - network ping: 12ms</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
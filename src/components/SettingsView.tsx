import React, { useState } from 'react';
import { 
  WifiIcon, 
  CpuChipIcon, 
  VideoCameraIcon, 
  CircleStackIcon
} from '@heroicons/react/24/outline';

export const SettingsView: React.FC = () => {
  const [ssid, setSsid] = useState('DATS_PI5_HOTSPOT');
  const [ipAddress, setIpAddress] = useState('192.168.4.1');
  const [resolution, setResolution] = useState('1920x1080');
  const [confidence, setConfidence] = useState(75);
  const [autoUpload, setAutoUpload] = useState(true);

  const handleSave = () => {
    alert('System settings synced to active Edge AI device.');
  };

  const handleClearCache = () => {
    alert('Cache memory successfully cleared.');
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6 p-4 select-none">
      
      {/* Header */}
      <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl">
        <span className="text-[8px] text-slate-500 font-bold uppercase tracking-widest block mb-0.5">Device settings</span>
        <h3 className="text-white font-bold text-xs uppercase tracking-wider">System configurations</h3>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Connection settings */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
          <div className="flex items-center gap-3">
            <WifiIcon className="w-5 h-5 text-primary-light" />
            <div>
              <h4 className="text-white font-bold text-xs uppercase tracking-wider">Edge Wifi parameters</h4>
              <p className="text-[8.5px] text-slate-500">Wireless node pairing credentials</p>
            </div>
          </div>
          <div className="border-t border-slate-800/80 my-2"></div>
          
          <div className="space-y-3.5 text-[10px] font-mono">
            <div className="flex flex-col gap-1.5">
              <label className="text-slate-500 font-bold uppercase">SSID NAME</label>
              <input 
                type="text" 
                value={ssid}
                onChange={(e) => setSsid(e.target.value)}
                className="bg-slate-950/60 border border-slate-800 rounded-lg px-3.5 py-2 text-xs text-white outline-none focus:border-primary/50"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-slate-500 font-bold uppercase">GATEWAY IP</label>
              <input 
                type="text" 
                value={ipAddress}
                onChange={(e) => setIpAddress(e.target.value)}
                className="bg-slate-950/60 border border-slate-800 rounded-lg px-3.5 py-2 text-xs text-white outline-none focus:border-primary/50"
              />
            </div>
          </div>
        </div>

        {/* AI Parameters */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
          <div className="flex items-center gap-3">
            <CpuChipIcon className="w-5 h-5 text-accent" />
            <div>
              <h4 className="text-white font-bold text-xs uppercase tracking-wider">Inference threshold</h4>
              <p className="text-[8.5px] text-slate-500">Adjust parameters for AI distress logs</p>
            </div>
          </div>
          <div className="border-t border-slate-800/80 my-2"></div>

          <div className="space-y-4 text-[10px] font-mono">
            <div className="flex flex-col gap-2">
              <div className="flex justify-between items-center">
                <label className="text-slate-500 font-bold uppercase">MIN CONFIDENCE</label>
                <span className="text-xs font-bold text-accent">{confidence}%</span>
              </div>
              <input 
                type="range" 
                min="50" 
                max="95"
                value={confidence}
                onChange={(e) => setConfidence(parseInt(e.target.value))}
                className="w-full h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-primary"
              />
            </div>
            
            <div className="flex items-center justify-between bg-slate-950/40 p-3 rounded-lg border border-slate-800/80 font-sans">
              <div>
                <span className="block text-xs font-semibold text-slate-200">Sync auto-upload</span>
                <span className="block text-[8.5px] text-slate-500">Upload metadata automatically when internet is online</span>
              </div>
              <input 
                type="checkbox" 
                checked={autoUpload}
                onChange={(e) => setAutoUpload(e.target.checked)}
                className="w-3.5 h-3.5 rounded text-primary focus:ring-primary bg-slate-950 border-slate-800"
              />
            </div>
          </div>
        </div>

        {/* Video options */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
          <div className="flex items-center gap-3">
            <VideoCameraIcon className="w-5 h-5 text-emerald-400" />
            <div>
              <h4 className="text-white font-bold text-xs uppercase tracking-wider">Recording configuration</h4>
              <p className="text-[8.5px] text-slate-500">Video quality parameters of sensor</p>
            </div>
          </div>
          <div className="border-t border-slate-800/80 my-2"></div>

          <div className="flex flex-col gap-1.5 text-[10px] font-mono">
            <label className="text-slate-500 font-bold uppercase">Video Quality</label>
            <select 
              value={resolution}
              onChange={(e) => setResolution(e.target.value)}
              className="bg-slate-950/60 border border-slate-800 rounded-lg px-3.5 py-2 text-xs text-white outline-none focus:border-primary/50"
            >
              <option value="1920x1080">Full HD (1920 x 1080 @ 15fps)</option>
              <option value="1280x720">HD (1280 x 720 @ 30fps)</option>
              <option value="640x480">Standard SD (640 x 480 @ 60fps)</option>
            </select>
          </div>
        </div>

        {/* Cache controls */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
          <div className="flex items-center gap-3">
            <CircleStackIcon className="w-5 h-5 text-red-400" />
            <div>
              <h4 className="text-white font-bold text-xs uppercase tracking-wider">Disk storage cache</h4>
              <p className="text-[8.5px] text-slate-500">Examine cache and run clean operations</p>
            </div>
          </div>
          <div className="border-t border-slate-800/80 my-2"></div>

          <div className="flex items-center justify-between text-[11px]">
            <div>
              <span className="block font-semibold text-slate-200">Local cache footprint</span>
              <span className="block text-[8.5px] text-slate-500 font-mono">142.4 MB allocated</span>
            </div>
            <button 
              onClick={handleClearCache}
              className="bg-red-500/10 hover:bg-red-500/20 border border-red-500/15 text-red-400 font-bold text-[9px] uppercase px-4 py-2.5 rounded transition-all font-sans"
            >
              Clear Cache
            </button>
          </div>
        </div>

      </div>

      <div className="flex justify-end pt-4 border-t border-slate-800/50">
        <button 
          onClick={handleSave}
          className="bg-primary hover:bg-primary-dark text-white font-bold text-xs uppercase px-5 py-2.5 rounded transition-all shadow-glow"
        >
          Save settings configuration
        </button>
      </div>

    </div>
  );
};

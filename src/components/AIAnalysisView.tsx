import React, { useState } from 'react';
import {
  Cpu,
  Play,
  Settings,
  Eye,
  Sliders,
  Maximize2,
  FileDown,
  Activity,
  CheckCircle,
  AlertCircle
} from 'lucide-react';

interface DetectionBox {
  label: 'Pothole' | 'Alligator Crack' | 'Longitudinal Crack' | 'Transverse Crack';
  x: number;
  y: number;
  width: number;
  height: number;
  confidence: number;
}

export const AIAnalysisView: React.FC = () => {
  const [modelType, setModelType] = useState<'distress' | 'asset' | 'width'>('distress');
  const [confidenceThreshold, setConfidenceThreshold] = useState(0.85);
  const [activeBoxes, setActiveBoxes] = useState<Record<string, boolean>>({
    Pothole: true,
    'Alligator Crack': true,
    'Longitudinal Crack': true,
    'Transverse Crack': true
  });

  const boxes: DetectionBox[] = [
    { label: 'Pothole', x: 120, y: 150, width: 80, height: 50, confidence: 0.96 },
    { label: 'Alligator Crack', x: 260, y: 220, width: 140, height: 90, confidence: 0.91 },
    { label: 'Longitudinal Crack', x: 80, y: 80, width: 30, height: 180, confidence: 0.88 },
    { label: 'Pothole', x: 420, y: 180, width: 60, height: 40, confidence: 0.94 }
  ];

  const filteredBoxes = boxes.filter(b => b.confidence >= confidenceThreshold && activeBoxes[b.label]);

  return (
    <div className="space-y-6 max-w-[1600px] mx-auto p-4 select-none">
      {/* Header */}
      <div className="bg-slate-900 border border-slate-800 p-5 rounded-xl">
        <span className="text-[9px] text-slate-500 font-bold uppercase tracking-widest block mb-0.5">AI Engine</span>
        <h2 className="text-white text-md font-bold uppercase tracking-wider">Edge Distress Recognition Sandbox</h2>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Main Canvas View */}
        <div className="lg:col-span-8 space-y-6">
          <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden relative flex flex-col justify-end h-[460px]">
            {/* Mock Camera Feed with overlay boxes */}
            <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1515162305285-0293e4767cc2?auto=format&fit=crop&q=80&w=800')] bg-cover bg-center" />
            <div className="absolute inset-0 bg-slate-950/20" />

            {/* Bounding box layer */}
            {filteredBoxes.map((box, idx) => (
              <div
                key={idx}
                className="absolute border-2 border-red-500 bg-red-500/10 flex flex-col justify-between p-1 font-mono text-[7px]"
                style={{
                  left: `${box.x}px`,
                  top: `${box.y}px`,
                  width: `${box.width}px`,
                  height: `${box.height}px`
                }}
              >
                <span className="bg-red-600 text-white font-bold px-1 py-0.5 rounded leading-none w-max">
                  {box.label.toUpperCase()} ({(box.confidence * 100).toFixed(0)}%)
                </span>
                <span className="text-red-400 font-semibold self-end">
                  x:{box.x} y:{box.y}
                </span>
              </div>
            ))}

            {/* Canvas overlay stats */}
            <div className="p-4 z-10 bg-slate-950/70 border-t border-slate-800/80 flex items-center justify-between text-slate-350 text-[11px] font-mono">
              <span className="flex items-center gap-1"><Cpu className="w-3.5 h-3.5 text-primary-light" /> MODEL: YOLOV8-ROAD-HMA v1.0</span>
              <span>INFERENCE: 14ms (71 FPS)</span>
              <span className="text-emerald-400">STATUS: ACTIVE</span>
            </div>
          </div>

          {/* Classification details */}
          <div className="bg-slate-900 border border-slate-800 p-5 rounded-xl">
            <h4 className="text-white text-xs font-bold uppercase mb-4 tracking-wider">Surface Classification</h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center font-mono text-[10px]">
              <div className="bg-slate-950/40 border border-slate-800 p-3 rounded-lg">
                <span className="text-slate-500 text-[8px] uppercase block font-bold mb-1">Surface Type</span>
                <span className="text-slate-200 font-semibold">ASPHALT PAVEMENT</span>
              </div>
              <div className="bg-slate-950/40 border border-slate-800 p-3 rounded-lg">
                <span className="text-slate-500 text-[8px] uppercase block font-bold mb-1">Est. Road Width</span>
                <span className="text-slate-200 font-semibold">7.2 METERS (Conf: 94%)</span>
              </div>
              <div className="bg-slate-950/40 border border-slate-800 p-3 rounded-lg">
                <span className="text-slate-500 text-[8px] uppercase block font-bold mb-1">Pavement Grade</span>
                <span className="text-[#38BDF8] font-bold">GRADE B+ (FAIR)</span>
              </div>
              <div className="bg-slate-950/40 border border-slate-800 p-3 rounded-lg">
                <span className="text-slate-500 text-[8px] uppercase block font-bold mb-1">AI Grading confidence</span>
                <span className="text-emerald-400 font-bold">96.8% ACCURACY</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right column controls */}
        <div className="lg:col-span-4 space-y-6">
          {/* Settings panel */}
          <div className="bg-slate-900 border border-slate-800 p-5 rounded-xl space-y-5">
            <h4 className="text-white text-xs font-bold uppercase tracking-wider flex items-center gap-1.5">
              <Sliders className="w-4 h-4 text-slate-400" />
              Inference Parameters
            </h4>
            
            {/* Model select */}
            <div className="space-y-2">
              <span className="text-[9px] text-slate-500 font-bold uppercase tracking-widest block">Core Model pipeline</span>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: 'distress', label: 'Distress' },
                  { id: 'asset', label: 'Asset' },
                  { id: 'width', label: 'Width' }
                ].map((m) => (
                  <button
                    key={m.id}
                    onClick={() => setModelType(m.id as any)}
                    className={`py-1.5 rounded-lg border text-[10px] font-bold uppercase transition-all ${
                      modelType === m.id 
                        ? 'bg-[#2563EB]/10 border-[#2563EB] text-[#38BDF8]' 
                        : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    {m.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Threshold slider */}
            <div className="space-y-2">
              <div className="flex justify-between text-[10px] font-mono text-slate-400">
                <span>Confidence Cutoff:</span>
                <span className="text-white font-bold">{(confidenceThreshold * 100).toFixed(0)}%</span>
              </div>
              <input
                type="range"
                min="0.5"
                max="0.95"
                step="0.05"
                value={confidenceThreshold}
                onChange={(e) => setConfidenceThreshold(parseFloat(e.target.value))}
                className="w-full accent-primary bg-slate-950 rounded-lg h-1.5 appearance-none cursor-pointer"
              />
            </div>

            {/* Toggles */}
            <div className="space-y-3 pt-2 border-t border-slate-800/60">
              <span className="text-[9px] text-slate-500 font-bold uppercase tracking-widest block">Class Label filters</span>
              {Object.keys(activeBoxes).map((label) => (
                <label key={label} className="flex items-center justify-between text-xs text-slate-350 cursor-pointer">
                  <span>{label}</span>
                  <input
                    type="checkbox"
                    checked={activeBoxes[label]}
                    onChange={(e) => setActiveBoxes(prev => ({ ...prev, [label]: e.target.checked }))}
                    className="rounded accent-primary"
                  />
                </label>
              ))}
            </div>

            <button
              onClick={() => alert('Exporting spatial metadata output registry as GeoJSON...')}
              className="w-full bg-[#2563EB] hover:bg-blue-700 text-white text-xs font-bold py-2.5 rounded-lg transition-colors flex items-center justify-center gap-1.5 shadow-glow"
            >
              <FileDown className="w-4 h-4" />
              EXPORT SHAPEFILE METADATA
            </button>
          </div>

          {/* Detections log list */}
          <div className="bg-slate-900 border border-slate-800 p-5 rounded-xl space-y-4">
            <h4 className="text-white text-xs font-bold uppercase tracking-wider">Live Detection Pipeline</h4>
            <div className="space-y-3 text-[11px] font-mono">
              {filteredBoxes.map((box, idx) => (
                <div key={idx} className="flex justify-between items-start border-b border-slate-850 pb-2.5 last:border-0 last:pb-0">
                  <div>
                    <span className="text-red-400 font-bold font-mono">{box.label.toUpperCase()}</span>
                    <span className="text-[9px] text-slate-500 block">Coords: {box.x}, {box.y} (Area: {box.width * box.height}px)</span>
                  </div>
                  <span className="text-slate-200 font-bold">{(box.confidence * 100).toFixed(0)}%</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
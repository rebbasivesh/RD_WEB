import React, { useState } from 'react';
import type { Detection } from '../types';
import { 
  MapPinIcon, 
  ArrowDownTrayIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';

interface LiveAIDetectionsTimelineProps {
  detections: Detection[];
  selectedDetection: Detection | null;
  setSelectedDetection: (det: Detection | null) => void;
}

export const LiveAIDetectionsTimeline: React.FC<LiveAIDetectionsTimelineProps> = ({
  detections,
  selectedDetection,
  setSelectedDetection
}) => {
  const [isOpen, setIsOpen] = useState(true);

  if (!isOpen) {
    return (
      <div className="absolute right-0 top-1/3 -translate-y-1/2 z-10 mr-80">
        {/* If inspector is expanded, offset might change, so absolute placement works */}
        <button 
          onClick={() => setIsOpen(true)}
          className="p-2 rounded-l-lg bg-slate-900 border-l border-y border-slate-800 text-slate-400 hover:text-white transition-all shadow-lg"
          title="Expand AI detection timeline"
        >
          <ChevronLeftIcon className="w-4 h-4" />
        </button>
      </div>
    );
  }

  return (
    <div className="w-80 h-full flex flex-col bg-slate-900/95 border-l border-slate-800 ops-panel relative overflow-hidden transition-all duration-300">
      {/* Collapse button */}
      <button 
        onClick={() => setIsOpen(false)}
        className="absolute left-2 top-4 p-1 rounded bg-slate-800/60 border border-slate-700/50 text-slate-400 hover:text-white transition-colors"
      >
        <ChevronRightIcon className="w-3.5 h-3.5" />
      </button>

      {/* Header */}
      <div className="pl-12 pr-6 py-4 border-b border-slate-800 bg-slate-950/20">
        <h3 className="text-white font-bold text-xs uppercase tracking-wider mb-0.5 flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-red-500 animate-ping"></span> Live AI Logs
        </h3>
        <p className="text-[9px] text-slate-500">Real-time distress classification logs</p>
      </div>

      {/* Scrolling Stream list */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3.5 select-none scrollbar-thin">
        {detections.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center text-slate-500 py-12">
            <ExclamationTriangleIcon className="w-8 h-8 mb-2 opacity-30 text-slate-400" />
            <p className="text-[10px] uppercase font-bold tracking-wider">No Active Detections</p>
            <p className="text-[8.5px] text-slate-600">Simulation data feed inactive</p>
          </div>
        ) : (
          detections.map(det => {
            const isSelected = selectedDetection?.id === det.id;
            return (
              <div 
                key={det.id}
                onClick={() => setSelectedDetection(det)}
                className={`p-3 rounded-xl cursor-pointer border transition-all flex gap-3 ${
                  isSelected 
                    ? 'bg-primary/10 border-primary shadow-glow' 
                    : 'bg-slate-950/40 border-slate-800 hover:bg-slate-800/20 hover:border-slate-700/50'
                }`}
              >
                {/* AI image placeholder bounding box design */}
                <div className="w-14 h-14 rounded bg-slate-950 flex flex-col items-center justify-center border border-slate-800 text-[8px] text-slate-600 uppercase font-mono font-bold relative overflow-hidden shrink-0">
                  <span className="z-10">AI Frame</span>
                  <div className="absolute inset-0 bg-gradient-to-tr from-primary/10 to-transparent"></div>
                  <div className="absolute top-1.5 left-1.5 right-1.5 bottom-1.5 border border-red-500/40 rounded"></div>
                </div>

                {/* Distress meta data */}
                <div className="flex-1 min-w-0 font-mono text-[9px]">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-[11px] font-sans font-bold text-white truncate leading-none">{det.type}</span>
                    <span className="text-slate-500 text-[8px] leading-none">{det.timestamp}</span>
                  </div>
                  <div className="flex justify-between text-slate-400">
                    <span>CONFIDENCE:</span>
                    <span className="text-emerald-400 font-bold">{(det.confidence * 100).toFixed(0)}%</span>
                  </div>
                  <div className="flex justify-between text-slate-400">
                    <span>ROAD GRADE:</span>
                    <span className="text-red-400 font-bold">Class {det.roadScore}</span>
                  </div>

                  {/* Actions buttons */}
                  <div className="flex justify-end gap-2 mt-2 pt-1 border-t border-slate-800/50">
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedDetection(det);
                      }}
                      className="p-1 rounded bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700 transition-colors"
                      title="Locate coordinates on Map"
                    >
                      <MapPinIcon className="w-3.5 h-3.5" />
                    </button>
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        alert(`Downloading defect frame: img_${det.id}.jpg`);
                      }}
                      className="p-1 rounded bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700 transition-colors"
                      title="Download image"
                    >
                      <ArrowDownTrayIcon className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

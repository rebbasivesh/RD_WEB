import React, { useState } from 'react';
import type { Survey } from '../types';
import { 
  ArrowDownTrayIcon, 
  PlayIcon, 
  MagnifyingGlassIcon,
  TrashIcon
} from '@heroicons/react/24/outline';

interface HistoryViewProps {
  surveys: Survey[];
  onDeleteSurvey: (id: string) => void;
  onSelectSurvey: (survey: Survey) => void;
}

export const HistoryView: React.FC<HistoryViewProps> = ({ surveys, onDeleteSurvey, onSelectSurvey }) => {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredSurveys = surveys.filter(s => 
    s.roadName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.projectName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.id.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleExport = (survey: Survey, format: 'csv' | 'geojson') => {
    alert(`Exporting ${survey.id} as ${format.toUpperCase()}... Telemetry data stream download started.`);
  };

  return (
    <div className="space-y-6 max-w-full mx-auto p-4 select-none">
      {/* Search Header toolbar */}
      <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl flex flex-col md:flex-row items-center justify-between gap-4">
        <div>
          <span className="text-[8px] text-slate-500 font-bold uppercase tracking-widest block mb-0.5">Database storage</span>
          <h3 className="text-white font-bold text-xs uppercase tracking-wider">Historical Inspection Logs</h3>
        </div>

        {/* Filter Input */}
        <div className="flex items-center w-full md:w-80 bg-slate-950/70 border border-slate-800 rounded-lg px-3 py-1.5 text-slate-400 focus-within:border-primary/50 transition-colors">
          <MagnifyingGlassIcon className="w-4 h-4 mr-2 text-slate-500" />
          <input 
            type="text" 
            placeholder="Search by road or campaign ID..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="bg-transparent border-none outline-none text-[11px] text-slate-200 w-full placeholder-slate-600 font-sans"
          />
        </div>
      </div>

      {/* History Log Table card */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-2xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-950/40 text-[9px] uppercase font-bold text-slate-500 tracking-wider">
                <th className="px-6 py-3.5">Survey ID</th>
                <th className="px-6 py-3.5">Campaign Name / Sector</th>
                <th className="px-6 py-3.5">Vehicle / Operator</th>
                <th className="px-6 py-3.5">Date & Time</th>
                <th className="px-6 py-3.5">Duration</th>
                <th className="px-6 py-3.5">Length (KM)</th>
                <th className="px-6 py-3.5">Roughness (IRI)</th>
                <th className="px-6 py-3.5">Pavement Rating (PCR)</th>
                <th className="px-6 py-3.5">AI Distress Breakdown</th>
                <th className="px-6 py-3.5">Status</th>
                <th className="px-6 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/50 text-[11px] text-slate-300 font-mono">
              {filteredSurveys.length === 0 ? (
                <tr>
                  <td colSpan={11} className="text-center py-12 text-slate-600 font-bold uppercase tracking-wider">
                    No Matching History Logs
                  </td>
                </tr>
              ) : (
                filteredSurveys.map(s => {
                  const potholesCount = s.detections.filter(d => d.type === 'Pothole').length;
                  const cracksCount = s.detections.filter(d => d.type.toLowerCase().includes('crack')).length;
                  const durationMins = Math.floor(s.durationSeconds / 60);

                  return (
                    <tr 
                      key={s.id} 
                      onClick={() => onSelectSurvey(s)}
                      className="hover:bg-slate-800/30 cursor-pointer transition-colors"
                    >
                      <td className="px-6 py-3.5 font-bold text-primary-light">{s.id}</td>
                      <td className="px-6 py-3.5">
                        <span className="block font-semibold text-slate-200 font-sans">{s.roadName}</span>
                        <span className="block text-[8px] text-slate-500 leading-none">{s.projectName}</span>
                      </td>
                      <td className="px-6 py-3.5 font-sans">
                        <span className="block font-semibold text-slate-300">{s.vehicleId}</span>
                        <span className="block text-[8px] text-slate-500 leading-none">{s.operatorName}</span>
                      </td>
                      <td className="px-6 py-3.5 font-sans">
                        <span className="block font-semibold text-slate-300">{s.date}</span>
                        <span className="block text-[8px] text-slate-500 leading-none font-mono">{s.startTime}</span>
                      </td>
                      <td className="px-6 py-3.5 font-bold text-slate-300 font-sans">{durationMins} mins</td>
                      <td className="px-6 py-3.5">{s.status === 'completed' ? s.distanceCoveredKm.toFixed(2) : '-'}</td>
                      <td className="px-6 py-3.5 font-bold text-slate-200">{s.status === 'completed' ? s.avgIri.toFixed(2) : '-'}</td>
                      <td className="px-6 py-3.5">
                        {s.status === 'completed' ? (
                          <span className={`px-2 py-0.5 rounded text-[9px] font-bold ${
                            s.avgPcr >= 85 ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                            s.avgPcr >= 70 ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' :
                            'bg-red-500/10 text-red-400 border border-red-500/20'
                          }`}>
                            {s.avgPcr} / 100
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded text-[9px] font-bold bg-slate-800/40 text-slate-500 border border-slate-700/30">
                            N/A
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-3.5 font-sans">
                        {s.status === 'completed' ? (
                          <span className="text-[10px] text-slate-400">
                            {potholesCount} Pothole{potholesCount !== 1 ? 's' : ''}, {cracksCount} Crack{cracksCount !== 1 ? 's' : ''}
                          </span>
                        ) : (
                          <span className="text-[10px] text-slate-500 font-medium italic animate-pulse">
                            Analyzing...
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-3.5">
                        {s.status === 'completed' ? (
                          <span className="px-2 py-0.5 rounded text-[8px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                            PROCESSED
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded text-[8px] font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20 animate-pulse">
                            PROCESSING
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-3.5 text-right space-x-2">
                        <button 
                          onClick={(e) => { e.stopPropagation(); onSelectSurvey(s); }}
                          className="bg-slate-950/60 hover:bg-slate-800 border border-slate-800 p-1.5 rounded text-slate-400 hover:text-white transition-colors"
                          title="Replay Survey details in GIS Map"
                        >
                          <PlayIcon className="w-3.5 h-3.5 text-primary-light" />
                        </button>
                        <button 
                          onClick={(e) => { e.stopPropagation(); if (s.status === 'completed') handleExport(s, 'csv'); }}
                          disabled={s.status !== 'completed'}
                          className={`border p-1.5 rounded transition-colors ${
                            s.status === 'completed' 
                              ? 'bg-slate-950/60 hover:bg-slate-800 border-slate-800 text-slate-400 hover:text-white' 
                              : 'bg-slate-950/20 border-slate-900 text-slate-700 cursor-not-allowed'
                          }`}
                          title={s.status === 'completed' ? "Download CSV log" : "Processing - Download Disabled"}
                        >
                          <ArrowDownTrayIcon className="w-3.5 h-3.5" />
                        </button>
                        <button 
                          onClick={(e) => { e.stopPropagation(); onDeleteSurvey(s.id); }}
                          className="bg-slate-950/60 hover:bg-red-500/10 border border-red-500/15 p-1.5 rounded text-red-400 hover:text-red-300 transition-colors"
                          title="Delete log"
                        >
                          <TrashIcon className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

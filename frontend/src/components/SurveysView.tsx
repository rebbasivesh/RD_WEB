import React, { useState, useEffect } from 'react';

const getIriColorClass = (iri: number) => {
  if (iri < 1.5) return 'text-[#10B981]'; // Excellent
  if (iri < 2.5) return 'text-[#EAB308]'; // Good
  if (iri < 3.5) return 'text-[#F59E0B]'; // Fair
  return 'text-[#EF4444]'; // Poor
};
import type { Survey, Detection } from '../types';
import { mockSurveys, mockDetections } from '../mockData';
import { MapComponent } from './MapComponent';
import { Line } from 'react-chartjs-2';
import {
  Search,
  Filter,
  Download,
  Trash2,
  Play,
  FileText,
  AlertTriangle,
  Tag,
  CheckCircle,
  Eye,
  ArrowLeft,
  Calendar,
  User,
  Truck,
  MapPin,
  TrendingUp,
  Activity,
  FileSpreadsheet
} from 'lucide-react';

interface SurveysViewProps {
  surveys: Survey[];
  onDeleteSurvey: (id: string) => void;
}

export const SurveysView: React.FC<SurveysViewProps> = ({ surveys: propSurveys, onDeleteSurvey }) => {
  const [surveys, setSurveys] = useState<Survey[]>(propSurveys.length > 0 ? propSurveys : mockSurveys);
  const [selectedSurvey, setSelectedSurvey] = useState<Survey | null>(null);
  const [search, setSearch] = useState('');
  const [projectFilter, setProjectFilter] = useState('all');
  const [operatorFilter, setOperatorFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortField, setSortField] = useState<'date' | 'distance' | 'iri'>('date');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [notes, setNotes] = useState<string>('');
  const [activeSubTab, setActiveSubTab] = useState<'overview' | 'sensor_data' | 'camera_timeline' | 'comparison'>('overview');
  
  // Sync surveys state with props
  useEffect(() => {
    if (propSurveys.length > 0) {
      setSurveys(propSurveys);
    }
  }, [propSurveys]);

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedIds(surveys.map(s => s.id));
    } else {
      setSelectedIds([]);
    }
  };

  const handleSelectOne = (id: string, checked: boolean) => {
    if (checked) {
      setSelectedIds(prev => [...prev, id]);
    } else {
      setSelectedIds(prev => prev.filter(x => x !== id));
    }
  };

  const handleBulkAction = (action: string) => {
    if (selectedIds.length === 0) return;
    if (action === 'delete') {
      if (confirm(`Are you sure you want to delete ${selectedIds.length} surveys?`)) {
        setSurveys(prev => prev.filter(s => !selectedIds.includes(s.id)));
        setSelectedIds([]);
      }
    } else if (action === 'export') {
      alert(`Exporting ${selectedIds.length} surveys as Excel spreadsheet...`);
    } else if (action === 'ai') {
      alert(`Queueing ${selectedIds.length} campaigns for Batch AI Object Recognition...`);
    }
  };

  // Duplicate Check Simulation
  const isDuplicate = selectedSurvey ? selectedSurvey.id === 'NH16-S023' : false;

  // Sync Notes with Selected Survey
  useEffect(() => {
    if (selectedSurvey) {
      const saved = localStorage.getItem(`notes_${selectedSurvey.id}`) || 'No inspection notes entered. Click edit to append system evaluation remarks.';
      setNotes(saved);
    }
  }, [selectedSurvey]);

  const saveNotes = () => {
    if (selectedSurvey) {
      localStorage.setItem(`notes_${selectedSurvey.id}`, notes);
      alert('Inspection comments saved to local vault!');
    }
  };

  const filtered = surveys
    .filter(s => {
      const matchesSearch = s.roadName.toLowerCase().includes(search.toLowerCase()) || s.id.toLowerCase().includes(search.toLowerCase());
      const matchesProject = projectFilter === 'all' || s.projectName === projectFilter;
      const matchesOperator = operatorFilter === 'all' || s.operatorName === operatorFilter;
      const matchesStatus = statusFilter === 'all' || s.status === statusFilter;
      return matchesSearch && matchesProject && matchesOperator && matchesStatus;
    })
    .sort((a, b) => {
      if (sortField === 'date') return b.date.localeCompare(a.date);
      if (sortField === 'distance') return b.distanceCoveredKm - a.distanceCoveredKm;
      if (sortField === 'iri') return b.avgIri - a.avgIri;
      return 0;
    });

  // Sensor chart mock data
  const sensorData = {
    labels: Array.from({ length: 40 }, (_, i) => `${(i * 0.25).toFixed(2)} km`),
    datasets: [
      {
        label: 'IRI Roughness Index (m/km)',
        data: Array.from({ length: 40 }, (_, i) => 1.2 + Math.sin(i * 0.4) * 0.6 + (i > 25 ? 1.5 : 0)),
        borderColor: '#3B82F6',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        fill: true,
        yAxisID: 'y',
        tension: 0.3,
      },
      {
        label: 'IMU Vertical Accel (g)',
        data: Array.from({ length: 40 }, (_, i) => 0.05 + Math.cos(i * 0.6) * 0.15 + (i % 5 === 0 ? 0.35 : 0)),
        borderColor: '#EF4444',
        backgroundColor: 'rgba(239, 68, 68, 0.05)',
        fill: false,
        yAxisID: 'y1',
        tension: 0.2,
      }
    ]
  };

  const chartOptions = {
    responsive: true,
    scales: {
      y: {
        type: 'linear' as const,
        display: true,
        position: 'left' as const,
        grid: { color: 'rgba(51, 65, 85, 0.3)' },
        ticks: { color: '#94A3B8' }
      },
      y1: {
        type: 'linear' as const,
        display: true,
        position: 'right' as const,
        grid: { drawOnChartArea: false },
        ticks: { color: '#94A3B8' }
      },
      x: {
        grid: { color: 'rgba(51, 65, 85, 0.1)' },
        ticks: { color: '#94A3B8', maxTicksLimit: 12 }
      }
    },
    plugins: {
      legend: { labels: { color: '#F8FAFC' } }
    }
  };

  if (selectedSurvey) {
    return (
      <div className="space-y-6 max-w-[1600px] mx-auto p-4">
        {/* Detail Header bar */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-slate-900 border border-slate-800 p-5 rounded-xl">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setSelectedSurvey(null)}
              className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-lg transition-colors border border-slate-700/50"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <div>
              <div className="flex items-center gap-3">
                <span className="text-[9px] font-bold text-primary-light uppercase tracking-widest font-mono">Survey Inspector</span>
                <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[9px] px-2 py-0.5 rounded-full font-bold">PROCESSED</span>
              </div>
              <h2 className="text-white text-lg font-bold uppercase mt-0.5 tracking-wide">
                {selectedSurvey.roadName} <span className="text-slate-500 font-mono font-normal">({selectedSurvey.id})</span>
              </h2>
            </div>
          </div>
          <div className="flex gap-2">
            <button 
              onClick={() => alert('Initiating raw file packages bundle download...')}
              className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 text-slate-300 px-4 py-2 rounded-lg border border-slate-700/50 text-xs font-bold transition-all"
            >
              <Download className="w-3.5 h-3.5" />
              DOWNLOAD RAW FILES
            </button>
            <button 
              onClick={() => {
                if (confirm('Permanently wipe this inspection database?')) {
                  onDeleteSurvey(selectedSurvey.id);
                  setSelectedSurvey(null);
                }
              }}
              className="flex items-center gap-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 px-4 py-2 rounded-lg border border-red-500/20 text-xs font-bold transition-all"
            >
              <Trash2 className="w-3.5 h-3.5" />
              DELETE RECORD
            </button>
          </div>
        </div>

        {/* Duplicate Track Notification banner */}
        {isDuplicate && (
          <div className="bg-amber-500/10 border border-amber-500/25 p-4 rounded-xl flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
            <div>
              <h4 className="text-white font-bold text-xs uppercase tracking-wide">Overlapping Survey Segment Detected</h4>
              <p className="text-[11px] text-slate-400 mt-1 font-mono">
                System matched route coordinates overlap 94% with campaign ID <strong>NH16-S022</strong> recorded 36 hours ago by operator <strong>Ramesh</strong>. Check segment drift in settings.
              </p>
            </div>
          </div>
        )}

        {/* Main detail workspace */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Main Content panel: Tabs */}
          <div className="lg:col-span-8 space-y-6">
            {/* View selectors */}
            <div className="flex border-b border-slate-850 gap-6">
              {[
                { id: 'overview', label: 'GIS & Video Telemetry', icon: Eye },
                { id: 'sensor_data', label: 'Sensor Charts (IRI/IMU)', icon: Activity },
                { id: 'camera_timeline', label: 'AI Bounding Frames', icon: Tag },
                { id: 'comparison', label: 'Historical Trend Compare', icon: TrendingUp }
              ].map((tab) => {
                const Icon = tab.icon;
                const active = activeSubTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveSubTab(tab.id as any)}
                    className={`pb-3 flex items-center gap-2 text-xs font-bold uppercase tracking-wider relative transition-colors ${
                      active ? 'text-primary-light' : 'text-slate-500 hover:text-slate-350'
                    }`}
                  >
                    {active && <span className="absolute bottom-0 left-0 right-0 h-[2px] bg-primary" />}
                    <Icon className="w-3.5 h-3.5" />
                    {tab.label}
                  </button>
                );
              })}
            </div>

            {activeSubTab === 'overview' && (
              <div className="space-y-6">
                {/* Simulated Camera & Map container split */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 h-[400px]">
                  {/* Synced Video preview */}
                  <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden relative flex flex-col justify-end">
                    <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?auto=format&fit=crop&q=80&w=600')] bg-cover bg-center opacity-70" />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/20 to-transparent" />
                    {/* Artificial overlay bounding box */}
                    <div className="absolute top-24 left-36 w-24 h-16 border-2 border-red-500 bg-red-500/10 flex flex-col justify-between p-1 z-10 animate-pulse">
                      <span className="text-[7px] text-red-400 font-bold font-mono">POTHOLE (97%)</span>
                      <span className="text-[6px] text-red-500 font-mono self-end">D: 1.4m</span>
                    </div>

                    <div className="p-4 z-20 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-[9px] bg-red-500 text-white font-mono px-2 py-0.5 rounded font-bold uppercase">LIVE FEED RECORDING</span>
                        <span className="text-[10px] text-slate-400 font-mono">FRAME: 1420 / 4800</span>
                      </div>
                      <div className="w-full bg-slate-800 h-1 rounded-full overflow-hidden">
                        <div className="bg-primary h-full w-[35%]" />
                      </div>
                      <div className="flex justify-between items-center text-[10px] text-slate-400 font-mono">
                        <span className="flex items-center gap-1"><Play className="w-3 h-3 text-primary-light" /> 00:14:20 / 00:45:00</span>
                        <span>SPEED: 52.4 KM/H</span>
                      </div>
                    </div>
                  </div>

                  {/* Leaflet trail map */}
                  <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden relative h-full">
                    <MapComponent 
                      gpsPath={selectedSurvey.gpsPath}
                      detections={selectedSurvey.detections}
                      currentLocation={selectedSurvey.gpsPath[Math.floor(selectedSurvey.gpsPath.length * 0.35)]}
                    />
                  </div>
                </div>

                {/* Details grid list */}
                <div className="bg-slate-900 border border-slate-800 p-5 rounded-xl">
                  <h4 className="text-white text-xs font-bold uppercase mb-4 tracking-wider">Campaign Parameters</h4>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-6 text-[11px] font-mono">
                    <div className="space-y-1">
                      <span className="text-slate-500 text-[9px] uppercase font-bold block">Operator ID</span>
                      <span className="text-slate-200 font-sans font-semibold flex items-center gap-1.5"><User className="w-3.5 h-3.5 text-slate-500" /> {selectedSurvey.operatorName}</span>
                    </div>
                    <div className="space-y-1">
                      <span className="text-slate-500 text-[9px] uppercase font-bold block">Vehicle Reg</span>
                      <span className="text-slate-200 font-semibold flex items-center gap-1.5"><Truck className="w-3.5 h-3.5 text-slate-500" /> {selectedSurvey.vehicleId}</span>
                    </div>
                    <div className="space-y-1">
                      <span className="text-slate-500 text-[9px] uppercase font-bold block">Survey Date</span>
                      <span className="text-slate-400 flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5 text-slate-500" /> {selectedSurvey.date}</span>
                    </div>
                    <div className="space-y-1">
                      <span className="text-slate-500 text-[9px] uppercase font-bold block">Corridor Sector</span>
                      <span className="text-slate-200 font-sans font-semibold flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5 text-slate-500" /> Vijayawada Sec</span>
                    </div>
                    <div className="space-y-1">
                      <span className="text-slate-500 text-[9px] uppercase font-bold block">Roughness Index (Avg IRI)</span>
                      <span className={`${getIriColorClass(selectedSurvey.avgIri)} font-bold`}>{selectedSurvey.avgIri.toFixed(2)} m/km</span>
                    </div>
                    <div className="space-y-1">
                      <span className="text-slate-500 text-[9px] uppercase font-bold block">Overall PCR Grade</span>
                      <span className="text-primary-light font-bold">{selectedSurvey.avgPcr.toFixed(1)} / 100</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeSubTab === 'sensor_data' && (
              <div className="bg-slate-900 border border-slate-800 p-5 rounded-xl">
                <div className="flex justify-between items-center mb-6">
                  <div>
                    <h4 className="text-white text-xs font-bold uppercase tracking-wider">High-Frequency Telemetry Graph</h4>
                    <p className="text-[10px] text-slate-500 mt-1">Roughness indicators plotted over IMU vertical acceleration.</p>
                  </div>
                  <button 
                    onClick={() => alert('Downloading CSV telemetry stream...')}
                    className="p-2 bg-slate-950/60 hover:bg-slate-850 rounded border border-slate-800 text-[#38BDF8]"
                    title="Export Sensor CSV"
                  >
                    <FileSpreadsheet className="w-4 h-4" />
                  </button>
                </div>
                <div className="h-[300px]">
                  <Line data={sensorData} options={chartOptions} />
                </div>
              </div>
            )}

            {activeSubTab === 'camera_timeline' && (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {selectedSurvey.detections.map((det) => (
                  <div key={det.id} className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
                    <div className="h-32 bg-[url('https://images.unsplash.com/photo-1515162305285-0293e4767cc2?auto=format&fit=crop&q=80&w=400')] bg-cover bg-center relative">
                      <div className="absolute inset-0 bg-slate-950/30" />
                      <div className="absolute top-2 left-2 px-2 py-0.5 bg-red-600 text-white font-mono text-[8px] font-bold rounded">
                        {det.type.toUpperCase()}
                      </div>
                      <div className="absolute bottom-2 left-2 px-1.5 py-0.5 bg-slate-900/90 text-slate-300 font-mono text-[8px] rounded border border-slate-700/50">
                        Conf: {(det.confidence * 100).toFixed(0)}%
                      </div>
                    </div>
                    <div className="p-3 text-[10px] font-mono text-slate-400 space-y-1 bg-slate-950/20">
                      <div className="flex justify-between">
                        <span>Timestamp:</span>
                        <span className="text-white font-bold">{det.timestamp}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Latitude:</span>
                        <span className="text-slate-300">{det.location.lat.toFixed(5)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Longitude:</span>
                        <span className="text-slate-300">{det.location.lng.toFixed(5)}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {activeSubTab === 'comparison' && (
              <div className="bg-slate-900 border border-slate-800 p-5 rounded-xl space-y-6">
                <div>
                  <h4 className="text-white text-xs font-bold uppercase tracking-wider">Survey Segment Comparison</h4>
                  <p className="text-[10px] text-slate-500 mt-1">Cross-compare pavement indexes with historical runs.</p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                  <div className="bg-slate-950/40 p-4 border border-slate-800/80 rounded-xl space-y-3">
                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block">Active Survey (This run)</span>
                    <h5 className="text-white font-bold">{selectedSurvey.roadName}</h5>
                    <div className="flex gap-4 font-mono">
                      <div>
                        <span className="text-[8px] text-slate-650 uppercase block font-bold">AVG IRI</span>
                        <span className="text-slate-200 font-bold text-sm">{selectedSurvey.avgIri.toFixed(2)}</span>
                      </div>
                      <div>
                        <span className="text-[8px] text-slate-650 uppercase block font-bold">TOTAL DETECTIONS</span>
                        <span className="text-red-400 font-bold text-sm">{selectedSurvey.totalDetections}</span>
                      </div>
                    </div>
                  </div>

                  <div className="bg-slate-950/40 p-4 border border-slate-800/80 rounded-xl space-y-3">
                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block">Compare Target (Dec 2025)</span>
                    <select className="bg-slate-900 border border-slate-800 text-slate-300 text-xs px-2.5 py-1 w-full rounded focus:outline-none">
                      <option>NH-16 Bypass Sec 22 (Prior Run)</option>
                      <option>NH-16 Bypass Sec 21 (Prior Run)</option>
                    </select>
                    <div className="flex gap-4 font-mono">
                      <div>
                        <span className="text-[8px] text-slate-650 uppercase block font-bold">AVG IRI</span>
                        <span className="text-slate-400 font-bold text-sm">2.42</span>
                      </div>
                      <div>
                        <span className="text-[8px] text-slate-650 uppercase block font-bold">TOTAL DETECTIONS</span>
                        <span className="text-slate-400 font-bold text-sm">11</span>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="bg-slate-950/20 p-3 rounded-lg border border-slate-850/80 text-[10px] text-slate-400 font-mono">
                  💡 <strong>Analysis:</strong> Roughness has increased by 15.7% (from 2.42 to 2.80) over the last 8 months. Pothole density is higher in Sector C. Suggest scheduling localized pavement overlays.
                </div>
              </div>
            )}
          </div>

          {/* Right Rail Details: Notes & Actions */}
          <div className="lg:col-span-4 space-y-6">
            {/* Action Card */}
            <div className="bg-slate-900 border border-slate-800 p-5 rounded-xl space-y-4">
              <h4 className="text-white text-xs font-bold uppercase tracking-wider">Inspection Remarks</h4>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full h-44 bg-slate-950/60 border border-slate-800 rounded-lg p-3 text-[11px] text-slate-300 placeholder-slate-600 focus:outline-none focus:border-primary/40 font-mono resize-none"
              />
              <button
                onClick={saveNotes}
                className="w-full bg-primary hover:bg-primary-dark text-white text-xs font-bold py-2 rounded-lg transition-colors flex items-center justify-center gap-1.5"
              >
                <CheckCircle className="w-4 h-4" />
                SAVE INSPECTION REMARKS
              </button>
            </div>

            {/* Campaign Summary Index */}
            <div className="bg-slate-900 border border-slate-800 p-5 rounded-xl space-y-4">
              <h4 className="text-white text-xs font-bold uppercase tracking-wider">Execution Pipeline</h4>
              <div className="space-y-4 text-xs">
                {[
                  { step: '1. Spatial Route Logging', state: 'Completed', time: '14:15:05' },
                  { step: '2. IMU / GPS Stream Sync', state: 'Completed', time: '15:22:15' },
                  { step: '3. Edge AI Object Overlay', state: 'Completed', time: '15:24:40' },
                  { step: '4. Cloud Registry Entry', state: 'Completed', time: '15:25:12' }
                ].map((item, idx) => (
                  <div key={idx} className="flex justify-between items-start font-mono text-[11px]">
                    <div>
                      <span className="text-slate-300 block font-sans font-semibold">{item.step}</span>
                      <span className="text-[9px] text-slate-550 block">{item.time}</span>
                    </div>
                    <span className="text-emerald-400 font-bold">{item.state}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-[1600px] mx-auto p-4">
      {/* Search Header */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 bg-slate-900 border border-slate-800 p-5 rounded-xl">
        <div>
          <span className="text-[9px] text-slate-500 font-bold uppercase tracking-widest block mb-0.5">Campaigns manager</span>
          <h2 className="text-white text-md font-bold uppercase tracking-wider">Historical Inspection Logs</h2>
        </div>
        <div className="flex flex-col md:flex-row items-stretch md:items-center gap-3 w-full lg:w-auto">
          {/* Search bar */}
          <div className="flex items-center bg-slate-950/70 border border-slate-800 rounded-lg px-3 py-1.5 text-slate-400 focus-within:border-primary/50 transition-colors w-full md:w-64">
            <Search className="w-4 h-4 mr-2 text-slate-500" />
            <input 
              type="text" 
              placeholder="Search by road or ID..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="bg-transparent border-none outline-none text-[11px] text-slate-200 w-full placeholder-slate-650"
            />
          </div>
          {/* Filters toggle bar */}
          <div className="flex gap-2">
            <select
              value={projectFilter}
              onChange={(e) => setProjectFilter(e.target.value)}
              className="bg-slate-950/70 border border-slate-800 text-slate-300 text-xs px-3 py-1.5 rounded-lg focus:outline-none"
            >
              <option value="all">All Campaigns</option>
              <option value="Pavement Quality Campaign">Pavement Campaign</option>
            </select>

            <select
              value={operatorFilter}
              onChange={(e) => setOperatorFilter(e.target.value)}
              className="bg-slate-950/70 border border-slate-800 text-slate-300 text-xs px-3 py-1.5 rounded-lg focus:outline-none"
            >
              <option value="all">All Operators</option>
              <option value="Sivesh">Sivesh</option>
            </select>

            <select
              value={sortField}
              onChange={(e) => setSortField(e.target.value as any)}
              className="bg-slate-950/70 border border-slate-800 text-slate-300 text-xs px-3 py-1.5 rounded-lg focus:outline-none"
            >
              <option value="date">Sort: Date</option>
              <option value="distance">Sort: Distance</option>
              <option value="iri">Sort: IRI</option>
            </select>
          </div>
        </div>
      </div>

      {/* Bulk action toolbar */}
      {selectedIds.length > 0 && (
        <div className="bg-slate-900/90 border border-slate-800 p-4 rounded-xl flex justify-between items-center z-10 animate-fade-in">
          <span className="text-xs text-slate-300 font-mono font-semibold">{selectedIds.length} campaigns selected</span>
          <div className="flex gap-2">
            <button
              onClick={() => handleBulkAction('export')}
              className="flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] px-3.5 py-1.5 rounded font-bold border border-slate-750"
            >
              <FileSpreadsheet className="w-3.5 h-3.5" /> EXPORT SELECTED
            </button>
            <button
              onClick={() => handleBulkAction('ai')}
              className="flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-[#38BDF8] text-[11px] px-3.5 py-1.5 rounded font-bold border border-slate-750"
            >
              <Play className="w-3.5 h-3.5" /> RE-RUN AI ANALYSIS
            </button>
            <button
              onClick={() => handleBulkAction('delete')}
              className="flex items-center gap-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 text-[11px] px-3.5 py-1.5 rounded font-bold border border-red-500/20"
            >
              <Trash2 className="w-3.5 h-3.5" /> DELETE SELECTED
            </button>
          </div>
        </div>
      )}

      {/* Logs Database grid list */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-950/40 text-[9px] uppercase font-bold text-slate-500 tracking-wider">
                <th className="px-6 py-4 w-12">
                  <input
                    type="checkbox"
                    checked={selectedIds.length === surveys.length}
                    onChange={handleSelectAll}
                    className="accent-primary rounded"
                  />
                </th>
                <th className="px-6 py-4">Survey ID</th>
                <th className="px-6 py-4">Campaign Name / Sector</th>
                <th className="px-6 py-4">Date Logged</th>
                <th className="px-6 py-4">Length (KM)</th>
                <th className="px-6 py-4">Roughness (IRI)</th>
                <th className="px-6 py-4">Distress Count</th>
                <th className="px-6 py-4">Operator</th>
                <th className="px-6 py-4 text-right">Inspect Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/50 text-[11px] text-slate-350 font-mono">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={9} className="text-center py-16 text-slate-600 font-bold uppercase tracking-wider">
                    No matching inspection registries found.
                  </td>
                </tr>
              ) : (
                filtered.map(s => {
                  const isChecked = selectedIds.includes(s.id);
                  return (
                    <tr key={s.id} className={`hover:bg-slate-850/10 transition-colors ${isChecked ? 'bg-primary/5' : ''}`}>
                      <td className="px-6 py-3.5">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={(e) => handleSelectOne(s.id, e.target.checked)}
                          className="accent-primary rounded"
                        />
                      </td>
                      <td className="px-6 py-3.5 font-bold text-[#38BDF8]">{s.id}</td>
                      <td className="px-6 py-3.5">
                        <span className="block font-semibold text-slate-200 font-sans">{s.roadName}</span>
                        <span className="block text-[8px] text-slate-500 leading-none">{s.projectName}</span>
                      </td>
                      <td className="px-6 py-3.5 text-slate-400">{s.date}</td>
                      <td className="px-6 py-3.5">{s.distanceCoveredKm.toFixed(1)} km</td>
                      <td className="px-6 py-3.5 font-bold text-slate-200">{s.avgIri.toFixed(2)}</td>
                      <td className="px-6 py-3.5">
                        <span className={`px-2 py-0.5 rounded text-[8px] font-bold ${
                          s.totalDetections > 10 ? 'bg-red-500/10 text-red-400' : 'bg-emerald-500/10 text-emerald-400'
                        }`}>
                          {s.totalDetections} defects
                        </span>
                      </td>
                      <td className="px-6 py-3.5 text-slate-400 font-sans">{s.operatorName}</td>
                      <td className="px-6 py-3.5 text-right">
                        <button
                          onClick={() => setSelectedSurvey(s)}
                          className="bg-slate-950/60 hover:bg-slate-800 border border-slate-800 text-primary-light hover:text-white px-3 py-1.5 rounded-lg text-[9px] font-bold uppercase transition-colors flex items-center gap-1 ml-auto"
                        >
                          <Play className="w-3 h-3" />
                          REPLAY INSPECT
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
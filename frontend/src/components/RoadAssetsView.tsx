import React, { useState } from 'react';
import {
  Layers,
  Search,
  Filter,
  MapPin,
  Calendar,
  Wrench,
  ShieldCheck,
  Eye,
  Plus,
  AlertTriangle,
  Activity
} from 'lucide-react';

interface Asset {
  id: string;
  type: string;
  roadName: string;
  gps: string;
  condition: 'Excellent' | 'Good' | 'Fair' | 'Poor' | 'Critical';
  installDate: string;
  owner: string;
  maintenanceLog: string;
  photoUrl: string;
}

const mockAssets: Asset[] = [
  { id: 'ASSET-TS-092', type: 'Traffic Sign (Speed Limit 80)', roadName: 'NH-16 Bypass (KM 14.5)', gps: '16.4420, 80.5700', condition: 'Good', installDate: '2023-11-12', owner: 'NHAI', maintenanceLog: 'Cleaned sign face - March 2026', photoUrl: 'https://images.unsplash.com/photo-1542856391-010fb87dcfed?auto=format&fit=crop&q=80&w=300' },
  { id: 'ASSET-SL-114', type: 'LED Street Light (Pole 44)', roadName: 'NH-16 Bypass (KM 22.1)', gps: '16.3300, 80.6020', condition: 'Excellent', installDate: '2024-05-18', owner: 'PWD AP', maintenanceLog: 'Fixture replacement - January 2026', photoUrl: 'https://images.unsplash.com/photo-1508514177221-188b1cf16e9d?auto=format&fit=crop&q=80&w=300' },
  { id: 'ASSET-GB-051', type: 'W-Beam Guard Rail (Median)', roadName: 'NH-16 Bypass (KM 8.2)', gps: '16.2720, 80.6300', condition: 'Poor', installDate: '2021-08-05', owner: 'NHAI', maintenanceLog: 'Minor impact realignment - Oct 2024', photoUrl: 'https://images.unsplash.com/photo-1590486803833-1c5dc8ddd4c8?auto=format&fit=crop&q=80&w=300' },
  { id: 'ASSET-CV-220', type: 'Box Culvert (Concrete)', roadName: 'State Highway 2 (KM 1.5)', gps: '16.2395, 80.6450', condition: 'Critical', installDate: '2015-04-10', owner: 'PWD AP', maintenanceLog: 'Debris desilt clearance - July 2025', photoUrl: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&q=80&w=300' },
  { id: 'ASSET-BS-012', type: 'Passenger Bus Stop Shelter', roadName: 'NH-16 Corridor (KM 18.0)', gps: '16.3900, 80.5720', condition: 'Fair', installDate: '2022-09-30', owner: 'Guntur RTC', maintenanceLog: 'Structure painting - Feb 2025', photoUrl: 'https://images.unsplash.com/photo-1570125909232-eb263c188f7e?auto=format&fit=crop&q=80&w=300' }
];

export const RoadAssetsView: React.FC = () => {
  const [assets, setAssets] = useState<Asset[]>(mockAssets);
  const [selectedAsset, setSelectedAsset] = useState<Asset | null>(null);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [condFilter, setCondFilter] = useState('all');

  const filtered = assets.filter(a => {
    const matchesSearch = a.id.toLowerCase().includes(search.toLowerCase()) || a.type.toLowerCase().includes(search.toLowerCase()) || a.roadName.toLowerCase().includes(search.toLowerCase());
    const matchesType = typeFilter === 'all' || a.type.toLowerCase().includes(typeFilter.toLowerCase());
    const matchesCond = condFilter === 'all' || a.condition === condFilter;
    return matchesSearch && matchesType && matchesCond;
  });

  return (
    <div className="space-y-6 max-w-[1600px] mx-auto p-4 select-none">
      {/* Header bar */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 bg-slate-900 border border-slate-800 p-5 rounded-xl">
        <div>
          <span className="text-[9px] text-slate-500 font-bold uppercase tracking-widest block mb-0.5">Asset Management</span>
          <h2 className="text-white text-md font-bold uppercase tracking-wider">Highway Infrastructure Inventory</h2>
        </div>
        <div className="flex flex-col md:flex-row items-stretch md:items-center gap-3 w-full lg:w-auto">
          {/* Search bar */}
          <div className="flex items-center bg-slate-950/70 border border-slate-800 rounded-lg px-3 py-1.5 text-slate-400 focus-within:border-primary/50 transition-colors w-full md:w-64">
            <Search className="w-4 h-4 mr-2 text-slate-500" />
            <input 
              type="text" 
              placeholder="Search assets by ID, type, road..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="bg-transparent border-none outline-none text-[11px] text-slate-200 w-full placeholder-slate-650"
            />
          </div>
          {/* Filters */}
          <div className="flex gap-2">
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="bg-slate-950/70 border border-slate-800 text-slate-300 text-xs px-3 py-1.5 rounded-lg focus:outline-none"
            >
              <option value="all">All Types</option>
              <option value="sign">Traffic Signs</option>
              <option value="light">Street Lights</option>
              <option value="rail">Guard Rails</option>
              <option value="culvert">Culverts</option>
              <option value="stop">Bus Stops</option>
            </select>

            <select
              value={condFilter}
              onChange={(e) => setCondFilter(e.target.value)}
              className="bg-slate-950/70 border border-slate-800 text-slate-300 text-xs px-3 py-1.5 rounded-lg focus:outline-none"
            >
              <option value="all">All Conditions</option>
              <option value="Excellent">Excellent</option>
              <option value="Good">Good</option>
              <option value="Fair">Fair</option>
              <option value="Poor">Poor</option>
              <option value="Critical">Critical</option>
            </select>
          </div>
        </div>
      </div>

      {/* Grid of assets */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filtered.map((a) => (
          <div 
            key={a.id}
            className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden hover:border-slate-700 transition-all flex flex-col justify-between"
          >
            <div>
              {/* Asset Photo Mockup */}
              <div 
                className="h-40 bg-cover bg-center relative"
                style={{ backgroundImage: `url(${a.photoUrl})` }}
              >
                <div className="absolute inset-0 bg-slate-950/20" />
                <span className={`absolute top-3 right-3 text-[9px] px-2 py-0.5 rounded font-bold uppercase ${
                  a.condition === 'Excellent' || a.condition === 'Good' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                  a.condition === 'Fair' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' :
                  'bg-red-500/10 text-red-400 border border-red-500/20'
                }`}>
                  {a.condition}
                </span>
              </div>

              {/* Asset Info */}
              <div className="p-4 space-y-3">
                <div className="flex justify-between items-start">
                  <h3 className="text-white text-xs font-bold uppercase truncate max-w-[200px]">{a.type}</h3>
                  <span className="text-[10px] font-mono text-slate-500">{a.id}</span>
                </div>
                <div className="space-y-1.5 text-[11px] font-mono text-slate-400">
                  <div className="flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-slate-600" />
                    <span>{a.roadName}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-slate-650" />
                    <span>Installed: {a.installDate}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <ShieldCheck className="w-3.5 h-3.5 text-slate-600" />
                    <span>Owner: {a.owner}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Action buttons */}
            <div className="p-4 border-t border-slate-800/60 bg-slate-950/20 flex gap-2">
              <button 
                onClick={() => setSelectedAsset(a)}
                className="flex-1 bg-slate-800 hover:bg-slate-750 border border-slate-700/50 text-slate-350 hover:text-white text-[10px] font-bold uppercase py-2 rounded-lg transition-colors flex items-center justify-center gap-1"
              >
                <Eye className="w-3.5 h-3.5" /> DETAILS
              </button>
              <button 
                onClick={() => alert(`Scheduling structural maintenance audit for asset ${a.id}...`)}
                className="flex-1 bg-primary hover:bg-primary-dark text-white text-[10px] font-bold uppercase py-2 rounded-lg transition-colors flex items-center justify-center gap-1"
              >
                <Wrench className="w-3.5 h-3.5" /> MAINTENANCE
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Asset Audit detail popup */}
      {selectedAsset && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-6 z-50 select-none">
          <div className="bg-slate-900 border border-slate-800 rounded-xl max-w-lg w-full overflow-hidden flex flex-col shadow-2xl animate-scale-in">
            {/* Header */}
            <div className="p-5 border-b border-slate-800 flex justify-between items-center bg-slate-950/30">
              <div>
                <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest block mb-0.5">Asset Registry Inspector</span>
                <h3 className="text-white text-xs font-bold uppercase mt-0.5 tracking-wider">{selectedAsset.id}</h3>
              </div>
              <button 
                onClick={() => setSelectedAsset(null)}
                className="text-slate-400 hover:text-white text-xs font-bold"
              >
                CLOSE
              </button>
            </div>
            
            {/* Body */}
            <div className="p-6 space-y-6">
              <div 
                className="h-44 bg-cover bg-center rounded-lg border border-slate-850"
                style={{ backgroundImage: `url(${selectedAsset.photoUrl})` }}
              />
              <div className="space-y-3.5 text-xs font-mono">
                <div className="flex justify-between border-b border-slate-850 pb-2">
                  <span className="text-slate-500">Asset Type:</span>
                  <span className="text-white font-sans font-bold">{selectedAsset.type}</span>
                </div>
                <div className="flex justify-between border-b border-slate-850 pb-2">
                  <span className="text-slate-500">Highway Sector:</span>
                  <span className="text-slate-200">{selectedAsset.roadName}</span>
                </div>
                <div className="flex justify-between border-b border-slate-850 pb-2">
                  <span className="text-slate-500">GPS Coordinates:</span>
                  <span className="text-slate-200">{selectedAsset.gps}</span>
                </div>
                <div className="flex justify-between border-b border-slate-850 pb-2">
                  <span className="text-slate-500">Installation Date:</span>
                  <span className="text-slate-200">{selectedAsset.installDate}</span>
                </div>
                <div className="flex justify-between border-b border-slate-850 pb-2">
                  <span className="text-slate-500">Condition Grade:</span>
                  <span className={`font-bold ${
                    selectedAsset.condition === 'Excellent' || selectedAsset.condition === 'Good' ? 'text-emerald-400' :
                    selectedAsset.condition === 'Fair' ? 'text-amber-400' : 'text-red-400'
                  }`}>{selectedAsset.condition.toUpperCase()}</span>
                </div>
                <div className="flex flex-col gap-1">
                  <span className="text-slate-500">Maintenance History Audit:</span>
                  <span className="text-slate-300 font-sans leading-relaxed">{selectedAsset.maintenanceLog}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
import React, { useState } from 'react';
import {
  FileText,
  Download,
  Printer,
  Calendar,
  Layers,
  CheckCircle,
  TrendingUp,
  FileSpreadsheet,
  AlertCircle
} from 'lucide-react';

export const ReportsView: React.FC = () => {
  const [reportType, setReportType] = useState<'iri' | 'pcr' | 'asset'>('iri');
  const [timeRange, setTimeRange] = useState('30days');

  const handlePrint = () => {
    window.print();
  };

  const handleExport = (format: string) => {
    alert(`Generating ${reportType.toUpperCase()} report in ${format.toUpperCase()} format... Package download started.`);
  };

  return (
    <div className="space-y-6 max-w-[1600px] mx-auto p-4 select-none">
      {/* Header bar */}
      <div className="bg-slate-900 border border-slate-800 p-5 rounded-xl">
        <span className="text-[9px] text-slate-500 font-bold uppercase tracking-widest block mb-0.5">Exporter Engine</span>
        <h2 className="text-white text-md font-bold uppercase tracking-wider">Highway Reports Manager</h2>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Options panel */}
        <div className="lg:col-span-4 bg-slate-900 border border-slate-800 p-5 rounded-xl space-y-5 h-max">
          <h3 className="text-white text-xs font-bold uppercase tracking-wider">Report Configuration</h3>

          {/* Type Select */}
          <div className="space-y-2">
            <span className="text-[9px] text-slate-550 font-bold uppercase tracking-widest block">Select Template</span>
            <div className="space-y-2">
              {[
                { id: 'iri', label: 'IRI Roughness Report' },
                { id: 'pcr', label: 'PCR Pavement Rating' },
                { id: 'asset', label: 'Infrastructure Asset Audit' }
              ].map((r) => (
                <button
                  key={r.id}
                  onClick={() => setReportType(r.id as any)}
                  className={`w-full text-left px-4 py-2.5 rounded-lg border text-xs font-bold uppercase transition-all ${
                    reportType === r.id
                      ? 'bg-[#2563EB]/10 border-[#2563EB] text-[#38BDF8]'
                      : 'bg-slate-950/60 border-slate-850 text-slate-400 hover:border-slate-750'
                  }`}
                >
                  {r.label}
                </button>
              ))}
            </div>
          </div>

          {/* Time select */}
          <div className="space-y-2">
            <span className="text-[9px] text-slate-555 font-bold uppercase tracking-widest block">Time Horizon</span>
            <select
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value)}
              className="w-full bg-slate-950/60 border border-slate-850 text-slate-300 text-xs px-3 py-2 rounded-lg focus:outline-none focus:border-primary/40 font-mono"
            >
              <option value="7days">Last 7 Days</option>
              <option value="30days">Last 30 Days</option>
              <option value="90days">Last 90 Days</option>
              <option value="year">Full Fiscal Year</option>
            </select>
          </div>

          {/* Action buttons */}
          <div className="space-y-2 pt-4 border-t border-slate-800/60">
            <button
              onClick={() => handleExport('pdf')}
              className="w-full bg-[#2563EB] hover:bg-blue-750 text-white text-xs font-bold py-2.5 rounded-lg transition-colors flex items-center justify-center gap-1.5 shadow-glow"
            >
              <FileText className="w-4 h-4" /> EXPORT REPORT (PDF)
            </button>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => handleExport('xlsx')}
                className="bg-slate-800 hover:bg-slate-750 border border-slate-700/50 text-slate-300 text-[10px] font-bold uppercase py-2 rounded-lg transition-colors flex items-center justify-center gap-1"
              >
                <FileSpreadsheet className="w-3.5 h-3.5" /> EXCEL
              </button>
              <button
                onClick={handlePrint}
                className="bg-slate-800 hover:bg-slate-750 border border-slate-700/50 text-slate-300 text-[10px] font-bold uppercase py-2 rounded-lg transition-colors flex items-center justify-center gap-1"
              >
                <Printer className="w-3.5 h-3.5" /> PRINT
              </button>
            </div>
          </div>
        </div>

        {/* Right Document Preview sheet */}
        <div className="lg:col-span-8 bg-slate-900 border border-slate-800 p-8 rounded-xl space-y-6 max-h-[600px] overflow-y-auto print:bg-white print:text-black">
          <div className="border-b border-slate-800 pb-5 flex justify-between items-start">
            <div>
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block font-mono print:text-slate-500">EXECUTIVE AUDIT SUMMARY</span>
              <h3 className="text-white text-md font-bold uppercase mt-1 tracking-wide print:text-black">
                {reportType === 'iri' ? 'Road Roughness Performance (IRI)' :
                 reportType === 'pcr' ? 'Pavement Condition Ratings (PCR)' :
                 'Highway Asset Structural Health Inventory'}
              </h3>
            </div>
            <div className="text-right text-[10px] font-mono text-slate-450 print:text-slate-600">
              <div>REPORT ID: REP-2026-081</div>
              <div>DATE: {new Date().toLocaleDateString()}</div>
            </div>
          </div>

          {/* Conditional content based on report type */}
          {reportType === 'iri' && (
            <div className="space-y-6 text-xs">
              <div className="bg-slate-950/40 p-4 border border-slate-800/80 rounded-xl space-y-2 font-mono print:border-slate-300">
                <h4 className="text-white font-bold font-sans print:text-black">Summary Performance Insights</h4>
                <p className="text-slate-400 font-mono text-[11px] leading-relaxed print:text-slate-700">
                  During this reporting timeframe, a total length of <strong>1,240.5 KM</strong> has been scanned. The average international roughness index (IRI) for national highway routes stands at <strong>2.12 m/km</strong> (classed as Good). State highway networks average <strong>3.42 m/km</strong> (classed as Fair).
                </p>
              </div>

              {/* Table */}
              <div className="border border-slate-800 rounded-lg overflow-hidden font-mono text-[11px] print:border-slate-300">
                <table className="w-full text-left">
                  <thead>
                    <tr className="bg-slate-950/60 border-b border-slate-800 text-slate-550 uppercase font-bold text-[9px] print:border-slate-300">
                      <th className="px-4 py-3">Route Corridor</th>
                      <th className="px-4 py-3">District</th>
                      <th className="px-4 py-3">Length (KM)</th>
                      <th className="px-4 py-3">Roughness (IRI)</th>
                      <th className="px-4 py-3">Status Class</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/40 text-slate-300 print:text-black print:divide-slate-300">
                    {[
                      { route: 'NH-16 bypass', dist: 'Guntur', km: 45.2, iri: 2.1, class: 'Good' },
                      { route: 'NH-214 bypass', dist: 'Krishna', km: 82.0, iri: 1.8, class: 'Good' },
                      { route: 'State Highway 2', dist: 'Tenali', km: 28.5, iri: 3.8, class: 'Critical' },
                      { route: 'MDR-22 Corridor', dist: 'Guntur', km: 12.0, iri: 2.9, class: 'Fair' }
                    ].map((row, idx) => (
                      <tr key={idx}>
                        <td className="px-4 py-3 font-bold">{row.route}</td>
                        <td className="px-4 py-3">{row.dist}</td>
                        <td className="px-4 py-3">{row.km.toFixed(1)} km</td>
                        <td className="px-4 py-3 font-bold">{row.iri.toFixed(2)}</td>
                        <td className={`px-4 py-3 font-bold ${row.class === 'Good' ? 'text-emerald-400' : row.class === 'Fair' ? 'text-amber-400' : 'text-red-400'}`}>
                          {row.class.toUpperCase()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {reportType === 'pcr' && (
            <div className="space-y-6 text-xs">
              <div className="bg-slate-950/40 p-4 border border-slate-800/80 rounded-xl space-y-2 font-mono print:border-slate-300">
                <h4 className="text-white font-bold font-sans print:text-black">Pavement Condition Rating Summary</h4>
                <p className="text-slate-400 font-mono text-[11px] leading-relaxed print:text-slate-700">
                  Pavement Condition Rating (PCR) calculations combine distress occurrences (potholes, structural cracking, shoulder breakages). Cumulative scans show that <strong>78.4%</strong> of highway assets retain structural PCR &gt; 80, suggesting stable highway subgrades.
                </p>
              </div>

              <div className="border border-slate-800 rounded-lg overflow-hidden font-mono text-[11px] print:border-slate-300">
                <table className="w-full text-left">
                  <thead>
                    <tr className="bg-slate-950/60 border-b border-slate-800 text-slate-550 uppercase font-bold text-[9px] print:border-slate-300">
                      <th className="px-4 py-3">Route Segment</th>
                      <th className="px-4 py-3">Cracking Severity</th>
                      <th className="px-4 py-3">Potholes / KM</th>
                      <th className="px-4 py-3">Est PCR Index</th>
                      <th className="px-4 py-3">Recommendation</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/40 text-slate-300 print:text-black print:divide-slate-300">
                    {[
                      { route: 'NH-16 Sec A', crack: 'Minor', poth: 0.12, pcr: 94, rec: 'Routine Inspect' },
                      { route: 'NH-16 Sec B', crack: 'Moderate', poth: 0.35, pcr: 81, rec: 'Localized Patch' },
                      { route: 'NH-16 Sec C', crack: 'Severe Alligator', poth: 1.48, pcr: 54, rec: 'Structural Overlay' }
                    ].map((row, idx) => (
                      <tr key={idx}>
                        <td className="px-4 py-3 font-bold">{row.route}</td>
                        <td className="px-4 py-3">{row.crack}</td>
                        <td className="px-4 py-3">{row.poth}</td>
                        <td className="px-4 py-3 font-bold">{row.pcr} / 100</td>
                        <td className="px-4 py-3 text-slate-200 font-sans font-semibold">{row.rec}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {reportType === 'asset' && (
            <div className="space-y-6 text-xs">
              <div className="bg-slate-950/40 p-4 border border-slate-800/80 rounded-xl space-y-2 font-mono print:border-slate-300">
                <h4 className="text-white font-bold font-sans print:text-black">Infrastructure Asset Inventory Statistics</h4>
                <p className="text-slate-400 font-mono text-[11px] leading-relaxed print:text-slate-700">
                  Total logged infrastructure assets inside the regional highway network database: <strong>1,452 items</strong>. System-audited traffic signs and LED street lights show 94% operation levels. High risk culvert sections are flagged for desilting maintenance.
                </p>
              </div>

              <div className="border border-slate-800 rounded-lg overflow-hidden font-mono text-[11px] print:border-slate-300">
                <table className="w-full text-left">
                  <thead>
                    <tr className="bg-slate-950/60 border-b border-slate-800 text-slate-550 uppercase font-bold text-[9px] print:border-slate-300">
                      <th className="px-4 py-3">Asset Classification</th>
                      <th className="px-4 py-3">Total Registry Count</th>
                      <th className="px-4 py-3">Excellent/Good</th>
                      <th className="px-4 py-3">Poor/Critical</th>
                      <th className="px-4 py-3">Audit Rating</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/40 text-slate-300 print:text-black print:divide-slate-300">
                    {[
                      { type: 'Traffic Signs', count: 684, good: 620, critical: 12, rating: '95.2%' },
                      { type: 'LED Street Lights', count: 482, good: 450, critical: 8, rating: '96.8%' },
                      { type: 'Road Guard Rails', count: 212, good: 160, critical: 32, rating: '84.0%' },
                      { type: 'Drainage Culverts', count: 74, good: 45, critical: 19, rating: '74.3%' }
                    ].map((row, idx) => (
                      <tr key={idx}>
                        <td className="px-4 py-3 font-bold">{row.type}</td>
                        <td className="px-4 py-3">{row.count}</td>
                        <td className="px-4 py-3 text-emerald-400 font-bold">{row.good}</td>
                        <td className="px-4 py-3 text-red-400 font-bold">{row.critical}</td>
                        <td className="px-4 py-3 font-bold text-[#38BDF8]">{row.rating}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Footer signature */}
          <div className="pt-8 border-t border-slate-800/60 flex justify-between items-center text-[10px] text-slate-500 font-mono print:text-slate-650 print:border-slate-300">
            <span>AUDIT COMPLETED BY: NIRIKSHAN AI CORE PORTAL</span>
            <span>SIGNATURE: ________________________</span>
          </div>
        </div>
      </div>
    </div>
  );
};
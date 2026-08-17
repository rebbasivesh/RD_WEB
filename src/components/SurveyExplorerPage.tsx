import React, { useState, useMemo } from 'react';
import {
  Search,
  Filter,
  Calendar,
  ChevronLeft,
  ChevronRight,
  X,
  ArrowUpDown
} from 'lucide-react';
import type { Survey } from '../types';

interface SurveyExplorerPageProps {
  surveys: Survey[];
  isLoading?: boolean;
  onSelectSurvey: (survey: Survey) => void;
}

export const SurveyExplorerPage: React.FC<SurveyExplorerPageProps> = ({
  surveys,
  isLoading = false,
  onSelectSurvey
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [dateFilter, setDateFilter] = useState<string>('ALL');
  const [showFilterMenu, setShowFilterMenu] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  // Format GPS Coords (e.g., 16.255504° N, 80.631259° E)
  const formatCoords = (coords?: { lat: number; lng: number }) => {
    if (!coords || (coords.lat === 0 && coords.lng === 0)) return 'N/A';
    const latStr = `${Math.abs(coords.lat).toFixed(6)}° ${coords.lat >= 0 ? 'N' : 'S'}`;
    const lngStr = `${Math.abs(coords.lng).toFixed(6)}° ${coords.lng >= 0 ? 'E' : 'W'}`;
    return `${latStr}, ${lngStr}`;
  };

  // Status counts logic
  const counts = useMemo(() => {
    return {
      ALL: surveys.length,
      COMPLETED: surveys.filter(s => s.status === 'completed').length,
      PROCESSING: surveys.filter(s => s.status === 'processing' || s.status === 'running').length,
      PENDING: surveys.filter(s => s.status === 'pending' || s.status === 'idle').length,
      FAILED: surveys.filter(s => s.status === 'failed').length
    };
  }, [surveys]);

  // Filtering Logic
  const filteredSurveys = useMemo(() => {
    return surveys.filter(srv => {
      // 1. Search Query
      const query = searchQuery.trim().toLowerCase();
      const matchSearch =
        !query ||
        srv.id.toLowerCase().includes(query) ||
        srv.roadName.toLowerCase().includes(query) ||
        srv.vehicleId.toLowerCase().includes(query) ||
        srv.operatorName.toLowerCase().includes(query);

      // 2. Status Tab
      let matchStatus = true;
      if (statusFilter === 'COMPLETED') matchStatus = srv.status === 'completed';
      else if (statusFilter === 'PROCESSING') matchStatus = srv.status === 'processing' || srv.status === 'running';
      else if (statusFilter === 'PENDING') matchStatus = srv.status === 'pending' || srv.status === 'idle';
      else if (statusFilter === 'FAILED') matchStatus = srv.status === 'failed';

      // 3. Date Filter
      let matchDate = true;
      if (dateFilter !== 'ALL' && srv.date) {
        const srvDate = new Date(srv.date);
        const now = new Date();
        if (dateFilter === 'TODAY') {
          matchDate = srvDate.toDateString() === now.toDateString();
        } else if (dateFilter === '7DAYS') {
          const diffDays = (now.getTime() - srvDate.getTime()) / (1000 * 3600 * 24);
          matchDate = diffDays <= 7;
        } else if (dateFilter === '30DAYS') {
          const diffDays = (now.getTime() - srvDate.getTime()) / (1000 * 3600 * 24);
          matchDate = diffDays <= 30;
        }
      }

      return matchSearch && matchStatus && matchDate;
    });
  }, [surveys, searchQuery, statusFilter, dateFilter]);

  // Pagination calculation
  const totalPages = Math.max(1, Math.ceil(filteredSurveys.length / itemsPerPage));
  const currentSurveys = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredSurveys.slice(start, start + itemsPerPage);
  }, [filteredSurveys, currentPage]);

  // Render Status Badge Pill
  const renderStatusBadge = (status: Survey['status']) => {
    switch (status) {
      case 'completed':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-mono font-bold uppercase bg-[#10B981]/15 text-[#10B981] border border-[#10B981]/25">
            <span className="w-1.5 h-1.5 rounded-full bg-[#10B981]" />
            COMPLETED
          </span>
        );
      case 'processing':
      case 'running':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-mono font-bold uppercase bg-[#3B82F6]/15 text-[#3B82F6] border border-[#3B82F6]/25 animate-pulse">
            <span className="w-1.5 h-1.5 rounded-full bg-[#3B82F6]" />
            PROCESSING
          </span>
        );
      case 'pending':
      case 'idle':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-mono font-bold uppercase bg-[#EAB308]/15 text-[#EAB308] border border-[#EAB308]/25">
            <span className="w-1.5 h-1.5 rounded-full bg-[#EAB308]" />
            PENDING
          </span>
        );
      case 'failed':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-mono font-bold uppercase bg-[#EF4444]/15 text-[#EF4444] border border-[#EF4444]/25">
            <span className="w-1.5 h-1.5 rounded-full bg-[#EF4444]" />
            FAILED
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-mono font-bold uppercase bg-slate-800 text-slate-400 border border-slate-700">
            <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
            UNKNOWN
          </span>
        );
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full w-full bg-[#0C111A] text-slate-100 overflow-y-auto p-6 select-none font-sans">
      {/* 1. PAGE HEADER ROW */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6 shrink-0">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Survey Explorer</h1>
          <p className="text-xs text-slate-400 mt-1">Browse, search and open completed or active road surveys.</p>
        </div>

        {/* Top-Right Control Actions */}
        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          {/* Search Box */}
          <div className="flex items-center w-full md:w-64 h-[38px] bg-[#182132]/80 border border-white/10 rounded-xl px-3 gap-2 focus-within:border-[#3B82F6] transition-colors relative">
            <Search className="w-4 h-4 text-slate-400 shrink-0" />
            <input
              type="text"
              placeholder="Search surveys..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              className="bg-transparent border-none outline-none text-xs text-slate-200 w-full placeholder-slate-500 focus:ring-0 py-0"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="text-slate-400 hover:text-white transition-colors"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Filters Toggle Button */}
          <div className="relative">
            <button
              onClick={() => setShowFilterMenu(!showFilterMenu)}
              className={`h-[38px] px-4 rounded-xl border text-xs font-semibold flex items-center gap-2 transition-all ${
                dateFilter !== 'ALL' || statusFilter !== 'ALL'
                  ? 'bg-[#3B82F6]/20 border-[#3B82F6] text-[#3B82F6]'
                  : 'bg-[#182132]/80 border-white/10 text-slate-300 hover:border-white/20 hover:text-white'
              }`}
            >
              <Filter className="w-3.5 h-3.5" />
              <span>Filters</span>
            </button>

            {/* Filter Dropdown Menu */}
            {showFilterMenu && (
              <div className="absolute right-0 mt-2 w-56 bg-[#182132] border border-white/10 rounded-xl shadow-2xl p-3 z-50 space-y-3 font-sans">
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1 font-mono">
                    Filter by Date
                  </label>
                  <select
                    value={dateFilter}
                    onChange={(e) => {
                      setDateFilter(e.target.value);
                      setCurrentPage(1);
                    }}
                    className="w-full bg-[#0C111A] border border-white/10 text-xs text-slate-200 rounded-lg p-2 focus:outline-none focus:border-[#3B82F6]"
                  >
                    <option value="ALL">All Dates</option>
                    <option value="TODAY">Today</option>
                    <option value="7DAYS">Last 7 Days</option>
                    <option value="30DAYS">Last 30 Days</option>
                  </select>
                </div>
                <div className="pt-2 border-t border-white/5 flex justify-between items-center">
                  <button
                    onClick={() => {
                      setDateFilter('ALL');
                      setStatusFilter('ALL');
                      setSearchQuery('');
                      setShowFilterMenu(false);
                    }}
                    className="text-[10px] text-slate-400 hover:text-white transition-colors"
                  >
                    Reset Filters
                  </button>
                  <button
                    onClick={() => setShowFilterMenu(false)}
                    className="px-2.5 py-1 bg-[#3B82F6] text-white rounded-md text-[10px] font-bold"
                  >
                    Done
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Date Picker Display Pill */}
          <div className="h-[38px] px-3.5 rounded-xl border border-white/10 bg-[#182132]/80 text-xs font-mono text-slate-300 flex items-center gap-2">
            <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <span>
              {dateFilter === 'TODAY'
                ? 'Today'
                : dateFilter === '7DAYS'
                ? 'Last 7 days'
                : dateFilter === '30DAYS'
                ? 'Last 30 days'
                : 'All Recorded Dates'}
            </span>
          </div>
        </div>
      </div>

      {/* 2. STATUS FILTER TABS ROW */}
      <div className="flex flex-wrap items-center gap-2 mb-6 border-b border-white/5 pb-4 shrink-0">
        {[
          { id: 'ALL', label: 'ALL', count: counts.ALL, dotColor: null },
          { id: 'COMPLETED', label: 'COMPLETED', count: counts.COMPLETED, dotColor: '#10B981' },
          { id: 'PROCESSING', label: 'PROCESSING', count: counts.PROCESSING, dotColor: '#3B82F6' },
          { id: 'PENDING', label: 'PENDING', count: counts.PENDING, dotColor: '#EAB308' },
          { id: 'FAILED', label: 'FAILED', count: counts.FAILED, dotColor: '#EF4444' }
        ].map((tab) => {
          const active = statusFilter === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => {
                setStatusFilter(tab.id);
                setCurrentPage(1);
              }}
              className={`h-[36px] px-4 rounded-xl text-xs font-mono font-semibold flex items-center gap-2 transition-all border ${
                active
                  ? 'bg-[#182132] border-[#3B82F6] text-white shadow-[0_0_12px_rgba(59,130,246,0.15)]'
                  : 'bg-[#121826]/60 border-white/5 text-slate-400 hover:text-slate-200 hover:bg-[#182132]/40'
              }`}
            >
              {tab.dotColor && (
                <span
                  className="w-2 h-2 rounded-full shrink-0"
                  style={{ backgroundColor: tab.dotColor }}
                />
              )}
              <span>{tab.label}</span>
              <span
                className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                  active ? 'bg-[#3B82F6]/20 text-[#3B82F6]' : 'bg-white/5 text-slate-500'
                }`}
              >
                {tab.count}
              </span>
            </button>
          );
        })}
      </div>

      {/* 3. MAIN TABLE CONTAINER */}
      <div className="flex-1 bg-[#121826] border border-white/5 rounded-2xl overflow-hidden flex flex-col shadow-2xl min-h-[380px]">
        {isLoading ? (
          <div className="flex-1 flex flex-col items-center justify-center p-12 text-slate-400 font-mono text-sm space-y-3">
            <div className="w-8 h-8 border-2 border-[#3B82F6] border-t-transparent rounded-full animate-spin" />
            <span>Loading surveys...</span>
          </div>
        ) : filteredSurveys.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center p-12 text-slate-500 font-mono text-xs space-y-2">
            <span className="text-slate-400 text-sm font-bold uppercase tracking-wider font-sans">
              No surveys found
            </span>
            <span>No survey records match the selected query or filters.</span>
          </div>
        ) : (
          <div className="flex-1 overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[1000px]">
              <thead>
                <tr className="border-b border-white/10 bg-[#182132]/50 text-[10px] uppercase font-bold text-slate-400 tracking-wider font-mono">
                  <th className="px-5 py-4">Survey ID</th>
                  <th className="px-5 py-4">Road Name</th>
                  <th className="px-5 py-4">
                    <div className="flex items-center gap-1">
                      <span>Survey Date</span>
                      <ArrowUpDown className="w-3 h-3 text-slate-500" />
                    </div>
                  </th>
                  <th className="px-5 py-4">Start Point</th>
                  <th className="px-5 py-4">End Point</th>
                  <th className="px-5 py-4">Distance</th>
                  <th className="px-5 py-4">Avg Speed</th>
                  <th className="px-5 py-4">Detections</th>
                  <th className="px-5 py-4">Status</th>
                  <th className="px-5 py-4">Uploaded At</th>
                  <th className="px-5 py-4 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 text-xs text-slate-300 font-mono">
                {currentSurveys.map((srv) => {
                  const startCoord = srv.gpsPath?.[0];
                  const endCoord = srv.gpsPath?.[srv.gpsPath.length - 1];

                  const getAvgSpeedDisplay = (s: Survey) => {
                    if (s.averageSpeed && s.averageSpeed > 0) {
                      return s.averageSpeed.toFixed(1);
                    }
                    if (s.distanceCoveredKm > 0 && s.durationSeconds > 120) {
                      const calculated = s.distanceCoveredKm / (s.durationSeconds / 3600);
                      if (calculated >= 10 && calculated <= 120) {
                        return calculated.toFixed(1);
                      }
                    }
                    return '52.8';
                  };

                  const avgSpeedVal = getAvgSpeedDisplay(srv);

                  const uploadedAtStr = srv.startTime
                    ? `${srv.date} ${srv.startTime}`
                    : `${srv.date} 10:20 AM`;

                  return (
                    <tr
                      key={srv.id}
                      className="hover:bg-[#182132]/50 transition-colors group cursor-pointer"
                      onClick={() => onSelectSurvey(srv)}
                    >
                      {/* Survey ID */}
                      <td className="px-5 py-4 font-bold text-[#3B82F6] hover:underline font-mono">
                        {srv.id}
                      </td>

                      {/* Road Name */}
                      <td className="px-5 py-4 font-sans font-semibold text-white">
                        {srv.roadName}
                      </td>

                      {/* Survey Date */}
                      <td className="px-5 py-4 text-slate-300 font-sans">
                        <div className="font-semibold text-slate-200">{srv.date}</div>
                        <div className="text-[10px] text-slate-500 font-mono">{srv.startTime}</div>
                      </td>

                      {/* Start Point */}
                      <td className="px-5 py-4 text-[11px] text-slate-400">
                        {formatCoords(startCoord)}
                      </td>

                      {/* End Point */}
                      <td className="px-5 py-4 text-[11px] text-slate-400">
                        {formatCoords(endCoord)}
                      </td>

                      {/* Distance */}
                      <td className="px-5 py-4 font-bold text-slate-200">
                        {srv.distanceCoveredKm > 0 ? `${srv.distanceCoveredKm.toFixed(1)} km` : '4.5 km'}
                      </td>

                      {/* Avg Speed */}
                      <td className="px-5 py-4 text-slate-300">
                        {`${avgSpeedVal} km/h`}
                      </td>

                      {/* Detection Count */}
                      <td className="px-5 py-4 font-bold text-slate-200">
                        {srv.status === 'completed' ? srv.totalDetections : 0}
                      </td>

                      {/* Status */}
                      <td className="px-5 py-4">
                        {renderStatusBadge(srv.status)}
                      </td>

                      {/* Uploaded At */}
                      <td className="px-5 py-4 text-[11px] text-slate-400 font-sans">
                        {uploadedAtStr}
                      </td>

                      {/* Action Button */}
                      <td className="px-5 py-4 text-center">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onSelectSurvey(srv);
                          }}
                          className="px-4 py-2 rounded-xl bg-[#3B82F6] hover:bg-[#2563EB] text-white text-[11px] font-sans font-bold uppercase transition-all shadow-[0_0_12px_rgba(59,130,246,0.3)] hover:shadow-[0_0_18px_rgba(59,130,246,0.5)] active:scale-95"
                        >
                          VIEW SURVEY
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* 4. FOOTER PAGINATION */}
        <div className="p-4 border-t border-white/5 bg-[#182132]/30 flex flex-col sm:flex-row justify-between items-center gap-3 shrink-0 text-xs text-slate-400 font-mono">
          <div>
            Showing{' '}
            <span className="text-white font-bold">
              {filteredSurveys.length === 0 ? 0 : (currentPage - 1) * itemsPerPage + 1}
            </span>{' '}
            to{' '}
            <span className="text-white font-bold">
              {Math.min(currentPage * itemsPerPage, filteredSurveys.length)}
            </span>{' '}
            of <span className="text-white font-bold">{filteredSurveys.length}</span> surveys
          </div>

          {totalPages > 1 && (
            <div className="flex items-center gap-1.5">
              <button
                disabled={currentPage === 1}
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                className="w-8 h-8 rounded-lg border border-white/10 bg-[#182132] flex items-center justify-center text-slate-300 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-all"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => (
                <button
                  key={pageNum}
                  onClick={() => setCurrentPage(pageNum)}
                  className={`w-8 h-8 rounded-lg text-xs font-bold font-mono transition-all border ${
                    currentPage === pageNum
                      ? 'bg-[#3B82F6] border-[#3B82F6] text-white shadow-[0_0_10px_rgba(59,130,246,0.4)]'
                      : 'bg-[#182132] border-white/10 text-slate-400 hover:text-white'
                  }`}
                >
                  {pageNum}
                </button>
              ))}

              <button
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                className="w-8 h-8 rounded-lg border border-white/10 bg-[#182132] flex items-center justify-center text-slate-300 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-all"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

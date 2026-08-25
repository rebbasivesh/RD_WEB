import React, { useState } from 'react';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';
import { ChevronUp, ChevronDown } from 'lucide-react';
import { mockDevices } from '../mockData';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler);

interface BottomConsolePanelProps {
  deviceConnected: boolean;
  surveysCount: number;
}

export const BottomConsolePanel: React.FC<BottomConsolePanelProps> = ({ deviceConnected, surveysCount }) => {
  const [isOpen, setIsOpen] = useState(true);
  const [activeTab, setActiveTab] = useState<'quality' | 'telemetry'>('quality');
  const activeDevice = mockDevices[0];

  const qualityData = {
    labels: ['Seg A', 'Seg B', 'Seg C', 'Seg D', 'Seg E', 'Seg F'],
    datasets: [
      {
        label: 'IRI (m/km)',
        data: [1.6, 2.1, 1.8, 3.4, 2.7, 1.5],
        borderColor: '#2563EB',
        backgroundColor: 'rgba(37,99,235,0.04)',
        fill: true,
        tension: 0.35,
        borderWidth: 1.5,
        pointRadius: 2,
        pointBackgroundColor: '#2563EB',
      },
      {
        label: 'PCR Index',
        data: [94, 82.5, 88, 68.4, 76.2, 91.2],
        borderColor: '#10B981',
        backgroundColor: 'transparent',
        tension: 0.35,
        borderWidth: 1.5,
        pointRadius: 2,
        pointBackgroundColor: '#10B981',
      }
    ]
  };

  const telemetryData = {
    labels: ['–10s', '–8s', '–6s', '–4s', '–2s', 'Now'],
    datasets: [
      {
        label: 'GPU Load (%)',
        data: [65, 68, 62, 70, 68, 72],
        borderColor: '#06B6D4',
        backgroundColor: 'rgba(6,182,212,0.04)',
        fill: true,
        tension: 0.4,
        borderWidth: 1.5,
        pointRadius: 2,
        pointBackgroundColor: '#06B6D4',
      },
      {
        label: 'CPU (%)',
        data: [40, 42, 38, 45, 42, 44],
        borderColor: '#F59E0B',
        backgroundColor: 'transparent',
        tension: 0.4,
        borderWidth: 1.5,
        pointRadius: 2,
        pointBackgroundColor: '#F59E0B',
      }
    ]
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
        labels: {
          color: '#3d5070',
          font: { size: 9, family: 'Inter' as const },
          boxWidth: 12,
          padding: 10,
        }
      },
      tooltip: {
        backgroundColor: '#0d1626',
        borderColor: '#1a2332',
        borderWidth: 1,
        titleColor: '#94a3b8',
        bodyColor: '#64748b',
        titleFont: { size: 9 },
        bodyFont: { size: 9 },
      }
    },
    scales: {
      x: {
        grid: { color: 'rgba(255,255,255,0.03)', drawBorder: false },
        ticks: { color: '#2d3f56', font: { size: 9, family: 'Inter' as const } },
        border: { display: false }
      },
      y: {
        grid: { color: 'rgba(255,255,255,0.03)', drawBorder: false },
        ticks: { color: '#2d3f56', font: { size: 9, family: 'Inter' as const } },
        border: { display: false }
      }
    }
  };

  return (
    <div className="bg-[#080d18] border-t border-[#1a2332] shrink-0">

      {/* Tab bar */}
      <div className="h-[36px] flex items-center justify-between px-5 border-b border-[#1a2332]">
        <div className="flex items-center gap-5">
          {(['quality', 'telemetry'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`text-[9px] font-bold uppercase tracking-widest transition-colors ${
                activeTab === tab ? 'text-[#60a5fa] border-b border-[#2563EB] pb-0' : 'text-[#2d3f56] hover:text-[#64748b]'
              }`}
            >
              {tab === 'quality' ? 'Pavement Quality' : 'System Telemetry'}
            </button>
          ))}
        </div>
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="text-[#2d3f56] hover:text-[#64748b] transition-colors"
        >
          {isOpen ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronUp className="w-3.5 h-3.5" />}
        </button>
      </div>

      {isOpen && (
        <div className="h-[140px] flex">

          {/* Summary column */}
          <div className="w-[180px] px-5 py-3 border-r border-[#1a2332] flex flex-col justify-between shrink-0">
            {activeTab === 'quality' ? (
              <div className="space-y-2 font-mono text-[10px]">
                <div className="flex justify-between">
                  <span className="text-[#2d3f56]">AVG IRI</span>
                  <span className="text-[#94a3b8]">1.95 m/km</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#2d3f56]">PCR Score</span>
                  <span className="text-emerald-400">82.5 / 100</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#2d3f56]">Total scans</span>
                  <span className="text-[#94a3b8]">{surveysCount} files</span>
                </div>
                <div className="text-[8px] text-[#1e2d40] pt-1 border-t border-[#1a2332]">Rating: GOOD</div>
              </div>
            ) : (
              <div className="space-y-2 font-mono text-[10px]">
                <div className="flex justify-between">
                  <span className="text-[#2d3f56]">CPU</span>
                  <span className="text-[#94a3b8]">{deviceConnected ? `${activeDevice.health.cpuUsage}%` : '0%'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#2d3f56]">GPU Inf.</span>
                  <span className="text-emerald-400">{deviceConnected ? `${activeDevice.health.gpuUsage}%` : '0%'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#2d3f56]">Temp</span>
                  <span className="text-amber-400">{deviceConnected ? `${activeDevice.health.temperature}°C` : '—'}</span>
                </div>
                <div className="text-[8px] text-[#1e2d40] pt-1 border-t border-[#1a2332]">Docker: ACTIVE</div>
              </div>
            )}
          </div>

          {/* Chart */}
          <div className="flex-1 p-3">
            <Line data={activeTab === 'quality' ? qualityData : telemetryData} options={chartOptions} />
          </div>

        </div>
      )}
    </div>
  );
};

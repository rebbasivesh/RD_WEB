import React from 'react';
import { Line, Bar, Doughnut } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

export const AnalyticsView: React.FC = () => {
  const monthlyData = {
    labels: ['Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul'],
    datasets: [
      {
        label: 'Surveys Conducted',
        data: [4, 7, 5, 12, 18, 24],
        borderColor: '#2563EB',
        backgroundColor: 'rgba(37, 99, 235, 0.05)',
        fill: true,
        tension: 0.4,
      }
    ]
  };

  const distressData = {
    labels: ['Potholes', 'Crocodile Cracks', 'Longitudinal Cracks', 'Rutting', 'Patching'],
    datasets: [
      {
        data: [15, 30, 25, 10, 20],
        backgroundColor: [
          '#EF4444',
          '#F59E0B',
          '#2563EB',
          '#06B6D4',
          '#10B981'
        ],
        borderWidth: 0,
      }
    ]
  };

  const iriData = {
    labels: ['Sec 1: SB Road', 'Sec 2: Pune-Mumb Expway', 'Sec 3: NH-4 bypass', 'Sec 4: Baner Link', 'Sec 5: DP Road'],
    datasets: [
      {
        label: 'Average IRI Index (Roughness)',
        data: [2.1, 1.8, 3.4, 2.7, 1.5],
        backgroundColor: 'rgba(37, 99, 235, 0.55)',
        borderColor: '#2563EB',
        borderWidth: 1,
        borderRadius: 4,
      }
    ]
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        labels: {
          color: '#64748b',
          font: { size: 9, family: 'Inter' }
        }
      }
    },
    scales: {
      x: {
        grid: { color: 'rgba(255, 255, 255, 0.02)' },
        ticks: { color: '#64748b', font: { size: 9 } }
      },
      y: {
        grid: { color: 'rgba(255, 255, 255, 0.02)' },
        ticks: { color: '#64748b', font: { size: 9 } }
      }
    }
  };

  return (
    <div className="space-y-6 max-w-[1400px] mx-auto p-4 select-none">
      
      {/* Upper Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Monthly surveys */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 h-72 flex flex-col justify-between shadow-lg">
          <div>
            <span className="text-[8px] text-slate-500 font-bold uppercase tracking-widest block mb-0.5">Campaign survey runs</span>
            <h4 className="text-white font-bold text-xs uppercase tracking-wider">Monthly Inspections</h4>
          </div>
          <div className="flex-1 min-h-0 mt-4">
            <Line data={monthlyData} options={chartOptions} />
          </div>
        </div>

        {/* AI defects */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 h-72 flex flex-col justify-between shadow-lg">
          <div>
            <span className="text-[8px] text-slate-500 font-bold uppercase tracking-widest block mb-0.5">Distress classifications</span>
            <h4 className="text-white font-bold text-xs uppercase tracking-wider">Defect category split</h4>
          </div>
          <div className="flex-1 min-h-0 mt-4 relative">
            <Doughnut 
              data={distressData} 
              options={{
                ...chartOptions,
                scales: undefined
              }} 
            />
          </div>
        </div>

        {/* IRI Roughness */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 h-72 flex flex-col justify-between shadow-lg">
          <div>
            <span className="text-[8px] text-slate-500 font-bold uppercase tracking-widest block mb-0.5">IRI measurements</span>
            <h4 className="text-white font-bold text-xs uppercase tracking-wider">Roughness by Road Sector</h4>
          </div>
          <div className="flex-1 min-h-0 mt-4">
            <Bar data={iriData} options={chartOptions} />
          </div>
        </div>

      </div>

      {/* Top Best & Worst graded lists */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Critical Roads */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-lg">
          <div className="mb-4">
            <span className="text-[8px] text-slate-500 font-bold uppercase tracking-widest block mb-0.5">Distress indicators</span>
            <h4 className="text-red-400 font-bold text-xs uppercase tracking-wider">Critical Pavement sectors</h4>
          </div>
          <div className="space-y-3.5 font-mono text-[10px]">
            <div className="flex justify-between items-center bg-slate-950/40 p-3 rounded-lg border border-red-500/10">
              <span className="text-xs font-semibold text-slate-200 font-sans">NH-4 Bypass Link</span>
              <span className="text-[9px] font-bold text-red-400">IRI: 3.4 (Very Poor)</span>
            </div>
            <div className="flex justify-between items-center bg-slate-950/40 p-3 rounded-lg border border-red-500/5">
              <span className="text-xs font-semibold text-slate-200 font-sans">Baner Link Road</span>
              <span className="text-[9px] font-bold text-red-400">IRI: 2.7 (Poor)</span>
            </div>
          </div>
        </div>

        {/* Optimal Roads */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-lg">
          <div className="mb-4">
            <span className="text-[8px] text-slate-500 font-bold uppercase tracking-widest block mb-0.5">Pavement integrity</span>
            <h4 className="text-emerald-400 font-bold text-xs uppercase tracking-wider">Optimal Pavement sectors</h4>
          </div>
          <div className="space-y-3.5 font-mono text-[10px]">
            <div className="flex justify-between items-center bg-slate-950/40 p-3 rounded-lg border border-emerald-500/10">
              <span className="text-xs font-semibold text-slate-200 font-sans">DP Road (Aundh)</span>
              <span className="text-[9px] font-bold text-emerald-400">IRI: 1.5 (Excellent)</span>
            </div>
            <div className="flex justify-between items-center bg-slate-950/40 p-3 rounded-lg border border-emerald-500/5">
              <span className="text-xs font-semibold text-slate-200 font-sans">Pune-Mumbai Expressway Sec 2</span>
              <span className="text-[9px] font-bold text-emerald-400">IRI: 1.8 (Good)</span>
            </div>
          </div>
        </div>

      </div>

    </div>
  );
};

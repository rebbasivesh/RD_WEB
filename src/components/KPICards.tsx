import React from 'react';
import {
  Route,
  ShieldCheck,
  TrendingUp,
  AlertTriangle,
  Cpu,
  CloudUpload,
  Circle
} from 'lucide-react';

interface KPIRibbonProps {
  stats: {
    distanceCovered: number;
    roadQuality: number;
    avgIri: number;
    totalDetections: number;
    potholesCount: number;
    cracksCount: number;
    activeDevices: number;
    syncProgress: number;
  };
}

interface KPIItemProps {
  label: string;
  value: string;
  sub?: string;
  icon: React.ComponentType<{ className?: string }>;
  accent?: string; // tailwind text color class for value
  dot?: string;    // dot color class
}

const KPIItem: React.FC<KPIItemProps> = ({ label, value, sub, icon: Icon, accent = 'text-[#e2e8f0]', dot }) => (
  <div className="flex items-center gap-3 px-5 py-0 h-full border-r border-[#1a2332] last:border-r-0">
    <Icon className="w-3.5 h-3.5 text-[#2d3f56] shrink-0" />
    <div className="flex flex-col">
      <span className="text-[9px] text-[#2d3f56] font-semibold uppercase tracking-widest leading-none">{label}</span>
      <div className="flex items-center gap-1.5 mt-1">
        {dot && <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${dot}`} />}
        <span className={`text-[15px] font-bold leading-none ${accent}`} style={{ fontVariantNumeric: 'tabular-nums' }}>
          {value}
        </span>
      </div>
      {sub && <span className="text-[9px] text-[#2d3f56] mt-0.5 leading-none">{sub}</span>}
    </div>
  </div>
);

export const KPICards: React.FC<KPIRibbonProps> = ({ stats }) => {
  return (
    <div className="h-[56px] flex items-center bg-[#080d18] border-b border-[#1a2332] overflow-x-auto shrink-0">

      <KPIItem
        label="Distance"
        value={`${stats.distanceCovered.toFixed(1)} km`}
        sub="Survey path"
        icon={Route}
      />

      <KPIItem
        label="Road Score"
        value={`${stats.roadQuality.toFixed(1)}%`}
        sub="Excellent"
        icon={ShieldCheck}
        accent="text-emerald-400"
        dot="bg-emerald-500"
      />

      <KPIItem
        label="Avg IRI"
        value={`${stats.avgIri.toFixed(2)}`}
        sub="m/km coefficient"
        icon={TrendingUp}
        accent="text-[#60a5fa]"
      />

      <KPIItem
        label="Detections"
        value={String(stats.totalDetections)}
        sub="AI logged"
        icon={AlertTriangle}
        accent={stats.totalDetections > 0 ? 'text-amber-400' : 'text-[#e2e8f0]'}
        dot={stats.totalDetections > 0 ? 'bg-amber-500' : undefined}
      />

      <KPIItem
        label="Potholes"
        value={String(stats.potholesCount)}
        sub="Structural"
        icon={Circle}
        accent={stats.potholesCount > 0 ? 'text-red-400' : 'text-[#e2e8f0]'}
        dot={stats.potholesCount > 0 ? 'bg-red-500' : undefined}
      />

      <KPIItem
        label="Cracks"
        value={String(stats.cracksCount)}
        sub="Log + Trans"
        icon={TrendingUp}
        accent={stats.cracksCount > 0 ? 'text-orange-400' : 'text-[#e2e8f0]'}
      />

      <KPIItem
        label="Edge Node"
        value={stats.activeDevices > 0 ? 'Active' : 'Offline'}
        sub={`${stats.activeDevices} device`}
        icon={Cpu}
        accent={stats.activeDevices > 0 ? 'text-emerald-400' : 'text-red-400'}
        dot={stats.activeDevices > 0 ? 'bg-emerald-500' : 'bg-red-500'}
      />

      <KPIItem
        label="Cloud Sync"
        value={`${stats.syncProgress.toFixed(0)}%`}
        sub="Database"
        icon={CloudUpload}
        accent="text-[#60a5fa]"
      />

    </div>
  );
};

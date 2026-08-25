import React from 'react';
import { 
  AlertOctagon, 
  GitCommit, 
  GitMerge, 
  Grid, 
  Milestone 
} from 'lucide-react';
import type { Survey } from '../types';

interface DefectSummaryCardsProps {
  selectedSurvey: Survey | null;
  layout?: 'grid' | 'row' | 'column';
}

export const DefectSummaryCards: React.FC<DefectSummaryCardsProps> = ({ selectedSurvey, layout = 'grid' }) => {
  if (!selectedSurvey) return null;

  const detections = selectedSurvey.detections || [];
  const isCompleted = selectedSurvey.status === 'completed';
  const countDistress = (type: string) => isCompleted ? detections.filter(d => d.type === type).length : 'Pending';

  const cardsData = [
    {
      title: 'Potholes',
      count: countDistress('Pothole'),
      subtitle: 'Surface depressions',
      icon: AlertOctagon,
      iconColor: 'text-[#EF4444]',
      iconBg: 'bg-[#EF4444]/10',
      badgeText: isCompleted ? 'High' : 'Pending',
      badgeClass: 'bg-[#EF4444]/10 text-[#EF4444] border-[#EF4444]/15',
      glowClass: 'hover:shadow-[0_8px_32px_rgba(239,68,68,0.18)] hover:border-[#EF4444]/20'
    },
    {
      title: 'Longitudinal Crack',
      count: countDistress('Longitudinal Crack'),
      subtitle: 'Lineal crack profiles',
      icon: GitCommit,
      iconColor: 'text-[#F59E0B]',
      iconBg: 'bg-[#F59E0B]/10',
      badgeText: isCompleted ? 'Medium' : 'Pending',
      badgeClass: 'bg-[#F59E0B]/10 text-[#F59E0B] border-[#F59E0B]/15',
      glowClass: 'hover:shadow-[0_8px_32px_rgba(245,158,11,0.15)] hover:border-[#F59E0B]/20'
    },
    {
      title: 'Transverse Crack',
      count: countDistress('Transverse Crack'),
      subtitle: 'Lateral crack profiles',
      icon: GitMerge,
      iconColor: 'text-[#3B82F6]',
      iconBg: 'bg-[#3B82F6]/10',
      badgeText: isCompleted ? 'Low' : 'Pending',
      badgeClass: 'bg-[#3B82F6]/10 text-[#3B82F6] border-[#3B82F6]/15',
      glowClass: 'hover:shadow-[0_8px_32px_rgba(59,130,246,0.15)] hover:border-[#3B82F6]/20'
    },
    {
      title: 'Alligator Crack',
      count: countDistress('Alligator Crack'),
      subtitle: 'Fatigue cracking areas',
      icon: Grid,
      iconColor: 'text-[#8B5CF6]',
      iconBg: 'bg-[#8B5CF6]/10',
      badgeText: isCompleted ? 'High' : 'Pending',
      badgeClass: 'bg-[#8B5CF6]/10 text-[#8B5CF6] border-[#8B5CF6]/15',
      glowClass: 'hover:shadow-[0_8px_32px_rgba(139,92,246,0.18)] hover:border-[#8B5CF6]/20'
    },
    {
      title: 'Road Quality',
      count: isCompleted ? (selectedSurvey.roadScore ? selectedSurvey.roadScore.toFixed(1) : 'N/A') : 'Pending',
      scoreSuffix: isCompleted && selectedSurvey.roadScore ? ' / 5' : '',
      subtitle: 'Overall rating',
      icon: Milestone,
      iconColor: 'text-[#10B981]',
      iconBg: 'bg-[#10B981]/10',
      badgeText: isCompleted ? 'Good' : 'Pending',
      badgeClass: 'bg-[#10B981]/10 text-[#10B981] border-[#10B981]/15',
      glowClass: 'hover:shadow-[0_8px_32px_rgba(16,185,129,0.15)] hover:border-[#10B981]/20'
    }
  ];

  if (layout === 'column') {
    return (
      <div className="flex flex-col gap-2 w-full p-2 select-none">
        {cardsData.map((card, idx) => {
          const IconComponent = card.icon;
          return (
            <div
              key={idx}
              className={`bg-[#121826]/60 rounded-lg p-2 border border-white/5 shadow-sm flex items-center justify-between transition-all duration-200 ${card.glowClass}`}
            >
              <div className="flex items-center gap-2 min-w-0">
                <div className={`w-7 h-7 rounded flex items-center justify-center shrink-0 ${card.iconBg}`}>
                  <IconComponent className={`w-3.5 h-3.5 ${card.iconColor}`} />
                </div>
                <div className="min-w-0 flex flex-col justify-center">
                  <span className="text-[#94A3B8] text-[7.5px] uppercase font-bold tracking-wider font-mono block leading-none mb-1 truncate">
                    {card.title.replace(' Crack', '')}
                  </span>
                  <span className="text-white text-[12px] font-extrabold font-mono leading-none block">
                    {card.count}
                    {card.scoreSuffix && (
                      <span className="text-slate-550 text-[8px] font-normal font-sans ml-0.5">
                        {card.scoreSuffix}
                      </span>
                    )}
                  </span>
                </div>
              </div>
              <div className={`px-1.5 py-0.5 rounded text-[7px] font-bold uppercase tracking-wider font-mono shrink-0 ml-1.5 ${card.badgeClass}`}>
                {card.badgeText}
              </div>
            </div>
          );
        })}
      </div>
    );
  }

  if (layout === 'row') {
    return (
      <div className="w-full bg-[#06080E] border-b border-white/5 flex flex-row items-center gap-3.5 py-1.5 px-6 overflow-x-auto shrink-0 select-none font-sans scrollbar-none">
        <span className="text-[#3B82F6] text-[9.5px] font-bold uppercase tracking-wider font-mono shrink-0 mr-1">
          Defect Summary:
        </span>
        <div className="flex flex-row gap-3 items-center min-w-0">
          {cardsData.map((card, idx) => {
            const IconComponent = card.icon;
            return (
              <div
                key={idx}
                className={`bg-[#121826]/90 rounded-lg py-1 px-2.5 border border-white/5 shadow-sm flex items-center gap-2 transition-all duration-200 shrink-0 ${card.glowClass}`}
              >
                <div className={`w-5.5 h-5.5 rounded flex items-center justify-center shrink-0 ${card.iconBg}`}>
                  <IconComponent className={`w-3 h-3 ${card.iconColor}`} />
                </div>
                <div className="flex items-baseline gap-1.5 min-w-0">
                  <span className="text-[#94A3B8] text-[8px] uppercase font-bold tracking-wider font-mono leading-none">
                    {card.title.replace(' Crack', '')}
                  </span>
                  <span className="text-white text-[11.5px] font-extrabold font-mono leading-none">
                    {card.count}
                    {card.scoreSuffix && (
                      <span className="text-slate-500 text-[8px] font-normal font-sans ml-0.5">
                        {card.scoreSuffix}
                      </span>
                    )}
                  </span>
                </div>
                <div className={`px-1 rounded text-[7px] font-bold uppercase tracking-wider font-mono shrink-0 ${card.badgeClass}`}>
                  {card.badgeText}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <div className="w-full bg-[#0C111A] flex flex-col font-sans select-none">
      
      {/* Title Header */}
      <div className="py-2.5 px-4 border-b border-white/5 bg-slate-900/10 shrink-0 flex items-center justify-between">
        <span className="text-[#3B82F6] text-[10px] font-bold uppercase tracking-wider block font-mono">
          Defect Summary
        </span>
      </div>

      {/* Cards Grid Container */}
      <div className="grid grid-cols-2 gap-2 p-3 bg-[#0C111A]">
        {cardsData.map((card, idx) => {
          const IconComponent = card.icon;
          const isFullWidth = card.title === 'Road Quality';
          return (
            <div
              key={idx}
              className={`bg-[#121826]/90 rounded-xl p-2 border border-white/5 shadow-md flex items-center justify-between transition-all duration-200 ${
                isFullWidth ? 'col-span-2' : ''
              } ${card.glowClass}`}
            >
              <div className="flex items-center gap-2 min-w-0">
                {/* Icon */}
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${card.iconBg}`}>
                  <IconComponent className={`w-4 h-4 ${card.iconColor}`} />
                </div>
                
                {/* Details */}
                <div className="min-w-0">
                  <span className="text-[#94A3B8] text-[8px] uppercase font-bold tracking-wider font-mono block leading-none mb-1">
                    {card.title}
                  </span>
                  <span className="text-white text-[15px] font-extrabold font-mono leading-none block">
                    {card.count}
                    {card.scoreSuffix && (
                      <span className="text-slate-550 text-[9px] font-normal font-sans ml-0.5">
                        {card.scoreSuffix}
                      </span>
                    )}
                  </span>
                </div>
              </div>

              {/* Badge */}
              <div className={`px-1.5 py-0.5 rounded text-[8px] font-bold uppercase tracking-wider font-mono shrink-0 ${card.badgeClass}`}>
                {card.badgeText}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

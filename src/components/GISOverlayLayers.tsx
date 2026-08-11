import React, { useState } from 'react';
import {
  Route,
  Navigation,
  Layers,
  Circle,
  Activity,
  Grid
} from 'lucide-react';

interface LayerItem {
  id: string;
  name: string;
  subtitle: string;
  icon: React.ComponentType<any>;
  iconColor: string;
  initialState: boolean;
}

const overlayLayersConfig: LayerItem[] = [
  { id: 'survey_route', name: 'Survey Route', subtitle: 'Cyan line telemetry', icon: Route, iconColor: '#22D3EE', initialState: true },
  { id: 'vehicle_location', name: 'Vehicle Location', subtitle: 'Pulsing chevron tracker', icon: Navigation, iconColor: '#2563EB', initialState: true },
  { id: 'road_quality', name: 'Road Quality', subtitle: 'ASTM defect indexing', icon: Layers, iconColor: '#10B981', initialState: true },
  { id: 'potholes', name: 'Potholes', subtitle: 'AI warning markers', icon: Circle, iconColor: '#EF4444', initialState: true },
  { id: 'longitudinal_crack', name: 'Longitudinal Crack', subtitle: 'AI vertical defect tracking', icon: Activity, iconColor: '#F59E0B', initialState: true },
  { id: 'transverse_crack', name: 'Transverse Crack', subtitle: 'AI horizontal defect tracking', icon: Activity, iconColor: '#EAB308', initialState: true },
  { id: 'alligator_crack', name: 'Alligator Crack', subtitle: 'AI grid distress tracking', icon: Grid, iconColor: '#8B5CF6', initialState: true }
];

interface GISOverlayLayersProps {
  onToggleLayer?: (layerId: string, active: boolean) => void;
}

export const GISOverlayLayers: React.FC<GISOverlayLayersProps> = ({ onToggleLayer }) => {
  const [activeStates, setActiveStates] = useState<Record<string, boolean>>(() => {
    const states: Record<string, boolean> = {};
    overlayLayersConfig.forEach((layer) => {
      states[layer.id] = layer.initialState;
    });
    return states;
  });

  const handleToggle = (id: string) => {
    const nextState = !activeStates[id];
    setActiveStates((prev) => ({
      ...prev,
      [id]: nextState
    }));
    if (onToggleLayer) {
      onToggleLayer(id, nextState);
    }
  };

  return (
    <div className="w-full h-full bg-transparent flex flex-col shrink-0 select-none z-10 font-sans text-slate-100 overflow-hidden">
      
      {/* Header Panel */}
      <div className="p-3.5 border-b border-white/5 bg-slate-900/10 shrink-0">
        <span className="text-[8px] text-slate-500 font-bold uppercase tracking-wider block font-mono">
          GIS OPERATIONS
        </span>
        <h2 className="text-[12px] text-white font-extrabold tracking-[0.5px] uppercase mt-0.5">
          Overlay Layers
        </h2>
      </div>

      {/* List of Layer toggles */}
      <div className="flex-grow overflow-y-auto p-2.5 space-y-1.5">
        {overlayLayersConfig.map((layer) => {
          const IconComponent = layer.icon;
          const isToggled = activeStates[layer.id];

          return (
            <div
              key={layer.id}
              onClick={() => handleToggle(layer.id)}
              className={`flex items-center justify-between p-2 rounded-lg border transition-all duration-150 select-none cursor-pointer ${
                isToggled
                  ? 'border-white/5 bg-[#111827]/40 hover:bg-[#111827]/60'
                  : 'border-transparent hover:bg-slate-900/20'
              }`}
            >
              {/* Left Color + Info */}
              <div className="flex items-center gap-3 min-w-0">
                <div
                  className="w-7 h-7 rounded-md flex items-center justify-center shrink-0 border transition-all"
                  style={{
                    backgroundColor: isToggled ? `${layer.iconColor}15` : 'transparent',
                    borderColor: isToggled ? `${layer.iconColor}35` : 'rgba(255,255,255,0.06)',
                    color: isToggled ? layer.iconColor : '#64748B'
                  }}
                >
                  <IconComponent className="w-3.5 h-3.5" />
                </div>
                <div className="min-w-0 leading-tight">
                  <span className={`text-[10px] font-bold block transition-colors leading-none ${
                    isToggled ? 'text-white' : 'text-slate-400'
                  }`}>
                    {layer.name}
                  </span>
                  <span className="text-[8px] text-slate-550 block mt-1 font-mono tracking-tight uppercase leading-none">
                    {layer.subtitle}
                  </span>
                </div>
              </div>

              {/* Slider switch toggle */}
              <div 
                className={`w-[26px] h-[14px] rounded-full p-[2px] transition-colors duration-200 shrink-0 ${
                  isToggled ? 'bg-[#2563EB]' : 'bg-slate-800'
                }`}
              >
                <div 
                  className={`w-[10px] h-[10px] rounded-full bg-white switch-indicator ${
                    isToggled ? 'translate-x-[12px]' : 'translate-x-0'
                  }`} 
                />
              </div>

            </div>
          );
        })}
      </div>
    </div>
  );
};

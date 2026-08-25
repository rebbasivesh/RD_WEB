import React from 'react';
import {
  Route,
  Navigation,
  Layers,
  Circle,
  Activity,
  Grid,
  CheckSquare
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
  layersState?: Record<string, boolean>;
  onToggleLayer?: (layerId: string, active: boolean) => void;
}

export const GISOverlayLayers: React.FC<GISOverlayLayersProps> = ({ layersState, onToggleLayer }) => {
  const safeLayersState = layersState || {
    survey_route: true,
    vehicle_location: true,
    road_quality: true,
    potholes: true,
    longitudinal_crack: true,
    transverse_crack: true,
    alligator_crack: true
  };

  const isAllToggled = overlayLayersConfig.every((layer) => safeLayersState[layer.id] !== false);

  const handleToggle = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const currentState = safeLayersState[id] !== false;
    if (onToggleLayer) {
      onToggleLayer(id, !currentState);
    }
  };

  const handleMasterToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    const nextState = !isAllToggled;
    overlayLayersConfig.forEach((layer) => {
      if (onToggleLayer) onToggleLayer(layer.id, nextState);
    });
  };

  const handleTurnOnAll = (e: React.MouseEvent) => {
    e.stopPropagation();
    overlayLayersConfig.forEach((layer) => {
      if (onToggleLayer) onToggleLayer(layer.id, true);
    });
  };

  const handleTurnOffAll = (e: React.MouseEvent) => {
    e.stopPropagation();
    overlayLayersConfig.forEach((layer) => {
      if (onToggleLayer) onToggleLayer(layer.id, false);
    });
  };

  return (
    <div 
      onClick={(e) => e.stopPropagation()}
      className="w-full h-full bg-transparent flex flex-col shrink-0 select-none z-10 font-sans text-slate-100 overflow-hidden"
    >
      {/* Header Panel */}
      <div className="p-3 border-b border-white/10 bg-[#121826]/90 shrink-0 flex items-center justify-between">
        <div>
          <span className="text-[8px] text-slate-400 font-bold uppercase tracking-wider block font-mono">
            GIS OPERATIONS
          </span>
          <h2 className="text-[11.5px] text-white font-extrabold tracking-[0.5px] uppercase mt-0.5">
            Overlay Layers
          </h2>
        </div>

        {/* Subtle inline actions */}
        <div className="flex items-center gap-2 font-mono text-[9px]">
          <button
            onClick={handleTurnOnAll}
            className="text-[#10B981] hover:underline font-bold transition-colors"
          >
            On All
          </button>
          <span className="text-slate-600">·</span>
          <button
            onClick={handleTurnOffAll}
            className="text-[#EF4444] hover:underline font-bold transition-colors"
          >
            Off All
          </button>
        </div>
      </div>

      {/* List of Layer toggles */}
      <div className="flex-grow overflow-y-auto p-2 space-y-1">
        
        {/* 1. MASTER ALL LAYERS OPTION ROW */}
        <div
          onClick={handleMasterToggle}
          className={`flex items-center justify-between p-2 rounded-lg border transition-all duration-150 select-none cursor-pointer mb-2 ${
            isAllToggled
              ? 'border-[#2563EB]/40 bg-[#2563EB]/15 hover:bg-[#2563EB]/25'
              : 'border-white/10 bg-[#172033]/40 hover:bg-[#172033]/70'
          }`}
        >
          <div className="flex items-center gap-2.5 min-w-0">
            <div
              className={`w-6.5 h-6.5 rounded-md flex items-center justify-center shrink-0 border transition-all ${
                isAllToggled
                  ? 'bg-[#2563EB]/20 border-[#2563EB]/50 text-[#3B82F6]'
                  : 'bg-transparent border-white/10 text-slate-400'
              }`}
            >
              <CheckSquare className="w-3.5 h-3.5" />
            </div>
            <div className="min-w-0 leading-tight">
              <span className="text-[10.5px] font-extrabold block text-white leading-none">
                All Layers
              </span>
              <span className="text-[8px] text-slate-400 block mt-0.5 font-mono tracking-tight uppercase leading-none">
                MASTER TOGGLE FOR ALL
              </span>
            </div>
          </div>

          <div 
            className={`w-[26px] h-[14px] rounded-full p-[2px] transition-colors duration-200 shrink-0 ${
              isAllToggled ? 'bg-[#2563EB]' : 'bg-slate-800'
            }`}
          >
            <div 
              className={`w-[10px] h-[10px] rounded-full bg-white switch-indicator transition-transform ${
                isAllToggled ? 'translate-x-[12px]' : 'translate-x-0'
              }`} 
            />
          </div>
        </div>

        {/* Separator */}
        <div className="border-t border-white/5 my-1" />

        {/* 2. INDIVIDUAL OVERLAY LAYER TOGGLE ROWS */}
        {overlayLayersConfig.map((layer) => {
          const IconComponent = layer.icon;
          const isToggled = safeLayersState[layer.id] !== false;

          return (
            <div
              key={layer.id}
              onClick={(e) => handleToggle(layer.id, e)}
              className={`flex items-center justify-between p-2 rounded-lg border transition-all duration-150 select-none cursor-pointer ${
                isToggled
                  ? 'border-white/10 bg-[#172033]/60 hover:bg-[#172033]/90'
                  : 'border-transparent hover:bg-white/5 opacity-60'
              }`}
            >
              {/* Left Color + Info */}
              <div className="flex items-center gap-2.5 min-w-0">
                <div
                  className="w-6.5 h-6.5 rounded-md flex items-center justify-center shrink-0 border transition-all"
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
                  <span className="text-[8px] text-slate-400 block mt-0.5 font-mono tracking-tight uppercase leading-none">
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
                  className={`w-[10px] h-[10px] rounded-full bg-white switch-indicator transition-transform ${
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


import React from 'react';
import { Unit } from '../types';
import { Shield, Zap, Crosshair } from 'lucide-react';

interface GameOverlayProps {
  units: Unit[];
}

const GameOverlay: React.FC<GameOverlayProps> = ({ units }) => {
  const selectedUnits = units.filter(u => u.selected);
  const primaryUnit = selectedUnits.length > 0 ? selectedUnits[0] : null;

  return (
    <div className="absolute inset-0 pointer-events-none flex flex-col justify-end z-10">
      {/* Bottom HUD - Aligned to bottom edge */}
      <div className="flex items-end justify-center w-full">
        {selectedUnits.length > 0 && (
          <div className="pointer-events-auto w-[680px] h-44 bg-black/30 backdrop-blur-xl border-x-[3px] border-t-[3px] border-black rounded-t-3xl px-6 py-4 flex gap-6 relative shadow-[0px_-8px_30px_rgba(0,0,0,0.8)] overflow-hidden">
            {/* Background texture for HUD */}
            <div className="absolute inset-0 opacity-10 pointer-events-none bg-[radial-gradient(#fff_1px,transparent_0)] bg-[size:15px_15px]"></div>
            
            {/* Unit Portrait - Scale maintained, layout tightened */}
            <div className="w-32 h-32 bg-black/60 border-[3px] border-purple-500 rounded-2xl flex items-center justify-center overflow-hidden relative shadow-[4px_4px_0px_#000] shrink-0 self-center">
               <div className="absolute inset-0 opacity-40 bg-gradient-to-t from-purple-900 to-transparent"></div>
               <div 
                className="w-16 h-16 rounded-full blur-2xl animate-pulse" 
                style={{ backgroundColor: primaryUnit?.color }}
               />
               <span className="comic-font text-6xl text-white relative z-10 drop-shadow-[4px_4px_0px_#000]">{primaryUnit?.type[0]}</span>
            </div>

            {/* Stats & Info - More compact gaps */}
            <div className="flex-1 flex flex-col gap-2 justify-center">
              <div className="flex justify-between items-center border-b-2 border-black/50 pb-1">
                <h2 className="comic-font text-2xl text-white uppercase tracking-wider">{primaryUnit?.name}</h2>
                <div className="flex gap-2">
                  <span className="text-[9px] text-white font-black px-1.5 py-0.5 border-2 border-black rounded bg-purple-600 uppercase italic">{primaryUnit?.type}</span>
                  <span className="text-[9px] text-white font-black px-1.5 py-0.5 border-2 border-black rounded bg-cyan-600 uppercase italic">RANK A</span>
                </div>
              </div>
              
              <div className="h-10 overflow-hidden text-[10px] text-gray-300 font-bold leading-tight uppercase opacity-80">
                Deployment active. Unit specialized in {primaryUnit?.type.toLowerCase()} tactics. Objective: Grid dominance.
              </div>

              <div className="flex gap-4 mt-1">
                <StatBar icon={<Shield className="w-3.5 h-3.5" />} label="INTEGRITY" current={primaryUnit?.health || 0} max={primaryUnit?.maxHealth || 100} color="bg-green-500" shadow="shadow-[0_0_8px_#22c55e]" />
                <StatBar icon={<Zap className="w-3.5 h-3.5" />} label="ETHER" current={primaryUnit?.mana || 0} max={200} color="bg-cyan-500" shadow="shadow-[0_0_8px_#06b6d4]" />
              </div>
            </div>

            {/* Selection List Mini - Tightened widths */}
            <div className="w-28 border-l-2 border-white/10 pl-4 flex flex-col gap-1.5 justify-center bg-black/10">
              <p className="comic-font text-[12px] text-purple-400 uppercase flex items-center gap-1 shrink-0"><Crosshair className="w-3 h-3"/> SQUAD ({selectedUnits.length})</p>
              <div className="grid grid-cols-2 gap-1.5 overflow-y-auto max-h-[80px] pr-1">
                {selectedUnits.slice(0, 10).map(u => (
                  <div key={u.id} className="w-full h-2.5 border-2 border-black bg-gray-900 relative rounded-full overflow-hidden">
                    <div className="h-full bg-purple-500" style={{ width: `${(u.health / u.maxHealth) * 100}%` }} />
                  </div>
                ))}
              </div>
              {selectedUnits.length > 10 && <p className="text-[8px] text-purple-500 font-black uppercase text-center">+{selectedUnits.length - 10} MORE</p>}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

interface StatBarProps {
  icon: React.ReactNode;
  label: string;
  current: number;
  max: number;
  color: string;
  shadow: string;
}

const StatBar: React.FC<StatBarProps> = ({ icon, label, current, max, color, shadow }) => (
  <div className="flex-1">
    <div className="flex justify-between text-[9px] uppercase font-black mb-0.5">
      <div className="flex items-center gap-1 text-gray-400">{icon} {label}</div>
      <div className="text-white bg-black/60 px-1 rounded-sm">{Math.round(current)}</div>
    </div>
    <div className="w-full h-2.5 bg-black border-[1.5px] border-black/40 rounded-full overflow-hidden p-[1px]">
      <div 
        className={`h-full ${color} ${shadow} transition-all duration-300 rounded-full`} 
        style={{ width: `${(current / max) * 100}%` }} 
      />
    </div>
  </div>
);

export default GameOverlay;

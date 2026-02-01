
import React, { useEffect, useState } from 'react';
import { ResourceState, ChatMessage, GameEvent, BlockType, GameConfig, Achievement } from '../types';
import { Pickaxe, Gem, ArrowDown, Cpu, MessageSquare, Hammer, ShoppingCart, DollarSign, Bomb, Magnet, Disc, Snowflake, Radiation, TrendingUp, Wrench, Zap, Trophy, Crown, Flame } from 'lucide-react';
import { PICKAXE_TIERS, BLOCK_DEFINITIONS, ABILITIES } from '../constants';

interface OverlayProps {
  resources: ResourceState;
  chatMessages: ChatMessage[];
  gameComment: string | null;
  gameEvent: GameEvent | null;
  onOpenShop: () => void;
  config: GameConfig;
  recentAchievement: Achievement | null;
}

const Overlay: React.FC<OverlayProps> = ({ resources, chatMessages, gameComment, gameEvent, onOpenShop, config, recentAchievement }) => {
  const currentTier = PICKAXE_TIERS.find(t => t.id === resources.pickaxeTier) || PICKAXE_TIERS[0];
  
  // Rotation state for the inventory carousel
  const [rotationOffset, setRotationOffset] = useState(0);

  // Rotate the inventory view every 2 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setRotationOffset(prev => prev + 1);
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  // Derive displayed resources directly from props during render
  // This ensures updates are instant whenever resources.inventory changes
  const getDisplayedResources = () => {
    const ignore = [BlockType.AIR, BlockType.BEDROCK, BlockType.LOOT_CRATE];
    const availableTypes = Object.keys(resources.inventory)
        .map(k => parseInt(k))
        .filter(k => !ignore.includes(k) && (resources.inventory[k] || 0) > 0)
        .sort((a, b) => a - b); // Consistent sorting by ID
    
    if (availableTypes.length <= 6) {
        return availableTypes;
    }

    const slice = [];
    for (let i = 0; i < 6; i++) {
        slice.push(availableTypes[(rotationOffset + i) % availableTypes.length]);
    }
    return slice;
  };

  const displayedResources = getDisplayedResources();

  const getAbilityIcon = (iconName: string) => {
      switch(iconName) {
          case 'Bomb': return <Bomb className="w-6 h-6" />;
          case 'Magnet': return <Magnet className="w-6 h-6" />;
          case 'Disc': return <Disc className="w-6 h-6" />;
          case 'Snowflake': return <Snowflake className="w-6 h-6" />;
          case 'Radiation': return <Radiation className="w-6 h-6" />;
          case 'TrendingUp': return <TrendingUp className="w-6 h-6" />;
          case 'Wrench': return <Wrench className="w-6 h-6" />;
          case 'DollarSign': return <DollarSign className="w-6 h-6" />;
          default: return <Zap className="w-6 h-6" />;
      }
  };

  const getAchIcon = (iconName: string) => {
      switch(iconName) {
          case 'ArrowDown': return <ArrowDown className="w-8 h-8 text-cyan-400" />;
          case 'Skull': return <Radiation className="w-8 h-8 text-red-500" />;
          case 'Radiation': return <Radiation className="w-8 h-8 text-green-500" />;
          case 'DollarSign': return <DollarSign className="w-8 h-8 text-yellow-400" />;
          case 'Gem': return <Gem className="w-8 h-8 text-purple-400" />;
          case 'Crown': return <Crown className="w-8 h-8 text-yellow-600" />;
          case 'Pickaxe': return <Hammer className="w-8 h-8 text-blue-400" />;
          case 'Zap': return <Zap className="w-8 h-8 text-purple-600" />;
          case 'Flame': return <Flame className="w-8 h-8 text-orange-500" />;
          default: return <Trophy className="w-8 h-8 text-yellow-400" />;
      }
  };

  return (
    <div className="absolute inset-0 pointer-events-none font-sans z-50 flex flex-col justify-between">
      
      {/* TOP HUD BAR */}
      <div className="w-full flex justify-between items-start p-6 bg-gradient-to-b from-black/80 to-transparent">
          
          {/* Left: Stats */}
          <div className="flex flex-col gap-2 pointer-events-auto">
               <div className="flex items-center gap-3 bg-black/40 backdrop-blur-md px-4 py-2 rounded-full border border-green-500/30 shadow-[0_0_15px_rgba(34,197,94,0.2)]">
                   <div className="p-1.5 bg-green-500/20 rounded-full animate-pulse">
                       <DollarSign className="w-5 h-5 text-green-400" />
                   </div>
                   <span className="text-3xl font-black text-white tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-emerald-200">
                       ${resources.money.toLocaleString()}
                   </span>
               </div>
               
               <div className="flex items-center gap-3 bg-black/40 backdrop-blur-md px-4 py-2 rounded-full border border-white/10 w-fit">
                   <div className="p-1.5 bg-cyan-500/20 rounded-full">
                       <Hammer className="w-4 h-4 text-cyan-400" />
                   </div>
                   <div className="flex flex-col">
                        <span className="text-xs font-bold text-slate-300 uppercase leading-none">{currentTier.name}</span>
                        <div className="text-[10px] text-slate-500">Tier {PICKAXE_TIERS.indexOf(currentTier) + 1}</div>
                   </div>
               </div>

               <button 
                  onClick={onOpenShop}
                  className="mt-2 flex items-center gap-2 bg-yellow-600 hover:bg-yellow-500 text-white px-4 py-2 rounded-lg font-bold shadow-lg transition-transform hover:scale-105 active:scale-95 pointer-events-auto"
               >
                   <ShoppingCart className="w-4 h-4" />
                   OPEN SHOP
               </button>
          </div>

          {/* Center: Depth & System Messages */}
          <div className="flex flex-col items-center">
               <div className="flex items-center gap-2 px-6 py-2 bg-black/50 backdrop-blur-xl rounded-b-2xl border-x border-b border-white/10 shadow-2xl">
                   <ArrowDown className="w-5 h-5 text-cyan-400 animate-bounce" />
                   <span className="text-4xl font-black text-white tracking-tighter font-mono">{resources.depth}m</span>
               </div>
               <div className={`mt-2 px-3 py-1 rounded text-[10px] font-bold tracking-[0.2em] uppercase border border-white/5 shadow-lg ${
                   resources.currentZone === 'VOID' ? 'bg-purple-900/50 text-purple-300' : 
                   resources.currentZone === 'UNDERWORLD' ? 'bg-red-900/50 text-red-300' : 
                   'bg-blue-900/50 text-blue-300'
               }`}>
                   {resources.currentZone}
               </div>

               {/* Toast Message */}
               {(gameComment || gameEvent) && (
                   <div className="mt-4 animate-in fade-in slide-in-from-top-5 duration-500">
                       <div className={`bg-slate-900/80 backdrop-blur border px-6 py-3 rounded-lg shadow-2xl flex items-center gap-3 ${gameEvent?.reason === 'WORLD_EVENT' ? 'border-yellow-500/50 bg-yellow-900/30' : 'border-purple-500/30'}`}>
                           <Cpu className={`w-5 h-5 ${gameEvent?.reason === 'WORLD_EVENT' ? 'text-yellow-400' : 'text-purple-400'}`} />
                           <span className="text-sm font-medium text-slate-200">{gameEvent?.action === 'COMMENTARY' ? gameEvent.data : gameComment}</span>
                       </div>
                   </div>
               )}

               {/* Achievement Toast */}
               {recentAchievement && (
                   <div className="mt-4 animate-in zoom-in-50 slide-in-from-bottom-10 duration-500">
                       <div className="bg-gradient-to-r from-yellow-900/80 to-slate-900/80 backdrop-blur border border-yellow-500/50 px-6 py-4 rounded-xl shadow-[0_0_30px_rgba(234,179,8,0.3)] flex items-center gap-4">
                           <div className="p-2 bg-yellow-500/20 rounded-full animate-bounce">
                               {getAchIcon(recentAchievement.icon)}
                           </div>
                           <div>
                               <div className="text-xs font-bold text-yellow-400 uppercase tracking-widest mb-1">Achievement Unlocked</div>
                               <div className="text-lg font-black text-white">{recentAchievement.name}</div>
                               <div className="text-xs text-slate-400">{recentAchievement.description}</div>
                           </div>
                       </div>
                   </div>
               )}
          </div>

          {/* Right: Score (Legacy) */}
          <div className="bg-black/40 backdrop-blur-md px-4 py-2 rounded-full border border-white/10">
              <span className="text-xs text-slate-400 font-bold uppercase mr-2">Score</span>
              <span className="font-mono text-white">{resources.score.toLocaleString()}</span>
          </div>
      </div>

      {/* ABILITY HOTBAR */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-end gap-2 z-50">
          {[0, 1, 2, 3].map(slotIndex => {
              const abilityId = resources.ownedAbilities[slotIndex];
              const def = abilityId ? ABILITIES[abilityId] : null;
              const readyAt = abilityId ? (resources.abilityCooldowns[abilityId] || 0) : 0;
              const timeLeft = Math.max(0, (readyAt - Date.now()) / 1000);
              const isReady = timeLeft === 0;

              return (
                  <div key={slotIndex} className="relative group">
                      <div className={`w-16 h-16 bg-black/60 backdrop-blur border-2 ${isReady && abilityId ? 'border-cyan-400 shadow-[0_0_15px_rgba(34,211,238,0.4)]' : 'border-slate-700'} rounded-lg flex items-center justify-center transition-all`}>
                          {def ? (
                              <>
                                  <div className={!isReady ? 'opacity-30 grayscale' : 'text-cyan-400'}>
                                      {getAbilityIcon(def.icon)}
                                  </div>
                                  {!isReady && (
                                      <div className="absolute inset-0 flex items-center justify-center font-mono font-bold text-white text-lg">
                                          {Math.ceil(timeLeft)}
                                      </div>
                                  )}
                              </>
                          ) : (
                              <span className="text-slate-600 text-xs font-bold">{slotIndex + 1}</span>
                          )}
                          <div className="absolute -top-2 -left-2 bg-slate-800 text-white text-[10px] w-5 h-5 rounded-full flex items-center justify-center border border-slate-600">
                              {slotIndex + 1}
                          </div>
                      </div>
                      {def && (
                          <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 bg-black/90 text-white text-xs px-2 py-1 rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                              {def.name}
                          </div>
                      )}
                  </div>
              );
          })}
      </div>

      {/* BOTTOM HUD */}
      <div className="w-full flex justify-between items-end p-6 bg-gradient-to-t from-black/90 to-transparent pointer-events-none">
          
          {/* Bottom Left: Cycling Inventory */}
          <div className="bg-black/30 backdrop-blur-md border border-white/5 rounded-2xl p-4 flex flex-col gap-2 min-w-[200px] transition-all duration-500 pointer-events-auto">
              <div className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1 border-b border-white/5 pb-1 flex justify-between">
                  <span>Inventory</span>
                  <span className="text-[10px] opacity-50">Live</span>
              </div>
              <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                 {displayedResources.length === 0 && <span className="text-xs text-slate-600 italic">No ores collected</span>}
                 {displayedResources.map(type => {
                     const def = BLOCK_DEFINITIONS[type];
                     return (
                         <div key={type} className="flex justify-between items-center animate-in fade-in duration-500">
                             <span className="text-slate-300 text-xs truncate mr-2" style={{color: def?.color}}>{def?.name}</span>
                             <span className="font-mono font-bold text-white">{resources.inventory[type] || 0}</span>
                         </div>
                     );
                 })}
              </div>
          </div>

          {/* Bottom Right: Chat Integration (HIDDEN IF OFFLINE) */}
          {config.platform !== 'OFFLINE' && (
              <div className="flex flex-col items-end gap-2 w-80 pointer-events-auto animate-in slide-in-from-right-10 fade-in duration-500">
                  {/* Chat Container */}
                  <div className="w-full h-[300px] flex flex-col justify-end overflow-hidden mask-image-linear-to-t">
                      <div className="space-y-2 flex flex-col-reverse overflow-y-auto scrollbar-hide pr-2">
                           {chatMessages.length === 0 && (
                               <div className="text-right text-slate-600 italic text-sm p-4">Waiting for connection...</div>
                           )}
                           {[...chatMessages].reverse().map((msg, idx) => (
                               <div key={idx} className="text-sm animate-in slide-in-from-right-10 duration-300 flex justify-end">
                                    <div className="bg-black/40 backdrop-blur-sm border border-white/5 px-3 py-1.5 rounded-l-xl rounded-tr-xl max-w-[90%]">
                                        <span className="font-bold text-xs block mb-0.5" style={{ color: msg.color || '#a855f7' }}>
                                            {msg.user}
                                            {msg.isDonation && <span className="ml-2 text-[10px] bg-yellow-500/20 text-yellow-400 px-1 rounded">DONOR</span>}
                                        </span>
                                        <span className="text-slate-200 break-words leading-tight">{msg.message}</span>
                                    </div>
                               </div>
                           ))}
                      </div>
                  </div>
                  <div className="flex items-center gap-2 px-3 py-1 bg-black/60 backdrop-blur rounded-full border border-white/10 text-[10px] text-slate-400 uppercase tracking-widest">
                      <MessageSquare className="w-3 h-3" />
                      Live Chat Feed
                  </div>
              </div>
          )}
      </div>
      
    </div>
  );
};

export default Overlay;


import React, { useState } from 'react';
import { ResourceState, BlockType, AbilityDef } from '../types';
import { PICKAXE_TIERS, BLOCK_DEFINITIONS, ABILITIES } from '../constants';
import { X, ShoppingCart, TrendingUp, Zap, Hammer, Bomb, Magnet, Disc, Snowflake, Radiation, Wrench, DollarSign } from 'lucide-react';

interface ShopProps {
    isOpen: boolean;
    onClose: () => void;
    resourceState: ResourceState;
    onSellAll: () => void;
    onBuyUpgrade: (tierId: string, cost: number) => void;
    onBuyAbility: (abilityId: string, cost: number) => void;
}

const Shop: React.FC<ShopProps> = ({ isOpen, onClose, resourceState, onSellAll, onBuyUpgrade, onBuyAbility }) => {
    const [activeTab, setActiveTab] = useState<'sell' | 'upgrades'>('sell');

    if (!isOpen) return null;

    const currentTierIndex = PICKAXE_TIERS.findIndex(t => t.id === resourceState.pickaxeTier);
    const nextTier = PICKAXE_TIERS[currentTierIndex + 1];

    // Calculate total sell value
    let totalValue = 0;
    Object.entries(resourceState.inventory).forEach(([typeStr, count]) => {
        const type = parseInt(typeStr) as BlockType;
        const def = BLOCK_DEFINITIONS[type];
        if (def) {
            totalValue += def.price * count;
        }
    });
    
    // Apply efficiency multiplier
    totalValue = Math.floor(totalValue * (resourceState.moneyMultiplier || 1));

    const getIcon = (name: string) => {
         switch(name) {
             case 'Bomb': return <Bomb className="w-6 h-6 text-red-500" />;
             case 'Magnet': return <Magnet className="w-6 h-6 text-blue-500" />;
             case 'Disc': return <Disc className="w-6 h-6 text-orange-500" />;
             case 'Snowflake': return <Snowflake className="w-6 h-6 text-cyan-300" />;
             case 'Radiation': return <Radiation className="w-6 h-6 text-green-500" />;
             case 'TrendingUp': return <TrendingUp className="w-6 h-6 text-green-400" />;
             case 'Wrench': return <Wrench className="w-6 h-6 text-slate-400" />;
             case 'DollarSign': return <DollarSign className="w-6 h-6 text-yellow-400" />;
             default: return <Zap className="w-6 h-6 text-yellow-400" />;
         }
    };

    return (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-md flex items-center justify-center z-[70]">
            <div className="bg-slate-900 border border-slate-700 w-full max-w-4xl rounded-2xl shadow-2xl h-[80vh] flex flex-col overflow-hidden">
                
                {/* Header */}
                <div className="p-6 border-b border-slate-700 flex justify-between items-center bg-slate-950">
                    <div className="flex items-center gap-3">
                        <ShoppingCart className="w-8 h-8 text-yellow-500" />
                        <div>
                            <h2 className="text-3xl font-black text-white uppercase tracking-tighter">Item Shop</h2>
                            <div className="text-green-400 font-mono font-bold text-xl">${resourceState.money.toLocaleString()}</div>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-slate-800 rounded-full text-slate-400 hover:text-white">
                        <X className="w-6 h-6" />
                    </button>
                </div>

                {/* Tabs */}
                <div className="flex border-b border-slate-700 bg-slate-900">
                    <button 
                        onClick={() => setActiveTab('sell')}
                        className={`flex-1 py-4 font-bold text-lg uppercase transition flex items-center justify-center gap-2 ${activeTab === 'sell' ? 'bg-slate-800 text-green-400 border-b-2 border-green-400' : 'text-slate-500 hover:text-white'}`}
                    >
                        <TrendingUp className="w-5 h-5" /> Sell Ores
                    </button>
                    <button 
                        onClick={() => setActiveTab('upgrades')}
                        className={`flex-1 py-4 font-bold text-lg uppercase transition flex items-center justify-center gap-2 ${activeTab === 'upgrades' ? 'bg-slate-800 text-cyan-400 border-b-2 border-cyan-400' : 'text-slate-500 hover:text-white'}`}
                    >
                        <Zap className="w-5 h-5" /> Upgrades & Abilities
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6 bg-slate-900">
                    
                    {activeTab === 'sell' && (
                        <div className="space-y-6">
                            <div className="bg-slate-800 p-6 rounded-xl border border-slate-700 flex justify-between items-center shadow-lg">
                                <div>
                                    <h3 className="text-xl font-bold text-white">Bulk Sell</h3>
                                    <p className="text-slate-400 text-sm">Convert all collected ores into cash instantly.</p>
                                    {(resourceState.moneyMultiplier || 1) > 1 && (
                                        <div className="text-xs text-yellow-500 mt-1 font-bold">
                                            {((resourceState.moneyMultiplier - 1) * 100).toFixed(0)}% Bonus Applied!
                                        </div>
                                    )}
                                </div>
                                <div className="text-right">
                                    <div className="text-2xl font-black text-green-400 mb-2">+${totalValue.toLocaleString()}</div>
                                    <button 
                                        onClick={onSellAll}
                                        disabled={totalValue === 0}
                                        className="bg-green-600 hover:bg-green-500 disabled:bg-slate-700 disabled:text-slate-500 text-white px-8 py-3 rounded-lg font-bold shadow-lg transition-transform active:scale-95"
                                    >
                                        SELL ALL
                                    </button>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                                {Object.entries(resourceState.inventory).map(([typeStr, count]) => {
                                    const type = parseInt(typeStr) as BlockType;
                                    const def = BLOCK_DEFINITIONS[type];
                                    if (!def || count === 0 || def.price === 0) return null;
                                    return (
                                        <div key={type} className="bg-slate-800/50 p-4 rounded-lg border border-slate-700 flex justify-between items-center">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded bg-slate-700" style={{backgroundColor: def.color}} />
                                                <div>
                                                    <div className="font-bold text-slate-200">{def.name}</div>
                                                    <div className="text-xs text-slate-500">x{count}</div>
                                                </div>
                                            </div>
                                            <div className="font-mono text-green-400 font-bold">${(def.price * count * (resourceState.moneyMultiplier || 1)).toLocaleString()}</div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    {activeTab === 'upgrades' && (
                        <div className="space-y-8">
                             {/* Pickaxe Section */}
                             <div>
                                 <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                                     <Hammer className="w-5 h-5 text-cyan-400" /> Pickaxe Upgrades
                                 </h3>
                                 
                                 {nextTier ? (
                                     <div className="bg-slate-800 p-6 rounded-xl border border-cyan-500/30 flex justify-between items-center relative overflow-hidden group">
                                         <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition">
                                             <Hammer className="w-32 h-32" />
                                         </div>
                                         <div className="relative z-10">
                                             <h4 className="text-2xl font-bold text-white mb-1">{nextTier.name}</h4>
                                             <p className="text-slate-400">Increase damage to {nextTier.damage} per hit.</p>
                                             <div className="mt-2 text-sm text-cyan-300">Current: {PICKAXE_TIERS[currentTierIndex].name} ({PICKAXE_TIERS[currentTierIndex].damage} dmg)</div>
                                         </div>
                                         <div className="relative z-10">
                                              <button 
                                                 onClick={() => onBuyUpgrade(nextTier.id, nextTier.price)}
                                                 disabled={resourceState.money < nextTier.price}
                                                 className="bg-cyan-600 hover:bg-cyan-500 disabled:bg-slate-700 disabled:text-slate-500 text-white px-6 py-3 rounded-lg font-bold shadow-lg transition-all flex flex-col items-center min-w-[140px]"
                                              >
                                                  <span>BUY</span>
                                                  <span className="text-xs font-mono">${nextTier.price.toLocaleString()}</span>
                                              </button>
                                         </div>
                                     </div>
                                 ) : (
                                     <div className="p-6 bg-slate-800 rounded-xl text-center text-slate-500 italic">Max Tier Reached!</div>
                                 )}
                             </div>

                             {/* Abilities Section */}
                             <div>
                                 <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                                     <Zap className="w-5 h-5 text-yellow-400" /> Player Abilities (Press 1-4)
                                 </h3>
                                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                     {Object.values(ABILITIES).filter(a => a.type === 'ACTIVE').map(ability => {
                                         const owned = resourceState.ownedAbilities.includes(ability.id);
                                         return (
                                            <AbilityCard 
                                                key={ability.id}
                                                name={ability.name} 
                                                desc={ability.description} 
                                                cost={ability.price} 
                                                money={resourceState.money}
                                                onBuy={() => onBuyAbility(ability.id, ability.price)}
                                                icon={getIcon(ability.icon)}
                                                owned={owned}
                                                isPassive={false}
                                            />
                                         );
                                     })}
                                 </div>
                             </div>

                             {/* Passives Section */}
                             <div>
                                 <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                                     <TrendingUp className="w-5 h-5 text-green-400" /> Passive Upgrades
                                 </h3>
                                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                     {Object.values(ABILITIES).filter(a => a.type === 'PASSIVE').map(ability => {
                                         // Dynamic price scaling for passives
                                         let currentPrice = ability.price;
                                         if (ability.id === 'luck') {
                                             currentPrice = ability.price * Math.pow(1.5, Math.floor(((resourceState.luckMultiplier || 1) - 1) * 10));
                                         } else if (ability.id === 'efficiency') {
                                             currentPrice = ability.price * Math.pow(1.5, Math.floor(((resourceState.moneyMultiplier || 1) - 1) * 10));
                                         }
                                         
                                         // Round to nice numbers
                                         currentPrice = Math.floor(currentPrice / 100) * 100;

                                         return (
                                            <AbilityCard 
                                                key={ability.id}
                                                name={ability.name} 
                                                desc={ability.description} 
                                                cost={currentPrice} 
                                                money={resourceState.money}
                                                onBuy={() => onBuyAbility(ability.id, currentPrice)}
                                                icon={getIcon(ability.icon)}
                                                owned={false}
                                                isPassive={true}
                                            />
                                         );
                                     })}
                                 </div>
                             </div>
                        </div>
                    )}

                </div>
            </div>
        </div>
    );
};

const AbilityCard = ({ name, desc, cost, money, onBuy, icon, owned, isPassive }: any) => (
    <div className={`p-4 rounded-xl border flex justify-between items-center transition ${owned ? 'bg-slate-800/50 border-green-500/50' : 'bg-slate-800 border-slate-700'}`}>
        <div className="flex items-center gap-3">
            <div className={`p-3 rounded-lg ${owned ? 'bg-green-900/30 text-green-400' : 'bg-slate-700'}`}>{icon}</div>
            <div>
                <div className="font-bold text-white flex items-center gap-2">
                    {name}
                    {owned && <span className="text-[10px] bg-green-500 text-black px-1.5 rounded font-black">OWNED</span>}
                </div>
                <div className="text-xs text-slate-400">{desc}</div>
            </div>
        </div>
        {!owned || isPassive ? (
            <button 
                onClick={onBuy}
                disabled={money < cost}
                className="bg-yellow-600 hover:bg-yellow-500 disabled:bg-slate-700 disabled:text-slate-500 text-white px-4 py-2 rounded-lg font-bold text-sm shadow-md transition-all flex flex-col items-center min-w-[90px]"
            >
                <span>BUY</span>
                <span className="text-[10px] font-mono">${cost.toLocaleString()}</span>
            </button>
        ) : (
            <div className="text-green-500 font-bold text-sm px-4">UNLOCKED</div>
        )}
    </div>
);

export default Shop;

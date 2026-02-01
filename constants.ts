
import { BlockType, PickaxeStats, ZoneConfig, AbilityDef } from './types';

export const BLOCK_SIZE = 40;
export const GRAVITY = 0.5;
export const FRICTION = 0.99;

interface BlockDef {
  color: string;
  hp: number;
  value: number; // Score value
  price: number; // Sell price
  name: string;
}

// Comprehensive Block Definitions
export const BLOCK_DEFINITIONS: Record<BlockType, BlockDef> = {
  [BlockType.AIR]: { name: 'Air', color: 'transparent', hp: 0, value: 0, price: 0 },
  [BlockType.BEDROCK]: { name: 'Bedrock', color: '#000000', hp: 999999, value: 0, price: 0 },
  [BlockType.LOOT_CRATE]: { name: 'Loot Crate', color: '#10b981', hp: 10, value: 5000, price: 0 },

  // --- OVERWORLD ---
  [BlockType.STONE]: { name: 'Stone', color: '#475569', hp: 20, value: 1, price: 1 },
  [BlockType.COAL]: { name: 'Coal', color: '#1e293b', hp: 30, value: 5, price: 2 },
  [BlockType.COPPER]: { name: 'Copper', color: '#d97706', hp: 45, value: 10, price: 5 },
  [BlockType.IRON]: { name: 'Iron', color: '#94a3b8', hp: 60, value: 15, price: 10 },
  [BlockType.QUARTZ]: { name: 'Quartz', color: '#f8fafc', hp: 50, value: 15, price: 12 },
  [BlockType.GOLD]: { name: 'Gold', color: '#fbbf24', hp: 80, value: 25, price: 25 },
  [BlockType.REDSTONE]: { name: 'Redstone', color: '#ef4444', hp: 70, value: 20, price: 15 },
  [BlockType.LAPIS]: { name: 'Lapis Lazuli', color: '#1d4ed8', hp: 70, value: 20, price: 18 },
  [BlockType.PALLADIUM]: { name: 'Palladium', color: '#f97316', hp: 220, value: 180, price: 100 },
  [BlockType.DIAMOND]: { name: 'Diamond', color: '#06b6d4', hp: 150, value: 100, price: 200 },
  [BlockType.COBALT]: { name: 'Cobalt', color: '#3b82f6', hp: 180, value: 120, price: 220 },
  [BlockType.TITANIUM]: { name: 'Titanium', color: '#cbd5e1', hp: 250, value: 200, price: 300 },
  [BlockType.MITHRIL]: { name: 'Mithril', color: '#22d3ee', hp: 400, value: 350, price: 500 },
  [BlockType.ORICHALCUM]: { name: 'Orichalcum', color: '#ec4899', hp: 450, value: 400, price: 600 },
  [BlockType.ADAMANTITE]: { name: 'Adamantite', color: '#dc2626', hp: 500, value: 450, price: 700 },
  [BlockType.TUNGSTEN]: { name: 'Tungsten', color: '#64748b', hp: 350, value: 300, price: 400 },
  [BlockType.NETHERITE]: { name: 'Netherite', color: '#3f3f46', hp: 300, value: 250, price: 1000 },

  // --- UNDERWORLD ---
  [BlockType.ASHSTONE]: { name: 'Ashstone', color: '#292524', hp: 100, value: 10, price: 15 },
  [BlockType.BRIMSTONE]: { name: 'Brimstone', color: '#451a03', hp: 120, value: 15, price: 20 },
  [BlockType.SULFUR_ORE]: { name: 'Sulfur', color: '#fde047', hp: 130, value: 40, price: 50 },
  [BlockType.SCORIA_IRON]: { name: 'Scoria Iron', color: '#78350f', hp: 150, value: 50, price: 75 },
  [BlockType.MAGMA_GOLD]: { name: 'Magma Gold', color: '#b45309', hp: 180, value: 75, price: 150 },
  [BlockType.INFERNIUM]: { name: 'Infernium', color: '#f59e0b', hp: 500, value: 500, price: 1500 },
  [BlockType.HELLFORGED_IRON]: { name: 'Hellforged Iron', color: '#7f1d1d', hp: 300, value: 250, price: 600 },
  [BlockType.OBSIDIAN_ORE]: { name: 'Obsidian', color: '#020617', hp: 600, value: 100, price: 500 },
  [BlockType.PYROCLAST]: { name: 'Pyroclast', color: '#c2410c', hp: 200, value: 150, price: 400 },
  [BlockType.BLOODSTONE]: { name: 'Bloodstone', color: '#991b1b', hp: 250, value: 200, price: 550 },
  [BlockType.DEMONITE]: { name: 'Demonite', color: '#4c0519', hp: 600, value: 600, price: 2000 },
  [BlockType.SOUL_ORE]: { name: 'Soul Ore', color: '#a0dae8', hp: 350, value: 300, price: 900 },
  [BlockType.BLACK_NETHERITE]: { name: 'Black Netherite', color: '#09090b', hp: 800, value: 800, price: 3000 },
  [BlockType.ABYSSAL_ALLOY]: { name: 'Abyssal Alloy', color: '#1e1b4b', hp: 900, value: 900, price: 3500 },
  [BlockType.UNDERSTEEL]: { name: 'Understeel', color: '#374151', hp: 550, value: 450, price: 1200 },

  // --- VOID ---
  [BlockType.VOID_SHARD]: { name: 'Void Shard', color: '#000000', hp: 500, value: 500, price: 200 }, 
  [BlockType.FRACTURED_OBSIDIAN]: { name: 'Fractured Obsidian', color: '#171717', hp: 1000, value: 200, price: 400 },
  [BlockType.NULLSTONE]: { name: 'Nullstone', color: '#262626', hp: 800, value: 100, price: 500 },
  [BlockType.ECHO_CRYSTAL]: { name: 'Echo Crystal', color: '#0d9488', hp: 1200, value: 1000, price: 2500 },
  [BlockType.RIFT_ORE]: { name: 'Rift Ore', color: '#6d28d9', hp: 1500, value: 1500, price: 4000 },
  [BlockType.PHASE_ALLOY]: { name: 'Phase Alloy', color: '#8b5cf6', hp: 1800, value: 1800, price: 5000 },
  [BlockType.SINGULARITY_FRAGMENT]: { name: 'Singularity Fragment', color: '#db2777', hp: 2500, value: 2500, price: 7500 },
  [BlockType.DARK_MATTER]: { name: 'Dark Matter', color: '#18181b', hp: 3000, value: 3000, price: 10000 },
  [BlockType.ANTIMATTER]: { name: 'Antimatter', color: '#ffffff', hp: 4000, value: 4000, price: 15000 }, 
  [BlockType.EVENT_HORIZON_CORE]: { name: 'Event Horizon Core', color: '#000000', hp: 10000, value: 10000, price: 50000 }, 
  [BlockType.PARADOX_ORE]: { name: 'Paradox Ore', color: '#f43f5e', hp: 2200, value: 2200, price: 6000 },
  [BlockType.COLLAPSE_CRYSTAL]: { name: 'Collapse Crystal', color: '#6366f1', hp: 2800, value: 2800, price: 8000 },
  [BlockType.ENTROPY_ALLOY]: { name: 'Entropy Alloy', color: '#a855f7', hp: 3500, value: 3500, price: 11000 },
  [BlockType.REALITY_FRAGMENT]: { name: 'Reality Fragment', color: '#38bdf8', hp: 4500, value: 4500, price: 13000 },
  [BlockType.ABSOLUTE_VOID_CRYSTAL]: { name: 'Absolute Void', color: '#111827', hp: 6000, value: 6000, price: 20000 },
  [BlockType.VOID_STEEL]: { name: 'Void Steel', color: '#334155', hp: 2000, value: 1500, price: 5500 },
  [BlockType.PRIMORDIAL_VOID]: { name: 'Primordial Void', color: '#0f172a', hp: 5000, value: 5000, price: 18000 },
  [BlockType.ORIGIN_MATTER]: { name: 'Origin Matter', color: '#facc15', hp: 9000, value: 9000, price: 30000 },
};

export const BLOCK_COLORS = Object.fromEntries(Object.entries(BLOCK_DEFINITIONS).map(([k, v]) => [k, v.color])) as Record<BlockType, string>;
export const BLOCK_HP = Object.fromEntries(Object.entries(BLOCK_DEFINITIONS).map(([k, v]) => [k, v.hp])) as Record<BlockType, number>;
export const ORE_CHANCE = {}; 

export const ZONES: ZoneConfig[] = [
  {
    id: 'OVERWORLD',
    name: 'OVERWORLD ZONE',
    startDepth: 0,
    color: '#0ea5e9',
    baseBlock: BlockType.STONE,
    blocks: [
      { type: BlockType.COAL, chance: 0.04 },
      { type: BlockType.COPPER, chance: 0.035 },
      { type: BlockType.IRON, chance: 0.03 },
      { type: BlockType.QUARTZ, chance: 0.02 },
      { type: BlockType.GOLD, chance: 0.015 },
      { type: BlockType.REDSTONE, chance: 0.015 },
      { type: BlockType.LAPIS, chance: 0.01 },
      { type: BlockType.PALLADIUM, chance: 0.008 },
      { type: BlockType.DIAMOND, chance: 0.005 },
      { type: BlockType.COBALT, chance: 0.005 },
      { type: BlockType.TITANIUM, chance: 0.004 },
      { type: BlockType.MITHRIL, chance: 0.003 },
      { type: BlockType.ORICHALCUM, chance: 0.003 },
      { type: BlockType.ADAMANTITE, chance: 0.002 },
      { type: BlockType.TUNGSTEN, chance: 0.001 },
      { type: BlockType.NETHERITE, chance: 0.0005 },
    ]
  },
  {
    id: 'UNDERWORLD',
    name: 'UNDERWORLD ZONE',
    startDepth: 1000,
    color: '#ef4444',
    baseBlock: BlockType.ASHSTONE,
    blocks: [
      { type: BlockType.BRIMSTONE, chance: 0.06 },
      { type: BlockType.SULFUR_ORE, chance: 0.05 },
      { type: BlockType.SCORIA_IRON, chance: 0.04 },
      { type: BlockType.PYROCLAST, chance: 0.03 },
      { type: BlockType.MAGMA_GOLD, chance: 0.025 },
      { type: BlockType.BLOODSTONE, chance: 0.02 },
      { type: BlockType.HELLFORGED_IRON, chance: 0.015 },
      { type: BlockType.UNDERSTEEL, chance: 0.01 },
      { type: BlockType.SOUL_ORE, chance: 0.008 },
      { type: BlockType.OBSIDIAN_ORE, chance: 0.005 },
      { type: BlockType.INFERNIUM, chance: 0.003 },
      { type: BlockType.DEMONITE, chance: 0.002 },
      { type: BlockType.ABYSSAL_ALLOY, chance: 0.001 },
      { type: BlockType.BLACK_NETHERITE, chance: 0.0005 },
    ]
  },
  {
    id: 'VOID',
    name: 'VOID ZONE',
    startDepth: 2000,
    color: '#a855f7',
    baseBlock: BlockType.VOID_SHARD,
    blocks: [
      { type: BlockType.FRACTURED_OBSIDIAN, chance: 0.06 },
      { type: BlockType.NULLSTONE, chance: 0.05 },
      { type: BlockType.ECHO_CRYSTAL, chance: 0.04 },
      { type: BlockType.VOID_STEEL, chance: 0.03 },
      { type: BlockType.RIFT_ORE, chance: 0.025 },
      { type: BlockType.PHASE_ALLOY, chance: 0.02 },
      { type: BlockType.PARADOX_ORE, chance: 0.015 },
      { type: BlockType.COLLAPSE_CRYSTAL, chance: 0.01 },
      { type: BlockType.SINGULARITY_FRAGMENT, chance: 0.008 },
      { type: BlockType.ENTROPY_ALLOY, chance: 0.005 },
      { type: BlockType.REALITY_FRAGMENT, chance: 0.004 },
      { type: BlockType.DARK_MATTER, chance: 0.003 },
      { type: BlockType.PRIMORDIAL_VOID, chance: 0.002 },
      { type: BlockType.ABSOLUTE_VOID_CRYSTAL, chance: 0.001 },
      { type: BlockType.ANTIMATTER, chance: 0.0005 },
      { type: BlockType.ORIGIN_MATTER, chance: 0.0001 },
      { type: BlockType.EVENT_HORIZON_CORE, chance: 0.00001 },
    ]
  }
];

export const PICKAXE_TIERS: PickaxeStats[] = [
  { id: 'wood', name: 'Wooden Pickaxe', damage: 10, color: '#854d0e', price: 0 },
  { id: 'stone', name: 'Stone Pickaxe', damage: 25, color: '#94a3b8', price: 200 },
  { id: 'copper', name: 'Copper Pickaxe', damage: 45, color: '#f59e0b', price: 1000 },
  { id: 'iron', name: 'Iron Pickaxe', damage: 70, color: '#e2e8f0', price: 5000 },
  { id: 'gold', name: 'Golden Pickaxe', damage: 120, color: '#facc15', price: 15000 },
  { id: 'diamond', name: 'Diamond Pickaxe', damage: 250, color: '#06b6d4', price: 50000 },
  { id: 'netherite', name: 'Netherite Pickaxe', damage: 500, color: '#3f3f46', price: 150000 },
  { id: 'obsidian', name: 'Obsidian Pickaxe', damage: 800, color: '#1f2937', price: 400000 },
  { id: 'emerald', name: 'Emerald Pickaxe', damage: 1000, color: '#10b981', price: 750000 },
  { id: 'void', name: 'Void Pickaxe', damage: 1500, color: '#a855f7', price: 1500000 },
  { id: 'cosmic', name: 'Cosmic Pickaxe', damage: 5000, color: '#ec4899', price: 10000000 },
  { id: 'amethyst', name: 'Amethyst Pickaxe', damage: 7000, color: '#9333ea', price: 25000000 },
  { id: 'ruby', name: 'Ruby Pickaxe', damage: 9500, color: '#dc2626', price: 50000000 },
  { id: 'sapphire', name: 'Sapphire Pickaxe', damage: 12000, color: '#2563eb', price: 80000000 },
  { id: 'topaz', name: 'Topaz Pickaxe', damage: 15000, color: '#ea580c', price: 120000000 },
  { id: 'onyx', name: 'Onyx Pickaxe', damage: 20000, color: '#020617', price: 200000000 },
  { id: 'plasma', name: 'Plasma Pickaxe', damage: 28000, color: '#f0abfc', price: 350000000 },
  { id: 'quantum', name: 'Quantum Pickaxe', damage: 40000, color: '#22d3ee', price: 600000000 },
  { id: 'galactic', name: 'Galactic Pickaxe', damage: 55000, color: '#4f46e5', price: 1000000000 },
  { id: 'nebula', name: 'Nebula Pickaxe', damage: 75000, color: '#c026d3', price: 2000000000 },
  { id: 'supernova', name: 'Supernova Pickaxe', damage: 100000, color: '#facc15', price: 5000000000 },
  { id: 'blackhole', name: 'Singularity Pickaxe', damage: 150000, color: '#000000', price: 10000000000 },
  { id: 'infinity', name: 'Infinity Pickaxe', damage: 250000, color: '#f43f5e', price: 25000000000 },
  { id: 'divine', name: 'Divine Pickaxe', damage: 400000, color: '#fef3c7', price: 60000000000 },
  { id: 'omega', name: 'Omega Pickaxe', damage: 700000, color: '#be123c', price: 150000000000 },
  { id: 'alpha', name: 'Alpha Pickaxe', damage: 1000000, color: '#3b82f6', price: 300000000000 },
  { id: 'cyber', name: 'Cybernetic Pickaxe', damage: 1500000, color: '#0affff', price: 750000000000 },
  { id: 'mecha', name: 'Mecha Pickaxe', damage: 2200000, color: '#64748b', price: 1500000000000 },
  { id: 'steampunk', name: 'Aether Pickaxe', damage: 3500000, color: '#b45309', price: 3000000000000 },
  { id: 'glitch', name: 'Glitch Pickaxe', damage: 5000000, color: '#16a34a', price: 6000000000000 },
  { id: 'pixel', name: 'Pixel Pickaxe', damage: 8000000, color: '#8b5cf6', price: 12000000000000 },
  { id: 'stellar', name: 'Stellar Pickaxe', damage: 12000000, color: '#e879f9', price: 25000000000000 },
  { id: 'universal', name: 'Universal Pickaxe', damage: 20000000, color: '#38bdf8', price: 50000000000000 },
  { id: 'multiverse', name: 'Multiverse Pickaxe', damage: 50000000, color: '#ffffff', price: 100000000000000 },
  { id: 'finality', name: 'The Finality', damage: 999999999, color: '#ef4444', price: 999999999999999 },
  // Original 20 added previously
  { id: 'sun_shatterer', name: 'Sun Shatterer', damage: 1500000000, color: '#f97316', price: 2000000000000000 },
  { id: 'moon_cleaver', name: 'Moon Cleaver', damage: 2200000000, color: '#94a3b8', price: 4000000000000000 },
  { id: 'star_forged', name: 'Star Forged', damage: 3500000000, color: '#fde047', price: 8000000000000000 },
  { id: 'void_walker', name: 'Void Walker', damage: 5000000000, color: '#4c1d95', price: 16000000000000000 },
  { id: 'time_bender', name: 'Time Bender', damage: 8000000000, color: '#10b981', price: 32000000000000000 },
  { id: 'reality_slicer', name: 'Reality Slicer', damage: 12000000000, color: '#ec4899', price: 64000000000000000 },
  { id: 'dimension_breaker', name: 'Dimension Breaker', damage: 20000000000, color: '#06b6d4', price: 128000000000000000 },
  { id: 'quantum_destabilizer', name: 'Quantum Destabilizer', damage: 35000000000, color: '#22d3ee', price: 256000000000000000 },
  { id: 'matter_dissolver', name: 'Matter Dissolver', damage: 60000000000, color: '#d946ef', price: 512000000000000000 },
  { id: 'entropy_weaver', name: 'Entropy Weaver', damage: 100000000000, color: '#6366f1', price: 1000000000000000000 },
  { id: 'chaos_bringer', name: 'Chaos Bringer', damage: 200000000000, color: '#dc2626', price: 2000000000000000000 },
  { id: 'order_keeper', name: 'Order Keeper', damage: 400000000000, color: '#ffffff', price: 4000000000000000000 },
  { id: 'celestial_judgement', name: 'Celestial Judgement', damage: 800000000000, color: '#facc15', price: 8000000000000000000 },
  { id: 'infernal_fury', name: 'Infernal Fury', damage: 1600000000000, color: '#7f1d1d', price: 16000000000000000000 },
  { id: 'abyssal_scream', name: 'Abyssal Scream', damage: 3200000000000, color: '#020617', price: 32000000000000000000 },
  { id: 'eldritch_horror', name: 'Eldritch Horror', damage: 6400000000000, color: '#14b8a6', price: 64000000000000000000 },
  { id: 'cosmic_truth', name: 'Cosmic Truth', damage: 12800000000000, color: '#8b5cf6', price: 128000000000000000000 },
  { id: 'mathematical_constant', name: 'Math Constant', damage: 25600000000000, color: '#3b82f6', price: 256000000000000000000 },
  { id: 'developers_debugger', name: 'The Debugger', damage: 999999999999999, color: '#10b981', price: 999999999999999000000 },
  { id: 'the_end', name: 'THE END', damage: 10000000000000000, color: '#000000', price: 10000000000000000000000 },
  // Adding 20 MORE as requested
  { id: 'cyber_prime', name: 'Cyber Prime', damage: 15000000000000000, color: '#22d3ee', price: 20000000000000000000000 },
  { id: 'neo_tokyo', name: 'Neo Tokyo', damage: 20000000000000000, color: '#f472b6', price: 40000000000000000000000 },
  { id: 'chrome_heart', name: 'Chrome Heart', damage: 25000000000000000, color: '#94a3b8', price: 80000000000000000000000 },
  { id: 'data_miner', name: 'Data Miner', damage: 32000000000000000, color: '#4ade80', price: 160000000000000000000000 },
  { id: 'firewall_breach', name: 'Firewall Breach', damage: 40000000000000000, color: '#ef4444', price: 320000000000000000000000 },
  { id: 'zero_day', name: 'Zero Day', damage: 50000000000000000, color: '#a855f7', price: 640000000000000000000000 },
  { id: 'logic_bomb', name: 'Logic Bomb', damage: 65000000000000000, color: '#fbbf24', price: 1280000000000000000000000 },
  { id: 'mainframe_melter', name: 'Mainframe Melter', damage: 80000000000000000, color: '#ef4444', price: 2560000000000000000000000 },
  { id: 'system_override', name: 'System Override', damage: 100000000000000000, color: '#3b82f6', price: 5120000000000000000000000 },
  { id: 'root_access', name: 'Root Access', damage: 125000000000000000, color: '#10b981', price: 10240000000000000000000000 },
  { id: 'elemental_fury', name: 'Elemental Fury', damage: 160000000000000000, color: '#f59e0b', price: 20480000000000000000000000 },
  { id: 'storm_bringer', name: 'Storm Bringer', damage: 200000000000000000, color: '#0ea5e9', price: 40960000000000000000000000 },
  { id: 'earth_shaker', name: 'Earth Shaker', damage: 250000000000000000, color: '#78350f', price: 81920000000000000000000000 },
  { id: 'wind_whisper', name: 'Wind Whisper', damage: 320000000000000000, color: '#f1f5f9', price: 163840000000000000000000000 },
  { id: 'flame_warden', name: 'Flame Warden', damage: 400000000000000000, color: '#b91c1c', price: 327680000000000000000000000 },
  { id: 'tidal_wave', name: 'Tidal Wave', damage: 500000000000000000, color: '#1e40af', price: 655360000000000000000000000 },
  { id: 'abstract_thought', name: 'Abstract Thought', damage: 750000000000000000, color: '#db2777', price: 1310720000000000000000000000 },
  { id: 'surreal_dream', name: 'Surreal Dream', damage: 1000000000000000000, color: '#8b5cf6', price: 2621440000000000000000000000 },
  { id: 'lucid_nightmare', name: 'Lucid Nightmare', damage: 1500000000000000000, color: '#4c1d95', price: 5242880000000000000000000000 },
  { id: 'waking_life', name: 'Waking Life', damage: 2000000000000000000, color: '#ffffff', price: 10485760000000000000000000000 }
];

export const ABILITIES: Record<string, AbilityDef> = {
    // PASSIVE
    'luck': { id: 'luck', name: 'Mining Luck', description: '+10% Ore Chance (Stacks)', price: 5000, cooldown: 0, icon: 'TrendingUp', type: 'PASSIVE' },
    'efficiency': { id: 'efficiency', name: 'Efficiency', description: '+20% Sell Value (Stacks)', price: 10000, cooldown: 0, icon: 'DollarSign', type: 'PASSIVE' },
    
    // ACTIVE (Player abilities with cooldowns)
    'tnt_bundle': { id: 'tnt_bundle', name: 'TNT Bundle', description: 'Drop 5 TNTs', price: 2000, cooldown: 30, icon: 'Bomb', type: 'ACTIVE' },
    'magnet': { id: 'magnet', name: 'Loot Magnet', description: 'Pull all loose blocks for 10s', price: 8000, cooldown: 60, icon: 'Magnet', type: 'ACTIVE' },
    'drill': { id: 'drill', name: 'Giga Drill', description: 'Shred blocks on contact for 5s', price: 15000, cooldown: 120, icon: 'Disc', type: 'ACTIVE' },
    'freeze': { id: 'freeze', name: 'Time Freeze', description: 'Slow down physics for 10s', price: 20000, cooldown: 90, icon: 'Snowflake', type: 'ACTIVE' },
    'nuke': { id: 'nuke', name: 'Tactical Nuke', description: 'Spawn a Mega TNT', price: 50000, cooldown: 300, icon: 'Radiation', type: 'ACTIVE' },
};


export enum BlockType {
  AIR = 0,
  // OVERWORLD
  STONE = 1,
  COAL = 2,
  COPPER = 3,
  IRON = 4,
  GOLD = 5,
  REDSTONE = 6,
  LAPIS = 7,
  QUARTZ = 8,
  DIAMOND = 9,
  NETHERITE = 10,
  COBALT = 11,
  TITANIUM = 12,
  TUNGSTEN = 13,
  MITHRIL = 14,
  ADAMANTITE = 15,
  ORICHALCUM = 16,
  PALLADIUM = 17,

  // UNDERWORLD
  ASHSTONE = 100,
  BRIMSTONE = 101,
  SULFUR_ORE = 102,
  SCORIA_IRON = 103,
  MAGMA_GOLD = 104,
  INFERNIUM = 105,
  HELLFORGED_IRON = 106,
  OBSIDIAN_ORE = 107,
  PYROCLAST = 108,
  BLOODSTONE = 109,
  DEMONITE = 110,
  SOUL_ORE = 111,
  BLACK_NETHERITE = 112,
  ABYSSAL_ALLOY = 113,
  UNDERSTEEL = 114,

  // VOID
  VOID_SHARD = 200,
  FRACTURED_OBSIDIAN = 201,
  NULLSTONE = 202,
  ECHO_CRYSTAL = 203,
  RIFT_ORE = 204,
  PHASE_ALLOY = 205,
  SINGULARITY_FRAGMENT = 206,
  DARK_MATTER = 207,
  ANTIMATTER = 208,
  EVENT_HORIZON_CORE = 209,
  PARADOX_ORE = 210,
  COLLAPSE_CRYSTAL = 211,
  ENTROPY_ALLOY = 212,
  REALITY_FRAGMENT = 213,
  ABSOLUTE_VOID_CRYSTAL = 214,
  VOID_STEEL = 215,
  PRIMORDIAL_VOID = 216,
  ORIGIN_MATTER = 217,

  BEDROCK = 999,
  LOOT_CRATE = 888
}

export interface Block {
  x: number;
  y: number;
  type: BlockType;
  hp: number;
  maxHp: number;
  id: string;
  value?: number; // monetary value for loot crates
  variant?: number; // 0: Normal, 1: Darker, 2: Lighter (For stone variants)
}

export interface PhysicsObject {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  rotation: number;
  vRotation: number;
  type: 'PICKAXE' | 'BALL' | 'TNT' | 'MEGATNT' | 'PROFILE_PIC' | 'MAGNET_FIELD';
  id: string;
  hp: number;
  maxHp: number;
  spawnTime?: number;
  label?: string;
  imageUrl?: string; // For Super Chat profile pics
}

export interface Debris {
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: string;
  life: number;
  size: number;
}

export type Platform = 'OFFLINE' | 'TWITCH' | 'YOUTUBE';

export interface TextureConfig {
  pickaxe?: string;
  ball?: string;
  stone?: string;
  ore?: string;
}

export interface Keybinds {
  spawnBall: string;
  spawnTnt: string;
  megaTnt: string;
  restart: string;
  settings: string;
  leaderboard: string;
  pause: string;
  shop: string;
  ability1: string;
  ability2: string;
  ability3: string;
  ability4: string;
}

export interface GameConfig {
  platform: Platform;
  channelId: string; // Twitch Channel OR YouTube Channel ID
  liveStreamId: string; // YouTube Video ID for the stream
  apiKey: string;
  gravity: number;
  textures: TextureConfig;
  chatControl: boolean; // Corresponds to CHAT_CONTROL. If false, auto-simulation runs.
  disabledCommands: string[];
  keybinds: Keybinds;
  
  // Chaos / Simulation Configs
  ytPollInterval: number;
  tntSpawnIntervalMin: number;
  tntSpawnIntervalMax: number;
  tntAmountOnSuperchat: number;
  fastSlowIntervalMin: number;
  fastSlowIntervalMax: number;
  fastSlowDuration: number;
  randomPickaxeIntervalMin: number; // For "random pickaxe" fake event (implemented as Heal/Resize chaos)
  randomPickaxeIntervalMax: number;
  pickaxeEnlargeIntervalMin: number;
  pickaxeEnlargeIntervalMax: number;
  pickaxeEnlargeDuration: number;
  saveProgressInterval: number;
  queuesPopInterval: number;
}

export interface ChatMessage {
  user: string;
  message: string;
  color?: string;
  platform?: 'twitch' | 'youtube' | 'offline';
  isDonation?: boolean;
  donationAmount?: number;
  profileUrl?: string;
}

export interface ResourceState {
  inventory: Record<number, number>; // BlockType ID -> Count
  money: number;
  score: number;
  depth: number;
  pickaxeTier: string;
  currentZone: string;
  luckMultiplier: number;
  moneyMultiplier: number;
  ownedAbilities: string[]; // IDs of unlocked active abilities
  abilityCooldowns: Record<string, number>; // Ability ID -> Timestamp when ready
}

export interface GameEvent {
  action: 'SPAWN_BALLS' | 'SPAWN_TNT' | 'SPAWN_MEGATNT' | 'SET_SPEED' | 'RESIZE_PICKAXE' | 'CHANGE_MATERIAL' | 'COMMENTARY' | 'HEAL_PICKAXE' | 'RESET_GAME' | 'TRIGGER_CHALLENGE' | 'DONATION_EVENT' | 'ACTIVATE_MAGNET' | 'ACTIVATE_DRILL' | 'ACTIVATE_FREEZE' | 'SPAWN_LOOT';
  data?: any;
  reason?: string;
}

export interface PickaxeStats {
  id: string;
  name: string;
  damage: number;
  color: string;
  price: number;
}

export interface GameSession {
  id: string;
  date: string; // ISO string
  score: number;
  depth: number;
  duration: number; // seconds
  platform: Platform;
}

export interface Challenge {
  id: string;
  name: string;
  description: string;
  duration: number; // seconds
  effect: 'GRAVITY_LOW' | 'GRAVITY_HIGH' | 'TNT_STORM' | 'GOLD_RUSH' | 'SPEED_BOOST';
  isActive: boolean;
  remainingTime: number;
}

export type ZoneType = 'OVERWORLD' | 'UNDERWORLD' | 'VOID';

export interface ZoneConfig {
  id: ZoneType;
  name: string;
  startDepth: number; // In blocks (approx 1m per block for simplicity, or 1000 threshold logic)
  color: string;
  blocks: { type: BlockType; chance: number }[];
  baseBlock: BlockType;
}

export interface AbilityDef {
  id: string;
  name: string;
  description: string;
  price: number;
  cooldown: number; // in seconds
  icon: string; // Lucide icon name or simple string identifier
  type: 'ACTIVE' | 'PASSIVE';
}

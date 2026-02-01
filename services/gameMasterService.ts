import { GameEvent } from '../types';

// Strict Command Mapping
const COMMANDS: Record<string, GameEvent> = {
  // Spawns
  'tnt': { action: 'SPAWN_TNT' },
  'bomb': { action: 'SPAWN_TNT' },
  'boom': { action: 'SPAWN_TNT' },
  'ball': { action: 'SPAWN_BALLS', data: '1' },
  'balls': { action: 'SPAWN_BALLS', data: '5' },
  'drop': { action: 'SPAWN_BALLS', data: '3' },
  'spam': { action: 'SPAWN_BALLS', data: '10' },
  'loot': { action: 'SPAWN_LOOT', data: 'crate' },
  'money': { action: 'SPAWN_LOOT', data: 'crate' },
  'rich': { action: 'SPAWN_LOOT', data: 'gold_rush' },

  // Special Abilities (Chat Versions)
  'nuke': { action: 'SPAWN_MEGATNT', data: 'Chat Nuke' },
  'magnet': { action: 'ACTIVATE_MAGNET' },
  'drill': { action: 'ACTIVATE_DRILL' },
  'freeze': { action: 'ACTIVATE_FREEZE' },
  'stop': { action: 'ACTIVATE_FREEZE' },
  'ice': { action: 'ACTIVATE_FREEZE' },

  // Game Speed
  'fast': { action: 'SET_SPEED', data: 'fast' },
  'speed': { action: 'SET_SPEED', data: 'fast' },
  'slow': { action: 'SET_SPEED', data: 'slow' },
  'normal': { action: 'SET_SPEED', data: 'normal' },

  // Pickaxe Size
  'big': { action: 'RESIZE_PICKAXE', data: 'big' },
  'giant': { action: 'RESIZE_PICKAXE', data: 'big' },
  'small': { action: 'RESIZE_PICKAXE', data: 'normal' },
  'tiny': { action: 'RESIZE_PICKAXE', data: 'small' },
  'reset': { action: 'RESIZE_PICKAXE', data: 'normal' },

  // Health
  'heal': { action: 'HEAL_PICKAXE' },
  'fix': { action: 'HEAL_PICKAXE' },
  'repair': { action: 'HEAL_PICKAXE' },

  // Gravity
  'fly': { action: 'TRIGGER_CHALLENGE', data: 'grav_low' },
  'moon': { action: 'TRIGGER_CHALLENGE', data: 'grav_low' },

  // Materials
  'wood': { action: 'CHANGE_MATERIAL', data: 'wood' },
  'stone': { action: 'CHANGE_MATERIAL', data: 'stone' },
  'copper': { action: 'CHANGE_MATERIAL', data: 'copper' },
  'iron': { action: 'CHANGE_MATERIAL', data: 'iron' },
  'gold': { action: 'CHANGE_MATERIAL', data: 'gold' },
  'diamond': { action: 'CHANGE_MATERIAL', data: 'diamond' },
  'netherite': { action: 'CHANGE_MATERIAL', data: 'netherite' },
};

const HYPE_COMMENTS = [
  "Digging straight down!",
  "Chat is controlling physics!",
  "MegaTNT inbound?",
  "Netherite detected?",
  "Maximum chaos enabled!",
  "Giga Drill Breaker!",
  "We're rich!",
  "Physics engine crying rn",
];

export const analyzeChatBatch = (messages: string[]): GameEvent | null => {
  if (messages.length === 0) return null;

  // Iterate backwards to find the latest command
  for (let i = messages.length - 1; i >= 0; i--) {
    const msg = messages[i].toLowerCase().trim();
    
    // Rare Restart Command
    if (msg === '!restart' || msg === 'restart') {
      // 0.5% chance to actually trigger the restart
      if (Math.random() < 0.005) {
         return { action: 'RESET_GAME' };
      }
      // If it fails the chance, ignore it and continue searching for other commands
      continue;
    }

    // Check strict commands
    for (const [key, event] of Object.entries(COMMANDS)) {
       if (msg === `!${key}` || msg === key) {
         return event;
       }
    }

    if (msg.includes('rain')) return { action: 'SPAWN_TNT', data: 'rain' }; 
  }

  // Fallback to random commentary
  if (Math.random() < 0.05) {
    return { 
      action: 'COMMENTARY', 
      data: HYPE_COMMENTS[Math.floor(Math.random() * HYPE_COMMENTS.length)] 
    };
  }

  return null;
};

export const getAchievementComment = (ore: string): string => {
   return `Found ${ore}!`;
};

export const generateOfflineMessage = (): { user: string; message: string } => {
  const users = ["MinerSteve", "DigDug", "Notch", "Herobrine", "Terrarian", "User123"];
  const msgs = [
    "tnt", "ball", "fast", "slow", "big",
    "diamond", "netherite", "iron", "gold",
    "wow", "nice", "!drop", "balls", "magnet", "nuke", "drill"
  ];

  return {
    user: users[Math.floor(Math.random() * users.length)],
    message: msgs[Math.floor(Math.random() * msgs.length)]
  };
};
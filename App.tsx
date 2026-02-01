
import React, { useState, useEffect, useCallback, useRef } from 'react';
import Game from './components/Game';
import Overlay from './components/Overlay';
import Settings from './components/Settings';
import Leaderboard from './components/Leaderboard';
import Shop from './components/Shop';
import { GameConfig, ChatMessage, ResourceState, GameEvent, BlockType, Achievement } from './types';
import { connectTwitch } from './services/twitchService';
import { connectYouTube, getSubscriberCount } from './services/youtubeService';
import { analyzeChatBatch, generateOfflineMessage } from './services/gameMasterService';
import { BLOCK_DEFINITIONS, ACHIEVEMENTS } from './constants';

const DEFAULT_CONFIG: GameConfig = {
  platform: 'OFFLINE',
  channelId: '', 
  liveStreamId: '',
  apiKey: '',
  gravity: 0.5,
  textures: {},
  chatControl: false, // Default to FALSE to enable Chaos Mode by default
  disabledCommands: [],
  keybinds: {
      spawnBall: 'b',
      spawnTnt: 't',
      megaTnt: 'm',
      restart: 'p',
      settings: 'l',
      leaderboard: 'tab',
      pause: 'v',
      shop: 's',
      ability1: '1',
      ability2: '2',
      ability3: '3',
      ability4: '4'
  },
  // Default Chaos Config & Quota Safety
  ytPollInterval: 15, // Updated to 15s per user request (Note: High quota usage)
  tntSpawnIntervalMin: 5,
  tntSpawnIntervalMax: 30,
  tntAmountOnSuperchat: 10,
  fastSlowIntervalMin: 5,
  fastSlowIntervalMax: 30,
  fastSlowDuration: 5,
  randomPickaxeIntervalMin: 5,
  randomPickaxeIntervalMax: 30,
  pickaxeEnlargeIntervalMin: 5,
  pickaxeEnlargeIntervalMax: 30,
  pickaxeEnlargeDuration: 5,
  saveProgressInterval: 30,
  queuesPopInterval: 5
};

export default function App() {
  const [config, setConfig] = useState<GameConfig>(() => {
    const saved = localStorage.getItem('minigame_config_v3'); 
    return saved ? { ...DEFAULT_CONFIG, ...JSON.parse(saved) } : DEFAULT_CONFIG;
  });

  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isLeaderboardOpen, setIsLeaderboardOpen] = useState(false);
  const [isShopOpen, setIsShopOpen] = useState(false);

  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  
  // Centralized State
  const [resources, setResources] = useState<ResourceState>({
    inventory: {}, 
    money: 0,
    score: 0, 
    depth: 0, 
    pickaxeTier: 'wood', 
    currentZone: 'OVERWORLD',
    luckMultiplier: 1.0,
    moneyMultiplier: 1.0,
    fortuneMultiplier: 1.0,
    ownedAbilities: [],
    abilityCooldowns: {},
    lockedItems: [],
    unlockedAchievements: []
  });
  
  const [gameEvent, setGameEvent] = useState<GameEvent | null>(null);
  const [gameComment, setGameComment] = useState<string | null>(null);
  const [recentAchievement, setRecentAchievement] = useState<Achievement | null>(null);

  // Chaos Engine Refs
  const chaosTimeouts = useRef<Record<string, NodeJS.Timeout>>({});
  
  // COMMAND QUEUE SYSTEM
  const commandQueuesRef = useRef<Record<string, GameEvent[]>>({});

  // Helper to schedule variable intervals
  const scheduleChaos = useCallback((key: string, minSeconds: number, maxSeconds: number, action: () => void) => {
      if (chaosTimeouts.current[key]) clearTimeout(chaosTimeouts.current[key]);
      
      const delay = (Math.random() * (maxSeconds - minSeconds) + minSeconds) * 1000;
      
      chaosTimeouts.current[key] = setTimeout(() => {
          action();
          // Reschedule
          scheduleChaos(key, minSeconds, maxSeconds, action);
      }, delay);
  }, []);

  // Clear system messages after delay
  useEffect(() => {
      if (gameComment) {
          const timer = setTimeout(() => setGameComment(null), 8000);
          return () => clearTimeout(timer);
      }
  }, [gameComment]);

  // Clear achievement toast
  useEffect(() => {
      if (recentAchievement) {
          const timer = setTimeout(() => setRecentAchievement(null), 5000);
          return () => clearTimeout(timer);
      }
  }, [recentAchievement]);

  // Check Achievements on Resource Update
  useEffect(() => {
      const newUnlocks: string[] = [];
      let updated = false;

      ACHIEVEMENTS.forEach(ach => {
          if (!resources.unlockedAchievements.includes(ach.id)) {
              if (ach.condition(resources)) {
                  newUnlocks.push(ach.id);
                  setRecentAchievement(ach);
                  updated = true;
              }
          }
      });

      if (updated) {
          setResources(prev => ({
              ...prev,
              unlockedAchievements: [...prev.unlockedAchievements, ...newUnlocks]
          }));
      }
  }, [resources.depth, resources.money, resources.pickaxeTier]);

  // Random World Event Generator
  useEffect(() => {
     const eventInterval = setInterval(() => {
         // 20% chance every minute to trigger a random world event if nothing else is happening
         if (!gameEvent && Math.random() < 0.2) {
             const events = ['GRAVITY_LOW', 'TNT_STORM', 'GOLD_RUSH', 'SPEED_BOOST'];
             const randomEvent = events[Math.floor(Math.random() * events.length)];
             
             setGameEvent({ 
                 action: 'TRIGGER_CHALLENGE', 
                 data: randomEvent,
                 reason: 'WORLD_EVENT'
             });
             setGameComment(`⚠️ WORLD EVENT: ${randomEvent.replace('_', ' ')}!`);
             
             // Clear event trigger after brief moment so Game can process it
             setTimeout(() => setGameEvent(null), 1000);
         }
     }, 60000); // Check every minute

     return () => clearInterval(eventInterval);
  }, [gameEvent]);

  // Connection Handler
  useEffect(() => {
    let cleanup: (() => void) | undefined;
    setChatMessages([]); 

    if (config.platform === 'TWITCH' && config.channelId) {
      cleanup = connectTwitch(config.channelId, (msg) => {
        setChatMessages(prev => [...prev.slice(-49), { ...msg, platform: 'twitch' }]);
      });
    } else if (config.platform === 'YOUTUBE' && config.liveStreamId && config.apiKey) {
      // Connect using liveStreamId and enforce the safe poll interval
      connectYouTube(config.liveStreamId, config.apiKey, (msg) => {
         setChatMessages(prev => [...prev.slice(-49), { ...msg, platform: 'youtube' }]);
      }, config.ytPollInterval * 1000).then(c => cleanup = c);
    } else if (config.platform === 'OFFLINE') {
      const interval = setInterval(() => {
         const msg = generateOfflineMessage();
         setChatMessages(prev => [...prev.slice(-49), { ...msg, color: '#4ade80', platform: 'offline' }]);
      }, 2000 + Math.random() * 3000); 
      cleanup = () => clearInterval(interval);
    }

    return () => {
      if (cleanup) cleanup();
    };
  }, [config.platform, config.channelId, config.liveStreamId, config.apiKey, config.ytPollInterval]);

  // Chaos Engine (Fake Chat Activity)
  useEffect(() => {
      // Clear existing timeouts
      Object.values(chaosTimeouts.current).forEach(t => clearTimeout(t));
      chaosTimeouts.current = {};

      // If Chat Control is TRUE, we rely on real chat. If FALSE, we run the chaos engine.
      if (!config.chatControl) {
          console.log("Chaos Engine Started");

          // 1. TNT Spawning
          scheduleChaos('tnt', config.tntSpawnIntervalMin, config.tntSpawnIntervalMax, () => {
              setGameEvent({ action: 'SPAWN_TNT' });
              setTimeout(() => setGameEvent(null), 1000);
          });

          // 2. Fast/Slow Motion
          scheduleChaos('speed', config.fastSlowIntervalMin, config.fastSlowIntervalMax, () => {
              const type = Math.random() > 0.5 ? 'fast' : 'slow';
              setGameEvent({ action: 'SET_SPEED', data: type });
              // Reset after duration
              setTimeout(() => {
                  setGameEvent({ action: 'SET_SPEED', data: 'normal' });
              }, config.fastSlowDuration * 1000);
          });

          // 3. Pickaxe Enlarge/Shrink
          scheduleChaos('size', config.pickaxeEnlargeIntervalMin, config.pickaxeEnlargeIntervalMax, () => {
              const type = Math.random() > 0.5 ? 'big' : 'small';
              setGameEvent({ action: 'RESIZE_PICKAXE', data: type });
              setTimeout(() => {
                  setGameEvent({ action: 'RESIZE_PICKAXE', data: 'normal' });
              }, config.pickaxeEnlargeDuration * 1000);
          });

          // 4. Random Pickaxe Events (Magnet / Drill / Freeze)
          scheduleChaos('random', config.randomPickaxeIntervalMin, config.randomPickaxeIntervalMax, () => {
               const roll = Math.random();
               if (roll < 0.33) {
                   setGameEvent({ action: 'ACTIVATE_MAGNET' });
               } else if (roll < 0.66) {
                   setGameEvent({ action: 'ACTIVATE_DRILL' });
               } else {
                   setGameEvent({ action: 'ACTIVATE_FREEZE' });
               }
               setTimeout(() => setGameEvent(null), 2000);
          });
      }

      return () => {
           Object.values(chaosTimeouts.current).forEach(t => clearTimeout(t));
      };
  }, [config, scheduleChaos]);

  // Chat Analysis & Queue Ingestion
  useEffect(() => {
    if (!config.chatControl) return; // Skip if in Chaos Mode

    const interval = setInterval(() => {
      const recentMessages = chatMessages.slice(-10).map(m => m.message);
      if (recentMessages.length === 0) return;

      const event = analyzeChatBatch(recentMessages);
      
      if (event) {
        if (event.action === 'COMMENTARY' && typeof event.data === 'string') {
             // Commentary bypasses queue, immediate toast
             setGameComment(event.data);
        } else {
             // PUSH TO QUEUE
             // Initialize queue for this type if not exists
             if (!commandQueuesRef.current[event.action]) {
                 commandQueuesRef.current[event.action] = [];
             }
             // Add event to specific queue
             commandQueuesRef.current[event.action].push(event);
        }
      }
    }, 3000); // Check chat every 3s (batched)

    return () => clearInterval(interval);
  }, [chatMessages, config.chatControl]);

  // QUEUE PROCESSOR (The Timer)
  useEffect(() => {
      if (!config.chatControl) return;

      const queueInterval = setInterval(() => {
          // Identify all populated queues
          const activeKeys = Object.keys(commandQueuesRef.current).filter(k => commandQueuesRef.current[k].length > 0);
          
          if (activeKeys.length === 0) return;

          // Strategy: Pop one item from EACH active queue type to ensure variety
          // Stagger them slightly so React/Game loop can process distinct state updates
          activeKeys.forEach((key, index) => {
              const eventToFire = commandQueuesRef.current[key].shift();
              
              if (eventToFire) {
                  setTimeout(() => {
                      // We create a new object reference to ensure useEffect triggers in Game component
                      setGameEvent({ ...eventToFire }); 
                      setGameComment(`${eventToFire.action} executed!`);
                      setTimeout(() => setGameEvent(null), 400); // Clear shortly after
                  }, index * 500); // 500ms delay between different command types
              }
          });

      }, config.queuesPopInterval * 1000);

      return () => clearInterval(queueInterval);
  }, [config.chatControl, config.queuesPopInterval]);

  const handleConfigSave = useCallback((newConfig: GameConfig) => {
    setConfig(newConfig);
    localStorage.setItem('minigame_config_v3', JSON.stringify(newConfig));
  }, []);

  const handleSellAll = useCallback(() => {
      setResources(prev => {
          let total = 0;
          const newInventory = { ...prev.inventory };
          const locked = prev.lockedItems || [];
          
          Object.entries(newInventory).forEach(([key, count]) => {
              const type = parseInt(key) as BlockType;
              // Skip if locked
              if (locked.includes(type)) return;

              const def = BLOCK_DEFINITIONS[type];
              if (def && def.price > 0) {
                  total += def.price * count;
                  newInventory[type] = 0;
              }
          });
          
          total = Math.floor(total * (prev.moneyMultiplier || 1));

          if (total > 0) {
              return {
                  ...prev,
                  money: prev.money + total,
                  inventory: newInventory
              };
          }
          return prev;
      });
  }, []);

  const handleToggleLock = useCallback((type: number) => {
      setResources(prev => {
          const isLocked = prev.lockedItems.includes(type);
          const newLocks = isLocked 
              ? prev.lockedItems.filter(t => t !== type)
              : [...prev.lockedItems, type];
          return { ...prev, lockedItems: newLocks };
      });
  }, []);

  const handleBuyUpgrade = useCallback((tierId: string, cost: number) => {
      setResources(prev => {
        if (prev.money >= cost) {
            return {
                ...prev,
                money: prev.money - cost,
                pickaxeTier: tierId
            };
        }
        return prev;
      });
  }, []);

  const handleBuyAbility = useCallback((abilityId: string, cost: number) => {
      setResources(prev => {
          if (prev.money >= cost) {
              if (abilityId === 'luck') {
                  return {
                      ...prev,
                      money: prev.money - cost,
                      luckMultiplier: (prev.luckMultiplier || 1) + 0.1
                  };
              } else if (abilityId === 'efficiency') {
                  return {
                      ...prev,
                      money: prev.money - cost,
                      moneyMultiplier: (prev.moneyMultiplier || 1) + 0.2
                  };
              } else if (abilityId === 'fortune') {
                  return {
                      ...prev,
                      money: prev.money - cost,
                      fortuneMultiplier: (prev.fortuneMultiplier || 1) + 0.5
                  };
              } else {
                   return {
                      ...prev,
                      money: prev.money - cost,
                      ownedAbilities: prev.ownedAbilities.includes(abilityId) ? prev.ownedAbilities : [...prev.ownedAbilities, abilityId]
                   };
              }
          }
          return prev;
      });
  }, []);

  const handleDepthUpdate = useCallback((d: number) => {
      setResources(prev => ({ ...prev, depth: d }));
  }, []);

  const handleSimulateMessage = useCallback((msg: ChatMessage) => {
      setChatMessages(prev => [...prev.slice(-49), msg]);
  }, []);

  return (
    <div className="fixed inset-0 w-full h-full overflow-hidden bg-black font-sans select-none text-white">
      <Game 
        chatMessages={chatMessages} 
        lastGameEvent={gameEvent}
        resourceState={resources}
        onResourceUpdate={setResources}
        onDepthUpdate={handleDepthUpdate}
        isSettingsOpen={isSettingsOpen}
        isLeaderboardOpen={isLeaderboardOpen}
        isShopOpen={isShopOpen}
        config={config}
        toggleSettings={() => setIsSettingsOpen(prev => !prev)}
        toggleLeaderboard={() => setIsLeaderboardOpen(prev => !prev)}
        toggleShop={() => setIsShopOpen(prev => !prev)}
      />
      
      <Overlay 
        resources={resources} 
        chatMessages={chatMessages}
        gameComment={gameComment}
        gameEvent={gameEvent}
        onOpenShop={() => setIsShopOpen(true)}
        config={config}
        recentAchievement={recentAchievement}
      />

      <Settings 
        isOpen={isSettingsOpen} 
        onClose={() => setIsSettingsOpen(false)} 
        config={config} 
        onSave={handleConfigSave}
        onSimulate={handleSimulateMessage}
      />

      <Leaderboard 
        isOpen={isLeaderboardOpen}
        onClose={() => setIsLeaderboardOpen(false)}
      />

      <Shop 
          isOpen={isShopOpen}
          onClose={() => setIsShopOpen(false)}
          resourceState={resources}
          onSellAll={handleSellAll}
          onBuyUpgrade={handleBuyUpgrade}
          onBuyAbility={handleBuyAbility}
          onToggleLock={handleToggleLock}
      />

      {!isSettingsOpen && !isLeaderboardOpen && !isShopOpen && config.platform === 'OFFLINE' && (
        <div className="absolute top-4 right-4 text-xs text-slate-500 pointer-events-none z-[60] flex flex-col items-end gap-1">
           <span>OFFLINE MODE ACTIVE</span>
           <span>PRESS '{config.keybinds.settings.toUpperCase()}' FOR SETTINGS</span>
           <span>PRESS '{config.keybinds.shop.toUpperCase()}' FOR SHOP</span>
        </div>
      )}
    </div>
  );
}

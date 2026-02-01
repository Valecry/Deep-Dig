import React, { useEffect, useRef, useCallback, useState } from 'react';
import { BLOCK_SIZE, BLOCK_COLORS, BLOCK_HP, BLOCK_DEFINITIONS, GRAVITY, FRICTION, PICKAXE_TIERS, ZONES, ABILITIES } from '../constants';
import { Block, BlockType, PhysicsObject, ResourceState, ChatMessage, GameEvent, GameConfig, Debris, Challenge, GameSession, ZoneConfig } from '../types';
import { saveGameSession } from '../services/storageService';

interface GameProps {
  chatMessages: ChatMessage[];
  lastGameEvent: GameEvent | null;
  onResourceUpdate: (res: ResourceState) => void;
  onDepthUpdate: (depth: number) => void;
  isSettingsOpen: boolean;
  isLeaderboardOpen: boolean;
  config: GameConfig;
  toggleSettings: () => void;
  toggleLeaderboard: () => void;
  toggleShop: () => void;
  isShopOpen: boolean;
  resourceState: ResourceState;
}

const CHALLENGES: Challenge[] = [
    { id: 'grav_low', name: 'Moon Gravity', description: 'Gravity is reduced by 50%', duration: 30, effect: 'GRAVITY_LOW', isActive: false, remainingTime: 0 },
    { id: 'tnt_storm', name: 'TNT Storm', description: 'It\'s raining explosives!', duration: 15, effect: 'TNT_STORM', isActive: false, remainingTime: 0 },
    { id: 'gold_rush', name: 'Gold Rush', description: 'Every block might be gold!', duration: 20, effect: 'GOLD_RUSH', isActive: false, remainingTime: 0 },
];

const Game: React.FC<GameProps> = ({ chatMessages, lastGameEvent, onResourceUpdate, onDepthUpdate, isSettingsOpen, isLeaderboardOpen, isShopOpen, config, toggleSettings, toggleLeaderboard, toggleShop, resourceState }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isPaused, setIsPaused] = useState(false);
  const [activeChallenges, setActiveChallenges] = useState<Challenge[]>([]);
  const [zoneNotification, setZoneNotification] = useState<ZoneConfig | null>(null);
  
  // Game State Refs
  const blocksRef = useRef<Block[]>([]);
  const particlesRef = useRef<PhysicsObject[]>([]); 
  const debrisRef = useRef<Debris[]>([]); 
  const worldWidthBlocksRef = useRef(14); // Default, updated on mount
  
  const pickaxeRef = useRef<PhysicsObject>({
    x: 0, y: 0, vx: 2, vy: 0, radius: 20, rotation: 0, vRotation: 0.1, type: 'PICKAXE', id: 'hero', hp: 1000, maxHp: 1000
  });

  // Ability State Refs
  const magnetActiveRef = useRef(false);
  const drillActiveRef = useRef(false);
  const freezeActiveRef = useRef(false);
  
  const cameraYRef = useRef(0);
  const cameraShakeRef = useRef(0);
  const timeScaleRef = useRef(1.0); 
  const sizeMultiplierRef = useRef(1.0);

  const megaTntQueueRef = useRef<string[]>([]);
  const startTimeRef = useRef(Date.now());
  const queueProcessorRef = useRef<NodeJS.Timeout | null>(null);
  
  const resourceStateRef = useRef<ResourceState>(resourceState);
  const onResourceUpdateRef = useRef(onResourceUpdate);
  const onDepthUpdateRef = useRef(onDepthUpdate);

  // Sync prop state to ref
  useEffect(() => {
    resourceStateRef.current = resourceState;
  }, [resourceState]);

  useEffect(() => {
    onResourceUpdateRef.current = onResourceUpdate;
  }, [onResourceUpdate]);

  useEffect(() => {
    onDepthUpdateRef.current = onDepthUpdate;
  }, [onDepthUpdate]);

  const frameIdRef = useRef(0);
  const lastProcessedEventRef = useRef<GameEvent | null>(null);
  const texturesRef = useRef<Record<string, HTMLImageElement>>({});
  const profileImagesRef = useRef<Map<string, HTMLImageElement>>(new Map());
  const currentZoneRef = useRef<ZoneConfig>(ZONES[0]);

  // Challenge Interval
  useEffect(() => {
     const interval = setInterval(() => {
         setActiveChallenges(prev => {
             return prev.map(c => ({...c, remainingTime: c.remainingTime - 1})).filter(c => c.remainingTime > 0);
         });
     }, 1000);
     return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (config?.textures) {
      const loadTexture = (key: string, url?: string) => {
        if (!url) return;
        const img = new Image();
        img.src = url;
        img.onload = () => { texturesRef.current[key] = img; };
      };
      loadTexture('pickaxe', config.textures.pickaxe);
      loadTexture('ball', config.textures.ball);
      loadTexture('stone', config.textures.stone);
      loadTexture('ore', config.textures.ore);
    }
  }, [config?.textures]);

  const getZoneForDepth = (depth: number): ZoneConfig => {
      for (let i = ZONES.length - 1; i >= 0; i--) {
          if (depth >= ZONES[i].startDepth) {
              return ZONES[i];
          }
      }
      return ZONES[0];
  };

  const generateRow = (yIndex: number, isGoldRush = false) => {
    const row: Block[] = [];
    const generationZone = getZoneForDepth(yIndex);
    const hpMultiplier = 1 + (yIndex * 0.002); 
    const width = worldWidthBlocksRef.current;

    for (let x = 0; x < width; x++) {
      let type = generationZone.baseBlock;
      let variant = 0; 
      const rand = Math.random();

      if (x === 0 || x === width - 1) {
          type = BlockType.BEDROCK;
      } else if (isGoldRush) {
          if (rand < 0.2) type = BlockType.GOLD;
          else if (rand < 0.25) type = BlockType.MAGMA_GOLD;
      } else {
          let cumulative = 0;
          for (const ore of generationZone.blocks) {
              // Apply luck multiplier to chances
              const luck = resourceStateRef.current.luckMultiplier || 1;
              cumulative += ore.chance * luck;
              
              if (rand < cumulative) {
                  type = ore.type;
                  break;
              }
          }
          if (type === generationZone.baseBlock) {
              const vRand = Math.random();
              if (vRand < 0.3) variant = 1; 
              else if (vRand < 0.6) variant = 2; 
          }
      }

      const def = BLOCK_DEFINITIONS[type] || BLOCK_DEFINITIONS[BlockType.STONE];

      row.push({
        x: x * BLOCK_SIZE,
        y: yIndex * BLOCK_SIZE,
        type,
        hp: def.hp * hpMultiplier,
        maxHp: def.hp * hpMultiplier,
        id: `${x}-${yIndex}`,
        variant
      });
    }
    return row;
  };

  const resetGame = useCallback(() => {
    // Recalculate Width
    const screenWidth = window.innerWidth;
    const newWidthBlocks = Math.ceil(screenWidth / BLOCK_SIZE);
    worldWidthBlocksRef.current = newWidthBlocks > 0 ? newWidthBlocks : 14;

    if (canvasRef.current) {
        canvasRef.current.width = screenWidth;
        canvasRef.current.height = window.innerHeight;
    }

    if (resourceStateRef.current.score > 100) {
        const session: GameSession = {
            id: Date.now().toString(),
            date: new Date().toISOString(),
            score: resourceStateRef.current.score,
            depth: resourceStateRef.current.depth,
            duration: Math.floor((Date.now() - startTimeRef.current) / 1000),
            platform: config.platform
        };
        saveGameSession(session);
    }

    startTimeRef.current = Date.now();
    blocksRef.current = [];
    particlesRef.current = [];
    debrisRef.current = [];
    cameraYRef.current = 0;
    cameraShakeRef.current = 0;
    timeScaleRef.current = 1.0;
    sizeMultiplierRef.current = 1.0;
    currentZoneRef.current = ZONES[0];
    
    const prevMoney = resourceStateRef.current.money;
    const prevTier = resourceStateRef.current.pickaxeTier;
    const prevLuck = resourceStateRef.current.luckMultiplier;
    const prevMoneyMult = resourceStateRef.current.moneyMultiplier;
    const prevAbilities = resourceStateRef.current.ownedAbilities;

    const newState: ResourceState = {
      inventory: {},
      money: prevMoney,
      score: 0,
      depth: 0,
      pickaxeTier: prevTier,
      currentZone: 'OVERWORLD',
      luckMultiplier: prevLuck,
      moneyMultiplier: prevMoneyMult,
      ownedAbilities: prevAbilities,
      abilityCooldowns: {}
    };
    
    // Safely call update via ref
    if (onResourceUpdateRef.current) {
        onResourceUpdateRef.current(newState);
    }
    
    pickaxeRef.current = {
       x: (worldWidthBlocksRef.current * BLOCK_SIZE) / 2, y: 0, vx: 2, vy: 0, radius: 20, rotation: 0, vRotation: 0.1, type: 'PICKAXE', id: 'hero', hp: 1000, maxHp: 1000
    };
    
    const initialRows = 20;
    for (let i = 0; i < initialRows; i++) {
      blocksRef.current.push(...generateRow(i));
    }
    
    console.log("Game Reset. Width:", worldWidthBlocksRef.current);
  }, [config.platform]); 

  const useAbility = (abilityId: string) => {
      // 1. Check if owned
      if (!resourceStateRef.current.ownedAbilities.includes(abilityId)) return;
      
      // 2. Check Cooldown
      const now = Date.now();
      const readyAt = resourceStateRef.current.abilityCooldowns[abilityId] || 0;
      if (now < readyAt) return;

      const def = ABILITIES[abilityId];
      if (!def) return;

      // 3. Trigger Effect
      if (abilityId === 'tnt_bundle') {
          for(let i=0; i<5; i++) setTimeout(() => spawnParticle('TNT'), i*200);
      } else if (abilityId === 'magnet') {
          magnetActiveRef.current = true;
          setTimeout(() => { magnetActiveRef.current = false; }, 10000);
      } else if (abilityId === 'drill') {
          drillActiveRef.current = true;
          setTimeout(() => { drillActiveRef.current = false; }, 5000);
      } else if (abilityId === 'freeze') {
          freezeActiveRef.current = true;
          setTimeout(() => { freezeActiveRef.current = false; }, 10000);
      } else if (abilityId === 'nuke') {
          spawnMegaTNT('PLAYER');
      }

      // 4. Set Cooldown
      if (onResourceUpdateRef.current) {
          onResourceUpdateRef.current({
              ...resourceStateRef.current,
              abilityCooldowns: {
                  ...resourceStateRef.current.abilityCooldowns,
                  [abilityId]: now + (def.cooldown * 1000)
              }
          });
      }
  };

  // Keybinds Listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      
      const key = e.key.toLowerCase();
      const binds = config.keybinds;

      if (key === binds.restart) resetGame();
      else if (key === binds.pause) setIsPaused(prev => !prev);
      else if (key === binds.settings) toggleSettings();
      else if (key === binds.leaderboard) toggleLeaderboard();
      else if (key === binds.shop) toggleShop();
      else if (e.key === '1') { if(resourceStateRef.current.ownedAbilities[0]) useAbility(resourceStateRef.current.ownedAbilities[0]); }
      else if (e.key === '2') { if(resourceStateRef.current.ownedAbilities[1]) useAbility(resourceStateRef.current.ownedAbilities[1]); }
      else if (e.key === '3') { if(resourceStateRef.current.ownedAbilities[2]) useAbility(resourceStateRef.current.ownedAbilities[2]); }
      else if (e.key === '4') { if(resourceStateRef.current.ownedAbilities[3]) useAbility(resourceStateRef.current.ownedAbilities[3]); }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [resetGame, config.keybinds, toggleSettings, toggleLeaderboard, toggleShop]); 

  useEffect(() => {
    if (queueProcessorRef.current) clearInterval(queueProcessorRef.current);
    queueProcessorRef.current = setInterval(() => {
      if (megaTntQueueRef.current.length > 0) {
        const owner = megaTntQueueRef.current.shift();
        if (owner) spawnMegaTNT(owner);
      }
    }, 5000); 

    return () => {
      if (queueProcessorRef.current) clearInterval(queueProcessorRef.current);
    };
  }, []);

  // Safe Initialization - Removed dependency on loop/resize logic for reset
  useEffect(() => {
    if (blocksRef.current.length === 0) {
        resetGame();
    }
  }, [resetGame]);

  // Handle Chat & Monetization Events
  useEffect(() => {
    const latestMsg = chatMessages[chatMessages.length - 1];
    if (latestMsg && latestMsg.isDonation) {
        cameraShakeRef.current = 10;
        const amount = latestMsg.donationAmount || 1;
        
        if (latestMsg.profileUrl) {
            spawnProfilePic(latestMsg.profileUrl, latestMsg.user, amount);
        } else {
             if (amount >= 10) {
                  megaTntQueueRef.current.push(`SUPER: ${latestMsg.user}`);
                  activateChallenge('gold_rush');
             } else {
                  const p = pickaxeRef.current;
                  const dropX = Math.floor(p.x / BLOCK_SIZE) * BLOCK_SIZE;
                  const dropY = Math.floor((p.y - 200) / BLOCK_SIZE) * BLOCK_SIZE;
                  blocksRef.current.push({
                      x: dropX, y: dropY, type: BlockType.LOOT_CRATE, hp: 10, maxHp: 10, id: `loot-${Date.now()}`, value: amount * 1000
                  });
                  spawnParticle('BALL');
             }
        }
    }

    if (!config.chatControl) return;

    if (lastGameEvent && lastGameEvent !== lastProcessedEventRef.current) {
      // CHECK IF COMMAND IS DISABLED
      if (config.disabledCommands && config.disabledCommands.includes(lastGameEvent.action)) {
          lastProcessedEventRef.current = lastGameEvent;
          return;
      }

      lastProcessedEventRef.current = lastGameEvent;
      
      switch (lastGameEvent.action) {
        case 'SPAWN_BALLS':
          const count = parseInt(lastGameEvent.data) || 1;
          for(let i=0; i<count; i++) spawnParticle('BALL');
          break;
        case 'SPAWN_TNT':
          spawnParticle('TNT');
          break;
        case 'SPAWN_MEGATNT':
          const label = typeof lastGameEvent.data === 'string' ? lastGameEvent.data : "Chat";
          megaTntQueueRef.current.push(label);
          break;
        case 'SPAWN_LOOT':
             const p = pickaxeRef.current;
             const dropX = Math.floor(p.x / BLOCK_SIZE) * BLOCK_SIZE;
             const dropY = Math.floor((p.y - 200) / BLOCK_SIZE) * BLOCK_SIZE;
             if (lastGameEvent.data === 'gold_rush') activateChallenge('gold_rush');
             else {
                 blocksRef.current.push({
                      x: dropX, y: dropY, type: BlockType.LOOT_CRATE, hp: 10, maxHp: 10, id: `loot-${Date.now()}`, value: 5000
                 });
             }
             break;
        case 'SET_SPEED':
          if (lastGameEvent.data === 'fast') timeScaleRef.current = 2.0;
          else if (lastGameEvent.data === 'slow') timeScaleRef.current = 0.5;
          else timeScaleRef.current = 1.0;
          break;
        case 'RESIZE_PICKAXE':
          if (lastGameEvent.data === 'big') sizeMultiplierRef.current = 2.0;
          else if (lastGameEvent.data === 'small') sizeMultiplierRef.current = 0.5;
          else sizeMultiplierRef.current = 1.0;
          break;
        case 'HEAL_PICKAXE':
           spawnDebris(pickaxeRef.current.x, pickaxeRef.current.y, '#22c55e');
           break;
        case 'RESET_GAME':
           resetGame();
           break;
        case 'ACTIVATE_MAGNET':
           magnetActiveRef.current = true;
           setTimeout(() => { magnetActiveRef.current = false; }, 10000);
           break;
        case 'ACTIVATE_DRILL':
           drillActiveRef.current = true;
           setTimeout(() => { drillActiveRef.current = false; }, 5000);
           break;
        case 'ACTIVATE_FREEZE':
           freezeActiveRef.current = true;
           setTimeout(() => { freezeActiveRef.current = false; }, 10000);
           break;
      }
    }
  }, [lastGameEvent, config.chatControl, resetGame, chatMessages, config.disabledCommands]);

  const activateChallenge = (id: string) => {
      const template = CHALLENGES.find(c => c.id === id);
      if (template) {
          setActiveChallenges(prev => {
              if (prev.some(c => c.id === id)) return prev; 
              return [...prev, { ...template, remainingTime: template.duration, isActive: true }];
          });
      }
  };

  const spawnMegaTNT = (owner: string) => {
     particlesRef.current.push({
       x: pickaxeRef.current.x,
       y: pickaxeRef.current.y,
       vx: 0,
       vy: 5,
       radius: 40, 
       rotation: 0,
       vRotation: 0.05,
       type: 'MEGATNT',
       id: `megatnt-${Date.now()}`,
       hp: 2000,
       maxHp: 2000,
       spawnTime: Date.now(),
       label: owner
     });
  };

  const spawnProfilePic = (url: string, user: string, amount: number) => {
    if (!profileImagesRef.current.has(url)) {
        const img = new Image();
        img.crossOrigin = "Anonymous";
        img.src = url;
        profileImagesRef.current.set(url, img);
    }

    particlesRef.current.push({
      x: pickaxeRef.current.x + (Math.random() * 20 - 10),
      y: pickaxeRef.current.y,
      vx: (Math.random() - 0.5) * 10,
      vy: Math.random() * 5 + 5,
      radius: 25,
      rotation: 0,
      vRotation: (Math.random() - 0.5) * 0.2,
      type: 'PROFILE_PIC',
      id: `profile-${Date.now()}`,
      hp: 100, 
      maxHp: 100,
      imageUrl: url,
      label: user
    });
  };

  const spawnParticle = (type: 'BALL' | 'TNT') => {
    particlesRef.current.push({
      x: pickaxeRef.current.x + (Math.random() * 20 - 10),
      y: pickaxeRef.current.y + (Math.random() * 20 - 10),
      vx: (Math.random() - 0.5) * 15, 
      vy: Math.random() * 5 + 5,
      radius: type === 'TNT' ? 18 : 12,
      rotation: Math.random() * Math.PI,
      vRotation: (Math.random() - 0.5) * 0.4,
      type: type,
      id: `${type.toLowerCase()}-${Date.now()}-${Math.random()}`,
      hp: type === 'TNT' ? 200 : 50, 
      maxHp: type === 'TNT' ? 200 : 50,
      spawnTime: Date.now() 
    });
  };

  const spawnDebris = (x: number, y: number, color: string) => {
    for(let i=0; i<6; i++) {
      debrisRef.current.push({
        x: x + (Math.random() * BLOCK_SIZE),
        y: y + (Math.random() * BLOCK_SIZE),
        vx: (Math.random() - 0.5) * 12,
        vy: (Math.random() - 0.5) * 12,
        color: color,
        life: 1.0,
        size: Math.random() * 6 + 2
      });
    }
  };

  const explodeMegaTNT = (tnt: PhysicsObject) => {
     cameraShakeRef.current = 50; 
     for(let i=0; i<30; i++) {
         debrisRef.current.push({
             x: tnt.x, y: tnt.y,
             vx: (Math.random() - 0.5) * 30,
             vy: (Math.random() - 0.5) * 30,
             color: '#ef4444', life: 1.5, size: 8
         });
     }
     
     const explosionRadius = 250;
     const damage = 5000;
     
     blocksRef.current.forEach(b => {
         const dx = (b.x + BLOCK_SIZE/2) - tnt.x;
         const dy = (b.y + BLOCK_SIZE/2) - tnt.y;
         const dist = Math.sqrt(dx*dx + dy*dy);
         if (dist < explosionRadius) {
             b.hp -= damage * (1 - dist/explosionRadius);
             if (Math.random() > 0.5) spawnDebris(b.x, b.y, BLOCK_COLORS[b.type]);
         }
     });

     particlesRef.current.forEach(p => {
         if (p === tnt) return;
         const dx = p.x - tnt.x;
         const dy = p.y - tnt.y;
         const angle = Math.atan2(dy, dx);
         const force = 50;
         p.vx += Math.cos(angle) * force;
         p.vy += Math.sin(angle) * force;
     });
  };

  const explodeTNT = (tnt: PhysicsObject) => {
     cameraShakeRef.current = 15;
     spawnDebris(tnt.x, tnt.y, '#ef4444');
     
     const explosionRadius = 120; 
     const damage = 800;
     
     blocksRef.current.forEach(b => {
         const dx = (b.x + BLOCK_SIZE/2) - tnt.x;
         const dy = (b.y + BLOCK_SIZE/2) - tnt.y;
         const dist = Math.sqrt(dx*dx + dy*dy);
         if (dist < explosionRadius) {
             b.hp -= damage * (1 - dist/explosionRadius);
             if (Math.random() > 0.5) spawnDebris(b.x, b.y, BLOCK_COLORS[b.type]);
         }
     });
  };

  const explodeMini = (obj: PhysicsObject) => {
    const explosionRadius = 60; 
    const damage = 100;

    blocksRef.current.forEach(b => {
        const dx = (b.x + BLOCK_SIZE/2) - obj.x;
        const dy = (b.y + BLOCK_SIZE/2) - obj.y;
        const dist = Math.sqrt(dx*dx + dy*dy);
        if (dist < explosionRadius) {
            b.hp -= damage;
            if (b.hp <= 0 || Math.random() > 0.8) spawnDebris(b.x, b.y, BLOCK_COLORS[b.type]);
        }
    });
  };

  const updatePhysics = () => {
    let effectiveGravity = GRAVITY;
    const isGoldRush = activeChallenges.some(c => c.effect === 'GOLD_RUSH');
    const isLowGrav = activeChallenges.some(c => c.effect === 'GRAVITY_LOW');
    const isTntStorm = activeChallenges.some(c => c.effect === 'TNT_STORM');

    if (isLowGrav) effectiveGravity *= 0.5;
    if (isTntStorm && Math.random() < 0.05) spawnParticle('TNT');

    let effectiveTimeScale = timeScaleRef.current;
    if (freezeActiveRef.current) effectiveTimeScale *= 0.1;

    pickaxeRef.current.radius = 20 * sizeMultiplierRef.current;
    
    // Dynamic Width Boundary
    const worldWidthPx = worldWidthBlocksRef.current * BLOCK_SIZE;

    particlesRef.current = particlesRef.current.filter(p => {
        if (p.hp <= 0 && p.type !== 'PICKAXE') { 
            spawnDebris(p.x, p.y, p.type === 'PROFILE_PIC' ? '#fbbf24' : '#a855f7');
            return false;
        }
        return p.y < cameraYRef.current + 1500;
    });

    const allObjects = [pickaxeRef.current, ...particlesRef.current];
    
    // Magnet Effect: Pull debris/loot towards pickaxe
    if (magnetActiveRef.current) {
        debrisRef.current.forEach(d => {
            const dx = pickaxeRef.current.x - d.x;
            const dy = pickaxeRef.current.y - d.y;
            const dist = Math.sqrt(dx*dx + dy*dy);
            if (dist < 400) {
                d.vx += (dx / dist) * 2;
                d.vy += (dy / dist) * 2;
            }
        });
        // Also pull physics objects like balls/tnt if close
        particlesRef.current.forEach(p => {
            const dx = pickaxeRef.current.x - p.x;
            const dy = pickaxeRef.current.y - p.y;
            const dist = Math.sqrt(dx*dx + dy*dy);
            if (dist < 300 && p.type !== 'MEGATNT') {
                p.vx += (dx / dist) * 0.5;
                p.vy += (dy / dist) * 0.5;
            }
        });
    }

    // Object Collision
    for (const p of particlesRef.current) {
        if (p.type === 'MEGATNT') continue; 
        const dx = p.x - pickaxeRef.current.x;
        const dy = p.y - pickaxeRef.current.y;
        const dist = Math.sqrt(dx*dx + dy*dy);
        const minDist = p.radius + pickaxeRef.current.radius;

        if (dist < minDist) {
           const angle = Math.atan2(dy, dx);
           const sin = Math.sin(angle);
           const cos = Math.cos(angle);
           const vx1 = pickaxeRef.current.vx * cos + pickaxeRef.current.vy * sin;
           const vy1 = pickaxeRef.current.vy * cos - pickaxeRef.current.vx * sin;
           const vx2 = p.vx * cos + p.vy * sin;
           const vy2 = p.vy * cos - p.vx * sin;
           const vx1Final = vx2;
           const vx2Final = vx1;
           const pVX = vx1Final * cos - vy1 * sin;
           const pVY = vy1 * cos + vx1Final * sin;
           const particleVX = vx2Final * cos - vy2 * sin;
           const particleVY = vy2 * cos + vx2Final * sin;
           pickaxeRef.current.vx = pVX;
           pickaxeRef.current.vy = pVY;
           p.vx = particleVX;
           p.vy = particleVY;
           const overlap = minDist - dist;
           pickaxeRef.current.x -= overlap * cos * 0.5;
           pickaxeRef.current.y -= overlap * sin * 0.5;
           p.x += overlap * cos * 0.5;
           p.y += overlap * sin * 0.5;
        }
    }

    allObjects.forEach(obj => {
      if (obj.type === 'MEGATNT' && obj.spawnTime) {
         if (Date.now() - obj.spawnTime > 4000) {
             explodeMegaTNT(obj);
             obj.hp = 0; 
             return; 
         }
      }

      if (obj.type === 'TNT' && obj.spawnTime) {
          if (Date.now() - obj.spawnTime > 4000) {
              explodeTNT(obj);
              obj.hp = 0;
              return;
          }
      }

      obj.vy += effectiveGravity * effectiveTimeScale;
      obj.vx *= FRICTION;
      obj.y += obj.vy * effectiveTimeScale;
      obj.x += obj.vx * effectiveTimeScale;
      obj.rotation += obj.vRotation * effectiveTimeScale;

      if (obj.x < BLOCK_SIZE) {
        obj.x = BLOCK_SIZE;
        obj.vx *= -0.95;
      }
      if (obj.x > worldWidthPx - BLOCK_SIZE) {
        obj.x = worldWidthPx - BLOCK_SIZE;
        obj.vx *= -0.95;
      }

      const gridX = Math.floor(obj.x / BLOCK_SIZE);
      const gridY = Math.floor(obj.y / BLOCK_SIZE);
      
      for(let by = gridY - 1; by <= gridY + 1; by++) {
        for(let bx = gridX - 1; bx <= gridX + 1; bx++) {
             const blockIndex = blocksRef.current.findIndex(b => b.x === bx * BLOCK_SIZE && b.y === by * BLOCK_SIZE);
             if (blockIndex !== -1) {
               const block = blocksRef.current[blockIndex];
               if (block.type === BlockType.AIR) continue;

               if (
                 obj.x + obj.radius > block.x &&
                 obj.x - obj.radius < block.x + BLOCK_SIZE &&
                 obj.y + obj.radius > block.y &&
                 obj.y - obj.radius < block.y + BLOCK_SIZE
               ) {
                 const dx = obj.x - (block.x + BLOCK_SIZE / 2);
                 const dy = obj.y - (block.y + BLOCK_SIZE / 2);
                 const angle = Math.atan2(dy, dx);
                 const pushForce = Math.max(Math.abs(obj.vx), Math.abs(obj.vy)) * 0.8 + 2;
                 obj.vx = Math.cos(angle) * pushForce;
                 obj.vy = Math.sin(angle) * pushForce;

                 let damage = 0;
                 const velocity = Math.sqrt(obj.vx*obj.vx + obj.vy*obj.vy);

                 if (obj.type === 'TNT') {
                    damage = velocity * 10 + 20; 
                 } else if (obj.type === 'MEGATNT') {
                    damage = 500; 
                 } else if (obj.type === 'PICKAXE') {
                    const currentTier = PICKAXE_TIERS.find(t => t.id === resourceStateRef.current.pickaxeTier) || PICKAXE_TIERS[0];
                    damage = velocity * 6 + currentTier.damage;
                    if (drillActiveRef.current) damage *= 3; // Drill multiplier
                 } else if (obj.type === 'BALL') {
                    damage = velocity * 5 + 10; 
                    obj.hp -= 25; 
                 } else if (obj.type === 'PROFILE_PIC') {
                    explodeMini(obj);
                    damage = 200; 
                    obj.hp -= 34; 
                 }

                 if (damage > 0) {
                     block.hp -= damage;
                     if (drillActiveRef.current && obj.type === 'PICKAXE') {
                         block.hp -= damage; // Double tick for drill
                         spawnDebris(block.x, block.y, BLOCK_COLORS[block.type]);
                     }
                     if (block.hp <= 0 || Math.random() > 0.7) {
                        spawnDebris(block.x, block.y, block.type === BlockType.LOOT_CRATE ? '#10b981' : BLOCK_COLORS[block.type]);
                     }
                 }
               }
             }
        }
      }
    });

    debrisRef.current.forEach(d => {
        d.x += d.vx * effectiveTimeScale;
        d.y += d.vy * effectiveTimeScale;
        d.vy += effectiveGravity * 0.5 * effectiveTimeScale;
        d.life -= 0.02 * effectiveTimeScale;
    });
    debrisRef.current = debrisRef.current.filter(d => d.life > 0);

    for (let i = blocksRef.current.length - 1; i >= 0; i--) {
      const b = blocksRef.current[i];
      if (b.hp <= 0 && b.type !== BlockType.BEDROCK && b.type !== BlockType.AIR) {
        const stats = resourceStateRef.current;
        const def = BLOCK_DEFINITIONS[b.type] || BLOCK_DEFINITIONS[BlockType.STONE];
        stats.score += def.value;

        if (b.type === BlockType.LOOT_CRATE) {
            cameraShakeRef.current = 5;
            spawnDebris(b.x, b.y, '#10b981');
            const multiplier = stats.moneyMultiplier || 1;
            stats.money += (b.value || 0) * multiplier;
        } else {
            // Dynamic Inventory Update
            if (!stats.inventory[b.type]) {
                stats.inventory[b.type] = 0;
            }
            stats.inventory[b.type]++;
        }
        blocksRef.current.splice(i, 1);
      }
    }
    
    const targetCamY = pickaxeRef.current.y - 300;
    if (targetCamY > cameraYRef.current) {
      cameraYRef.current += (targetCamY - cameraYRef.current) * 0.1;
    }

    const lowestBlockY = blocksRef.current.length > 0 ? blocksRef.current[blocksRef.current.length - 1].y : 0;
    if (lowestBlockY < cameraYRef.current + 1200) {
      const startRow = Math.floor(lowestBlockY / BLOCK_SIZE) + 1;
      for (let i = 0; i < 5; i++) {
        blocksRef.current.push(...generateRow(startRow + i, isGoldRush));
      }
    }
    
    blocksRef.current = blocksRef.current.filter(b => b.y > cameraYRef.current - 400);

    const depth = Math.floor(pickaxeRef.current.y / BLOCK_SIZE);
    resourceStateRef.current.depth = depth;

    // Check Zone Change
    const currentZone = getZoneForDepth(depth);
    if (currentZone.id !== currentZoneRef.current.id) {
        currentZoneRef.current = currentZone;
        resourceStateRef.current.currentZone = currentZone.name;
        setZoneNotification(currentZone);
        setTimeout(() => setZoneNotification(null), 5000); // Hide after 5s
    }

    // Call update via ref to avoid closure issues in loop
    if (onResourceUpdateRef.current) {
        onResourceUpdateRef.current({...resourceStateRef.current});
    }
    if (onDepthUpdateRef.current) {
        onDepthUpdateRef.current(depth);
    }

    if (cameraShakeRef.current > 0) cameraShakeRef.current *= 0.9;
    if (cameraShakeRef.current < 0.5) cameraShakeRef.current = 0;
  };

  const drawProceduralPickaxe = (ctx: CanvasRenderingContext2D, tierId: string) => {
    const tier = PICKAXE_TIERS.find(t => t.id === tierId) || PICKAXE_TIERS[0];
    const isSpecial = ['diamond', 'netherite', 'void', 'cosmic', 'finality'].includes(tierId);
    const isGlowing = ['void', 'cosmic', 'finality'].includes(tierId) || drillActiveRef.current;
    
    // Scale Context
    const size = 50 * sizeMultiplierRef.current;
    ctx.scale(sizeMultiplierRef.current, sizeMultiplierRef.current);
    
    // Shadow/Glow
    if (isGlowing) {
        ctx.shadowColor = drillActiveRef.current ? '#ef4444' : tier.color;
        ctx.shadowBlur = drillActiveRef.current ? 30 : 20;
    }

    // 1. Handle (Wood/Stick)
    ctx.fillStyle = '#78350f'; // Dark wood
    ctx.fillRect(-4, 0, 8, 30);
    // Handle Detail
    ctx.fillStyle = '#92400e';
    ctx.fillRect(-2, 5, 4, 20);

    // 2. Head Shape
    ctx.fillStyle = tier.color;
    ctx.beginPath();
    
    if (isSpecial) {
        // Double-headed aggressive shape
        ctx.moveTo(-30, -10);
        ctx.bezierCurveTo(-15, -25, 15, -25, 30, -10); // Top curve
        ctx.lineTo(25, -5);
        ctx.bezierCurveTo(15, -15, -15, -15, -25, -5); // Inner curve
        ctx.lineTo(-30, -10);
    } else {
        // Classic crescent
        ctx.moveTo(-25, -5);
        ctx.quadraticCurveTo(0, -30, 25, -5);
        ctx.quadraticCurveTo(0, -15, -25, -5);
    }
    ctx.fill();

    // 3. Head Bevel/Highlight
    ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
    ctx.beginPath();
    if (isSpecial) {
        ctx.moveTo(-28, -10);
        ctx.bezierCurveTo(-15, -22, 15, -22, 28, -10);
        ctx.lineTo(25, -8);
        ctx.bezierCurveTo(15, -18, -15, -18, -25, -8);
    } else {
        ctx.moveTo(-22, -6);
        ctx.quadraticCurveTo(0, -25, 22, -6);
        ctx.quadraticCurveTo(0, -12, -22, -6);
    }
    ctx.fill();

    // 4. Binding
    ctx.fillStyle = '#475569';
    ctx.fillRect(-5, -8, 10, 8);

    // Reset Glow
    ctx.shadowBlur = 0;
  };

  const draw = (ctx: CanvasRenderingContext2D) => {
    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
    
    ctx.save();
    const shakeX = (Math.random() - 0.5) * cameraShakeRef.current;
    const shakeY = (Math.random() - 0.5) * cameraShakeRef.current;
    ctx.translate(shakeX, -cameraYRef.current + shakeY);

    debrisRef.current.forEach(d => {
        ctx.globalAlpha = d.life;
        ctx.fillStyle = d.color;
        ctx.fillRect(d.x, d.y, d.size, d.size);
    });
    ctx.globalAlpha = 1.0;

    blocksRef.current.forEach(block => {
      if (block.type === BlockType.LOOT_CRATE) {
          ctx.fillStyle = '#10b981'; 
          ctx.fillRect(block.x, block.y, BLOCK_SIZE, BLOCK_SIZE);
          ctx.strokeStyle = '#34d399';
          ctx.lineWidth = 2;
          ctx.strokeRect(block.x, block.y, BLOCK_SIZE, BLOCK_SIZE);
          ctx.fillStyle = 'white';
          ctx.font = 'bold 12px sans-serif';
          ctx.textAlign = 'center';
          ctx.fillText('$', block.x + BLOCK_SIZE/2, block.y + BLOCK_SIZE/2 + 4);
      } else {
          const def = BLOCK_DEFINITIONS[block.type];
          ctx.fillStyle = def ? def.color : '#475569';
          
          if (block.variant === 1) { // Darker
             ctx.filter = 'brightness(0.8)';
          } else if (block.variant === 2) { // Lighter
             ctx.filter = 'brightness(1.2)';
          }

          ctx.fillRect(block.x, block.y, BLOCK_SIZE, BLOCK_SIZE);
          ctx.filter = 'none'; 
          
          if (block.type === BlockType.STONE && texturesRef.current['stone']) {
             ctx.drawImage(texturesRef.current['stone'], block.x, block.y, BLOCK_SIZE, BLOCK_SIZE);
          } else if (block.type !== BlockType.STONE && block.type !== BlockType.BEDROCK && texturesRef.current['ore']) {
             ctx.globalAlpha = 0.5;
             ctx.drawImage(texturesRef.current['ore'], block.x, block.y, BLOCK_SIZE, BLOCK_SIZE);
             ctx.globalAlpha = 1.0;
          }

          if (block.type === BlockType.EVENT_HORIZON_CORE) {
               ctx.strokeStyle = 'white';
               ctx.lineWidth = 2;
               ctx.strokeRect(block.x, block.y, BLOCK_SIZE, BLOCK_SIZE);
          }
      }
      
      if (block.hp < block.maxHp) {
        ctx.fillStyle = `rgba(0,0,0, ${1 - (block.hp / block.maxHp)})`;
        ctx.fillRect(block.x, block.y, BLOCK_SIZE, BLOCK_SIZE);
      }
    });

    const p = pickaxeRef.current;
    ctx.save();
    ctx.translate(p.x, p.y);
    
    // Magnet Visual
    if (magnetActiveRef.current) {
        ctx.beginPath();
        ctx.strokeStyle = 'rgba(56, 189, 248, 0.3)';
        ctx.lineWidth = 2;
        ctx.arc(0, 0, 300, 0, Math.PI * 2);
        ctx.stroke();
        ctx.fillStyle = 'rgba(56, 189, 248, 0.1)';
        ctx.fill();
    }

    // Drill Rotation
    if (drillActiveRef.current) {
        p.rotation += 0.5;
    }

    ctx.rotate(p.rotation);
    
    if (texturesRef.current['pickaxe']) {
       const size = 50 * sizeMultiplierRef.current;
       ctx.drawImage(texturesRef.current['pickaxe'], -size/2, -size/2, size, size);
    } else {
       drawProceduralPickaxe(ctx, resourceStateRef.current.pickaxeTier);
    }
    ctx.restore();

    particlesRef.current.forEach(p => {
        ctx.save();
        ctx.translate(p.x, p.y);
        
        const hpPct = Math.max(0, p.hp / p.maxHp);
        
        if (p.type === 'MEGATNT') {
            ctx.fillStyle = '#334155';
            ctx.fillRect(-30, -p.radius - 25, 60, 6);
            ctx.fillStyle = '#ef4444';
            ctx.fillRect(-30, -p.radius - 25, 60 * hpPct, 6);
        } else if (p.type === 'PROFILE_PIC') {
             ctx.fillStyle = '#334155';
             ctx.fillRect(-20, -p.radius - 15, 40, 5);
             ctx.fillStyle = '#ec4899'; 
             ctx.fillRect(-20, -p.radius - 15, 40 * hpPct, 5);
        }

        ctx.rotate(p.rotation);
        
        if (p.type === 'MEGATNT') {
             const pulse = Math.sin(Date.now() / 100);
             ctx.fillStyle = pulse > 0 ? '#ef4444' : '#ffffff';
             ctx.fillRect(-p.radius, -p.radius, p.radius*2, p.radius*2);
             ctx.fillStyle = 'black';
             ctx.font = 'bold 16px sans-serif';
             ctx.textAlign = 'center';
             ctx.textBaseline = 'middle';
             ctx.fillText('MEGA', 0, -10);
             ctx.fillText('TNT', 0, 10);
             if (p.label) {
                 ctx.fillStyle = 'white';
                 ctx.font = '12px sans-serif';
                 ctx.fillText(p.label, 0, -p.radius - 15);
             }
        } else if (p.type === 'TNT') {
             const age = Date.now() - (p.spawnTime || 0);
             const isFlashing = age > 3000 && Math.floor(Date.now() / 100) % 2 === 0;

             ctx.fillStyle = isFlashing ? '#ffffff' : '#ef4444';
             ctx.fillRect(-12, -12, 24, 24);
             ctx.fillStyle = isFlashing ? '#ef4444' : 'white';
             ctx.font = 'bold 10px sans-serif';
             ctx.textAlign = 'center';
             ctx.fillText('TNT', 0, 0);
             
             if (Math.random() > 0.5) {
                 ctx.fillStyle = '#fbbf24';
                 ctx.fillRect(5, -18, 4, 4);
             }
        } else if (p.type === 'PROFILE_PIC') {
             if (p.imageUrl && profileImagesRef.current.has(p.imageUrl)) {
                 const img = profileImagesRef.current.get(p.imageUrl);
                 if (img) {
                     ctx.beginPath();
                     ctx.arc(0, 0, p.radius, 0, Math.PI * 2);
                     ctx.closePath();
                     ctx.clip();
                     ctx.drawImage(img, -p.radius, -p.radius, p.radius*2, p.radius*2);
                 }
             } else {
                 ctx.fillStyle = '#fbbf24';
                 ctx.beginPath();
                 ctx.arc(0, 0, p.radius, 0, Math.PI * 2);
                 ctx.fill();
             }
        } else {
            if (texturesRef.current['ball']) {
               ctx.drawImage(texturesRef.current['ball'], -p.radius, -p.radius, p.radius*2, p.radius*2);
            } else {
               ctx.fillStyle = '#a855f7';
               ctx.beginPath();
               ctx.arc(0, 0, p.radius, 0, Math.PI * 2);
               ctx.fill();
               ctx.fillStyle = 'rgba(255,255,255,0.4)';
               ctx.beginPath();
               ctx.arc(-p.radius*0.3, -p.radius*0.3, p.radius*0.2, 0, Math.PI * 2);
               ctx.fill();
            }
        }
        ctx.restore();
    });

    ctx.restore();
  };

  const loop = useCallback(() => {
    if (isSettingsOpen || isLeaderboardOpen || isPaused || isShopOpen) {
       if ((isPaused || isLeaderboardOpen || isShopOpen) && canvasRef.current) {
          const ctx = canvasRef.current.getContext('2d');
          if (ctx) {
              draw(ctx);
              ctx.fillStyle = 'rgba(0,0,0,0.5)';
              ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
          }
       }
       frameIdRef.current = requestAnimationFrame(loop);
       return; 
    }

    updatePhysics();
    if (canvasRef.current) {
        const ctx = canvasRef.current.getContext('2d');
        if (ctx) draw(ctx);
    }
    frameIdRef.current = requestAnimationFrame(loop);
  }, [isSettingsOpen, isLeaderboardOpen, isPaused, activeChallenges, isShopOpen]); 

  // Initialization & Loop Startup
  useEffect(() => {
    if (containerRef.current && canvasRef.current) {
       canvasRef.current.width = window.innerWidth;
       canvasRef.current.height = window.innerHeight;
       worldWidthBlocksRef.current = Math.ceil(window.innerWidth / BLOCK_SIZE);
    }
    
    const handleResize = () => {
        if (canvasRef.current) {
            canvasRef.current.width = window.innerWidth;
            canvasRef.current.height = window.innerHeight;
            worldWidthBlocksRef.current = Math.ceil(window.innerWidth / BLOCK_SIZE);
        }
    };
    
    window.addEventListener('resize', handleResize);
    
    // Start Loop
    frameIdRef.current = requestAnimationFrame(loop);
    
    return () => {
        cancelAnimationFrame(frameIdRef.current);
        window.removeEventListener('resize', handleResize);
    };
  }, [loop]);

  return (
    <div ref={containerRef} className="absolute inset-0 w-full h-full bg-[#0B0F19] overflow-hidden">
       <canvas ref={canvasRef} className="block" />
       
       <div className="absolute top-24 right-6 flex flex-col gap-2 items-end z-20">
           {timeScaleRef.current !== 1.0 && (
              <div className="bg-red-500/80 text-white font-bold px-3 py-1 rounded animate-pulse shadow-lg">
                SPEED: {timeScaleRef.current}x
              </div>
           )}
           {activeChallenges.map(c => (
              <div key={c.id} className="bg-yellow-500/90 text-black font-black px-4 py-2 rounded-lg shadow-lg border-2 border-yellow-300 animate-bounce">
                  {c.name} ({c.remainingTime}s)
              </div>
           ))}
       </div>

       {/* ZONE TRANSITION ANIMATION */}
       {zoneNotification && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-50">
               <div className="bg-black/80 backdrop-blur-xl border-y-4 border-white/20 w-full py-10 flex flex-col items-center justify-center animate-in zoom-in-50 duration-500">
                    <h1 className="text-6xl font-black text-white tracking-widest uppercase drop-shadow-[0_0_20px_rgba(255,255,255,0.5)] animate-pulse">
                        ENTERING {zoneNotification.name.replace(' ZONE', '')}
                    </h1>
                    <div className="text-2xl font-mono text-cyan-400 mt-2 font-bold tracking-widest">
                        // DANGER LEVEL INCREASED //
                    </div>
               </div>
          </div>
       )}
    </div>
  );
};

export default Game;
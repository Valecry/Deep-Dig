
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
  const [activeChallenges, setActiveChallenges] = useState<Challenge[]>([]);
  
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
  const godModeActiveRef = useRef(false);
  const featherFallActiveRef = useRef(false);
  const heavyWeightActiveRef = useRef(false);
  
  const cameraYRef = useRef(0);
  const cameraShakeRef = useRef(0);
  const timeScaleRef = useRef(1.0); 
  const sizeMultiplierRef = useRef(1.0);

  const startTimeRef = useRef(Date.now());
  
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
  const texturesRef = useRef<Record<string, HTMLImageElement>>({});

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

  // Helper Functions
  const addToInventory = useCallback((type: BlockType, amount: number) => {
    const newState = { ...resourceStateRef.current };
    newState.inventory[type] = (newState.inventory[type] || 0) + amount;
    newState.score += (BLOCK_DEFINITIONS[type]?.value || 0) * amount;
    
    if (onResourceUpdateRef.current) {
        onResourceUpdateRef.current(newState);
    }
  }, []);

  const spawnDebris = useCallback((x: number, y: number, color: string) => {
    for (let i = 0; i < 5; i++) {
        debrisRef.current.push({
            x, y,
            vx: (Math.random() - 0.5) * 10,
            vy: (Math.random() - 0.5) * 10,
            color,
            life: 1.0,
            size: Math.random() * 5 + 2
        });
    }
  }, []);

  const spawnParticle = useCallback((type: 'BALL' | 'TNT' | 'MEGATNT' | 'PROFILE_PIC' | 'MAGNET_FIELD', x?: number, y?: number, data?: any) => {
    const startX = x !== undefined ? x : (Math.random() * (worldWidthBlocksRef.current * BLOCK_SIZE - 100) + 50);
    const startY = y !== undefined ? y : cameraYRef.current - 100;

    particlesRef.current.push({
        x: startX,
        y: startY,
        vx: (Math.random() - 0.5) * 5,
        vy: Math.random() * 5,
        radius: type === 'MEGATNT' ? 40 : 10,
        rotation: 0,
        vRotation: (Math.random() - 0.5) * 0.2,
        type,
        id: `p-${Date.now()}-${Math.random()}`,
        hp: 1,
        maxHp: 1,
        spawnTime: Date.now(),
        label: data?.label,
        imageUrl: data?.imageUrl
    });
  }, []);

  const spawnMegaTNT = useCallback((source: string) => {
    spawnParticle('MEGATNT', undefined, undefined, { label: source });
  }, [spawnParticle]);

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
    
    // Ability Reset
    magnetActiveRef.current = false;
    drillActiveRef.current = false;
    freezeActiveRef.current = false;
    godModeActiveRef.current = false;
    featherFallActiveRef.current = false;
    heavyWeightActiveRef.current = false;

    const prevMoney = resourceStateRef.current.money;
    const prevTier = resourceStateRef.current.pickaxeTier;
    const prevLuck = resourceStateRef.current.luckMultiplier;
    const prevMoneyMult = resourceStateRef.current.moneyMultiplier;
    const prevFortune = resourceStateRef.current.fortuneMultiplier;
    const prevAbilities = resourceStateRef.current.ownedAbilities;
    const prevLockedItems = resourceStateRef.current.lockedItems;
    const prevUnlockedAchievements = resourceStateRef.current.unlockedAchievements;

    const newState: ResourceState = {
      inventory: {},
      money: prevMoney,
      score: 0,
      depth: 0,
      pickaxeTier: prevTier,
      currentZone: 'OVERWORLD',
      luckMultiplier: prevLuck,
      moneyMultiplier: prevMoneyMult,
      fortuneMultiplier: prevFortune,
      ownedAbilities: prevAbilities,
      abilityCooldowns: {},
      lockedItems: prevLockedItems || [],
      unlockedAchievements: prevUnlockedAchievements || []
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
  }, [config.platform, generateRow]); 

  // Initialize Game on Mount
  useEffect(() => {
    resetGame();
  }, [resetGame]);

  const useAbility = useCallback((abilityId: string) => {
      if (!resourceStateRef.current.ownedAbilities.includes(abilityId)) return;
      
      const now = Date.now();
      const readyAt = resourceStateRef.current.abilityCooldowns[abilityId] || 0;
      if (now < readyAt) return;

      const def = ABILITIES[abilityId];
      if (!def) return;

      switch(abilityId) {
          case 'tnt_bundle': for(let i=0; i<5; i++) setTimeout(() => spawnParticle('TNT'), i*200); break;
          case 'magnet': magnetActiveRef.current = true; setTimeout(() => { magnetActiveRef.current = false; }, 10000); break;
          case 'drill': drillActiveRef.current = true; setTimeout(() => { drillActiveRef.current = false; }, 5000); break;
          case 'freeze': freezeActiveRef.current = true; setTimeout(() => { freezeActiveRef.current = false; }, 10000); break;
          case 'nuke': spawnMegaTNT('PLAYER'); break;
          
          // SIMPLE ACTIVE
          case 'dash_left': pickaxeRef.current.vx = -20; break;
          case 'dash_right': pickaxeRef.current.vx = 20; break;
          case 'jump': pickaxeRef.current.vy = -20; break;
          case 'dynamite': spawnParticle('TNT'); break;
          case 'repel': 
              debrisRef.current.forEach(d => { d.vx = (Math.random()-0.5)*30; d.vy = (Math.random()-0.5)*30; }); 
              break;
          case 'ball_scatter': for(let i=0; i<5; i++) spawnParticle('BALL'); break;
          case 'mini_drill': drillActiveRef.current = true; setTimeout(() => { drillActiveRef.current = false; }, 2000); break;
          case 'feather_fall': featherFallActiveRef.current = true; setTimeout(() => { featherFallActiveRef.current = false; }, 5000); break;
          case 'heavy_weight': heavyWeightActiveRef.current = true; setTimeout(() => { heavyWeightActiveRef.current = false; }, 5000); break;
          case 'loot_drop': 
              blocksRef.current.push({
                  x: pickaxeRef.current.x, y: pickaxeRef.current.y - 100, type: BlockType.LOOT_CRATE, hp: 10, maxHp: 10, id: `loot-${Date.now()}`, value: 5000
              });
              spawnParticle('BALL');
              break;

          // EXPENSIVE ACTIVE
          case 'black_hole':
              // Sucks blocks in radius 300, converts to inventory
              const center = {x: pickaxeRef.current.x, y: pickaxeRef.current.y};
              blocksRef.current = blocksRef.current.filter(b => {
                  const dx = b.x - center.x;
                  const dy = b.y - center.y;
                  if (Math.sqrt(dx*dx + dy*dy) < 300 && b.type !== BlockType.BEDROCK) {
                      addToInventory(b.type, 1);
                      spawnDebris(b.x, b.y, '#000000');
                      return false;
                  }
                  return true;
              });
              cameraShakeRef.current = 20;
              break;
          case 'antimatter_bomb':
              cameraShakeRef.current = 100;
              spawnDebris(pickaxeRef.current.x, pickaxeRef.current.y, '#ffffff');
              blocksRef.current = blocksRef.current.filter(b => {
                  const dx = b.x - pickaxeRef.current.x;
                  const dy = b.y - pickaxeRef.current.y;
                  return Math.sqrt(dx*dx + dy*dy) > 500 || b.type === BlockType.BEDROCK;
              });
              break;
          case 'orbital_laser':
              const colX = Math.floor(pickaxeRef.current.x / BLOCK_SIZE) * BLOCK_SIZE;
              blocksRef.current = blocksRef.current.filter(b => b.x < colX || b.x >= colX + BLOCK_SIZE || b.type === BlockType.BEDROCK);
              spawnDebris(pickaxeRef.current.x, pickaxeRef.current.y + 200, '#ff0000');
              break;
          case 'midas_touch':
              blocksRef.current.forEach(b => {
                  if (b.type === BlockType.STONE || b.type === BlockType.IRON) b.type = BlockType.GOLD;
              });
              break;
          case 'god_mode':
              godModeActiveRef.current = true;
              sizeMultiplierRef.current = 3.0;
              setTimeout(() => { godModeActiveRef.current = false; sizeMultiplierRef.current = 1.0; }, 20000);
              break;
      }

      // Set Cooldown
      onResourceUpdateRef.current({
          ...resourceStateRef.current,
          abilityCooldowns: {
              ...resourceStateRef.current.abilityCooldowns,
              [abilityId]: Date.now() + def.cooldown * 1000
          }
      });

  }, [spawnParticle, spawnMegaTNT, addToInventory, spawnDebris]);


  // Handle Game Events
  useEffect(() => {
    if (!lastGameEvent) return;

    switch(lastGameEvent.action) {
        case 'SPAWN_BALLS':
            for(let i=0; i < (parseInt(lastGameEvent.data) || 1); i++) spawnParticle('BALL');
            break;
        case 'SPAWN_TNT':
            spawnParticle('TNT');
            break;
        case 'SPAWN_MEGATNT':
            spawnMegaTNT(lastGameEvent.data);
            break;
        case 'SET_SPEED':
            timeScaleRef.current = lastGameEvent.data === 'fast' ? 2.0 : lastGameEvent.data === 'slow' ? 0.3 : 1.0;
            break;
        case 'RESIZE_PICKAXE':
            sizeMultiplierRef.current = lastGameEvent.data === 'big' ? 2.0 : lastGameEvent.data === 'small' ? 0.5 : 1.0;
            break;
        case 'ACTIVATE_MAGNET': useAbility('magnet'); break;
        case 'ACTIVATE_DRILL': useAbility('drill'); break;
        case 'ACTIVATE_FREEZE': useAbility('freeze'); break;
        case 'RESET_GAME': resetGame(); break;
        case 'TRIGGER_CHALLENGE':
             const c = CHALLENGES.find(ch => ch.id === (lastGameEvent.data as string));
             if (c) {
                 setActiveChallenges(prev => [...prev, {...c, remainingTime: c.duration}]);
             }
             break;
        case 'SPAWN_LOOT':
             // spawn a crate
             blocksRef.current.push({
                  x: pickaxeRef.current.x, y: pickaxeRef.current.y - 100, type: BlockType.LOOT_CRATE, hp: 10, maxHp: 10, id: `loot-${Date.now()}`, value: 5000
             });
             break;
    }
  }, [lastGameEvent, spawnParticle, spawnMegaTNT, resetGame, useAbility]);

  // Input Handling
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
        const k = e.key.toLowerCase();
        const binds = config.keybinds;

        if (k === binds.spawnBall) spawnParticle('BALL');
        if (k === binds.spawnTnt) spawnParticle('TNT');
        if (k === binds.megaTnt) spawnMegaTNT('Manual');
        if (k === binds.restart) resetGame();
        if (k === binds.settings) toggleSettings();
        if (k === binds.leaderboard) toggleLeaderboard();
        if (k === binds.shop) toggleShop();
        
        if (k === binds.ability1) useAbility(resourceStateRef.current.ownedAbilities[0]);
        if (k === binds.ability2) useAbility(resourceStateRef.current.ownedAbilities[1]);
        if (k === binds.ability3) useAbility(resourceStateRef.current.ownedAbilities[2]);
        if (k === binds.ability4) useAbility(resourceStateRef.current.ownedAbilities[3]);
        
        // Manual Movement
        if (e.key === 'ArrowLeft') pickaxeRef.current.vx -= 5;
        if (e.key === 'ArrowRight') pickaxeRef.current.vx += 5;
        if (e.key === 'ArrowUp') pickaxeRef.current.vy -= 10;
        if (e.key === 'ArrowDown') pickaxeRef.current.vy += 10;
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [config.keybinds, resetGame, toggleSettings, toggleLeaderboard, toggleShop, useAbility, spawnParticle, spawnMegaTNT]);

  // Main Loop
  useEffect(() => {
      let animationFrameId: number;

      const loop = () => {
          const canvas = canvasRef.current;
          const ctx = canvas?.getContext('2d');
          
          if (canvas && ctx) {
              const width = canvas.width;
              const height = canvas.height;
              
              // Clear
              ctx.clearRect(0, 0, width, height);
              
              // Camera Follow
              const targetY = pickaxeRef.current.y - height / 3;
              cameraYRef.current += (targetY - cameraYRef.current) * 0.1;
              
              // Apply Shake
              const shakeX = (Math.random() - 0.5) * cameraShakeRef.current;
              const shakeY = (Math.random() - 0.5) * cameraShakeRef.current;
              cameraShakeRef.current = Math.max(0, cameraShakeRef.current * 0.9);

              ctx.save();
              ctx.translate(-shakeX, -cameraYRef.current - shakeY);
              
              // Draw Blocks
              const visibleTop = cameraYRef.current;
              const visibleBottom = cameraYRef.current + height;
              
              // Generate new blocks if needed
              const bottomBlockY = blocksRef.current.length > 0 ? blocksRef.current[blocksRef.current.length - 1].y : 0;
              if (bottomBlockY < visibleBottom + 500) {
                  const startRow = Math.floor(bottomBlockY / BLOCK_SIZE) + 1;
                  for (let i = 0; i < 5; i++) {
                      blocksRef.current.push(...generateRow(startRow + i, activeChallenges.some(c => c.effect === 'GOLD_RUSH')));
                  }
              }

              // Update & Draw Blocks
              blocksRef.current.forEach((block, index) => {
                  if (block.y + BLOCK_SIZE < visibleTop || block.y > visibleBottom) return;

                  // Simple Rendering
                  ctx.fillStyle = BLOCK_COLORS[block.type] || '#ccc';
                  ctx.fillRect(block.x, block.y, BLOCK_SIZE, BLOCK_SIZE);
                  
                  // HP Overlay
                  if (block.hp < block.maxHp) {
                      ctx.fillStyle = 'rgba(0,0,0,0.3)';
                      const ratio = block.hp / block.maxHp;
                      ctx.fillRect(block.x + BLOCK_SIZE/4, block.y + BLOCK_SIZE/2, (BLOCK_SIZE/2) * ratio, 4);
                  }
              });

              // Update Pickaxe Physics
              const pickaxe = pickaxeRef.current;
              let g = activeChallenges.some(c => c.effect === 'GRAVITY_LOW') || featherFallActiveRef.current ? GRAVITY * 0.5 : heavyWeightActiveRef.current ? GRAVITY * 2 : GRAVITY;
              if (freezeActiveRef.current) g = 0;

              pickaxe.vy += g * timeScaleRef.current;
              pickaxe.vx *= FRICTION;
              
              pickaxe.x += pickaxe.vx * timeScaleRef.current;
              pickaxe.y += pickaxe.vy * timeScaleRef.current;

              // Pickaxe Collision with Blocks
              // Simple circle vs AABB
              const pRadius = pickaxe.radius * sizeMultiplierRef.current;
              const damage = (PICKAXE_TIERS.find(t => t.id === resourceStateRef.current.pickaxeTier)?.damage || 10) * (drillActiveRef.current ? 5 : 1);

              blocksRef.current = blocksRef.current.filter(block => {
                  if (block.y + BLOCK_SIZE < pickaxe.y - pRadius - 100 || block.y > pickaxe.y + pRadius + 100) return true;

                  const closestX = Math.max(block.x, Math.min(pickaxe.x, block.x + BLOCK_SIZE));
                  const closestY = Math.max(block.y, Math.min(pickaxe.y, block.y + BLOCK_SIZE));
                  
                  const dx = pickaxe.x - closestX;
                  const dy = pickaxe.y - closestY;
                  const distance = Math.sqrt(dx * dx + dy * dy);

                  if (distance < pRadius) {
                      // Collision
                      // Bounce
                      if (Math.abs(dx) > Math.abs(dy)) pickaxe.vx *= -0.8;
                      else pickaxe.vy *= -0.5;
                      
                      // Damage Block
                      if (!freezeActiveRef.current) {
                          block.hp -= damage;
                          spawnDebris(closestX, closestY, BLOCK_COLORS[block.type]);
                      }

                      if (block.hp <= 0 && block.type !== BlockType.BEDROCK) {
                          addToInventory(block.type, 1);
                          return false; // Remove block
                      }
                  }
                  return true;
              });
              
              // World Boundaries
              if (pickaxe.x < pRadius) { pickaxe.x = pRadius; pickaxe.vx *= -0.8; }
              if (pickaxe.x > width - pRadius) { pickaxe.x = width - pRadius; pickaxe.vx *= -0.8; }

              // Draw Pickaxe
              ctx.save();
              ctx.translate(pickaxe.x, pickaxe.y);
              ctx.rotate(pickaxe.rotation);
              pickaxe.rotation += pickaxe.vRotation;
              ctx.fillStyle = PICKAXE_TIERS.find(t => t.id === resourceStateRef.current.pickaxeTier)?.color || '#fff';
              ctx.beginPath();
              ctx.arc(0, 0, pRadius, 0, Math.PI * 2);
              ctx.fill();
              ctx.restore();

              // Magnet Logic
              if (magnetActiveRef.current) {
                  // Sucks debris or loose items (simulated)
                  // For visual effect, draw lines to nearby blocks
              }

              // Update & Draw Debris
              debrisRef.current.forEach((d, i) => {
                  d.x += d.vx;
                  d.y += d.vy;
                  d.vy += GRAVITY;
                  d.life -= 0.02;
                  
                  ctx.fillStyle = d.color;
                  ctx.globalAlpha = Math.max(0, d.life);
                  ctx.fillRect(d.x, d.y, d.size, d.size);
                  ctx.globalAlpha = 1;
              });
              debrisRef.current = debrisRef.current.filter(d => d.life > 0);

              // Update & Draw Particles (TNT, Balls)
              particlesRef.current.forEach((p, i) => {
                  p.vy += GRAVITY * timeScaleRef.current;
                  p.x += p.vx * timeScaleRef.current;
                  p.y += p.vy * timeScaleRef.current;
                  
                  // Simple floor collision logic (simplified)
                  if (p.y > cameraYRef.current + height) {
                      p.hp = 0; // Remove if off screen
                  }

                  // TNT Logic
                  if ((p.type === 'TNT' || p.type === 'MEGATNT') && Math.random() < 0.01) {
                      // Explode
                      const radius = p.type === 'MEGATNT' ? 150 : 60;
                      cameraShakeRef.current += p.type === 'MEGATNT' ? 20 : 5;
                      spawnDebris(p.x, p.y, '#ff0000');
                      
                      blocksRef.current = blocksRef.current.filter(b => {
                          const dx = b.x - p.x;
                          const dy = b.y - p.y;
                          const dist = Math.sqrt(dx*dx + dy*dy);
                          if (dist < radius && b.type !== BlockType.BEDROCK) {
                              if (b.type !== BlockType.STONE) addToInventory(b.type, 1);
                              return false;
                          }
                          return true;
                      });
                      p.hp = 0;
                  }
                  
                  ctx.fillStyle = p.type === 'TNT' ? 'red' : p.type === 'MEGATNT' ? 'darkred' : 'white';
                  ctx.beginPath();
                  ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
                  ctx.fill();
              });
              particlesRef.current = particlesRef.current.filter(p => p.hp > 0);

              // Update Depth in Global State
              const depth = Math.floor(pickaxe.y / BLOCK_SIZE);
              if (depth !== resourceStateRef.current.depth && depth > 0) {
                  onDepthUpdateRef.current(depth);
              }

              ctx.restore();
          }
          animationFrameId = requestAnimationFrame(loop);
      };
      animationFrameId = requestAnimationFrame(loop);
      return () => cancelAnimationFrame(animationFrameId);
  }, [activeChallenges, addToInventory, generateRow, spawnDebris]);

  return (
    <div ref={containerRef} className="w-full h-full relative cursor-none overflow-hidden">
        <canvas ref={canvasRef} className="block w-full h-full" />
    </div>
  );
};

export default Game;

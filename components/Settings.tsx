
import React, { useState, useEffect } from 'react';
import { GameConfig, Keybinds, ChatMessage } from '../types';
import { Settings as SettingsIcon, X, Twitch, Youtube, WifiOff, Image as ImageIcon, MessageSquare, Keyboard, ShieldAlert, Zap, Box, DollarSign, Radiation, Timer } from 'lucide-react';

interface SettingsProps {
  isOpen: boolean;
  onClose: () => void;
  config: GameConfig;
  onSave: (config: GameConfig) => void;
  onSimulate: (msg: ChatMessage) => void;
}

const Settings: React.FC<SettingsProps> = ({ isOpen, onClose, config, onSave, onSimulate }) => {
  const [localConfig, setLocalConfig] = useState(config);
  const [activeTab, setActiveTab] = useState<'general' | 'commands' | 'textures' | 'controls' | 'simulation' | 'chaos'>('general');

  useEffect(() => {
    setLocalConfig(config);
  }, [config, isOpen]);

  if (!isOpen) return null;

  const handleKeybindChange = (key: keyof Keybinds, value: string) => {
      setLocalConfig({
          ...localConfig,
          keybinds: {
              ...localConfig.keybinds,
              [key]: value.toLowerCase()
          }
      });
  };

  const toggleCommand = (cmd: string) => {
      const current = localConfig.disabledCommands || [];
      const updated = current.includes(cmd) 
          ? current.filter(c => c !== cmd)
          : [...current, cmd];
      setLocalConfig({...localConfig, disabledCommands: updated});
  };

  const ConfigInput = ({ label, value, field, min = 1, max = 300 }: { label: string, value: number, field: keyof GameConfig, min?: number, max?: number }) => (
      <div>
          <label className="block text-xs font-bold text-slate-400 mb-1 uppercase tracking-wider">{label}</label>
          <input 
              type="number" 
              min={min} max={max}
              value={value}
              onChange={(e) => setLocalConfig({...localConfig, [field]: parseInt(e.target.value) || min})}
              className="w-full bg-slate-900 border border-slate-700 rounded px-3 py-2 text-white outline-none focus:border-cyan-500"
          />
      </div>
  );

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-[70]">
      <div className="bg-slate-900 border border-slate-700 w-full max-w-md rounded-2xl p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
           <div className="flex items-center gap-2">
             <SettingsIcon className="w-6 h-6 text-cyan-500" />
             <h2 className="text-2xl font-bold text-white">Settings</h2>
           </div>
           <button onClick={onClose} className="p-1 hover:bg-slate-800 rounded-full text-slate-400 hover:text-white">
             <X className="w-6 h-6" />
           </button>
        </div>

        <div className="flex gap-2 mb-6 border-b border-slate-700 overflow-x-auto scrollbar-hide">
          {['general', 'chaos', 'commands', 'textures', 'controls', 'simulation'].map(tab => (
              <button 
                key={tab}
                onClick={() => setActiveTab(tab as any)}
                className={`px-4 py-2 text-sm font-bold border-b-2 transition whitespace-nowrap capitalize ${activeTab === tab ? 'border-cyan-500 text-cyan-400' : 'border-transparent text-slate-400'}`}
              >
                {tab}
              </button>
          ))}
        </div>

        {activeTab === 'general' && (
        <div className="space-y-6">
          <div className="grid grid-cols-3 gap-2">
            <button 
              onClick={() => setLocalConfig({...localConfig, platform: 'OFFLINE'})}
              className={`flex flex-col items-center justify-center p-3 rounded-lg border transition ${localConfig.platform === 'OFFLINE' ? 'bg-slate-700 border-cyan-500 text-cyan-400' : 'bg-slate-800 border-slate-700 text-slate-400 hover:bg-slate-700'}`}
            >
              <WifiOff className="w-6 h-6 mb-1" />
              <span className="text-xs font-bold">OFFLINE</span>
            </button>
            <button 
              onClick={() => setLocalConfig({...localConfig, platform: 'TWITCH'})}
              className={`flex flex-col items-center justify-center p-3 rounded-lg border transition ${localConfig.platform === 'TWITCH' ? 'bg-purple-900/50 border-purple-500 text-purple-400' : 'bg-slate-800 border-slate-700 text-slate-400 hover:bg-slate-700'}`}
            >
              <Twitch className="w-6 h-6 mb-1" />
              <span className="text-xs font-bold">TWITCH</span>
            </button>
            <button 
              onClick={() => setLocalConfig({...localConfig, platform: 'YOUTUBE'})}
              className={`flex flex-col items-center justify-center p-3 rounded-lg border transition ${localConfig.platform === 'YOUTUBE' ? 'bg-red-900/50 border-red-500 text-red-400' : 'bg-slate-800 border-slate-700 text-slate-400 hover:bg-slate-700'}`}
            >
              <Youtube className="w-6 h-6 mb-1" />
              <span className="text-xs font-bold">YOUTUBE</span>
            </button>
          </div>

          <div className="bg-slate-950 p-4 rounded-lg border border-slate-800">
            {localConfig.platform === 'OFFLINE' && <p className="text-center text-slate-400 text-sm">Offline Simulation Mode</p>}
            {localConfig.platform === 'TWITCH' && (
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-1">Twitch Channel</label>
                <input 
                  type="text" 
                  value={localConfig.channelId}
                  onChange={e => setLocalConfig({...localConfig, channelId: e.target.value})}
                  className="w-full bg-slate-900 border border-slate-700 rounded px-3 py-2 text-white outline-none"
                  placeholder="e.g. ninja"
                />
              </div>
            )}
            {localConfig.platform === 'YOUTUBE' && (
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-slate-400 mb-1">Livestream ID (Video ID)</label>
                  <input 
                    type="text" 
                    value={localConfig.liveStreamId}
                    onChange={e => setLocalConfig({...localConfig, liveStreamId: e.target.value})}
                    className="w-full bg-slate-900 border border-slate-700 rounded px-3 py-2 text-white outline-none"
                    placeholder="e.g. jfKfPfyJRdk"
                  />
                  <p className="text-[10px] text-slate-500 mt-1">Found in the URL of the livestream watch page.</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-400 mb-1">Channel ID (Optional)</label>
                  <input 
                    type="text" 
                    value={localConfig.channelId}
                    onChange={e => setLocalConfig({...localConfig, channelId: e.target.value})}
                    className="w-full bg-slate-900 border border-slate-700 rounded px-3 py-2 text-white outline-none"
                    placeholder="e.g. UC_x5XG1OV2P6uZZ5FSM9Ttw"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-400 mb-1">API Key</label>
                  <input 
                    type="password" 
                    value={localConfig.apiKey}
                    onChange={e => setLocalConfig({...localConfig, apiKey: e.target.value})}
                    className="w-full bg-slate-900 border border-slate-700 rounded px-3 py-2 text-white outline-none"
                  />
                </div>
              </div>
            )}
          </div>

          <div className="flex items-center justify-between bg-slate-800 p-3 rounded-lg border border-slate-700">
             <div className="flex items-center gap-3">
               <MessageSquare className="w-5 h-5 text-green-400" />
               <div>
                 <div className="text-sm font-bold text-slate-200">Chat Control</div>
                 <div className="text-xs text-slate-500">Enable actual chat commands</div>
               </div>
             </div>
             <button 
               onClick={() => setLocalConfig({...localConfig, chatControl: !localConfig.chatControl})}
               className={`w-12 h-6 rounded-full transition-colors relative ${localConfig.chatControl ? 'bg-green-500' : 'bg-slate-600'}`}
             >
               <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${localConfig.chatControl ? 'left-7' : 'left-1'}`} />
             </button>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-slate-400 mb-1">Gravity</label>
            <input 
              type="range" 
              min="0.1" max="1.5" step="0.1"
              value={localConfig.gravity}
              onChange={e => setLocalConfig({...localConfig, gravity: parseFloat(e.target.value)})}
              className="w-full accent-cyan-500"
            />
          </div>
        </div>
        )}

        {activeTab === 'chaos' && (
            <div className="space-y-4">
                 <div className="bg-slate-800/50 p-3 rounded border border-slate-700 text-xs text-slate-400 mb-4">
                    Settings for the automatic chaos engine. Only active when <strong>Chat Control</strong> is OFF.
                 </div>
                 
                 {localConfig.platform === 'YOUTUBE' && (
                      <div className="mb-4">
                        <ConfigInput label="YT Poll Interval (Sec)" value={localConfig.ytPollInterval} field="ytPollInterval" min={15} max={300} />
                        <p className="text-[10px] text-yellow-500 mt-1">Faster polling = Higher API Quota Usage.</p>
                      </div>
                 )}

                 <div className="space-y-4">
                     <div className="flex items-center gap-2 border-b border-slate-700 pb-2 mb-2">
                         <Timer className="w-4 h-4 text-cyan-400" />
                         <h3 className="text-sm font-bold text-white">Event Intervals (Seconds)</h3>
                     </div>

                     <div className="grid grid-cols-2 gap-4">
                        <ConfigInput label="TNT Min" value={localConfig.tntSpawnIntervalMin} field="tntSpawnIntervalMin" />
                        <ConfigInput label="TNT Max" value={localConfig.tntSpawnIntervalMax} field="tntSpawnIntervalMax" />
                     </div>

                     <div className="grid grid-cols-2 gap-4">
                        <ConfigInput label="Speed Min" value={localConfig.fastSlowIntervalMin} field="fastSlowIntervalMin" />
                        <ConfigInput label="Speed Max" value={localConfig.fastSlowIntervalMax} field="fastSlowIntervalMax" />
                     </div>

                     <div className="grid grid-cols-2 gap-4">
                        <ConfigInput label="Size Min" value={localConfig.pickaxeEnlargeIntervalMin} field="pickaxeEnlargeIntervalMin" />
                        <ConfigInput label="Size Max" value={localConfig.pickaxeEnlargeIntervalMax} field="pickaxeEnlargeIntervalMax" />
                     </div>

                     <div className="grid grid-cols-2 gap-4">
                        <ConfigInput label="Random Event Min" value={localConfig.randomPickaxeIntervalMin} field="randomPickaxeIntervalMin" />
                        <ConfigInput label="Random Event Max" value={localConfig.randomPickaxeIntervalMax} field="randomPickaxeIntervalMax" />
                     </div>

                     <div className="border-t border-slate-700 pt-4">
                         <ConfigInput label="Event Duration" value={localConfig.fastSlowDuration} field="fastSlowDuration" />
                         <ConfigInput label="Queue Pop Interval" value={localConfig.queuesPopInterval} field="queuesPopInterval" min={1} />
                     </div>
                 </div>
            </div>
        )}

        {activeTab === 'commands' && (
            <div className="space-y-3">
                <p className="text-xs text-slate-500 mb-2">Uncheck to disable specific chat events</p>
                {[
                    { id: 'SPAWN_TNT', label: 'TNT Spawning', icon: ShieldAlert },
                    { id: 'SPAWN_BALLS', label: 'Ball Spawning', icon: MessageSquare },
                    { id: 'SPAWN_MEGATNT', label: 'MegaTNT (Chaos)', icon: ShieldAlert },
                    { id: 'RESIZE_PICKAXE', label: 'Size Changing', icon: SettingsIcon },
                    { id: 'SET_SPEED', label: 'Speed Changing', icon: SettingsIcon },
                ].map(cmd => (
                    <div key={cmd.id} className="flex items-center justify-between bg-slate-950 p-3 rounded border border-slate-800">
                        <div className="flex items-center gap-3">
                            <cmd.icon className="w-4 h-4 text-slate-400" />
                            <span className="text-sm font-medium text-slate-200">{cmd.label}</span>
                        </div>
                        <input 
                            type="checkbox"
                            checked={!(localConfig.disabledCommands || []).includes(cmd.id)}
                            onChange={() => toggleCommand(cmd.id)}
                            className="w-5 h-5 accent-cyan-500"
                        />
                    </div>
                ))}
            </div>
        )}

        {activeTab === 'textures' && (
          <div className="space-y-4">
             <p className="text-xs text-slate-500">Custom Textures (URL)</p>
             {['pickaxe', 'ball', 'stone'].map((item) => (
                <div key={item}>
                   <label className="block text-sm font-medium text-slate-400 capitalize">{item}</label>
                   <input 
                      type="text"
                      // @ts-ignore
                      value={localConfig.textures[item] || ''}
                      onChange={e => setLocalConfig({
                          ...localConfig,
                          // @ts-ignore
                          textures: { ...localConfig.textures, [item]: e.target.value }
                      })}
                      className="w-full bg-slate-900 border border-slate-700 rounded px-3 py-2 text-sm text-white"
                   />
                </div>
             ))}
          </div>
        )}

        {activeTab === 'controls' && (
            <div className="space-y-3">
                <p className="text-xs text-slate-500 mb-2">Click to edit keybinds (Single char keys recommended)</p>
                {Object.entries(localConfig.keybinds).map(([key, val]) => (
                    <div key={key} className="flex justify-between items-center bg-slate-950 p-2 rounded border border-slate-800">
                        <span className="text-sm text-slate-300 capitalize font-medium">
                            {key.replace(/([A-Z])/g, ' $1').trim()}
                        </span>
                        <input 
                            type="text" 
                            maxLength={1}
                            value={val.toUpperCase()}
                            onChange={(e) => handleKeybindChange(key as keyof Keybinds, e.target.value)}
                            className="w-12 text-center bg-slate-800 border border-slate-700 rounded text-cyan-400 font-bold focus:border-cyan-500 outline-none uppercase"
                        />
                    </div>
                ))}
            </div>
        )}

        {activeTab === 'simulation' && (
            <div className="space-y-4">
                <p className="text-xs text-slate-500">Manually trigger events to test your overlay.</p>
                <div className="grid grid-cols-2 gap-3">
                    <button onClick={() => onSimulate({ user: 'TestUser', message: 'Hello Chat!', color: '#38bdf8' })} className="flex items-center gap-2 bg-slate-800 p-2 rounded hover:bg-slate-700 border border-slate-700">
                        <MessageSquare className="w-4 h-4 text-slate-400" /> <span className="text-sm">Chat Msg</span>
                    </button>
                    <button onClick={() => onSimulate({ user: 'ChaosBot', message: '!tnt', color: '#f87171' })} className="flex items-center gap-2 bg-slate-800 p-2 rounded hover:bg-slate-700 border border-slate-700">
                        <ShieldAlert className="w-4 h-4 text-red-400" /> <span className="text-sm">!TNT</span>
                    </button>
                    <button onClick={() => onSimulate({ user: 'RichUser', message: '1000 Bits!', isDonation: true, donationAmount: 10, color: '#c084fc' })} className="flex items-center gap-2 bg-slate-800 p-2 rounded hover:bg-slate-700 border border-slate-700">
                        <Zap className="w-4 h-4 text-purple-400" /> <span className="text-sm">Bits ($10)</span>
                    </button>
                    <button onClick={() => onSimulate({ user: 'SuperFan', message: 'Super Chat!', isDonation: true, donationAmount: 50, color: '#fbbf24', platform: 'youtube' })} className="flex items-center gap-2 bg-slate-800 p-2 rounded hover:bg-slate-700 border border-slate-700">
                        <DollarSign className="w-4 h-4 text-yellow-400" /> <span className="text-sm">Super Chat ($50)</span>
                    </button>
                    <button onClick={() => onSimulate({ user: 'Gamer123', message: '!nuke', color: '#4ade80' })} className="flex items-center gap-2 bg-slate-800 p-2 rounded hover:bg-slate-700 border border-slate-700">
                        <Radiation className="w-4 h-4 text-green-400" /> <span className="text-sm">!Nuke</span>
                    </button>
                    <button onClick={() => onSimulate({ user: 'LootGoblin', message: '!drop', color: '#fb923c' })} className="flex items-center gap-2 bg-slate-800 p-2 rounded hover:bg-slate-700 border border-slate-700">
                        <Box className="w-4 h-4 text-orange-400" /> <span className="text-sm">!Drop</span>
                    </button>
                </div>
            </div>
        )}

        <div className="mt-8 flex justify-end gap-3">
          <button onClick={onClose} className="px-4 py-2 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800 transition">Cancel</button>
          <button 
             onClick={() => { onSave(localConfig); onClose(); }} 
             className="px-6 py-2 rounded-lg bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-bold shadow-lg shadow-cyan-900/20"
          >
            Save & Connect
          </button>
        </div>
      </div>
    </div>
  );
};

export default Settings;

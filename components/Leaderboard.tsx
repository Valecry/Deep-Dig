import React, { useEffect, useState } from 'react';
import { GameSession } from '../types';
import { getGameHistory, getLeaderboard } from '../services/storageService';
import { Trophy, History, Clock, X } from 'lucide-react';

interface LeaderboardProps {
    isOpen: boolean;
    onClose: () => void;
}

const Leaderboard: React.FC<LeaderboardProps> = ({ isOpen, onClose }) => {
    const [history, setHistory] = useState<GameSession[]>([]);
    const [topScores, setTopScores] = useState<GameSession[]>([]);
    const [activeTab, setActiveTab] = useState<'top' | 'history'>('top');

    useEffect(() => {
        if (isOpen) {
            setHistory(getGameHistory());
            setTopScores(getLeaderboard());
        }
    }, [isOpen]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-md flex items-center justify-center z-[65]">
             <div className="bg-slate-900 border border-slate-700 w-full max-w-2xl rounded-2xl p-6 shadow-2xl h-[80vh] flex flex-col">
                <div className="flex justify-between items-center mb-6">
                    <div className="flex items-center gap-3">
                        <Trophy className="w-8 h-8 text-yellow-500" />
                        <h2 className="text-3xl font-black text-white uppercase tracking-tighter">Leaderboards</h2>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-slate-800 rounded-full text-slate-400 hover:text-white">
                        <X className="w-6 h-6" />
                    </button>
                </div>

                <div className="flex gap-4 mb-6 border-b border-slate-700">
                     <button 
                        onClick={() => setActiveTab('top')}
                        className={`pb-2 px-4 font-bold text-lg transition ${activeTab === 'top' ? 'text-yellow-400 border-b-2 border-yellow-400' : 'text-slate-500'}`}
                     >
                        Top Scores
                     </button>
                     <button 
                        onClick={() => setActiveTab('history')}
                        className={`pb-2 px-4 font-bold text-lg transition ${activeTab === 'history' ? 'text-cyan-400 border-b-2 border-cyan-400' : 'text-slate-500'}`}
                     >
                        Match History
                     </button>
                </div>

                <div className="flex-1 overflow-y-auto pr-2">
                    {activeTab === 'top' && (
                        <div className="space-y-3">
                            {topScores.map((session, idx) => (
                                <div key={session.id} className="flex items-center bg-slate-800/50 p-4 rounded-xl border border-slate-700">
                                     <div className={`w-10 h-10 flex items-center justify-center rounded-full font-black text-xl mr-4 ${idx === 0 ? 'bg-yellow-500 text-black' : idx === 1 ? 'bg-slate-300 text-black' : idx === 2 ? 'bg-orange-700 text-white' : 'bg-slate-700 text-slate-400'}`}>
                                         {idx + 1}
                                     </div>
                                     <div className="flex-1">
                                         <div className="flex justify-between items-baseline">
                                             <span className="text-white font-bold text-xl">${session.score.toLocaleString()}</span>
                                             <span className="text-slate-400 text-sm font-mono">{new Date(session.date).toLocaleDateString()}</span>
                                         </div>
                                         <div className="flex gap-4 text-sm text-slate-500 mt-1">
                                             <span>Depth: {session.depth}m</span>
                                             <span>Platform: {session.platform}</span>
                                         </div>
                                     </div>
                                </div>
                            ))}
                            {topScores.length === 0 && <p className="text-center text-slate-500 mt-10">No games played yet.</p>}
                        </div>
                    )}

                    {activeTab === 'history' && (
                         <div className="space-y-2">
                            {history.map((session) => (
                                <div key={session.id} className="flex justify-between items-center bg-slate-950 p-3 rounded-lg border border-slate-800 hover:border-slate-700 transition">
                                     <div>
                                         <div className="text-white font-bold">${session.score.toLocaleString()}</div>
                                         <div className="text-xs text-slate-500">{new Date(session.date).toLocaleString()}</div>
                                     </div>
                                     <div className="text-right">
                                         <div className="text-cyan-400 font-mono text-sm">{session.depth}m</div>
                                         <div className="text-xs text-slate-600 flex items-center justify-end gap-1">
                                             <Clock className="w-3 h-3" /> {Math.floor(session.duration / 60)}m {session.duration % 60}s
                                         </div>
                                     </div>
                                </div>
                            ))}
                            {history.length === 0 && <p className="text-center text-slate-500 mt-10">No history available.</p>}
                         </div>
                    )}
                </div>
             </div>
        </div>
    );
};

export default Leaderboard;
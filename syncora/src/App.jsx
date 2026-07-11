import React, { useState } from 'react';
import { optimizeSchedule } from './aiService';
import { Calendar, Sparkles, Plus, Trash2, Users, Trophy, Clock } from 'lucide-react';

export default function App() {
  const [currentEvents, setCurrentEvents] = useState([
    { id: '1', title: 'COMP 2404: Advanced OOP', start: '10:00', end: '11:30', type: 'locked' },
    { id: '2', title: 'Group Project Sync', start: '14:00', end: '15:00', type: 'locked' }
  ]);

  const [pendingGoals, setPendingGoals] = useState([
    'Study 2 hours for Stats exam',
    'Hit the gym (Leg Day)',
    'Grab coffee with Sarah'
  ]);

  const [newGoal, setNewGoal] = useState('');
  const [energyLevel, setEnergyLevel] = useState('Morning Peak (Night Crash)');
  const [fifaMode, setFifaMode] = useState(false);
  const [isSyncingFriends, setIsSyncingFriends] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Generate hourly blocks from 08:00 to 22:00 for the left axis
  const hours = Array.from({ length: 15 }, (_, i) => i + 8);

  const handleAddGoal = (e) => {
    e.preventDefault();
    if (!newGoal.trim()) return;
    setPendingGoals([...pendingGoals, newGoal.trim()]);
    setNewGoal('');
  };

  const handleRemoveGoal = (index) => {
    setPendingGoals(pendingGoals.filter((_, i) => i !== index));
  };

  const handleRunAI = async () => {
    // 1. Immediately exit if we are already loading to prevent double-clicks
    if (isLoading) return;
    
    setIsLoading(true);
    try {
      const optimized = await optimizeSchedule(currentEvents, energyLevel, pendingGoals, fifaMode);
      if (optimized && Array.isArray(optimized)) {
        setCurrentEvents(optimized);
        setPendingGoals([]);
      } else {
        alert("AI returned an invalid format. Try clicking optimize again!");
      }
    } catch (err) {
      // 2. Clean up the error message so you don't get a massive wall of JSON text
      if (err.message.includes("429")) {
        alert("Syncora Rate Limit: Google is cooling down your API key. Please wait 30 seconds before trying again.");
      } else {
        alert("Optimization Note: " + err.message.split('\n')[0]);
      }
    } finally {
      // 3. Keep the button disabled for a brief moment to enforce a safety buffer
      setTimeout(() => {
        setIsLoading(false);
      }, 1000);
    }
  };

  // Helper to position blocks absolutely on the grid
  const getEventPosition = (startStr, endStr) => {
    const [startH, startM] = startStr.split(':').map(Number);
    const [endH, endM] = endStr.split(':').map(Number);
    
    const startOffsetMinutes = (startH - 8) * 60 + startM;
    const durationMinutes = (endH * 60 + endM) - (startH * 60 + startM);
    
    // Each hour row is 4rem (64px) high -> 1.066px per minute
    const top = (startOffsetMinutes * 1.066) + 4; // slight padding offset
    const height = durationMinutes * 1.066;
    
    return { top: `${top}px`, height: `${height}px` };
  };

  const getEventStyles = (type) => {
    switch (type) {
      case 'locked': return 'bg-blue-50 border-l-4 border-blue-500 text-blue-700 shadow-sm';
      case 'transit': return 'bg-amber-50 border-l-4 border-amber-400 border-dashed text-amber-700 shadow-sm';
      case 'fifa': return 'bg-emerald-50 border-l-4 border-emerald-500 text-emerald-800 font-semibold shadow-sm animate-pulse';
      default: return 'bg-purple-50 border-l-4 border-purple-500 text-purple-700 font-medium shadow-sm';
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#f8f9fa] text-slate-800 font-sans">
      {/* Premium Header */}
      <header className="border-b border-slate-200 bg-white px-8 py-4 flex justify-between items-center shadow-xs">
        <div className="flex items-center space-x-3">
          <div className="bg-indigo-600 p-2 rounded-lg text-white">
            <Calendar className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-xl font-bold tracking-tight text-slate-900">Syncora</span>
              <span className="text-xs bg-indigo-50 text-indigo-600 font-semibold px-2 py-0.5 rounded-full">AI Workspace</span>
            </div>
          </div>
        </div>
        <div className="flex items-center space-x-4">
          <button 
            onClick={() => setIsSyncingFriends(!isSyncingFriends)}
            className={`flex items-center space-x-1.5 text-sm font-medium px-4 py-2 rounded-lg border transition ${isSyncingFriends ? 'bg-indigo-50 border-indigo-200 text-indigo-600' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'}`}
          >
            <Users className="h-4 w-4" />
            <span>{isSyncingFriends ? "Sarah's Schedule Overlaid" : "Overlay Friends"}</span>
          </button>
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar Panel */}
        <aside className="w-80 border-r border-slate-200 bg-white p-6 overflow-y-auto space-y-6 flex flex-col justify-between">
          <div className="space-y-6">
            <div>
              <h2 className="text-xs font-bold text-slate-400 tracking-wider uppercase mb-3 flex items-center gap-1">
                <Clock className="w-3 w-3" /> 1. Energy Architecture
              </h2>
              <select 
                value={energyLevel} 
                onChange={(e) => setEnergyLevel(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              >
                <option>Morning Peak (Night Crash)</option>
                <option>Night Owl (Slow Mornings)</option>
                <option>Steady Mid-Day Focus</option>
              </select>
            </div>

            <div>
              <div className="flex justify-between items-center mb-3">
                <h2 className="text-xs font-bold text-slate-400 tracking-wider uppercase">2. Objectives to Slot</h2>
                <span className="text-xs bg-slate-100 px-2 py-0.5 rounded-full text-slate-500 font-bold">{pendingGoals.length}</span>
              </div>
              
              <form onSubmit={handleAddGoal} className="flex space-x-2 mb-3">
                <input 
                  type="text" 
                  placeholder="Type a flexible task..." 
                  value={newGoal}
                  onChange={(e) => setNewGoal(e.target.value)}
                  className="flex-1 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                />
                <button type="submit" className="bg-slate-900 hover:bg-slate-800 text-white p-2 rounded-lg transition">
                  <Plus className="h-4 w-4" />
                </button>
              </form>

              <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                {pendingGoals.map((goal, idx) => (
                  <div key={idx} className="flex items-center justify-between bg-slate-50/50 border border-slate-100 rounded-lg p-3 text-sm">
                    <span className="text-slate-600 truncate mr-2">{goal}</span>
                    <button onClick={() => handleRemoveGoal(idx)} className="text-slate-400 hover:text-rose-500 transition">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            <div className="border-t border-slate-100 pt-4">
              <h2 className="text-xs font-bold text-slate-400 tracking-wider uppercase mb-3">3. Smart Layers</h2>
              <label className="flex items-center justify-between p-3 bg-slate-50 rounded-lg cursor-pointer hover:bg-slate-100/70 transition">
                <div className="flex items-center space-x-2">
                  <Trophy className={`h-4 w-4 ${fifaMode ? 'text-emerald-500' : 'text-slate-400'}`} />
                  <span className="text-sm text-slate-700 font-medium">Live Match Sync</span>
                </div>
                <input 
                  type="checkbox" 
                  checked={fifaMode} 
                  onChange={(e) => setFifaMode(e.target.checked)}
                  className="rounded text-indigo-600 focus:ring-indigo-500 h-4 w-4"
                />
              </label>
            </div>
          </div>

          <button
            onClick={handleRunAI}
            disabled={isLoading || (pendingGoals.length === 0 && !fifaMode)}
            className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-300 text-white py-3 px-4 rounded-xl font-semibold shadow-md shadow-indigo-200/50 transition flex items-center justify-center space-x-2 mt-4"
          >
            <Sparkles className="h-4 w-4" />
            <span>{isLoading ? "Mapping Time..." : "Optimize Grid Layout"}</span>
          </button>
        </aside>

        {/* Premium Google Calendar Time-Grid Layout */}
        <main className="flex-1 p-8 overflow-y-auto">
          <div className="max-w-4xl mx-auto bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden flex flex-col h-[750px]">
            <div className="px-6 py-4 border-b border-slate-200 flex justify-between items-center bg-slate-50/50">
              <h3 className="font-bold text-slate-800 text-base">Schedule Flow Matrix</h3>
              <div className="flex gap-2 items-center text-xs font-semibold text-slate-400">
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-blue-500 inline-block"></span> Fixed</span>
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-purple-500 inline-block"></span> AI Scheduled</span>
              </div>
            </div>

            {/* Time Grid Scroll Container */}
            <div className="flex-1 overflow-y-auto relative p-6 bg-white" style={{ minHeight: '600px' }}>
              <div className="absolute top-0 left-0 w-full h-full pointer-events-none border-t border-transparent"></div>
              
              {/* Hour Rows */}
              {hours.map((hour) => (
                <div key={hour} className="flex border-b border-slate-100 h-16 relative items-start">
                  <div className="w-16 text-right pr-4 text-xs font-medium text-slate-400 -mt-2">
                    {hour === 12 ? '12 PM' : hour > 12 ? `${hour - 12} PM` : `${hour} AM`}
                  </div>
                  <div className="flex-1 border-l border-slate-200 h-full"></div>
                </div>
              ))}

              {/* Absolute Event Blocks Layer */}
              <div className="absolute top-0 left-20 right-6 bottom-0 pointer-events-auto">
                {currentEvents
                  .filter(evt => {
                    const h = parseInt(evt.start.split(':')[0]);
                    return h >= 8 && h <= 22;
                  })
                  .map((evt) => {
                    const position = getEventPosition(evt.start, evt.end);
                    return (
                      <div
                        key={evt.id}
                        style={position}
                        className={`absolute left-2 right-2 p-3 rounded-lg border flex flex-col justify-between overflow-hidden transition-all duration-300 hover:shadow-md ${getEventStyles(evt.type)}`}
                      >
                        <div>
                          <div className="flex justify-between items-start">
                            <p className="text-xs font-bold leading-tight truncate">{evt.title}</p>
                            <span className="text-[9px] font-mono font-bold tracking-tight opacity-70 bg-white/60 px-1.5 py-0.5 rounded border border-black/5">
                              {evt.start}
                            </span>
                          </div>
                        </div>
                        <div className="flex justify-between items-center text-[10px] font-bold uppercase tracking-wider opacity-60">
                          <span>{evt.type === 'locked' ? 'Fixed Block' : evt.type === 'fifa' ? '🏆 Stream Watch' : 'AI Placed'}</span>
                          <span>{evt.end}</span>
                        </div>
                      </div>
                    );
                  })}
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

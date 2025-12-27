import React, { useState, useEffect } from 'react';
import { AppData, Priority } from '../types';
import { getFleetInsights } from '../services/geminiService';

interface DashboardProps {
  data: AppData;
  onSendFullDailyReport: () => void;
  onManualSync?: () => void;
}

const Dashboard: React.FC<DashboardProps> = ({ data, onSendFullDailyReport, onManualSync }) => {
  const [insights, setInsights] = useState<string>('');
  const [loadingInsights, setLoadingInsights] = useState(false);
  const [lastFetched, setLastFetched] = useState<number>(0);

  const fetchInsights = async () => {
    // Throttle: don't fetch more than once every 5 minutes automatically
    const now = Date.now();
    if (now - lastFetched < 300000) return;

    setLoadingInsights(true);
    const text = await getFleetInsights(data);
    setInsights(text || 'No insights available.');
    setLoadingInsights(false);
    setLastFetched(now);
  };

  const manualRefresh = async () => {
    setLoadingInsights(true);
    const text = await getFleetInsights(data);
    setInsights(text || 'No insights available.');
    setLoadingInsights(false);
    setLastFetched(Date.now());
  };

  useEffect(() => {
    fetchInsights();
  }, []);

  const activeTasks = data.tasks.filter(t => t.status !== 'Completed');
  const criticalTasks = activeTasks.filter(t => t.priority === Priority.CRITICAL || t.priority === Priority.HIGH);
  const maintenanceBoats = data.boats.filter(b => b.status === 'In Maintenance' || b.status === 'In Repairs').length;

  // Real-time Fleet Status Helper
  const getBoatDeploymentStatus = (boatId: string) => {
    const activeTour = data.tours.find(t => t.boatId === boatId && t.status === 'Dispatched');
    const boat = data.boats.find(b => b.id === boatId);
    
    // Priority: Explicit Status override, then Tour check
    const status = boat?.status || 'Not Available';

    if (status === 'In Repairs') return { label: 'In Repairs', color: 'text-red-600', bg: 'bg-red-50', icon: '🛠️', ready: false };
    if (status === 'In Maintenance') return { label: 'In Service', color: 'text-amber-600', bg: 'bg-amber-50', icon: '🔧', ready: false };
    if (status === 'Cleanup') return { label: 'Cleanup', color: 'text-blue-600', bg: 'bg-blue-50', icon: '🧹', ready: false };
    if (activeTour || status === 'In Tour') return { label: 'On Tour', color: 'text-indigo-600', bg: 'bg-indigo-50', icon: '🌊', ready: false, details: activeTour?.route || 'In Progress' };
    if (status === 'Stand By') return { label: 'Stand By', color: 'text-slate-600', bg: 'bg-slate-50', icon: '⚓', ready: true };
    if (status === 'Available') return { label: 'Ready', color: 'text-green-600', bg: 'bg-green-50', icon: '✅', ready: true };
    
    return { label: 'Offline', color: 'text-slate-400', bg: 'bg-slate-50', icon: '💤', ready: false };
  };

  const isQuotaError = insights.startsWith("QUOTA_EXCEEDED");

  return (
    <div className="space-y-10">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
          <h2 className="text-4xl font-black text-slate-900 tracking-tight">Operations Dashboard</h2>
          <p className="text-slate-500 font-medium">Real-time command center for Pangea Bocas.</p>
        </div>
        <div className="flex items-center space-x-3">
          <button 
            onClick={onManualSync}
            className="bg-white border border-slate-200 text-slate-600 px-6 py-4 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-slate-50 transition-all flex items-center space-x-2 active:scale-95"
          >
            <span>🔄 Force Sync</span>
          </button>
          <button 
            onClick={onSendFullDailyReport}
            className="bg-[#434343] text-white px-8 py-4 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-black transition-all shadow-xl flex items-center space-x-3 active:scale-95"
          >
            <span>🚢 Dispatch Daily Full Report</span>
          </button>
        </div>
      </header>

      {/* KPI Section */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100 group hover:shadow-xl transition-all">
          <div className="w-12 h-12 bg-blue-50 text-blue-500 rounded-2xl flex items-center justify-center text-2xl mb-4 group-hover:scale-110 transition-transform">🔧</div>
          <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Active Tasks</div>
          <div className="text-4xl font-black text-slate-900 mt-1">{activeTasks.length}</div>
        </div>
        <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100 group hover:shadow-xl transition-all">
          <div className="w-12 h-12 bg-red-50 text-red-500 rounded-2xl flex items-center justify-center text-2xl mb-4 group-hover:scale-110 transition-transform">⚠️</div>
          <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Critical Risks</div>
          <div className="text-4xl font-black text-slate-900 mt-1">{criticalTasks.length}</div>
        </div>
        <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100 group hover:shadow-xl transition-all">
          <div className="w-12 h-12 bg-amber-50 text-amber-500 rounded-2xl flex items-center justify-center text-2xl mb-4 group-hover:scale-110 transition-transform">⚓</div>
          <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Under Maintenance</div>
          <div className="text-4xl font-black text-slate-900 mt-1">{maintenanceBoats}</div>
        </div>
        <div className="bg-[#ffb519] p-8 rounded-3xl shadow-lg border border-[#ffb519] group hover:shadow-2xl transition-all text-white">
          <div className="w-12 h-12 bg-white/20 text-white rounded-2xl flex items-center justify-center text-2xl mb-4 group-hover:scale-110 transition-transform">🛥️</div>
          <div className="text-[10px] font-black text-white/70 uppercase tracking-widest">Total Fleet</div>
          <div className="text-4xl font-black mt-1">{data.boats.length}</div>
        </div>
      </div>

      {/* Available Fleet Section */}
      <section className="space-y-6">
        <div className="flex items-center justify-between px-2">
          <h3 className="text-xl font-black text-slate-900 flex items-center space-x-2">
            <span>🛥️</span>
            <span>Real-time Fleet Status</span>
          </h3>
          <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest animate-pulse">Live Updates</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {data.boats.map((boat) => {
            const status = getBoatDeploymentStatus(boat.id);
            return (
              <div key={boat.id} className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm flex flex-col items-center text-center space-y-4 hover:shadow-md transition-all group">
                <div className={`w-16 h-16 ${status.bg} rounded-[1.5rem] flex items-center justify-center text-3xl mb-1 shadow-inner group-hover:scale-105 transition-transform`}>
                  {status.icon}
                </div>
                <div className="space-y-1">
                  <h4 className="font-black text-slate-800 text-sm line-clamp-1">{boat.name}</h4>
                  <div className={`text-[10px] font-black uppercase tracking-widest ${status.color}`}>
                    {status.label}
                  </div>
                </div>
                {status.details && (
                  <div className="bg-slate-50 px-3 py-1.5 rounded-xl text-[9px] font-bold text-slate-400 line-clamp-1">
                    {status.details}
                  </div>
                )}
                <div className={`w-full py-2 rounded-xl text-[9px] font-black uppercase tracking-tighter transition-all ${status.ready ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-400'}`}>
                  {status.ready ? 'Available for Dispatch' : 'Not Available'}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* AI Insights & Alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 bg-gradient-to-br from-[#434343] to-[#202020] p-10 rounded-[3rem] text-white shadow-2xl relative overflow-hidden">
          <div className="relative z-10 space-y-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="bg-[#ffb519] p-3 rounded-2xl shadow-lg">✨</div>
                <h3 className="text-2xl font-black tracking-tight">Gemini Operational Intelligence</h3>
              </div>
              <button 
                onClick={manualRefresh}
                disabled={loadingInsights}
                className="text-[10px] font-black uppercase tracking-widest bg-white/10 hover:bg-white/20 px-4 py-2 rounded-xl transition-all disabled:opacity-50"
              >
                {loadingInsights ? 'Refining...' : 'Refresh AI'}
              </button>
            </div>
            
            <div className="prose prose-invert max-w-none">
              {loadingInsights ? (
                <div className="flex flex-col space-y-4">
                  <div className="h-4 bg-white/10 rounded w-3/4 animate-pulse"></div>
                  <div className="h-4 bg-white/10 rounded w-1/2 animate-pulse"></div>
                  <div className="h-4 bg-white/10 rounded w-2/3 animate-pulse"></div>
                </div>
              ) : isQuotaError ? (
                <div className="bg-red-500/20 border border-red-500/50 p-6 rounded-2xl space-y-3">
                  <p className="text-red-200 font-black text-xs uppercase tracking-widest flex items-center space-x-2">
                    <span>⚠️</span> <span>Resource Exhausted</span>
                  </p>
                  <p className="text-sm text-red-100">
                    The Gemini AI service has reached its request limit. This usually happens with high-traffic periods on free-tier API keys.
                  </p>
                  <p className="text-[10px] text-red-300 italic">
                    Action: Try again in a few minutes or upgrade your Gemini API plan at ai.google.dev.
                  </p>
                </div>
              ) : (
                <div className="text-slate-300 font-medium leading-relaxed whitespace-pre-wrap text-sm border-l-2 border-[#ffb519] pl-6 py-2 bg-white/5 rounded-r-xl italic">
                  {insights}
                </div>
              )}
            </div>
          </div>
          {/* Decorative Elements */}
          <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-[#ffb519]/10 rounded-full blur-3xl"></div>
          <div className="absolute top-0 left-0 w-full h-full bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-10"></div>
        </div>

        <div className="bg-white p-10 rounded-[3rem] border border-slate-100 shadow-sm space-y-6">
          <h4 className="font-black text-slate-800 flex items-center space-x-2">
            <span className="text-red-500">🔥</span>
            <span>Priority Attention</span>
          </h4>
          <div className="space-y-4 max-h-[350px] overflow-y-auto pr-2 custom-scrollbar">
            {criticalTasks.slice(0, 5).map(task => (
              <div key={task.id} className="p-5 bg-red-50/50 rounded-2xl border border-red-100 flex justify-between items-center group hover:bg-red-50 transition-colors">
                <div className="space-y-1">
                  <span className="font-black text-red-900 text-sm">{data.boats.find(b => b.id === task.boatId)?.name}</span>
                  <p className="text-red-700 text-xs font-medium">{task.taskType}</p>
                </div>
                <div className="flex flex-col items-end">
                   <span className="text-[9px] font-black bg-red-200 text-red-800 px-2 py-1 rounded-lg uppercase">
                    {task.priority}
                  </span>
                  <span className="text-[8px] font-bold text-red-400 mt-1 uppercase">Overdue</span>
                </div>
              </div>
            ))}
            {criticalTasks.length === 0 && (
              <div className="py-20 text-center space-y-2">
                <p className="text-4xl">🏝️</p>
                <p className="text-sm font-bold text-slate-300 uppercase tracking-widest">No Critical Alerts</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
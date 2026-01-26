import React, { useState, useEffect, useMemo } from 'react';
import { AppData, Priority, Boat, Tour, Task } from '../types';
import { getFleetInsights } from '../services/geminiService';
import { checkCompliance } from '../services/complianceService';

interface DashboardProps {
  data: AppData;
  onSendFullDailyReport: () => void;
  isSyncing?: boolean;
}

const Dashboard: React.FC<DashboardProps> = ({ data, onSendFullDailyReport, isSyncing }) => {
  const [insights, setInsights] = useState<string>('');
  const [loadingInsights, setLoadingInsights] = useState(false);

  const todayStr = new Date().toISOString().split('T')[0];
  
  const activeTasks = data.tasks.filter(t => t.status !== 'Completed');
  const tasksCompletedToday = data.tasks.filter(t => t.status === 'Completed' && t.dueDate === todayStr);
  
  const complianceAlerts = useMemo(() => checkCompliance(data), [data]);

  // ENGINE HOURS MAINTENANCE ALERT (50HR THRESHOLD)
  const engineHourAlerts = useMemo(() => {
    return data.boats.map(boat => {
      const lastService = boat.lastServiceDate ? new Date(boat.lastServiceDate) : new Date(0);
      const toursSinceService = data.tours.filter(t => 
        t.boatId === boat.id && 
        t.status === 'Completed' && 
        new Date(t.date) >= lastService
      );
      
      const hoursAccumulated = toursSinceService.reduce((sum, t) => {
        const hmiDelta = (t.hmiEnd || 0) - (t.hmiStart || 0);
        const hmdDelta = (t.hmdEnd || 0) - (t.hmdStart || 0);
        const hmcDelta = (t.hmcEnd || 0) - (t.hmcStart || 0);
        // We track the highest usage engine as the primary service driver
        return sum + Math.max(hmiDelta, hmdDelta, hmcDelta);
      }, 0);

      return {
        boatName: boat.boatname,
        hours: hoursAccumulated.toFixed(1),
        isCritical: hoursAccumulated >= 50,
        isWarning: hoursAccumulated >= 40
      };
    }).filter(a => a.isWarning);
  }, [data.boats, data.tours]);

  // FLEET EFFICIENCY LOGIC
  const fleetEfficiency = useMemo(() => {
    const completed = data.tours.filter(t => t.status === 'Completed');
    const totalGasLost = completed.reduce((sum, t) => sum + (t.startGas - (t.endGas || 0)), 0);
    const totalHours = completed.reduce((sum, t) => {
      const hmi = (t.hmiEnd || 0) - (t.hmiStart || 0);
      return sum + hmi;
    }, 0);
    return totalHours > 0 ? (totalGasLost / totalHours).toFixed(2) : "0.00";
  }, [data.tours]);

  useEffect(() => {
    const fetchIns = async () => {
      setLoadingInsights(true);
      const text = await getFleetInsights(data);
      setInsights(text || '');
      setLoadingInsights(false);
    };
    fetchIns();
  }, [data]);

  return (
    <div className="space-y-10">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
          <h2 className="text-4xl font-black text-slate-900 tracking-tight flex items-center gap-3">
            Operations Dashboard
            {isSyncing && <span className="bg-amber-100 text-amber-600 text-[10px] px-3 py-1 rounded-full animate-pulse">Live Syncing</span>}
          </h2>
          <p className="text-slate-500 font-medium">Real-time command center & maintenance intelligence.</p>
        </div>
        <button onClick={onSendFullDailyReport} className="bg-[#434343] text-white px-8 py-4 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-black transition-all shadow-xl">
          🚢 Dispatch Daily Full Report
        </button>
      </header>

      {/* KPI Section */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100">
          <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Efficiency (Pts/Hr)</div>
          <div className="text-4xl font-black text-slate-900 mt-1">{fleetEfficiency}</div>
        </div>
        <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100">
          <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Active Tasks</div>
          <div className="text-4xl font-black text-slate-900 mt-1">{activeTasks.length}</div>
        </div>
        <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100">
          <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Tasks Done Today</div>
          <div className="text-4xl font-black text-green-600 mt-1">{tasksCompletedToday.length}</div>
        </div>
        <div className="bg-[#ffb519] p-8 rounded-3xl shadow-lg text-white">
          <div className="text-[10px] font-black text-white/70 uppercase tracking-widest">Active Fleet</div>
          <div className="text-4xl font-black mt-1">{data.boats.filter(b => b.status === 'Available').length}</div>
        </div>
      </div>

      {/* Engine Hour Maintenance Warning */}
      {engineHourAlerts.length > 0 && (
        <section className="bg-red-50 border-2 border-red-100 p-8 rounded-[2.5rem] space-y-4">
          <h3 className="text-red-800 font-black uppercase text-sm tracking-widest flex items-center gap-2">
            <span>🚨</span> Critical Maintenance (50Hr Limit)
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {engineHourAlerts.map(alert => (
              <div key={alert.boatName} className={`p-4 rounded-2xl border bg-white flex justify-between items-center ${alert.isCritical ? 'border-red-400' : 'border-amber-400'}`}>
                <div>
                  <p className="font-black text-slate-800">{alert.boatName}</p>
                  <p className={`text-xs font-bold ${alert.isCritical ? 'text-red-600' : 'text-amber-600'}`}>{alert.hours} hrs since service</p>
                </div>
                <span className="text-2xl">{alert.isCritical ? '🛑' : '⚠️'}</span>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* AI Insights & Alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          <div className="bg-[#202020] p-10 rounded-[3rem] text-white shadow-2xl space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-2xl font-black tracking-tight flex items-center gap-3">
                <span className="bg-[#ffb519] p-2 rounded-xl text-white">✨</span> Cloud Insights
              </h3>
            </div>
            <div className="text-slate-300 font-medium leading-relaxed italic border-l-2 border-[#ffb519] pl-6">
              {loadingInsights ? 'Compiling cloud metrics...' : insights}
            </div>
          </div>

          {tasksCompletedToday.length > 0 && (
            <div className="bg-green-50/50 p-10 rounded-[3rem] border border-green-100 shadow-sm space-y-6">
              <h4 className="font-black text-green-800 flex items-center gap-2">
                <span className="text-green-500">✅</span> Today's Completions
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {tasksCompletedToday.map(task => (
                  <div key={task.id} className="bg-white p-4 rounded-2xl border border-green-100 flex justify-between items-center">
                    <div>
                      <p className="text-[9px] font-black uppercase text-slate-400">{data.boats.find(b => b.id === task.boatId)?.boatname || 'Vessel'}</p>
                      <p className="font-black text-sm text-slate-800">{task.taskType}</p>
                    </div>
                    <span className="text-green-500 font-bold text-xs">DONE</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="bg-white p-10 rounded-[3rem] border border-slate-100 shadow-sm space-y-6">
          <h4 className="font-black text-slate-800 flex items-center gap-2">
            <span className="text-red-500">🔥</span> Priority Attention
          </h4>
          <div className="space-y-4 max-h-[550px] overflow-y-auto pr-2 custom-scrollbar">
            {complianceAlerts.map(alert => (
              <div key={alert.id} className={`p-5 rounded-2xl border flex justify-between items-center ${alert.severity === 'Critical' ? 'bg-red-50 border-red-100' : 'bg-amber-50 border-amber-100'}`}>
                <div className="space-y-1">
                  <span className="text-[8px] font-black uppercase text-slate-400">{alert.type}</span>
                  <p className="font-black text-sm text-slate-900">{alert.name}</p>
                  <p className="text-xs font-bold text-slate-600">{alert.daysLeft < 0 ? 'Overdue' : 'Expiring Soon'}</p>
                </div>
                <span className="text-xl">{alert.severity === 'Critical' ? '🚨' : '⚠️'}</span>
              </div>
            ))}
            {complianceAlerts.length === 0 && (
              <div className="py-12 text-center text-slate-300 font-bold uppercase text-[10px] tracking-widest">
                No active alerts
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
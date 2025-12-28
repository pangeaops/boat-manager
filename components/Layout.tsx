import React, { useMemo } from 'react';
import { PANGEA_YELLOW, PANGEA_DARK } from '../constants';
import { AppUser, AppData } from '../types';
import { checkCompliance } from '../services/complianceService';

interface LayoutProps {
  children: React.ReactNode;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  user: AppUser;
  onLogout: () => void;
  isSyncing?: boolean;
  lastSync?: Date | null;
  pendingReport?: 'daily' | 'weekly' | null;
  data: AppData;
}

const Layout: React.FC<LayoutProps> = ({ 
  children, 
  activeTab, 
  setActiveTab, 
  user, 
  onLogout,
  isSyncing,
  lastSync,
  pendingReport,
  data
}) => {
  const complianceAlerts = useMemo(() => checkCompliance(data), [data]);
  const boatAlerts = complianceAlerts.filter(a => a.type === 'Boat').length;
  const staffAlerts = complianceAlerts.filter(a => a.type === 'Staff').length;
  const tourAlerts = complianceAlerts.filter(a => a.type === 'Tour').length;
  const taskAlerts = complianceAlerts.filter(a => a.type === 'Task' && a.severity === 'Critical').length;

  const allNavItems = [
    { id: 'dashboard', label: 'Dashboard', icon: '📊', minRole: 'Staff' },
    { id: 'admin_dashboard', label: 'Admin Analytics', icon: '📈', minRole: 'Admin' },
    { id: 'fleet', label: 'Fleet Hub', icon: '🛥️', minRole: 'Staff', badge: boatAlerts },
    { id: 'tours', label: 'Daily Tours', icon: '📅', minRole: 'Staff', badge: tourAlerts },
    { id: 'inventory', label: 'Inventory Hub', icon: '📦', minRole: 'Staff' },
    { id: 'personnel_hub', label: 'Staff Hub', icon: '👤', minRole: 'Staff', badge: staffAlerts },
    { id: 'maintenance', label: 'Maintenance', icon: '🔧', minRole: 'Staff', badge: taskAlerts },
    { id: 'protocols', label: 'Safety & Eco', icon: '🛡️', minRole: 'Staff' },
    { id: 'logs', label: 'Ops Log', icon: '📜', minRole: 'Staff' },
    { id: 'add_forms', label: 'Admin Console', icon: '🛠️', minRole: 'Admin' },
  ];

  const filteredNavItems = allNavItems.filter(item => 
    user.role === 'Admin' || item.minRole === 'Staff'
  );

  const hasCriticalCompliance = complianceAlerts.some(a => a.severity === 'Critical');

  return (
    <div className="flex h-screen bg-white overflow-hidden text-[#434343]">
      <aside className="w-72 bg-slate-50 flex flex-col border-r border-slate-200">
        <div className="p-8">
          <div className="flex items-center space-x-3">
             <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-black" style={{ backgroundColor: PANGEA_YELLOW }}>P</div>
             <div>
               <h1 className="text-xl font-black tracking-tighter" style={{ color: PANGEA_DARK }}>PANGEA<span style={{ color: PANGEA_YELLOW }}>OPS</span></h1>
               <p className="text-[9px] uppercase tracking-widest text-slate-400 font-bold">Fleet Management</p>
             </div>
          </div>
        </div>
        
        <div className="px-8 pb-4 mb-4 border-b border-slate-200 space-y-3">
           <div className="flex items-center space-x-3 p-3 bg-white rounded-2xl shadow-sm border border-slate-100">
             <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-sm">👤</div>
             <div className="overflow-hidden">
               <p className="text-[10px] font-black text-slate-400 uppercase tracking-tighter">{user.role}</p>
               <p className="text-xs font-black truncate text-slate-700">{user.name}</p>
             </div>
           </div>

           {/* Cloud Sync Status Indicator */}
           <div className="flex items-center justify-between px-2">
             <div className="flex items-center space-x-2">
               <div className={`w-2 h-2 rounded-full ${isSyncing ? 'bg-amber-400 animate-pulse' : 'bg-green-500'}`}></div>
               <span className="text-[8px] font-black uppercase text-slate-400 tracking-widest">
                 {isSyncing ? 'Syncing...' : 'Cloud Connected'}
               </span>
             </div>
             {lastSync && (
               <span className="text-[8px] font-bold text-slate-300">
                 {lastSync.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
               </span>
             )}
           </div>

           {/* Automated Report Badge */}
           {pendingReport && (
             <div className="bg-amber-100 border border-amber-200 p-2 rounded-xl flex items-center space-x-3 animate-pulse">
                <span className="text-xs">🔔</span>
                <span className="text-[8px] font-black uppercase text-amber-700 tracking-widest">Pending Report</span>
             </div>
           )}

           {/* Critical Compliance/Overdue Badge */}
           {hasCriticalCompliance && (
             <div className="bg-red-100 border border-red-200 p-2 rounded-xl flex items-center space-x-3">
                <span className="text-xs">🚨</span>
                <span className="text-[8px] font-black uppercase text-red-700 tracking-widest">
                  {tourAlerts > 0 ? 'Missing Arrival Logs' : taskAlerts > 0 ? 'Overdue Maintenance' : 'Compliance Alert'}
                </span>
             </div>
           )}
        </div>
        
        <nav className="flex-1 px-4 space-y-1 overflow-y-auto custom-scrollbar">
          {filteredNavItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center space-x-4 px-6 py-3.5 rounded-2xl transition-all duration-300 font-bold text-sm group relative ${
                activeTab === item.id 
                  ? 'bg-white shadow-lg border border-slate-100' 
                  : 'text-slate-400 hover:text-[#434343]'
              }`}
            >
              <span className="text-xl" style={{ color: activeTab === item.id ? PANGEA_YELLOW : 'inherit' }}>{item.icon}</span>
              <span className="flex-1 text-left" style={{ color: activeTab === item.id ? PANGEA_DARK : 'inherit' }}>{item.label}</span>
              
              {/* Notification Badges */}
              {(item.badge && item.badge > 0) ? (
                <div className={`absolute right-4 flex items-center justify-center min-w-[20px] h-5 px-1 ${item.id === 'tours' || item.id === 'maintenance' ? 'bg-red-600' : 'bg-red-500'} rounded-full text-[9px] text-white font-black animate-pulse`}>
                  {item.badge}
                </div>
              ) : (
                item.id === 'tours' && pendingReport && (
                  <div className="absolute right-4 w-2 h-2 bg-amber-500 rounded-full"></div>
                )
              )}
            </button>
          ))}
        </nav>

        <div className="p-8 space-y-4">
          <button 
            onClick={onLogout}
            className="w-full bg-slate-200 hover:bg-slate-300 text-slate-600 font-black py-3 rounded-2xl text-[10px] uppercase tracking-widest transition-all"
          >
            Sign Out
          </button>
          {/* Linked to Protocols (Safety & Eco) */}
          <button 
            onClick={() => setActiveTab('protocols')}
            className="w-full bg-red-600 hover:bg-red-700 text-white font-black py-4 rounded-2xl flex items-center justify-center space-x-2 shadow-lg transition-transform active:scale-95"
          >
            <span className="text-xl">🚨</span>
            <span className="uppercase tracking-widest text-xs">Emergency</span>
          </button>
        </div>
      </aside>

      <main className="flex-1 overflow-y-auto bg-white p-12">
        <div className="max-w-6xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
};

export default Layout;
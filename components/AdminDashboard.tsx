import React from 'react';
import { AppData } from '../types.ts';
import { PANGEA_DARK } from '../constants.ts';

interface AdminDashboardProps {
  data: AppData;
}

const AdminDashboard: React.FC<AdminDashboardProps> = ({ data }) => {
  const completedTours = (data.tours || []).filter(t => t.status === 'Completed');
  
  const toursPerBoat = data.boats.map(boat => ({
    name: boat.boatname,
    count: completedTours.filter(t => t.boatId === boat.id).length
  })).sort((a, b) => b.count - a.count);

  const totalPax = completedTours.reduce((acc, t) => acc + (t.paxCount || 0), 0);
  const avgFuelUsage = completedTours.length > 0 
    ? completedTours.reduce((acc, t) => acc + ((t.startGas || 0) - (t.endGas || 0)), 0) / completedTours.length 
    : 0;

  const BarChart = ({ items }: { items: { name: string, count: number }[] }) => {
    const max = Math.max(...items.map(i => i.count), 1);
    return (
      <div className="space-y-4">
        {items.map(item => (
          <div key={item.name} className="space-y-1">
            <div className="flex justify-between text-[10px] font-black uppercase text-slate-400">
              <span>{item.name}</span>
              <span>{item.count} Tours</span>
            </div>
            <div className="h-4 bg-slate-50 rounded-full overflow-hidden border border-slate-100">
              <div className="h-full bg-[#ffb519] transition-all duration-1000" style={{ width: `${(item.count / max) * 100}%` }}></div>
            </div>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="space-y-12 pb-20">
      <header className="flex justify-between items-center">
        <div>
           <h2 className="text-4xl font-black tracking-tight" style={{ color: PANGEA_DARK }}>Admin Analytics</h2>
           <p className="text-slate-400 font-medium">Strategic overview of Pangea Bocas operations.</p>
        </div>
        <div className="bg-slate-800 text-white px-8 py-4 rounded-[2rem] shadow-xl flex items-center space-x-4">
           <div className="text-right">
             <p className="text-[9px] font-black uppercase tracking-[0.2em] text-[#ffb519]">Operational Yield</p>
             <p className="text-2xl font-black">{completedTours.length} Completed</p>
           </div>
           <span className="text-3xl">📈</span>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 bg-white rounded-[3rem] p-12 border border-slate-100 shadow-sm space-y-10">
           <div>
             <h3 className="text-2xl font-black">Vessel Utilization</h3>
             <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mt-1">Tour volume distribution across the fleet</p>
           </div>
           <BarChart items={toursPerBoat} />
        </div>

        <div className="space-y-8">
           <div className="bg-gradient-to-br from-[#434343] to-black p-10 rounded-[3rem] text-white shadow-2xl relative overflow-hidden">
             <div className="relative z-10 space-y-6">
                <p className="text-[10px] font-black uppercase tracking-[0.3em] text-[#ffb519]">Total Guests</p>
                <h4 className="text-6xl font-black leading-none">{totalPax}</h4>
                <div className="pt-6 border-t border-white/10 flex justify-between items-end">
                   <div>
                     <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Avg Gas Drop</p>
                     <p className="text-xl font-black">-{avgFuelUsage.toFixed(1)} <span className="text-xs text-slate-500">Pts</span></p>
                   </div>
                   <span className="text-2xl">🔥</span>
                </div>
             </div>
           </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
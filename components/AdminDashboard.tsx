
import React from 'react';
import { AppData, Tour } from '../types';
import { PANGEA_YELLOW, PANGEA_DARK } from '../constants';

interface AdminDashboardProps {
  data: AppData;
}

const AdminDashboard: React.FC<AdminDashboardProps> = ({ data }) => {
  const completedTours = data.tours.filter(t => t.status === 'Completed');
  
  // Calculate analytics
  const toursPerBoat = data.boats.map(boat => ({
    name: boat.name,
    count: completedTours.filter(t => t.boatId === boat.id).length
  })).sort((a, b) => b.count - a.count);

  const totalPax = completedTours.reduce((acc, t) => acc + t.paxCount, 0);
  const avgFuelUsage = completedTours.length > 0 
    ? completedTours.reduce((acc, t) => acc + (t.startGas - (t.endGas || 0)), 0) / completedTours.length 
    : 0;

  // Mock financial distribution (since we don't have a direct 'spending' table yet, we base it on provisions/maintenance)
  const spendingData = [
    { label: 'Provisions', value: 35, color: '#ffb519' },
    { label: 'Maintenance', value: 45, color: '#434343' },
    { label: 'Fuel/Gas', value: 20, color: '#cbd5e1' }
  ];

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
              <div 
                className="h-full bg-[#ffb519] transition-all duration-1000" 
                style={{ width: `${(item.count / max) * 100}%` }}
              ></div>
            </div>
          </div>
        ))}
      </div>
    );
  };

  const DonutChart = ({ items }: { items: { label: string, value: number, color: string }[] }) => {
    return (
      <div className="flex items-center space-x-10">
        <div className="relative w-32 h-32">
          <svg viewBox="0 0 32 32" className="w-full h-full transform -rotate-90">
            {/* Fix: Using React.ReactElement[] instead of JSX.Element[] to resolve 'Cannot find namespace JSX' error */}
            {items.reduce((acc, item, i) => {
              const prev = acc.total;
              const strokeDasharray = `${item.value} 100`;
              const strokeDashoffset = -prev;
              acc.total += item.value;
              acc.elements.push(
                <circle
                  key={i}
                  cx="16" cy="16" r="14"
                  fill="transparent"
                  stroke={item.color}
                  strokeWidth="4"
                  strokeDasharray={strokeDasharray}
                  strokeDashoffset={strokeDashoffset}
                />
              );
              return acc;
            }, { total: 0, elements: [] as React.ReactElement[] }).elements}
            <circle cx="16" cy="16" r="10" fill="white" />
          </svg>
        </div>
        <div className="space-y-3">
          {items.map(item => (
            <div key={item.label} className="flex items-center space-x-3">
              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }}></div>
              <span className="text-[10px] font-black uppercase text-slate-500">{item.label}</span>
              <span className="text-xs font-black">{item.value}%</span>
            </div>
          ))}
        </div>
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
        {/* Vessel Performance */}
        <div className="lg:col-span-2 bg-white rounded-[3rem] p-12 border border-slate-100 shadow-sm space-y-10">
           <div>
             <h3 className="text-2xl font-black">Vessel Utilization</h3>
             <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mt-1">Tour volume distribution across the fleet</p>
           </div>
           <BarChart items={toursPerBoat} />
        </div>

        {/* Global Stats */}
        <div className="space-y-8">
           <div className="bg-gradient-to-br from-[#434343] to-black p-10 rounded-[3rem] text-white shadow-2xl relative overflow-hidden">
             <div className="relative z-10 space-y-6">
                <p className="text-[10px] font-black uppercase tracking-[0.3em] text-[#ffb519]">Total Guests Dispatched</p>
                <h4 className="text-6xl font-black leading-none">{totalPax}</h4>
                <div className="pt-6 border-t border-white/10 flex justify-between items-end">
                   <div>
                     <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Average Gas Scale Loss</p>
                     <p className="text-xl font-black">-{avgFuelUsage.toFixed(1)} <span className="text-xs text-slate-500">Pts/Trip</span></p>
                   </div>
                   <span className="text-2xl">🔥</span>
                </div>
             </div>
             <div className="absolute top-0 right-0 w-32 h-32 bg-[#ffb519]/5 rounded-full blur-3xl -mr-10 -mt-10"></div>
           </div>

           <div className="bg-white rounded-[3rem] p-10 border border-slate-100 shadow-sm space-y-8">
              <div>
                <h4 className="text-lg font-black">Spending Analysis</h4>
                <p className="text-[10px] font-bold text-slate-400 uppercase">General operational cost distribution</p>
              </div>
              <DonutChart items={spendingData} />
           </div>
        </div>
      </div>

      {/* Crew Utilization */}
      <section className="bg-slate-50/50 rounded-[3.5rem] p-12 border border-slate-100 space-y-10">
         <div className="flex items-center justify-between">
            <h3 className="text-2xl font-black">Crew Dispatch Matrix</h3>
            <span className="bg-white px-4 py-2 rounded-xl text-[10px] font-black text-slate-400 uppercase border border-slate-100 shadow-sm">Real-time Performance Metrics</span>
         </div>
         <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {data.personnel.filter(p => p.role.includes('Capitán')).slice(0, 4).map(captain => {
              const capTours = completedTours.filter(t => t.captainId === captain.id).length;
              return (
                <div key={captain.id} className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100 space-y-6 flex flex-col items-center text-center">
                   <div className="w-16 h-16 rounded-2xl bg-slate-800 text-white flex items-center justify-center text-2xl overflow-hidden">
                      {captain.profilePhoto ? <img src={captain.profilePhoto} className="w-full h-full object-cover" /> : '👤'}
                   </div>
                   <div>
                      <h4 className="font-black text-slate-800 leading-tight">{captain.name}</h4>
                      <p className="text-[9px] font-black uppercase text-[#ffb519] tracking-widest">{captain.role}</p>
                   </div>
                   <div className="w-full pt-4 border-t border-slate-50">
                      <p className="text-[8px] font-black text-slate-400 uppercase">Tours Dispatched</p>
                      <p className="text-2xl font-black">{capTours}</p>
                   </div>
                </div>
              );
            })}
         </div>
      </section>
    </div>
  );
};

export default AdminDashboard;

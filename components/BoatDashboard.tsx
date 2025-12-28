import React from 'react';
import { AppData, Boat, Task, BoatStatus, UserRole } from '../types';
import { PANGEA_DARK, BOAT_STATUS_OPTIONS } from '../constants';

interface BoatDashboardProps {
  data: AppData;
  userRole: UserRole;
  onUpdateTaskStatus: (taskId: string, status: Task['status']) => void;
  onEditBoat: (boat: Boat) => void;
  onUpdateBoatStatus: (boatId: string, status: BoatStatus) => void;
}

const BoatDashboard: React.FC<BoatDashboardProps> = ({ data, userRole, onUpdateTaskStatus, onEditBoat, onUpdateBoatStatus }) => {
  const isExpired = (dateStr: string) => {
    if (!dateStr) return false;
    const exp = new Date(dateStr);
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    return exp.getTime() < today.getTime();
  };

  const isExpiringSoon = (dateStr: string) => {
    if (!dateStr) return false;
    const exp = new Date(dateStr);
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const diff = exp.getTime() - today.getTime();
    const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
    return days > 0 && days <= 30;
  };

  const getPendingTasks = (boatId: string) => {
    return data.tasks.filter(t => t.boatId === boatId && t.status !== 'Completed');
  };

  const getStatusColor = (status: BoatStatus) => {
    switch (status) {
      case 'Available': return 'bg-green-100 text-green-700';
      case 'In Maintenance': return 'bg-amber-100 text-amber-700';
      case 'In Repairs': return 'bg-red-100 text-red-700';
      case 'Cleanup': return 'bg-blue-100 text-blue-700';
      case 'In Tour': return 'bg-indigo-100 text-indigo-700';
      case 'Stand By': return 'bg-slate-100 text-slate-700';
      default: return 'bg-slate-100 text-slate-400';
    }
  };

  return (
    <div className="space-y-12">
      <header className="flex justify-between items-center">
        <div>
           <h2 className="text-4xl font-black tracking-tight" style={{ color: PANGEA_DARK }}>Fleet Hub</h2>
           <p className="text-slate-400 font-medium">Compliance, Status & Technical Specifications</p>
        </div>
      </header>

      <div className="grid grid-cols-1 gap-12">
        {data.boats.map((boat) => {
          const tasks = getPendingTasks(boat.id);
          const expired = isExpired(boat.licenseExpDate);
          const expiringSoon = isExpiringSoon(boat.licenseExpDate);

          return (
            <div key={boat.id} className={`bg-white rounded-[3rem] p-10 shadow-2xl border-2 transition-all ${expired ? 'border-red-400' : expiringSoon ? 'border-amber-400' : 'border-slate-50'} flex flex-col gap-10 relative overflow-hidden`}>
              {expired && (
                <div className="absolute top-0 right-0 bg-red-500 text-white px-8 py-2 font-black text-[10px] uppercase tracking-widest transform translate-x-12 translate-y-4 rotate-45 shadow-lg">
                  EXPIRED
                </div>
              )}
              
              <div className="flex flex-col lg:flex-row gap-10">
                <div className="w-full lg:w-1/3 space-y-8">
                   <div className="flex justify-between items-start">
                      <div>
                        <h3 className="text-3xl font-black" style={{ color: PANGEA_DARK }}>{boat.name}</h3>
                        <p className="text-slate-400 font-bold uppercase text-[10px] tracking-widest">{boat.model} ({boat.year})</p>
                      </div>
                      <div className="flex flex-col items-end space-y-2">
                        <select 
                          value={boat.status} 
                          onChange={(e) => onUpdateBoatStatus(boat.id, e.target.value as BoatStatus)}
                          className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase outline-none shadow-sm transition-all border-none cursor-pointer ${getStatusColor(boat.status)}`}
                        >
                          {BOAT_STATUS_OPTIONS.map(opt => (
                            <option key={opt} value={opt} className="bg-white text-slate-800">{opt}</option>
                          ))}
                        </select>
                        {userRole === 'Admin' && (
                          <button 
                            onClick={() => onEditBoat(boat)}
                            className="bg-slate-100 hover:bg-[#ffb519] hover:text-white text-[10px] font-black uppercase px-4 py-1.5 rounded-xl transition-all"
                          >
                            Edit Specs
                          </button>
                        )}
                      </div>
                   </div>

                   <div className="bg-slate-50 p-6 rounded-3xl space-y-4">
                      <div className="flex justify-between border-b border-slate-200 pb-2"><span className="text-[10px] font-black text-slate-400 uppercase tracking-tighter">Hull HIN</span><span className="text-sm font-black text-slate-700">{boat.serialNumber}</span></div>
                      <div className="flex justify-between border-b border-slate-200 pb-2"><span className="text-[10px] font-black text-slate-400 uppercase tracking-tighter">License No.</span><span className="text-sm font-black text-slate-700">{boat.licenseNumber}</span></div>
                      <div className={`flex justify-between border-b border-slate-200 pb-2 p-2 rounded-xl transition-all ${expired ? 'bg-red-500 text-white animate-pulse' : expiringSoon ? 'bg-amber-100 text-amber-700 font-black' : ''}`}>
                        <span className={`text-[10px] font-black uppercase tracking-tighter ${expired ? 'text-white' : 'text-slate-400'}`}>License Exp.</span>
                        <span className="text-sm font-black">{boat.licenseExpDate || 'NOT SET'}</span>
                      </div>
                      <div className="flex justify-between border-b border-slate-200 pb-2"><span className="text-[10px] font-black text-slate-400 uppercase tracking-tighter">Capacity</span><span className="text-sm font-black text-slate-700">{boat.capacity} PAX</span></div>
                   </div>
                </div>

                <div className="w-full lg:w-1/3 bg-slate-50/50 p-8 rounded-[2.5rem] border border-slate-100 space-y-8">
                  <h4 className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em]">Engines Configuration</h4>
                  <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-1"><p className="text-[9px] font-black text-slate-400 uppercase">Brand</p><p className="text-sm font-black text-slate-800">{boat.engineBrand}</p></div>
                    <div className="space-y-1"><p className="text-[9px] font-black text-slate-400 uppercase">Model</p><p className="text-sm font-black text-slate-800">{boat.engineModel}</p></div>
                    <div className="space-y-1"><p className="text-[9px] font-black text-slate-400 uppercase">Total HP</p><p className="text-sm font-black text-slate-800">{boat.engineHP} HP</p></div>
                    <div className="space-y-1"><p className="text-[9px] font-black text-slate-400 uppercase">Motors</p><p className="text-sm font-black text-slate-800">{boat.numberOfEngines}x Units</p></div>
                  </div>
                  
                  <div className="space-y-3 pt-4 border-t border-slate-100">
                    <p className="text-[9px] font-black text-slate-400 uppercase">BIN / Serial Numbers</p>
                    {boat.engineSerialNumbers?.map((sn, i) => (
                      <div key={i} className="flex justify-between items-center text-xs">
                         <span className="font-bold text-slate-400">Motor {i+1}</span>
                         <span className="font-black text-slate-700">{sn || '—'}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex-1 space-y-6">
                  <h4 className="text-xs font-black uppercase text-slate-400 tracking-widest">Upcoming Maintenance</h4>
                  <div className="space-y-4 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                     {tasks.map(task => (
                       <div key={task.id} className="bg-white border border-slate-100 p-6 rounded-3xl flex justify-between items-center shadow-sm">
                          <div className="space-y-1">
                             <div className="flex items-center space-x-2">
                                <span className="text-[9px] font-black uppercase bg-amber-100 text-amber-700 px-2 py-0.5 rounded">{task.priority}</span>
                                <span className="text-[9px] font-black text-red-500 uppercase">DUE: {task.dueDate}</span>
                             </div>
                             <p className="font-black text-sm text-slate-800">{task.taskType}</p>
                          </div>
                          <button onClick={() => onUpdateTaskStatus(task.id, 'Completed')} className="w-10 h-10 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center text-lg shadow-sm hover:bg-[#ffb519] hover:text-white transition-all">✓</button>
                       </div>
                     ))}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default BoatDashboard;
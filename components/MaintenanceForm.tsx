import React, { useState } from 'react';
import { AppData, Priority, Task } from '../types';
import { MAINTENANCE_TASKS, PANGEA_YELLOW } from '../constants';

interface MaintenanceFormProps {
  data: AppData;
  onAddTask: (task: Task) => void;
  onSendReport: (task: Task) => void;
  onUpdateStatus: (taskId: string, status: Task['status']) => void;
}

const MaintenanceForm: React.FC<MaintenanceFormProps> = ({ data, onAddTask, onSendReport, onUpdateStatus }) => {
  const [formData, setFormData] = useState({
    boatId: '',
    taskType: MAINTENANCE_TASKS[0],
    priority: Priority.MEDIUM,
    scheduledDate: new Date().toISOString().split('T')[0],
    dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    personnelIds: [] as string[],
    notes: ''
  });

  const activePersonnel = data.personnel.filter(p => p.isActive !== false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.boatId || formData.personnelIds.length === 0) return alert("Select boat and personnel.");

    onAddTask({
      id: Math.random().toString(36).substr(2, 9),
      boatId: formData.boatId,
      taskType: formData.taskType,
      priority: formData.priority,
      scheduledDate: formData.scheduledDate,
      dueDate: formData.dueDate,
      personnelInCharge: formData.personnelIds,
      status: 'Pending',
      notes: formData.notes
    });
    alert("Maintenance task assigned and logged.");
    setFormData({
      ...formData,
      boatId: '',
      personnelIds: [],
      notes: ''
    });
  };

  const handleGlobalSummary = () => {
    alert("Generating fleet-wide maintenance summary for ops@pangeabocas.com...");
  };

  return (
    <div className="space-y-12">
      <div className="flex justify-between items-center bg-white p-8 rounded-[2rem] border border-slate-100 shadow-sm">
        <div>
          <h2 className="text-2xl font-black">Maintenance Command</h2>
          <p className="text-slate-400 font-medium text-sm">Schedule repairs and generate technical documentation.</p>
        </div>
        <button 
          onClick={handleGlobalSummary}
          className="bg-slate-800 text-white px-8 py-3 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-black transition-all shadow-lg flex items-center space-x-2"
        >
          <span>📑 Fleet Summary Report</span>
        </button>
      </div>

      <div className="bg-white rounded-[3rem] shadow-2xl overflow-hidden border border-slate-100 max-w-2xl mx-auto">
        <div className="p-12 space-y-8">
          <div>
            <h2 className="text-3xl font-black">New Task Entry</h2>
            <p className="text-slate-400 font-bold text-xs uppercase tracking-[0.2em] mt-1">Assign Service & Deadline</p>
          </div>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase text-slate-400">Target Vessel</label>
              <select value={formData.boatId} onChange={e => setFormData({...formData, boatId: e.target.value})} className="w-full bg-slate-50 border border-slate-100 rounded-xl px-6 py-4 font-bold outline-none focus:ring-2 focus:ring-[#ffb519]">
                <option value="">Choose Boat...</option>
                {data.boats.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
               <div className="space-y-2">
                 <label className="text-[10px] font-black uppercase text-slate-400">Task Selection</label>
                 <select value={formData.taskType} onChange={e => setFormData({...formData, taskType: e.target.value})} className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-3 font-bold outline-none">
                   {MAINTENANCE_TASKS.map(task => <option key={task} value={task}>{task}</option>)}
                 </select>
               </div>
               <div className="space-y-2">
                 <label className="text-[10px] font-black uppercase text-slate-400">Priority Level</label>
                 <select value={formData.priority} onChange={e => setFormData({...formData, priority: e.target.value as Priority})} className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-3 font-bold outline-none">
                   {Object.values(Priority).map(p => <option key={p} value={p}>{p}</option>)}
                 </select>
               </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
               <div className="space-y-2">
                 <label className="text-[10px] font-black uppercase text-slate-400">Start Date</label>
                 <input type="date" value={formData.scheduledDate} onChange={e => setFormData({...formData, scheduledDate: e.target.value})} className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-3 font-bold" />
               </div>
               <div className="space-y-2">
                 <label className="text-[10px] font-black uppercase text-slate-400">Deadline</label>
                 <input type="date" value={formData.dueDate} onChange={e => setFormData({...formData, dueDate: e.target.value})} className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-3 font-bold text-red-600" />
               </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase text-slate-400">Maintenance Personnel</label>
              <div className="flex flex-wrap gap-2 p-4 bg-slate-50 rounded-2xl border border-slate-100 min-h-[100px]">
                 {activePersonnel.map(p => (
                   <button 
                    key={p.id} 
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, personnelIds: prev.personnelIds.includes(p.id) ? prev.personnelIds.filter(id => id !== p.id) : [...prev.personnelIds, p.id] }))}
                    className={`px-3 py-2 rounded-xl text-[10px] font-black transition-all ${formData.personnelIds.includes(p.id) ? 'bg-[#ffb519] text-white shadow-md' : 'bg-white text-slate-400 border border-slate-200 hover:text-slate-600'}`}
                   >
                     {p.name}
                   </button>
                 ))}
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase text-slate-400">Internal Notes</label>
              <textarea value={formData.notes} onChange={e => setFormData({...formData, notes: e.target.value})} className="w-full bg-slate-50 border border-slate-100 rounded-xl px-6 py-4 font-medium h-24 outline-none focus:ring-2 focus:ring-[#ffb519]" placeholder="Specific parts needed or technical details..." />
            </div>

            <button type="submit" className="w-full py-6 rounded-2xl font-black text-white shadow-xl transition-transform active:scale-95 text-xl" style={{ backgroundColor: PANGEA_YELLOW }}>
              Confirm Task Assignment
            </button>
          </form>
        </div>
      </div>

      {/* Task Management Table for Reports */}
      <div className="bg-white rounded-[3rem] shadow-xl border border-slate-100 p-12 space-y-8">
        <div>
          <h3 className="text-2xl font-black">Active Maintenance Log</h3>
          <p className="text-slate-400 font-medium">Generate PDF technical reports and clear completed tasks.</p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-slate-100">
                <th className="px-4 py-4 text-[10px] font-black uppercase text-slate-400 tracking-widest">Boat</th>
                <th className="px-4 py-4 text-[10px] font-black uppercase text-slate-400 tracking-widest">Task</th>
                <th className="px-4 py-4 text-[10px] font-black uppercase text-slate-400 tracking-widest">Status</th>
                <th className="px-4 py-4 text-[10px] font-black uppercase text-slate-400 tracking-widest">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {data.tasks.filter(t => t.status !== 'Completed').map(task => (
                <tr key={task.id} className="hover:bg-slate-50/50 transition-all">
                  <td className="px-4 py-4">
                    <span className="font-black text-slate-700">{data.boats.find(b => b.id === task.boatId)?.name}</span>
                  </td>
                  <td className="px-4 py-4">
                    <p className="text-sm font-bold text-slate-800">{task.taskType}</p>
                    <p className="text-[10px] text-slate-400">Due: {task.dueDate}</p>
                  </td>
                  <td className="px-4 py-4">
                    <span className={`px-3 py-1 rounded-lg text-[9px] font-black uppercase ${task.priority === Priority.CRITICAL ? 'bg-red-100 text-red-600' : 'bg-amber-100 text-amber-600'}`}>
                      {task.priority}
                    </span>
                  </td>
                  <td className="px-4 py-4">
                    <div className="flex items-center space-x-2">
                       <button 
                        onClick={() => onSendReport(task)}
                        className="flex items-center space-x-1 px-3 py-2 bg-blue-50 text-blue-600 rounded-xl hover:bg-blue-600 hover:text-white transition-all shadow-sm font-black text-[10px] uppercase"
                        title="Generate & Email PDF Report"
                       >
                         <span>📧 PDF Report</span>
                       </button>
                       <button 
                        onClick={() => onUpdateStatus(task.id, 'Completed')}
                        className="p-2 bg-green-50 text-green-600 rounded-xl hover:bg-green-600 hover:text-white transition-all shadow-sm"
                        title="Mark Completed"
                       >
                         ✓
                       </button>
                    </div>
                  </td>
                </tr>
              ))}
              {data.tasks.filter(t => t.status !== 'Completed').length === 0 && (
                <tr>
                  <td colSpan={4} className="px-4 py-10 text-center text-slate-400 italic font-medium">No active maintenance tasks.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default MaintenanceForm;
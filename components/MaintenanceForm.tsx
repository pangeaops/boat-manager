import React, { useState } from 'react';
import { AppData, Priority, Task, AuditLog } from '../types';
import { MAINTENANCE_TASKS, PANGEA_YELLOW } from '../constants';

interface MaintenanceFormProps {
  data: AppData;
  onAddTask: (task: Task) => void;
  onSendReport: (task: Task) => void;
  onUpdateStatus: (taskId: string, status: Task['status']) => void;
  logAction: (action: string, category: AuditLog['category'], details: string) => void;
}

const MaintenanceForm: React.FC<MaintenanceFormProps> = ({ data, onAddTask, onSendReport, onUpdateStatus, logAction }) => {
  const [formData, setFormData] = useState({
    boatId: '',
    taskType: MAINTENANCE_TASKS[0],
    priority: Priority.MEDIUM,
    status: 'Pending' as Task['status'],
    scheduledDate: new Date().toISOString().split('T')[0],
    dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    personnelIds: [] as string[],
    provisionsUsed: [] as string[],
    notes: ''
  });

  const activePersonnel = (data?.personnel || []).filter(p => p.isActive !== false);
  const technicalProvisions = (data?.inventory || []).filter(i => 
    ['Mechanical', 'Dock', 'Vessel Gear'].includes(i.category)
  );

  const isWithinLast7Days = (dateStr: string) => {
    if (!dateStr) return false;
    const taskDate = new Date(dateStr);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - taskDate.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays <= 7;
  };

  const weeklyTasks = (data?.tasks || []).filter(t => 
    t.status !== 'Completed' || (t.status === 'Completed' && isWithinLast7Days(t.dueDate))
  ).sort((a, b) => {
    if (a.status === 'Completed' && b.status !== 'Completed') return 1;
    if (a.status !== 'Completed' && b.status === 'Completed') return -1;
    return new Date(b.dueDate).getTime() - new Date(a.dueDate).getTime();
  });

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
      provisionsUsed: formData.provisionsUsed,
      status: formData.status,
      notes: formData.notes
    } as Task);
    setFormData({ ...formData, boatId: '', personnelIds: [], provisionsUsed: [], notes: '', status: 'Pending' });
  };

  const handleExportReport = (task: Task) => {
    onSendReport(task);
    const boatName = (data?.boats || []).find(b => b.id === task.boatId)?.boatname || 'Vessel';
    logAction('Maintenance Report Generated', 'Task', `Technical PDF report generated for ${task.taskType} on vessel ${boatName}.`);
    alert("Report generated and logged.");
  };

  const toggleStaff = (id: string) => {
    const current = formData.personnelIds;
    setFormData({...formData, personnelIds: current.includes(id) ? current.filter(x => x !== id) : [...current, id]});
  };

  const toggleProvision = (id: string) => {
    const current = formData.provisionsUsed;
    setFormData({...formData, provisionsUsed: current.includes(id) ? current.filter(x => x !== id) : [...current, id]});
  };

  return (
    <div className="space-y-12">
      <div className="flex justify-between items-center bg-white p-8 rounded-[2rem] border border-slate-100 shadow-sm">
        <div>
          <h2 className="text-2xl font-black">Maintenance Command</h2>
          <p className="text-slate-400 font-medium text-sm">Schedule repairs and technical tasks.</p>
        </div>
      </div>

      <div className="bg-white rounded-[3rem] shadow-2xl overflow-hidden border border-slate-100 max-w-4xl mx-auto">
        <div className="p-12 space-y-8">
          <form onSubmit={handleSubmit} className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
               <div className="space-y-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase text-slate-400">Target Vessel</label>
                    <select value={formData.boatId} onChange={e => setFormData({...formData, boatId: e.target.value})} className="w-full bg-slate-50 border border-slate-100 rounded-xl px-6 py-4 font-black outline-none">
                      <option value="">Choose Boat...</option>
                      {(data?.boats || []).map(b => <option key={b.id} value={b.id}>{b.boatname}</option>)}
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase text-slate-400">Task Type</label>
                    <select value={formData.taskType} onChange={e => setFormData({...formData, taskType: e.target.value})} className="w-full bg-slate-50 border border-slate-100 rounded-xl px-6 py-4 font-black outline-none">
                      {MAINTENANCE_TASKS.map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-[10px] font-black uppercase text-slate-400">Priority</label>
                      <select value={formData.priority} onChange={e => setFormData({...formData, priority: e.target.value as Priority})} className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-4 font-black outline-none">
                        {Object.values(Priority).map(p => <option key={p} value={p}>{p}</option>)}
                      </select>
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-black uppercase text-[#ffb519]">Status</label>
                      <select value={formData.status} onChange={e => setFormData({...formData, status: e.target.value as any})} className="w-full bg-amber-50 border border-amber-100 rounded-xl px-4 py-4 font-black outline-none text-amber-700">
                        <option value="Pending">Pending</option>
                        <option value="Ongoing">Ongoing</option>
                        <option value="Completed">Completed</option>
                      </select>
                    </div>
                  </div>
               </div>

               <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-[10px] font-black uppercase text-slate-400">Start Date</label>
                      <input type="date" value={formData.scheduledDate} onChange={e => setFormData({...formData, scheduledDate: e.target.value})} className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-4 font-black text-sm" />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-black uppercase text-slate-400">Due Date</label>
                      <input type="date" value={formData.dueDate} onChange={e => setFormData({...formData, dueDate: e.target.value})} className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-4 font-black text-sm" />
                    </div>
                  </div>
                  
                  <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase text-slate-400">Assign Staff / Mechanics</label>
                    <div className="bg-slate-50 border border-slate-100 rounded-xl p-4 max-h-40 overflow-y-auto custom-scrollbar space-y-2">
                       {activePersonnel.map(p => (
                         <label key={p.id} className="flex items-center space-x-3 cursor-pointer group">
                           <input 
                             type="checkbox" 
                             checked={formData.personnelIds.includes(p.id)} 
                             onChange={() => toggleStaff(p.id)}
                             className="w-4 h-4 rounded accent-[#ffb519]"
                           />
                           <span className={`text-[11px] font-bold ${formData.personnelIds.includes(p.id) ? 'text-amber-600 font-black' : 'text-slate-400'}`}>{p.name} ({p.role})</span>
                         </label>
                       ))}
                    </div>
                  </div>
               </div>
            </div>

            <div className="space-y-2 pt-2">
               <label className="text-[10px] font-black uppercase text-slate-400">Technical Provisions</label>
               <div className="bg-slate-50 border border-slate-100 rounded-2xl p-6 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 max-h-52 overflow-y-auto custom-scrollbar">
                  {technicalProvisions.map(item => (
                    <label key={item.id} className="flex items-center space-x-3 p-3 bg-white rounded-xl cursor-pointer hover:bg-slate-100 transition-all border border-slate-100">
                      <input 
                        type="checkbox" 
                        checked={formData.provisionsUsed.includes(item.id)} 
                        onChange={() => toggleProvision(item.id)}
                        className="w-4 h-4 rounded accent-slate-800"
                      />
                      <div className="flex flex-col">
                        <span className="text-[10px] font-black text-slate-800 truncate">{item.name}</span>
                        <span className="text-[8px] font-bold text-slate-400 uppercase">{item.category}</span>
                      </div>
                    </label>
                  ))}
               </div>
            </div>

            <div className="space-y-1">
               <label className="text-[10px] font-black uppercase text-slate-400">Technical Notes</label>
               <textarea value={formData.notes} onChange={e => setFormData({...formData, notes: e.target.value})} className="w-full h-32 bg-slate-50 border border-slate-100 rounded-2xl p-6 font-bold outline-none resize-none" placeholder="Provide detailed instructions..."></textarea>
            </div>

            <button type="submit" className="w-full py-6 rounded-3xl font-black text-2xl text-white shadow-xl transition-all" style={{ backgroundColor: PANGEA_YELLOW }}>Confirm Task Assignment</button>
          </form>
        </div>
      </div>

      <div className="bg-white rounded-[3rem] shadow-xl border border-slate-100 p-12 space-y-8">
        <h3 className="text-2xl font-black text-slate-800">Maintenance Log (Rolling Weekly)</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-slate-100">
                <th className="px-4 py-4 text-[10px] font-black uppercase text-slate-400 tracking-widest">Vessel</th>
                <th className="px-4 py-4 text-[10px] font-black uppercase text-slate-400 tracking-widest">Task</th>
                <th className="px-4 py-4 text-[10px] font-black uppercase text-slate-400 tracking-widest">Due Date</th>
                <th className="px-4 py-4 text-[10px] font-black uppercase text-slate-400 tracking-widest">Assigned</th>
                <th className="px-4 py-4 text-[10px] font-black uppercase text-slate-400 tracking-widest">Status</th>
                <th className="px-4 py-4 text-[10px] font-black uppercase text-slate-400 tracking-widest">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {weeklyTasks.map(task => (
                <tr key={task.id} className={`hover:bg-slate-50 transition-colors ${task.status === 'Completed' ? 'opacity-60' : ''}`}>
                  <td className="px-4 py-4"><p className="font-black text-slate-900">{(data?.boats || []).find(b => b.id === task.boatId)?.boatname}</p></td>
                  <td className="px-4 py-4">
                    <div className="flex flex-col">
                       <span className="font-bold text-slate-800">{task.taskType}</span>
                       <span className={`text-[8px] font-black uppercase px-2 py-0.5 rounded-full inline-block w-fit mt-1 ${task.priority === Priority.CRITICAL ? 'bg-red-100 text-red-600' : 'bg-slate-100 text-slate-500'}`}>{task.priority}</span>
                    </div>
                  </td>
                  <td className="px-4 py-4 font-black text-xs text-red-500">{task.dueDate}</td>
                  <td className="px-4 py-4">
                    <div className="flex -space-x-2">
                      {(task.personnelInCharge || []).map(pid => {
                        const p = (data?.personnel || []).find(x => x.id === pid);
                        return <div key={pid} className="w-8 h-8 rounded-full bg-slate-800 border-2 border-white flex items-center justify-center text-[8px] text-white font-black overflow-hidden">{p?.profilePhoto ? <img src={p.profilePhoto} className="w-full h-full object-cover" alt="" /> : '👤'}</div>;
                      })}
                    </div>
                  </td>
                  <td className="px-4 py-4">
                    <select value={task.status} onChange={(e) => onUpdateStatus(task.id, e.target.value as any)} className={`text-[9px] font-black uppercase px-3 py-1.5 rounded-xl outline-none ${task.status === 'Ongoing' ? 'bg-blue-100 text-blue-700' : 'bg-slate-100'}`}>
                      <option value="Pending">Pending</option>
                      <option value="Ongoing">Ongoing</option>
                      <option value="Completed">Completed</option>
                    </select>
                  </td>
                  <td className="px-4 py-4">
                    <div className="flex space-x-2">
                      <button onClick={() => handleExportReport(task)} className="px-3 py-2 bg-slate-100 text-slate-600 rounded-xl font-black text-[10px] uppercase">Report</button>
                      {task.status !== 'Completed' && <button onClick={() => onUpdateStatus(task.id, 'Completed')} className="w-10 h-10 bg-green-500 text-white rounded-xl flex items-center justify-center font-black hover:bg-black transition-all">✓</button>}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default MaintenanceForm;
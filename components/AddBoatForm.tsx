import React, { useState, useEffect } from 'react';
import { Boat } from '../types.ts';
import { PANGEA_YELLOW, MANDATORY_ITEMS } from '../constants.ts';

interface AddBoatFormProps {
  onAddBoat: (boat: Boat) => void;
  initialData?: Boat;
  onCancel?: () => void;
}

const AddBoatForm: React.FC<AddBoatFormProps> = ({ onAddBoat, initialData, onCancel }) => {
  const [formData, setFormData] = useState<Partial<Boat>>(initialData || {
    name: '',
    model: '',
    year: new Date().getFullYear(),
    length: '',
    beam: '',
    draft: '',
    engineBrand: '',
    engineModel: '',
    numberOfEngines: 1,
    engineHP: 0,
    engineSerialNumbers: [''],
    serialNumber: '',
    capacity: 12,
    licenseNumber: '',
    licenseExpDate: '',
    status: 'Available' as Boat['status']
  });

  // Sync serial numbers array with number of engines
  useEffect(() => {
    const current = formData.engineSerialNumbers || [];
    const target = formData.numberOfEngines || 1;
    if (current.length !== target) {
      const updated = [...current];
      if (current.length < target) {
        while(updated.length < target) updated.push('');
      } else {
        updated.length = target;
      }
      setFormData(prev => ({ ...prev, engineSerialNumbers: updated }));
    }
  }, [formData.numberOfEngines]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const finalId = initialData?.id || formData.id || Math.random().toString(36).substr(2, 9);
    onAddBoat({
      ...formData as Boat,
      id: finalId,
      mandatoryChecklist: initialData?.mandatoryChecklist || MANDATORY_ITEMS
    });
  };

  const handleSerialChange = (index: number, val: string) => {
    const updated = [...(formData.engineSerialNumbers || [])];
    updated[index] = val;
    setFormData({ ...formData, engineSerialNumbers: updated });
  };

  return (
    <div className="bg-white rounded-[2.5rem] shadow-2xl p-12 border border-slate-100 max-w-4xl mx-auto">
       <div className="flex justify-between items-center mb-10">
         <h2 className="text-3xl font-black">Register Vessel Assets</h2>
         {onCancel && (
           <button onClick={onCancel} className="text-slate-400 hover:text-red-600 font-black text-xs uppercase">Cancel</button>
         )}
       </div>
       
       <form onSubmit={handleSubmit} className="space-y-10">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase text-slate-400">Boat Name</label>
              <input type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full bg-slate-50 border-none rounded-2xl px-6 py-4 font-bold shadow-inner" placeholder="e.g. Nana del Mar" required />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase text-slate-400">Hull Identification (HIN)</label>
              <input type="text" value={formData.serialNumber} onChange={e => setFormData({...formData, serialNumber: e.target.value})} className="w-full bg-slate-50 border-none rounded-2xl px-6 py-4 font-bold shadow-inner" placeholder="PANGEA-HULL-XXX" required />
            </div>
          </div>

          <div className="bg-slate-50 p-10 rounded-[2.5rem] space-y-8">
            <h4 className="text-xs font-black uppercase text-amber-600 tracking-widest border-b border-amber-100 pb-2">Engines Configuration*</h4>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
               <div className="space-y-1">
                 <label className="text-[9px] font-black text-slate-400 uppercase">Quantity</label>
                 <input type="number" min="1" max="4" value={formData.numberOfEngines} onChange={e => setFormData({...formData, numberOfEngines: parseInt(e.target.value)})} className="w-full bg-white rounded-xl px-4 py-3 font-bold shadow-sm" />
               </div>
               <div className="space-y-1">
                 <label className="text-[9px] font-black text-slate-400 uppercase">HP per unit</label>
                 <input type="number" value={formData.engineHP} onChange={e => setFormData({...formData, engineHP: parseInt(e.target.value)})} className="w-full bg-white rounded-xl px-4 py-3 font-bold shadow-sm" />
               </div>
               <div className="space-y-1">
                 <label className="text-[9px] font-black text-slate-400 uppercase">Brand</label>
                 <input type="text" value={formData.engineBrand} onChange={e => setFormData({...formData, engineBrand: e.target.value})} className="w-full bg-white rounded-xl px-4 py-3 font-bold shadow-sm" placeholder="Suzuki" />
               </div>
               <div className="space-y-1">
                 <label className="text-[9px] font-black text-slate-400 uppercase">Model</label>
                 <input type="text" value={formData.engineModel} onChange={e => setFormData({...formData, engineModel: e.target.value})} className="w-full bg-white rounded-xl px-4 py-3 font-bold shadow-sm" placeholder="DF300" />
               </div>
            </div>

            <div className="space-y-4">
               <label className="text-[10px] font-black text-slate-400 uppercase">Engine Bin / Serial Numbers</label>
               <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                 {formData.engineSerialNumbers?.map((sn, i) => (
                   <div key={i} className="flex items-center space-x-3 bg-white p-3 rounded-2xl shadow-sm border border-slate-100">
                     <span className="w-8 h-8 rounded-full bg-amber-50 text-amber-600 flex items-center justify-center font-black text-xs">#{i+1}</span>
                     <input 
                       type="text" 
                       value={sn} 
                       onChange={(e) => handleSerialChange(i, e.target.value)}
                       className="flex-1 bg-transparent border-none font-bold text-sm outline-none" 
                       placeholder={`Motor Serial ${i+1}`}
                     />
                   </div>
                 ))}
               </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
             <div className="space-y-2"><label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">License No.</label><input type="text" value={formData.licenseNumber} onChange={e => setFormData({...formData, licenseNumber: e.target.value})} className="w-full bg-slate-50 rounded-2xl px-6 py-4 font-bold shadow-inner" required /></div>
             <div className="space-y-2"><label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">License Expiry</label><input type="date" value={formData.licenseExpDate} onChange={e => setFormData({...formData, licenseExpDate: e.target.value})} className="w-full bg-slate-50 rounded-2xl px-6 py-4 font-bold shadow-inner" required /></div>
             <div className="space-y-2"><label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Max PAX</label><input type="number" value={formData.capacity} onChange={e => setFormData({...formData, capacity: parseInt(e.target.value)})} className="w-full bg-slate-50 rounded-2xl px-6 py-4 font-bold shadow-inner" required /></div>
          </div>

          <button type="submit" className="w-full py-6 rounded-3xl font-black text-2xl text-white shadow-2xl transition-all" style={{ backgroundColor: PANGEA_YELLOW }}>
            {initialData ? 'Update Vessel Record' : 'Register Full Asset'}
          </button>
       </form>
    </div>
  );
};

export default AddBoatForm;
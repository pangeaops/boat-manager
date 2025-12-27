
import React, { useState } from 'react';
import { Personnel, PersonnelRole, InactiveReason } from '../types';
import { PANGEA_YELLOW, PANGEA_DARK } from '../constants';

interface AddPersonnelFormProps {
  onAddPersonnel: (person: Personnel) => void;
  initialData?: Personnel;
  onCancel?: () => void;
}

const SectionTitle = ({ children, icon }: React.PropsWithChildren<{ icon: string }>) => (
  <h3 className="text-xs font-black uppercase tracking-[0.2em] text-[#ffb519] flex items-center space-x-2 border-b border-slate-100 pb-4 mb-6">
    <span>{icon}</span>
    <span>{children}</span>
  </h3>
);

const AddPersonnelForm: React.FC<AddPersonnelFormProps> = ({ onAddPersonnel, initialData, onCancel }) => {
  const [formData, setFormData] = useState<Personnel>(initialData || {
    id: '',
    name: '',
    role: PersonnelRole.CAPTAIN_MOTOMARLIN,
    phone: '',
    email: '',
    passportNumber: '',
    allergies: '',
    licenseNumber: '',
    licenseExpDate: '',
    bloodType: '',
    idNumber: '',
    isActive: true,
    bankName: '',
    bankAccountNum: '',
    bankAccountType: 'Savings',
    shirtSize: '',
    pantsSize: '',
    shoeSize: '',
    dependent1Name: '',
    dependent1Relation: '',
    dependent2Name: '',
    dependent2Relation: '',
    startDate: new Date().toISOString().split('T')[0],
    salary: 0,
    docPoliceRecords: false,
    docZeroAlcohol: false,
    docConfidentialAgreement: false,
    docImageRights: false,
    docContract: false,
    docAddendum: false,
    emergencyContactName: '',
    emergencyContactPhone: '',
    experience: ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onAddPersonnel({
      ...formData,
      id: initialData?.id || Math.random().toString(36).substr(2, 9),
    });
  };

  const updateField = (field: keyof Personnel, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleFileUpload = (field: keyof Personnel, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        updateField(field, reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="bg-white rounded-[3rem] shadow-2xl overflow-hidden border border-slate-100 h-fit max-w-4xl mx-auto">
      <div className="bg-slate-800 p-10 text-white flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-black">{initialData ? 'Modify Profile' : 'Advanced Personnel Onboarding'}</h2>
          <p className="text-slate-400 text-[10px] mt-1 uppercase tracking-widest font-bold">Secure HR & Payroll Record</p>
        </div>
        <div className="flex space-x-3">
          {initialData && (
             <div className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase flex items-center ${formData.isActive ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                {formData.isActive ? 'Active Staff' : 'Inactive Staff'}
             </div>
          )}
          {onCancel && (
            <button onClick={onCancel} className="bg-white/10 hover:bg-white/20 text-white px-6 py-2 rounded-xl text-xs font-black uppercase">Cancel</button>
          )}
        </div>
      </div>

      <form onSubmit={handleSubmit} className="p-10 space-y-12">
        {/* Profile & Identity */}
        <section>
          <SectionTitle icon="👤">Identity & Photo</SectionTitle>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="space-y-4">
              <label className="text-[10px] font-black uppercase text-slate-400 block ml-1">Profile Photo</label>
              <div className="relative group w-40 h-40">
                <div className="w-full h-full rounded-[2.5rem] bg-slate-100 flex items-center justify-center overflow-hidden border-2 border-dashed border-slate-200 group-hover:border-[#ffb519] transition-all">
                  {formData.profilePhoto ? (
                    <img src={formData.profilePhoto} className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-3xl">📷</span>
                  )}
                </div>
                <input 
                  type="file" 
                  accept="image/*" 
                  onChange={(e) => handleFileUpload('profilePhoto', e)} 
                  className="absolute inset-0 opacity-0 cursor-pointer" 
                />
              </div>
            </div>
            <div className="md:col-span-2 space-y-6">
              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase text-slate-400 ml-1">Full Legal Name</label>
                <input type="text" value={formData.name} onChange={e => updateField('name', e.target.value)} className="w-full bg-slate-50 border-none rounded-2xl px-6 py-4 font-bold shadow-inner" placeholder="Name" required />
              </div>
              <div className="grid grid-cols-2 gap-4">
                 <div className="space-y-1">
                   <label className="text-[10px] font-black uppercase text-slate-400 ml-1">ID Number</label>
                   <input type="text" value={formData.idNumber} onChange={e => updateField('idNumber', e.target.value)} className="w-full bg-slate-50 border-none rounded-2xl px-4 py-4 font-bold shadow-inner" placeholder="8-XXX-XXX" />
                 </div>
                 <div className="space-y-1">
                   <label className="text-[10px] font-black uppercase text-slate-400 ml-1">Passport #</label>
                   <input type="text" value={formData.passportNumber} onChange={e => updateField('passportNumber', e.target.value)} className="w-full bg-slate-50 border-none rounded-2xl px-4 py-4 font-bold shadow-inner" />
                 </div>
              </div>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
            <div className="space-y-1">
              <label className="text-[10px] font-black uppercase text-slate-400 ml-1">Assigned Role</label>
              <select value={formData.role} onChange={e => updateField('role', e.target.value as PersonnelRole)} className="w-full bg-slate-50 border-none rounded-2xl px-6 py-4 font-bold shadow-inner">
                {Object.values(PersonnelRole).map(role => <option key={role} value={role}>{role}</option>)}
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-black uppercase text-slate-400 ml-1">Email</label>
              <input type="email" value={formData.email} onChange={e => updateField('email', e.target.value)} className="w-full bg-slate-50 border-none rounded-2xl px-6 py-4 font-bold shadow-inner" />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-black uppercase text-slate-400 ml-1">Allergies/Medical</label>
              <input type="text" value={formData.allergies} onChange={e => updateField('allergies', e.target.value)} className="w-full bg-red-50/50 border-none rounded-2xl px-6 py-4 font-bold shadow-inner text-red-700" placeholder="Bees, Peanuts, None" />
            </div>
          </div>
        </section>

        {/* Status Control for Admins */}
        <section className="bg-slate-50 p-8 rounded-[2.5rem] border border-slate-100">
          <SectionTitle icon="⚡">Employment Status</SectionTitle>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
               <label className="text-[10px] font-black uppercase text-slate-400 ml-1">Account Active</label>
               <div className="flex items-center space-x-4">
                  <button 
                    type="button"
                    onClick={() => updateField('isActive', true)}
                    className={`flex-1 py-3 rounded-xl text-xs font-black uppercase transition-all ${formData.isActive ? 'bg-green-500 text-white shadow-lg' : 'bg-white text-slate-400 border border-slate-200'}`}
                  >
                    Active Staff
                  </button>
                  <button 
                    type="button"
                    onClick={() => updateField('isActive', false)}
                    className={`flex-1 py-3 rounded-xl text-xs font-black uppercase transition-all ${!formData.isActive ? 'bg-red-500 text-white shadow-lg' : 'bg-white text-slate-400 border border-slate-200'}`}
                  >
                    Unactivate
                  </button>
               </div>
            </div>
            {!formData.isActive && (
               <div className="space-y-2 animate-in slide-in-from-top-2 duration-300">
                  <label className="text-[10px] font-black uppercase text-red-400 ml-1">Reason for Inactivity</label>
                  <select 
                    value={formData.inactiveReason || 'Other'} 
                    onChange={e => updateField('inactiveReason', e.target.value as InactiveReason)}
                    className="w-full bg-white border border-red-100 rounded-xl px-4 py-3 font-bold text-sm"
                  >
                    <option value="Firing">Firing</option>
                    <option value="Resignation">Resignation</option>
                    <option value="No Show">No Show</option>
                    <option value="Other">Other</option>
                  </select>
               </div>
            )}
          </div>
        </section>

        {/* License & Document Photos */}
        <section className="bg-slate-50 p-8 rounded-[2.5rem] border border-slate-100">
           <SectionTitle icon="🪪">License & Document Attachments</SectionTitle>
           <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-4">
                <label className="text-[10px] font-black uppercase text-slate-400 block">License Card Photo</label>
                <div className="h-40 bg-white rounded-2xl border-2 border-dashed border-slate-200 flex items-center justify-center relative group">
                  {formData.licensePhoto ? (
                    <img src={formData.licensePhoto} className="w-full h-full object-contain rounded-2xl" />
                  ) : (
                    <div className="text-center">
                      <span className="text-2xl">📸</span>
                      <p className="text-[9px] font-black text-slate-400 uppercase mt-1">Upload License</p>
                    </div>
                  )}
                  <input type="file" accept="image/*" onChange={(e) => handleFileUpload('licensePhoto', e)} className="absolute inset-0 opacity-0 cursor-pointer" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase text-slate-400 ml-1">License #</label>
                    <input type="text" value={formData.licenseNumber} onChange={e => updateField('licenseNumber', e.target.value)} className="w-full bg-white border-none rounded-xl px-4 py-3 font-bold" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase text-slate-400 ml-1">Expiry Date</label>
                    <input type="date" value={formData.licenseExpDate} onChange={e => updateField('licenseExpDate', e.target.value)} className="w-full bg-white border-none rounded-xl px-4 py-3 font-bold" />
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <label className="text-[10px] font-black uppercase text-slate-400 block">HR Document Uploads</label>
                <div className="grid grid-cols-1 gap-3">
                  {[
                    { field: 'docIdPhoto', label: 'National ID Picture' },
                    { field: 'cvDoc', label: 'Curriculum Vitae (CV)' },
                    { field: 'policeRecordDoc', label: 'Police Record' },
                    { field: 'contractDoc', label: 'Signed Contract' },
                    { field: 'docConfidentiality', label: 'Confidentiality Agreement' },
                    { field: 'docImageRightsFile', label: 'Image Usage Rights' }
                  ].map(doc => (
                    <div key={doc.field} className="relative bg-white p-4 rounded-xl border border-slate-100 flex items-center justify-between group overflow-hidden">
                       <span className="text-[10px] font-black uppercase text-slate-500">{(formData as any)[doc.field] ? '✅ ' : '📎 '} {doc.label}</span>
                       <input type="file" onChange={(e) => handleFileUpload(doc.field as keyof Personnel, e)} className="absolute inset-0 opacity-0 cursor-pointer" />
                       <span className="text-[9px] font-bold text-[#ffb519]">{(formData as any)[doc.field] ? 'Uploaded' : 'Browse'}</span>
                    </div>
                  ))}
                </div>
              </div>
           </div>
        </section>

        {/* Banking Section */}
        <section className="bg-slate-50/50 p-8 rounded-[2.5rem] border border-slate-100">
          <SectionTitle icon="💰">Banking & Payroll</SectionTitle>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="md:col-span-2 space-y-1">
               <label className="text-[10px] font-black uppercase text-slate-400">Account Number</label>
               <input type="text" value={formData.bankAccountNum} onChange={e => updateField('bankAccountNum', e.target.value)} className="w-full bg-white border-none rounded-xl px-4 py-3 font-bold" />
            </div>
            <div className="space-y-1">
               <label className="text-[10px] font-black uppercase text-slate-400">Account Type</label>
               <select value={formData.bankAccountType} onChange={e => updateField('bankAccountType', e.target.value as any)} className="w-full bg-white border-none rounded-xl px-4 py-3 font-bold">
                 <option value="Savings">Savings</option>
                 <option value="Checking">Checking</option>
               </select>
            </div>
            <div className="space-y-1">
               <label className="text-[10px] font-black uppercase text-slate-400">Bank Name</label>
               <input type="text" value={formData.bankName} onChange={e => updateField('bankName', e.target.value)} className="w-full bg-white border-none rounded-xl px-4 py-3 font-bold" placeholder="Banco General" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4 mt-6">
            <div className="space-y-1">
               <label className="text-[10px] font-black uppercase text-slate-400">Start Day</label>
               <input type="date" value={formData.startDate} onChange={e => updateField('startDate', e.target.value)} className="w-full bg-white border-none rounded-xl px-4 py-3 font-bold" />
            </div>
            <div className="space-y-1">
               <label className="text-[10px] font-black uppercase text-slate-400">Monthly Salary ($)</label>
               <input type="number" value={formData.salary} onChange={e => updateField('salary', parseFloat(e.target.value) || 0)} className="w-full bg-white border-none rounded-xl px-4 py-3 font-bold" />
            </div>
          </div>
        </section>

        {/* Measurements & Dependents */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
          <section className="space-y-6">
            <SectionTitle icon="👕">Measurements</SectionTitle>
            <div className="grid grid-cols-3 gap-4">
               <div><label className="text-[9px] font-black text-slate-400 uppercase">Shirt</label><input type="text" value={formData.shirtSize} onChange={e => updateField('shirtSize', e.target.value)} className="w-full bg-slate-50 rounded-xl px-3 py-2 font-bold" /></div>
               <div><label className="text-[9px] font-black text-slate-400 uppercase">Pants</label><input type="text" value={formData.pantsSize} onChange={e => updateField('pantsSize', e.target.value)} className="w-full bg-slate-50 rounded-xl px-3 py-2 font-bold" /></div>
               <div><label className="text-[9px] font-black text-slate-400 uppercase">Shoes</label><input type="text" value={formData.shoeSize} onChange={e => updateField('shoeSize', e.target.value)} className="w-full bg-slate-50 rounded-xl px-3 py-2 font-bold" /></div>
            </div>
          </section>
          <section className="space-y-6">
            <SectionTitle icon="👨‍👩‍👧‍👦">Dependents</SectionTitle>
            <div className="space-y-4">
              <input type="text" placeholder="Dependent 1: Name & Relation" value={formData.dependent1Name} onChange={e => updateField('dependent1Name', e.target.value)} className="w-full bg-slate-50 rounded-xl px-4 py-3 text-xs font-bold" />
              <input type="text" placeholder="Dependent 2: Name & Relation" value={formData.dependent2Name} onChange={e => updateField('dependent2Name', e.target.value)} className="w-full bg-slate-50 rounded-xl px-4 py-3 text-xs font-bold" />
            </div>
          </section>
        </div>

        {/* Document Checklist */}
        <section className="bg-amber-50/30 p-8 rounded-[2.5rem] border border-amber-100/50">
          <SectionTitle icon="📋">Compliance Status</SectionTitle>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[
              { id: 'docPoliceRecords', label: 'Police Records Received' },
              { id: 'docZeroAlcohol', label: 'Zero Alcohol Tolerance Signed' },
              { id: 'docConfidentialAgreement', label: 'Confidentiality Agreement' },
              { id: 'docImageRights', label: 'Image Usage Rights' },
              { id: 'docContract', label: 'Signed Employment Contract' },
              { id: 'docAddendum', label: 'Legal Addendum' }
            ].map(doc => (
              <label key={doc.id} className="flex items-center space-x-4 p-4 bg-white rounded-2xl border border-slate-100 shadow-sm cursor-pointer hover:bg-slate-50 transition-all">
                <input 
                  type="checkbox" 
                  checked={(formData as any)[doc.id]} 
                  onChange={e => updateField(doc.id as keyof Personnel, e.target.checked)}
                  className="w-6 h-6 rounded-lg accent-[#ffb519]"
                />
                <span className="text-[10px] font-black uppercase text-slate-600">{doc.label}</span>
              </label>
            ))}
          </div>
        </section>

        <button type="submit" className="w-full py-6 rounded-[2rem] font-black text-white text-2xl shadow-2xl transition-all" style={{ backgroundColor: PANGEA_YELLOW }}>
          {initialData ? 'Update Profile' : 'Confirm Full Registration'}
        </button>
      </form>
    </div>
  );
};

export default AddPersonnelForm;

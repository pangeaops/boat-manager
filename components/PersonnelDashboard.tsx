
import React, { useState } from 'react';
import { AppData, Personnel, PersonnelRole, UserRole } from '../types';
import AddPersonnelForm from './AddPersonnelForm';
import { PANGEA_YELLOW, PANGEA_DARK } from '../constants';

interface PersonnelDashboardProps {
  data: AppData;
  userRole: UserRole;
  onUpdatePersonnel: (person: Personnel) => void;
}

const PersonnelDashboard: React.FC<PersonnelDashboardProps> = ({ data, userRole, onUpdatePersonnel }) => {
  const [editingPerson, setEditingPerson] = useState<Personnel | null>(null);
  const [viewingProfile, setViewingProfile] = useState<Personnel | null>(null);
  const [showPastEmployees, setShowPastEmployees] = useState(false);

  const activeStaff = data.personnel.filter(p => p.isActive !== false);
  const inactiveStaff = data.personnel.filter(p => p.isActive === false);

  const getGroupedPersonnel = (list: Personnel[]) => {
    const groups: Record<string, Personnel[]> = {};
    list.forEach(p => {
      if (!groups[p.role]) groups[p.role] = [];
      groups[p.role].push(p);
    });
    return groups;
  };

  const activeGrouped = getGroupedPersonnel(activeStaff);

  const ProfileDetailRow = ({ label, value }: { label: string, value?: string | number }) => (
    <div className="flex justify-between items-center py-3 border-b border-slate-50 last:border-0">
      <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider">{label}</span>
      <span className="text-sm font-bold text-slate-800">{value || '—'}</span>
    </div>
  );

  const StaffCard: React.FC<{ person: Personnel }> = ({ person }) => (
    <div 
      className="bg-white rounded-[3rem] p-8 border border-slate-100 shadow-sm relative overflow-hidden group hover:shadow-2xl transition-all duration-500 cursor-pointer"
      onClick={() => userRole === 'Admin' && setViewingProfile(person)}
    >
      <div className="absolute top-6 right-6 flex space-x-2 z-20">
        {userRole === 'Admin' && (
          <button 
            onClick={(e) => { e.stopPropagation(); setEditingPerson(person); }}
            className="w-12 h-12 bg-white/80 backdrop-blur shadow-sm rounded-xl flex items-center justify-center text-[8px] font-black hover:bg-[#ffb519] hover:text-white transition-all border border-slate-100"
          >
            EDIT
          </button>
        )}
      </div>
      
      <div className="relative z-10 space-y-6">
        <div className="flex items-center space-x-4">
          <div className="w-20 h-20 bg-slate-50 rounded-[2rem] flex items-center justify-center text-2xl shadow-inner text-white overflow-hidden border-2 border-slate-100">
            {person.profilePhoto ? (
              <img src={person.profilePhoto} className="w-full h-full object-cover" />
            ) : (
              <span className="text-3xl grayscale opacity-30">
                {person.role.includes('Capitán') ? '⚓' : person.role === PersonnelRole.CEO ? '🏢' : '👤'}
              </span>
            )}
          </div>
          <div className="flex-1 overflow-hidden">
            <h4 className="text-lg font-black text-slate-900 leading-tight truncate">{person.name}</h4>
            <p className="text-[10px] font-bold text-[#ffb519] uppercase tracking-widest truncate">{person.role}</p>
          </div>
        </div>
        
        <div className="space-y-4 border-y border-slate-50 py-6">
          <div className="grid grid-cols-2 gap-4">
             <div className="space-y-1">
               <p className="text-[9px] font-black text-slate-400 uppercase tracking-tighter">National ID</p>
               <p className="text-xs font-black text-slate-800">{person.idNumber || '—'}</p>
             </div>
             <div className="text-right space-y-1">
               <p className="text-[9px] font-black text-slate-400 uppercase tracking-tighter">Phone Number</p>
               <p className="text-xs font-black text-slate-800">{person.phone}</p>
             </div>
          </div>

          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-2">
             <p className="text-[9px] font-black text-[#ffb519] uppercase tracking-widest">SOS / Emergency Contact</p>
             <div className="flex justify-between items-center">
                <span className="text-[11px] font-black text-slate-700">{person.emergencyContactName || 'Base Hub'}</span>
                <span className="text-[11px] font-black text-slate-900">{person.emergencyContactPhone || '+507 760 8024'}</span>
             </div>
          </div>

          {!person.isActive && (
             <div className="p-4 bg-red-100/50 rounded-2xl border border-red-200">
                <p className="text-[9px] font-black text-red-600 uppercase tracking-widest">Past Employee</p>
                <p className="text-xs font-black text-red-800">Reason: {person.inactiveReason || 'Not Specified'}</p>
             </div>
          )}

          <div className="p-4 bg-red-50/50 rounded-2xl border border-red-100">
             <p className="text-[9px] font-black text-red-600 uppercase tracking-tighter">Medical Alerts / Allergies</p>
             <p className="text-xs font-bold text-red-800 truncate">{person.allergies || 'NONE DECLARED'}</p>
          </div>
        </div>

        {userRole === 'Admin' && (
          <div className="text-center pt-2">
            <span className="text-[10px] font-black uppercase text-[#ffb519] tracking-[0.2em] animate-pulse">
              View Admin Dossier →
            </span>
          </div>
        )}
      </div>
    </div>
  );

  if (editingPerson) {
    return (
      <div className="animate-in fade-in duration-300">
        <AddPersonnelForm 
          initialData={editingPerson} 
          onAddPersonnel={(p) => {
            onUpdatePersonnel(p);
            setEditingPerson(null);
          }}
          onCancel={() => setEditingPerson(null)}
        />
      </div>
    );
  }

  return (
    <div className="space-y-12 pb-20 relative">
      <header className="flex justify-between items-center">
        <div>
          <h2 className="text-4xl font-black tracking-tight" style={{ color: PANGEA_DARK }}>Staff Hub</h2>
          <p className="text-slate-400 font-medium">Official credential and emergency database.</p>
        </div>
        <div className="bg-white px-8 py-4 rounded-[2rem] shadow-sm border border-slate-100 flex items-center space-x-4">
          <div className="text-right">
            <span className="text-slate-400 text-[10px] font-black uppercase tracking-widest block">Total Crew</span>
            <span className="text-2xl font-black" style={{ color: PANGEA_YELLOW }}>{activeStaff.length}</span>
          </div>
          <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-white text-xl" style={{ backgroundColor: PANGEA_YELLOW }}>👤</div>
        </div>
      </header>

      {Object.entries(activeGrouped).map(([role, staff]) => ( staff.length > 0 && (
        <section key={role} className="space-y-6">
          <h3 className="text-xs font-black text-slate-400 uppercase tracking-[0.3em] ml-2 flex items-center space-x-3">
             <span className="w-2 h-2 rounded-full" style={{ backgroundColor: PANGEA_YELLOW }}></span>
             <span>{role}</span>
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {staff.map(person => <StaffCard key={person.id} person={person} />)}
          </div>
        </section>
      )))}

      {/* Past Employees Section */}
      {inactiveStaff.length > 0 && (
        <section className="pt-10 border-t border-slate-100">
          <button 
            onClick={() => setShowPastEmployees(!showPastEmployees)}
            className="w-full flex items-center justify-between bg-slate-50 p-6 rounded-[2rem] border border-slate-200 hover:bg-slate-100 transition-all"
          >
             <div className="flex items-center space-x-4">
                <span className="text-2xl">📁</span>
                <div className="text-left">
                  <h3 className="text-lg font-black text-slate-600">Past Employees Archive</h3>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{inactiveStaff.length} Records Stored</p>
                </div>
             </div>
             <span className={`text-xl transition-transform ${showPastEmployees ? 'rotate-180' : ''}`}>▼</span>
          </button>

          {showPastEmployees && (
            <div className="mt-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 animate-in slide-in-from-top-4 duration-500">
               {inactiveStaff.map(person => <StaffCard key={person.id} person={person} />)}
            </div>
          )}
        </section>
      )}

      {/* Full Profile Modal (Admin Only) */}
      {viewingProfile && userRole === 'Admin' && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-[#434343]/80 backdrop-blur-md animate-in fade-in duration-300">
          <div className="w-full max-w-4xl bg-white rounded-[3rem] shadow-2xl overflow-hidden flex flex-col h-[90vh]">
            {/* Modal Header */}
            <div className="bg-slate-800 p-8 flex justify-between items-center text-white">
              <div className="flex items-center space-x-6">
                 <div className="w-24 h-24 rounded-[1.5rem] bg-white/10 flex items-center justify-center overflow-hidden border border-white/20">
                    {viewingProfile.profilePhoto ? (
                      <img src={viewingProfile.profilePhoto} className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-4xl grayscale opacity-30">👤</span>
                    )}
                 </div>
                 <div>
                    <h2 className="text-3xl font-black">{viewingProfile.name}</h2>
                    <p className="text-[#ffb519] font-black text-[10px] uppercase tracking-[0.3em]">{viewingProfile.role}</p>
                 </div>
              </div>
              <button 
                onClick={() => setViewingProfile(null)}
                className="w-12 h-12 rounded-2xl bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-all font-black"
              >
                ✕
              </button>
            </div>

            {/* Modal Body */}
            <div className="flex-1 overflow-y-auto p-12 custom-scrollbar space-y-12 bg-white">
               {!viewingProfile.isActive && (
                 <div className="bg-red-50 p-8 rounded-[2rem] border border-red-100 flex items-center space-x-6">
                    <span className="text-4xl">🛑</span>
                    <div>
                       <h4 className="text-xl font-black text-red-700 uppercase tracking-tighter">Inactive Employee Profile</h4>
                       <p className="text-sm font-bold text-red-600">Reason: {viewingProfile.inactiveReason} • Inactive since: {viewingProfile.inactiveDate || 'N/A'}</p>
                    </div>
                 </div>
               )}

               <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                  <div className="space-y-10">
                    <section>
                      <h4 className="text-xs font-black uppercase text-[#ffb519] mb-4 border-b border-slate-100 pb-2">Identification</h4>
                      <ProfileDetailRow label="ID Number" value={viewingProfile.idNumber} />
                      <ProfileDetailRow label="Passport" value={viewingProfile.passportNumber} />
                      <ProfileDetailRow label="Phone" value={viewingProfile.phone} />
                      <ProfileDetailRow label="Email" value={viewingProfile.email} />
                      <ProfileDetailRow label="Blood Type" value={viewingProfile.bloodType} />
                    </section>

                    <section>
                      <h4 className="text-xs font-black uppercase text-[#ffb519] mb-4 border-b border-slate-100 pb-2">Banking & Salary</h4>
                      <ProfileDetailRow label="Monthly Salary" value={viewingProfile.salary ? `$${viewingProfile.salary}` : undefined} />
                      <ProfileDetailRow label="Bank Name" value={viewingProfile.bankName} />
                      <ProfileDetailRow label="Account #" value={viewingProfile.bankAccountNum} />
                      <ProfileDetailRow label="Account Type" value={viewingProfile.bankAccountType} />
                      <ProfileDetailRow label="Start Date" value={viewingProfile.startDate} />
                    </section>
                  </div>

                  <div className="space-y-10">
                    <section>
                      <h4 className="text-xs font-black uppercase text-[#ffb519] mb-4 border-b border-slate-100 pb-2">License & Credentials</h4>
                      <ProfileDetailRow label="License #" value={viewingProfile.licenseNumber} />
                      <ProfileDetailRow label="Exp Date" value={viewingProfile.licenseExpDate} />
                      {viewingProfile.licensePhoto && (
                        <div className="mt-4 p-4 bg-slate-50 rounded-2xl border border-slate-100">
                          <p className="text-[9px] font-black text-slate-400 uppercase mb-2">Attached Asset</p>
                          <img src={viewingProfile.licensePhoto} className="w-full h-48 object-contain bg-white rounded-xl shadow-sm" />
                        </div>
                      )}
                    </section>

                    <section>
                      <h4 className="text-xs font-black uppercase text-[#ffb519] mb-4 border-b border-slate-100 pb-2">Logistics</h4>
                      <div className="grid grid-cols-3 gap-2 mb-6">
                        <div className="text-center p-3 bg-slate-50 rounded-xl">
                          <p className="text-[8px] font-black uppercase text-slate-400">Shirt</p>
                          <p className="font-black">{viewingProfile.shirtSize || '—'}</p>
                        </div>
                        <div className="text-center p-3 bg-slate-50 rounded-xl">
                          <p className="text-[8px] font-black uppercase text-slate-400">Pants</p>
                          <p className="font-black">{viewingProfile.pantsSize || '—'}</p>
                        </div>
                        <div className="text-center p-3 bg-slate-50 rounded-xl">
                          <p className="text-[8px] font-black uppercase text-slate-400">Shoes</p>
                          <p className="font-black">{viewingProfile.shoeSize || '—'}</p>
                        </div>
                      </div>
                      <ProfileDetailRow label="Dependent 1" value={viewingProfile.dependent1Name} />
                      <ProfileDetailRow label="Relation 1" value={viewingProfile.dependent1Relation} />
                      <ProfileDetailRow label="Dependent 2" value={viewingProfile.dependent2Name} />
                    </section>
                  </div>
               </div>

               <div className="bg-slate-50 rounded-[2.5rem] p-10 space-y-8 border border-slate-100">
                  <h4 className="text-lg font-black text-slate-800 flex items-center space-x-2">
                    <span>📑</span> <span>Vault Attachments</span>
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                     {[
                       { id: 'docIdPhoto', label: 'ID Picture' },
                       { id: 'cvDoc', label: 'Curriculum Vitae' },
                       { id: 'policeRecordDoc', label: 'Police Record' },
                       { id: 'contractDoc', label: 'Signed Contract' },
                       { id: 'docConfidentiality', label: 'Confidentiality Agreement' },
                       { id: 'docImageRightsFile', label: 'Image Usage Rights' }
                     ].map(doc => (
                       <div key={doc.id} className="bg-white p-6 rounded-2xl border border-slate-200 flex flex-col justify-between space-y-4 shadow-sm hover:shadow-md transition-all">
                          <div>
                            <p className="text-[10px] font-black uppercase text-slate-400">{doc.label}</p>
                            <p className="text-xs font-bold mt-1">{(viewingProfile as any)[doc.id] ? 'Asset Available' : 'Missing'}</p>
                          </div>
                          {(viewingProfile as any)[doc.id] && (
                            <a 
                              href={(viewingProfile as any)[doc.id]} 
                              target="_blank"
                              rel="noopener noreferrer"
                              className="w-full py-3 bg-[#434343] text-white rounded-xl text-[10px] font-black uppercase tracking-widest text-center hover:bg-black transition-all"
                            >
                              {(viewingProfile as any)[doc.id].startsWith('http') ? 'View on Drive' : 'Download Asset'}
                            </a>
                          )}
                       </div>
                     ))}
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4 pt-4 border-t border-slate-200">
                    {[
                      { key: 'docPoliceRecords', label: 'Police Clearance' },
                      { key: 'docZeroAlcohol', label: 'Alcohol Protocol' },
                      { key: 'docConfidentialAgreement', label: 'NDA/Confidentiality' },
                      { key: 'docImageRights', label: 'Media Rights' },
                      { key: 'docContract', label: 'HR Contract' },
                      { key: 'docAddendum', label: 'Legal Addendum' }
                    ].map(chk => (
                      <div key={chk.key} className="flex items-center space-x-3 bg-white px-4 py-3 rounded-xl border border-slate-100">
                        <span className="text-lg">{(viewingProfile as any)[chk.key] ? '✅' : '❌'}</span>
                        <span className="text-[10px] font-black uppercase text-slate-600">{chk.label}</span>
                      </div>
                    ))}
                  </div>
               </div>
            </div>

            <div className="p-8 bg-slate-50 border-t border-slate-200 flex justify-end items-center space-x-6">
               <div className="text-right">
                 <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Sensitive Data Policy</p>
                 <p className="text-[10px] font-bold text-slate-500">Only authorized Admins can access this dossier.</p>
               </div>
               <button 
                onClick={() => setViewingProfile(null)}
                className="bg-[#434343] text-white px-10 py-4 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-black transition-all shadow-xl"
               >
                 Close Dossier
               </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PersonnelDashboard;

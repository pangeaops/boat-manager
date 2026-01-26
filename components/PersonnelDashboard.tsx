import React, { useState } from 'react';
import { AppData, Personnel, PersonnelRole, UserRole } from '../types';
import AddPersonnelForm from './AddPersonnelForm';
import { PANGEA_YELLOW, PANGEA_DARK } from '../constants';

interface PersonnelDashboardProps {
  data: AppData;
  userRole: UserRole;
  onUpdatePersonnel: (person: Personnel) => Promise<boolean | void>;
  onDeletePersonnel: (personId: string, airtableRecordId?: string) => void;
  onSyncAll?: () => void;
}

const PersonnelDashboard: React.FC<PersonnelDashboardProps> = ({ data, userRole, onUpdatePersonnel, onDeletePersonnel, onSyncAll }) => {
  const [editingPersonId, setEditingPersonId] = useState<string | null>(null);
  const [viewingProfileId, setViewingProfileId] = useState<string | null>(null);
  const [showPastEmployees, setShowPastEmployees] = useState(false);

  const personnelList = data?.personnel || [];
  const activeStaff = personnelList.filter(p => p.isActive !== false);
  const inactiveStaff = personnelList.filter(p => p.isActive === false);
  const viewingProfile = personnelList.find(p => p.id === viewingProfileId);
  const editingPerson = personnelList.find(p => p.id === editingPersonId);

  const ROLE_ORDER = [
    PersonnelRole.CEO,
    PersonnelRole.CAPTAIN_MOTOMARLIN,
    PersonnelRole.CAPTAIN_CLEARBOAT,
    PersonnelRole.MARINE,
    PersonnelRole.GENERAL_HELPER,
    PersonnelRole.MECHANIC,
    PersonnelRole.OPERATIONS
  ];

  const StaffCard: React.FC<{ person: Personnel }> = ({ person }) => (
    <div className={`bg-white rounded-[2.5rem] border-2 shadow-sm flex flex-col h-full overflow-hidden group hover:shadow-2xl transition-all duration-500 ${person.isActive ? 'border-slate-100' : 'border-red-50 opacity-80 grayscale-[0.5]'}`}>
      <div className="bg-slate-50 p-6 flex items-center gap-4 border-b border-slate-100">
        <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center overflow-hidden border border-slate-200">
          {person.profilePhoto ? <img src={person.profilePhoto} className="w-full h-full object-cover" /> : <span className="text-3xl opacity-20">👤</span>}
        </div>
        <div className="flex-1 min-w-0">
          <h4 className="text-md font-black text-slate-900 truncate">{person.name}</h4>
          <span className="text-[8px] font-black text-[#ffb519] uppercase tracking-widest bg-amber-50 px-2 py-0.5 rounded-full">{person.role}</span>
        </div>
        {userRole === 'Admin' && (
          <button onClick={() => setEditingPersonId(person.id)} className="p-2 bg-white rounded-xl text-slate-400 hover:text-amber-500 shadow-sm border border-slate-100 transition-colors">
            ✏️
          </button>
        )}
      </div>
      
      <div className="p-6 space-y-4 flex-1">
        {/* Core Info Grid */}
        <div className="grid grid-cols-2 gap-x-4 gap-y-3">
          <div className="col-span-1">
            <p className="text-[8px] font-black text-slate-400 uppercase tracking-tighter">ID / Passport</p>
            <p className="font-black text-slate-800 truncate text-[11px]">{person.idNumber || person.passportNumber || '—'}</p>
          </div>
          <div className="col-span-1">
            <p className="text-[8px] font-black text-slate-400 uppercase tracking-tighter">Phone</p>
            <p className="font-black text-slate-800 text-[11px]">{person.phone || '—'}</p>
          </div>
          
          <div className="col-span-2 pt-2 border-t border-slate-50">
            <p className="text-[8px] font-black text-slate-400 uppercase tracking-tighter">License Credential</p>
            <div className="flex justify-between items-center bg-slate-50/80 px-2 py-1.5 rounded-lg border border-slate-100">
              <p className="font-black text-slate-700 text-[10px]">{person.licenseNumber || 'No Record'}</p>
              <span className={`text-[8px] font-black px-2 py-0.5 rounded uppercase ${new Date(person.licenseExpDate || '') < new Date() ? 'bg-red-500 text-white animate-pulse' : 'bg-[#ffb519]/20 text-[#ffb519]'}`}>
                {person.licenseExpDate ? `Exp: ${person.licenseExpDate}` : 'No Expiry'}
              </span>
            </div>
          </div>
        </div>

        <div className="bg-red-50 p-4 rounded-2xl border border-red-100/50 space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-[8px] font-black text-red-400 uppercase tracking-widest">Emergency Contact</p>
            <span className="text-[10px]">🚨</span>
          </div>
          <div className="space-y-1">
            <p className="font-black text-slate-800 text-[10px] truncate">{person.emergencyContactName || 'EMERGENCY: Not Set'}</p>
            <p className="font-bold text-slate-500 text-[9px]">{person.emergencyContactPhone || '—'}</p>
          </div>
          <div className="pt-2 border-t border-red-100/50">
            <p className="text-[8px] font-black text-red-400 uppercase tracking-widest">Medical / Allergies</p>
            <p className={`font-black text-[10px] mt-0.5 ${person.allergies && person.allergies.toLowerCase() !== 'none' ? 'text-red-600 bg-red-100 px-2 py-0.5 rounded inline-block' : 'text-slate-400'}`}>
              {person.allergies || 'None reported'}
            </p>
          </div>
        </div>

        {!person.isActive && (
          <div className="p-3 bg-red-100 rounded-xl border border-red-200">
            <p className="text-[8px] font-black text-red-800 uppercase">Archive Reason</p>
            <p className="font-black text-red-900 text-[10px]">{person.inactiveReason || 'No reason provided'}</p>
          </div>
        )}
      </div>

      <div className="p-4 bg-slate-50 border-t border-slate-100 text-center">
        <button onClick={() => setViewingProfileId(person.id)} className="text-[9px] font-black uppercase text-amber-500 tracking-widest hover:tracking-[0.2em] transition-all">
          View Complete Record
        </button>
      </div>
    </div>
  );

  return (
    <div className="space-y-12">
      <header className="flex justify-between items-center">
        <div>
          <h2 className="text-4xl font-black tracking-tight" style={{ color: PANGEA_DARK }}>Staff Hub</h2>
          <p className="text-slate-400 font-medium">Official credential and emergency database.</p>
        </div>
        <div className="flex items-center space-x-4">
          <button 
            onClick={() => setShowPastEmployees(!showPastEmployees)}
            className={`px-6 py-4 rounded-2xl font-black text-xs uppercase tracking-widest transition-all ${showPastEmployees ? 'bg-slate-800 text-white shadow-xl' : 'bg-slate-100 text-slate-400 hover:bg-slate-200'}`}
          >
            {showPastEmployees ? 'Viewing Archives' : 'View Inactive Staff'}
          </button>
          {userRole === 'Admin' && onSyncAll && (
            <button onClick={onSyncAll} className="bg-[#ffb519] text-white px-8 py-4 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-black shadow-xl">
              ☁️ Sync All Staff
            </button>
          )}
        </div>
      </header>

      {!showPastEmployees ? (
        ROLE_ORDER.map(role => {
          const staff = activeStaff.filter(p => 
            String(p.role || '').toLowerCase().trim() === String(role).toLowerCase().trim()
          );
          if (!staff.length) return null;
          return (
            <section key={role} className="space-y-6">
              <h3 className="text-[10px] font-black text-slate-900 uppercase tracking-[0.3em] bg-slate-100 px-4 py-2 rounded-xl inline-block">{role}</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {staff.map(person => <StaffCard key={person.id} person={person} />)}
              </div>
            </section>
          );
        })
      ) : (
        <section className="space-y-6 animate-in fade-in duration-500">
          <h3 className="text-[10px] font-black text-red-600 uppercase tracking-[0.3em] bg-red-50 px-4 py-2 rounded-xl inline-block">Archived Personnel</h3>
          {inactiveStaff.length === 0 ? (
            <div className="py-20 text-center bg-slate-50 rounded-[3rem] border-2 border-dashed border-slate-200">
               <p className="font-black text-slate-400 uppercase tracking-widest">No Inactive Staff Found</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {inactiveStaff.map(person => <StaffCard key={person.id} person={person} />)}
            </div>
          )}
        </section>
      )}

      {editingPerson && (
        <div className="fixed inset-0 z-[100] bg-[#434343]/90 backdrop-blur-md flex items-start justify-center p-6 overflow-y-auto">
          <div className="w-full max-w-6xl py-10">
            <AddPersonnelForm 
              initialData={editingPerson} 
              onAddPersonnel={async (p) => { 
                const ok = await onUpdatePersonnel(p); 
                if (ok) setEditingPersonId(null); 
              }}
              onCancel={() => setEditingPersonId(null)} 
            />
          </div>
        </div>
      )}

      {viewingProfile && (
        <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm flex items-center justify-center p-6" onClick={() => setViewingProfileId(null)}>
          <div className="bg-white w-full max-w-2xl rounded-[3rem] p-10 overflow-y-auto max-h-[90vh]" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-start mb-8">
              <h2 className="text-3xl font-black">{viewingProfile.name}</h2>
              <button onClick={() => setViewingProfileId(null)} className="text-slate-400 text-2xl">✕</button>
            </div>
            <div className="grid grid-cols-2 gap-8 text-sm">
              <div className="space-y-4">
                <p className="font-black text-amber-500 uppercase text-[10px]">Employment</p>
                <div className="bg-slate-50 p-4 rounded-2xl space-y-2">
                  <p><strong>Role:</strong> {viewingProfile.role}</p>
                  <p><strong>Started:</strong> {viewingProfile.startDate}</p>
                  <p><strong>ID Number:</strong> {viewingProfile.idNumber}</p>
                  <p><strong>Status:</strong> {viewingProfile.isActive ? 'Active' : `Inactive (${viewingProfile.inactiveReason})`}</p>
                </div>
              </div>
              <div className="space-y-4">
                <p className="font-black text-amber-500 uppercase text-[10px]">Emergency</p>
                <div className="bg-red-50 p-4 rounded-2xl space-y-2">
                  <p><strong>Contact:</strong> {viewingProfile.emergencyContactName}</p>
                  <p><strong>Phone:</strong> {viewingProfile.emergencyContactPhone}</p>
                  <p className="text-red-600"><strong>Allergies:</strong> {viewingProfile.allergies || 'None'}</p>
                </div>
              </div>
            </div>
            {userRole === 'Admin' && (
              <button onClick={() => { if(confirm("Permanently delete this record?")) onDeletePersonnel(viewingProfile.id, viewingProfile.airtableRecordId); setViewingProfileId(null); }} className="mt-10 w-full py-4 bg-red-100 text-red-600 rounded-2xl font-black uppercase text-xs tracking-widest hover:bg-red-600 hover:text-white transition-all">
                Terminate Employee Profile
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default PersonnelDashboard;

import React, { useState, useMemo } from 'react';
import { AppData, Tour, ProvisionStock, WildlifeEncounter, PostTripChecklist, PreDepartureVerification, PersonnelRole } from '../types';
import { PANGEA_YELLOW, PANGEA_DARK, TOUR_TYPES, TOUR_ROUTES, INITIAL_PROVISIONS } from '../constants';

interface TourLogFormProps {
  data: AppData;
  onAddTour: (tour: Tour) => void;
  onUpdateTour: (tourId: string, updates: Partial<Tour>) => void;
}

const TourLogForm: React.FC<TourLogFormProps> = ({ data, onAddTour, onUpdateTour }) => {
  const [activeMode, setActiveMode] = useState<'Log' | 'Safety' | 'Arrival' | 'Encounter'>('Log');
  const [selectedTourId, setSelectedTourId] = useState<string | null>(null);

  // Helper for active personnel only
  const activePersonnel = useMemo(() => data.personnel.filter(p => p.isActive !== false), [data.personnel]);

  // Extend provisions with "Other" options
  const provisionList = useMemo(() => [
    ...INITIAL_PROVISIONS,
    { item: 'Other 1', category: 'Equipment' as const },
    { item: 'Other 2', category: 'Equipment' as const }
  ], []);

  // Form States
  const [departureForm, setDepartureForm] = useState({
    boatId: '',
    captainId: '',
    mates: [] as string[],
    date: new Date().toISOString().split('T')[0],
    time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false }),
    tourType: 'Shared',
    route: '',
    paxCount: 0,
    startGas: 0,
    hmiStart: 0,
    hmdStart: 0,
    hmcStart: 0,
    provisions: provisionList.map(p => ({ ...p, departureQty: 0, arrivalQty: 0 })),
    provisionsNotes: '',
    generalTripNotes: '',
    predepartureCheck: false,
    
    // Transfer fields
    pickupLocation: '',
    dropoffLocation: '',
    
    // Support boat fields
    isSupportBoatRequired: false,
    supportBoatId: '',
    supportCaptainId: '',
    supportMates: [] as string[],
    supportProvisions: provisionList.map(p => ({ ...p, departureQty: 0, arrivalQty: 0 }))
  });

  const [verificationForm, setVerificationForm] = useState<PreDepartureVerification & { checkDate: string, checkTime: string }>({
    id: `CHK-${new Date().getFullYear()}-${Math.floor(Math.random() * 999).toString().padStart(3, '0')}`,
    bilgeDry: false,
    engineOilSteeringOk: false,
    propellersClear: false,
    lifeJacketsCountOk: false,
    fuelLevelSufficient: false,
    electronicsOperational: false,
    coolingTelltaleActive: false,
    anchorLineSecure: false,
    firstAidOnboard: false,
    captainSignature: '',
    checkDate: new Date().toISOString().split('T')[0],
    checkTime: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })
  });

  const [arrivalForm, setArrivalForm] = useState({
    time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false }),
    endGas: 0,
    hmiEnd: 0,
    hmdEnd: 0,
    hmcEnd: 0,
    provisions: provisionList.map(p => ({ ...p, arrivalQty: 0 })),
    arrivalNotes: '',
    mechanicalNotes: '',
    postTripChecklist: { trash: false, washed: false, gear: false, lostFound: false } as PostTripChecklist
  });

  const [encounterForm, setEncounterForm] = useState({
    species: 'Dolphins',
    otherSpeciesName: '',
    observationTime: 0,
    minDistance: 0,
    compliance: true,
    notes: ''
  });

  const isTransfer = departureForm.tourType === 'Boat Transfer' || departureForm.tourType === 'Boat Hotel Transfer';

  const handleDispatch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!departureForm.boatId || !departureForm.captainId) return alert("Select Boat and Captain");
    
    if (!verificationForm.captainSignature) {
      alert("Please complete and sign the Safety Verification first!");
      setActiveMode('Safety');
      return;
    }

    const newTour: Tour = {
      id: Math.random().toString(36).substr(2, 9),
      status: 'Dispatched',
      departureTime: departureForm.time,
      ...departureForm,
      provisions: departureForm.provisions as ProvisionStock[],
      supportProvisions: departureForm.supportProvisions as ProvisionStock[],
      encounters: [],
      preDepartureVerification: verificationForm,
      postTripChecklist: { trash: false, washed: false, gear: false, lostFound: false },
      arrivalNotes: ''
    };

    onAddTour(newTour);
    setSelectedTourId(newTour.id);
    alert("Departure recorded and tour dispatched.");
    setActiveMode('Log');
  };

  const handleArrivalSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTourId) return alert("Select a tour to reconcile.");
    
    const updates: Partial<Tour> = {
      status: 'Completed',
      arrivalTime: arrivalForm.time,
      endGas: arrivalForm.endGas,
      hmiEnd: arrivalForm.hmiEnd,
      hmdEnd: arrivalForm.hmdEnd,
      hmcEnd: arrivalForm.hmcEnd,
      arrivalNotes: arrivalForm.arrivalNotes,
      mechanicalNotes: arrivalForm.mechanicalNotes,
      postTripChecklist: arrivalForm.postTripChecklist,
      provisions: arrivalForm.provisions.map(p => {
        const depProv = departureForm.provisions.find(dp => dp.item === p.item);
        return { ...p, departureQty: depProv?.departureQty || 0 };
      }) as ProvisionStock[]
    };

    onUpdateTour(selectedTourId, updates);
    alert("Trip completion recorded. Vessel cleared.");
  };

  const handleEncounterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTourId) return alert("Select an active tour.");
    
    const finalSpecies = encounterForm.species === 'Other' ? encounterForm.otherSpeciesName : encounterForm.species;
    if (!finalSpecies) return alert("Please specify the species name.");

    const currentTour = data.tours.find(t => t.id === selectedTourId);
    const updates: Partial<Tour> = {
      encounters: [...(currentTour?.encounters || []), {
        species: finalSpecies,
        observationTime: encounterForm.observationTime,
        minDistance: encounterForm.minDistance,
        compliance: encounterForm.compliance,
        notes: encounterForm.notes
      } as WildlifeEncounter]
    };
    onUpdateTour(selectedTourId, updates);
    alert("Wildlife encounter logged.");
    setEncounterForm({ species: 'Dolphins', otherSpeciesName: '', observationTime: 0, minDistance: 0, compliance: true, notes: '' });
  };

  return (
    <div className="space-y-8 pb-20">
      {/* Navigation Tabs */}
      <div className="flex space-x-4 border-b border-slate-100 pb-4 overflow-x-auto">
        {[
          { id: 'Log', label: '🛫 Departure Log', icon: '📝' },
          { id: 'Safety', label: '🛡️ Safety Verification', icon: '✅' },
          { id: 'Arrival', label: '🛬 Arrival & Fuel', icon: '⛽' },
          { id: 'Encounter', label: '🐬 Wildlife Log', icon: '🐬' }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveMode(tab.id as any)}
            className={`px-8 py-3 rounded-2xl font-black text-sm whitespace-nowrap transition-all flex items-center space-x-2 ${
              activeMode === tab.id ? 'bg-white shadow-lg border border-slate-100' : 'text-slate-400 hover:text-[#434343]'
            }`}
            style={{ color: activeMode === tab.id ? PANGEA_YELLOW : '' }}
          >
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {activeMode === 'Log' && (
        <form onSubmit={handleDispatch} className="grid grid-cols-1 lg:grid-cols-2 gap-8 animate-in fade-in duration-500">
          <div className="space-y-8">
            <div className="bg-white p-10 rounded-[2.5rem] shadow-sm border border-slate-100 space-y-8">
              <h3 className="text-xl font-black">Departure Operations</h3>

              <div className="grid grid-cols-2 gap-4 p-6 bg-[#ffb519]/5 rounded-3xl border-2 border-[#ffb519]/20">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Date</label>
                  <input type="date" value={departureForm.date} onChange={e => setDepartureForm({...departureForm, date: e.target.value})} className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 font-black text-sm outline-none focus:ring-2 focus:ring-[#ffb519]" />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Start Time</label>
                  <input type="time" value={departureForm.time} onChange={e => setDepartureForm({...departureForm, time: e.target.value})} className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 font-black text-sm outline-none focus:ring-2 focus:ring-[#ffb519]" />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Type of Tour</label>
                  <select value={departureForm.tourType} onChange={e => setDepartureForm({...departureForm, tourType: e.target.value})} className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-3 font-black text-sm outline-none focus:ring-2 focus:ring-[#ffb519]">
                    {TOUR_TYPES.map(type => <option key={type} value={type}>{type}</option>)}
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Route Selection</label>
                  <select value={departureForm.route} onChange={e => setDepartureForm({...departureForm, route: e.target.value})} className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-3 font-black text-sm outline-none focus:ring-2 focus:ring-[#ffb519]">
                    <option value="">Choose Route...</option>
                    {Object.entries(TOUR_ROUTES).map(([cat, routes]) => (
                      <optgroup label={cat} key={cat}>{routes.map(r => <option key={r} value={r}>{r}</option>)}</optgroup>
                    ))}
                  </select>
                </div>
              </div>

              {/* Conditional Transfer Logistics */}
              {isTransfer && (
                <div className="grid grid-cols-2 gap-4 p-6 bg-blue-50 rounded-3xl border-2 border-blue-200 animate-in slide-in-from-top-4 duration-300">
                   <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase text-blue-700 tracking-widest">Pick Up Point</label>
                      <input type="text" value={departureForm.pickupLocation} onChange={e => setDepartureForm({...departureForm, pickupLocation: e.target.value})} className="w-full bg-white border border-blue-200 rounded-xl px-4 py-3 font-bold text-sm outline-none focus:ring-2 focus:ring-blue-400" placeholder="Dock / Hotel Name" />
                   </div>
                   <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase text-blue-700 tracking-widest">Drop Off Point</label>
                      <input type="text" value={departureForm.dropoffLocation} onChange={e => setDepartureForm({...departureForm, dropoffLocation: e.target.value})} className="w-full bg-white border border-blue-200 rounded-xl px-4 py-3 font-bold text-sm outline-none focus:ring-2 focus:ring-blue-400" placeholder="Final Destination" />
                   </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Primary Boat</label>
                  <select value={departureForm.boatId} onChange={e => setDepartureForm({...departureForm, boatId: e.target.value})} className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-3 font-black text-sm outline-none">
                    <option value="">Select Asset...</option>
                    {data.boats.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Primary Captain</label>
                  <select value={departureForm.captainId} onChange={e => setDepartureForm({...departureForm, captainId: e.target.value})} className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-3 font-black text-sm outline-none">
                    <option value="">Select Captain...</option>
                    {activePersonnel.filter(p => p.role.includes('Capitán')).map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                  </select>
                </div>
              </div>

              <div className="space-y-3">
                <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Mates & Crew Assigned (Primary)</label>
                <div className="flex flex-wrap gap-2 p-4 bg-slate-50 rounded-2xl border border-slate-100 max-h-[160px] overflow-y-auto custom-scrollbar">
                  {activePersonnel.map(p => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => setDepartureForm(prev => ({ ...prev, mates: prev.mates.includes(p.id) ? prev.mates.filter(id => id !== p.id) : [...prev.mates, p.id] }))}
                      className={`px-3 py-1.5 rounded-lg text-[9px] font-black uppercase transition-all ${departureForm.mates.includes(p.id) ? 'bg-[#ffb519] text-white shadow-sm' : 'bg-white border border-slate-200 text-slate-400'}`}
                    >
                      {p.name}
                    </button>
                  ))}
                </div>
              </div>

              {/* Support Boat Logic */}
              <div className="pt-6 border-t border-slate-100">
                <label className="flex items-center space-x-4 cursor-pointer group p-4 bg-slate-50 rounded-2xl hover:bg-slate-100 transition-colors">
                  <div className={`w-14 h-8 rounded-full transition-all relative ${departureForm.isSupportBoatRequired ? 'bg-amber-500' : 'bg-slate-300'}`}>
                    <div className={`absolute top-1 w-6 h-6 bg-white rounded-full transition-all shadow-sm ${departureForm.isSupportBoatRequired ? 'left-7' : 'left-1'}`}></div>
                  </div>
                  <input 
                    type="checkbox" 
                    className="hidden" 
                    checked={departureForm.isSupportBoatRequired} 
                    onChange={e => setDepartureForm({...departureForm, isSupportBoatRequired: e.target.checked})} 
                  />
                  <div>
                    <span className="text-sm font-black uppercase tracking-widest text-slate-700">Support Vessel Required</span>
                    <p className="text-[9px] font-bold text-slate-400">Escort, Logistics or Photography Support</p>
                  </div>
                </label>

                {departureForm.isSupportBoatRequired && (
                  <div className="mt-8 bg-amber-50 p-8 rounded-[2rem] border-2 border-amber-200 space-y-8 animate-in zoom-in-95 duration-300">
                    <h4 className="text-xs font-black uppercase text-amber-700 tracking-[0.2em] flex items-center space-x-2">
                       <span>🛟</span> <span>Support Vessel Configuration</span>
                    </h4>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-[9px] font-black uppercase text-amber-800">Assigned Boat</label>
                        <select value={departureForm.supportBoatId} onChange={e => setDepartureForm({...departureForm, supportBoatId: e.target.value})} className="w-full bg-white border border-amber-200 rounded-xl px-4 py-3 font-bold text-sm outline-none focus:ring-2 focus:ring-amber-400">
                          <option value="">Select Asset...</option>
                          {data.boats.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                        </select>
                      </div>
                      <div className="space-y-2">
                        <label className="text-[9px] font-black uppercase text-amber-800">Support Captain</label>
                        <select value={departureForm.supportCaptainId} onChange={e => setDepartureForm({...departureForm, supportCaptainId: e.target.value})} className="w-full bg-white border border-amber-200 rounded-xl px-4 py-3 font-bold text-sm outline-none focus:ring-2 focus:ring-amber-400">
                          <option value="">Select Captain...</option>
                          {activePersonnel.filter(p => p.role.includes('Capitán')).map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                        </select>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <label className="text-[9px] font-black uppercase text-amber-800">Support Staff Assigned (All Staff)</label>
                      <div className="flex flex-wrap gap-2 p-4 bg-white rounded-2xl border border-amber-100 max-h-[160px] overflow-y-auto custom-scrollbar">
                        {activePersonnel.map(p => (
                          <button
                            key={p.id}
                            type="button"
                            onClick={() => setDepartureForm(prev => ({ ...prev, supportMates: prev.supportMates.includes(p.id) ? prev.supportMates.filter(id => id !== p.id) : [...prev.supportMates, p.id] }))}
                            className={`px-3 py-1.5 rounded-lg text-[9px] font-black uppercase transition-all ${departureForm.supportMates.includes(p.id) ? 'bg-amber-600 text-white shadow-md' : 'bg-slate-50 border border-slate-100 text-slate-400 hover:text-slate-600'}`}
                          >
                            {p.name}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-4">
                       <label className="text-[9px] font-black uppercase text-amber-800">Support Vessel Provisions (Include Others)</label>
                       <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 p-4 bg-white rounded-2xl border border-amber-100 max-h-[300px] overflow-y-auto custom-scrollbar">
                          {departureForm.supportProvisions.map((prov, i) => (
                            <div key={`sup-${prov.item}`} className="flex flex-col space-y-1 p-3 bg-amber-50/50 border border-amber-100 rounded-xl">
                               <span className="text-[8px] font-black uppercase text-amber-700 truncate">{prov.item}</span>
                               <input 
                                  type="number" 
                                  value={prov.departureQty} 
                                  onChange={e => {
                                    const newProvs = [...departureForm.supportProvisions];
                                    newProvs[i].departureQty = parseInt(e.target.value) || 0;
                                    setDepartureForm({...departureForm, supportProvisions: newProvs});
                                  }} 
                                  className="w-full bg-white border border-amber-100 rounded-lg text-center font-black text-xs py-1" 
                                />
                            </div>
                          ))}
                       </div>
                    </div>
                  </div>
                )}
              </div>

              <div className="bg-slate-50 p-8 rounded-3xl border border-slate-100 space-y-6">
                <h4 className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Fuel Status</h4>
                <div className="space-y-1">
                   <p className="text-[9px] font-black uppercase text-slate-400">Start Gas (Scale 1-9)</p>
                   <input 
                    type="number" 
                    min="1" 
                    max="9" 
                    step="1" 
                    value={departureForm.startGas} 
                    onChange={e => setDepartureForm({...departureForm, startGas: parseFloat(e.target.value)})} 
                    className="w-full bg-white border border-slate-100 rounded-xl px-4 py-3 font-black text-2xl outline-none focus:ring-2 focus:ring-[#ffb519]" 
                   />
                </div>
              </div>

              <div className="bg-slate-50 p-8 rounded-3xl border border-slate-100 space-y-6">
                <h4 className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Hobbs Start Meters</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                   <div className="space-y-1">
                     <p className="text-[9px] font-black uppercase text-slate-400">HMI Start</p>
                     <input type="number" step="0.1" value={departureForm.hmiStart} onChange={e => setDepartureForm({...departureForm, hmiStart: parseFloat(e.target.value)})} className="w-full bg-white border border-slate-100 rounded-xl px-4 py-2 font-bold outline-none" />
                   </div>
                   <div className="space-y-1">
                     <p className="text-[9px] font-black uppercase text-slate-400">HMD Start</p>
                     <input type="number" step="0.1" value={departureForm.hmdStart} onChange={e => setDepartureForm({...departureForm, hmdStart: parseFloat(e.target.value)})} className="w-full bg-white border border-slate-100 rounded-xl px-4 py-2 font-bold outline-none" />
                   </div>
                   <div className="space-y-1">
                     <p className="text-[9px] font-black uppercase text-slate-400">HMC Start</p>
                     <input type="number" step="0.1" value={departureForm.hmcStart} onChange={e => setDepartureForm({...departureForm, hmcStart: parseFloat(e.target.value)})} className="w-full bg-white border border-slate-100 rounded-xl px-4 py-2 font-bold outline-none" />
                   </div>
                </div>
              </div>
            </div>

            <button type="submit" className="w-full py-6 rounded-3xl font-black text-2xl shadow-2xl transition-all hover:scale-[1.01] active:scale-[0.99]" style={{ backgroundColor: PANGEA_DARK, color: 'white' }}>
               Confirm Dispatch Log
            </button>
          </div>

          <div className="space-y-8">
            <div className="bg-white p-10 rounded-[2.5rem] border border-slate-100 shadow-sm space-y-8">
               <h3 className="text-xl font-black flex items-center space-x-2">
                 <span>📦</span> <span>Provisioning (Primary Boat)</span>
               </h3>
               <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
                {departureForm.provisions.map((prov, i) => (
                  <div key={prov.item} className="p-4 bg-slate-50 rounded-2xl border border-slate-100 text-center space-y-2 group hover:border-[#ffb519] transition-all">
                    <span className="text-[9px] font-black uppercase text-slate-400 block leading-none truncate">{prov.item}</span>
                    <input type="number" value={prov.departureQty} onChange={e => {
                        const newProvs = [...departureForm.provisions];
                        newProvs[i].departureQty = parseInt(e.target.value) || 0;
                        setDepartureForm({...departureForm, provisions: newProvs});
                      }} className="w-full bg-white border border-slate-200 rounded-xl px-2 py-2 text-center font-black text-sm outline-none focus:ring-2 focus:ring-[#ffb519]" />
                  </div>
                ))}
              </div>
              <textarea value={departureForm.generalTripNotes} onChange={e => setDepartureForm({...departureForm, generalTripNotes: e.target.value})} className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-6 py-4 font-medium h-32 outline-none focus:ring-2 focus:ring-[#ffb519]" placeholder="General Notes, Guest Feedback, Special Requirements..." />
            </div>
          </div>
        </form>
      )}

      {activeMode === 'Safety' && (
        <div className="bg-white p-12 rounded-[3.5rem] shadow-2xl border border-slate-100 animate-in zoom-in-95 duration-500 max-w-4xl mx-auto space-y-10">
          <div className="flex justify-between items-start">
            <div>
               <h3 className="text-3xl font-black">Pre-Departure Verification</h3>
               <p className="text-slate-400 font-bold text-xs uppercase tracking-widest mt-1">Checklist ID: {verificationForm.id}</p>
            </div>
            <div className="text-right p-4 bg-amber-50 rounded-2xl border border-amber-100">
               <p className="text-[10px] font-black uppercase text-amber-600">Verification Date/Time</p>
               <p className="text-sm font-black">{verificationForm.checkDate} @ {verificationForm.checkTime}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[
              { key: 'bilgeDry', label: 'Bilge dry / Pumps functional' },
              { key: 'engineOilSteeringOk', label: 'Engine Oil & Steering Fluid OK' },
              { key: 'propellersClear', label: 'Propellers clear of debris' },
              { key: 'lifeJacketsCountOk', label: 'Life Jackets (Count + 10%)' },
              { key: 'fuelLevelSufficient', label: 'Fuel Level Sufficient' },
              { key: 'electronicsOperational', label: 'Electronics (VHF/GPS) Operational' },
              { key: 'coolingTelltaleActive', label: 'Cooling "Tell-tale" stream active' },
              { key: 'anchorLineSecure', label: 'Anchor & Line Secure' },
              { key: 'firstAidOnboard', label: 'First Aid Kit Onboard' }
            ].map(item => (
              <label key={item.key} className="flex items-center space-x-6 p-6 bg-slate-50 rounded-2xl border border-slate-100 hover:shadow-lg transition-all cursor-pointer group">
                <input 
                  type="checkbox" 
                  checked={(verificationForm as any)[item.key]} 
                  onChange={e => setVerificationForm({...verificationForm, [item.key]: e.target.checked})}
                  className="w-8 h-8 rounded-xl border-slate-300"
                  style={{ accentColor: PANGEA_YELLOW }}
                />
                <span className="text-sm font-bold text-slate-700">{item.label}</span>
              </label>
            ))}
          </div>

          <div className="space-y-6 pt-10 border-t border-slate-100">
            <h4 className="text-xl font-black">Captain's Declaration</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Boat to Verify</label>
                <select value={departureForm.boatId} onChange={e => setDepartureForm({...departureForm, boatId: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-6 py-4 font-black">
                  <option value="">Select Boat...</option>
                  {data.boats.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Captain Signature (Name)</label>
                <input 
                  type="text" 
                  value={verificationForm.captainSignature} 
                  onChange={e => setVerificationForm({...verificationForm, captainSignature: e.target.value})}
                  className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-8 py-4 font-black text-xl" 
                  placeholder="Type Full Name" 
                />
              </div>
            </div>
            <button onClick={() => { alert("Verification Signed."); setActiveMode('Log'); }} className="w-full py-6 rounded-3xl font-black text-2xl shadow-2xl transition-all" style={{ backgroundColor: PANGEA_YELLOW, color: 'white' }}>Confirm Safety Check</button>
          </div>
        </div>
      )}

      {activeMode === 'Arrival' && (
        <form onSubmit={handleArrivalSubmit} className="max-w-5xl mx-auto space-y-8 animate-in slide-in-from-bottom-6 duration-500">
          <div className="bg-white p-12 rounded-[3.5rem] shadow-2xl border border-slate-100 space-y-10">
            <div className="flex flex-col md:flex-row justify-between items-center gap-6">
              <h3 className="text-3xl font-black">Trip Reconciliation</h3>
              <select value={selectedTourId || ''} onChange={e => setSelectedTourId(e.target.value)} className="bg-slate-50 border border-slate-100 rounded-2xl px-6 py-4 font-black text-sm outline-none focus:ring-2 focus:ring-[#ffb519] min-w-[300px]">
                  <option value="">Active Tours...</option>
                  {data.tours.filter(t => t.status === 'Dispatched').map(t => <option key={t.id} value={t.id}>{t.route} - {data.boats.find(b => b.id === t.boatId)?.name} ({t.departureTime})</option>)}
              </select>
            </div>
            
            <div className="grid grid-cols-2 gap-8">
               <div className="space-y-2">
                 <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Arrival Time</label>
                 <input type="time" value={arrivalForm.time} onChange={e => setArrivalForm({...arrivalForm, time: e.target.value})} className="w-full bg-slate-50 rounded-2xl px-6 py-4 font-black text-2xl shadow-inner border-none" />
               </div>
               <div className="space-y-2 p-6 bg-slate-50 rounded-[2.5rem] border border-slate-100">
                 <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">End Gas (Scale 1-9)</label>
                 <input 
                  type="number" 
                  min="1" 
                  max="9" 
                  step="1" 
                  value={arrivalForm.endGas} 
                  onChange={e => setArrivalForm({...arrivalForm, endGas: parseFloat(e.target.value)})} 
                  className="w-full bg-white border border-slate-200 rounded-2xl px-6 py-4 font-black text-2xl shadow-inner outline-none" 
                 />
               </div>
            </div>

            <div className="bg-slate-50 p-10 rounded-[2.5rem] border border-slate-100 space-y-8">
               <h4 className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Detailed Hobbs Ending Hours</h4>
               <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                 <div className="space-y-1">
                   <p className="text-[9px] font-black uppercase text-slate-400">HMI End</p>
                   <input type="number" step="0.1" value={arrivalForm.hmiEnd} onChange={e => setArrivalForm({...arrivalForm, hmiEnd: parseFloat(e.target.value)})} className="w-full bg-white border border-slate-100 rounded-xl px-4 py-2 font-bold" />
                 </div>
                 <div className="space-y-1">
                   <p className="text-[9px] font-black uppercase text-slate-400">HMD End</p>
                   <input type="number" step="0.1" value={arrivalForm.hmdEnd} onChange={e => setArrivalForm({...arrivalForm, hmdEnd: parseFloat(e.target.value)})} className="w-full bg-white border border-slate-100 rounded-xl px-4 py-2 font-bold" />
                 </div>
                 <div className="space-y-1">
                   <p className="text-[9px] font-black uppercase text-slate-400">HMC End</p>
                   <input type="number" step="0.1" value={arrivalForm.hmcEnd} onChange={e => setArrivalForm({...arrivalForm, hmcEnd: parseFloat(e.target.value)})} className="w-full bg-white border border-slate-100 rounded-xl px-4 py-2 font-bold" />
                 </div>
               </div>
            </div>

            <div className="bg-slate-50 p-10 rounded-[2.5rem] border border-slate-100 space-y-8">
               <h4 className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Returning Provisions</h4>
               <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                 {arrivalForm.provisions.map((prov, i) => (
                   <div key={prov.item} className="p-4 bg-white border border-slate-100 rounded-2xl text-center space-y-2">
                      <span className="text-[9px] font-black uppercase text-slate-500 block leading-none">{prov.item}</span>
                      <input type="number" value={prov.arrivalQty} onChange={e => {
                        const newProvs = [...arrivalForm.provisions];
                        newProvs[i].arrivalQty = parseInt(e.target.value) || 0;
                        setArrivalForm({...arrivalForm, provisions: i === 0 ? newProvs : newProvs}); // dummy
                        setArrivalForm({...arrivalForm, provisions: newProvs});
                      }} className="w-full bg-slate-50 border border-slate-100 rounded-xl px-2 py-1 text-center font-black text-xs" />
                   </div>
                 ))}
               </div>
            </div>

            <div className="bg-slate-50 p-10 rounded-[2.5rem] space-y-6">
              <h4 className="font-black">Post-Trip Maintenance Checklist</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[
                  { id: 'trash', label: 'Trash Removed & Sorted' },
                  { id: 'washed', label: 'Deck Washed / Sand Removed' },
                  { id: 'gear', label: 'Gear/Snorkels Rinsed & Stowed' },
                  { id: 'lostFound', label: 'Lost & Found Check Complete' }
                ].map(item => (
                  <label key={item.id} className="flex items-center space-x-4 cursor-pointer p-4 bg-white rounded-2xl border border-slate-100">
                    <input 
                      type="checkbox" 
                      checked={(arrivalForm.postTripChecklist as any)[item.id]} 
                      onChange={e => setArrivalForm({...arrivalForm, postTripChecklist: {...arrivalForm.postTripChecklist, [item.id]: e.target.checked}})} 
                      className="w-6 h-6 rounded-lg"
                      style={{ accentColor: PANGEA_YELLOW }}
                    />
                    <span className="text-sm font-bold text-slate-600">{item.label}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* TRIP AND MECHANICAL NOTES SECTION */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-4">
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest px-1">Trip Notes</label>
                <textarea 
                  value={arrivalForm.arrivalNotes} 
                  onChange={e => setArrivalForm({...arrivalForm, arrivalNotes: e.target.value})} 
                  className="w-full bg-slate-50 border border-slate-100 rounded-[2rem] px-8 py-6 font-medium h-40 outline-none focus:ring-2 focus:ring-[#ffb519]" 
                  placeholder="Operational summary, guest feedback, route changes..." 
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase text-red-500 tracking-widest px-1">Mechanical Notes</label>
                <textarea 
                  value={arrivalForm.mechanicalNotes} 
                  onChange={e => setArrivalForm({...arrivalForm, mechanicalNotes: e.target.value})} 
                  className="w-full bg-red-50/30 border border-red-100 rounded-[2rem] px-8 py-6 font-medium h-40 outline-none focus:ring-2 focus:ring-red-400" 
                  placeholder="Engine performance, technical issues, necessary repairs..." 
                />
              </div>
            </div>

            <button type="submit" className="w-full py-6 rounded-[2.5rem] font-black text-2xl shadow-2xl transition-all" style={{ backgroundColor: PANGEA_YELLOW, color: 'white' }}>Archive Trip Data</button>
          </div>
        </form>
      )}

      {activeMode === 'Encounter' && (
        <form onSubmit={handleEncounterSubmit} className="max-w-3xl mx-auto animate-in zoom-in-95 duration-500">
          <div className="bg-white p-12 rounded-[3.5rem] shadow-2xl border border-slate-100 space-y-10">
            <h3 className="text-3xl font-black">Wildlife Encounter Logger 🐬</h3>
            <div className="space-y-6">
               <div className="space-y-2">
                 <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Active Vessel</label>
                 <select value={selectedTourId || ''} onChange={e => setSelectedTourId(e.target.value)} className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-6 py-4 font-black">
                    <option value="">Choose Tour...</option>
                    {data.tours.filter(t => t.status === 'Dispatched').map(t => <option key={t.id} value={t.id}>{data.boats.find(b => b.id === t.boatId)?.name} - {t.route}</option>)}
                 </select>
               </div>
               <div className="space-y-2">
                 <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Species</label>
                 <select value={encounterForm.species} onChange={e => setEncounterForm({...encounterForm, species: e.target.value})} className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-6 py-4 font-black">
                   {['Dolphins', 'Turtles', 'Birds', 'Rays', 'Sloths', 'Monkeys', 'Whales', 'Other'].map(s => <option key={s} value={s}>{s}</option>)}
                 </select>
               </div>

               {encounterForm.species === 'Other' && (
                 <div className="space-y-2 animate-in slide-in-from-top-2 duration-300">
                   <label className="text-[10px] font-black uppercase text-[#ffb519] tracking-widest">Specify Species Name</label>
                   <input 
                    type="text" 
                    value={encounterForm.otherSpeciesName} 
                    onChange={e => setEncounterForm({...encounterForm, otherSpeciesName: e.target.value})} 
                    className="w-full bg-slate-50 border border-[#ffb519]/30 rounded-2xl px-6 py-4 font-black" 
                    placeholder="Enter Species Name..."
                   />
                 </div>
               )}

               <div className="grid grid-cols-2 gap-8">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Time (min)</label>
                    <input type="number" value={encounterForm.observationTime} onChange={e => setEncounterForm({...encounterForm, observationTime: parseInt(e.target.value)})} className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-6 py-4 font-black" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Dist (m)</label>
                    <input type="number" value={encounterForm.minDistance} onChange={e => setEncounterForm({...encounterForm, minDistance: parseInt(e.target.value)})} className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-6 py-4 font-black" />
                  </div>
               </div>
               <textarea value={encounterForm.notes} onChange={e => setEncounterForm({...encounterForm, notes: e.target.value})} className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-8 py-6 font-medium h-32 outline-none" placeholder="Notes..." />
            </div>
            <button type="submit" className="w-full py-6 rounded-[2.5rem] font-black text-2xl shadow-2xl transition-all" style={{ backgroundColor: PANGEA_YELLOW, color: 'white' }}>Submit Encounter</button>
          </div>
        </form>
      )}
    </div>
  );
};

export default TourLogForm;

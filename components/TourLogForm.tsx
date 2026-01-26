import React, { useState, useMemo, useEffect } from 'react';
import { AppData, Tour, ProvisionStock, WildlifeEncounter, PostTripChecklist, PreDepartureVerification, AuditLog } from '../types.ts';
import { PANGEA_YELLOW, PANGEA_DARK, TOUR_TYPES, TOUR_ROUTES, INITIAL_PROVISIONS } from '../constants.ts';
import { jsPDF } from 'jspdf';

interface TourLogFormProps {
  data: AppData;
  onAddTour: (tour: Tour) => void;
  onUpdateTour: (tourId: string, updates: Partial<Tour>) => void;
  logAction: (action: string, category: AuditLog['category'], details: string) => void;
}

const TourLogForm: React.FC<TourLogFormProps> = ({ data, onAddTour, onUpdateTour, logAction }) => {
  const [activeMode, setActiveMode] = useState<'Log' | 'Safety' | 'Arrival' | 'Encounter'>('Log');
  const [selectedTourId, setSelectedTourId] = useState<string | null>(null);

  const activePersonnel = useMemo(() => (data?.personnel || []).filter(p => p.isActive !== false), [data?.personnel]);

  const provisionList = useMemo(() => {
    if (data?.inventory && data.inventory.length > 0) {
      return data.inventory
        .filter(i => !['Mechanical', 'Dock', 'Vessel Gear'].includes(i.category))
        .map(i => ({ 
          item: i.name, 
          category: (['Drinks', 'Snacks', 'Equipment'].includes(i.category) ? i.category : 'Equipment') as any
        }));
    }
    return INITIAL_PROVISIONS.filter(i => !['Mechanical', 'Dock', 'Vessel Gear'].includes((i.category as any)));
  }, [data?.inventory]);

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
    pickupLocation: '',
    dropoffLocation: '',
    isSupportBoatRequired: false,
    supportBoatId: '',
    supportCaptainId: '',
    supportMates: [] as string[],
    supportProvisions: provisionList.map(p => ({ ...p, departureQty: 0, arrivalQty: 0 }))
  });

  useEffect(() => {
    const currentProvNames = departureForm.provisions.map(p => p.item);
    const newListNames = provisionList.map(p => p.item);
    
    const needsSync = currentProvNames.length !== newListNames.length || !currentProvNames.every(name => newListNames.includes(name));

    if (needsSync) {
      setDepartureForm(prev => ({
        ...prev,
        provisions: provisionList.map(p => {
          const existing = prev.provisions.find(ep => ep.item === p.item);
          return { ...p, departureQty: existing?.departureQty || 0, arrivalQty: 0 };
        }),
        supportProvisions: provisionList.map(p => {
          const existing = prev.supportProvisions.find(ep => ep.item === p.item);
          return { ...p, departureQty: existing?.departureQty || 0, arrivalQty: 0 };
        })
      }));
    }
  }, [provisionList]);

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
    provisions: provisionList.map(p => ({ ...p, departureQty: 0, arrivalQty: 0 })),
    supportProvisions: provisionList.map(p => ({ ...p, departureQty: 0, arrivalQty: 0 })),
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
    
    const existingTour = (data?.tours || []).find(t => t.id === selectedTourId);
    if (!existingTour) return alert("Original tour record not found.");
    
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
        const depProv = existingTour.provisions.find(dp => dp.item === p.item);
        return { ...p, departureQty: depProv?.departureQty || 0 };
      }) as ProvisionStock[],
      supportProvisions: arrivalForm.supportProvisions.map(p => {
        const depProv = existingTour.supportProvisions?.find(dp => dp.item === p.item);
        return { ...p, departureQty: depProv?.departureQty || 0 };
      }) as ProvisionStock[]
    };

    onUpdateTour(selectedTourId, updates);
    alert("Trip completion recorded. Vessel cleared and inventory updated.");
  };

  const generateTripReport = (tour: Tour) => {
    const doc = new jsPDF();
    const boatName = data.boats.find(b => b.id === tour.boatId)?.boatname || 'Unknown Boat';
    const captainName = data.personnel.find(p => p.id === tour.captainId)?.name || 'Unknown Captain';

    doc.setFontSize(20);
    doc.text(`Trip Report: ${tour.route}`, 20, 20);
    doc.setFontSize(12);
    doc.text(`Vessel: ${boatName}`, 20, 35);
    doc.text(`Captain: ${captainName}`, 20, 45);
    doc.text(`Date: ${tour.date}`, 20, 55);
    doc.text(`PAX Count: ${tour.paxCount}`, 20, 65);
    doc.text(`Status: ${tour.status}`, 20, 75);
    doc.text(`Departure: ${tour.departureTime}`, 20, 85);
    if (tour.arrivalTime) doc.text(`Arrival: ${tour.arrivalTime}`, 20, 95);

    doc.text("General Notes:", 20, 110);
    doc.setFontSize(10);
    const splitNotes = doc.splitTextToSize(tour.generalTripNotes || 'No notes provided.', 170);
    doc.text(splitNotes, 20, 120);

    doc.save(`Pangea_TripReport_${tour.id}.pdf`);
    logAction('Trip Report Generated', 'Tour', `PDF Trip Report downloaded for vessel ${boatName} (${tour.route}) on ${tour.date}.`);
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

  const toggleMate = (mateId: string, type: 'primary' | 'support') => {
    if (type === 'primary') {
      const current = departureForm.mates;
      if (current.includes(mateId)) {
        setDepartureForm({ ...departureForm, mates: current.filter(id => id !== mateId) });
      } else if (current.length < 5) {
        setDepartureForm({ ...departureForm, mates: [...current, mateId] });
      } else {
        alert("Maximum 5 mates allowed.");
      }
    } else {
      const current = departureForm.supportMates;
      if (current.includes(mateId)) {
        setDepartureForm({ ...departureForm, supportMates: current.filter(id => id !== mateId) });
      } else if (current.length < 5) {
        setDepartureForm({ ...departureForm, supportMates: [...current, mateId] });
      } else {
        alert("Maximum 5 mates allowed.");
      }
    }
  };

  return (
    <div className="space-y-8 pb-20">
      <div className="flex space-x-4 border-b border-slate-100 pb-4 overflow-x-auto no-scrollbar">
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
            <div className="bg-white p-6 md:p-10 rounded-[2.5rem] shadow-sm border border-slate-100 space-y-8">
              <h3 className="text-xl font-black">Primary Boat Details</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase text-slate-400">Date</label>
                  <input type="date" value={departureForm.date} onChange={e => setDepartureForm({...departureForm, date: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 font-black text-sm outline-none" />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase text-slate-400">Departure Time</label>
                  <input type="time" value={departureForm.time} onChange={e => setDepartureForm({...departureForm, time: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 font-black text-sm outline-none" />
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase text-slate-400">Vessel</label>
                  <select value={departureForm.boatId} onChange={e => setDepartureForm({...departureForm, boatId: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 font-black text-sm outline-none">
                    <option value="">Select Asset...</option>
                    {(data?.boats || []).map(b => <option key={b.id} value={b.id}>{b.boatname}</option>)}
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase text-slate-400">Captain</label>
                  <select value={departureForm.captainId} onChange={e => setDepartureForm({...departureForm, captainId: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 font-black text-sm outline-none">
                    <option value="">Select Captain...</option>
                    {activePersonnel.filter(p => String(p.role || '').includes('Capitan') || String(p.role || '').includes('Commodore')).map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                  </select>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase text-slate-400">Mates / Crew Selection (All Staff Eligible)</label>
                <div className="w-full bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-2 max-h-48 overflow-y-auto custom-scrollbar">
                  {activePersonnel.map(p => (
                    <label key={p.id} className="flex items-center space-x-3 cursor-pointer group">
                      <input 
                        type="checkbox" 
                        checked={departureForm.mates.includes(p.id)} 
                        onChange={() => toggleMate(p.id, 'primary')}
                        className="w-4 h-4 rounded accent-[#ffb519]" 
                      />
                      <span className={`text-xs font-bold transition-colors ${departureForm.mates.includes(p.id) ? 'text-amber-600 font-black' : 'text-slate-500 group-hover:text-slate-700'}`}>
                        {p.name} {String(p.role || '').includes('Capitan') ? '(Captain)' : ''}
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase text-slate-400">PAX Count</label>
                  <input type="number" value={departureForm.paxCount} onChange={e => setDepartureForm({...departureForm, paxCount: parseInt(e.target.value) || 0})} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 font-black text-sm outline-none" />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase text-slate-400">Starting Gas (Pts)</label>
                  <input type="number" step="0.1" value={departureForm.startGas} onChange={e => setDepartureForm({...departureForm, startGas: parseFloat(e.target.value) || 0})} className="w-full bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 font-black text-sm outline-none" />
                </div>
              </div>
              
              <div className="grid grid-cols-3 gap-2">
                <div className="space-y-1">
                  <label className="text-[8px] font-black uppercase text-slate-400">HMI Start</label>
                  <input type="number" step="0.1" value={departureForm.hmiStart} onChange={e => setDepartureForm({...departureForm, hmiStart: parseFloat(e.target.value) || 0})} className="w-full bg-slate-50 border border-slate-100 rounded-lg px-2 py-2 text-xs font-black" />
                </div>
                <div className="space-y-1">
                  <label className="text-[8px] font-black uppercase text-slate-400">HMD Start</label>
                  <input type="number" step="0.1" value={departureForm.hmdStart} onChange={e => setDepartureForm({...departureForm, hmdStart: parseFloat(e.target.value) || 0})} className="w-full bg-slate-50 border border-slate-100 rounded-lg px-2 py-2 text-xs font-black" />
                </div>
                <div className="space-y-1">
                  <label className="text-[8px] font-black uppercase text-slate-400">HMC Start</label>
                  <input type="number" step="0.1" value={departureForm.hmcStart} onChange={e => setDepartureForm({...departureForm, hmcStart: parseFloat(e.target.value) || 0})} className="w-full bg-slate-50 border border-slate-100 rounded-lg px-2 py-2 text-xs font-black" />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase text-slate-400">Route Selection</label>
                <select value={departureForm.route} onChange={e => setDepartureForm({...departureForm, route: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 font-black text-sm outline-none">
                  <option value="">Choose Route...</option>
                  {Object.entries(TOUR_ROUTES).map(([cat, routes]) => (
                    <optgroup label={cat} key={cat}>{routes.map(r => <option key={r} value={r}>{r}</option>)}</optgroup>
                  ))}
                </select>
              </div>

              <div className="pt-6 border-t border-slate-100">
                <label className="flex items-center space-x-3 cursor-pointer p-4 bg-slate-50 rounded-2xl hover:bg-slate-100 transition-colors">
                  <input 
                    type="checkbox" 
                    checked={departureForm.isSupportBoatRequired} 
                    onChange={e => setDepartureForm({...departureForm, isSupportBoatRequired: e.target.checked})}
                    className="w-5 h-5 accent-[#ffb519]"
                  />
                  <span className="text-[10px] font-black uppercase text-slate-700 tracking-widest">Enable Support Vessel</span>
                </label>
              </div>

              {departureForm.isSupportBoatRequired && (
                <div className="space-y-6 pt-6 animate-in fade-in duration-300">
                  <h4 className="text-xs font-black uppercase text-slate-400 tracking-widest">Support Fleet Assignment</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase text-slate-400">Support Boat</label>
                      <select value={departureForm.supportBoatId} onChange={e => setDepartureForm({...departureForm, supportBoatId: e.target.value})} className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 font-black text-xs outline-none">
                        <option value="">Select Asset...</option>
                        {(data?.boats || []).filter(b => b.id !== departureForm.boatId).map(b => <option key={b.id} value={b.id}>{b.boatname}</option>)}
                      </select>
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase text-slate-400">Support Captain</label>
                      <select value={departureForm.supportCaptainId} onChange={e => setDepartureForm({...departureForm, supportCaptainId: e.target.value})} className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 font-black text-xs outline-none">
                        <option value="">Select Captain...</option>
                        {activePersonnel.filter(p => (String(p.role || '').includes('Capitan') || String(p.role || '').includes('Commodore')) && p.id !== departureForm.captainId).map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                      </select>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase text-slate-400">Support Mates (All Staff Eligible)</label>
                    <div className="w-full bg-white border border-slate-200 rounded-xl p-4 space-y-2 max-h-40 overflow-y-auto custom-scrollbar">
                      {activePersonnel.map(p => (
                        <label key={`support_${p.id}`} className="flex items-center space-x-3 cursor-pointer group">
                          <input 
                            type="checkbox" 
                            checked={departureForm.supportMates.includes(p.id)} 
                            onChange={() => toggleMate(p.id, 'support')}
                            className="w-4 h-4 rounded accent-blue-600" 
                          />
                          <span className={`text-xs font-bold transition-colors ${departureForm.supportMates.includes(p.id) ? 'text-blue-600 font-black' : 'text-slate-500 group-hover:text-slate-700'}`}>
                            {p.name}
                          </span>
                        </label>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
            <button type="submit" className="w-full py-6 rounded-3xl font-black text-2xl text-white shadow-xl transition-all hover:scale-[1.01] active:scale-95" style={{ backgroundColor: PANGEA_DARK }}>Dispatch Vessels</button>
          </div>

          <div className="space-y-8">
            <div className="bg-white p-6 md:p-10 rounded-[2.5rem] border border-slate-100 shadow-sm space-y-8">
               <h3 className="text-xl font-black">Provisioning (Departure)</h3>
               <div className="space-y-8">
                 <div className="space-y-4">
                   <p className="text-[9px] font-black uppercase text-amber-600 tracking-widest">Primary Vessel Stock</p>
                   <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                    {departureForm.provisions.map((prov, i) => (
                      <div key={prov.item} className="p-4 bg-slate-50 rounded-2xl border border-slate-100 text-center space-y-2">
                        <span className="text-[9px] font-black uppercase text-slate-400 block truncate" title={prov.item}>{prov.item}</span>
                        <input type="number" value={prov.departureQty} onChange={e => {
                            const newProvs = [...departureForm.provisions];
                            newProvs[i].departureQty = parseInt(e.target.value) || 0;
                            setDepartureForm({...departureForm, provisions: newProvs});
                          }} className="w-full bg-white border border-slate-200 rounded-xl px-2 py-2 text-center font-black text-sm outline-none" />
                      </div>
                    ))}
                  </div>
                 </div>

                 {departureForm.isSupportBoatRequired && (
                   <div className="space-y-4 pt-6 border-t border-slate-100 animate-in slide-in-from-right duration-300">
                     <p className="text-[9px] font-black uppercase text-blue-600 tracking-widest">Support Vessel Stock</p>
                     <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                      {departureForm.supportProvisions.map((prov, i) => (
                        <div key={`support_stock_${prov.item}`} className="p-4 bg-blue-50/50 rounded-2xl border border-blue-100 text-center space-y-2">
                          <span className="text-[9px] font-black uppercase text-blue-400 block truncate" title={prov.item}>{prov.item}</span>
                          <input type="number" value={prov.departureQty} onChange={e => {
                              const newProvs = [...departureForm.supportProvisions];
                              newProvs[i].departureQty = parseInt(e.target.value) || 0;
                              setDepartureForm({...departureForm, supportProvisions: newProvs});
                            }} className="w-full bg-white border border-blue-200 rounded-xl px-2 py-2 text-center font-black text-sm outline-none" />
                        </div>
                      ))}
                    </div>
                   </div>
                 )}
               </div>
            </div>
          </div>
        </form>
      )}

      {activeMode === 'Safety' && (
        <div className="max-w-2xl mx-auto bg-white p-6 md:p-10 rounded-[2.5rem] shadow-xl border border-slate-100 space-y-8 animate-in fade-in duration-500 relative">
           <div className="absolute top-8 right-10 text-right bg-[#ffb519]/10 p-4 rounded-3xl border border-[#ffb519]/20 shadow-sm">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">Safety Audit Log</p>
              <p className="text-xs font-black text-slate-700 mt-1">{new Date().toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}</p>
              <p className="text-xl font-black text-[#ffb519] leading-none mt-1">{new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
           </div>

           <h3 className="text-2xl font-black flex items-center gap-3">
             <span className="text-[#ffb519]">🛡️</span> Safety Verification
           </h3>

           <div className="space-y-2 pt-4">
              <label className="text-[10px] font-black uppercase text-slate-400">Target Vessel Selection</label>
              <select 
                value={departureForm.boatId} 
                onChange={e => setDepartureForm({...departureForm, boatId: e.target.value})}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-6 py-4 font-black text-sm outline-none"
              >
                <option value="">Choose Vessel for Inspection...</option>
                {(data?.boats || []).map(b => <option key={b.id} value={b.id}>{b.boatname}</option>)}
              </select>
           </div>

           <div className="grid grid-cols-1 gap-4 mt-6">
             {[
               { id: 'bilgeDry', label: 'Bilge is Dry / No Water' },
               { id: 'engineOilSteeringOk', label: 'Engine Oil & Steering Checked' },
               { id: 'propellersClear', label: 'Propellers Clear of Debris' },
               { id: 'lifeJacketsCountOk', label: 'Life Jackets Count (PAX + Crew)' },
               { id: 'fuelLevelSufficient', label: 'Fuel Level matches Log' },
               { id: 'electronicsOperational', label: 'Radio/GPS Operational' },
               { id: 'coolingTelltaleActive', label: 'Cooling Telltale Active' },
               { id: 'anchorLineSecure', label: 'Anchor & Line Secure' },
               { id: 'firstAidOnboard', label: 'First Aid Kit Onboard' }
             ].map(item => (
               <label key={item.id} className="flex items-center space-x-4 p-4 bg-slate-50 rounded-2xl cursor-pointer hover:bg-slate-100 transition-colors">
                 <input 
                  type="checkbox" 
                  checked={(verificationForm as any)[item.id]} 
                  onChange={e => setVerificationForm({...verificationForm, [item.id]: e.target.checked})}
                  className="w-6 h-6 accent-[#ffb519]"
                 />
                 <span className="text-sm font-black uppercase text-slate-700">{item.label}</span>
               </label>
             ))}
           </div>
           <div className="space-y-4 pt-6 border-t border-slate-100">
             <label className="text-[10px] font-black uppercase text-slate-400">Captain's Signature (Print Name)</label>
             <input 
              type="text" 
              value={verificationForm.captainSignature} 
              onChange={e => setVerificationForm({...verificationForm, captainSignature: e.target.value})} 
              className="w-full bg-slate-50 border-b-2 border-slate-200 p-6 font-black text-2xl italic outline-none focus:border-[#ffb519]" 
              placeholder="Full Name as Signature"
             />
           </div>
           <button onClick={() => setActiveMode('Log')} className="w-full py-4 bg-slate-800 text-white rounded-2xl font-black uppercase text-sm shadow-xl">Save & Return to Log</button>
        </div>
      )}

      {activeMode === 'Arrival' && (
        <div className="max-w-6xl mx-auto space-y-12 animate-in slide-in-from-bottom-6 duration-500">
          <form onSubmit={handleArrivalSubmit} className="bg-white p-8 md:p-12 rounded-[3.5rem] shadow-2xl border border-slate-100 space-y-10">
            <div className="flex flex-col md:flex-row justify-between items-center gap-6">
              <h3 className="text-2xl md:text-3xl font-black text-center md:text-left">Trip Reconciliation</h3>
              <select value={selectedTourId || ''} onChange={e => {
                const tourId = e.target.value;
                setSelectedTourId(tourId);
                const tour = (data?.tours || []).find(t => t.id === tourId);
                if (tour) {
                   setArrivalForm(prev => ({
                     ...prev,
                     provisions: tour.provisions.map(p => ({ ...p, arrivalQty: 0 })),
                     supportProvisions: tour.supportProvisions?.map(p => ({ ...p, arrivalQty: 0 })) || prev.supportProvisions
                   }));
                }
              }} className="w-full md:w-auto bg-slate-50 border border-slate-100 rounded-2xl px-6 py-4 font-black text-sm outline-none min-w-[300px]">
                  <option value="">Select Dispatched Tour...</option>
                  {(data?.tours || []).filter(t => t.status === 'Dispatched').map(t => <option key={t.id} value={t.id}>{(data?.boats || []).find(b => b.id === t.boatId)?.boatname} - {t.departureTime}</option>)}
              </select>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
              <div className="space-y-8">
                 <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-[10px] font-black uppercase text-slate-400">Arrival Time</label>
                      <input type="time" value={arrivalForm.time} onChange={e => setArrivalForm({...arrivalForm, time: e.target.value})} className="w-full bg-slate-50 rounded-xl p-4 font-black border-none" />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-black uppercase text-slate-400">Ending Gas (Pts)</label>
                      <input type="number" step="0.1" value={arrivalForm.endGas} onChange={e => setArrivalForm({...arrivalForm, endGas: parseFloat(e.target.value) || 0})} className="w-full bg-amber-50 rounded-xl p-4 font-black border-none" />
                    </div>
                 </div>
                 <div className="grid grid-cols-3 gap-2">
                    <div className="space-y-1">
                      <label className="text-[8px] font-black uppercase text-slate-400">HMI End</label>
                      <input type="number" step="0.1" value={arrivalForm.hmiEnd} onChange={e => setArrivalForm({...arrivalForm, hmiEnd: parseFloat(e.target.value) || 0})} className="w-full bg-slate-50 rounded-lg p-2 font-black border-none" />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[8px] font-black uppercase text-slate-400">HMD End</label>
                      <input type="number" step="0.1" value={arrivalForm.hmdEnd} onChange={e => setArrivalForm({...arrivalForm, hmdEnd: parseFloat(e.target.value) || 0})} className="w-full bg-slate-50 rounded-lg p-2 font-black border-none" />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[8px] font-black uppercase text-slate-400">HMC End</label>
                      <input type="number" step="0.1" value={arrivalForm.hmcEnd} onChange={e => setArrivalForm({...arrivalForm, hmcEnd: parseFloat(e.target.value) || 0})} className="w-full bg-slate-50 rounded-lg p-2 font-black border-none" />
                    </div>
                 </div>
                 <div className="space-y-4">
                    <label className="text-[10px] font-black uppercase text-slate-400">Post-Trip Cleaning Checklist</label>
                    <div className="grid grid-cols-2 gap-2">
                      {['trash', 'washed', 'gear', 'lostFound'].map(key => (
                        <label key={key} className="flex items-center space-x-3 p-3 bg-slate-50 rounded-xl cursor-pointer hover:bg-slate-100 transition-colors">
                          <input 
                            type="checkbox" 
                            checked={(arrivalForm.postTripChecklist as any)[key]} 
                            onChange={e => setArrivalForm({...arrivalForm, postTripChecklist: {...arrivalForm.postTripChecklist, [key]: e.target.checked}})}
                            className="w-5 h-5 accent-[#ffb519]"
                          />
                          <span className="text-[10px] font-black uppercase truncate">{key}</span>
                        </label>
                      ))}
                    </div>
                 </div>
              </div>

              <div className="space-y-8">
                 <div className="bg-slate-50 p-6 rounded-3xl space-y-4 border border-slate-100">
                   <h4 className="text-[10px] font-black uppercase text-amber-600 tracking-widest">Stock Reconciliation</h4>
                   <div className="grid grid-cols-1 gap-3 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                     {arrivalForm.provisions.filter(p => p.departureQty > 0).map((prov, i) => (
                       <div key={`arrival_prov_${prov.item}`} className="flex flex-col sm:flex-row items-start sm:items-center justify-between bg-white p-4 rounded-2xl border border-slate-100 shadow-sm gap-4">
                         <div className="flex flex-col min-w-0 flex-1">
                           <span className="text-[10px] font-black uppercase text-slate-800 truncate" title={prov.item}>{prov.item}</span>
                           <div className="flex gap-4 mt-1">
                             <span className="text-[9px] font-bold text-slate-400 uppercase">Out: <span className="text-slate-900">{prov.departureQty}</span></span>
                             <span className="text-[9px] font-black text-amber-600 uppercase">Used: <span className="text-amber-700">{prov.departureQty - prov.arrivalQty}</span></span>
                           </div>
                         </div>
                         <div className="flex flex-row sm:flex-col items-center justify-between w-full sm:w-16 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-50">
                            <label className="text-[8px] font-black uppercase text-slate-300 sm:block">Leftover</label>
                            <input 
                              type="number" 
                              min="0" 
                              max={prov.departureQty}
                              value={prov.arrivalQty} 
                              onChange={e => {
                                const newProvs = [...arrivalForm.provisions];
                                const idx = newProvs.findIndex(x => x.item === prov.item);
                                newProvs[idx].arrivalQty = parseInt(e.target.value) || 0;
                                setArrivalForm({...arrivalForm, provisions: newProvs});
                              }} 
                              className="w-16 bg-slate-50 border-none rounded-xl text-center font-black text-sm p-2 outline-none focus:ring-2 focus:ring-[#ffb519]"
                            />
                         </div>
                       </div>
                     ))}
                   </div>
                   
                   {data?.tours?.find(t => t.id === selectedTourId)?.isSupportBoatRequired && (
                     <div className="pt-4 border-t border-slate-200">
                       <p className="text-[9px] font-black uppercase text-blue-500 mb-2">Support Vessel Stock</p>
                       <div className="grid grid-cols-1 gap-3 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                        {arrivalForm.supportProvisions.filter(p => p.departureQty > 0).map((prov, i) => (
                          <div key={`arrival_support_prov_${prov.item}`} className="flex flex-col sm:flex-row items-start sm:items-center justify-between bg-blue-50/30 p-4 rounded-2xl border border-blue-100 shadow-sm gap-4">
                            <div className="flex flex-col min-w-0 flex-1">
                              <span className="text-[10px] font-black uppercase text-blue-800 truncate" title={prov.item}>{prov.item}</span>
                              <div className="flex gap-4 mt-1">
                                <span className="text-[9px] font-bold text-blue-400 uppercase">Out: <span className="text-blue-900">{prov.departureQty}</span></span>
                                <span className="text-[9px] font-black text-blue-600 uppercase">Used: <span className="text-blue-700">{prov.departureQty - prov.arrivalQty}</span></span>
                              </div>
                            </div>
                            <div className="flex flex-row sm:flex-col items-center justify-between w-full sm:w-16 pt-2 sm:pt-0 border-t sm:border-t-0 border-blue-100">
                               <label className="text-[8px] font-black uppercase text-blue-300 sm:block">Leftover</label>
                               <input 
                                 type="number" 
                                 min="0" 
                                 max={prov.departureQty}
                                 value={prov.arrivalQty} 
                                 onChange={e => {
                                   const newProvs = [...arrivalForm.supportProvisions];
                                   const idx = newProvs.findIndex(x => x.item === prov.item);
                                   newProvs[idx].arrivalQty = parseInt(e.target.value) || 0;
                                   setArrivalForm({...arrivalForm, supportProvisions: newProvs});
                                 }} 
                                 className="w-16 bg-white border-none rounded-xl text-center font-black text-sm p-2 outline-none focus:ring-2 focus:ring-blue-400"
                               />
                            </div>
                          </div>
                        ))}
                      </div>
                     </div>
                   )}
                 </div>

                 <div className="space-y-2">
                   <label className="text-[10px] font-black uppercase text-slate-400">Maintenance & Arrival Notes</label>
                   <textarea value={arrivalForm.arrivalNotes} onChange={e => setArrivalForm({...arrivalForm, arrivalNotes: e.target.value})} className="w-full h-24 bg-slate-50 rounded-[1.5rem] p-4 font-bold outline-none border-none resize-none" placeholder="Report any damage or issues here..."></textarea>
                   <button type="submit" className="w-full py-6 rounded-[2.5rem] font-black text-2xl text-white shadow-xl hover:scale-[1.01] active:scale-95 transition-all" style={{ backgroundColor: PANGEA_YELLOW }}>Finalize Trip Log</button>
                 </div>
              </div>
            </div>
          </form>

          <div className="bg-slate-50 p-6 md:p-10 rounded-[3.5rem] border border-slate-200 space-y-8">
            <h3 className="text-2xl font-black text-slate-800">Trip Report Archive</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
               {(data?.tours || []).filter(t => t.status === 'Completed').slice(-6).reverse().map(tour => (
                 <div key={tour.id} className="bg-white p-6 rounded-3xl border border-slate-200 flex justify-between items-center shadow-sm hover:shadow-md transition-shadow">
                    <div className="min-w-0 flex-1">
                      <h4 className="font-black text-slate-800 truncate">{tour.route}</h4>
                      <p className="text-[9px] font-bold text-amber-600 uppercase">{(data?.boats || []).find(b => b.id === tour.boatId)?.boatname} - {tour.date}</p>
                    </div>
                    <button onClick={() => generateTripReport(tour)} className="ml-4 bg-slate-800 text-white px-4 py-2 rounded-xl text-[9px] font-black uppercase hover:bg-black transition-all">
                      <span>📄 Report</span>
                    </button>
                 </div>
               ))}
            </div>
          </div>
        </div>
      )}

      {activeMode === 'Encounter' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-in fade-in duration-500">
           <div className="lg:col-span-1 bg-white p-8 md:p-10 rounded-[3rem] shadow-xl border border-slate-100 space-y-8">
              <h3 className="text-2xl font-black">Log Encounter</h3>
              <form onSubmit={handleEncounterSubmit} className="space-y-6">
                 <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase text-slate-400">Species</label>
                    <select value={encounterForm.species} onChange={e => setEncounterForm({...encounterForm, species: e.target.value})} className="w-full bg-slate-50 rounded-xl p-4 font-black">
                       <option value="Dolphins">Dolphins</option>
                       <option value="Whales">Whales</option>
                       <option value="Turtles">Turtles</option>
                       <option value="Manatees">Manatees</option>
                       <option value="Sloths">Sloths</option>
                       <option value="Manta Rays">Manta Rays</option>
                       <option value="Other">Other Species</option>
                    </select>
                 </div>
                 {encounterForm.species === 'Other' && (
                    <input type="text" placeholder="Species Name" value={encounterForm.otherSpeciesName} onChange={e => setEncounterForm({...encounterForm, otherSpeciesName: e.target.value})} className="w-full bg-slate-50 rounded-xl p-4 font-black" />
                 )}
                 <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                       <label className="text-[10px] font-black uppercase text-slate-400">Duration (Min)</label>
                       <input type="number" value={encounterForm.observationTime} onChange={e => setEncounterForm({...encounterForm, observationTime: parseInt(e.target.value) || 0})} className="w-full bg-slate-50 rounded-xl p-4 font-black" />
                    </div>
                    <div className="space-y-1">
                       <label className="text-[10px] font-black uppercase text-slate-400">Min Distance (m)</label>
                       <input type="number" value={encounterForm.minDistance} onChange={e => setEncounterForm({...encounterForm, minDistance: parseInt(e.target.value) || 0})} className="w-full bg-slate-50 rounded-xl p-4 font-black" />
                    </div>
                 </div>
                 <label className="flex items-center space-x-4 p-4 bg-green-50 text-green-700 rounded-2xl cursor-pointer font-black text-xs uppercase">
                    <input type="checkbox" checked={encounterForm.compliance} onChange={e => setEncounterForm({...encounterForm, compliance: e.target.checked})} className="w-6 h-6 accent-green-600" />
                    <span>Compliance Protocol Followed</span>
                 </label>
                 <textarea value={encounterForm.notes} onChange={e => setEncounterForm({...encounterForm, notes: e.target.value})} className="w-full h-24 bg-slate-50 rounded-2xl p-4 font-bold outline-none border-none resize-none" placeholder="Observation notes..."></textarea>
                 <button type="submit" className="w-full py-4 bg-[#ffb519] text-white rounded-2xl font-black uppercase shadow-lg">Save Encounter</button>
              </form>
           </div>
           
           <div className="lg:col-span-2 space-y-8">
              <div className="flex flex-col sm:flex-row justify-between items-center bg-white p-6 rounded-[2rem] border border-slate-100 gap-4">
                 <h4 className="text-xl font-black text-slate-800">Recent Observations</h4>
                 <select value={selectedTourId || ''} onChange={e => setSelectedTourId(e.target.value)} className="w-full sm:w-auto bg-slate-50 border border-slate-100 rounded-xl px-4 py-2 font-black text-xs">
                    <option value="">Filter by Active Tour...</option>
                    {(data?.tours || []).filter(t => t.status === 'Dispatched').map(t => <option key={t.id} value={t.id}>{(data?.boats || []).find(b => b.id === t.boatId)?.boatname}</option>)}
                 </select>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                 {(data?.tours?.find(t => t.id === selectedTourId)?.encounters || []).map((enc, i) => (
                    <div key={i} className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm space-y-4">
                       <div className="flex justify-between items-center">
                          <span className="bg-amber-100 text-amber-700 px-3 py-1 rounded-full text-[10px] font-black uppercase">{enc.species}</span>
                          <span className={enc.compliance ? 'text-green-500' : 'text-red-500'}>{enc.compliance ? '✅ Compliant' : '❌ Warning'}</span>
                       </div>
                       <p className="font-black text-sm text-slate-800">{enc.notes || 'No detailed notes recorded.'}</p>
                       <div className="flex justify-between text-[10px] font-black text-slate-400 uppercase">
                          <span>{enc.observationTime} Minutes</span>
                          <span>{enc.minDistance} Meters</span>
                       </div>
                    </div>
                 ))}
              </div>
           </div>
        </div>
      )}
    </div>
  );
};

export default TourLogForm;
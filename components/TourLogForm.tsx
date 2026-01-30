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
          category: (['Drinks', 'Snacks', 'Equipment'].includes(i.category) ? i.category : 'Equipment') as any,
          stock: (i as any).quantityLeft !== undefined ? (i as any).quantityLeft : i.currentStock
        }));
    }
    return INITIAL_PROVISIONS.filter(i => !['Mechanical', 'Dock', 'Vessel Gear'].includes((i.category as any))).map(i => ({...i, stock: 0}));
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
    const existingTour = (data?.tours || []).find(t => t.id === selectedTourId || t.airtableRecordId === selectedTourId);
    if (!existingTour) return alert("Original tour record not found.");
    const rawProvs = Array.isArray(existingTour.provisions) ? existingTour.provisions : [];
    const rawSupportProvs = Array.isArray(existingTour.supportProvisions) ? existingTour.supportProvisions : [];

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
        const depProv = rawProvs.find(dp => dp.item === p.item);
        return { ...p, departureQty: depProv?.departureQty || 0 };
      }) as ProvisionStock[],
      supportProvisions: arrivalForm.supportProvisions.map(p => {
        const depProv = rawSupportProvs.find(dp => dp.item === p.item);
        return { ...p, departureQty: depProv?.departureQty || 0 };
      }) as ProvisionStock[]
    };
    onUpdateTour(selectedTourId, updates);
    alert("Trip completion recorded. Vessel cleared and inventory updated.");
  };

  const generateTripReport = (tour: Tour) => {
    const doc = new jsPDF();
    const boatName = data.boats.find(b => b.id === tour.boatId || b.airtableRecordId === tour.boatId)?.boatname || 'Unknown Boat';
    const captainName = data.personnel.find(p => p.id === tour.captainId || p.airtableRecordId === tour.captainId)?.name || 'Unknown Captain';
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
    doc.save(`Pangea_TripReport_${tour.id}.pdf`);
  };

  const handleEncounterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTourId) return alert("Select an active tour.");
    const finalSpecies = encounterForm.species === 'Other' ? encounterForm.otherSpeciesName : encounterForm.species;
    const currentTour = data.tours.find(t => t.id === selectedTourId || t.airtableRecordId === selectedTourId);
    const encounters = Array.isArray(currentTour?.encounters) ? currentTour.encounters : [];
    const updates: Partial<Tour> = {
      encounters: [...encounters, {
        species: finalSpecies,
        observationTime: encounterForm.observationTime,
        minDistance: encounterForm.minDistance,
        compliance: encounterForm.compliance,
        notes: encounterForm.notes
      } as WildlifeEncounter]
    };
    onUpdateTour(selectedTourId!, updates);
    alert("Wildlife encounter logged.");
    setEncounterForm({ species: 'Dolphins', otherSpeciesName: '', observationTime: 0, minDistance: 0, compliance: true, notes: '' });
  };

  const toggleMate = (mateId: string, type: 'primary' | 'support') => {
    const target = type === 'primary' ? 'mates' : 'supportMates';
    const current = (departureForm as any)[target];
    if (current.includes(mateId)) {
      setDepartureForm({ ...departureForm, [target]: current.filter((id: string) => id !== mateId) });
    } else if (current.length < 5) {
      setDepartureForm({ ...departureForm, [target]: [...current, mateId] });
    }
  };

  // Improved case-insensitive filter to ensure Airtable sync variations are captured
  const dispatchedTours = useMemo(() => 
    (data?.tours || []).filter(t => t.status?.toLowerCase() === 'dispatched').reverse()
  , [data?.tours]);

  return (
    <div className="space-y-8 pb-20">
      <div className="flex space-x-4 border-b border-slate-100 pb-4 overflow-x-auto no-scrollbar">
        {[
          { id: 'Log', label: '🛫 Departure Log' },
          { id: 'Safety', label: '🛡️ Safety Verification' },
          { id: 'Arrival', label: '🛬 Arrival & Fuel' },
          { id: 'Encounter', label: '🐬 Wildlife Log' }
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
                    {(data?.boats || []).map(b => <option key={b.id} value={b.airtableRecordId || b.id}>{b.boatname}</option>)}
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase text-slate-400">Captain</label>
                  <select value={departureForm.captainId} onChange={e => setDepartureForm({...departureForm, captainId: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 font-black text-sm outline-none">
                    <option value="">Select Captain...</option>
                    {activePersonnel.filter(p => String(p.role || '').includes('Capitan') || String(p.role || '').includes('Commodore')).map(p => <option key={p.id} value={p.airtableRecordId || p.id}>{p.name}</option>)}
                  </select>
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase text-slate-400">Mates / Crew</label>
                <div className="w-full bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-2 max-h-48 overflow-y-auto custom-scrollbar">
                  {activePersonnel.map(p => (
                    <label key={p.id} className="flex items-center space-x-3 cursor-pointer group">
                      <input type="checkbox" checked={departureForm.mates.includes(p.airtableRecordId || p.id)} onChange={() => toggleMate(p.airtableRecordId || p.id, 'primary')} className="w-4 h-4 rounded accent-[#ffb519]" />
                      <span className={`text-xs font-bold ${departureForm.mates.includes(p.airtableRecordId || p.id) ? 'text-amber-600 font-black' : 'text-slate-500'}`}>{p.name}</span>
                    </label>
                  ))}
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2"><label className="text-[10px] font-black uppercase text-slate-400">PAX Count</label><input type="number" value={departureForm.paxCount} onChange={e => setDepartureForm({...departureForm, paxCount: parseInt(e.target.value) || 0})} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 font-black text-sm outline-none" /></div>
                <div className="space-y-2"><label className="text-[10px] font-black uppercase text-slate-400">Starting Gas</label><input type="number" step="0.1" value={departureForm.startGas} onChange={e => setDepartureForm({...departureForm, startGas: parseFloat(e.target.value) || 0})} className="w-full bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 font-black text-sm outline-none" /></div>
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
            </div>
            <button type="submit" className="w-full py-6 rounded-3xl font-black text-2xl text-white shadow-xl transition-all hover:scale-[1.01]" style={{ backgroundColor: PANGEA_DARK }}>Dispatch Vessels</button>
          </div>

          <div className="space-y-8">
            <div className="bg-white p-6 md:p-10 rounded-[2.5rem] border border-slate-100 shadow-sm space-y-8">
               <h3 className="text-xl font-black">Provisioning (Departure)</h3>
               <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
                {departureForm.provisions.map((prov, i) => (
                  <div key={prov.item} className="p-4 bg-slate-50 rounded-2xl border border-slate-100 text-center space-y-2 relative">
                    <span className={`absolute top-2 right-2 text-[7px] font-black uppercase px-1.5 py-0.5 rounded-full ${prov.stock <= 5 ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-600'}`}>
                      {prov.stock} In Stock
                    </span>
                    <span className="text-[9px] font-black uppercase text-slate-400 block truncate pt-2" title={prov.item}>{prov.item}</span>
                    <input type="number" value={prov.departureQty} onChange={e => {
                        const newProvs = [...departureForm.provisions];
                        newProvs[i].departureQty = parseInt(e.target.value) || 0;
                        setDepartureForm({...departureForm, provisions: newProvs});
                      }} className="w-full bg-white border border-slate-200 rounded-xl px-2 py-2 text-center font-black text-sm outline-none" />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </form>
      )}

      {activeMode === 'Arrival' && (
        <div className="max-w-6xl mx-auto space-y-12 animate-in slide-in-from-bottom-6 duration-500">
          <form onSubmit={handleArrivalSubmit} className="bg-white p-8 md:p-12 rounded-[3.5rem] shadow-2xl border border-slate-100 space-y-10">
            <div className="flex flex-col md:flex-row justify-between items-center gap-6">
              <h3 className="text-2xl md:text-3xl font-black">Trip Reconciliation</h3>
              <select value={selectedTourId || ''} onChange={e => {
                const tourId = e.target.value;
                setSelectedTourId(tourId);
                const tour = (data?.tours || []).find(t => t.id === tourId || t.airtableRecordId === tourId);
                if (tour) {
                   const rawProvs = Array.isArray(tour.provisions) ? tour.provisions : [];
                   setArrivalForm(prev => ({
                     ...prev,
                     provisions: rawProvs.map(p => ({ 
                       ...p, 
                       arrivalQty: 0,
                       stock: provisionList.find(x => x.item === p.item)?.stock || 0
                     })),
                   }));
                }
              }} className="w-full md:w-auto bg-slate-50 border border-slate-100 rounded-2xl px-6 py-4 font-black text-sm outline-none min-w-[300px]">
                  <option value="">Select Dispatched Tour...</option>
                  {dispatchedTours.map(t => <option key={t.id} value={t.airtableRecordId || t.id}>{(data?.boats || []).find(b => b.id === t.boatId || b.airtableRecordId === t.boatId)?.boatname} - {t.departureTime}</option>)}
              </select>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
              <div className="space-y-8">
                 <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-[10px] font-black uppercase text-slate-400">Arrival Time</label>
                      <input type="time" value={arrivalForm.time} onChange={e => setArrivalForm({...arrivalForm, time: e.target.value})} className="w-full bg-slate-50 rounded-xl p-4 font-black" />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-black uppercase text-slate-400">Ending Gas</label>
                      <input type="number" step="0.1" value={arrivalForm.endGas} onChange={e => setArrivalForm({...arrivalForm, endGas: parseFloat(e.target.value) || 0})} className="w-full bg-amber-50 rounded-xl p-4 font-black" />
                    </div>
                 </div>
                 <div className="space-y-4">
                    <label className="text-[10px] font-black uppercase text-slate-400">Post-Trip Checklist</label>
                    <div className="grid grid-cols-2 gap-2">
                      {['trash', 'washed', 'gear', 'lostFound'].map(key => (
                        <label key={key} className="flex items-center space-x-3 p-3 bg-slate-50 rounded-xl cursor-pointer">
                          <input type="checkbox" checked={(arrivalForm.postTripChecklist as any)[key]} onChange={e => setArrivalForm({...arrivalForm, postTripChecklist: {...arrivalForm.postTripChecklist, [key]: e.target.checked}})} className="w-5 h-5 accent-[#ffb519]" />
                          <span className="text-[10px] font-black uppercase">{key}</span>
                        </label>
                      ))}
                    </div>
                 </div>
              </div>

              <div className="space-y-8">
                 <div className="bg-slate-50 p-6 rounded-3xl space-y-4 border border-slate-100">
                   <h4 className="text-[10px] font-black uppercase text-amber-600 tracking-widest">Stock Reconciliation</h4>
                   <div className="grid grid-cols-1 gap-3 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                     {(Array.isArray(arrivalForm.provisions) ? arrivalForm.provisions : []).filter(p => (p.departureQty || 0) > 0).map((prov, i) => (
                       <div key={`arrival_prov_${prov.item}`} className="flex items-center justify-between bg-white p-4 rounded-2xl border border-slate-100 shadow-sm gap-4">
                         <div className="flex-1 min-w-0">
                           <span className="text-[10px] font-black uppercase text-slate-800 truncate" title={prov.item}>{prov.item}</span>
                           <div className="flex gap-4 mt-1">
                             <span className="text-[9px] font-bold text-slate-400">OUT: {prov.departureQty}</span>
                             <span className="text-[9px] font-black text-amber-600 uppercase">USED: {prov.departureQty - prov.arrivalQty}</span>
                           </div>
                         </div>
                         <div className="flex items-center gap-2">
                            <label className="text-[8px] font-black uppercase text-slate-300">Leftover</label>
                            <input type="number" min="0" max={prov.departureQty} value={prov.arrivalQty} onChange={e => {
                                const newProvs = [...arrivalForm.provisions];
                                const idx = newProvs.findIndex(x => x.item === prov.item);
                                if (idx !== -1) {
                                  newProvs[idx].arrivalQty = parseInt(e.target.value) || 0;
                                  setArrivalForm({...arrivalForm, provisions: newProvs});
                                }
                              }} className="w-16 bg-slate-50 border-none rounded-xl text-center font-black text-sm p-2" />
                         </div>
                       </div>
                     ))}
                   </div>
                   <button type="submit" className="w-full py-6 rounded-[2.5rem] font-black text-2xl text-white shadow-xl" style={{ backgroundColor: PANGEA_YELLOW }}>Finalize Trip Log</button>
                 </div>
              </div>
            </div>
          </form>

          {/* Active Logs Section - VISIBLE BEFORE COMPLETION */}
          <div className="bg-amber-50/50 p-8 md:p-12 rounded-[3.5rem] border border-amber-100 space-y-8">
            <h3 className="text-2xl font-black text-amber-800">Active Mission Tracking</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
               {dispatchedTours.length === 0 ? (
                 <div className="col-span-full py-10 text-center text-slate-400 italic">No active missions to track.</div>
               ) : (
                 dispatchedTours.map(tour => (
                   <div key={tour.id} className="bg-white p-6 rounded-3xl border border-amber-200 shadow-sm flex flex-col justify-between">
                     <div className="space-y-2">
                       <div className="flex justify-between items-start">
                         <span className="bg-amber-600 text-white text-[8px] font-black uppercase px-2 py-0.5 rounded-full">IN MISSION</span>
                         <span className="text-[10px] font-black text-slate-400 uppercase">{tour.departureTime}</span>
                       </div>
                       <h4 className="font-black text-slate-900 leading-tight">{(data?.boats || []).find(b => b.id === tour.boatId || b.airtableRecordId === tour.boatId)?.boatname}</h4>
                       <p className="text-[10px] font-bold text-amber-600 uppercase tracking-widest">{tour.route}</p>
                       <p className="text-[10px] text-slate-500 font-bold">Captain: {(data?.personnel || []).find(p => p.id === tour.captainId || p.airtableRecordId === tour.captainId)?.name || 'Unknown'}</p>
                     </div>
                     <button 
                        onClick={() => {
                          setSelectedTourId(tour.airtableRecordId || tour.id);
                          window.scrollTo({ top: 0, behavior: 'smooth' });
                        }}
                        className="mt-4 w-full py-3 bg-amber-100 text-amber-700 rounded-xl font-black text-[10px] uppercase hover:bg-amber-600 hover:text-white transition-all"
                     >
                       Open Reconciliation
                     </button>
                   </div>
                 ))
               )}
            </div>
          </div>

          <div className="bg-slate-50 p-8 md:p-12 rounded-[3.5rem] border border-slate-200 space-y-8">
            <h3 className="text-2xl font-black text-slate-800">Trip Report Archive</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
               {(data?.tours || []).filter(t => t.status?.toLowerCase() === 'completed').slice(-9).reverse().map(tour => (
                 <div key={tour.id} className="bg-white p-6 rounded-3xl border border-slate-200 flex justify-between items-center shadow-sm hover:shadow-md transition-shadow">
                    <div className="min-w-0 flex-1">
                      <h4 className="font-black text-slate-800 truncate">{tour.route}</h4>
                      <p className="text-[9px] font-bold text-amber-600 uppercase">{(data?.boats || []).find(b => b.id === tour.boatId || b.airtableRecordId === tour.boatId)?.boatname} - {tour.date}</p>
                    </div>
                    <button onClick={() => generateTripReport(tour)} className="ml-4 bg-slate-800 text-white px-4 py-2 rounded-xl text-[9px] font-black uppercase hover:bg-black transition-all">
                      <span>📄 PDF</span>
                    </button>
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
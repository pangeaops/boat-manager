
import React, { useState, useMemo } from 'react';
import { AppData, Tour, ProvisionStock, WildlifeEncounter, PostTripChecklist, PreDepartureVerification } from '../types';
import { PANGEA_YELLOW, PANGEA_DARK, TOUR_TYPES, TOUR_ROUTES, INITIAL_PROVISIONS } from '../constants';
import { generateTourPDF, sendEmailReport } from '../services/reportService';

interface TourLogFormProps {
  data: AppData;
  onAddTour: (tour: Tour) => void;
  onUpdateTour: (tourId: string, updates: Partial<Tour>) => void;
}

const TourLogForm: React.FC<TourLogFormProps> = ({ data, onAddTour, onUpdateTour }) => {
  const [activeMode, setActiveMode] = useState<'Log' | 'Safety' | 'Arrival' | 'Encounter'>('Log');
  const [selectedTourId, setSelectedTourId] = useState<string | null>(null);

  const activePersonnel = useMemo(() => data.personnel.filter(p => p.isActive !== false), [data.personnel]);
  const provisionList = useMemo(() => [
    ...INITIAL_PROVISIONS,
    { item: 'Other 1', category: 'Equipment' as const },
    { item: 'Other 2', category: 'Equipment' as const }
  ], []);

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

  const isTransfer = departureForm.tourType === 'Boat Transfer' || departureForm.tourType === 'Boat Hotel Transfer';

  const handleDispatch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!departureForm.boatId || !departureForm.captainId) return alert("Select Boat and Captain");
    if (departureForm.paxCount === 0) return alert("Please enter the Customer Count (PAX)!");
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

  const handleSendReport = (tour: Tour) => {
    const boat = data.boats.find(b => b.id === tour.boatId);
    const captain = data.personnel.find(p => p.id === tour.captainId);
    const pdf = generateTourPDF(tour, boat, captain);
    pdf.save(`Pangea_Trip_${tour.id}.pdf`);
    
    const body = `PANGEA BOCAS - TRIP REPORT\n\nVessel: ${boat?.name}\nRoute: ${tour.route}\nCaptain: ${captain?.name}\nDate: ${tour.date}\nPAX Count: ${tour.paxCount}\n\nStart Gas: ${tour.startGas}\nEnd Gas: ${tour.endGas || 'N/A'}\n\nOperations Summary:\n${tour.arrivalNotes || "No arrival notes provided."}\n\nMechanical Issues:\n${tour.mechanicalNotes || "None reported."}`;
    sendEmailReport(`Trip Report - ${boat?.name} - ${tour.date}`, body);
  };

  return (
    <div className="space-y-8 pb-20">
      <div className="flex space-x-4 border-b border-slate-100 pb-4 overflow-x-auto">
        {[
          { id: 'Log', label: '🛫 Departure Log', icon: '📝' },
          { id: 'Safety', label: '🛡️ Safety Verification', icon: '✅' },
          { id: 'Arrival', label: '🛬 Arrival & Fuel', icon: '⛽' }
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
              
              <div className="p-6 bg-amber-50 rounded-3xl border border-amber-100 space-y-2">
                <label className="text-[12px] font-black uppercase text-amber-600">Customer Count (VERY IMPORTANT)</label>
                <input 
                  type="number" 
                  min="1"
                  value={departureForm.paxCount} 
                  onChange={e => setDepartureForm({...departureForm, paxCount: parseInt(e.target.value) || 0})} 
                  className="w-full bg-white border-2 border-amber-200 rounded-2xl px-6 py-4 font-black text-3xl text-amber-700 outline-none" 
                  placeholder="0"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase text-slate-400">Date</label>
                  <input type="date" value={departureForm.date} onChange={e => setDepartureForm({...departureForm, date: e.target.value})} className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 font-black text-sm" />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase text-slate-400">Start Time</label>
                  <input type="time" value={departureForm.time} onChange={e => setDepartureForm({...departureForm, time: e.target.value})} className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 font-black text-sm" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase text-slate-400">Boat Asset</label>
                  <select value={departureForm.boatId} onChange={e => setDepartureForm({...departureForm, boatId: e.target.value})} className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-3 font-black text-sm">
                    <option value="">Select Asset...</option>
                    {data.boats.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase text-slate-400">Captain</label>
                  <select value={departureForm.captainId} onChange={e => setDepartureForm({...departureForm, captainId: e.target.value})} className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-3 font-black text-sm">
                    <option value="">Select Captain...</option>
                    {activePersonnel.filter(p => p.role.includes('Capitán')).map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                  </select>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase text-slate-400">Tour Route</label>
                <select value={departureForm.route} onChange={e => setDepartureForm({...departureForm, route: e.target.value})} className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-3 font-black text-sm">
                  <option value="">Choose Route...</option>
                  {Object.entries(TOUR_ROUTES).map(([cat, routes]) => (
                    <optgroup label={cat} key={cat}>{routes.map(r => <option key={r} value={r}>{r}</option>)}</optgroup>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase text-slate-400">Gas Level Start (1-9)</label>
                  <input type="number" step="0.5" value={departureForm.startGas} onChange={e => setDepartureForm({...departureForm, startGas: parseFloat(e.target.value)})} className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-3 font-black text-sm" />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase text-slate-400">Hull Hours (HMI)</label>
                  <input type="number" value={departureForm.hmiStart} onChange={e => setDepartureForm({...departureForm, hmiStart: parseFloat(e.target.value)})} className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-3 font-black text-sm" />
                </div>
              </div>
            </div>
            <button type="submit" className="w-full py-6 rounded-3xl font-black text-2xl shadow-2xl transition-all" style={{ backgroundColor: PANGEA_DARK, color: 'white' }}>Authorize Dispatch</button>
          </div>
          
          <div className="bg-white p-10 rounded-[2.5rem] border border-slate-100 shadow-sm space-y-8">
               <h3 className="text-xl font-black">Provisions Inventory</h3>
               <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
                {departureForm.provisions.map((prov, i) => (
                  <div key={prov.item} className="p-4 bg-slate-50 rounded-2xl border border-slate-100 text-center space-y-2">
                    <span className="text-[9px] font-black uppercase text-slate-400 block truncate">{prov.item}</span>
                    <input type="number" value={prov.departureQty} onChange={e => {
                        const newProvs = [...departureForm.provisions];
                        newProvs[i].departureQty = parseInt(e.target.value) || 0;
                        setDepartureForm({...departureForm, provisions: newProvs});
                      }} className="w-full bg-white border border-slate-200 rounded-xl px-2 py-2 text-center font-black text-sm" />
                  </div>
                ))}
              </div>
          </div>
        </form>
      )}

      {activeMode === 'Arrival' && (
        <div className="space-y-10">
          <form onSubmit={handleArrivalSubmit} className="max-w-5xl mx-auto space-y-8 animate-in slide-in-from-bottom-6 duration-500">
            <div className="bg-white p-12 rounded-[3.5rem] shadow-2xl border border-slate-100 space-y-10">
              <div className="flex flex-col md:flex-row justify-between items-center gap-6">
                <h3 className="text-3xl font-black">Trip Reconciliation</h3>
                <select value={selectedTourId || ''} onChange={e => setSelectedTourId(e.target.value)} className="bg-slate-50 border border-slate-100 rounded-2xl px-6 py-4 font-black text-sm min-w-[300px]">
                    <option value="">Active Tours...</option>
                    {data.tours.filter(t => t.status === 'Dispatched').map(t => <option key={t.id} value={t.id}>{data.boats.find(b => b.id === t.boatId)?.name} ({t.departureTime})</option>)}
                </select>
              </div>
              
              <div className="grid grid-cols-2 gap-8">
                 <div className="space-y-2">
                   <label className="text-[10px] font-black uppercase text-slate-400">Arrival Time</label>
                   <input type="time" value={arrivalForm.time} onChange={e => setArrivalForm({...arrivalForm, time: e.target.value})} className="w-full bg-slate-50 rounded-2xl px-6 py-4 font-black text-2xl shadow-inner border-none" />
                 </div>
                 <div className="p-6 bg-slate-50 rounded-[2.5rem] border border-slate-100">
                   <label className="text-[10px] font-black uppercase text-slate-400">End Gas Level (1-9)</label>
                   <input type="number" step="0.1" min="1" max="9" value={arrivalForm.endGas} onChange={e => setArrivalForm({...arrivalForm, endGas: parseFloat(e.target.value)})} className="w-full bg-white border border-slate-200 rounded-2xl px-6 py-4 font-black text-2xl" />
                 </div>
              </div>

              <div className="space-y-4">
                <label className="text-[10px] font-black uppercase text-slate-400">Post-Trip Mechanical Notes</label>
                <textarea value={arrivalForm.mechanicalNotes} onChange={e => setArrivalForm({...arrivalForm, mechanicalNotes: e.target.value})} className="w-full bg-slate-50 border border-slate-100 rounded-[2rem] px-8 py-6 font-medium h-32 outline-none" placeholder="Report any engine or systems issues..." />
              </div>

              <div className="space-y-4">
                <label className="text-[10px] font-black uppercase text-slate-400">General Trip Summary</label>
                <textarea value={arrivalForm.arrivalNotes} onChange={e => setArrivalForm({...arrivalForm, arrivalNotes: e.target.value})} className="w-full bg-slate-50 border border-slate-100 rounded-[2rem] px-8 py-6 font-medium h-40 outline-none" placeholder="Operations details, weather, incidents..." />
              </div>

              <button type="submit" className="w-full py-6 rounded-[2.5rem] font-black text-2xl shadow-2xl transition-all" style={{ backgroundColor: PANGEA_YELLOW, color: 'white' }}>Archive Trip Data</button>
            </div>
          </form>

          {/* RECENT DISPATCHES FOR REPORTING */}
          <section className="max-w-5xl mx-auto space-y-6">
            <header className="flex justify-between items-center px-4">
              <h4 className="text-xl font-black text-slate-800">Trip History & Operations Documents</h4>
              <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Email to ops@pangeabocas.com</span>
            </header>
            <div className="grid grid-cols-1 gap-4">
               {data.tours.slice(-8).reverse().map(tour => (
                 <div key={tour.id} className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex flex-col md:flex-row justify-between items-center gap-4 hover:shadow-md transition-all">
                    <div className="flex items-center space-x-4 flex-1">
                       <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center text-xl">🛥️</div>
                       <div>
                          <div className="flex items-center space-x-2">
                             <span className="text-[10px] font-black uppercase text-amber-500">{tour.date}</span>
                             <span className="px-2 py-0.5 bg-slate-100 text-[8px] font-black uppercase text-slate-400 rounded-md">ID: {tour.id}</span>
                          </div>
                          <h5 className="font-black text-slate-800">{data.boats.find(b => b.id === tour.boatId)?.name} — {tour.route}</h5>
                          <div className="flex space-x-3 text-[10px] font-bold text-slate-400">
                             <span>PAX: {tour.paxCount}</span>
                             <span>STATUS: {tour.status}</span>
                             <span>TIME: {tour.departureTime}</span>
                          </div>
                       </div>
                    </div>
                    <div className="flex space-x-2">
                       <button 
                        onClick={() => handleSendReport(tour)}
                        className="bg-[#434343] text-white px-8 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest flex items-center space-x-2 hover:bg-black transition-all shadow-lg active:scale-95"
                       >
                         <span>📄 Report Document</span>
                       </button>
                    </div>
                 </div>
               ))}
            </div>
          </section>
        </div>
      )}

      {activeMode === 'Safety' && (
        <div className="bg-white p-12 rounded-[3.5rem] shadow-2xl border border-slate-100 max-w-4xl mx-auto space-y-10">
          <h3 className="text-3xl font-black">Safety Verification Checklist</h3>
          <p className="text-slate-500 font-medium">Mandatory safety check before vessel departure authorization.</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
             {[
              { id: 'bilgeDry', label: 'Bilge is Dry' },
              { id: 'engineOilSteeringOk', label: 'Engine Oil & Steering Check' },
              { id: 'propellersClear', label: 'Propellers Clear & Secure' },
              { id: 'lifeJacketsCountOk', label: 'Life Jackets PAX Count OK' },
              { id: 'fuelLevelSufficient', label: 'Fuel Sufficient for Route' },
              { id: 'electronicsOperational', label: 'Radio & Navigation Active' },
              { id: 'coolingTelltaleActive', label: 'Engine Cooling Confirmed' },
              { id: 'anchorLineSecure', label: 'Anchor & Lines Ready' },
              { id: 'firstAidOnboard', label: 'First Aid Kit Inspected' }
             ].map(item => (
               <label key={item.id} className="flex items-center space-x-4 p-6 bg-slate-50 rounded-2xl border border-slate-100 cursor-pointer hover:bg-slate-100 transition-colors">
                  <input 
                    type="checkbox" 
                    checked={(verificationForm as any)[item.id]} 
                    onChange={e => setVerificationForm({...verificationForm, [item.id]: e.target.checked})} 
                    className="w-6 h-6 rounded-lg accent-[#ffb519]" 
                  />
                  <span className="text-sm font-black text-slate-700">{item.label}</span>
               </label>
             ))}
          </div>
          <div className="space-y-4 p-8 bg-amber-50 rounded-[2.5rem] border border-amber-100">
            <label className="text-[10px] font-black uppercase text-amber-600 block">Captain Official Confirmation</label>
            <input 
              type="text" 
              value={verificationForm.captainSignature} 
              onChange={e => setVerificationForm({...verificationForm, captainSignature: e.target.value})} 
              className="w-full bg-white border-2 border-amber-200 rounded-2xl px-6 py-4 font-black text-lg outline-none" 
              placeholder="Type Full Name to Sign Safety Log..." 
            />
          </div>
          <button onClick={() => setActiveMode('Log')} className="w-full py-6 rounded-3xl font-black text-white text-xl shadow-xl transition-all" style={{ backgroundColor: PANGEA_YELLOW }}>Confirm Safety Completion</button>
        </div>
      )}
    </div>
  );
};

export default TourLogForm;

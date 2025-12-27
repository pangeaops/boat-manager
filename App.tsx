import React, { useState, useEffect, useCallback, useRef } from 'react';
import { AppData, Boat, Personnel, Tour, AuditLog, BoatStatus, AppUser, InventoryItem } from './types.ts';
import Layout from './components/Layout.tsx';
import Dashboard from './components/Dashboard.tsx';
import BoatDashboard from './components/BoatDashboard.tsx';
import MaintenanceForm from './components/MaintenanceForm.tsx';
import AddBoatForm from './components/AddBoatForm.tsx';
import AddPersonnelForm from './components/AddPersonnelForm.tsx';
import PersonnelDashboard from './components/PersonnelDashboard.tsx';
import LogSection from './components/LogSection.tsx';
import TourLogForm from './components/TourLogForm.tsx';
import Protocols from './components/Protocols.tsx';
import Login from './components/Login.tsx';
import AdminDashboard from './components/AdminDashboard.tsx';
import InventoryDashboard from './components/InventoryDashboard.tsx';
import { INITIAL_DATA_KEY, FULL_FLEET, INITIAL_PERSONNEL } from './constants.ts';
import { generateDailyOperationalSummary } from './services/geminiService.ts';
import { syncToSheet, fetchAppData } from './services/sheetService.ts';
import { generateAuditLogPDF, sendEmailReport } from './services/reportService.ts';

const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<AppUser | null>(null);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [editingBoat, setEditingBoat] = useState<Boat | null>(null);
  const [isGeneratingReport, setIsGeneratingReport] = useState(false);
  const [lastSync, setLastSync] = useState<Date | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [cloudStatus, setCloudStatus] = useState<'online' | 'offline' | 'pending'>('pending');
  
  const isFetchingRef = useRef(false);

  const [data, setData] = useState<AppData>(() => {
    const saved = localStorage.getItem(INITIAL_DATA_KEY);
    return saved ? JSON.parse(saved) : { 
      boats: FULL_FLEET, 
      tasks: [], 
      personnel: INITIAL_PERSONNEL,
      tours: [],
      inventory: [],
      logs: []
    };
  });

  const refreshData = useCallback(async (showIndicator = false) => {
    if (!currentUser || isFetchingRef.current) return;
    
    isFetchingRef.current = true;
    if (showIndicator) setIsSyncing(true);
    
    try {
      const remoteData = await fetchAppData();
      if (remoteData && !remoteData.error) {
        setData(prev => {
          const remoteBoats = remoteData.Boats || remoteData.boats;
          const remoteTours = remoteData.Tours || remoteData.tours;
          const remotePersonnel = remoteData.Personnel || remoteData.personnel;
          const remoteInventory = remoteData.Inventory || remoteData.inventory;
          const remoteLogs = remoteData.AuditLogs || remoteData.logs;

          return {
            ...prev,
            boats: remoteBoats && remoteBoats.length > 0 ? remoteBoats : prev.boats,
            tours: remoteTours && remoteTours.length > 0 ? remoteTours : prev.tours,
            personnel: remotePersonnel && remotePersonnel.length > 0 ? remotePersonnel : prev.personnel,
            inventory: remoteInventory && remoteInventory.length > 0 ? remoteInventory : prev.inventory,
            logs: remoteLogs || prev.logs
          };
        });
        setLastSync(new Date());
        setCloudStatus('online');
      } else {
        setCloudStatus('offline');
      }
    } catch (err) {
      setCloudStatus('offline');
    } finally {
      isFetchingRef.current = false;
      if (showIndicator) setIsSyncing(false);
    }
  }, [currentUser]);

  useEffect(() => {
    if (currentUser) {
      refreshData(true);
      const interval = setInterval(() => refreshData(false), 60000); 
      return () => clearInterval(interval);
    }
  }, [currentUser, refreshData]);

  useEffect(() => {
    localStorage.setItem(INITIAL_DATA_KEY, JSON.stringify(data));
  }, [data]);

  const createLog = (action: string, details: string, category: AuditLog['category']) => {
    const newLog = { id: Math.random().toString(36).substr(2, 9), timestamp: new Date().toISOString(), action, details, category, user: currentUser?.name };
    setData(prev => ({ ...prev, logs: [newLog as AuditLog, ...prev.logs].slice(0, 100) }));
    syncToSheet('AuditLogs', newLog);
  };

  const handleFullDailyReport = async () => {
    setIsGeneratingReport(true);
    try {
      const today = new Date().toISOString().split('T')[0];
      const todayLogs = data.logs.filter(l => l.timestamp.includes(today));
      const todayTours = data.tours.filter(t => t.date === today);
      
      const doc = generateAuditLogPDF(todayLogs);
      doc.save(`Pangea_Daily_Full_Report_${today}.pdf`);
      
      let aiSummary = "Daily Operations Summary";
      try {
        aiSummary = await generateDailyOperationalSummary(data);
      } catch (err) {
        console.warn("AI Summary failed, using basic layout");
      }

      const emailBody = `PANGEA BOCAS - DAILY OPERATIONAL REPORT\nDate: ${new Date().toDateString()}\n\nAI Summary Insights:\n${aiSummary}\n\nToday's Metrics:\n- Trips Dispatched: ${todayTours.length}\n- Active Logs Recorded: ${todayLogs.length}\n\nNote: The full PDF Audit Log has been downloaded automatically. Please attach it to this email if needed.`;
      
      sendEmailReport(`Daily Full Operations Report - ${new Date().toDateString()}`, emailBody);
      createLog('Report Dispatched', 'Daily Full Operational Summary Report triggered.', 'Fleet');
      
      alert("Report PDF Generated. Email draft opened.");
    } catch (error) {
      console.error("Report generation failed:", error);
      alert("Full report generation failed. Check connection.");
    } finally {
      setIsGeneratingReport(false);
    }
  };

  const handleUpdateBoatStatus = (boatId: string, status: BoatStatus) => {
    setData(prev => {
      const boat = prev.boats.find(b => b.id === boatId);
      if (!boat) return prev;
      const updatedBoat = { ...boat, status };
      syncToSheet('Boats', updatedBoat);
      createLog('Boat Status Changed', `${boat.name} set to ${status}.`, 'Fleet');
      return { ...prev, boats: prev.boats.map(b => b.id === boatId ? updatedBoat : b) };
    });
  };

  const handleExportData = () => {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `pangea_backup_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
  };

  const handleImportData = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const imported = JSON.parse(event.target?.result as string);
          if (confirm("Replace entire local database with this backup?")) {
            setData(imported);
            alert("Database Restoration Successful.");
          }
        } catch (err) { alert("Invalid backup file."); }
      };
      reader.readAsText(file);
    }
  };

  if (!currentUser) return <Login onLogin={(user) => setCurrentUser(user)} />;

  const renderContent = () => {
    if (editingBoat) return <AddBoatForm initialData={editingBoat} onAddBoat={(b) => { 
      setData(prev => ({...prev, boats: prev.boats.map(x => x.id === b.id ? b : x)}));
      syncToSheet('Boats', b);
      setEditingBoat(null);
    }} onCancel={() => setEditingBoat(null)} />;
    
    switch (activeTab) {
      case 'dashboard': return <Dashboard data={data} onSendFullDailyReport={handleFullDailyReport} onManualSync={() => refreshData(true)} />;
      case 'fleet': return <BoatDashboard data={data} userRole={currentUser.role} onUpdateTaskStatus={() => {}} onEditBoat={setEditingBoat} onUpdateBoatStatus={handleUpdateBoatStatus} />;
      case 'add_forms': return (
        <div className="space-y-12">
          <div className="bg-white p-10 rounded-[3rem] border border-slate-100 shadow-sm space-y-6">
            <h3 className="text-xl font-black">Database Administration</h3>
            <div className="flex gap-4">
              <button onClick={handleExportData} className="px-6 py-3 bg-slate-800 text-white rounded-xl font-black text-xs uppercase tracking-widest">Download Full Backup (JSON)</button>
              <label className="px-6 py-3 bg-slate-100 text-slate-800 rounded-xl font-black text-xs uppercase tracking-widest cursor-pointer hover:bg-slate-200 transition-colors">
                Restore Database
                <input type="file" className="hidden" onChange={handleImportData} accept=".json" />
              </label>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
            <AddBoatForm onAddBoat={(b) => { setData(prev => ({...prev, boats: [...prev.boats, b]})); syncToSheet('Boats', b); setActiveTab('fleet'); }} />
            <AddPersonnelForm onAddPersonnel={(p) => { setData(prev => ({...prev, personnel: [...prev.personnel, p]})); syncToSheet('Personnel', p); setActiveTab('personnel_hub'); }} />
          </div>
        </div>
      );
      case 'tours': return <TourLogForm data={data} onAddTour={(t) => { setData(prev => ({...prev, tours: [...prev.tours, t]})); syncToSheet('Tours', t); }} onUpdateTour={(id, u) => { setData(prev => ({...prev, tours: prev.tours.map(t => t.id === id ? {...t, ...u} : t)})); syncToSheet('Tours', {id, ...u}); }} />;
      case 'inventory': return <InventoryDashboard data={data} onUpdateInventory={(i) => { setData(prev => ({...prev, inventory: prev.inventory.find(x => x.id === i.id) ? prev.inventory.map(x => x.id === i.id ? i : x) : [...prev.inventory, i]})); syncToSheet('Inventory', i); }} />;
      case 'personnel_hub': return <PersonnelDashboard data={data} userRole={currentUser.role} onUpdatePersonnel={(p) => { setData(prev => ({...prev, personnel: prev.personnel.map(x => x.id === p.id ? p : x)})); syncToSheet('Personnel', p); }} />;
      case 'maintenance': return <MaintenanceForm data={data} onAddTask={(t) => { setData(prev => ({...prev, tasks: [...prev.tasks, t]})); syncToSheet('Tasks', t); }} onSendReport={() => {}} onUpdateStatus={(id, s) => { setData(prev => ({...prev, tasks: prev.tasks.map(t => t.id === id ? {...t, status: s} : t)})); syncToSheet('Tasks', {id, status: s}); }} />;
      case 'protocols': return <Protocols />;
      case 'admin_dashboard': return <AdminDashboard data={data} />;
      case 'logs': return <LogSection logs={data.logs} />;
      default: return <Dashboard data={data} onSendFullDailyReport={handleFullDailyReport} onManualSync={() => refreshData(true)} />;
    }
  };

  return (
    <Layout 
      activeTab={activeTab} 
      setActiveTab={setActiveTab} 
      user={currentUser} 
      onLogout={() => setCurrentUser(null)}
      isSyncing={isSyncing}
      lastSync={lastSync}
      cloudStatus={cloudStatus}
    >
      {isGeneratingReport && (
        <div className="fixed inset-0 bg-white/60 backdrop-blur-md z-50 flex items-center justify-center">
          <div className="bg-white p-12 rounded-[3rem] shadow-2xl border border-slate-100 text-center space-y-4">
            <div className="w-12 h-12 border-4 border-[#ffb519] border-t-transparent rounded-full animate-spin mx-auto"></div>
            <p className="font-black">Generating Report...</p>
            <p className="text-xs text-slate-400 font-bold uppercase">Synthesizing operational data</p>
          </div>
        </div>
      )}
      {renderContent()}
    </Layout>
  );
};

export default App;
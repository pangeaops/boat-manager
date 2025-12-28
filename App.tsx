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
import { checkReportStatus, markReportSent, snoozeReport } from './services/reportService.ts';
import { jsPDF } from 'jspdf';

const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<AppUser | null>(null);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [editingBoat, setEditingBoat] = useState<Boat | null>(null);
  const [isGeneratingReport, setIsGeneratingReport] = useState(false);
  const [lastSync, setLastSync] = useState<Date | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [pendingReport, setPendingReport] = useState<'daily' | 'weekly' | null>(null);
  
  const lastManualUpdateRef = useRef<number>(0);

  const [data, setData] = useState<AppData>(() => {
    const saved = localStorage.getItem(INITIAL_DATA_KEY);
    const parsed = saved ? JSON.parse(saved) : null;
    
    return { 
      boats: (parsed?.boats?.length > 0) ? parsed.boats : FULL_FLEET, 
      tasks: parsed?.tasks || [], 
      personnel: (parsed?.personnel?.length > 0) ? parsed.personnel : INITIAL_PERSONNEL,
      tours: parsed?.tours || [],
      inventory: parsed?.inventory || [],
      logs: parsed?.logs || []
    };
  });

  const evaluateReportStatus = useCallback(() => {
    const { needsDaily, needsWeekly } = checkReportStatus(data);
    if (needsWeekly) setPendingReport('weekly');
    else if (needsDaily) setPendingReport('daily');
    else setPendingReport(null);
  }, [data]);

  const refreshData = useCallback(async (showIndicator = false) => {
    if (!currentUser) return;
    
    const now = Date.now();
    if (now - lastManualUpdateRef.current < 15000) {
      return;
    }

    if (showIndicator) setIsSyncing(true);
    
    try {
      const remoteData = await fetchAppData();
      if (remoteData) {
        setData(prev => ({
          ...prev,
          boats: (remoteData.boats && remoteData.boats.length > 0) ? remoteData.boats : prev.boats,
          tasks: (remoteData.tasks && remoteData.tasks.length > 0) ? remoteData.tasks : prev.tasks,
          personnel: (remoteData.personnel && remoteData.personnel.length > 0) ? remoteData.personnel : prev.personnel,
          tours: (remoteData.tours && remoteData.tours.length > 0) ? remoteData.tours : prev.tours,
          inventory: (remoteData.inventory && remoteData.inventory.length > 0) ? remoteData.inventory : prev.inventory,
          logs: (remoteData.logs && remoteData.logs.length >= prev.logs.length) ? remoteData.logs : prev.logs
        }));
        setLastSync(new Date());
      }
    } catch (err) {
      console.error("[PangeaOps] Cloud sync failed", err);
    } finally {
      setIsSyncing(false);
    }
  }, [currentUser]);

  useEffect(() => {
    if (currentUser) {
      refreshData(true);
      const interval = setInterval(() => {
        refreshData();
      }, 10000); 
      return () => clearInterval(interval);
    }
  }, [currentUser, refreshData]);

  useEffect(() => {
    if (currentUser) {
      evaluateReportStatus();
      const interval = setInterval(evaluateReportStatus, 60000);
      return () => clearInterval(interval);
    }
  }, [currentUser, evaluateReportStatus]);

  useEffect(() => {
    localStorage.setItem(INITIAL_DATA_KEY, JSON.stringify(data));
  }, [data]);

  const recordManualAction = () => {
    lastManualUpdateRef.current = Date.now();
  };

  const createLog = (action: string, details: string, category: AuditLog['category']) => {
    const newLog: AuditLog = {
      id: Math.random().toString(36).substr(2, 9),
      timestamp: new Date().toISOString(),
      action,
      details,
      category
    };
    setData(prev => ({ ...prev, logs: [...prev.logs, newLog] }));
    syncToSheet('AuditLogs', { ...newLog, user: currentUser?.name || 'System' });
    recordManualAction();
  };

  const handleUpdateBoatStatus = (boatId: string, status: BoatStatus) => {
    setData(prev => {
      const boat = prev.boats.find(b => b.id === boatId);
      if (!boat) return prev;
      const updatedBoat = { ...boat, status };
      syncToSheet('Boats', updatedBoat);
      createLog('Boat Status Change', `${boat.name} -> ${status}`, 'Fleet');
      recordManualAction();
      return { ...prev, boats: prev.boats.map(b => b.id === boatId ? updatedBoat : b) };
    });
  };

  const addBoat = (boat: Boat) => {
    recordManualAction();
    setData(prev => {
      const exists = prev.boats.find(b => b.id === boat.id);
      syncToSheet('Boats', boat);
      if (exists) {
        createLog('Boat Specs Updated', boat.name, 'Fleet');
        return { ...prev, boats: prev.boats.map(b => b.id === boat.id ? boat : b) };
      }
      createLog('New Boat Registered', boat.name, 'Fleet');
      return { ...prev, boats: [...prev.boats, boat] };
    });
    setEditingBoat(null);
    setActiveTab('fleet');
  };

  const addPersonnel = async (person: Personnel) => {
    recordManualAction();
    setData(prev => ({ ...prev, personnel: [...prev.personnel, person] }));
    createLog('Staff Onboarded', person.name, 'Personnel');
    await syncToSheet('Personnel', person);
    setActiveTab('personnel_hub');
  };

  const updatePersonnel = async (person: Personnel) => {
    recordManualAction();
    setData(prev => ({ 
      ...prev, 
      personnel: prev.personnel.map(p => p.id === person.id ? person : p) 
    }));
    createLog('Staff Profile Updated', person.name, 'Personnel');
    await syncToSheet('Personnel', person);
  };

  const syncAllPersonnel = async () => {
    setIsSyncing(true);
    // 1. Audit Log initiation
    const startLog: AuditLog = {
      id: Math.random().toString(36).substr(2, 9),
      timestamp: new Date().toISOString(),
      action: 'Bulk Sync Triggered',
      details: `Dispatched ${data.personnel.length} staff records using strict CSV headers.`,
      category: 'Personnel'
    };
    setData(prev => ({ ...prev, logs: [...prev.logs, startLog] }));
    await syncToSheet('AuditLogs', { ...startLog, user: currentUser?.name || 'System' });

    try {
      // 2. Loop through and sync each record with higher delay to prevent script collisions
      for (const person of data.personnel) {
        await syncToSheet('Personnel', person);
        await new Promise(resolve => setTimeout(resolve, 800)); 
      }
      
      // 3. Final log
      const endLog: AuditLog = {
        id: Math.random().toString(36).substr(2, 9),
        timestamp: new Date().toISOString(),
        action: 'Bulk Sync Completed',
        details: `Verified ${data.personnel.length} personnel records synced.`,
        category: 'Personnel'
      };
      setData(prev => ({ ...prev, logs: [...prev.logs, endLog] }));
      await syncToSheet('AuditLogs', { ...endLog, user: currentUser?.name || 'System' });
      
      alert(`Sink Complete: All ${data.personnel.length} personnel records have been updated in the Sheet.`);
    } catch (err) {
      console.error("Bulk sink interrupted", err);
      alert("Cloud connection timed out during bulk operation.");
    } finally {
      setIsSyncing(false);
    }
  };

  const addTour = (tour: Tour) => {
    recordManualAction();
    setData(prev => ({ ...prev, tours: [...prev.tours, tour] }));
    createLog('Trip Dispatched', tour.route, 'Tour');
    syncToSheet('Tours', tour);
  };

  const updateTour = (tourId: string, updates: Partial<Tour>) => {
    recordManualAction();
    setData(prev => {
      const tour = prev.tours.find(t => t.id === tourId);
      if (!tour) return prev;
      const updatedTour = { ...tour, ...updates };
      syncToSheet('Tours', updatedTour);
      return { ...prev, tours: prev.tours.map(t => t.id === tourId ? updatedTour : t) };
    });
  };

  const updateInventory = (item: InventoryItem) => {
    recordManualAction();
    setData(prev => {
      const exists = prev.inventory.find(i => i.id === item.id);
      syncToSheet('Inventory', item);
      if (exists) return { ...prev, inventory: prev.inventory.map(i => i.id === item.id ? item : i) };
      return { ...prev, inventory: [...prev.inventory, item] };
    });
  };

  const handleSendFullDailyReport = async (type: 'daily' | 'weekly' = 'daily') => {
    setIsGeneratingReport(true);
    try {
      const summary = await generateDailyOperationalSummary(data);
      if (!summary || summary.includes("API_KEY_MISSING")) throw new Error("Cloud Intelligence Unavailable");
      
      const doc = new jsPDF();
      const splitText = doc.splitTextToSize(summary, 170);
      let y = 30;
      doc.setFontSize(16);
      doc.text(`Pangea Bocas ${type} Operational Review`, 20, 20);
      doc.setFontSize(10);
      splitText.forEach((line: string) => {
        if (y > 280) { doc.addPage(); y = 20; }
        doc.text(line, 20, y);
        y += 7;
      });
      doc.save(`Pangea_Report_${new Date().toISOString().split('T')[0]}.pdf`);
      markReportSent(type);
      setPendingReport(null);
      createLog('Report Dispatched', `Full ${type} report compiled and exported`, 'Tour');
    } catch (err: any) { 
      alert(`Report Error: ${err.message}`); 
    } finally { 
      setIsGeneratingReport(false); 
    }
  };

  const handleSnoozeReport = () => {
    if (pendingReport) {
      snoozeReport(pendingReport);
      setPendingReport(null);
      createLog('Report Snoozed', `Operator snoozed ${pendingReport} report notification for 1 hour`, 'Tour');
    }
  };

  if (!currentUser) return <Login onLogin={(user) => setCurrentUser(user)} />;

  return (
    <Layout 
      activeTab={activeTab} 
      setActiveTab={setActiveTab} 
      user={currentUser} 
      onLogout={() => setCurrentUser(null)}
      isSyncing={isSyncing}
      lastSync={lastSync}
      pendingReport={pendingReport}
      data={data}
    >
      {isGeneratingReport && (
        <div className="fixed inset-0 bg-white/70 backdrop-blur-xl z-[100] flex items-center justify-center">
          <div className="text-center space-y-4">
            <div className="w-16 h-16 border-4 border-[#ffb519] border-t-transparent rounded-full animate-spin mx-auto"></div>
            <p className="font-black text-xl uppercase tracking-tighter">Compiling Cloud Intelligence...</p>
          </div>
        </div>
      )}

      {pendingReport && (
        <div className="fixed bottom-10 right-10 z-[60] animate-in slide-in-from-right-10 duration-500">
           <div className="bg-[#434343] text-white p-8 rounded-[2.5rem] shadow-2xl border border-white/10 space-y-4 max-w-sm">
              <div className="flex items-center space-x-3">
                 <span className="text-2xl">📅</span>
                 <h4 className="font-black uppercase tracking-widest text-sm">Pending {pendingReport} Report</h4>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed font-medium">The system has detected a scheduled report is due. Would you like to compile and dispatch it now to the operations team?</p>
              <div className="flex space-x-3">
                 <button onClick={() => handleSendFullDailyReport(pendingReport)} className="flex-1 bg-[#ffb519] text-white py-3 rounded-xl font-black text-[10px] uppercase tracking-widest hover:scale-105 transition-transform">Dispatch Now</button>
                 <button onClick={handleSnoozeReport} className="px-6 py-3 bg-white/10 text-slate-400 rounded-xl font-black text-[10px] uppercase hover:bg-white/20 transition-colors">Later</button>
              </div>
           </div>
        </div>
      )}

      {activeTab === 'dashboard' && <Dashboard data={data} onSendFullDailyReport={() => handleSendFullDailyReport('daily')} isSyncing={isSyncing} />}
      {activeTab === 'fleet' && <BoatDashboard data={data} userRole={currentUser.role} onUpdateTaskStatus={() => {}} onEditBoat={setEditingBoat} onUpdateBoatStatus={handleUpdateBoatStatus} />}
      {activeTab === 'tours' && <TourLogForm data={data} onAddTour={addTour} onUpdateTour={updateTour} />}
      {activeTab === 'inventory' && <InventoryDashboard data={data} onUpdateInventory={updateInventory} />}
      {activeTab === 'personnel_hub' && <PersonnelDashboard data={data} userRole={currentUser.role} onUpdatePersonnel={updatePersonnel} onSyncAll={syncAllPersonnel} />}
      {activeTab === 'maintenance' && <MaintenanceForm data={data} onAddTask={() => {}} onSendReport={() => {}} onUpdateStatus={() => {}} />}
      {activeTab === 'protocols' && <Protocols />}
      {activeTab === 'admin_dashboard' && <AdminDashboard data={data} />}
      {activeTab === 'logs' && <LogSection logs={data.logs} />}
      {activeTab === 'add_forms' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
          {currentUser.role === 'Admin' ? <AddBoatForm onAddBoat={addBoat} /> : <div>Admin access required.</div>}
          {currentUser.role === 'Admin' ? <AddPersonnelForm onAddPersonnel={addPersonnel} /> : <div>Admin access required.</div>}
        </div>
      )}
      {editingBoat && (
        <div className="fixed inset-0 z-[100] bg-black/40 backdrop-blur-sm flex items-center justify-center p-6">
          <div className="w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <AddBoatForm initialData={editingBoat} onAddBoat={addBoat} onCancel={() => setEditingBoat(null)} />
          </div>
        </div>
      )}
    </Layout>
  );
};

export default App;
import React, { useState, useEffect, useCallback } from 'react';
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
import { checkReportStatus, markReportSent } from './services/reportService.ts';
import { jsPDF } from 'jspdf';

const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<AppUser | null>(null);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [editingBoat, setEditingBoat] = useState<Boat | null>(null);
  const [isGeneratingReport, setIsGeneratingReport] = useState(false);
  const [lastSync, setLastSync] = useState<Date | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [pendingReport, setPendingReport] = useState<'daily' | 'weekly' | null>(null);
  
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

  // Function to pull latest data from cloud
  const refreshData = useCallback(async (showIndicator = false) => {
    if (!currentUser) return;
    if (showIndicator) setIsSyncing(true);
    
    try {
      const remoteData = await fetchAppData();
      if (remoteData) {
        setData(prev => ({
          ...prev,
          ...remoteData,
          // Robust Data Merging: prioritize remote data for fleet-wide truth
          logs: remoteData.logs || prev.logs,
          boats: remoteData.boats || prev.boats,
          tasks: remoteData.tasks || prev.tasks,
          personnel: remoteData.personnel || prev.personnel,
          tours: remoteData.tours || prev.tours,
          inventory: remoteData.inventory || prev.inventory,
        }));
        setLastSync(new Date());

        // Automation Logic: Check for periodic report needs
        const { needsDaily, needsWeekly } = checkReportStatus(remoteData);
        if (needsWeekly) setPendingReport('weekly');
        else if (needsDaily) setPendingReport('daily');
      }
    } catch (err) {
      console.error("Background sync failed", err);
    } finally {
      setIsSyncing(false);
    }
  }, [currentUser]);

  // Aggressive Polling: 10 seconds for real-time multi-user feel
  useEffect(() => {
    if (currentUser) {
      refreshData(true);
      const interval = setInterval(() => {
        refreshData();
      }, 10000); 
      return () => clearInterval(interval);
    }
  }, [currentUser, refreshData]);

  // Save to local storage for offline resilience
  useEffect(() => {
    localStorage.setItem(INITIAL_DATA_KEY, JSON.stringify(data));
  }, [data]);

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
  };

  const handleUpdateBoatStatus = (boatId: string, status: BoatStatus) => {
    setData(prev => {
      const boat = prev.boats.find(b => b.id === boatId);
      if (!boat) return prev;
      const updatedBoat = { ...boat, status };
      createLog('Boat Status Changed', `${boat.name} set to ${status}.`, 'Fleet');
      syncToSheet('Boats', updatedBoat);
      return { ...prev, boats: prev.boats.map(b => b.id === boatId ? updatedBoat : b) };
    });
  };

  const addBoat = (boat: Boat) => {
    setData(prev => {
      const exists = prev.boats.find(b => b.id === boat.id);
      syncToSheet('Boats', boat);
      if (exists) {
        createLog('Vessel Updated', `${boat.name} modified.`, 'Fleet');
        return { ...prev, boats: prev.boats.map(b => b.id === boat.id ? boat : b) };
      }
      createLog('New Boat Added', `${boat.name} registered.`, 'Fleet');
      return { ...prev, boats: [...prev.boats, boat] };
    });
    setEditingBoat(null);
    setActiveTab('fleet');
  };

  const addPersonnel = (person: Personnel) => {
    setData(prev => ({ ...prev, personnel: [...prev.personnel, person] }));
    createLog('Personnel Added', `${person.name} onboarded.`, 'Personnel');
    syncToSheet('Personnel', person);
    setActiveTab('personnel_hub');
  };

  const updatePersonnel = (person: Personnel) => {
    setData(prev => ({ ...prev, personnel: prev.personnel.map(p => p.id === person.id ? person : p) }));
    createLog('Personnel Updated', `${person.name} profile modified.`, 'Personnel');
    syncToSheet('Personnel', person);
  };

  const addTour = (tour: Tour) => {
    setData(prev => ({ ...prev, tours: [...prev.tours, tour] }));
    createLog('Tour Dispatched', `${tour.route} started.`, 'Tour');
    syncToSheet('Tours', tour);
  };

  const updateTour = (tourId: string, updates: Partial<Tour>) => {
    setData(prev => {
      const tour = prev.tours.find(t => t.id === tourId);
      if (!tour) return prev;
      const updatedTour = { ...tour, ...updates };
      syncToSheet('Tours', updatedTour);
      return { ...prev, tours: prev.tours.map(t => t.id === tourId ? updatedTour : t) };
    });
  };

  const updateInventory = (item: InventoryItem) => {
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
      if (!summary) throw new Error("The AI service returned no data.");
      
      if (summary.includes("API_KEY_MISSING") || summary.includes("QUOTA_EXCEEDED") || summary.includes("API_ERROR")) {
        alert(summary);
        return;
      }

      const doc = new jsPDF();
      const splitText = doc.splitTextToSize(summary, 170);
      let y = 30;
      
      doc.setFontSize(16);
      doc.text(`Pangea Bocas ${type === 'weekly' ? 'Weekly' : 'Daily'} Operational Report`, 20, 20);
      doc.setFontSize(10);
      
      splitText.forEach((line: string) => {
        if (y > 280) {
          doc.addPage();
          y = 20;
        }
        doc.text(line, 20, y);
        y += 7;
      });

      doc.save(`Pangea_Ops_${type}_${new Date().toISOString().split('T')[0]}.pdf`);
      createLog(`${type === 'weekly' ? 'Weekly' : 'Full'} Report Exported`, 'Operational PDF generated.', 'Tour');
      
      markReportSent(type);
      setPendingReport(null);
    } catch (err: any) { 
      console.error("Report Generation Error:", err);
      alert(`Failed to generate report: ${err.message || "Unknown error"}`); 
    } finally { 
      setIsGeneratingReport(false); 
    }
  };

  if (!currentUser) return <Login onLogin={(user) => setCurrentUser(user)} />;

  const renderContent = () => {
    if (editingBoat) return <AddBoatForm initialData={editingBoat} onAddBoat={addBoat} onCancel={() => setEditingBoat(null)} />;
    switch (activeTab) {
      case 'dashboard': return <Dashboard data={data} onSendFullDailyReport={() => handleSendFullDailyReport('daily')} isSyncing={isSyncing} />;
      case 'fleet': return <BoatDashboard data={data} userRole={currentUser.role} onUpdateTaskStatus={() => {}} onEditBoat={setEditingBoat} onUpdateBoatStatus={handleUpdateBoatStatus} />;
      case 'tours': return <TourLogForm data={data} onAddTour={addTour} onUpdateTour={updateTour} />;
      case 'inventory': return <InventoryDashboard data={data} onUpdateInventory={updateInventory} />;
      case 'personnel_hub': return <PersonnelDashboard data={data} userRole={currentUser.role} onUpdatePersonnel={updatePersonnel} />;
      case 'maintenance': return <MaintenanceForm data={data} onAddTask={() => {}} onSendReport={() => {}} onUpdateStatus={() => {}} />;
      case 'protocols': return <Protocols />;
      case 'admin_dashboard': return <AdminDashboard data={data} />;
      case 'logs': return <LogSection logs={data.logs} />;
      case 'add_forms': return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
          {currentUser.role === 'Admin' ? <AddBoatForm onAddBoat={addBoat} /> : <div>Admin access required.</div>}
          {currentUser.role === 'Admin' ? <AddPersonnelForm onAddPersonnel={addPersonnel} /> : <div>Admin access required.</div>}
        </div>
      );
      default: return <Dashboard data={data} onSendFullDailyReport={() => handleSendFullDailyReport('daily')} isSyncing={isSyncing} />;
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
      pendingReport={pendingReport}
    >
      {isGeneratingReport && (
        <div className="fixed inset-0 bg-white/60 backdrop-blur-md z-50 flex items-center justify-center">
          <div className="bg-white p-12 rounded-[3rem] shadow-2xl border border-slate-100 text-center space-y-4">
            <div className="w-12 h-12 border-4 border-[#ffb519] border-t-transparent rounded-full animate-spin mx-auto"></div>
            <p className="font-black">Compiling Pangea Fleet Data...</p>
            <p className="text-xs text-slate-400">Consulting Gemini Intelligence</p>
          </div>
        </div>
      )}

      {pendingReport && (
        <div className="fixed bottom-10 right-10 z-[60] animate-in slide-in-from-right-10 duration-500">
           <div className="bg-[#434343] text-white p-8 rounded-[2rem] shadow-2xl border border-white/10 space-y-4 max-w-sm">
              <div className="flex items-center space-x-3">
                 <span className="text-2xl">📅</span>
                 <h4 className="font-black uppercase tracking-widest text-sm">Pending {pendingReport} Report</h4>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed font-medium">The system has detected a scheduled report is due. Would you like to compile and dispatch it now to the operations team?</p>
              <div className="flex space-x-3">
                 <button onClick={() => handleSendFullDailyReport(pendingReport)} className="flex-1 bg-[#ffb519] text-white py-3 rounded-xl font-black text-[10px] uppercase tracking-widest hover:scale-105 transition-transform">Dispatch Now</button>
                 <button onClick={() => setPendingReport(null)} className="px-4 py-3 bg-white/10 text-slate-400 rounded-xl font-black text-[10px] uppercase">Later</button>
              </div>
           </div>
        </div>
      )}

      {renderContent()}
    </Layout>
  );
};

export default App;
import React, { useState, useEffect, useCallback } from 'react';
import { AppData, Boat, Personnel, Tour, AuditLog, BoatStatus, AppUser, InventoryItem, Task, TourProvision, Priority } from './types.ts';
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
import { syncToSheet, fetchAppData, deleteFromSheet } from './services/sheetService.ts';
import { generateDailyOperationalSummary } from './services/geminiService.ts';

const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<AppUser | null>(null);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [editingBoat, setEditingBoat] = useState<Boat | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSync, setLastSync] = useState<Date | null>(null);

  const [data, setData] = useState<AppData>(() => {
    const saved = localStorage.getItem(INITIAL_DATA_KEY);
    const parsed = saved ? JSON.parse(saved) : null;
    return { 
      boats: (parsed?.boats?.length > 0) ? parsed.boats : FULL_FLEET, 
      tasks: parsed?.tasks || [], 
      personnel: (parsed?.personnel?.length > 0) ? parsed.personnel : INITIAL_PERSONNEL,
      tours: parsed?.tours || [],
      inventory: parsed?.inventory || [],
      tourProvisions: parsed?.tourProvisions || [],
      logs: parsed?.logs || []
    };
  });

  const createLog = async (action: string, category: AuditLog['category'], details: string) => {
    const newLog: AuditLog = {
      id: `LOG-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date().toISOString(),
      action,
      category,
      details
    };
    setData(prev => ({ ...prev, logs: [newLog, ...prev.logs].slice(0, 500) }));
    await syncToSheet('AuditLogs', newLog);
    return newLog;
  };

  const refreshData = useCallback(async () => {
    if (!currentUser) return;
    setIsSyncing(true);
    const remoteData = await fetchAppData();
    if (remoteData) {
      setData(prev => ({
        ...prev,
        boats: remoteData.boats || prev.boats,
        tasks: remoteData.tasks || prev.tasks,
        personnel: remoteData.personnel || prev.personnel,
        tours: remoteData.tours || prev.tours,
        inventory: remoteData.inventory || prev.inventory,
        tourProvisions: remoteData.tourProvisions || prev.tourProvisions,
        logs: remoteData.logs || prev.logs
      }));
      setLastSync(new Date());
    }
    setIsSyncing(false);
  }, [currentUser]);

  useEffect(() => {
    if (currentUser) {
      refreshData();
      const interval = setInterval(refreshData, 15000); 
      return () => clearInterval(interval);
    }
  }, [currentUser, refreshData]);

  useEffect(() => {
    localStorage.setItem(INITIAL_DATA_KEY, JSON.stringify(data));
  }, [data]);

  const handleLogin = async (user: AppUser) => {
    setCurrentUser(user);
    await createLog('User Login', 'Personnel', `${user.name} access authorized.`);
  };

  const handleLogout = () => {
    setCurrentUser(null);
  };

  const addBoat = async (boat: Boat) => {
    const exists = data.boats.some(b => b.id === boat.id);
    setData(prev => ({
      ...prev,
      boats: exists ? prev.boats.map(b => b.id === boat.id ? boat : b) : [...prev.boats, boat]
    }));
    const success = await syncToSheet('Boats', boat);
    await createLog(exists ? 'Boat Updated' : 'Boat Registered', 'Fleet', `${exists ? 'Updated' : 'Registered'} vessel: ${boat.boatname}`);
    setEditingBoat(null);
    return success;
  };

  const addMaintenanceTask = async (task: Task) => {
    const boat = data.boats.find(b => b.id === task.boatId);
    let updatedBoat: Boat | null = null;
    if (boat && (task.status === 'Pending' || task.status === 'Ongoing')) {
        updatedBoat = { ...boat, status: 'In Maintenance' as BoatStatus };
    }

    setData(prev => ({
      ...prev,
      tasks: [...prev.tasks, task],
      boats: updatedBoat ? prev.boats.map(b => b.id === boat?.id ? updatedBoat! : b) : prev.boats
    }));

    await syncToSheet('Tasks', task);
    if (updatedBoat) await syncToSheet('Boats', updatedBoat);
    await createLog('Task Created', 'Task', `Scheduled ${task.taskType} for ${boat?.boatname || 'Vessel'}.`);
  };

  const updateTaskStatus = async (taskId: string, status: Task['status']) => {
    const task = data.tasks.find(t => t.id === taskId);
    if (!task) return;
    const todayStr = new Date().toISOString().split('T')[0];
    const updatedTask: Task = { ...task, status, dueDate: status === 'Completed' ? todayStr : task.dueDate };
    const boat = data.boats.find(b => b.id === task.boatId);
    setData(prev => ({ ...prev, tasks: prev.tasks.map(t => t.id === taskId ? updatedTask : t) }));
    await syncToSheet('Tasks', updatedTask);
    if (boat && status === 'Completed') {
      const remaining = data.tasks.filter(t => t.boatId === boat.id && t.id !== taskId && t.status !== 'Completed');
      if (remaining.length === 0) {
        const updatedBoat = { ...boat, status: 'Available' as BoatStatus };
        setData(prev => ({ ...prev, boats: prev.boats.map(b => b.id === boat.id ? updatedBoat : b) }));
        await syncToSheet('Boats', updatedBoat);
      }
    }
  };

  const addTour = async (tour: Tour) => {
    const boat = data.boats.find(b => b.id === tour.boatId);
    const updatedBoats = boat ? data.boats.map(b => b.id === boat.id ? { ...b, status: 'In Tour' as BoatStatus } : b) : data.boats;
    setData(prev => ({ ...prev, tours: [...prev.tours, tour], boats: updatedBoats }));
    await syncToSheet('Tours', tour);
    if (boat) await syncToSheet('Boats', { ...boat, status: 'In Tour' as BoatStatus });
    await createLog('Tour Dispatched', 'Tour', `Vessel ${boat?.boatname} dispatched on ${tour.route}.`);
    setTimeout(refreshData, 2000);
  };

  const updateTour = async (tourId: string, updates: Partial<Tour>) => {
    const tour = data.tours.find(t => t.id === tourId);
    if (!tour) return;
    const updatedTour = { ...tour, ...updates };
    setData(prev => ({ ...prev, tours: prev.tours.map(t => t.id === tourId ? updatedTour : t) }));
    
    // 1. Sync the Tour record itself
    await syncToSheet('Tours', updatedTour);

    // 2. Handle Junction Table if tour is completed
    if (updates.status === 'Completed' && tour.provisions) {
      // For each item where departure - arrival > 0, create a junction record
      for (const prov of updatedTour.provisions) {
        const used = (prov.departureQty || 0) - (prov.arrivalQty || 0);
        if (used > 0) {
          const invItem = data.inventory.find(i => i.name === prov.item);
          if (invItem) {
            const junctionRecord = {
              tourId: updatedTour.airtableRecordId || updatedTour.id,
              inventoryId: invItem.airtableRecordId || invItem.id,
              quantityUsed: used,
              unit: invItem.unit || 'Units',
              timestamp: new Date().toISOString()
            };
            await syncToSheet('TourProvisions', junctionRecord);
          }
        }
      }

      const boat = data.boats.find(b => b.id === tour.boatId);
      if (boat) {
        const remainingTasks = data.tasks.filter(t => t.boatId === boat.id && t.status !== 'Completed');
        const updatedBoat = { ...boat, status: (remainingTasks.length > 0 ? 'In Maintenance' : 'Available') as BoatStatus };
        setData(prev => ({ ...prev, boats: prev.boats.map(b => b.id === boat.id ? updatedBoat : b) }));
        await syncToSheet('Boats', updatedBoat);
      }
      setTimeout(refreshData, 3000);
    }
  };

  const updateInventory = async (item: InventoryItem) => {
    const exists = data.inventory.some(i => i.id === item.id);
    setData(prev => ({
      ...prev,
      inventory: exists ? prev.inventory.map(i => i.id === item.id ? item : i) : [...prev.inventory, item]
    }));
    await syncToSheet('Inventory', item);
    return true;
  };

  const updatePersonnel = async (person: Personnel) => {
    const exists = data.personnel.some(p => p.id === person.id);
    setData(prev => ({ 
      ...prev, 
      personnel: exists ? prev.personnel.map(p => p.id === person.id ? person : p) : [...prev.personnel, person]
    }));
    return await syncToSheet('Personnel', person);
  };

  const handleSendReport = async () => {
    const summary = await generateDailyOperationalSummary(data);
    await createLog('Daily Report Dispatched', 'Personnel', 'AI operational summary generated.');
    alert("Report Generated:\n\n" + summary);
  };

  if (!currentUser) return <Login onLogin={handleLogin} />;

  return (
    <Layout activeTab={activeTab} setActiveTab={setActiveTab} user={currentUser} onLogout={handleLogout} isSyncing={isSyncing} lastSync={lastSync} data={data}>
      {activeTab === 'dashboard' && <Dashboard data={data} onSendFullDailyReport={handleSendReport} isSyncing={isSyncing} />}
      {activeTab === 'fleet' && <BoatDashboard data={data} userRole={currentUser.role} onUpdateTaskStatus={updateTaskStatus} onEditBoat={setEditingBoat} onUpdateBoatStatus={(id, s) => {
        const b = data.boats.find(x => x.id === id); if(b) addBoat({...b, status: s});
      }} onSyncAll={refreshData} />}
      {activeTab === 'tours' && <TourLogForm data={data} onAddTour={addTour} onUpdateTour={updateTour} logAction={createLog} />}
      {activeTab === 'personnel_hub' && <PersonnelDashboard data={data} userRole={currentUser.role} onUpdatePersonnel={updatePersonnel} onDeletePersonnel={(id, rid) => deleteFromSheet('Personnel', 'id', id, rid)} onSyncAll={refreshData} />}
      {activeTab === 'maintenance' && <MaintenanceForm data={data} onAddTask={addMaintenanceTask} onSendReport={() => {}} onUpdateStatus={updateTaskStatus} logAction={createLog} />}
      {activeTab === 'inventory' && <InventoryDashboard data={data} onUpdateInventory={updateInventory} />}
      {activeTab === 'protocols' && <Protocols />}
      {activeTab === 'admin_dashboard' && <AdminDashboard data={data} />}
      {activeTab === 'logs' && <LogSection logs={data.logs} />}
      {activeTab === 'add_forms' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
          {currentUser.role === 'Admin' ? <AddBoatForm onAddBoat={addBoat} /> : <div>Admin access required.</div>}
          {currentUser.role === 'Admin' ? <AddPersonnelForm onAddPersonnel={updatePersonnel} /> : <div>Admin access required.</div>}
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
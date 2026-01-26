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
      const interval = setInterval(refreshData, 300000); 
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

    setData(prev => ({
      ...prev,
      tasks: prev.tasks.map(t => t.id === taskId ? updatedTask : t)
    }));
    await syncToSheet('Tasks', updatedTask);
    await createLog('Task Status Updated', 'Task', `Task "${task.taskType}" marked as ${status}.`);

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
    setData(prev => ({ ...prev, tours: [...prev.tours, tour] }));
    await syncToSheet('Tours', tour);
    await createLog('Tour Dispatched', 'Tour', `Vessel dispatched on ${tour.route} with ${tour.paxCount} PAX.`);
    
    for (const prov of tour.provisions.filter(p => p.departureQty > 0)) {
      const junctionId = `${tour.id}_${prov.item.replace(/\s+/g, '_')}`;
      await syncToSheet('TourProvisions', {
        id: junctionId,
        tourId: [tour.id],
        inventoryId: [prov.item], 
        departureQty: prov.departureQty,
        arrivalQty: 0,
        quantityUsed: 0
      });
    }

    if (tour.isSupportBoatRequired && tour.supportProvisions) {
      for (const prov of tour.supportProvisions.filter(p => p.departureQty > 0)) {
        const junctionId = `${tour.id}_SUPPORT_${prov.item.replace(/\s+/g, '_')}`;
        await syncToSheet('TourProvisions', {
          id: junctionId,
          tourId: [tour.id],
          inventoryId: [prov.item], 
          departureQty: prov.departureQty,
          arrivalQty: 0,
          quantityUsed: 0
        });
      }
    }
  };

  const reconcileInventory = async (items: { item: string, used: number }[]) => {
    const updates: InventoryItem[] = [];
    for (const entry of items) {
      if (entry.used <= 0) continue;
      const invItem = data.inventory.find(i => i.name === entry.item);
      if (invItem) {
        const newStock = Math.max(0, invItem.currentStock - entry.used);
        const updatedItem = { ...invItem, currentStock: newStock, lastUpdated: new Date().toISOString() };
        updates.push(updatedItem);
        await syncToSheet('Inventory', updatedItem);
        if (newStock < invItem.minStock) {
          await createLog('Low Stock Alert', 'Inventory', `Item "${invItem.name}" level dropped to ${newStock}.`);
        }
      }
    }
    return updates;
  };

  const handleSendReport = async () => {
    const summary = await generateDailyOperationalSummary(data);
    await createLog('Daily Report Dispatched', 'Personnel', 'Automated operational summary generated by Gemini AI.');
    alert("Report Generated:\n\n" + summary);
  };

  const updateTour = async (tourId: string, updates: Partial<Tour>) => {
    const tour = data.tours.find(t => t.id === tourId);
    if (!tour) return;

    const updatedTour = { ...tour, ...updates };
    setData(prev => ({
      ...prev,
      tours: prev.tours.map(t => t.id === tourId ? updatedTour : t)
    }));
    await syncToSheet('Tours', updatedTour);

    if (updates.status === 'Completed') {
      await createLog('Tour Completed', 'Tour', `Trip on ${data.boats.find(b => b.id === tour.boatId)?.boatname} reconciled.`);
      
      const aggregatedUsage: Record<string, number> = {};
      
      // Primary reconciliation
      for (const prov of updatedTour.provisions) {
        const used = prov.departureQty - (prov.arrivalQty || 0);
        if (used > 0) aggregatedUsage[prov.item] = (aggregatedUsage[prov.item] || 0) + used;
        
        await syncToSheet('TourProvisions', {
          id: `${updatedTour.id}_${prov.item.replace(/\s+/g, '_')}`,
          tourId: [updatedTour.id],
          inventoryId: [prov.item],
          departureQty: prov.departureQty,
          arrivalQty: prov.arrivalQty || 0,
          quantityUsed: used
        });
      }

      // Support reconciliation
      if (updatedTour.isSupportBoatRequired && updatedTour.supportProvisions) {
        for (const prov of updatedTour.supportProvisions) {
          const used = prov.departureQty - (prov.arrivalQty || 0);
          if (used > 0) aggregatedUsage[prov.item] = (aggregatedUsage[prov.item] || 0) + used;

          await syncToSheet('TourProvisions', {
            id: `${updatedTour.id}_SUPPORT_${prov.item.replace(/\s+/g, '_')}`,
            tourId: [updatedTour.id],
            inventoryId: [prov.item],
            departureQty: prov.departureQty,
            arrivalQty: prov.arrivalQty || 0,
            quantityUsed: used
          });
        }
      }

      const usageArray = Object.entries(aggregatedUsage).map(([item, used]) => ({ item, used }));
      const invUpdates = await reconcileInventory(usageArray);
      
      setData(prev => ({
        ...prev,
        inventory: prev.inventory.map(i => invUpdates.find(u => u.id === i.id) || i)
      }));

      const boat = data.boats.find(b => b.id === tour.boatId);
      if (boat) {
        const lastService = boat.lastServiceDate ? new Date(boat.lastServiceDate) : new Date(0);
        const toursSince = [...data.tours.filter(t => t.id !== tourId), updatedTour].filter(t => 
          t.boatId === boat.id && t.status === 'Completed' && new Date(t.date) >= lastService
        );
        
        const hoursAccumulated = toursSince.reduce((sum, t) => {
          const hmiDelta = (t.hmiEnd || 0) - (t.hmiStart || 0);
          const hmdDelta = (t.hmdEnd || 0) - (t.hmdStart || 0);
          const hmcDelta = (t.hmcEnd || 0) - (t.hmcStart || 0);
          return sum + Math.max(hmiDelta, hmdDelta, hmcDelta);
        }, 0);
        
        if (hoursAccumulated >= 50) {
          const serviceTask: Task = {
            id: `AUTO-SVC-${Math.random().toString(36).substr(2, 5)}`,
            boatId: boat.id,
            taskType: 'Service Required (50Hr Limit)',
            priority: Priority.CRITICAL,
            scheduledDate: new Date().toISOString().split('T')[0],
            dueDate: new Date().toISOString().split('T')[0],
            personnelInCharge: [],
            status: 'Pending',
            notes: `Auto-generated: Vessel reached ${hoursAccumulated.toFixed(1)} hrs since last service.`
          };
          setData(prev => ({
            ...prev,
            tasks: [...prev.tasks, serviceTask],
            boats: prev.boats.map(b => b.id === boat.id ? { ...b, status: 'In Maintenance' as BoatStatus } : b)
          }));
          await syncToSheet('Tasks', serviceTask);
          await syncToSheet('Boats', { ...boat, status: 'In Maintenance' as BoatStatus });
        }
      }
    }
  };

  const updateInventory = async (item: InventoryItem) => {
    const exists = data.inventory.some(i => i.id === item.id);
    setData(prev => ({
      ...prev,
      inventory: exists ? prev.inventory.map(i => i.id === item.id ? item : i) : [...prev.inventory, item]
    }));
    await syncToSheet('Inventory', item);
    await createLog(exists ? 'Inventory Updated' : 'Inventory Registered', 'Inventory', `Stock adjusted for "${item.name}".`);
    return true;
  };

  const updatePersonnel = async (person: Personnel) => {
    const exists = data.personnel.some(p => p.id === person.id);
    setData(prev => ({ 
      ...prev, 
      personnel: exists ? prev.personnel.map(p => p.id === person.id ? person : p) : [...prev.personnel, person]
    }));
    await createLog(exists ? 'Personnel Profile Updated' : 'Personnel Registered', 'Personnel', `${person.name} profile managed.`);
    return await syncToSheet('Personnel', person);
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
import React, { useState, useEffect, useCallback, useRef } from 'react';
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
import { generateDailyOperationalSummary } from './services/geminiService.ts';
import { syncToSheet, fetchAppData, deleteFromSheet } from './services/sheetService.ts';
import { checkReportStatus, markReportSent, snoozeReport } from './services/reportService.ts';
import { jsPDF } from 'jspdf';

const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<AppUser | null>(null);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [editingBoat, setEditingBoat] = useState<Boat | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSync, setLastSync] = useState<Date | null>(null);
  const [pendingReport, setPendingReport] = useState<'daily' | 'weekly' | null>(null);

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
      await createLog('Data Sync', 'Fleet', 'System state synchronized with cloud database.');
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

  const handleLogout = async () => {
    if (currentUser) {
      await createLog('User Logout', 'Personnel', `${currentUser.name} signed out.`);
    }
    setCurrentUser(null);
  };

  const addBoat = async (boat: Boat) => {
    const exists = data.boats.some(b => b.id === boat.id);
    setData(prev => ({
      ...prev,
      boats: exists ? prev.boats.map(b => b.id === boat.id ? boat : b) : [...prev.boats, boat]
    }));
    const success = await syncToSheet('Boats', boat);
    await createLog(
      exists ? 'Boat Updated' : 'Boat Registered', 
      'Fleet', 
      `${exists ? 'Updated' : 'Registered'} vessel: ${boat.boatname}`
    );
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
    
    await createLog(
      'Task Created', 
      'Task', 
      `Scheduled ${task.taskType} for ${boat?.boatname || 'Vessel'}. Priority: ${task.priority}`
    );
  };

  const updateTaskStatus = async (taskId: string, status: Task['status']) => {
    const task = data.tasks.find(t => t.id === taskId);
    if (!task) return;

    // To ensure dashboard and rolling logs filter properly, we set the dueDate to the day of completion if marking as finished
    const todayStr = new Date().toISOString().split('T')[0];
    const updatedTask: Task = { 
      ...task, 
      status, 
      dueDate: status === 'Completed' ? todayStr : task.dueDate 
    };
    
    const boatId = task.boatId;
    const boat = data.boats.find(b => b.id === boatId);

    setData(prev => ({
      ...prev,
      tasks: prev.tasks.map(t => t.id === taskId ? updatedTask : t)
    }));
    await syncToSheet('Tasks', updatedTask);
    
    await createLog(
      'Task Status Updated', 
      'Task', 
      `Task "${task.taskType}" marked as ${status} for ${boat?.boatname || 'Vessel'}`
    );

    if (!boat) return;

    if (status === 'Pending' || status === 'Ongoing') {
      if (boat.status !== 'In Maintenance') {
        const updatedBoat = { ...boat, status: 'In Maintenance' as BoatStatus };
        setData(prev => ({
          ...prev,
          boats: prev.boats.map(b => b.id === boatId ? updatedBoat : b)
        }));
        await syncToSheet('Boats', updatedBoat);
      }
    } 
    else if (status === 'Completed') {
      const remainingTasks = data.tasks.filter(t => t.boatId === boatId && t.id !== taskId && t.status !== 'Completed');
      if (remainingTasks.length === 0) {
        const updatedBoat = { ...boat, status: 'Available' as BoatStatus };
        setData(prev => ({
          ...prev,
          boats: prev.boats.map(b => b.id === boatId ? updatedBoat : b)
        }));
        await syncToSheet('Boats', updatedBoat);
      }
    }
  };

  const addTour = async (tour: Tour) => {
    setData(prev => ({ ...prev, tours: [...prev.tours, tour] }));
    await syncToSheet('Tours', tour);
    
    const boatName = data.boats.find(b => b.id === tour.boatId)?.boatname || 'Vessel';
    await createLog(
      'Tour Dispatched', 
      'Tour', 
      `Vessel ${boatName} dispatched on ${tour.route} with ${tour.paxCount} PAX.`
    );
    
    for (const prov of tour.provisions.filter(p => p.departureQty > 0)) {
      const junctionId = `${tour.id}_${prov.item.replace(/\s+/g, '_')}`;
      const provision: TourProvision = {
        id: junctionId,
        tourId: tour.id,
        inventoryId: prov.item, 
        departureQty: prov.departureQty,
        arrivalQty: 0,
        quantityUsed: 0,
        item: prov.item,
        category: prov.category
      };
      await syncToSheet('TourProvisions', provision);
    }
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
       const boatName = data.boats.find(b => b.id === updatedTour.boatId)?.boatname || 'Vessel';
       await createLog(
        'Tour Completed', 
        'Tour', 
        `Trip on ${boatName} completed. Gas: ${updatedTour.startGas}->${updatedTour.endGas}`
      );
    }
    
    if (updatedTour.status === 'Completed') {
      const inventoryUpdates: InventoryItem[] = [];
      const newLogs: AuditLog[] = [];

      for (const prov of updatedTour.provisions) {
        const used = prov.departureQty - (prov.arrivalQty || 0);
        const junctionId = `${updatedTour.id}_${prov.item.replace(/\s+/g, '_')}`;
        
        const provisionRecord: TourProvision = {
          id: junctionId,
          tourId: updatedTour.id,
          inventoryId: prov.item,
          departureQty: prov.departureQty,
          arrivalQty: prov.arrivalQty || 0,
          quantityUsed: used
        };
        await syncToSheet('TourProvisions', provisionRecord);

        const invItem = data.inventory.find(i => i.name === prov.item);
        if (invItem && used > 0) {
          const newStock = Math.max(0, invItem.currentStock - used);
          const updatedItem = { ...invItem, currentStock: newStock, lastUpdated: new Date().toISOString() };
          inventoryUpdates.push(updatedItem);
          await syncToSheet('Inventory', updatedItem);

          if (newStock < invItem.minStock) {
            const logId = `LOG-INV-${Math.random().toString(36).substr(2, 5)}`;
            const log: AuditLog = {
              id: logId,
              timestamp: new Date().toISOString(),
              action: 'Low Stock Alert',
              category: 'Inventory',
              details: `Item "${invItem.name}" stock level (${newStock}) is below minimum (${invItem.minStock}).`
            };
            newLogs.push(log);
            await syncToSheet('AuditLogs', log);
          }
        }
      }

      setData(prev => ({
        ...prev,
        inventory: prev.inventory.map(i => {
          const upd = inventoryUpdates.find(u => u.id === i.id);
          return upd || i;
        }),
        logs: [...newLogs, ...prev.logs]
      }));

      const boat = data.boats.find(b => b.id === updatedTour.boatId);
      if (boat) {
        const lastService = boat.lastServiceDate ? new Date(boat.lastServiceDate) : new Date(0);
        const toursSince = [...data.tours.filter(t => t.id !== tourId), updatedTour].filter(t => 
          t.boatId === boat.id && 
          t.status === 'Completed' && 
          new Date(t.date) >= lastService
        );
        
        const hoursAccumulated = toursSince.reduce((sum, t) => sum + ((t.hmiEnd || 0) - (t.hmiStart || 0)), 0);
        
        if (hoursAccumulated >= 50) {
          const existingAlert = data.tasks.find(t => t.boatId === boat.id && t.taskType.includes('50Hr Limit') && t.status !== 'Completed');
          if (!existingAlert) {
            const serviceTask: Task = {
              id: `AUTO-SVC-${Math.random().toString(36).substr(2, 5)}`,
              boatId: boat.id,
              taskType: 'Service Required (50Hr Limit)',
              priority: Priority.CRITICAL,
              scheduledDate: new Date().toISOString().split('T')[0],
              dueDate: new Date().toISOString().split('T')[0],
              personnelInCharge: [],
              status: 'Pending',
              notes: `Auto-generated: Boat has accumulated ${hoursAccumulated.toFixed(1)} hrs since ${boat.lastServiceDate || 'initial record'}.`
            };
            
            setData(prev => ({
              ...prev,
              tasks: [...prev.tasks, serviceTask],
              boats: prev.boats.map(b => b.id === boat.id ? { ...b, status: 'In Maintenance' as BoatStatus } : b)
            }));
            await syncToSheet('Tasks', serviceTask);
            await syncToSheet('Boats', { ...boat, status: 'In Maintenance' as BoatStatus });
            await createLog('Service Alert Generated', 'Fleet', `Vessel ${boat.boatname} reached 50Hr service threshold.`);
          }
        }
      }
    }
  };

  const updateInventory = async (item: InventoryItem) => {
    const exists = data.inventory.some(i => i.id === item.id);
    setData(prev => ({
      ...prev,
      inventory: exists 
        ? prev.inventory.map(i => i.id === item.id ? item : i)
        : [...prev.inventory, item]
    }));
    
    const success = await syncToSheet('Inventory', item);
    await createLog(
      exists ? 'Inventory Updated' : 'Inventory Item Registered', 
      'Inventory', 
      `Stock for "${item.name}" adjusted to ${item.currentStock} ${item.unit}.`
    );
    return success;
  };

  const updatePersonnel = async (person: Personnel) => {
    const prevPerson = data.personnel.find(p => p.id === person.id);
    const exists = !!prevPerson;
    
    setData(prev => ({ 
      ...prev, 
      personnel: exists ? prev.personnel.map(p => p.id === person.id ? person : p) : [...prev.personnel, person]
    }));

    if (prevPerson && prevPerson.isActive && !person.isActive) {
      await createLog('Personnel Archived', 'Personnel', `Staff member "${person.name}" archived. Reason: ${person.inactiveReason || 'Other'}`);
    } else if (!exists) {
      await createLog('Personnel Registered', 'Personnel', `New staff member "${person.name}" added to database.`);
    } else {
      await createLog('Personnel Profile Updated', 'Personnel', `Profile updated for ${person.name}.`);
    }

    const success = await syncToSheet('Personnel', person);
    if (!success) {
      alert("Registration Error: Failed to synchronize personnel data with the cloud. Please check your connection or contact the administrator.");
    }
    return success;
  };

  if (!currentUser) return <Login onLogin={handleLogin} />;

  const handleOnboardPersonnel = async (p: Personnel) => {
    const success = await updatePersonnel({...p, isActive: true});
    if (success) {
      setActiveTab('personnel_hub');
    }
  };

  return (
    <Layout activeTab={activeTab} setActiveTab={setActiveTab} user={currentUser} onLogout={handleLogout} isSyncing={isSyncing} lastSync={lastSync} data={data}>
      {activeTab === 'dashboard' && <Dashboard data={data} onSendFullDailyReport={() => createLog('Daily Report Sent', 'Personnel', 'Automated Daily Summary triggered by Admin.')} isSyncing={isSyncing} />}
      {activeTab === 'fleet' && <BoatDashboard data={data} userRole={currentUser.role} onUpdateTaskStatus={updateTaskStatus} onEditBoat={setEditingBoat} onUpdateBoatStatus={(id, s) => {
        const boat = data.boats.find(b => b.id === id);
        if (boat) addBoat({...boat, status: s});
      }} onSyncAll={refreshData} />}
      {activeTab === 'tours' && <TourLogForm data={data} onAddTour={addTour} onUpdateTour={updateTour} logAction={createLog} />}
      {activeTab === 'personnel_hub' && <PersonnelDashboard data={data} userRole={currentUser.role} onUpdatePersonnel={updatePersonnel} onDeletePersonnel={(id, rid) => deleteFromSheet('Personnel', 'id', id, rid)} onSyncAll={refreshData} />}
      {activeTab === 'maintenance' && <MaintenanceForm data={data} onAddTask={addMaintenanceTask} onSendReport={() => createLog('Maintenance Report Exported', 'Task', 'PDF report generated for technical team.')} onUpdateStatus={updateTaskStatus} logAction={createLog} />}
      {activeTab === 'inventory' && <InventoryDashboard data={data} onUpdateInventory={updateInventory} />}
      {activeTab === 'protocols' && <Protocols />}
      {activeTab === 'admin_dashboard' && <AdminDashboard data={data} />}
      {activeTab === 'logs' && <LogSection logs={data.logs} />}
      {activeTab === 'add_forms' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
          {currentUser.role === 'Admin' ? <AddBoatForm onAddBoat={addBoat} /> : <div>Admin access required.</div>}
          {currentUser.role === 'Admin' ? <AddPersonnelForm onAddPersonnel={handleOnboardPersonnel} /> : <div>Admin access required.</div>}
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
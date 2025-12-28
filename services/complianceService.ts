import { Boat, Personnel, AppData, Tour, Task } from "../types";

export interface ComplianceAlert {
  id: string;
  type: 'Boat' | 'Staff' | 'Tour' | 'Task';
  name: string;
  date: string;
  severity: 'Critical' | 'Warning';
  daysLeft: number; // For tours/tasks, represents hours/days elapsed if negative
}

export const checkCompliance = (data: AppData): ComplianceAlert[] => {
  const alerts: ComplianceAlert[] = [];
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  // Check Boats
  data.boats.forEach(boat => {
    if (boat.licenseExpDate) {
      const exp = new Date(boat.licenseExpDate);
      const diffTime = exp.getTime() - today.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      if (diffDays <= 0) {
        alerts.push({
          id: boat.id,
          type: 'Boat',
          name: boat.name,
          date: boat.licenseExpDate,
          severity: 'Critical',
          daysLeft: diffDays
        });
      } else if (diffDays <= 30) {
        alerts.push({
          id: boat.id,
          type: 'Boat',
          name: boat.name,
          date: boat.licenseExpDate,
          severity: 'Warning',
          daysLeft: diffDays
        });
      }
    }
  });

  // Check Personnel
  data.personnel.filter(p => p.isActive).forEach(person => {
    if (person.licenseExpDate) {
      const exp = new Date(person.licenseExpDate);
      const diffTime = exp.getTime() - today.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      if (diffDays <= 0) {
        alerts.push({
          id: person.id,
          type: 'Staff',
          name: person.name,
          date: person.licenseExpDate,
          severity: 'Critical',
          daysLeft: diffDays
        });
      } else if (diffDays <= 30) {
        alerts.push({
          id: person.id,
          type: 'Staff',
          name: person.name,
          date: person.licenseExpDate,
          severity: 'Warning',
          daysLeft: diffDays
        });
      }
    }
  });

  // Check Overdue Tours (Arrival log missing after 9 hours)
  const OVERDUE_THRESHOLD_MS = 9 * 60 * 60 * 1000;
  data.tours.forEach(tour => {
    if (tour.status === 'Dispatched') {
      const timeStr = tour.departureTime.includes(':') && tour.departureTime.length === 4 
        ? `0${tour.departureTime}` 
        : tour.departureTime;
      
      const departureDateTime = new Date(`${tour.date}T${timeStr}`);
      const elapsed = now.getTime() - departureDateTime.getTime();

      if (elapsed > OVERDUE_THRESHOLD_MS) {
        const boatName = data.boats.find(b => b.id === tour.boatId)?.name || 'Unknown Vessel';
        const hoursElapsed = Math.floor(elapsed / (1000 * 60 * 60));
        
        alerts.push({
          id: tour.id,
          type: 'Tour',
          name: `${boatName} (${tour.route})`,
          date: tour.date,
          severity: 'Critical',
          daysLeft: hoursElapsed 
        });
      }
    }
  });

  // Check Overdue Maintenance Tasks
  data.tasks.forEach(task => {
    if (task.status !== 'Completed') {
      const dueDate = new Date(task.dueDate);
      const diffTime = dueDate.getTime() - today.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      if (diffDays < 0) {
        const boatName = data.boats.find(b => b.id === task.boatId)?.name || 'Generic';
        alerts.push({
          id: task.id,
          type: 'Task',
          name: `${boatName}: ${task.taskType}`,
          date: task.dueDate,
          severity: 'Critical',
          daysLeft: diffDays
        });
      } else if (diffDays <= 2) {
        const boatName = data.boats.find(b => b.id === task.boatId)?.name || 'Generic';
        alerts.push({
          id: task.id,
          type: 'Task',
          name: `${boatName}: ${task.taskType}`,
          date: task.dueDate,
          severity: 'Warning',
          daysLeft: diffDays
        });
      }
    }
  });

  return alerts;
};
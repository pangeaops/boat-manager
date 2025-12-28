import { AppData } from "../types";

/**
 * Pangea Ops - Automated Reporting Engine
 * 
 * Handles scheduling logic for daily and weekly operational reports.
 */

const SNOOZE_DURATION_MS = 3600000; // 1 Hour

export const checkReportStatus = (data: AppData) => {
  const today = new Date().toISOString().split('T')[0];
  const lastDaily = localStorage.getItem('last_daily_report_sent');
  const lastWeekly = localStorage.getItem('last_weekly_report_sent');
  
  const dailySnoozeAt = localStorage.getItem('daily_report_snooze');
  const weeklySnoozeAt = localStorage.getItem('weekly_report_snooze');
  
  const now = Date.now();

  const isDailySnoozed = dailySnoozeAt && (now - parseInt(dailySnoozeAt) < SNOOZE_DURATION_MS);
  const isWeeklySnoozed = weeklySnoozeAt && (now - parseInt(weeklySnoozeAt) < SNOOZE_DURATION_MS);

  const needsDaily = (lastDaily !== today) && !isDailySnoozed;
  
  let needsWeekly = false;
  if (!lastWeekly) {
    needsWeekly = !isWeeklySnoozed;
  } else {
    const lastDate = new Date(lastWeekly);
    const diffDays = (now - lastDate.getTime()) / (1000 * 60 * 60 * 24);
    if (diffDays >= 7 && !isWeeklySnoozed) needsWeekly = true;
  }

  return { needsDaily, needsWeekly };
};

export const markReportSent = (type: 'daily' | 'weekly') => {
  const today = new Date().toISOString().split('T')[0];
  localStorage.setItem(`last_${type}_report_sent`, today);
  // Clear snooze once sent
  localStorage.removeItem(`${type}_report_snooze`);
};

export const snoozeReport = (type: 'daily' | 'weekly') => {
  localStorage.setItem(`${type}_report_snooze`, Date.now().toString());
};

export const getReportRecipients = () => {
  return ['ops@pangeabocas.com', 'hello@pangeabocas.com'];
};

export const generateWeeklySummaryData = (data: AppData) => {
  const oneWeekAgo = new Date();
  oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
  
  const recentTours = data.tours.filter(t => new Date(t.date) >= oneWeekAgo);
  const totalPax = recentTours.reduce((acc, t) => acc + (t.paxCount || 0), 0);
  
  return {
    period: 'Last 7 Days',
    tourCount: recentTours.length,
    totalPax,
    activeMaintenance: data.tasks.filter(t => t.status !== 'Completed').length
  };
};
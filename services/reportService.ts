import { AppData } from "../types";

/**
 * Pangea Ops - Automated Reporting Engine
 */

export const checkReportStatus = (data: AppData) => {
  const today = new Date().toISOString().split('T')[0];
  const lastDaily = localStorage.getItem('last_daily_report_sent');
  const lastWeekly = localStorage.getItem('last_weekly_report_sent');

  const needsDaily = lastDaily !== today;
  
  let needsWeekly = false;
  if (!lastWeekly) {
    needsWeekly = true;
  } else {
    const lastDate = new Date(lastWeekly);
    const diffDays = (new Date().getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24);
    if (diffDays >= 7) needsWeekly = true;
  }

  return { needsDaily, needsWeekly };
};

export const markReportSent = (type: 'daily' | 'weekly') => {
  const today = new Date().toISOString().split('T')[0];
  localStorage.setItem(`last_${type}_report_sent`, today);
};

export const getReportRecipients = () => {
  // Support for multiple recipients simultaneously
  return ['ops@pangeabocas.com', 'hello@pangeabocas.com'];
};

export const generateWeeklySummaryData = (data: AppData) => {
  // Logic to aggregate the last 7 days of tours and maintenance
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
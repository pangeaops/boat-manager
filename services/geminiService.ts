
import { GoogleGenAI } from "@google/genai";
import { AppData, Task, Tour, AuditLog } from "../types";

const handleApiError = (error: any) => {
  console.error("Gemini API Error:", error);
  if (error?.message?.includes("429") || error?.status === 429 || error?.message?.toLowerCase().includes("quota")) {
    return "QUOTA_EXCEEDED: The AI service is currently at capacity or quota limits reached. Please wait a few minutes or check your Gemini API billing plan.";
  }
  return "Unable to generate insights at this time due to a connection error.";
};

export const getFleetInsights = async (data: AppData) => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const prompt = `
    Analyze this fleet data and provide a concise summary of operational health:
    Boats: ${JSON.stringify(data.boats.map(b => ({ name: b.name, status: b.status })))}
    Tasks: ${JSON.stringify(data.tasks.filter(t => t.status !== 'Completed'))}
    
    Focus on:
    1. Critical maintenance risks.
    2. Operational bottleneck warnings.
    3. Suggested next priorities for the operations manager.
    Keep it professional and action-oriented. Max 3 short paragraphs.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
    });
    return response.text;
  } catch (error) {
    return handleApiError(error);
  }
};

export const generateOverdueAlert = async (overdueTasks: (Task & { boatName: string, staffNames: string[] })[]) => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const taskList = overdueTasks.map(t => `- ID: ${t.id}, Type: ${t.taskType}, Boat: ${t.boatName}, Due: ${t.dueDate}, Assigned: ${t.staffNames.join(', ')}`).join('\n');
  
  const prompt = `
    Draft a professional and urgent alert email to ops@pangeabocas.com regarding these overdue tasks:
    ${taskList}
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
    });
    return response.text;
  } catch (error) {
    console.error("Overdue Alert Draft Error:", error);
    return null;
  }
};

export const generateTaskReport = async (task: Task, boatName: string, staffNames: string[]) => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  const prompt = `
    Generate a formal maintenance report for Pangea Bocas.
    Vessel: ${boatName}, Task: ${task.taskType}, Status: ${task.status}, Notes: ${task.notes || 'None'}.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
    });
    return response.text;
  } catch (error) {
    return handleApiError(error);
  }
};

export const generateDailyOperationalSummary = async (data: AppData) => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const today = new Date().toISOString().split('T')[0];
  
  const todayTours = data.tours.filter(t => t.date === today);
  const activeTasks = data.tasks.filter(t => t.status !== 'Completed');

  const prompt = `
    Draft a comprehensive daily operational summary for Pangea Bocas.
    Date: ${today}
    Tours: ${JSON.stringify(todayTours)}
    Maintenance: ${JSON.stringify(activeTasks)}
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
    });
    return response.text;
  } catch (error) {
    return handleApiError(error);
  }
};

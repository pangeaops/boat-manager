
import { GoogleGenAI } from "@google/genai";
import { AppData, Task } from "../types";

const handleApiError = (error: any) => {
  console.error("Gemini API Error:", error);
  const msg = error?.message || "";
  if (msg.includes("429") || msg.toLowerCase().includes("quota")) {
    return "QUOTA_EXCEEDED: The AI service is currently at capacity or quota limits reached. Please wait a few minutes.";
  }
  if (msg.includes("API_KEY_INVALID") || msg.includes("API key not found")) {
    return "INVALID_API_KEY: The Gemini API Key is missing or invalid. Check your Netlify environment variables.";
  }
  return `API_ERROR: ${msg || "Unable to generate insights at this time."}`;
};

export const getFleetInsights = async (data: AppData) => {
  if (!process.env.API_KEY) return "API_KEY_MISSING: Please configure the Gemini API Key in Netlify.";
  
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const prompt = `
    Analyze this fleet data and provide a concise summary of operational health:
    Boats: ${JSON.stringify(data.boats.map(b => ({ name: b.boatname, status: b.status })))}
    Tasks: ${JSON.stringify(data.tasks.filter(t => t.status !== 'Completed'))}
    
    Focus on:
    1. Critical maintenance risks.
    2. Operational bottleneck warnings.
    3. Suggested next priorities.
    Keep it professional. Max 3 short paragraphs.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
    });
    return response.text || "The AI generated an empty response. This might be due to safety filters.";
  } catch (error) {
    return handleApiError(error);
  }
};

export const generateDailyOperationalSummary = async (data: AppData) => {
  if (!process.env.API_KEY) return "API_KEY_MISSING: Please configure the Gemini API Key in Netlify.";

  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const today = new Date().toISOString().split('T')[0];
  
  const todayTours = data.tours.filter(t => t.date === today);
  const activeTasks = data.tasks.filter(t => t.status !== 'Completed');

  const prompt = `
    Draft a comprehensive daily operational summary for Pangea Bocas.
    Date: ${today}
    Tours Dispatched Today: ${JSON.stringify(todayTours)}
    Active Maintenance: ${JSON.stringify(activeTasks)}
    Personnel on Duty: ${JSON.stringify(data.personnel.filter(p => p.isActive).map(p => p.name))}
    
    Format as a formal business report.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
    });
    return response.text || "The AI generated an empty response.";
  } catch (error) {
    return handleApiError(error);
  }
};

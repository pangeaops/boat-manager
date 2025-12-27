/**
 * Pangea Ops - Google Sheets & Drive Sync Service
 * 
 * Optimized for Production (Netlify) + Google Apps Script
 */

const SCRIPT_URL = "https://script.google.com/macros/s/AKfycbwyK2c-jGvMxuoimp5nj1m_vfclV5cGY9h28oonObGQyJ46qpxlHmIThfJ5-3Svh6bL5w/exec";

// Mapping dictionary to translate Sheet Names to App State Keys
export const SHEET_MAP: Record<string, string> = {
  "Boats": "boats",
  "Personnel Info": "personnel",
  "Tours": "tours",
  "Inventory": "inventory",
  "AuditLogs": "logs",
  "Tasks": "tasks"
};

export const syncToSheet = async (sheetName: string, data: any) => {
  if (!SCRIPT_URL || SCRIPT_URL.includes("PASTE_YOUR_GOOGLE_APPS_SCRIPT_URL_HERE")) {
    console.warn(`[Sync] Skipped ${sheetName}: No Bridge URL.`);
    return false;
  }

  try {
    // 1. Prepare Payload
    const payload = {
      method: "update",
      sheet: sheetName,
      data: {
        ...data,
        _lastUpdated: new Date().toISOString(),
        _syncToken: Math.random().toString(36).substr(2, 9)
      }
    };

    // 2. Dispatch using Opaque mode (CORS-safe for Netlify)
    // We use text/plain to trigger a "Simple Request" which bypasses CORS preflight
    await fetch(`${SCRIPT_URL}?t=${Date.now()}`, {
      method: 'POST',
      mode: 'no-cors', 
      cache: 'no-cache',
      credentials: 'omit',
      headers: { 'Content-Type': 'text/plain' },
      body: JSON.stringify(payload),
    });

    console.log(`[Sync] Outbound to "${sheetName}" successful.`);
    return true;
  } catch (error) {
    console.error(`[Sync] Outbound Failure for "${sheetName}":`, error);
    return false;
  }
};

export const fetchAppData = async () => {
  if (!SCRIPT_URL || SCRIPT_URL.includes("PASTE_YOUR_GOOGLE_APPS_SCRIPT_URL_HERE")) return null;

  try {
    const response = await fetch(`${SCRIPT_URL}?t=${Date.now()}&cb=${Math.random()}`, {
      method: 'GET',
      mode: 'cors',
      cache: 'no-store',
      credentials: 'omit',
      redirect: 'follow'
    });

    if (!response.ok) return null;

    const rawData = await response.json();
    
    // Normalize Data: Map Sheet Names back to App State keys
    const normalized: any = {};
    Object.keys(rawData).forEach(sheetKey => {
      const stateKey = SHEET_MAP[sheetKey] || sheetKey.toLowerCase();
      normalized[stateKey] = rawData[sheetKey];
    });

    return normalized;
  } catch (error) {
    console.error("[Sync] Inbound Fetch error:", error);
    return null;
  }
};
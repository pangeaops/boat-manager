/**
 * Pangea Ops - Google Sheets & Drive Sync Service
 * 
 * Optimized for Production (Netlify) + Google Apps Script
 * Handles flattening and expansion of complex boat/tour data
 */

const SCRIPT_URL = "https://script.google.com/macros/s/AKfycbwyK2c-jGvMxuoimp5nj1m_vfclV5cGY9h28oonObGQyJ46qpxlHmIThfJ5-3Svh6bL5w/exec";

// Mapping dictionary to translate Sheet Tab Names to Application State Keys
export const SHEET_MAP: Record<string, string> = {
  "Boats": "boats",
  "Personnel": "personnel", // Updated to match actual Sheet tab name
  "Tours": "tours",
  "Inventory": "inventory",
  "AuditLogs": "logs",
  "Tasks": "tasks"
};

/**
 * Prepares data for Google Sheets. 
 * Serializes arrays and objects into JSON strings so they fit in single cells.
 */
const serializeForSheet = (data: any) => {
  if (!data) return null;
  const cleaned: any = {};
  
  Object.keys(data).forEach(key => {
    const val = data[key];
    if (typeof val === 'boolean') {
      cleaned[key] = val ? "TRUE" : "FALSE";
    } else if (val === null || val === undefined) {
      cleaned[key] = "";
    } else if (Array.isArray(val) || (typeof val === 'object' && val !== null)) {
      // CRITICAL: Google Sheets cannot store arrays/objects. 
      // We must stringify these to prevent data loss or bridge errors.
      cleaned[key] = JSON.stringify(val);
    } else {
      cleaned[key] = val;
    }
  });
  
  return cleaned;
};

/**
 * Reverses serialization from Sheet data back into JSON objects.
 */
const deserializeFromSheet = (item: any) => {
  if (!item) return item;
  const expanded: any = {};
  
  Object.keys(item).forEach(key => {
    const val = item[key];
    if (typeof val === 'string' && (val.startsWith('[') || val.startsWith('{'))) {
      try {
        expanded[key] = JSON.parse(val);
      } catch {
        expanded[key] = val;
      }
    } else if (val === "TRUE") {
      expanded[key] = true;
    } else if (val === "FALSE") {
      expanded[key] = false;
    } else {
      expanded[key] = val;
    }
  });
  
  return expanded;
};

export const syncToSheet = async (sheetName: string, data: any) => {
  if (!SCRIPT_URL || SCRIPT_URL.includes("PASTE_YOUR_GOOGLE_APPS_SCRIPT_URL_HERE")) {
    console.warn(`[PangeaCloud] Sync to ${sheetName} aborted: No Script URL.`);
    return false;
  }

  try {
    const payload = {
      method: "update",
      sheet: sheetName,
      data: serializeForSheet(data),
      _timestamp: new Date().toISOString(),
      _client: "PangeaOps-Production"
    };

    // Use text/plain with no-cors to bypass OPTIONS preflight (CORS issues on GAS)
    await fetch(SCRIPT_URL, {
      method: 'POST',
      mode: 'no-cors', 
      cache: 'no-cache',
      headers: { 'Content-Type': 'text/plain' },
      body: JSON.stringify(payload),
    });

    console.log(`[PangeaCloud] Successfully dispatched data to ${sheetName}`);
    return true;
  } catch (error) {
    console.error(`[PangeaCloud] Sync error for ${sheetName}:`, error);
    return false;
  }
};

export const fetchAppData = async () => {
  if (!SCRIPT_URL || SCRIPT_URL.includes("PASTE_YOUR_GOOGLE_APPS_SCRIPT_URL_HERE")) return null;

  try {
    const response = await fetch(`${SCRIPT_URL}?t=${Date.now()}`, {
      method: 'GET',
      mode: 'cors',
      cache: 'no-store',
      redirect: 'follow'
    });

    if (!response.ok) throw new Error("Cloud Bridge Unavailable");

    const rawData = await response.json();
    const normalized: any = {};
    
    Object.keys(rawData).forEach(sheetKey => {
      const stateKey = SHEET_MAP[sheetKey] || sheetKey.toLowerCase();
      const rows = rawData[sheetKey];
      
      if (Array.isArray(rows)) {
        normalized[stateKey] = rows.map(row => deserializeFromSheet(row));
      } else {
        normalized[stateKey] = rows;
      }
    });

    return normalized;
  } catch (error) {
    console.error("[PangeaCloud] Inbound fetch failed:", error);
    return null;
  }
};
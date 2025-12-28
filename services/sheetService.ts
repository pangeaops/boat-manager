/**
 * Pangea Ops - Google Sheets & Drive Sync Service
 * 
 * Optimized for Production (Netlify) + Google Apps Script
 * strictly aligned with user-provided CSV headers.
 */

const SCRIPT_URL = "https://script.google.com/macros/s/AKfycbwyK2c-jGvMxuoimp5nj1m_vfclV5cGY9h28oonObGQyJ46qpxlHmIThfJ5-3Svh6bL5w/exec";

// Mapping dictionary to translate Sheet Tab Names to Application State Keys
export const SHEET_MAP: Record<string, string> = {
  "Boats": "boats",
  "Personnel": "personnel",
  "Tours": "tours",
  "Inventory": "inventory",
  "AuditLogs": "logs",
  "Tasks": "tasks"
};

/**
 * Prepares data for Google Sheets. 
 * Serializes arrays and objects into JSON strings.
 */
const serializeForSheet = (sheetName: string, data: any) => {
  if (!data) return null;
  const cleaned: any = {};
  
  // For AuditLogs and Boats, 'id' is in Column A.
  // For Personnel, Column A is 'name'. We send 'id' as a hidden field if needed, 
  // but we prioritize matching the Sheet's Row 1 headers.
  Object.keys(data).forEach(key => {
    const val = data[key];
    
    // Handle specific data types for Sheet compatibility
    if (typeof val === 'boolean') {
      cleaned[key] = val ? "TRUE" : "FALSE";
    } else if (val === null || val === undefined) {
      cleaned[key] = "";
    } else if (Array.isArray(val) || (typeof val === 'object' && val !== null)) {
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
    console.warn(`[PangeaCloud] Sync aborted: No valid Script URL found.`);
    return false;
  }

  try {
    const payload = {
      method: "update",
      sheet: sheetName,
      data: serializeForSheet(sheetName, data),
      _timestamp: new Date().toISOString(),
      _client: "PangeaOps-V3-Production"
    };

    // Use text/plain with no-cors to bypass OPTIONS preflight
    await fetch(SCRIPT_URL, {
      method: 'POST',
      mode: 'no-cors', 
      cache: 'no-cache',
      headers: { 'Content-Type': 'text/plain' },
      body: JSON.stringify(payload),
    });

    console.log(`[PangeaCloud] Data dispatched to ${sheetName} successfully.`);
    return true;
  } catch (error) {
    console.error(`[PangeaCloud] Sync failed for ${sheetName}:`, error);
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

    if (!response.ok) throw new Error("Cloud bridge timeout.");

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
    console.error("[PangeaCloud] Inbound fetch error:", error);
    return null;
  }
};
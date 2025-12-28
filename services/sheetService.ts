/**
 * Pangea Ops - Google Sheets & Drive Sync Service
 * 
 * Optimized for Production (Netlify) + Google Apps Script
 * Includes an explicit Header Translation Layer for truncated spreadsheet columns.
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
 * MANDATORY MAPPING: These must match the EXACT text in Row 1 of your Google Sheet.
 * If your Sheet header is truncated (e.g. "passportNumbe"), this map fixes it.
 */
const PERSONNEL_HEADER_MAP: Record<string, string> = {
  "id": "id",
  "name": "name",
  "role": "role",
  "phone": "phone",
  "email": "email",
  "idNumber": "idNumber",
  "passportNumber": "passportNumbe", // Truncated in user sheet
  "bloodType": "bloodType",
  "allergies": "allergies",
  "isActive": "isActive",
  "inactiveReason": "inactiveReason",
  "inactiveDate": "inactiveDate",
  "bankName": "bankName",
  "bankAccountNum": "bankAccountNum",
  "bankAccountType": "bankAccountTyp", // Truncated in user sheet
  "shirtSize": "shirtSize",
  "pantsSize": "pantsSize",
  "shoeSize": "shoeSize",
  "dependent1Name": "dependent1Nam",   // Truncated in user sheet
  "emergencyContactName": "emergencyContactName",
  "emergencyContactPhone": "emergencyContactPhone"
};

/**
 * Prepares data for Google Sheets by flattening and translating keys.
 */
const serializeForSheet = (sheetName: string, data: any) => {
  if (!data) return null;
  const cleaned: any = {};
  
  // Ensure 'id' is always first for Column A matching
  if (data.id) cleaned['id'] = data.id;

  Object.keys(data).forEach(key => {
    if (key === 'id') return; // Handled above

    // Translate key if we are syncing Personnel
    const targetKey = (sheetName === 'Personnel' && PERSONNEL_HEADER_MAP[key]) 
      ? PERSONNEL_HEADER_MAP[key] 
      : key;

    const val = data[key];
    if (typeof val === 'boolean') {
      cleaned[targetKey] = val ? "TRUE" : "FALSE";
    } else if (val === null || val === undefined) {
      cleaned[targetKey] = "";
    } else if (Array.isArray(val) || (typeof val === 'object' && val !== null)) {
      cleaned[targetKey] = JSON.stringify(val);
    } else {
      cleaned[targetKey] = val;
    }
  });
  
  return cleaned;
};

/**
 * Reverses serialization from Sheet data back into JSON objects.
 */
const deserializeFromSheet = (sheetName: string, item: any) => {
  if (!item) return item;
  const expanded: any = {};
  
  // Create reverse map for Personnel to restore internal keys
  const REVERSE_MAP: Record<string, string> = {};
  if (sheetName === 'Personnel') {
    Object.entries(PERSONNEL_HEADER_MAP).forEach(([appKey, sheetKey]) => {
      REVERSE_MAP[sheetKey] = appKey;
    });
  }

  Object.keys(item).forEach(key => {
    const targetKey = REVERSE_MAP[key] || key;
    const val = item[key];
    
    if (typeof val === 'string' && (val.startsWith('[') || val.startsWith('{'))) {
      try {
        expanded[targetKey] = JSON.parse(val);
      } catch {
        expanded[targetKey] = val;
      }
    } else if (val === "TRUE") {
      expanded[targetKey] = true;
    } else if (val === "FALSE") {
      expanded[targetKey] = false;
    } else {
      expanded[targetKey] = val;
    }
  });
  
  return expanded;
};

export const syncToSheet = async (sheetName: string, data: any) => {
  if (!SCRIPT_URL || SCRIPT_URL.includes("PASTE_YOUR_GOOGLE_APPS_SCRIPT_URL_HERE")) {
    console.warn(`[PangeaCloud] Sync aborted: No URL.`);
    return false;
  }

  try {
    const payload = {
      method: "update",
      sheet: sheetName,
      data: serializeForSheet(sheetName, data),
      _timestamp: new Date().toISOString(),
      _client: "PangeaOps-SyncEngine-V2"
    };

    // Use text/plain with no-cors to bypass OPTIONS preflight which GAS doesn't handle well
    await fetch(SCRIPT_URL, {
      method: 'POST',
      mode: 'no-cors', 
      cache: 'no-cache',
      headers: { 'Content-Type': 'text/plain' },
      body: JSON.stringify(payload),
    });

    console.log(`[PangeaCloud] Dispatched to ${sheetName} successfully.`);
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

    if (!response.ok) throw new Error("Connection failed");

    const rawData = await response.json();
    const normalized: any = {};
    
    Object.keys(rawData).forEach(sheetKey => {
      const stateKey = SHEET_MAP[sheetKey] || sheetKey.toLowerCase();
      const rows = rawData[sheetKey];
      
      if (Array.isArray(rows)) {
        normalized[stateKey] = rows.map(row => deserializeFromSheet(sheetKey, row));
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
/**
 * Pangea Ops - Google Sheets & Drive Sync Service
 * 
 * Optimized for Production (Netlify) + Google Apps Script
 * Strictly aligned with user-provided CSV header structure.
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
 * STRICT HEADER LIST based on user-provided CSV.
 * Columns not in this list will be filtered out to prevent Sheet "sinking" errors.
 */
const PERSONNEL_HEADERS = [
  "id", "name", "role", "phone", "email", "idNumber", "passportNumber", 
  "bloodType", "allergies", "isActive", "inactiveReason", "inactiveDate", 
  "bankName", "bankAccountNum", "bankAccountType", "shirtSize", "pantsSize", 
  "shoeSize", "dependent1Name", "dependent1Relation", "dependent2Name", 
  "dependent2Relation", "startDate", "salary", "docPoliceRecords", 
  "docZeroAlcohol", "docConfidentialAgreement", "docImageRights", 
  "docContract", "docAddendum", "profilePhoto", "licensePhoto", "cvDoc", 
  "policeRecordDoc", "contractDoc", "docIdPhoto", "docConfidentiality", 
  "docImageRightsFile", "emergencyContactName", "emergencyContactPhone"
];

/**
 * Prepares data for Google Sheets. 
 * Filters keys based on known headers and flattens objects.
 */
const serializeForSheet = (sheetName: string, data: any) => {
  if (!data) return null;
  const cleaned: any = {};
  
  // Use a reference list for Personnel, otherwise allow all keys
  const allowedKeys = sheetName === 'Personnel' ? PERSONNEL_HEADERS : Object.keys(data);

  allowedKeys.forEach(key => {
    const val = data[key];
    
    if (val === undefined || val === null) {
      cleaned[key] = "";
    } else if (typeof val === 'boolean') {
      cleaned[key] = val ? "TRUE" : "FALSE";
    } else if (Array.isArray(val) || (typeof val === 'object' && val !== null)) {
      // Flatten objects/arrays for Sheet cells
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
    console.warn(`[PangeaCloud] Sync aborted: No valid Script URL.`);
    return false;
  }

  try {
    const payload = {
      method: "update",
      sheet: sheetName,
      data: serializeForSheet(sheetName, data),
      _timestamp: new Date().toISOString(),
      _client: "PangeaOps-V4-Production"
    };

    console.log(`[PangeaCloud] Sinking to ${sheetName}...`);

    // POST using no-cors mode (required for Google Apps Script Web App endpoints)
    await fetch(SCRIPT_URL, {
      method: 'POST',
      mode: 'no-cors', 
      cache: 'no-cache',
      headers: { 'Content-Type': 'text/plain' },
      body: JSON.stringify(payload),
    });

    return true;
  } catch (error) {
    console.error(`[PangeaCloud] Sink error for ${sheetName}:`, error);
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
    console.error("[PangeaCloud] Fetch failed:", error);
    return null;
  }
};
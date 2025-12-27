/**
 * Pangea Ops - Google Sheets "Database Style" Bridge
 */

const SCRIPT_URL = "https://script.google.com/macros/s/AKfycbwP-sZZLIc0VT-ovjFFxyHsch9Cfl_xty61kQToATHjCD9XJVdakR7wE0mbvopex_2GTw/exec";

/**
 * Ensures complex data (arrays/objects) is fully stringified before sending to Sheets.
 * This fixes the [Ljava.lang.Object;@... error in spreadsheet cells.
 */
const sanitizeDataForSync = (data: any) => {
  const sanitized: any = {};
  for (const key in data) {
    const value = data[key];
    // CRITICAL: Robustly detect and stringify any object or array to prevent Apps Script conversion issues
    if (value !== null && typeof value === 'object') {
      try {
        sanitized[key] = JSON.stringify(value);
      } catch (e) {
        console.error(`Stringification failed for key: ${key}`, e);
        sanitized[key] = String(value);
      }
    } else {
      sanitized[key] = value;
    }
  }
  return sanitized;
};

export const syncToSheet = async (sheetName: string, data: any) => {
  if (!SCRIPT_URL) return false;

  try {
    const cleanData = sanitizeDataForSync(data);
    const payload = {
      sheet: sheetName,
      data: cleanData
    };

    // 'no-cors' is mandatory for Google Apps Script POST requests
    await fetch(SCRIPT_URL, {
      method: 'POST',
      mode: 'no-cors',
      headers: { 'Content-Type': 'text/plain' },
      body: JSON.stringify(payload)
    });

    console.log(`Synced ${sheetName} to Cloud (Sanitized & Stringified)`);
    return true;
  } catch (error) {
    console.error(`Failed to sync ${sheetName}:`, error);
    return false;
  }
};

export const fetchAppData = async () => {
  if (!SCRIPT_URL) return null;

  try {
    const response = await fetch(`${SCRIPT_URL}?cb=${Date.now()}`);
    if (!response.ok) throw new Error("Cloud fetch failed");
    const data = await response.json();
    return data;
  } catch (error) {
    console.warn("Cloud pull failed - Using local storage");
    return null;
  }
};
/**
 * Pangea Ops - Google Sheets & Drive Sync Service
 * 
 * Live connection established to: Pangea Bocas Apps Script Bridge
 */

// Updated to the latest bridge URL provided to ensure data flows to the correct sheet
const SCRIPT_URL = "https://script.google.com/macros/s/AKfycbwyK2c-jGvMxuoimp5nj1m_vfclV5cGY9h28oonObGQyJ46qpxlHmIThfJ5-3Svh6bL5w/exec";

export const syncToSheet = async (sheetName: string, data: any) => {
  if (!SCRIPT_URL || SCRIPT_URL.includes("PASTE_YOUR_GOOGLE_APPS_SCRIPT_URL_HERE")) {
    console.warn(`Sync [${sheetName}] skipped: Bridge URL not configured.`);
    return false;
  }

  try {
    console.info(`Cloud Sync Initiated: [${sheetName}] for ${data.name || data.id}`);
    
    // Automatically detect arrays or objects and convert them to JSON strings
    // This prevents the [Ljava.lang.Object;@... error in Google Sheets.
    const sanitizedData = Object.keys(data).reduce((acc, key) => {
      const val = data[key];
      acc[key] = (typeof val === 'object' && val !== null) ? JSON.stringify(val) : val;
      return acc;
    }, {} as any);

    const payload = {
      method: "update",
      sheet: sheetName,
      data: {
        ...sanitizedData,
        _lastUpdated: new Date().toISOString(),
        _clientSource: 'PangeaOps-Web'
      }
    };

    // We use 'text/plain' to ensure a "Simple Request". 
    // This is the most reliable way to send POST data to Google Apps Script 
    // as it avoids complex CORS preflight checks that often fail on GAS redirects.
    await fetch(SCRIPT_URL, {
      method: 'POST',
      mode: 'no-cors', 
      cache: 'no-cache',
      headers: { 
        'Content-Type': 'text/plain' 
      },
      body: JSON.stringify(payload),
    });

    console.log(`Cloud Sync Success: [${sheetName}]`);
    return true;
  } catch (error) {
    console.error(`Cloud Sync Failure [${sheetName}]:`, error);
    return false;
  }
};

export const fetchAppData = async () => {
  if (!SCRIPT_URL || SCRIPT_URL.includes("PASTE_YOUR_GOOGLE_APPS_SCRIPT_URL_HERE")) return null;

  try {
    // Standard GET request to fetch latest data.
    // mode: 'cors' is required to read the response body.
    // credentials: 'omit' and redirect: 'follow' are used to handle the 302 redirect 
    // that Google Apps Script uses to send the actual JSON payload.
    const response = await fetch(`${SCRIPT_URL}?t=${Date.now()}`, {
      method: 'GET',
      mode: 'cors',
      cache: 'no-store',
      credentials: 'omit',
      redirect: 'follow'
    });

    if (!response.ok) {
      console.warn(`Cloud Bridge returned error ${response.status}. Ensure GAS script is published to 'Anyone'.`);
      return null;
    }

    const remoteData = await response.json();
    return remoteData;
  } catch (error) {
    // If you still see "Failed to fetch", verify the Apps Script is published 
    // with: "Execute as: Me" and "Who has access: Anyone".
    console.error("Cloud Fetch Error: Failed to fetch. Ensure script is published to 'Anyone' and CORS is allowed.", error);
    return null;
  }
};
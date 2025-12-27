/**
 * Pangea Ops - Google Sheets & Drive Sync Service
 * 
 * Live connection established to: Pangea Bocas Apps Script Bridge
 */

const SCRIPT_URL = "https://script.google.com/macros/s/AKfycbwyK2c-jGvMxuoimp5nj1m_vfclV5cGY9h28oonObGQyJ46qpxlHmIThfJ5-3Svh6bL5w/exec";

export const syncToSheet = async (sheetName: string, data: any) => {
  if (!SCRIPT_URL || SCRIPT_URL.includes("PASTE_YOUR_GOOGLE_APPS_SCRIPT_URL_HERE")) {
    console.warn(`Sync [${sheetName}] skipped: Bridge URL not configured.`);
    return false;
  }

  try {
    // 1. Deep clean data: remove undefined values and serialize nested objects
    // This reduces payload size and avoids "undefined" string values in Sheets
    const cleanData = (obj: any): any => {
      const result: any = {};
      Object.keys(obj).forEach(key => {
        const value = obj[key];
        if (value === undefined || value === null) return;
        
        if (Array.isArray(value)) {
          result[key] = JSON.stringify(value);
        } else if (typeof value === 'object') {
          result[key] = JSON.stringify(value);
        } else {
          result[key] = value;
        }
      });
      return result;
    };

    const sanitizedData = cleanData(data);

    const payload = {
      method: "update",
      sheet: sheetName,
      data: {
        ...sanitizedData,
        _lastUpdated: new Date().toISOString(),
        _clientSource: 'PangeaOps-Netlify'
      }
    };

    const jsonPayload = JSON.stringify(payload);
    const payloadSize = new Blob([jsonPayload]).size;

    console.info(`[PangeaCloud] Dispatching ${sheetName} update... (${(payloadSize / 1024).toFixed(2)} KB)`);

    if (payloadSize > 5 * 1024 * 1024) {
      console.warn("[PangeaCloud] Warning: Payload size is large. Base64 images may cause timeouts in Google Apps Script.");
    }

    /**
     * CRITICAL: We use 'no-cors' mode with 'text/plain'.
     * This makes the request a "Simple Request" according to CORS spec.
     * Netlify (Production) environment strictly enforces CORS. 
     * Google Apps Script does not return correct CORS headers for preflight OPTIONS.
     * Using 'no-cors' allows the POST to hit the script without an OPTIONS check.
     */
    await fetch(SCRIPT_URL, {
      method: 'POST',
      mode: 'no-cors', 
      cache: 'no-cache',
      credentials: 'omit',
      headers: { 
        'Content-Type': 'text/plain' 
      },
      body: jsonPayload,
    });

    // Note: With 'no-cors', we cannot read the response body or status.
    // We assume success if the fetch promise resolves without throwing.
    console.log(`[PangeaCloud] Sync command accepted for [${sheetName}]`);
    return true;
  } catch (error) {
    console.error(`[PangeaCloud] Sync failed for [${sheetName}]:`, error);
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
      credentials: 'omit',
      redirect: 'follow'
    });

    if (!response.ok) {
      console.warn(`[PangeaCloud] Fetch returned status ${response.status}`);
      return null;
    }

    const remoteData = await response.json();
    return remoteData;
  } catch (error) {
    console.error("[PangeaCloud] Fetch error:", error);
    return null;
  }
};

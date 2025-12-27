/**
 * Pangea Ops - Google Sheets & Drive Sync Service
 * 
 * Live connection established to: Pangea Bocas Apps Script Bridge
 */

const SCRIPT_URL = "https://script.google.com/a/macros/pangeabocas.com/s/AKfycbzhuuI1RqJIoFkJbFPGl0-gCXnb9u7ieR33hk-gzYuYLdhdIFP6aVbTG803LjbCcjxgzQ/exec";

export const syncToSheet = async (sheetName: string, data: any) => {
  if (!SCRIPT_URL || SCRIPT_URL.includes("PASTE_YOUR_GOOGLE_APPS_SCRIPT_URL_HERE")) {
    console.warn(`Sync [${sheetName}] skipped: Bridge URL not configured.`);
    return false;
  }

  try {
    const payload = {
      sheet: sheetName,
      data: {
        ...data,
        _lastUpdated: new Date().toISOString(),
        _clientSource: 'PangeaOps-Web'
      }
    };

    // Note: Apps Script POST often requires no-cors for redirection, 
    // but we can try a standard fetch first.
    await fetch(SCRIPT_URL, {
      method: 'POST',
      mode: 'no-cors', 
      cache: 'no-cache',
      headers: { 
        'Content-Type': 'application/json' 
      },
      body: JSON.stringify(payload),
    });

    console.log(`Cloud Sync Sent: [${sheetName}]`);
    return true;
  } catch (error) {
    console.error(`Cloud Sync Failure [${sheetName}]:`, error);
    return false;
  }
};

export const fetchAppData = async () => {
  if (!SCRIPT_URL || SCRIPT_URL.includes("PASTE_YOUR_GOOGLE_APPS_SCRIPT_URL_HERE")) return null;

  try {
    const response = await fetch(`${SCRIPT_URL}?t=${Date.now()}`); // Cache busting
    if (!response.ok) throw new Error("Google Bridge unreachable.");
    const remoteData = await response.json();
    return remoteData;
  } catch (error) {
    console.error("Cloud Fetch Error:", error);
    return null;
  }
};
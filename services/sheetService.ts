/**
 * Pangea Ops - Google Sheets & Drive Sync Service
 * 
 * Live connection established to: Pangea Bocas Apps Script Bridge
 */

const SCRIPT_URL = "https://script.google.com/a/macros/pangeabocas.com/s/AKfycbyqGqfpwtPUBQSIQG19tmGSsVeznrqEBannT--dYep--mQuEhQItF_azuWVAJhwFbtH3w/exec";

export const syncToSheet = async (sheetName: string, data: any) => {
  if (!SCRIPT_URL || SCRIPT_URL.includes("PASTE_YOUR_GOOGLE_APPS_SCRIPT_URL_HERE")) {
    console.warn(`Sync [${sheetName}] skipped: Bridge URL not configured.`);
    return;
  }

  try {
    const cleanData = JSON.parse(JSON.stringify(data));

    // We use POST to send data to the Google Script bridge
    await fetch(SCRIPT_URL, {
      method: 'POST',
      mode: 'no-cors', // standard for Google Script POST to avoid CORS preflight
      cache: 'no-cache',
      headers: { 
        'Content-Type': 'application/json' 
      },
      body: JSON.stringify({ 
        sheet: sheetName, 
        data: cleanData 
      }),
    });

    console.log(`Cloud Sync: [${sheetName}] update sent to Google Sheets.`);
  } catch (error) {
    console.error(`Cloud Sync Error [${sheetName}]:`, error);
  }
};

export const fetchAppData = async () => {
  if (!SCRIPT_URL || SCRIPT_URL.includes("PASTE_YOUR_GOOGLE_APPS_SCRIPT_URL_HERE")) return null;

  try {
    const response = await fetch(SCRIPT_URL);
    if (!response.ok) throw new Error("Google Bridge unreachable.");
    return await response.json();
  } catch (error) {
    console.error("Initial data fetch failed.", error);
    return null;
  }
};
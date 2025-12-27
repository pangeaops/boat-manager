/**
 * Pangea Ops - Google Sheets & Drive Sync Service
 * 
 * INSTRUCTIONS FOR GOOGLE APPS SCRIPT:
 * 1. Open your Google Sheet (https://docs.google.com/spreadsheets/d/1uzNOkPiBQX0UeK9PvRUPF9kBHX_TzO3swPBWsh2mBjo/)
 * 2. Go to Extensions > Apps Script
 * 3. Delete any existing code and paste the following:
 * 
 * function doPost(e) {
 *   try {
 *     var ss = SpreadsheetApp.getActiveSpreadsheet();
 *     // Read the payload from the text body
 *     var payload = JSON.parse(e.postData.contents);
 *     var sheetName = payload.sheet;
 *     var data = payload.data;
 *     
 *     var sheet = ss.getSheetByName(sheetName);
 *     if (!sheet) {
 *       sheet = ss.insertSheet(sheetName);
 *       var headers = Object.keys(data);
 *       sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
 *     }
 *     
 *     var headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
 *     var newRow = headers.map(function(header) {
 *       return data[header] !== undefined ? data[header] : "";
 *     });
 *     
 *     sheet.appendRow(newRow);
 *     
 *     return ContentService.createTextOutput(JSON.stringify({"result":"success"}))
 *       .setMimeType(ContentService.MimeType.JSON);
 *   } catch (error) {
 *     return ContentService.createTextOutput(JSON.stringify({"result":"error", "message": error.toString()}))
 *       .setMimeType(ContentService.MimeType.JSON);
 *   }
 * }
 * 
 * function doGet(e) {
 *   try {
 *     var ss = SpreadsheetApp.getActiveSpreadsheet();
 *     var sheets = ss.getSheets();
 *     var result = {};
 *     sheets.forEach(function(s) {
 *       var name = s.getName();
 *       var data = s.getDataRange().getValues();
 *       if (data.length > 0) {
 *         var headers = data.shift();
 *         result[name] = data.map(function(row) {
 *           var obj = {};
 *           headers.forEach(function(h, i) { obj[h] = row[i]; });
 *           return obj;
 *         });
 *       } else {
 *         result[name] = [];
 *       }
 *     });
 *     return ContentService.createTextOutput(JSON.stringify(result))
 *       .setMimeType(ContentService.MimeType.JSON);
 *   } catch (error) {
 *     return ContentService.createTextOutput(JSON.stringify({"error": error.toString()}))
 *       .setMimeType(ContentService.MimeType.JSON);
 *   }
 * }
 * 
 * 4. Click "Deploy" > "New Deployment"
 * 5. Select type: "Web App"
 * 6. Set "Execute as" to: "Me"
 * 7. Set "Who has access" to: "Anyone" (Critical for the app to talk to it)
 * 8. Copy the Web App URL and paste it below.
 */

const SCRIPT_URL = "https://script.google.com/a/macros/pangeabocas.com/s/AKfycbzhuuI1RqJIoFkJbFPGl0-gCXnb9u7ieR33hk-gzYuYLdhdIFP6aVbTG803LjbCcjxgzQ/exec";

export const syncToSheet = async (sheetName: string, data: any) => {
  if (!SCRIPT_URL || SCRIPT_URL.includes("PASTE_YOUR_URL")) return false;

  try {
    const payload = {
      sheet: sheetName,
      timestamp: new Date().toISOString(),
      data: { ...data, _clientSource: 'PangeaOps-Web' }
    };

    // 'no-cors' mode is required for fire-and-forget to GAS.
    // Content-Type 'text/plain' makes it a "Simple Request" to avoid preflight OPTIONS.
    await fetch(SCRIPT_URL, {
      method: 'POST',
      mode: 'no-cors', 
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify(payload),
    });

    console.log(`📡 Log Synced: [${sheetName}]`);
    return true;
  } catch (error) {
    console.error(`❌ Sync Failed [${sheetName}]:`, error);
    return false;
  }
};

export const fetchAppData = async () => {
  if (!SCRIPT_URL || SCRIPT_URL.includes("PASTE_YOUR_URL")) return null;

  try {
    /**
     * CRITICAL: We remove the 'Accept' header. 
     * Custom headers trigger a CORS preflight (OPTIONS) which GAS fails.
     * Simple GET requests are allowed and handle redirects correctly.
     */
    const response = await fetch(`${SCRIPT_URL}?t=${Date.now()}`, {
      method: 'GET'
      // No custom headers here!
    });

    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    
    const remoteData = await response.json();
    return remoteData;
  } catch (error) {
    // If we fail here, it's likely a network issue or the URL is not deployed as 'Anyone'
    console.warn("📥 Cloud pull bypassed. Check GAS deployment settings.");
    return null;
  }
};
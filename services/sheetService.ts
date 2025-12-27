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
 *       if (data.length > 1) {
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
 * 7. Set "Who has access" to: "Anyone"
 * 8. Copy the Web App URL and update SCRIPT_URL below.
 */

const SCRIPT_URL = "https://script.google.com/a/macros/pangeabocas.com/s/AKfycbwqakvxIfM9IgTRMSouIls67OYRYRQHTqCqs4NrKqNcmdxycb4KUZSSJ0e3Hfdd6SBhtA/exec";

export const syncToSheet = async (sheetName: string, data: any) => {
  if (!SCRIPT_URL || SCRIPT_URL.includes("PASTE_YOUR_URL")) return false;

  try {
    const payload = {
      sheet: sheetName,
      timestamp: new Date().toISOString(),
      data: { ...data, _clientSource: 'PangeaOps-Web' }
    };

    /**
     * Using 'no-cors' and 'text/plain' to bypass CORS preflight.
     * Google Apps Script does not support OPTIONS requests.
     */
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
     * Simple GET request without custom headers to avoid CORS preflight.
     */
    const response = await fetch(`${SCRIPT_URL}?t=${Date.now()}`, {
      method: 'GET'
    });

    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    
    const remoteData = await response.json();
    console.log("📥 Cloud Data Pulled Successfully");
    return remoteData;
  } catch (error) {
    console.warn("📥 Cloud pull failed. Ensure the Web App is deployed with 'Anyone' access.");
    console.error(error);
    return null;
  }
};

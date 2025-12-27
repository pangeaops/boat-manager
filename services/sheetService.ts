/**
 * Pangea Ops - Google Sheets "Database Style" Bridge
 * 
 * ⚠️ CRITICAL SETUP FOR GOOGLE APPS SCRIPT:
 * 1. Open your Sheet: https://docs.google.com/spreadsheets/d/1uzNOkPiBQX0UeK9PvRUPF9kBHX_TzO3swPBWsh2mBjo/
 * 2. Extensions > Apps Script
 * 3. Paste this code:
 * 
 * function doPost(e) {
 *   try {
 *     var ss = SpreadsheetApp.getActiveSpreadsheet();
 *     var payload = JSON.parse(e.postData.contents);
 *     var sheetName = payload.sheet;
 *     var data = payload.data;
 *     var sheet = ss.getSheetByName(sheetName) || ss.insertSheet(sheetName);
 *     
 *     if (sheet.getLastColumn() == 0) {
 *       var headers = Object.keys(data);
 *       sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
 *     }
 *     
 *     var headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
 *     var newRow = headers.map(function(h) { return data[h] !== undefined ? data[h] : ""; });
 *     sheet.appendRow(newRow);
 *     
 *     return ContentService.createTextOutput("SUCCESS").setMimeType(ContentService.MimeType.TEXT);
 *   } catch (err) {
 *     return ContentService.createTextOutput("ERROR: " + err.message).setMimeType(ContentService.MimeType.TEXT);
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
 *       var values = s.getDataRange().getValues();
 *       if (values.length > 1) {
 *         var headers = values.shift();
 *         result[name] = values.map(function(row) {
 *           var obj = {};
 *           headers.forEach(function(h, i) { obj[h] = row[i]; });
 *           return obj;
 *         });
 *       } else { result[name] = []; }
 *     });
 *     return ContentService.createTextOutput(JSON.stringify(result)).setMimeType(ContentService.MimeType.JSON);
 *   } catch (err) {
 *     return ContentService.createTextOutput(JSON.stringify({error: err.message})).setMimeType(ContentService.MimeType.JSON);
 *   }
 * }
 * 
 * 4. Deploy > New Deployment > Web App.
 * 5. EXECUTE AS: "Me"
 * 6. WHO HAS ACCESS: "Anyone"
 */

const SCRIPT_URL = "https://script.google.com/macros/s/AKfycbwP-sZZLIc0VT-ovjFFxyHsch9Cfl_xty61kQToATHjCD9XJVdakR7wE0mbvopex_2GTw/exec";

export const syncToSheet = async (sheetName: string, data: any) => {
  if (!SCRIPT_URL) return false;

  try {
    const payload = {
      sheet: sheetName,
      data: { ...data, _syncTime: new Date().toISOString() }
    };

    // 'no-cors' mode is used to avoid preflight (OPTIONS) requests
    // Google Apps Script doesn't support OPTIONS requests properly for Web Apps.
    await fetch(SCRIPT_URL, {
      method: 'POST',
      mode: 'no-cors',
      headers: { 'Content-Type': 'text/plain' },
      body: JSON.stringify(payload)
    });

    return true;
  } catch (error) {
    console.error("Cloud Push Failed:", error);
    return false;
  }
};

export const fetchAppData = async () => {
  if (!SCRIPT_URL) return null;

  try {
    // Simple GET with cache-busting and NO custom headers
    const response = await fetch(`${SCRIPT_URL}?cb=${Date.now()}`);
    if (!response.ok) throw new Error("Network Response Not OK");
    return await response.json();
  } catch (error) {
    console.warn("Cloud Pull Failed - Using Local Primary Database");
    return null;
  }
};

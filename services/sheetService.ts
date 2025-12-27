/**
 * Pangea Ops - Google Sheets "Database Style" Bridge
 * 
 * ⚠️ UPDATED SETUP FOR YOUR SPECIFIC COLUMNS:
 * 1. Open: https://docs.google.com/spreadsheets/d/1uzNOkPiBQX0UeK9PvRUPF9kBHX_TzO3swPBWsh2mBjo/
 * 2. Extensions > Apps Script
 * 3. REPLACE ALL existing code with this high-performance version:
 * 
 * function doPost(e) {
 *   var lock = LockService.getScriptLock();
 *   lock.tryLock(10000); // Wait up to 10s for other syncs to finish
 *   try {
 *     var ss = SpreadsheetApp.getActiveSpreadsheet();
 *     var payload = JSON.parse(e.postData.contents);
 *     var sheetName = payload.sheet;
 *     var data = payload.data;
 *     var sheet = ss.getSheetByName(sheetName) || ss.insertSheet(sheetName);
 *     
 *     // If sheet is new/empty, write headers from the incoming keys
 *     if (sheet.getLastColumn() == 0) {
 *       var headers = Object.keys(data);
 *       sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
 *     }
 *     
 *     var headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
 *     
 *     // UPSERT LOGIC: Check if record ID already exists to update it
 *     var idIndex = headers.indexOf('id');
 *     var existingRowIndex = -1;
 *     if (idIndex !== -1 && data.id) {
 *       var colValues = sheet.getRange(1, idIndex + 1, sheet.getLastRow()).getValues();
 *       for (var i = 0; i < colValues.length; i++) {
 *         if (colValues[i][0] == data.id) {
 *           existingRowIndex = i + 1;
 *           break;
 *         }
 *       }
 *     }
 *     
 *     // Map data to the correct columns based on Row 1 headers
 *     var rowData = headers.map(function(h) { 
 *       var val = data[h];
 *       if (val === undefined || val === null) return "";
 *       // Stringify arrays and objects for single-cell storage
 *       if (typeof val === 'object') return JSON.stringify(val);
 *       return val; 
 *     });
 *     
 *     if (existingRowIndex !== -1) {
 *       sheet.getRange(existingRowIndex, 1, 1, rowData.length).setValues([rowData]);
 *     } else {
 *       sheet.appendRow(rowData);
 *     }
 *     
 *     return ContentService.createTextOutput("SUCCESS").setMimeType(ContentService.MimeType.TEXT);
 *   } catch (err) {
 *     return ContentService.createTextOutput("ERROR: " + err.message).setMimeType(ContentService.MimeType.TEXT);
 *   } finally {
 *     lock.releaseLock();
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
 *           headers.forEach(function(h, i) { 
 *             var val = row[i];
 *             // Attempt to parse JSON strings back into arrays/objects
 *             try {
 *               if (typeof val === 'string' && (val.startsWith('[') || val.startsWith('{'))) {
 *                 val = JSON.parse(val);
 *               }
 *             } catch(e) {}
 *             obj[h] = val; 
 *           });
 *           return obj;
 *         });
 *       } else { result[name] = []; }
 *     });
 *     return ContentService.createTextOutput(JSON.stringify(result)).setMimeType(ContentService.MimeType.JSON);
 *   } catch (err) {
 *     return ContentService.createTextOutput(JSON.stringify({error: err.message})).setMimeType(ContentService.MimeType.JSON);
 *   }
 * }
 */

const SCRIPT_URL = "https://script.google.com/macros/s/AKfycbwyK2c-jGvMxuoimp5nj1m_vfclV5cGY9h28oonObGQyJ46qpxlHmIThfJ5-3Svh6bL5w/exec";

export const syncToSheet = async (sheetName: string, data: any) => {
  if (!SCRIPT_URL) return false;

  try {
    const payload = {
      sheet: sheetName,
      data: data
    };

    // 'no-cors' is mandatory for Google Apps Script POST requests
    await fetch(SCRIPT_URL, {
      method: 'POST',
      mode: 'no-cors',
      headers: { 'Content-Type': 'text/plain' },
      body: JSON.stringify(payload)
    });

    console.log(`Synced ${sheetName} to Cloud`);
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
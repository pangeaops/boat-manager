/**
 * Pangea Ops - Google Sheets "Database Style" Bridge
 */

const SCRIPT_URL = "https://script.google.com/macros/s/AKfycbwyK2c-jGvMxuoimp5nj1m_vfclV5cGY9h28oonObGQyJ46qpxlHmIThfJ5-3Svh6bL5w/exec";

/**
 * Sanitizes data for Google Sheets by converting arrays/objects to JSON strings.
 * This prevents the [Ljava.lang.Object; error in cells.
 */
const sanitizeDataForSheet = (data: any) => {
  const sanitized: any = {};
  for (const key in data) {
    const value = data[key];
    if (value !== null && typeof value === 'object') {
      sanitized[key] = JSON.stringify(value);
    } else {
      sanitized[key] = value;
    }
  }
  return sanitized;
};

export const syncToSheet = async (sheetName: string, data: any) => {
  if (!SCRIPT_URL) return false;

  try {
    // Sanitize data before sending to fix [Ljava.lang.Object; error
    const cleanData = sanitizeDataForSheet(data);

    const payload = {
      sheet: sheetName,
      data: cleanData
    };

    await fetch(SCRIPT_URL, {
      method: 'POST',
      mode: 'no-cors',
      headers: { 'Content-Type': 'text/plain' },
      body: JSON.stringify(payload)
    });

    console.log(`Synced ${sheetName} to Cloud (Sanitized)`);
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

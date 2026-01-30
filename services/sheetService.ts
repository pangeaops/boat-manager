/**
 * Pangea Ops - Airtable Data Service
 */

const BASE_ID = "appbI2j50M0fp4wwQ";
const API_TOKEN = "pat08OtNXdY9Mbht9.e5948c61946c41526d4bc886d135b3b9a09aebb66f04c4c441ec9a2fad30b017";
const BASE_URL = `https://api.airtable.com/v0/${BASE_ID}`;

export const SHEET_MAP: Record<string, string> = {
  "Boats": "boats",
  "Personnel": "personnel",
  "Tours": "tours",
  "Inventory": "inventory",
  "AuditLogs": "logs",
  "Tasks": "tasks",
  "TourProvisions": "tourProvisions"
};

const NUMERIC_FIELDS = [
  'year', 'capacity', 'engineHP', 'numberOfEngines', 'salary', 
  'currentStock', 'paxCount', 'startGas', 'endGas', 
  'hmiStart', 'hmiEnd', 'hmdStart', 'hmdEnd', 'hmcStart', 'hmcEnd',
  'observationTime', 'minDistance', 'departureQty', 'arrivalQty', 'quantityUsed',
  'TotalReceived', 'Quantity Used', 'minStock'
];

const MULTI_VALUE_FIELDS = [
  'personnellInCharge', 'mates', 'supportMates', 'encounters', 'Tour Provisions'
];

// Fields that are Linked Records but should be treated as Single Strings in the App
const SINGLE_LINK_FIELDS = ['boatId', 'captainId', 'supportBoatId', 'supportCaptainId', 'Tour', 'Inventory Item'];

// Fields that must be stored as JSON strings in Airtable to preserve structure (like Provision Names)
const JSON_FIELDS = ['provisions', 'supportProvisions'];

const STATUS_MAPPING: Record<string, string> = {
  'Available': 'AVAILABLE',
  'Stand By': 'STAND BY',
  'In Tour': 'IN TOUR',
  'Cleanup': 'CLEANUP',
  'In Maintenance': 'IN MAINTENANCE',
  'In Repairs': 'IN REPAIRS',
  'Not Available': 'NOT AVAILABLE',
  'Dispatched': 'DISPATCHED',
  'Completed': 'COMPLETED',
  'Pending': 'PENDING',
  'Ongoing': 'ONGOING'
};

const serializeForAirtable = (tableName: string, data: any) => {
  const fields: any = {};
  
  const WHITELISTS: Record<string, string[]> = {
    'Boats': ['id', 'boatname', 'model', 'year', 'draft', 'beam', 'length', 'engineBrand', 'engineModel', 'numberOfEngines', 'engineHP', 'engineSerialNumbers', 'serialNumber', 'capacity', 'licenseNumber', 'licenseExpDate', 'status'],
    'Personnel': ['name', 'role', 'phone', 'email', 'idNumber', 'passportNumber', 'allergies', 'isActive', 'inactiveReason', 'inactiveDate', 'bankName', 'bankAccountNum', 'bankAccountType', 'shirtSize', 'pantsSize', 'shoeSize', 'dependent1Name', 'dependent1Relation', 'dependent2Name', 'dependent2Relation', 'startDate', 'salary', 'emergencyContactName', 'emergencyContactPhone', 'licenseNumber', 'licenseExpDate', 'bloodType', 'experience', 'docPoliceRecords', 'docZeroAlcohol', 'docConfidentialAgreement', 'docImageRights', 'docContract', 'docAddendum'],
    'Tours': ['id', 'date', 'departureTime', 'actualTime', 'boatId', 'captainId', 'mates', 'tourType', 'route', 'paxCount', 'startGas', 'endGas', 'hmiStart', 'hmiEnd', 'hmdStart', 'hmdEnd', 'hmcStart', 'hmcEnd', 'provisions', 'supportProvisions', 'generalTripNotes', 'arrivalNotes', 'mechanicalNotes', 'encounters', 'pickupLocation', 'dropoffLocation', 'isSupportBoatRequired', 'supportBoatId', 'supportCaptainId', 'supportMates', 'status', 'Tour Provisions'],
    'Inventory': ['Name', 'Notes', 'Assignee', 'Status', 'category', 'TotalReceived', 'personnellInCharge', 'unit', 'minStock'],
    'Tasks': ['id', 'boatId', 'taskName', 'taskType', 'priority', 'scheduledDate', 'dueDate', 'Assignee', 'status', 'Status', 'notes', 'taskdone', 'ProvisionsTasks', 'personnellInCharge'],
    'TourProvisions': ['Tour', 'Inventory Item', 'Quantity Used', 'Unit', 'Notes'],
    'AuditLogs': ['id', 'timestamp', 'action', 'details', 'category', 'user']
  };

  const tableWhitelist = WHITELISTS[tableName] || [];

  Object.keys(data).forEach(key => {
    let val = data[key];
    if (val === undefined || val === null) return;

    let mappedKey = key;
    if (tableName === 'Inventory') {
      if (key === 'name') mappedKey = 'Name';
      if (key === 'currentStock') mappedKey = 'TotalReceived';
    }
    if (tableName === 'TourProvisions') {
      if (key === 'tourId') mappedKey = 'Tour';
      if (key === 'inventoryId') mappedKey = 'Inventory Item';
      if (key === 'quantityUsed') mappedKey = 'Quantity Used';
      if (key === 'unit') mappedKey = 'Unit';
    }
    if (tableName === 'Tours' && key === 'arrivalTime') mappedKey = 'actualTime';

    if (!tableWhitelist.includes(mappedKey)) return;

    if (JSON_FIELDS.includes(mappedKey)) {
        fields[mappedKey] = JSON.stringify(val);
        return;
    }

    if (mappedKey.toLowerCase() === 'status') {
      fields[mappedKey] = STATUS_MAPPING[val] || val.toUpperCase();
      return;
    }

    if (SINGLE_LINK_FIELDS.includes(mappedKey)) {
        fields[mappedKey] = Array.isArray(val) ? val : [val];
        return;
    }

    if (MULTI_VALUE_FIELDS.includes(mappedKey)) {
      const arr = Array.isArray(val) ? val : [String(val)];
      fields[mappedKey] = arr.map(v => typeof v === 'string' ? v.trim() : v);
      return;
    }

    if (NUMERIC_FIELDS.includes(mappedKey)) {
      const num = Number(val);
      fields[mappedKey] = isNaN(num) ? null : num;
      return;
    }
    
    fields[mappedKey] = val;
  });
  
  return fields;
};

const deserializeFromAirtable = (record: any) => {
  const fields = record.fields;
  const data: any = { ...fields };
  data.airtableRecordId = record.id; 
  data.id = fields.id || fields.Name || fields.name || record.id;

  // Flatten single-select linked records
  SINGLE_LINK_FIELDS.forEach(f => {
    if (Array.isArray(fields[f])) {
      data[f] = fields[f][0];
    }
  });

  if (fields.TotalReceived !== undefined) data.currentStock = Number(fields.TotalReceived);
  if (fields['Quantity Left'] !== undefined) data.quantityLeft = Number(fields['Quantity Left']);
  if (fields.actualTime) data.arrivalTime = fields.actualTime;
  
  if (fields['Tour']) data.tourId = Array.isArray(fields['Tour']) ? fields['Tour'][0] : fields['Tour'];
  if (fields['Inventory Item']) data.inventoryId = Array.isArray(fields['Inventory Item']) ? fields['Inventory Item'][0] : fields['Inventory Item'];
  if (fields['Quantity Used'] !== undefined) data.quantityUsed = Number(fields['Quantity Used']);

  const statusVal = fields.status || fields.Status;
  if (statusVal) {
    const reverseMap: Record<string, string> = {};
    Object.entries(STATUS_MAPPING).forEach(([k, v]) => { reverseMap[v] = k; });
    data.status = reverseMap[statusVal.toUpperCase()] || statusVal;
  }

  // Parse JSON or Array fields
  const complexFields = [...JSON_FIELDS, ...MULTI_VALUE_FIELDS, 'encounters', 'engineSerialNumbers', 'Tour Provisions', 'mates', 'supportMates', 'personnelInCharge'];
  complexFields.forEach(k => {
    let val = fields[k];
    if (typeof val === 'string' && (val.startsWith('[') || val.startsWith('{'))) {
      try { data[k] = JSON.parse(val); } catch (e) { data[k] = []; }
    } else if (!val) {
      data[k] = [];
    } else if (!Array.isArray(val)) {
      data[k] = [val];
    } else {
      data[k] = val;
    }
  });

  return data;
};

const resolveLinks = (result: any) => {
  const tours = result.tours || [];
  const tourProvisions = result.tourProvisions || [];
  const inventory = result.inventory || [];

  tours.forEach((tour: any) => {
    // If provisions is empty or just IDs, resolve from junction table
    const junctionIds = tour['Tour Provisions'] || [];
    const linkedProvs = tourProvisions.filter((tp: any) => 
      junctionIds.includes(tp.airtableRecordId) || tp.tourId === tour.id || tp.tourId === tour.airtableRecordId
    );

    if (linkedProvs.length > 0) {
      // Use junction table as primary source for completed tours
      const resolvedFromJunction = linkedProvs.map((tp: any) => {
        const item = inventory.find((i: any) => i.airtableRecordId === tp.inventoryId || i.id === tp.inventoryId);
        return {
          item: item?.name || item?.Name || 'Unknown',
          category: item?.category || 'Equipment',
          departureQty: tp.quantityUsed || 0,
          arrivalQty: 0
        };
      });
      // Merge: if junction has data, it means it was completed. 
      // For Dispatched tours, we rely on the JSON blob in the 'provisions' field.
      if (resolvedFromJunction.length > 0 && tour.status?.toLowerCase() === 'completed') {
          tour.provisions = resolvedFromJunction;
      }
    }
    
    if (!Array.isArray(tour.provisions)) tour.provisions = [];
    if (!Array.isArray(tour.supportProvisions)) tour.supportProvisions = [];
  });
};

export const fetchAppData = async () => {
  try {
    const results: any = {};
    for (const tableName of Object.keys(SHEET_MAP)) {
      const airtableTable = SHEET_MAP[tableName];
      const response = await fetch(`${BASE_URL}/${airtableTable}`, {
        headers: { Authorization: `Bearer ${API_TOKEN}` }
      });
      if (!response.ok) continue;
      const data = await response.json();
      results[airtableTable] = data.records.map(deserializeFromAirtable);
    }
    resolveLinks(results);
    return {
      boats: results.boats || [],
      personnel: results.personnel || [],
      tours: results.tours || [],
      inventory: results.inventory || [],
      logs: results.logs || [],
      tasks: results.tasks || [],
      tourProvisions: results.tourProvisions || []
    };
  } catch (err) {
    return null;
  }
};

export const syncToSheet = async (tableName: string, data: any) => {
  try {
    const airtableTable = SHEET_MAP[tableName];
    const fields = serializeForAirtable(tableName, data);
    const recordId = data.airtableRecordId;
    const url = recordId ? `${BASE_URL}/${airtableTable}/${recordId}` : `${BASE_URL}/${airtableTable}`;
    const method = recordId ? 'PATCH' : 'POST';

    const response = await fetch(url, {
      method,
      headers: { 'Authorization': `Bearer ${API_TOKEN}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ fields })
    });
    return response.ok;
  } catch (err) {
    return false;
  }
};

export const deleteFromSheet = async (tableName: string, key: string, value: string, airtableRecordId?: string) => {
  try {
    const airtableTable = SHEET_MAP[tableName];
    let recordId = airtableRecordId;
    if (!recordId) {
      const searchRes = await fetch(`${BASE_URL}/${airtableTable}?filterByFormula=({${key}}='${value}')`, {
        headers: { Authorization: `Bearer ${API_TOKEN}` }
      });
      const searchData = await searchRes.json();
      if (searchData.records?.length > 0) recordId = searchData.records[0].id;
    }
    if (!recordId) return false;
    const deleteRes = await fetch(`${BASE_URL}/${airtableTable}/${recordId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${API_TOKEN}` }
    });
    return deleteRes.ok;
  } catch (err) {
    return false;
  }
};
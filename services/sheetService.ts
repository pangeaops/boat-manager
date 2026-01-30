/**
 * Pangea Ops - Airtable Data Service
 * 
 * Base ID: appbI2j50M0fp4wwQ
 * Auth: Authorization: Bearer <API_TOKEN>
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
  'TotalReceived', 'Quantity Used'
];

const MULTI_VALUE_FIELDS = [
  'personnellInCharge',
  'mates',
  'supportMates',
  'encounters',
  'provisions',
  'ProvisionsTasks',
  'provisionsUsed',
  'boatId',
  'captainId',
  'supportBoatId',
  'supportCaptainId',
  'tourId',
  'inventoryId',
  'Tour',
  'Inventory Item',
  'Assignee'
];

const DOC_BOOLEAN_FIELDS = [
  'docPoliceRecords', 'docZeroAlcohol', 'docConfidentialAgreement', 
  'docImageRights', 'docContract', 'docAddendum'
];

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

const serializeForAirtable = (tableName: string, data: any) => {
  const fields: any = {};
  
  // Whitelists derived strictly from documentation screenshots
  const WHITELISTS: Record<string, string[]> = {
    'Boats': ['id', 'boatname', 'model', 'year', 'draft', 'beam', 'length', 'engineBrand', 'engineModel', 'numberOfEngines', 'engineHP', 'engineSerialNumbers', 'serialNumber', 'capacity', 'licenseNumber', 'licenseExpDate', 'status'],
    'Personnel': ['name', 'role', 'phone', 'email', 'idNumber', 'passportNumber', 'allergies', 'isActive', 'inactiveReason', 'inactiveDate', 'bankName', 'bankAccountNum', 'bankAccountType', 'shirtSize', 'pantsSize', 'shoeSize', 'dependent1Name', 'dependent1Relation', 'dependent2Name', 'dependent2Relation', 'startDate', 'salary', 'emergencyContactName', 'emergencyContactPhone', 'licenseNumber', 'licenseExpDate', 'bloodType', 'experience', 'docPoliceRecords', 'docZeroAlcohol', 'docConfidentialAgreement', 'docImageRights', 'docContract', 'docAddendum', 'NATIONAL ID PICTURE', 'CURRICULUM VITAE (CV)', 'POLICE RECORD', 'SIGNED CONTRACT', 'CONFIDENTIALITY AGREEMENT', 'IMAGE USAGE RIGHTS'],
    'Tours': ['id', 'date', 'departureTime', 'actualTime', 'boatId', 'captainId', 'mates', 'tourType', 'route', 'paxCount', 'startGas', 'endGas', 'hmiStart', 'hmiEnd', 'hmdStart', 'hmdEnd', 'hmcStart', 'hmcEnd', 'provisions', 'generalTripNotes', 'arrivalNotes', 'mechanicalNotes', 'encounters', 'pickupLocation', 'dropoffLocation', 'isSupportBoatRequired', 'supportBoatId', 'supportCaptainId', 'supportMates', 'status'],
    'Inventory': ['Name', 'Notes', 'Assignee', 'Status', 'category', 'TotalReceived', 'personnellInCharge'],
    'Tasks': ['id', 'boatId', 'taskName', 'taskType', 'priority', 'scheduledDate', 'dueDate', 'Assignee', 'status', 'Status', 'notes', 'taskdone', 'ProvisionsTasks', 'personnellInCharge'],
    'TourProvisions': ['Tour', 'Inventory Item', 'Quantity Used', 'Unit', 'Notes'],
    'AuditLogs': ['id', 'timestamp', 'action', 'details', 'category', 'user']
  };

  const tableWhitelist = WHITELISTS[tableName] || [];

  Object.keys(data).forEach(key => {
    let val = data[key];
    if (val === undefined || val === null) return;

    let mappedKey = key;
    
    // Global and Table Specific Mappings
    if (tableName === 'Inventory') {
      if (key === 'name') mappedKey = 'Name';
      if (key === 'currentStock') mappedKey = 'TotalReceived';
      if (key === 'personnelInCharge') mappedKey = 'personnellInCharge';
    }

    if (tableName === 'Tasks') {
      if (key === 'personnelInCharge') mappedKey = 'personnellInCharge';
      if (key === 'provisionsUsed') mappedKey = 'ProvisionsTasks';
    }

    if (tableName === 'TourProvisions') {
      if (key === 'tourId') mappedKey = 'Tour';
      if (key === 'inventoryId') mappedKey = 'Inventory Item';
      if (key === 'quantityUsed') mappedKey = 'Quantity Used';
      if (key === 'unit') mappedKey = 'Unit';
    }

    if (tableName === 'Tours' && key === 'arrivalTime') mappedKey = 'actualTime';

    // HR Doc Mappings
    if (key === 'docIdPhoto') mappedKey = 'NATIONAL ID PICTURE';
    else if (key === 'cvDoc') mappedKey = 'CURRICULUM VITAE (CV)';
    else if (key === 'policeRecordDoc') mappedKey = 'POLICE RECORD';
    else if (key === 'contractDoc') mappedKey = 'SIGNED CONTRACT';
    else if (key === 'docConfidentiality') mappedKey = 'CONFIDENTIALITY AGREEMENT';
    else if (key === 'docImageRightsFile') mappedKey = 'IMAGE USAGE RIGHTS';

    // Check Whitelist
    if (!tableWhitelist.includes(mappedKey)) return;

    if (MULTI_VALUE_FIELDS.includes(mappedKey)) {
      if (!val) { fields[mappedKey] = []; return; }
      let arr = Array.isArray(val) ? val : [String(val)];
      fields[mappedKey] = arr.filter(v => v !== undefined && v !== null).map(v => String(v).trim());
      return;
    }

    if (typeof val === 'boolean' || DOC_BOOLEAN_FIELDS.includes(key) || key === 'isActive' || key === 'taskdone') {
      fields[mappedKey] = !!val;
      return;
    }

    if (NUMERIC_FIELDS.includes(mappedKey)) {
      if (val === '' || val === undefined) { fields[mappedKey] = null; return; }
      const num = Number(val);
      fields[mappedKey] = isNaN(num) ? null : num;
      return;
    }
    
    if (Array.isArray(val)) {
      fields[mappedKey] = val.length > 0 ? val : [];
    } else if (typeof val === 'object' && val !== null) {
      fields[mappedKey] = JSON.stringify(val);
    } else {
      fields[mappedKey] = String(val);
    }
  });
  
  return fields;
};

const deserializeFromAirtable = (record: any) => {
  const fields = record.fields;
  const data: any = { ...fields };
  data.airtableRecordId = record.id; 
  
  if (fields.id) {
    data.id = fields.id;
  } else if (fields.name || fields.Name) {
    data.id = fields.name || fields.Name;
  } else if (fields.idNumber) {
    data.id = fields.idNumber;
  } else {
    data.id = record.id;
  }
  
  if (fields.TotalReceived !== undefined) data.currentStock = Number(fields.TotalReceived);
  if (fields.category !== undefined) data.category = fields.category;
  
  const assigneeVal = fields.personnellInCharge || fields.Assignee || fields.personnelInCharge;
  if (assigneeVal) {
    data.personnelInCharge = Array.isArray(assigneeVal) 
      ? assigneeVal.map((u: any) => typeof u === 'string' ? u : u.id || u.name)
      : [typeof assigneeVal === 'string' ? assigneeVal : assigneeVal.id || assigneeVal.name];
  }

  if (fields.actualTime) data.arrivalTime = fields.actualTime;
  if (fields.ProvisionsTasks) data.provisionsUsed = fields.ProvisionsTasks;
  if (fields['Quantity Used']) data.quantityUsed = Number(fields['Quantity Used']);

  data.personnelInCharge = data.personnelInCharge || [];
  data.mates = fields.mates || [];
  data.supportMates = fields.supportMates || [];
  data.engineSerialNumbers = fields.engineSerialNumbers ? String(fields.engineSerialNumbers).split(',').map(s => s.trim()).filter(s => s) : [];
  data.encounters = fields.encounters || [];
  data.provisions = fields.provisions || [];
  data.provisionsUsed = data.provisionsUsed || [];
  
  data.boatname = fields.boatname || fields.name || fields.Name || '';
  data.name = fields.name || fields.Name || fields.boatname || '';

  if (fields['NATIONAL ID PICTURE']) data.docIdPhoto = fields['NATIONAL ID PICTURE'];
  if (fields['CURRICULUM VITAE (CV)']) data.cvDoc = fields['CURRICULUM VITAE (CV)'];
  
  const statusValue = fields.status || fields.Status;
  if (statusValue) {
    data.status = statusValue;
  } else if (fields.taskdone !== undefined) {
    data.status = fields.taskdone ? 'Completed' : 'Pending';
  }

  return data;
};

export const syncToSheet = async (tableName: string, data: any) => {
  if (!API_TOKEN) return false;

  try {
    const fields = serializeForAirtable(tableName, data);
    let recordId = data.airtableRecordId;

    if (!recordId) {
      let filter = '';
      const searchValue = (data.boatname || data.name || data.id || '').toString().replace(/"/g, '\\"').replace(/'/g, "\\'");
      
      if (tableName === 'Personnel') {
        filter = `OR({name}="${searchValue}", {idNumber}="${searchValue}")`;
      } else if (tableName === 'Boats') {
        filter = `{boatname}="${searchValue}"`;
      } else if (tableName === 'Inventory') {
        const invSearchValue = (data.Name || data.name || data.id || '').toString().replace(/"/g, '\\"').replace(/'/g, "\\'");
        filter = `{Name}="${invSearchValue}"`;
      } else if (data.id) {
        filter = `{id}="${searchValue}"`;
      }
      
      if (filter) {
        const searchUrl = `${BASE_URL}/${tableName}?filterByFormula=${encodeURIComponent(filter)}&maxRecords=1`;
        const searchRes = await fetch(searchUrl, { headers: { 'Authorization': `Bearer ${API_TOKEN}` } });
        if (searchRes.ok) {
          const searchData = await searchRes.json();
          recordId = searchData.records?.[0]?.id;
        }
      }
    }

    let url = `${BASE_URL}/${tableName}`;
    let method = 'POST';
    let body: any = { records: [{ fields }], typecast: true };

    if (recordId) {
      method = 'PATCH';
      body = { records: [{ id: recordId, fields }], typecast: true };
    }

    const response = await fetch(url, {
      method,
      headers: { 
        'Authorization': `Bearer ${API_TOKEN}`, 
        'Content-Type': 'application/json' 
      },
      body: JSON.stringify(body)
    });

    if (!response.ok) {
      const errBody = await response.json();
      console.error(`Airtable Sync Error [${tableName}] Status ${response.status}:`, JSON.stringify(errBody, null, 2));
      return false;
    }
    await delay(100);
    return true;
  } catch (error: any) {
    console.error(`Airtable Sync Exception [${tableName}]:`, error);
    return false;
  }
};

export const fetchAppData = async () => {
  if (!API_TOKEN) return null;
  const result: any = {
    boats: [],
    personnel: [],
    tours: [],
    inventory: [],
    logs: [],
    tasks: [],
    tourProvisions: []
  };
  const tables = Object.keys(SHEET_MAP);

  for (const tableName of tables) {
    const stateKey = SHEET_MAP[tableName];
    let allRecords: any[] = [];
    let offset = '';
    try {
      do {
        const url = `${BASE_URL}/${tableName}${offset ? `?offset=${offset}` : ''}`;
        const response = await fetch(url, { headers: { 'Authorization': `Bearer ${API_TOKEN}` } });
        if (!response.ok) break;
        const data = await response.json();
        allRecords = [...allRecords, ...data.records];
        offset = data.offset;
      } while (offset);
      result[stateKey] = (allRecords || []).map(rec => {
        rec._table = { name: tableName };
        return deserializeFromAirtable(rec);
      });
    } catch (err) {
      console.error(`Fetch Failed [${tableName}]:`, err);
    }
  }
  return result;
};

export const deleteFromSheet = async (tableName: string, fieldName: string, value: string, recordId?: string) => {
  if (!API_TOKEN) return false;
  try {
    let targetId = recordId;
    if (!targetId) {
      const escapedValue = value.toString().replace(/"/g, '\\"').replace(/'/g, "\\'");
      const searchUrl = `${BASE_URL}/${tableName}?filterByFormula={${fieldName}}="${escapedValue}"&maxRecords=1`;
      const searchRes = await fetch(searchUrl, { headers: { 'Authorization': `Bearer ${API_TOKEN}` } });
      if (searchRes.ok) {
        const searchData = await searchRes.json();
        targetId = searchData.records?.[0]?.id;
      }
    }
    if (!targetId) return false;
    const response = await fetch(`${BASE_URL}/${tableName}/${targetId}`, { 
      method: 'DELETE', 
      headers: { 'Authorization': `Bearer ${API_TOKEN}` } 
    });
    return response.ok;
  } catch (error) {
    return false;
  }
};
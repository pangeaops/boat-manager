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
  'currentStock', 'minStock', 'paxCount', 'startGas', 'endGas', 
  'hmiStart', 'hmiEnd', 'hmdStart', 'hmdEnd', 'hmcStart', 'hmcEnd',
  'observationTime', 'minDistance', 'departureQty', 'arrivalQty', 'quantityUsed',
  'finalStock', 'TotalReceived', 'Quantity Left', 'Total Quantity Used',
  'Avg Consumption (Gal/Tour)', 'FinalStock'
];

const MULTI_VALUE_FIELDS = [
  'personnelInCharge', 
  'personnellInCharge',
  'Assignee',
  'mates',
  'supportMates',
  'Marinero',
  'Ayudante General',
  'encounters',
  'provisions',
  'ProvisionsTasks',
  'provisionsUsed',
  'boatId',
  'captainId',
  'supportBoatId',
  'supportCaptainId',
  'tourId',
  'inventoryId'
];

const DOC_BOOLEAN_FIELDS = [
  'docPoliceRecords', 'docZeroAlcohol', 'docConfidentialAgreement', 
  'docImageRights', 'docContract', 'docAddendum'
];

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

const serializeForAirtable = (tableName: string, data: any) => {
  const fields: any = {};
  
  const globalExclusions = [
    'airtableRecordId', 'Created', 'Last Modified', 'createdTime',
    'Average Fuel Consumed (Tours)', 'fuelConsumed', 'totalHours', 'efficiency',
    'Quantity Left', 'quantityLeft', 'Total Quantity Used', 'totalQuantityUsed',
    'finalStock', 'FinalStock', 'Final Stock', 'Fuel Consumed', 'Total Fuel Consumed'
  ];

  const INVENTORY_WHITELIST = ['category', 'currentStock', 'minStock', 'unit', 'location', 'lastUpdated'];

  Object.keys(data).forEach(key => {
    if (globalExclusions.includes(key)) return;
    
    if (tableName === 'Inventory' && !INVENTORY_WHITELIST.includes(key)) return;
    
    if (['Personnel', 'Boats', 'Inventory', 'Tasks'].includes(tableName) && (key === 'id' || key === 'name')) return;

    let val = data[key];
    if (val === undefined || val === null) return;

    let mappedKey = key;
    
    if (tableName === 'Inventory' && key === 'currentStock') {
      mappedKey = 'TotalReceived';
    }

    if (tableName === 'Tasks' && key === 'personnelInCharge') {
      mappedKey = 'Assignee';
    }

    if (tableName === 'Tours' && key === 'arrivalTime') {
      mappedKey = 'actualTime';
    }

    if (tableName === 'Tasks' && key === 'provisionsUsed') {
      mappedKey = 'ProvisionsTasks';
    }

    if (key === 'engineSerialNumbers' && tableName === 'Boats') {
      if (Array.isArray(val)) {
        fields[mappedKey] = val.filter((s: string) => s && s.trim()).join(', ');
      } else {
        fields[mappedKey] = String(val);
      }
      return;
    }

    if (tableName === 'Tasks' && key === 'status') {
      fields['taskdone'] = (val === 'Completed');
      return;
    }

    if (key === 'docIdPhoto') mappedKey = 'NATIONAL ID PICTURE';
    else if (key === 'cvDoc') mappedKey = 'CURRICULUM VITAE (CV)';
    else if (key === 'policeRecordDoc') mappedKey = 'POLICE RECORD';
    else if (key === 'contractDoc') mappedKey = 'SIGNED CONTRACT';
    else if (key === 'docConfidentiality') mappedKey = 'CONFIDENTIALITY AGREEMENT';
    else if (key === 'docImageRightsFile') mappedKey = 'IMAGE USAGE RIGHTS';

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
  
  if (fields.TotalReceived !== undefined) {
    data.currentStock = Number(fields.TotalReceived);
  }

  if (fields.FinalStock !== undefined) {
    data.finalStock = Number(fields.FinalStock);
  } else if (fields['Final Stock'] !== undefined) {
    data.finalStock = Number(fields['Final Stock']);
  }

  if (fields.Assignee) {
    if (Array.isArray(fields.Assignee)) {
      data.personnelInCharge = fields.Assignee.map((u: any) => typeof u === 'string' ? u : u.name || u.email);
    } else {
      data.personnelInCharge = [typeof fields.Assignee === 'string' ? fields.Assignee : fields.Assignee.name || fields.Assignee.email];
    }
  }

  if (fields.actualTime) {
    data.arrivalTime = fields.actualTime;
  }

  if (fields.ProvisionsTasks) {
    data.provisionsUsed = fields.ProvisionsTasks;
  }

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
  
  if (fields.taskdone !== undefined) {
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
        const invSearchValue = (data.name || data.id || '').toString().replace(/"/g, '\\"').replace(/'/g, "\\'");
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
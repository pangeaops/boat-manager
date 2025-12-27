export enum Priority {
  LOW = 'Low',
  MEDIUM = 'Medium',
  HIGH = 'High',
  CRITICAL = 'Critical'
}

export enum PersonnelRole {
  CEO = 'Commodore & CEO',
  CAPTAIN_MOTOMARLIN = 'Capitán Motomarlin',
  CAPTAIN_CLEARBOAT = 'Capitán Clearboat',
  MARINE = 'Marinero',
  GENERAL_HELPER = 'Ayudante General',
  MECHANIC = 'Mecánico',
  OPERATIONS = 'Operaciones'
}

export type UserRole = 'Admin' | 'Staff';

export interface AppUser {
  email: string;
  role: UserRole;
  name: string;
}

export type BoatStatus = 'Available' | 'Stand By' | 'In Tour' | 'Cleanup' | 'In Maintenance' | 'In Repairs' | 'Not Available';

export interface ProvisionStock {
  item: string;
  category: 'Drinks' | 'Snacks' | 'Equipment';
  departureQty: number;
  arrivalQty: number;
}

export interface InventoryItem {
  id: string;
  name: string;
  category: 'Dock' | 'Vessel Gear' | 'Consumables' | 'Office' | 'Mechanical';
  currentStock: number;
  minStock: number;
  unit: string;
  location: string;
  lastUpdated: string;
}

export interface WildlifeEncounter {
  species: string;
  observationTime: number;
  minDistance: number;
  compliance: boolean;
  notes: string;
}

export interface PreDepartureVerification {
  id: string;
  bilgeDry: boolean;
  engineOilSteeringOk: boolean;
  propellersClear: boolean;
  lifeJacketsCountOk: boolean;
  fuelLevelSufficient: boolean;
  electronicsOperational: boolean;
  coolingTelltaleActive: boolean;
  anchorLineSecure: boolean;
  firstAidOnboard: boolean;
  captainSignature: string;
}

export interface PostTripChecklist {
  trash: boolean;
  washed: boolean;
  gear: boolean;
  lostFound: boolean;
}

export interface Tour {
  id: string;
  date: string;
  departureTime: string;
  arrivalTime?: string;
  boatId: string;
  captainId: string;
  mates: string[];
  tourType: string;
  route: string;
  paxCount: number;
  startGas: number;
  endGas?: number;
  hmiStart: number;
  hmiEnd?: number;
  hmdStart: number;
  hmdEnd?: number;
  hmcStart: number;
  hmcEnd?: number;
  provisions: ProvisionStock[];
  provisionsNotes: string;
  generalTripNotes: string;
  arrivalNotes: string;
  mechanicalNotes?: string;
  encounters: WildlifeEncounter[];
  preDepartureVerification: PreDepartureVerification;
  postTripChecklist: PostTripChecklist;
  status: 'Draft' | 'Dispatched' | 'Completed' | 'Cancelled';
  pickupLocation?: string;
  dropoffLocation?: string;
  isSupportBoatRequired?: boolean;
  supportBoatId?: string;
  supportCaptainId?: string;
  supportMates?: string[];
  supportProvisions?: ProvisionStock[];
}

export interface Task {
  id: string;
  boatId: string;
  taskType: string;
  priority: Priority;
  scheduledDate: string;
  dueDate: string;
  personnelInCharge: string[];
  status: 'Pending' | 'Ongoing' | 'Completed';
  notes?: string;
}

export interface Boat {
  id: string;
  name: string;
  model: string;
  year: number;
  length: string;
  beam: string;
  draft: string;
  engineBrand: string;
  engineModel: string;
  numberOfEngines: number;
  engineHP: number;
  engineSerialNumbers: string[]; 
  serialNumber: string; 
  capacity: number;
  licenseNumber: string;
  licenseExpDate: string;
  status: BoatStatus;
  lastServiceDate?: string;
  mandatoryChecklist: string[];
}

export type InactiveReason = 'Firing' | 'Resignation' | 'No Show' | 'Other';

export interface Personnel {
  id: string;
  name: string;
  role: PersonnelRole;
  phone: string;
  email: string;
  passportNumber?: string;
  allergies?: string;
  licenseNumber?: string;
  licenseExpDate?: string;
  bloodType?: string;
  idNumber?: string;
  isActive: boolean;
  inactiveReason?: InactiveReason;
  inactiveDate?: string;
  bankName?: string;
  bankAccountNum?: string;
  bankAccountType?: 'Savings' | 'Checking';
  shirtSize?: string;
  pantsSize?: string;
  shoeSize?: string;
  dependent1Name?: string;
  dependent1Relation?: string;
  dependent2Name?: string;
  dependent2Relation?: string;
  startDate?: string;
  salary?: number;
  docPoliceRecords?: boolean;
  docZeroAlcohol?: boolean;
  docConfidentialAgreement?: boolean;
  docImageRights?: boolean;
  docContract?: boolean;
  docAddendum?: boolean;
  profilePhoto?: string;
  licensePhoto?: string;
  cvDoc?: string;
  policeRecordDoc?: string;
  contractDoc?: string;
  docIdPhoto?: string;
  docConfidentiality?: string;
  docImageRightsFile?: string;
  emergencyContactName?: string;
  emergencyContactPhone?: string;
  experience?: string;
}

export interface AuditLog {
  id: string;
  timestamp: string;
  action: string;
  details: string;
  category: 'Fleet' | 'Personnel' | 'Task' | 'Tour' | 'Inventory';
}

export interface AppData {
  boats: Boat[];
  tasks: Task[];
  personnel: Personnel[];
  tours: Tour[];
  inventory: InventoryItem[];
  logs: AuditLog[];
  lastOverdueCheck?: string;
}
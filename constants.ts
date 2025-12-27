import { PersonnelRole, Boat, Personnel, BoatStatus } from './types';

export const PANGEA_YELLOW = '#ffb519';
export const PANGEA_DARK = '#434343';

export const TOUR_TYPES = ['Shared', 'Private', 'Fam Trip', 'Clear Boat', 'Ferry', 'Scouting', 'Boat Transfer', 'Boat Hotel Transfer'];

export const TOUR_ROUTES = {
  'Clear Boat Excursions': ['Sunset Cruise +18', 'Town Cruise (The Garden)', 'Bioluminescence Tour'],
  'Day Tours': [
    'Playa Estrella, Isla Pájaro, La Piscina', 
    'Isla Tiburon, Zapatilla & Kusapin', 
    'Punta Hospital, Cayo Coral & Zapatilla',
    'Bahía Delfines & Red Frog VIP',
    'Island Bar Crawl (2 Hrs)'
  ],
  'Fishing': ['Inshore Half Day', 'Inshore Full Day', 'Offshore Half Day', 'Offshore Full Day'],
  'General': ['Boat Rental', 'Custom Charter']
};

export const INITIAL_PROVISIONS = [
  { item: 'Water', category: 'Drinks' }, { item: 'Sparkling Water', category: 'Drinks' },
  { item: 'Coke', category: 'Drinks' }, { item: 'Coke Zero', category: 'Drinks' },
  { item: 'Ginger Ale', category: 'Drinks' }, { item: 'Fresca', category: 'Drinks' },
  { item: 'Panama', category: 'Drinks' }, { item: 'Cristal', category: 'Drinks' },
  { item: 'Wine', category: 'Drinks' }, { item: 'Champagne', category: 'Drinks' },
  { item: 'Pineapple', category: 'Snacks' }, { item: 'Watermelon', category: 'Snacks' },
  { item: 'Papaya', category: 'Snacks' }, { item: 'Pati', category: 'Snacks' },
  { item: 'Snorkel', category: 'Equipment' }, { item: 'Chairs', category: 'Equipment' },
  { item: 'Umbrellas', category: 'Equipment' }, { item: 'Tables', category: 'Equipment' },
  { item: 'Big Cooler', category: 'Equipment' }, { item: 'Small Cooler', category: 'Equipment' },
  { item: 'Boat Umbrella', category: 'Equipment' }, { item: 'Towels', category: 'Equipment' }
];

export const MANDATORY_ITEMS = ['Life Jackets', 'VHF Radio', 'Fire Extinguisher', 'First Aid Kit', 'Flares', 'Anchor & Line', 'Bailer', 'GPS', 'Sonar', 'WiFi'];

export const BOAT_STATUS_OPTIONS: BoatStatus[] = [
  'Available',
  'Stand By',
  'In Tour',
  'Cleanup',
  'In Maintenance',
  'In Repairs',
  'Not Available'
];

export const FULL_FLEET: Boat[] = [
  { 
    id: 'boat-nana', 
    name: 'Nana del Mar 46FT', 
    model: 'Yate / Motomarlin S.A.S', 
    year: 2024, 
    length: '46ft (14.02m)', 
    beam: '4m', 
    draft: '3.5ft', 
    engineBrand: 'Suzuki', 
    engineModel: 'Fuera de borda', 
    numberOfEngines: 3, 
    engineHP: 900, 
    engineSerialNumbers: ['', '', ''],
    serialNumber: 'SN-NANA-046', 
    capacity: 50, 
    licenseNumber: '56401-25', 
    licenseExpDate: '2026-12-31', 
    status: 'Available', 
    mandatoryChecklist: MANDATORY_ITEMS 
  },
  { 
    id: 'boat-emilia', 
    name: 'Emilia del Mar 46FT', 
    model: 'Yate / Motomarlin S.A.S', 
    year: 2024, 
    length: '46ft (14.02m)', 
    beam: '4m', 
    draft: '3.5ft', 
    engineBrand: 'Suzuki', 
    engineModel: 'Fuera de borda', 
    numberOfEngines: 3, 
    engineHP: 900, 
    engineSerialNumbers: ['', '', ''],
    serialNumber: 'SN-EMILIA-046', 
    capacity: 50, 
    licenseNumber: '58926-PEXT', 
    licenseExpDate: '2026-12-31', 
    status: 'Available', 
    mandatoryChecklist: MANDATORY_ITEMS 
  },
  { 
    id: 'boat-la-beatriz', 
    name: 'La Beatriz 39FT', 
    model: 'Sportfishing Boat / Motomarlin S.A.S', 
    year: 2022, 
    length: '39ft (11.9m)', 
    beam: '3m', 
    draft: '2.5ft', 
    engineBrand: 'Suzuki', 
    engineModel: 'Fuera de borda', 
    numberOfEngines: 2, 
    engineHP: 400, 
    engineSerialNumbers: ['', ''],
    serialNumber: 'SN-BEA-039', 
    capacity: 14, 
    licenseNumber: '54791-23-A', 
    licenseExpDate: '2025-08-15', 
    status: 'Available', 
    mandatoryChecklist: MANDATORY_ITEMS 
  },
  { 
    id: 'boat-sofia-anya', 
    name: 'Sofia Anya 34FT', 
    model: 'Yate / Motomarlin S.A.S', 
    year: 2024, 
    length: '34ft (10.36m)', 
    beam: '2.59m', 
    draft: '2ft', 
    engineBrand: 'Suzuki', 
    engineModel: 'Fuera de borda', 
    numberOfEngines: 2, 
    engineHP: 400, 
    engineSerialNumbers: ['', ''],
    serialNumber: 'SN-SOFIA-034', 
    capacity: 12, 
    licenseNumber: '56283-25', 
    licenseExpDate: '2025-07-20', 
    status: 'Available', 
    mandatoryChecklist: MANDATORY_ITEMS 
  },
  { 
    id: 'boat-la-veronica', 
    name: 'La Verónica 32FT', 
    model: 'Yate / Motomarlin S.A.S', 
    year: 2024, 
    length: '32ft (9.75m)', 
    beam: '2.69m', 
    draft: '2ft', 
    engineBrand: 'Suzuki', 
    engineModel: 'Fuera de borda', 
    numberOfEngines: 2, 
    engineHP: 400, 
    engineSerialNumbers: ['', ''],
    serialNumber: 'SN-VERO-032', 
    capacity: 10, 
    licenseNumber: '56284-25', 
    licenseExpDate: '2025-06-15', 
    status: 'Available', 
    mandatoryChecklist: MANDATORY_ITEMS 
  },
  { 
    id: 'cb-pa001', 
    name: 'Clear Boat PA-001', 
    model: 'Clear Boat / LIMELIGHT', 
    year: 2024, 
    length: '25ft (7.7m)', 
    beam: '2.28m', 
    draft: '1.5ft', 
    engineBrand: 'Suzuki', 
    engineModel: 'Fuera de borda', 
    numberOfEngines: 1, 
    engineHP: 60, 
    engineSerialNumbers: [''],
    serialNumber: 'CB-001-PINT', 
    capacity: 12, 
    licenseNumber: '3120-PINT', 
    licenseExpDate: '2026-01-10', 
    status: 'Available', 
    mandatoryChecklist: MANDATORY_ITEMS 
  },
  { 
    id: 'cb-pa002', 
    name: 'Clear Boat PA-002', 
    model: 'Clear Boat / LIMELIGHT', 
    year: 2024, 
    length: '25ft (7.7m)', 
    beam: '2.28m', 
    draft: '1.5ft', 
    engineBrand: 'Suzuki', 
    engineModel: 'Fuera de borda', 
    numberOfEngines: 1, 
    engineHP: 60, 
    engineSerialNumbers: [''],
    serialNumber: 'CB-002-PINT', 
    capacity: 12, 
    licenseNumber: '3120-PINT', 
    licenseExpDate: '2026-01-10', 
    status: 'Available', 
    mandatoryChecklist: MANDATORY_ITEMS 
  },
  { 
    id: 'cb-pa003', 
    name: 'Clear Boat PA-003', 
    model: 'Clear Boat / LIMELIGHT', 
    year: 2024, 
    length: '25ft (7.7m)', 
    beam: '2.28m', 
    draft: '1.5ft', 
    engineBrand: 'Suzuki', 
    engineModel: 'Fuera de borda', 
    numberOfEngines: 1, 
    engineHP: 60, 
    engineSerialNumbers: [''],
    serialNumber: 'CB-003-PINT', 
    capacity: 12, 
    licenseNumber: '3120-PINT', 
    licenseExpDate: '2026-01-10', 
    status: 'Available', 
    mandatoryChecklist: MANDATORY_ITEMS 
  },
  { 
    id: 'cb-pa004', 
    name: 'Clear Boat PA-004', 
    model: 'Clear Boat / LIMELIGHT', 
    year: 2024, 
    length: '25ft (7.7m)', 
    beam: '2.28m', 
    draft: '1.5ft', 
    engineBrand: 'Suzuki', 
    engineModel: 'Fuera de borda', 
    numberOfEngines: 1, 
    engineHP: 60, 
    engineSerialNumbers: [''],
    serialNumber: 'CB-004-PINT', 
    capacity: 12, 
    licenseNumber: '3120-PINT', 
    licenseExpDate: '2026-01-10', 
    status: 'Available', 
    mandatoryChecklist: MANDATORY_ITEMS 
  }
];

export const FLEET_REFERENCE_DATA = [
  { boat: 'Clear Boat PA-001', g_hr: 10, price_hr: 39.00 },
  { boat: 'La Verónica 32FT', g_hr: 20, price_hr: 78.00 },
  { boat: 'Sofia Anya 34FT', g_hr: 20, price_hr: 78.00 },
  { boat: 'La Beatriz 39FT', g_hr: 25, price_hr: 97.50 },
  { boat: 'Nana del Mar 46FT', g_hr: 35, price_hr: 136.50 },
  { boat: 'Emilia del Mar 46FT', g_hr: 35, price_hr: 136.50 },
];

export const BASE_GAS_RATE = 3.90;

export const INITIAL_PERSONNEL: Personnel[] = [
  { id: 'ceo1', name: 'Deivis Aristides Marshall Elones', role: PersonnelRole.CEO, phone: '+507 6677-8899', email: 'deivis@pangeabocas.com', bloodType: 'A+', idNumber: '8-888-888', isActive: true, emergencyContactName: 'Operations Base', emergencyContactPhone: '+507 760 8024' },
  { id: 'p1', name: 'Mario Efrain Ayarza Torres', role: PersonnelRole.CAPTAIN_MOTOMARLIN, phone: '+507 6000-0001', email: 'mario@pangeabocas.com', bloodType: 'O+', licenseNumber: 'MM-4421', licenseExpDate: '2025-05-10', idNumber: '1-722-1234', isActive: true, emergencyContactName: 'Maria Torres', emergencyContactPhone: '+507 6222-1111' },
  { id: 'p2', name: 'Iancol Elian Torres Chiu', role: PersonnelRole.CAPTAIN_MOTOMARLIN, phone: '+507 6000-0002', email: 'iancol@pangeabocas.com', bloodType: 'A+', licenseNumber: 'MM-4422', licenseExpDate: '2025-06-12', isActive: true },
  { id: 'p3', name: 'Adalberto Earlington', role: PersonnelRole.CAPTAIN_MOTOMARLIN, phone: '+507 6000-0003', email: 'adalberto@pangeabocas.com', bloodType: 'O-', licenseNumber: 'MM-4423', licenseExpDate: '2025-07-15', isActive: true },
  { id: 'p4', name: 'Kirving Abdiel Peterkin Castillo', role: PersonnelRole.CAPTAIN_CLEARBOAT, phone: '+507 6000-0004', email: 'kirving@pangeabocas.com', bloodType: 'B+', licenseNumber: 'CB-9901', licenseExpDate: '2025-11-20', idNumber: '1-811-2233', isActive: true, emergencyContactName: 'Lucia Peterkin', emergencyContactPhone: '+507 6111-9999' },
  { id: 'p5', name: 'Eider Reik Wood Lopez', role: PersonnelRole.CAPTAIN_CLEARBOAT, phone: '+507 6000-0005', email: 'eider@pangeabocas.com', bloodType: 'O+', licenseNumber: 'CB-9902', licenseExpDate: '2025-12-10', isActive: true },
  { id: 'p6', name: 'Nestor Lewis Smith', role: PersonnelRole.CAPTAIN_CLEARBOAT, phone: '+507 6000-0006', email: 'nestor@pangeabocas.com', bloodType: 'AB+', licenseNumber: 'CB-9903', licenseExpDate: '2026-01-05', isActive: true },
  { id: 'p7', name: 'Abner Alberto Jesse Robinson', role: PersonnelRole.CAPTAIN_CLEARBOAT, phone: '+507 6000-0007', email: 'abner@pangeabocas.com', bloodType: 'O+', licenseNumber: 'CB-9904', licenseExpDate: '2026-02-14', isActive: true },
  { id: 'p8', name: 'Keiton Sair Aguilar Smith', role: PersonnelRole.MARINE, phone: '+507 6000-0008', email: 'keiton@pangeabocas.com', bloodType: 'O+', idNumber: '1-900-3344', isActive: true, emergencyContactName: 'Sara Smith', emergencyContactPhone: '+507 6444-5555' },
  { id: 'p9', name: 'Julio Elias de Gracia Palacio', role: PersonnelRole.MARINE, phone: '+507 6000-0009', email: 'julio@pangeabocas.com', bloodType: 'A-', isActive: true },
  { id: 'p10', name: 'Yeison Hernan Mitchell', role: PersonnelRole.GENERAL_HELPER, phone: '+507 6000-0010', email: 'yeison@pangeabocas.com', isActive: true },
  { id: 'p11', name: 'Olmar Forbes Livingston', role: PersonnelRole.GENERAL_HELPER, phone: '+507 6000-0011', email: 'olmar@pangeabocas.com', isActive: true },
  { id: 'p12', name: 'Irwin Smith Valencia', role: PersonnelRole.GENERAL_HELPER, phone: '+507 6000-0012', email: 'irwin@pangeabocas.com', isActive: true },
  { id: 'p13', name: 'Luis Carlos Santos Gonzalez', role: PersonnelRole.GENERAL_HELPER, phone: '+507 6000-0013', email: 'luis@pangeabocas.com', isActive: true },
  { id: 'p14', name: 'Shakir Amir Ellington Dailey', role: PersonnelRole.GENERAL_HELPER, phone: '+507 6000-0014', email: 'shakir@pangeabocas.com', isActive: true }
];

export const EMERGENCY_CONTACTS = [
  { label: 'SENAN (Search & Rescue)', value: '108' },
  { label: 'Pangea Base', value: '+507 760 8024' },
  { label: 'VHF Emergency', value: 'Channel 16' }
];

export const MAINTENANCE_TASKS = [
  'General Cleanup', 'Deep Clean up', 'Oil Change', 'Engine Tune-up', 'Hull Cleaning', 
  'Electrical System Check', 'Safety Gear Inspection', 'Anode Replacement', 
  'Propeller Balancing', 'Interior Upholstery', 'Fiberglass Repair', 
  'Bilge Pump Maintenance', 'Fuel Filter Replacement'
];

export const INITIAL_DATA_KEY = 'pangea_bocas_data_v13';

export const ECO_PROTOCOLS = [
  { title: 'Dolphin Watching', rules: ['Maintain 50m distance at all times', 'Maximum observation time of 20 minutes', 'Neutral gear when animals are close', 'No feeding or swimming with wild dolphins'] },
  { title: 'Coral Reef Protection', rules: ['Strictly use mooring buoys or sandy bottoms for anchoring', 'No touching or stepping on coral formations', 'Encourage use of reef-safe sunscreens'] },
  { title: 'Waste Management', rules: ['Zero single-use plastics encouraged', 'All trash returned to base for sorting', 'Biodegradable cleaning supplies only'] }
];

export const SAFETY_OHS = [
  { title: 'Passenger Safety', rules: ['Mandatory life jacket briefing before departure', 'Ensure PAX count never exceeds vessel capacity', 'No passengers on the bow while vessel is in motion'] },
  { title: 'Crew Readiness', rules: ['Valid license and ID must be carried', 'First Aid kit location shared with all mates', 'VHF radio test before leaving dock'] }
];
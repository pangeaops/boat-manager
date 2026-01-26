
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

/**
 * Empty by default to prevent duplicates once Airtable is linked.
 * The system will populate from cloud on startup.
 */
export const FULL_FLEET: Boat[] = [];

export const FLEET_REFERENCE_DATA = [
  { boat: 'Clear Boat PA-001', g_hr: 10, price_hr: 39.00 },
  { boat: 'La Verónica 32FT', g_hr: 20, price_hr: 78.00 },
  { boat: 'Sofia Anya 34FT', g_hr: 20, price_hr: 78.00 },
  { boat: 'La Beatriz 39FT', g_hr: 25, price_hr: 97.50 },
  { boat: 'Nana del Mar 46FT', g_hr: 35, price_hr: 136.50 },
  { boat: 'Emilia del Mar 46FT', g_hr: 35, price_hr: 136.50 },
];

export const BASE_GAS_RATE = 3.90;

/**
 * Empty by default to prevent duplicates once Airtable is linked.
 * The system will populate from cloud on startup.
 */
export const INITIAL_PERSONNEL: Personnel[] = [];

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

export const INITIAL_DATA_KEY = 'pangea_bocas_data_v15';

export const ECO_PROTOCOLS = [
  { title: 'Dolphin Watching', rules: ['Maintain 50m distance at all times', 'Maximum observation time of 20 minutes', 'Neutral gear when animals are close', 'No feeding or swimming with wild dolphins'] },
  { title: 'Coral Reef Protection', rules: ['Strictly use mooring buoys or sandy bottoms for anchoring', 'No touching or stepping on coral formations', 'Encourage use of reef-safe sunscreens'] },
  { title: 'Waste Management', rules: ['Zero single-use plastics encouraged', 'All trash returned to base for sorting', 'Biodegradable cleaning supplies only'] }
];

export const SAFETY_OHS = [
  { title: 'Passenger Safety', rules: ['Mandatory life jacket briefing before departure', 'Ensure PAX count never exceeds vessel capacity', 'No passengers on the bow while vessel is in motion'] },
  { title: 'Crew Readiness', rules: ['Valid license and ID must be carried', 'First Aid kit location shared with all mates', 'VHF radio test before leaving dock'] }
];

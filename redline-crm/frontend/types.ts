// ==================== PHONE NUMBERS ====================
export interface PhoneNumber {
  id: string;
  number: string;           // "+1-555-123-4567"
  country: string;          // "US", "CA", "AU"
  countryName: string;      // "United States"
  label: string;            // "Main USA Line"
  twilioSid?: string;       // Twilio phone number SID
  isDefault: boolean;
  canCall: boolean;
  canSMS: boolean;
  createdAt: Date;
}

// ==================== CONTACTS ====================
export interface Contact {
  id: string;
  name: string;
  phone: string;
  email: string;
  company: string;
  status: 'Lead' | 'Customer' | 'Churned';
  notes: string;
  lastContacted: Date;
  avatarUrl?: string;
  // New fields
  tags?: string[];
  score?: number;           // Lead score
  source?: string;          // Where did this lead come from
  createdAt?: Date;
}

// ==================== CALL LOGS ====================
export interface CallLog {
  id: string;
  contactId: string;
  date: Date;
  durationSeconds: number;
  type: 'inbound' | 'outbound' | 'missed';
  recordingUrl?: string;
  transcript?: string;
  summary?: string;
  // New fields
  fromNumber?: string;      // Which Twilio number was used
  fromCountry?: string;     // "US", "CA", etc.
  toNumber?: string;        // Number that was called
  disposition?: string;     // Call outcome: "answered", "voicemail", "busy", etc.
  twilioCallSid?: string;   // Twilio call SID for reference
}

// ==================== SMS MESSAGES ====================
export interface SMSMessage {
  id: string;
  contactId: string;
  fromNumber: string;       // Your Twilio number
  toNumber: string;         // Contact's number
  direction: 'inbound' | 'outbound';
  body: string;
  status: 'queued' | 'sent' | 'delivered' | 'failed' | 'received';
  read: boolean;            // Whether the message has been read
  timestamp: Date;
  twilioSid?: string;
}

// ==================== CONTACT NOTES ====================
export interface ContactNote {
  id: string;
  contactId: string;
  content: string;
  createdAt: Date;
  updatedAt: Date;
  createdBy?: string;
}

// ==================== SCHEDULED CALLS ====================
export interface ScheduledCall {
  id: string;
  contactId: string;
  scheduledAt: Date;
  notes?: string;
  status: 'pending' | 'completed' | 'cancelled' | 'missed';
  reminderMinutes: number;  // How many minutes before to remind
  createdAt: Date;
}

// ==================== TAGS ====================
export interface Tag {
  id: string;
  name: string;
  color: string;            // Hex color
  createdAt: Date;
}

// ==================== VOICEMAIL TEMPLATES ====================
export interface VoicemailTemplate {
  id: string;
  name: string;
  audioUrl: string;
  duration: number;
  createdAt: Date;
}

// ==================== LEADS (Apify Integration) ====================
export type LeadStatus = 'new' | 'contacted' | 'qualified' | 'converted' | 'rejected';

export interface LeadFolder {
  id: string;
  name: string;
  description?: string;
  color: string;
  icon?: string;
  leadCount: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface Lead {
  id: string;
  name: string;
  phone?: string;
  email?: string;
  company?: string;
  website?: string;
  address?: string;
  city?: string;
  country?: string;
  rating?: number;
  reviewCount?: number;
  category?: string;
  source: string;
  apifyActorId?: string;
  apifyRunId?: string;
  folderId?: string;
  status: LeadStatus;
  notes?: string;
  createdAt: Date;
  updatedAt?: Date;
}

export interface ApifyRunInfo {
  id: string;
  actorId: string;
  status: string;
  startedAt: string;
  finishedAt?: string;
  defaultDatasetId: string;
}

// ==================== LEGACY TYPES ====================
export interface Message {
  id: string;
  contactId: string;
  direction: 'inbound' | 'outbound';
  text: string;
  timestamp: Date;
}

export enum ViewState {
  DASHBOARD = 'DASHBOARD',
  DIALER = 'DIALER',
  CONTACTS = 'CONTACTS',
  MESSAGES = 'MESSAGES',
  EMAIL = 'EMAIL',
  TEMPLATES = 'TEMPLATES',
  REMINDERS = 'REMINDERS',
  CALL_RECORDINGS = 'CALL_RECORDINGS',
  SETTINGS = 'SETTINGS',
}

export interface AIResponse {
  text: string;
  sentiment?: 'positive' | 'neutral' | 'negative';
}

// ==================== COUNTRY DATA ====================
export const COUNTRIES = [
  { code: 'AF', name: 'Afghanistan', flag: '🇦🇫', dialCode: '+93' },
  { code: 'AL', name: 'Albania', flag: '🇦🇱', dialCode: '+355' },
  { code: 'DZ', name: 'Algeria', flag: '🇩🇿', dialCode: '+213' },
  { code: 'AD', name: 'Andorra', flag: '🇦🇩', dialCode: '+376' },
  { code: 'AO', name: 'Angola', flag: '🇦🇴', dialCode: '+244' },
  { code: 'AR', name: 'Argentina', flag: '🇦🇷', dialCode: '+54' },
  { code: 'AM', name: 'Armenia', flag: '🇦🇲', dialCode: '+374' },
  { code: 'AU', name: 'Australia', flag: '🇦🇺', dialCode: '+61' },
  { code: 'AT', name: 'Austria', flag: '🇦🇹', dialCode: '+43' },
  { code: 'AZ', name: 'Azerbaijan', flag: '🇦🇿', dialCode: '+994' },
  { code: 'BH', name: 'Bahrain', flag: '🇧🇭', dialCode: '+973' },
  { code: 'BD', name: 'Bangladesh', flag: '🇧🇩', dialCode: '+880' },
  { code: 'BY', name: 'Belarus', flag: '🇧🇾', dialCode: '+375' },
  { code: 'BE', name: 'Belgium', flag: '🇧🇪', dialCode: '+32' },
  { code: 'BZ', name: 'Belize', flag: '🇧🇿', dialCode: '+501' },
  { code: 'BJ', name: 'Benin', flag: '🇧🇯', dialCode: '+229' },
  { code: 'BT', name: 'Bhutan', flag: '🇧🇹', dialCode: '+975' },
  { code: 'BO', name: 'Bolivia', flag: '🇧🇴', dialCode: '+591' },
  { code: 'BA', name: 'Bosnia', flag: '🇧🇦', dialCode: '+387' },
  { code: 'BW', name: 'Botswana', flag: '🇧🇼', dialCode: '+267' },
  { code: 'BR', name: 'Brazil', flag: '🇧🇷', dialCode: '+55' },
  { code: 'BN', name: 'Brunei', flag: '🇧🇳', dialCode: '+673' },
  { code: 'BG', name: 'Bulgaria', flag: '🇧🇬', dialCode: '+359' },
  { code: 'BF', name: 'Burkina Faso', flag: '🇧🇫', dialCode: '+226' },
  { code: 'BI', name: 'Burundi', flag: '🇧🇮', dialCode: '+257' },
  { code: 'KH', name: 'Cambodia', flag: '🇰🇭', dialCode: '+855' },
  { code: 'CM', name: 'Cameroon', flag: '🇨🇲', dialCode: '+237' },
  { code: 'CA', name: 'Canada', flag: '🇨🇦', dialCode: '+1' },
  { code: 'CV', name: 'Cape Verde', flag: '🇨🇻', dialCode: '+238' },
  { code: 'CF', name: 'Central African Rep.', flag: '🇨🇫', dialCode: '+236' },
  { code: 'TD', name: 'Chad', flag: '🇹🇩', dialCode: '+235' },
  { code: 'CL', name: 'Chile', flag: '🇨🇱', dialCode: '+56' },
  { code: 'CN', name: 'China', flag: '🇨🇳', dialCode: '+86' },
  { code: 'CO', name: 'Colombia', flag: '🇨🇴', dialCode: '+57' },
  { code: 'KM', name: 'Comoros', flag: '🇰🇲', dialCode: '+269' },
  { code: 'CG', name: 'Congo', flag: '🇨🇬', dialCode: '+242' },
  { code: 'CD', name: 'Congo (DRC)', flag: '🇨🇩', dialCode: '+243' },
  { code: 'CR', name: 'Costa Rica', flag: '🇨🇷', dialCode: '+506' },
  { code: 'HR', name: 'Croatia', flag: '🇭🇷', dialCode: '+385' },
  { code: 'CU', name: 'Cuba', flag: '🇨🇺', dialCode: '+53' },
  { code: 'CY', name: 'Cyprus', flag: '🇨🇾', dialCode: '+357' },
  { code: 'CZ', name: 'Czech Republic', flag: '🇨🇿', dialCode: '+420' },
  { code: 'DK', name: 'Denmark', flag: '🇩🇰', dialCode: '+45' },
  { code: 'DJ', name: 'Djibouti', flag: '🇩🇯', dialCode: '+253' },
  { code: 'DO', name: 'Dominican Republic', flag: '🇩🇴', dialCode: '+1809' },
  { code: 'EC', name: 'Ecuador', flag: '🇪🇨', dialCode: '+593' },
  { code: 'EG', name: 'Egypt', flag: '🇪🇬', dialCode: '+20' },
  { code: 'SV', name: 'El Salvador', flag: '🇸🇻', dialCode: '+503' },
  { code: 'GQ', name: 'Equatorial Guinea', flag: '🇬🇶', dialCode: '+240' },
  { code: 'ER', name: 'Eritrea', flag: '🇪🇷', dialCode: '+291' },
  { code: 'EE', name: 'Estonia', flag: '🇪🇪', dialCode: '+372' },
  { code: 'ET', name: 'Ethiopia', flag: '🇪🇹', dialCode: '+251' },
  { code: 'FJ', name: 'Fiji', flag: '🇫🇯', dialCode: '+679' },
  { code: 'FI', name: 'Finland', flag: '🇫🇮', dialCode: '+358' },
  { code: 'FR', name: 'France', flag: '🇫🇷', dialCode: '+33' },
  { code: 'GA', name: 'Gabon', flag: '🇬🇦', dialCode: '+241' },
  { code: 'GM', name: 'Gambia', flag: '🇬🇲', dialCode: '+220' },
  { code: 'GE', name: 'Georgia', flag: '🇬🇪', dialCode: '+995' },
  { code: 'DE', name: 'Germany', flag: '🇩🇪', dialCode: '+49' },
  { code: 'GH', name: 'Ghana', flag: '🇬🇭', dialCode: '+233' },
  { code: 'GR', name: 'Greece', flag: '🇬🇷', dialCode: '+30' },
  { code: 'GT', name: 'Guatemala', flag: '🇬🇹', dialCode: '+502' },
  { code: 'GN', name: 'Guinea', flag: '🇬🇳', dialCode: '+224' },
  { code: 'GW', name: 'Guinea-Bissau', flag: '🇬🇼', dialCode: '+245' },
  { code: 'GY', name: 'Guyana', flag: '🇬🇾', dialCode: '+592' },
  { code: 'HT', name: 'Haiti', flag: '🇭🇹', dialCode: '+509' },
  { code: 'HN', name: 'Honduras', flag: '🇭🇳', dialCode: '+504' },
  { code: 'HK', name: 'Hong Kong', flag: '🇭🇰', dialCode: '+852' },
  { code: 'HU', name: 'Hungary', flag: '🇭🇺', dialCode: '+36' },
  { code: 'IS', name: 'Iceland', flag: '🇮🇸', dialCode: '+354' },
  { code: 'IN', name: 'India', flag: '🇮🇳', dialCode: '+91' },
  { code: 'ID', name: 'Indonesia', flag: '🇮🇩', dialCode: '+62' },
  { code: 'IR', name: 'Iran', flag: '🇮🇷', dialCode: '+98' },
  { code: 'IQ', name: 'Iraq', flag: '🇮🇶', dialCode: '+964' },
  { code: 'IE', name: 'Ireland', flag: '🇮🇪', dialCode: '+353' },
  { code: 'IL', name: 'Israel', flag: '🇮🇱', dialCode: '+972' },
  { code: 'IT', name: 'Italy', flag: '🇮🇹', dialCode: '+39' },
  { code: 'CI', name: 'Ivory Coast', flag: '🇨🇮', dialCode: '+225' },
  { code: 'JM', name: 'Jamaica', flag: '🇯🇲', dialCode: '+1876' },
  { code: 'JP', name: 'Japan', flag: '🇯🇵', dialCode: '+81' },
  { code: 'JO', name: 'Jordan', flag: '🇯🇴', dialCode: '+962' },
  { code: 'KZ', name: 'Kazakhstan', flag: '🇰🇿', dialCode: '+7' },
  { code: 'KE', name: 'Kenya', flag: '🇰🇪', dialCode: '+254' },
  { code: 'KW', name: 'Kuwait', flag: '🇰🇼', dialCode: '+965' },
  { code: 'KG', name: 'Kyrgyzstan', flag: '🇰🇬', dialCode: '+996' },
  { code: 'LA', name: 'Laos', flag: '🇱🇦', dialCode: '+856' },
  { code: 'LV', name: 'Latvia', flag: '🇱🇻', dialCode: '+371' },
  { code: 'LB', name: 'Lebanon', flag: '🇱🇧', dialCode: '+961' },
  { code: 'LS', name: 'Lesotho', flag: '🇱🇸', dialCode: '+266' },
  { code: 'LR', name: 'Liberia', flag: '🇱🇷', dialCode: '+231' },
  { code: 'LY', name: 'Libya', flag: '🇱🇾', dialCode: '+218' },
  { code: 'LI', name: 'Liechtenstein', flag: '🇱🇮', dialCode: '+423' },
  { code: 'LT', name: 'Lithuania', flag: '🇱🇹', dialCode: '+370' },
  { code: 'LU', name: 'Luxembourg', flag: '🇱🇺', dialCode: '+352' },
  { code: 'MO', name: 'Macau', flag: '🇲🇴', dialCode: '+853' },
  { code: 'MK', name: 'Macedonia', flag: '🇲🇰', dialCode: '+389' },
  { code: 'MG', name: 'Madagascar', flag: '🇲🇬', dialCode: '+261' },
  { code: 'MW', name: 'Malawi', flag: '🇲🇼', dialCode: '+265' },
  { code: 'MY', name: 'Malaysia', flag: '🇲🇾', dialCode: '+60' },
  { code: 'MV', name: 'Maldives', flag: '🇲🇻', dialCode: '+960' },
  { code: 'ML', name: 'Mali', flag: '🇲🇱', dialCode: '+223' },
  { code: 'MT', name: 'Malta', flag: '🇲🇹', dialCode: '+356' },
  { code: 'MR', name: 'Mauritania', flag: '🇲🇷', dialCode: '+222' },
  { code: 'MU', name: 'Mauritius', flag: '🇲🇺', dialCode: '+230' },
  { code: 'MX', name: 'Mexico', flag: '🇲🇽', dialCode: '+52' },
  { code: 'MD', name: 'Moldova', flag: '🇲🇩', dialCode: '+373' },
  { code: 'MC', name: 'Monaco', flag: '🇲🇨', dialCode: '+377' },
  { code: 'MN', name: 'Mongolia', flag: '🇲🇳', dialCode: '+976' },
  { code: 'ME', name: 'Montenegro', flag: '🇲🇪', dialCode: '+382' },
  { code: 'MA', name: 'Morocco', flag: '🇲🇦', dialCode: '+212' },
  { code: 'MZ', name: 'Mozambique', flag: '🇲🇿', dialCode: '+258' },
  { code: 'MM', name: 'Myanmar', flag: '🇲🇲', dialCode: '+95' },
  { code: 'NA', name: 'Namibia', flag: '🇳🇦', dialCode: '+264' },
  { code: 'NP', name: 'Nepal', flag: '🇳🇵', dialCode: '+977' },
  { code: 'NL', name: 'Netherlands', flag: '🇳🇱', dialCode: '+31' },
  { code: 'NZ', name: 'New Zealand', flag: '🇳🇿', dialCode: '+64' },
  { code: 'NI', name: 'Nicaragua', flag: '🇳🇮', dialCode: '+505' },
  { code: 'NE', name: 'Niger', flag: '🇳🇪', dialCode: '+227' },
  { code: 'NG', name: 'Nigeria', flag: '🇳🇬', dialCode: '+234' },
  { code: 'KP', name: 'North Korea', flag: '🇰🇵', dialCode: '+850' },
  { code: 'NO', name: 'Norway', flag: '🇳🇴', dialCode: '+47' },
  { code: 'OM', name: 'Oman', flag: '🇴🇲', dialCode: '+968' },
  { code: 'PK', name: 'Pakistan', flag: '🇵🇰', dialCode: '+92' },
  { code: 'PS', name: 'Palestine', flag: '🇵🇸', dialCode: '+970' },
  { code: 'PA', name: 'Panama', flag: '🇵🇦', dialCode: '+507' },
  { code: 'PG', name: 'Papua New Guinea', flag: '🇵🇬', dialCode: '+675' },
  { code: 'PY', name: 'Paraguay', flag: '🇵🇾', dialCode: '+595' },
  { code: 'PE', name: 'Peru', flag: '🇵🇪', dialCode: '+51' },
  { code: 'PH', name: 'Philippines', flag: '🇵🇭', dialCode: '+63' },
  { code: 'PL', name: 'Poland', flag: '🇵🇱', dialCode: '+48' },
  { code: 'PT', name: 'Portugal', flag: '🇵🇹', dialCode: '+351' },
  { code: 'PR', name: 'Puerto Rico', flag: '🇵🇷', dialCode: '+1787' },
  { code: 'QA', name: 'Qatar', flag: '🇶🇦', dialCode: '+974' },
  { code: 'RO', name: 'Romania', flag: '🇷🇴', dialCode: '+40' },
  { code: 'RU', name: 'Russia', flag: '🇷🇺', dialCode: '+7' },
  { code: 'RW', name: 'Rwanda', flag: '🇷🇼', dialCode: '+250' },
  { code: 'SA', name: 'Saudi Arabia', flag: '🇸🇦', dialCode: '+966' },
  { code: 'SN', name: 'Senegal', flag: '🇸🇳', dialCode: '+221' },
  { code: 'RS', name: 'Serbia', flag: '🇷🇸', dialCode: '+381' },
  { code: 'SG', name: 'Singapore', flag: '🇸🇬', dialCode: '+65' },
  { code: 'SK', name: 'Slovakia', flag: '🇸🇰', dialCode: '+421' },
  { code: 'SI', name: 'Slovenia', flag: '🇸🇮', dialCode: '+386' },
  { code: 'SO', name: 'Somalia', flag: '🇸🇴', dialCode: '+252' },
  { code: 'ZA', name: 'South Africa', flag: '🇿🇦', dialCode: '+27' },
  { code: 'KR', name: 'South Korea', flag: '🇰🇷', dialCode: '+82' },
  { code: 'SS', name: 'South Sudan', flag: '🇸🇸', dialCode: '+211' },
  { code: 'ES', name: 'Spain', flag: '🇪🇸', dialCode: '+34' },
  { code: 'LK', name: 'Sri Lanka', flag: '🇱🇰', dialCode: '+94' },
  { code: 'SD', name: 'Sudan', flag: '🇸🇩', dialCode: '+249' },
  { code: 'SR', name: 'Suriname', flag: '🇸🇷', dialCode: '+597' },
  { code: 'SZ', name: 'Swaziland', flag: '🇸🇿', dialCode: '+268' },
  { code: 'SE', name: 'Sweden', flag: '🇸🇪', dialCode: '+46' },
  { code: 'CH', name: 'Switzerland', flag: '🇨🇭', dialCode: '+41' },
  { code: 'SY', name: 'Syria', flag: '🇸🇾', dialCode: '+963' },
  { code: 'TW', name: 'Taiwan', flag: '🇹🇼', dialCode: '+886' },
  { code: 'TJ', name: 'Tajikistan', flag: '🇹🇯', dialCode: '+992' },
  { code: 'TZ', name: 'Tanzania', flag: '🇹🇿', dialCode: '+255' },
  { code: 'TH', name: 'Thailand', flag: '🇹🇭', dialCode: '+66' },
  { code: 'TL', name: 'Timor-Leste', flag: '🇹🇱', dialCode: '+670' },
  { code: 'TG', name: 'Togo', flag: '🇹🇬', dialCode: '+228' },
  { code: 'TT', name: 'Trinidad & Tobago', flag: '🇹🇹', dialCode: '+1868' },
  { code: 'TN', name: 'Tunisia', flag: '🇹🇳', dialCode: '+216' },
  { code: 'TR', name: 'Turkey', flag: '🇹🇷', dialCode: '+90' },
  { code: 'TM', name: 'Turkmenistan', flag: '🇹🇲', dialCode: '+993' },
  { code: 'UG', name: 'Uganda', flag: '🇺🇬', dialCode: '+256' },
  { code: 'UA', name: 'Ukraine', flag: '🇺🇦', dialCode: '+380' },
  { code: 'AE', name: 'UAE', flag: '🇦🇪', dialCode: '+971' },
  { code: 'GB', name: 'United Kingdom', flag: '🇬🇧', dialCode: '+44' },
  { code: 'US', name: 'United States', flag: '🇺🇸', dialCode: '+1' },
  { code: 'UY', name: 'Uruguay', flag: '🇺🇾', dialCode: '+598' },
  { code: 'UZ', name: 'Uzbekistan', flag: '🇺🇿', dialCode: '+998' },
  { code: 'VE', name: 'Venezuela', flag: '🇻🇪', dialCode: '+58' },
  { code: 'VN', name: 'Vietnam', flag: '🇻🇳', dialCode: '+84' },
  { code: 'YE', name: 'Yemen', flag: '🇾🇪', dialCode: '+967' },
  { code: 'ZM', name: 'Zambia', flag: '🇿🇲', dialCode: '+260' },
  { code: 'ZW', name: 'Zimbabwe', flag: '🇿🇼', dialCode: '+263' },
] as const;

export type CountryCode = typeof COUNTRIES[number]['code'];

export function getCountryByCode(code: string) {
  return COUNTRIES.find(c => c.code === code);
}

export function getCountryByDialCode(dialCode: string) {
  return COUNTRIES.find(c => c.dialCode === dialCode);
}

/**
 * Detect country from a phone number by matching the longest dial code first
 * This prevents +1 (US) from matching before +1876 (Jamaica) etc.
 */
export function getCountryFromPhoneNumber(phoneNumber: string) {
  if (!phoneNumber) return null;
  
  // Clean the phone number - ensure it starts with +
  let cleanNumber = phoneNumber.replace(/[^\d+]/g, '');
  if (!cleanNumber.startsWith('+')) {
    cleanNumber = '+' + cleanNumber;
  }
  
  // Sort countries by dial code length (descending) to match longer codes first
  const sortedCountries = [...COUNTRIES].sort((a, b) => 
    b.dialCode.length - a.dialCode.length
  );
  
  // Find matching country
  const match = sortedCountries.find(country => 
    cleanNumber.startsWith(country.dialCode)
  );
  
  return match || null;
}

/**
 * Parse phone number and return country + local number
 */
export function parsePhoneNumber(phoneNumber: string): { country: typeof COUNTRIES[number] | null; localNumber: string } {
  const country = getCountryFromPhoneNumber(phoneNumber);
  
  if (!country) {
    // No country detected, return as-is
    return { country: null, localNumber: phoneNumber.replace(/[^\d]/g, '') };
  }
  
  // Remove dial code from number
  let cleanNumber = phoneNumber.replace(/[^\d+]/g, '');
  if (!cleanNumber.startsWith('+')) {
    cleanNumber = '+' + cleanNumber;
  }
  
  const localNumber = cleanNumber
    .replace(country.dialCode, '')
    .replace(/^[\s-]/, '');
  
  return { country, localNumber };
}

// ==================== DISPOSITION CODES ====================
export const DISPOSITION_CODES = [
  { value: 'answered', label: 'Answered', color: 'green' },
  { value: 'voicemail', label: 'Voicemail', color: 'yellow' },
  { value: 'busy', label: 'Busy', color: 'orange' },
  { value: 'no_answer', label: 'No Answer', color: 'red' },
  { value: 'wrong_number', label: 'Wrong Number', color: 'gray' },
  { value: 'callback_requested', label: 'Callback Requested', color: 'blue' },
  { value: 'interested', label: 'Interested', color: 'green' },
  { value: 'not_interested', label: 'Not Interested', color: 'red' },
  { value: 'follow_up', label: 'Needs Follow-up', color: 'purple' },
] as const;

// ==================== TAG COLORS ====================
export const TAG_COLORS = [
  '#ef4444', // red
  '#f97316', // orange
  '#eab308', // yellow
  '#22c55e', // green
  '#14b8a6', // teal
  '#3b82f6', // blue
  '#8b5cf6', // purple
  '#ec4899', // pink
  '#6b7280', // gray
] as const;

export type CurrencyCode = 'USD' | 'EUR' | 'GBP' | 'ILS' | 'JPY' | 'AUD' | 'CAD' | 'CHF';

export interface ExchangeRate {
  code: CurrencyCode;
  symbol: string;
  name: string;
  rateAgainstUSD: number; // 1 USD = X in this currency
}

export type TripStatus = 'Draft' | 'Proposed' | 'Confirmed' | 'In Progress' | 'Completed' | 'Cancelled';

export interface HotelInfo {
  id: string;
  name: string;
  city: string;
  country: string;
  address: string;
  starRating: number;
  imageUrl: string;
  galleryUrls: string[];
  description: string;
  roomType: string;
  boardBasis: 'Room Only' | 'Bed & Breakfast' | 'Half Board' | 'Full Board' | 'All Inclusive';
  amenities: string[];
  checkInTime: string;
  checkOutTime: string;
  confirmationRef?: string;
  conciergeNotes?: string;
  contactPhone: string;
  pricePerNight: number;
  currency: CurrencyCode;
}

export type ActivityBookingStatus =
  | 'to be booked'
  | 'booking requested'
  | 'confirmed'
  | 'Unbooked'
  | 'Booking Requested'
  | 'Confirmed';

export interface ItineraryActivity {
  id: string;
  timeSlot: string; // "09:00 - 11:30"
  startTime: string; // "09:00"
  endTime: string; // "11:30"
  title: string;
  description: string;
  location: string;
  supplierId?: string; // Links to supplier (could be lone provider)
  included: boolean;
  costEstimate?: number | null;
  currency: CurrencyCode;
  category?: 'Sightseeing' | 'Dining' | 'Transport' | 'Culture' | 'Leisure' | 'Adventure' | string;
  bookingStatus?: ActivityBookingStatus; // 'to be booked' | 'booking requested' | 'confirmed'
  assignedBookingStaffId?: string; // Specific worker profile assigned to book
  bookingDeadline?: string; // Date or timeframe by which activity should be booked (YYYY-MM-DD)
  bookingTimeframe?: string; // e.g. "Within 48 hours", "By Oct 10"
  followUpDate?: string; // Follow up date when booking requested (YYYY-MM-DD)
  bookingTaskId?: string; // ID of auto-generated employee task
}

export interface ItineraryDay {
  id: string;
  dayNumber: number;
  date: string; // YYYY-MM-DD
  title: string;
  summary: string;
  hotelId?: string; // Hotel for this night
  hotelName?: string; // Hotel name entered or designated for this night
  activities: ItineraryActivity[];
}

export interface Itinerary {
  id: string;
  code: string; // e.g. "VOY-2026-081"
  title: string;
  tourName?: string; // Dedicated Tour Name
  clientId: string;
  destination: string;
  startDate: string; // YYYY-MM-DD
  endDate: string; // YYYY-MM-DD
  status: TripStatus;
  leadStaffId: string;
  partySize: number;
  currency: CurrencyCode;
  totalClientPrice: number;
  depositRequired: number;
  heroImage: string;
  logoUrl?: string; // Particular custom logo or branding badge on this itinerary
  guideName?: string; // Dedicated tour guide
  driverName?: string; // Dedicated chauffeur / driver
  overview: string;
  days: ItineraryDay[];
  highlights: string[];
  inclusions: string[];
  exclusions: string[];
  clientNotes?: string;
  generalProjectedCosts?: GeneralProjectedCostItem[]; // Projected costs for proposed itineraries (Full Financial View only)
  lastUpdated: string;
}

export interface GeneralProjectedCostItem {
  id: string;
  title: string; // e.g. "Dedicated VIP 35-Seat Executive Coach (5 Days)", "Master Guide Honorarium", "Border Fast-Track Permits"
  category: 'Transport & Fleet' | 'Guide / Tour Director' | 'Accommodations' | 'Security & VIP Handling' | 'Catering & Dining' | 'Attractions & Permits' | 'General Logistics' | 'Other';
  supplierId?: string; // Optional supplier reference
  estimatedAmount: number;
  currency: CurrencyCode;
  notes?: string;
  assignedDays?: number;
  createdAt: string;
}

export type TaskPriority = 'Low' | 'Medium' | 'High' | 'Urgent';
export type TaskStatus = 'Todo' | 'In Progress' | 'Review' | 'Completed';

export interface StaffMember {
  id: string;
  name: string;
  role: string;
  department: 'Tour Directing' | 'Logistics & Dispatch' | 'Finance & Invoicing' | 'Supplier Relations' | 'Executive Management';
  skills: string[];
  bio: string;
  email: string;
  phone: string;
  avatar?: string;
  activeLocation?: string;
  // Login & Password Access Control
  username?: string;
  password?: string;
  isApproved?: boolean;
  isAdmin?: boolean;
  lastLogin?: string;
  mustChangePassword?: boolean;
  passwordResetCode?: string;
  passwordResetExpiresAt?: string;
  // Staff Operations & Travel Passport Details
  passportNumber?: string;
  passportCountry?: string;
  passportExpiry?: string;
  // Financial View Permissions: 'full' or 'restricted' (managed strictly by system administrator)
  financialView?: 'full' | 'restricted';
}

export interface Task {
  id: string;
  title: string;
  description: string;
  tripId?: string;
  clientId?: string;
  assignedStaffId: string;
  priority: TaskPriority;
  status: TaskStatus;
  dueDate: string; // YYYY-MM-DD
  isReminder: boolean;
  reminderTriggerDaysBeforeTrip?: number;
  category: 'Vouchers' | 'Logistics' | 'Payment' | 'Client Care' | 'Supplier' | 'Compliance';
  completedAt?: string;
  staffEmailReminderEnabled?: boolean;
  staffEmailReminderStatus?: 'Scheduled' | 'Sent' | 'Failed' | 'Disabled';
  staffEmailReminderSentAt?: string;
  isSnoozed?: boolean;
  snoozedUntil?: string; // YYYY-MM-DD
  linkedActivityId?: string;
  linkedSupplierInvoiceId?: string;
}

export type PaymentStatus = 'Draft' | 'Sent' | 'Partially Paid' | 'Paid' | 'Overdue';

export interface PaymentRecord {
  id: string;
  invoiceId: string;
  date: string;
  amount: number;
  currency: CurrencyCode;
  convertedAmountUSD: number;
  paymentMethod: 'Bank Wire' | 'Credit Card' | 'Stripe' | 'AMEX' | 'Cheque';
  reference: string;
  notes?: string;
}

export interface InvoiceItem {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
  amount: number;
}

export interface Invoice {
  id: string;
  invoiceNumber: string;
  tripId: string;
  clientId: string;
  issueDate: string;
  dueDate: string;
  currency: CurrencyCode;
  exchangeRateApplied: number; // vs USD
  subtotal: number;
  taxRatePercent: number;
  taxAmount: number;
  totalAmount: number;
  amountPaid: number;
  balanceDue: number;
  status: PaymentStatus;
  items: InvoiceItem[];
  paymentTerms: string;
  payments: PaymentRecord[];
}

export type ExpenseCategory =
  | 'Hotel / Lodging'
  | 'Private Guide & Expert'
  | 'Vehicle & Chauffeur'
  | 'Attractions & Permits'
  | 'Meals & Wine'
  | 'Flights / Trains'
  | 'Office & Admin'
  | 'Software & Marketing'
  | 'Insurance & Legal';

export interface Expense {
  id: string;
  title: string;
  tripId?: string; // Optional: if undefined, general operational overhead
  supplierId?: string;
  category: ExpenseCategory;
  date: string;
  amount: number;
  currency: CurrencyCode;
  convertedAmountUSD: number;
  paymentStatus: 'Pending' | 'Paid' | 'Reimbursed';
  paymentMethod: 'Company Card' | 'Wire Transfer' | 'Petty Cash' | 'Direct Debit';
  receiptRef?: string;
  isGeneralOverhead: boolean;
  notes?: string;
  createdByStaffId?: string;
  createdByUid?: string;
  createdBy?: string;
  visibleToAll?: boolean;
}

export interface CommunicationRecord {
  id: string;
  clientId: string;
  staffId: string;
  date: string; // YYYY-MM-DD HH:mm
  type: 'Email' | 'Phone Call' | 'WhatsApp' | 'In-Person Meeting' | 'Trip Debrief';
  subject: string;
  summary: string;
  nextFollowUpDate?: string;
}

export interface Client {
  id: string;
  name: string;
  email: string;
  phone: string;
  companyOrFamily?: string;
  vipTier?: 'Standard' | 'Silver VIP' | 'Gold VIP' | 'Platinum VIP' | 'Family Office' | string;
  nationality: string;
  dietaryRestrictions: string[];
  preferences: string[];
  passportExpiry?: string;
  emergencyContact: {
    name: string;
    phone: string;
    relationship: string;
  };
  notes: string;
  createdAt: string;
}

export type SupplierCategory = 'Accommodation' | 'Guide' | 'Transport' | 'Activities & Dining';

export interface Supplier {
  id: string;
  name: string;
  category: SupplierCategory;
  isLoneProvider: boolean; // CRITICAL: If true, cannot be booked simultaneously by another group
  loneProviderType?: 'Exclusive Specialist Guide' | 'Private Yacht Charter' | 'Sole Luxury Van/Chauffeur' | 'Private Villa Host' | 'Bespoke Sommelier';
  city: string;
  country: string;
  contactPerson: string;
  email: string;
  phone: string;
  whatsappNumber: string;
  rating: number;
  notes: string;
}

export type SupplierBookingStatus = 'Requested' | 'Confirmed' | 'Voucher Issued' | 'Paid' | 'Cancelled';

export interface SupplierBooking {
  id: string;
  supplierId: string;
  tripId: string;
  serviceDescription: string;
  date: string; // YYYY-MM-DD
  startTime?: string; // HH:mm
  endTime?: string; // HH:mm
  guestsCount: number;
  status: SupplierBookingStatus;
  confirmationNumber?: string;
  voucherNumber?: string;
  cost: number;
  currency: CurrencyCode;
  notes?: string;
  autoRemindersEnabled?: boolean;
  whatsappReminderStatus?: 'Scheduled' | 'Sent' | 'Failed' | 'Disabled';
  whatsappReminderSentAt?: string;
  emailReminderStatus?: 'Scheduled' | 'Sent' | 'Failed' | 'Disabled';
  emailReminderSentAt?: string;
}

export interface ConflictNotice {
  id: string;
  severity: 'CRITICAL' | 'WARNING';
  type: 'LONE_PROVIDER_DOUBLE_BOOKING' | 'SCHEDULE_OVERLAP' | 'MISSING_ACCOMMODATION';
  title: string;
  description: string;
  tripId1: string;
  tripCode1: string;
  tripId2?: string;
  tripCode2?: string;
  date: string;
  supplierId?: string;
  supplierName?: string;
  resolutionHint: string;
}

export interface SavedDescriptionSnippet {
  id: string;
  keywords: string[];
  title: string;
  category?: string;
  location: string;
  defaultDurationHours: number;
  description: string;
  costEstimate?: number;
  recommendedSupplierId?: string;
}

export interface ActivityCatalogItem {
  id: string;
  name: string;
  description: string;
  durationHours: number; // Length of time in hours (e.g. 2.5)
  category?: string; // Optional activity classification
  location?: string;
  costEstimate?: number;
  currency?: CurrencyCode;
  supplierId?: string;
  included?: boolean;
  keyword?: string; // e.g. "masada", "deadsea", "wine" - typed while holding Shift to auto-insert
}

export type SupplierInvoiceStatus = 'Draft' | 'Pending Review' | 'Approved' | 'Paid' | 'Overdue';

export interface SupplierInvoice {
  id: string;
  invoiceNumber: string; // e.g. "INV-AVI-8821"
  supplierId: string;
  tripId?: string;
  issueDate: string; // YYYY-MM-DD
  dueDate: string; // YYYY-MM-DD
  amount: number;
  currency: CurrencyCode;
  description: string;
  status: SupplierInvoiceStatus;
  assignedStaffId?: string;
  createdByStaffId?: string; // ID of the staff user who added the invoice
  createdByUid?: string; // Auth UID of creator
  createdBy?: string; // Name of the creator
  visibleToAll?: boolean; // When true, price is visible even to restricted financial users
  paymentReminderEnabled?: boolean;
  linkedTaskId?: string;
  paidAt?: string;
  paymentMethod?: string;
  notes?: string;
  lastEditedBy?: string;
  lastEditedByUid?: string;
  lastEditedAt?: string;
}

export interface ApprovedTeamMember {
  uid: string;
  email: string;
  displayName: string;
  photoURL?: string;
  role: 'admin' | 'staff';
  financialView?: 'full' | 'restricted';
  status: 'approved' | 'pending' | 'rejected';
  approvedAt?: string;
  approvedBy?: string;
  createdAt: string;
  lastLoginAt?: string;
}

export interface ItineraryPassport {
  id: string;
  tripId: string;
  participantName: string;
  nationality: string;
  passportNumber: string;
  dateOfIssue: string; // YYYY-MM-DD
  dateOfExpiry: string; // YYYY-MM-DD
  notes?: string;
  createdAt: string;
  lastEditedBy?: string;
}

export interface WorkspaceAuditFields {
  lastEditedBy?: string;
  lastEditedByUid?: string;
  lastEditedAt?: string;
}



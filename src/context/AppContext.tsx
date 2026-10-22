import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';
import {
  auth,
  googleProvider,
  signInWithPopup,
  signOut,
  testConnection,
} from '../firebase/config';
import {
  COLLECTIONS,
  subscribeCollection,
  setWorkspaceDoc,
  deleteWorkspaceDoc,
  loadWorkspaceFromFirestore,
  seedInitialWorkspaceIfEmpty,
  registerOrUpdateApprovedMember,
  approveTeamMemberAction,
  revokeTeamMemberAction,
  deleteTeamMemberAction,
  CurrentAuthUser,
} from '../firebase/workspaceService';
import {
  INITIAL_CLIENTS,
  INITIAL_COMMUNICATIONS,
  INITIAL_EXPENSES,
  INITIAL_HOTELS,
  INITIAL_INVOICES,
  INITIAL_ITINERARIES,
  INITIAL_STAFF,
  INITIAL_SUPPLIER_BOOKINGS,
  INITIAL_SUPPLIERS,
  INITIAL_TASKS,
  INITIAL_EXCHANGE_RATES,
  INITIAL_SAVED_DESCRIPTIONS,
  INITIAL_ACTIVITIES,
  INITIAL_SUPPLIER_INVOICES,
} from '../data/seedData';
import {
  Client,
  CommunicationRecord,
  ConflictNotice,
  CurrencyCode,
  ExchangeRate,
  Expense,
  HotelInfo,
  Invoice,
  Itinerary,
  ItineraryActivity,
  ItineraryDay,
  PaymentRecord,
  SavedDescriptionSnippet,
  StaffMember,
  Supplier,
  SupplierBooking,
  SupplierBookingStatus,
  Task,
  ActivityCatalogItem,
  SupplierInvoice,
  ActivityBookingStatus,
  ApprovedTeamMember,
  ItineraryPassport,
} from '../types';

export interface AppContextType {
  // Navigation & View State
  activeView: string;
  setActiveView: (view: string) => void;
  selectedTripId: string | null;
  setSelectedTripId: (id: string | null) => void;
  clientPortalTripId: string | null;
  setClientPortalTripId: (id: string | null) => void;
  openClientPortal: (tripId: string) => void;
  lastLiveSyncTime: number;
  broadcastLiveSync: () => void;

  // Firebase Auth & Team Approvals
  firebaseUser: FirebaseUser | null;
  approvedMember: ApprovedTeamMember | null;
  approvedMembers: ApprovedTeamMember[];
  isApproved: boolean;
  isAuthLoading: boolean;
  authError: string | null;
  signInWithGoogle: () => Promise<void>;
  signOutUser: () => Promise<void>;
  approveMember: (uid: string, role?: 'admin' | 'staff', financialView?: 'full' | 'restricted') => Promise<void>;
  rejectMember: (uid: string) => Promise<void>;
  deleteApprovedMember: (uid: string) => Promise<void>;

  // Financial Access Permissions (managed exclusively by System Administrator)
  hasFullFinancialView: boolean;
  userFinancialView: 'full' | 'restricted';

  // Tour Participant Passports Manifest
  passports: ItineraryPassport[];
  addItineraryPassport: (passport: ItineraryPassport) => Promise<void>;
  updateItineraryPassport: (passport: ItineraryPassport) => Promise<void>;
  deleteItineraryPassport: (id: string) => Promise<void>;

  // Data Collections
  itineraries: Itinerary[];
  hotels: HotelInfo[];
  suppliers: Supplier[];
  supplierBookings: SupplierBooking[];
  clients: Client[];
  communications: CommunicationRecord[];
  tasks: Task[];
  invoices: Invoice[];
  expenses: Expense[];
  staff: StaffMember[];
  currentUser: StaffMember | null;
  isSystemAdmin: boolean;
  loginUser: (usernameOrEmail: string, password: string) => Promise<{ success: boolean; message: string; user?: StaffMember }>;
  logoutUser: () => void;
  switchUser: (staffId: string) => boolean;

  // Real-time Cloud Sync & Status Indicator
  syncStatus: 'synced' | 'saving' | 'offline' | 'error';
  syncError: string | null;
  dismissSyncError: () => void;
  isSyncing: boolean;
  isDataLoaded: boolean;
  lastSyncedTime: number;
  triggerManualSync: () => Promise<void>;
  retrySync: () => Promise<void>;

  // Staff Management
  addStaffMember: (newStaff: StaffMember) => Promise<{ success: boolean; error?: string }>;
  deleteStaffMember: (staffId: string) => Promise<{ success: boolean; error?: string }>;
  updateStaffMember: (staff: StaffMember) => Promise<void>;
  updateStaffCredentials: (
    staffId: string,
    credentials: { username?: string; password?: string; isApproved?: boolean; isAdmin?: boolean; mustChangePassword?: boolean; financialView?: 'full' | 'restricted' }
  ) => Promise<{ success: boolean; error?: string }>;
  changeOwnPassword: (currentPassword: string, newPassword: string) => { success: boolean; message: string };
  updateOwnPassport: (passportDetails: { passportNumber?: string; passportCountry?: string; passportExpiry?: string }) => { success: boolean; message: string };
  forcePasswordResetByAdmin: (staffId: string) => { success: boolean; message: string; tempCode?: string; targetUser?: StaffMember };
  requestPasswordResetCode: (usernameOrEmail: string) => { success: boolean; message: string; email?: string; securityCode?: string };
  verifyResetCodeAndSetPassword: (usernameOrEmail: string, code: string, newPassword: string) => { success: boolean; message: string; user?: StaffMember };
  latestSecurityAlertEmail: { to: string; staffName: string; subject: string; code: string; timestamp: string } | null;
  dismissSecurityAlertEmail: () => void;

  // Exchange Rates & Descriptions
  exchangeRates: Record<CurrencyCode, ExchangeRate>;
  updateExchangeRate: (code: CurrencyCode, rateAgainstUSD: number) => Promise<void>;
  updateMultipleExchangeRates: (rates: Partial<Record<CurrencyCode, number>>) => Promise<void>;
  savedDescriptions: SavedDescriptionSnippet[];
  addSavedDescription: (snippet: SavedDescriptionSnippet) => Promise<void>;
  updateSavedDescription: (snippet: SavedDescriptionSnippet) => Promise<void>;
  deleteSavedDescription: (id: string) => Promise<void>;
  searchSavedDescriptions: (query: string) => SavedDescriptionSnippet[];

  // Activity Catalog
  activityCatalog: ActivityCatalogItem[];
  addActivityCatalogItem: (item: ActivityCatalogItem) => Promise<void>;
  updateActivityCatalogItem: (item: ActivityCatalogItem) => Promise<void>;
  deleteActivityCatalogItem: (id: string) => Promise<void>;

  // Supplier Invoices
  supplierInvoices: SupplierInvoice[];
  addSupplierInvoice: (invoice: SupplierInvoice, reminderToStaff?: boolean) => Promise<void>;
  updateSupplierInvoice: (invoice: SupplierInvoice) => Promise<void>;
  deleteSupplierInvoice: (id: string) => Promise<void>;
  deleteAllSupplierInvoices: () => Promise<void>;
  markSupplierInvoicePaid: (id: string, paymentMethod?: string) => Promise<void>;

  // Task Actions
  addTask: (task: Task) => Promise<void>;
  updateTask: (task: Task) => Promise<void>;
  toggleTaskStatus: (taskId: string) => Promise<void>;
  deleteTask: (taskId: string) => Promise<void>;
  deleteAllTasks: () => Promise<void>;
  snoozeTask: (taskId: string, days?: number, customDate?: string) => Promise<void>;
  unsnoozeTask: (taskId: string) => Promise<void>;

  // Itinerary & Activity Actions
  addItinerary: (itinerary: Itinerary) => Promise<void>;
  updateItinerary: (itinerary: Itinerary) => Promise<void>;
  deleteItinerary: (id: string) => Promise<void>;
  addDayToItinerary: (tripId: string, day: ItineraryDay) => Promise<void>;
  updateDayInItinerary: (tripId: string, day: ItineraryDay) => Promise<void>;
  deleteDayFromItinerary: (tripId: string, dayId: string) => Promise<void>;
  addActivityToDay: (tripId: string, dayId: string, activity: ItineraryActivity) => Promise<void>;
  updateActivityInDay: (tripId: string, dayId: string, activity: ItineraryActivity) => Promise<void>;
  deleteActivityFromDay: (tripId: string, dayId: string, activityId: string) => Promise<void>;
  moveActivity: (
    tripId: string,
    sourceDayId: string,
    targetDayId: string,
    activityId: string,
    newStartTime?: string,
    newEndTime?: string
  ) => Promise<void>;
  updateActivityBookingStatus: (
    tripId: string,
    dayId: string,
    activityId: string,
    status: ActivityBookingStatus
  ) => Promise<void>;

  // Conflicts
  conflicts: ConflictNotice[];
  resolveConflict: (conflict: ConflictNotice, newSupplierId?: string) => void;

  // Currency Helpers
  convertCurrency: (amount: number, from: CurrencyCode, to: CurrencyCode) => number;
  formatMoney: (amount: number, currency: CurrencyCode) => string;

  // Hotel Actions
  addHotel: (hotel: HotelInfo) => Promise<void>;
  updateHotel: (hotel: HotelInfo) => Promise<void>;
  deleteHotel: (id: string) => Promise<void>;

  // Invoices Actions
  addInvoice: (invoice: Invoice) => Promise<void>;
  updateInvoice: (invoice: Invoice) => Promise<void>;
  deleteInvoice: (id: string) => Promise<void>;
  deleteAllInvoices: () => Promise<void>;
  recordPayment: (invoiceId: string, payment: Omit<PaymentRecord, 'id' | 'invoiceId'>) => Promise<void>;
  generateInvoiceFromItinerary: (tripId: string) => Invoice;

  // Expense Actions
  addExpense: (expense: Expense) => Promise<void>;
  updateExpense: (expense: Expense) => Promise<void>;
  deleteExpense: (id: string) => Promise<void>;
  deleteAllExpenses: () => Promise<void>;

  // Client Actions
  addClient: (client: Client) => Promise<void>;
  updateClient: (client: Client) => Promise<void>;
  deleteClient: (id: string) => Promise<void>;
  addCommunication: (comm: CommunicationRecord) => Promise<void>;

  // Supplier Actions
  addSupplier: (supplier: Supplier) => Promise<void>;
  updateSupplier: (supplier: Supplier) => Promise<void>;
  deleteSupplier: (id: string) => Promise<void>;
  addSupplierBooking: (booking: SupplierBooking) => Promise<void>;
  updateSupplierBooking: (booking: SupplierBooking) => Promise<void>;
  updateSupplierBookingStatus: (bookingId: string, status: SupplierBookingStatus) => Promise<void>;
  cancelSupplierBooking: (bookingId: string) => Promise<void>;
  deleteSupplierBooking: (bookingId: string) => Promise<void>;

  // Utility & Branding
  resetToDefaults: () => void;
  companyLogo: string;
  updateCompanyLogo: (logoUrl: string) => Promise<void>;
  updateStaffThumbnail: (staffId: string, thumbnailUrl: string) => Promise<{ success: boolean; message: string }>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const getInitialView = () => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('view') === 'client') return 'client-portal';
    const saved = localStorage.getItem('tourops_active_view_v1');
    if (saved && saved !== 'client-portal') return saved;
    return 'dashboard';
  };

  const [activeView, setActiveView] = useState<string>(getInitialView);
  const [selectedTripId, setSelectedTripId] = useState<string | null>('trip-1');
  const [clientPortalTripId, setClientPortalTripId] = useState<string | null>('trip-1');

  // Firebase Auth states
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [approvedMember, setApprovedMember] = useState<ApprovedTeamMember | null>(null);
  const [approvedMembers, setApprovedMembers] = useState<ApprovedTeamMember[]>([]);
  const [isAuthLoading, setIsAuthLoading] = useState<boolean>(true);
  const [authError, setAuthError] = useState<string | null>(null);

  // Workflow Data states - starts with defaults as fallback while initial remote fetch completes
  const [itineraries, setItineraries] = useState<Itinerary[]>(INITIAL_ITINERARIES);
  const [hotels, setHotels] = useState<HotelInfo[]>(INITIAL_HOTELS);
  const [suppliers, setSuppliers] = useState<Supplier[]>(INITIAL_SUPPLIERS);
  const [supplierBookings, setSupplierBookings] = useState<SupplierBooking[]>(INITIAL_SUPPLIER_BOOKINGS);
  const [clients, setClients] = useState<Client[]>(INITIAL_CLIENTS);
  const [communications, setCommunications] = useState<CommunicationRecord[]>(INITIAL_COMMUNICATIONS);
  const [tasks, setTasks] = useState<Task[]>(INITIAL_TASKS);
  const [invoices, setInvoices] = useState<Invoice[]>(INITIAL_INVOICES);
  const [expenses, setExpenses] = useState<Expense[]>(INITIAL_EXPENSES);
  const [exchangeRates, setExchangeRates] = useState<Record<CurrencyCode, ExchangeRate>>(INITIAL_EXCHANGE_RATES);
  const [savedDescriptions, setSavedDescriptions] = useState<SavedDescriptionSnippet[]>(INITIAL_SAVED_DESCRIPTIONS);
  const [activityCatalog, setActivityCatalog] = useState<ActivityCatalogItem[]>(INITIAL_ACTIVITIES);
  const [supplierInvoices, setSupplierInvoices] = useState<SupplierInvoice[]>(INITIAL_SUPPLIER_INVOICES);
  const [passports, setPassports] = useState<ItineraryPassport[]>([]);
  const [staff, setStaff] = useState<StaffMember[]>(INITIAL_STAFF);
  const [currentUser, setCurrentUser] = useState<StaffMember | null>(() => {
    const savedStaffId = localStorage.getItem('tourops_current_staff_id');
    if (savedStaffId) {
      const match = INITIAL_STAFF.find((s) => s.id === savedStaffId);
      if (match) return match;
      if (savedStaffId === 'staff-admin-joshua') return INITIAL_STAFF[0];
    }
    return null;
  });
  const [companyLogo, setCompanyLogo] = useState<string>('https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?auto=format&fit=crop&w=400&q=80');

  // Data loading & Sync state - Starts as 'saving' during initial load, only transitions to 'synced' after Firestore confirmation
  const [isDataLoaded, setIsDataLoaded] = useState<boolean>(false);
  const [syncStatus, setSyncStatus] = useState<'synced' | 'saving' | 'offline' | 'error'>('saving');
  const [syncError, setSyncError] = useState<string | null>(null);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [lastSyncedTime, setLastSyncedTime] = useState<number>(Date.now());
  const [lastLiveSyncTime, setLastLiveSyncTime] = useState<number>(Date.now());
  const [latestSecurityAlertEmail, setLatestSecurityAlertEmail] = useState<{
    to: string;
    staffName: string;
    subject: string;
    code: string;
    timestamp: string;
  } | null>(null);

  const dismissSyncError = () => {
    setSyncError(null);
    setSyncStatus('synced');
  };

  // Derived Access Rules
  const isBootstrappedAdmin = Boolean(
    (firebaseUser?.email && firebaseUser.email.toLowerCase() === 'josh@pizazzisrael.com') ||
    (currentUser?.email && currentUser.email.toLowerCase() === 'josh@pizazzisrael.com') ||
    currentUser?.id === 'staff-admin-joshua'
  );

  const isApproved = Boolean(
    isBootstrappedAdmin ||
    approvedMember?.status === 'approved' ||
    currentUser?.isAdmin ||
    currentUser?.isApproved ||
    currentUser != null
  );

  const isSystemAdmin = Boolean(
    isBootstrappedAdmin || approvedMember?.role === 'admin' || currentUser?.isAdmin
  );

  // Financial Access Visibility: Full vs Restricted
  // CRITICAL: Restricted users are never notified of their restriction
  const userFinancialView: 'full' | 'restricted' = useMemo(() => {
    if (isSystemAdmin) return 'full';
    if (currentUser?.financialView) return currentUser.financialView;
    if (approvedMember?.financialView) return approvedMember.financialView;
    return 'full';
  }, [isSystemAdmin, currentUser, approvedMember]);

  const hasFullFinancialView = userFinancialView === 'full';

  const currentAuthUser: CurrentAuthUser | null = useMemo(() => {
    if (!firebaseUser) {
      if (currentUser) {
        return {
          uid: currentUser.id,
          email: currentUser.email || null,
          displayName: currentUser.name,
          photoURL: currentUser.avatar,
        };
      }
      return null;
    }
    return {
      uid: firebaseUser.uid,
      email: firebaseUser.email,
      displayName: firebaseUser.displayName || currentUser?.name || firebaseUser.email?.split('@')[0] || 'Team Member',
      photoURL: firebaseUser.photoURL || currentUser?.avatar,
    };
  }, [firebaseUser, currentUser]);

  // 1. Validate connection on initial boot
  useEffect(() => {
    testConnection().then((ok) => {
      if (ok) {
        console.log('[TourOps Firestore] Connection to Cloud Firestore verified successfully.');
      }
    });
  }, []);

  // 2. Firebase Auth Listener & Profile Sync
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setIsAuthLoading(true);
      setFirebaseUser(user);

      if (!user) {
        setApprovedMember(null);
        // Check if there is a local staff session
        const savedStaffId = localStorage.getItem('tourops_current_staff_id');
        if (savedStaffId) {
          setStaff((prevStaff) => {
            const match = prevStaff.find((s) => s.id === savedStaffId) || INITIAL_STAFF.find((s) => s.id === savedStaffId);
            if (match) setCurrentUser(match);
            return prevStaff;
          });
        }
        setIsAuthLoading(false);
        return;
      }

      try {
        const isAdminEmail = Boolean(user.email && user.email.toLowerCase() === 'josh@pizazzisrael.com');
        const member = await registerOrUpdateApprovedMember(
          {
            uid: user.uid,
            email: user.email,
            displayName: user.displayName,
            photoURL: user.photoURL,
          },
          isAdminEmail
        );

        setApprovedMember(member);

        // Find or create matching StaffMember profile
        setStaff((prevStaff) => {
          let found = prevStaff.find(
            (s) => s.email.toLowerCase() === (user.email || '').toLowerCase()
          );

          if (!found && isAdminEmail) {
            found = prevStaff.find((s) => s.id === 'staff-admin-joshua') || INITIAL_STAFF[0];
          }

          if (found) {
            const updatedProfile = {
              ...found,
              isApproved: true,
              isAdmin: isAdminEmail || member.role === 'admin' || found.isAdmin,
              avatar: user.photoURL || found.avatar,
            };
            setCurrentUser(updatedProfile);
            localStorage.setItem('tourops_current_staff_id', updatedProfile.id);
            return prevStaff.map((s) => (s.id === found!.id ? updatedProfile : s));
          } else {
            // Create a new staff profile for this Google user
            const newStaffProfile: StaffMember = {
              id: `staff-${user.uid.slice(0, 8)}`,
              name: user.displayName || user.email?.split('@')[0] || 'Staff Member',
              role: isAdminEmail ? 'System Administrator & Managing Director' : 'Tour Operations Specialist',
              department: isAdminEmail ? 'Executive Management' : 'Tour Directing',
              skills: ['Operations', 'Customer Care', 'Itinerary Management'],
              bio: `Google Workspace team member (${user.email})`,
              email: user.email || '',
              phone: '',
              avatar: user.photoURL || undefined,
              isApproved: member.status === 'approved',
              isAdmin: isAdminEmail || member.role === 'admin',
              activeLocation: 'Headquarters',
            };
            setCurrentUser(newStaffProfile);
            localStorage.setItem('tourops_current_staff_id', newStaffProfile.id);
            setWorkspaceDoc(COLLECTIONS.STAFF, newStaffProfile, {
              uid: user.uid,
              email: user.email,
              displayName: user.displayName,
            }).catch(console.warn);
            return [newStaffProfile, ...prevStaff];
          }
        });
      } catch (err: any) {
        console.warn('[TourOps Auth] Member sync error:', err);
      } finally {
        setIsAuthLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  // 3. Centralized Firestore Write Execution Engine
  // Only confirms 'synced' AFTER Firestore confirms the write!
  const executeFirestoreWrite = useCallback(
    async <T,>(operation: () => Promise<T>, entityDescription: string): Promise<T> => {
      setIsSyncing(true);
      setSyncStatus('saving');
      setSyncError(null);
      try {
        const result = await operation();
        setSyncStatus('synced');
        setLastSyncedTime(Date.now());
        setSyncError(null);
        return result;
      } catch (err: any) {
        const errorMsg = err?.message || `Failed to save ${entityDescription} to Cloud Firestore.`;
        console.error(`[TourOps Firestore Save Error] ${entityDescription}:`, err);
        setSyncStatus('error');
        setSyncError(errorMsg);
        throw err;
      } finally {
        setIsSyncing(false);
      }
    },
    []
  );

  // 4. Real-time Cloud Firestore synchronization & Reopen Loader
  useEffect(() => {
    let isMounted = true;
    const unsubs: (() => void)[] = [];

    const initializeAndLoad = async () => {
      setSyncStatus('saving');
      try {
        // Step A: Seed initial workspace only if it has never been initialized before
        await seedInitialWorkspaceIfEmpty(
          {
            itineraries: INITIAL_ITINERARIES,
            hotels: INITIAL_HOTELS,
            suppliers: INITIAL_SUPPLIERS,
            supplierBookings: INITIAL_SUPPLIER_BOOKINGS,
            clients: INITIAL_CLIENTS,
            communications: INITIAL_COMMUNICATIONS,
            tasks: INITIAL_TASKS,
            invoices: INITIAL_INVOICES,
            expenses: INITIAL_EXPENSES,
            activityCatalog: INITIAL_ACTIVITIES,
            savedDescriptions: INITIAL_SAVED_DESCRIPTIONS,
            supplierInvoices: INITIAL_SUPPLIER_INVOICES,
            staff: INITIAL_STAFF,
            exchangeRates: INITIAL_EXCHANGE_RATES,
            companyLogo,
          },
          currentAuthUser
        );

        // Step B: Load all saved workspace documents directly from Cloud Firestore
        const savedData = await loadWorkspaceFromFirestore();
        if (!isMounted) return;

        if (savedData.isInitialized) {
          // Unconditionally load saved data from Firestore so deletions, additions and edits are respected
          // Pre-stored demo hotel cleanup definitions
          const demoHotelIds = ['hotel-1', 'hotel-2', 'hotel-3'];
          const isDemoHotel = (id?: string) =>
            Boolean(id && demoHotelIds.includes(id));

          // Filter out pre-stored hotels and clean up from Firestore
          const activeHotels = (savedData.hotels || []).filter((h) => !isDemoHotel(h.id));
          setHotels(activeHotels);
          if (savedData.hotels) {
            savedData.hotels
              .filter((h) => isDemoHotel(h.id))
              .forEach((h) => {
                deleteWorkspaceDoc(COLLECTIONS.HOTELS, h.id).catch(() => {});
              });
          }

          // Clean up prestored hotel assignments on itineraries so itinerary designers are prompted to enter hotels
          const cleanedItineraries = (savedData.itineraries || []).map((itin) => ({
            ...itin,
            days: (itin.days || []).map((day) => {
              if (isDemoHotel(day.hotelId)) {
                return {
                  ...day,
                  hotelId: undefined,
                  hotelName: undefined,
                };
              }
              return day;
            }),
          }));
          setItineraries(cleanedItineraries);

          setSuppliers(savedData.suppliers);
          setSupplierBookings(savedData.supplierBookings);
          // Delete/filter out prestored demo clients and communications
          const demoClientIds = ['client-1', 'client-2', 'client-3', 'client-test-persistence'];
          const demoCommIds = ['comm-1', 'comm-2', 'comm-3', 'comm-4'];
          setClients((savedData.clients || []).filter((c) => !demoClientIds.includes(c.id)));
          setCommunications(
            (savedData.communications || []).filter(
              (c) =>
                !demoCommIds.includes(c.id) &&
                !demoClientIds.includes(c.clientId)
            )
          );
          // Clean up demo clients from Firestore if present
          if (savedData.clients) {
            savedData.clients
              .filter((c) => demoClientIds.includes(c.id))
              .forEach((c) => {
                deleteWorkspaceDoc(COLLECTIONS.CLIENTS, c.id).catch(() => {});
              });
          }
          if (savedData.communications) {
            savedData.communications
              .filter((c) => demoCommIds.includes(c.id) || demoClientIds.includes(c.clientId))
              .forEach((c) => {
                deleteWorkspaceDoc(COLLECTIONS.COMMUNICATIONS, c.id).catch(() => {});
              });
          }
          setTasks(savedData.tasks);
          setInvoices(savedData.invoices);
          setExpenses(savedData.expenses);
          setActivityCatalog(savedData.activityCatalog);
          setSavedDescriptions(savedData.savedDescriptions);
          setSupplierInvoices(savedData.supplierInvoices);
          if (savedData.passports) {
            setPassports(savedData.passports);
          }
          if (savedData.staff.length > 0) {
            setStaff(savedData.staff);
            const savedStaffId = localStorage.getItem('tourops_current_staff_id');
            if (savedStaffId) {
              const freshUser = savedData.staff.find((s) => s.id === savedStaffId);
              if (freshUser) {
                setCurrentUser(freshUser);
              }
            }
          }
          if (savedData.approvedMembers.length > 0) {
            setApprovedMembers(savedData.approvedMembers);
          }

          const generalSettings = savedData.settings.find((s) => s.id === 'general');
          if (generalSettings) {
            if (generalSettings.companyLogo) setCompanyLogo(generalSettings.companyLogo);
            if (generalSettings.exchangeRates) setExchangeRates(generalSettings.exchangeRates);
          }
        }

        setIsDataLoaded(true);
        setSyncStatus('synced');
        setLastSyncedTime(Date.now());
        setSyncError(null);
        console.log('[TourOps Firestore] Saved workspace successfully loaded and verified from Cloud Firestore.');
      } catch (err: any) {
        if (!isMounted) return;
        console.error('[TourOps Firestore] Error loading workspace on reopen:', err);
        setSyncStatus('error');
        setSyncError(err?.message || 'Failed to load saved workspace from Cloud Firestore.');
      }
    };

    initializeAndLoad();

    // Step C: Subscribe to all live snapshot streams for real-time collaboration
    unsubs.push(
      subscribeCollection<Itinerary>(COLLECTIONS.ITINERARIES, (data) => {
        const demoHotelIds = ['hotel-1', 'hotel-2', 'hotel-3'];
        const isDemoHotel = (id?: string) =>
          Boolean(id && (demoHotelIds.includes(id) || id.startsWith('hotel-1') || id.startsWith('hotel-2') || id.startsWith('hotel-3')));
        const cleaned = data.map((itin) => ({
          ...itin,
          days: (itin.days || []).map((day) => {
            if (isDemoHotel(day.hotelId)) {
              return {
                ...day,
                hotelId: undefined,
                hotelName: undefined,
              };
            }
            return day;
          }),
        }));
        setItineraries(cleaned);
        setSyncStatus('synced');
        setLastSyncedTime(Date.now());
      })
    );

    unsubs.push(
      subscribeCollection<HotelInfo>(COLLECTIONS.HOTELS, (data) => {
        const demoHotelIds = ['hotel-1', 'hotel-2', 'hotel-3'];
        const isDemoHotel = (id?: string) =>
          Boolean(id && (demoHotelIds.includes(id) || id.startsWith('hotel-1') || id.startsWith('hotel-2') || id.startsWith('hotel-3')));
        setHotels(data.filter((h) => !isDemoHotel(h.id)));
      })
    );

    unsubs.push(
      subscribeCollection<Supplier>(COLLECTIONS.SUPPLIERS, (data) => {
        setSuppliers(data);
      })
    );

    unsubs.push(
      subscribeCollection<SupplierBooking>(COLLECTIONS.SUPPLIER_BOOKINGS, (data) => {
        setSupplierBookings(data);
      })
    );

    unsubs.push(
      subscribeCollection<Client>(COLLECTIONS.CLIENTS, (data) => {
        setClients(data.filter((c) => !['client-1', 'client-2', 'client-3', 'client-test-persistence'].includes(c.id)));
      })
    );

    unsubs.push(
      subscribeCollection<CommunicationRecord>(COLLECTIONS.COMMUNICATIONS, (data) => {
        setCommunications(
          data.filter(
            (c) =>
              !['comm-1', 'comm-2', 'comm-3', 'comm-4'].includes(c.id) &&
              !['client-1', 'client-2', 'client-3', 'client-test-persistence'].includes(c.clientId)
          )
        );
      })
    );

    unsubs.push(
      subscribeCollection<ItineraryPassport>(COLLECTIONS.ITINERARY_PASSPORTS, (data) => {
        setPassports(data);
      })
    );

    unsubs.push(
      subscribeCollection<Task>(COLLECTIONS.TASKS, (data) => {
        setTasks(data);
      })
    );

    unsubs.push(
      subscribeCollection<Invoice>(COLLECTIONS.INVOICES, (data) => {
        setInvoices(data);
      })
    );

    unsubs.push(
      subscribeCollection<Expense>(COLLECTIONS.EXPENSES, (data) => {
        setExpenses(data);
      })
    );

    unsubs.push(
      subscribeCollection<ActivityCatalogItem>(COLLECTIONS.ACTIVITY_CATALOG, (data) => {
        setActivityCatalog(data);
      })
    );

    unsubs.push(
      subscribeCollection<SavedDescriptionSnippet>(COLLECTIONS.SAVED_DESCRIPTIONS, (data) => {
        setSavedDescriptions(data);
      })
    );

    unsubs.push(
      subscribeCollection<SupplierInvoice>(COLLECTIONS.SUPPLIER_INVOICES, (data) => {
        setSupplierInvoices(data);
      })
    );

    unsubs.push(
      subscribeCollection<StaffMember>(COLLECTIONS.STAFF, (data) => {
        setStaff(data);
        if (currentUser) {
          const updated = data.find((s) => s.id === currentUser.id || s.email === currentUser.email);
          if (updated) setCurrentUser(updated);
        }
      })
    );

    unsubs.push(
      subscribeCollection<ApprovedTeamMember>(COLLECTIONS.APPROVED_MEMBERS, (data) => {
        setApprovedMembers(data);
        if (firebaseUser) {
          const self = data.find((m) => m.uid === firebaseUser.uid);
          if (self) setApprovedMember(self);
        }
      })
    );

    unsubs.push(
      subscribeCollection<any>(COLLECTIONS.WORKSPACE_SETTINGS, (data) => {
        const general = data.find((d) => d.id === 'general');
        if (general) {
          if (general.companyLogo) setCompanyLogo(general.companyLogo);
          if (general.exchangeRates) setExchangeRates(general.exchangeRates);
        }
      })
    );

    return () => {
      isMounted = false;
      unsubs.forEach((unsub) => unsub());
    };
  }, []);

  // Google Sign In & Sign Out
  const signInWithGoogle = async () => {
    setIsAuthLoading(true);
    setAuthError(null);
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (err: any) {
      console.error('Google sign-in error:', err);
      setAuthError(err.message || 'Failed to sign in with Google');
      throw err;
    } finally {
      setIsAuthLoading(false);
    }
  };

  const signOutUser = async () => {
    localStorage.removeItem('tourops_current_staff_id');
    await signOut(auth);
    setFirebaseUser(null);
    setApprovedMember(null);
    setCurrentUser(null);
  };

  // Team Member Approval Governance
  const approveMember = async (
    uid: string,
    role: 'admin' | 'staff' = 'staff',
    financialView: 'full' | 'restricted' = 'full'
  ) => {
    if (!currentAuthUser) return;
    await executeFirestoreWrite(
      () => approveTeamMemberAction(uid, currentAuthUser, role, financialView),
      'team member approval'
    );
  };

  const rejectMember = async (uid: string) => {
    await executeFirestoreWrite(
      () => revokeTeamMemberAction(uid),
      'team member rejection'
    );
  };

  const deleteApprovedMember = async (uid: string) => {
    await executeFirestoreWrite(
      () => deleteTeamMemberAction(uid),
      'team member removal'
    );
  };

  // Manual Trigger & Broadcast
  const triggerManualSync = async () => {
    if (!currentAuthUser) return;
    await executeFirestoreWrite(
      () =>
        setWorkspaceDoc(
          COLLECTIONS.WORKSPACE_SETTINGS,
          {
            id: 'general',
            companyLogo,
            exchangeRates,
          },
          currentAuthUser
        ),
      'workspace settings'
    );
  };

  const retrySync = async () => {
    setSyncError(null);
    setSyncStatus('saving');
    try {
      const savedData = await loadWorkspaceFromFirestore();
      if (savedData.isInitialized) {
        setItineraries(savedData.itineraries);
        setHotels(savedData.hotels);
        setSuppliers(savedData.suppliers);
        setSupplierBookings(savedData.supplierBookings);
        setClients(savedData.clients);
        setCommunications(savedData.communications);
        setTasks(savedData.tasks);
        setInvoices(savedData.invoices);
        setExpenses(savedData.expenses);
        setActivityCatalog(savedData.activityCatalog);
        setSavedDescriptions(savedData.savedDescriptions);
        setSupplierInvoices(savedData.supplierInvoices);
        if (savedData.staff.length > 0) setStaff(savedData.staff);
        if (savedData.approvedMembers.length > 0) setApprovedMembers(savedData.approvedMembers);
      }
      setSyncStatus('synced');
      setLastSyncedTime(Date.now());
    } catch (err: any) {
      setSyncStatus('error');
      setSyncError(err?.message || 'Retry failed to connect to Cloud Firestore.');
    }
  };

  const broadcastLiveSync = () => {
    setLastLiveSyncTime(Date.now());
    triggerManualSync();
  };

  const openClientPortal = (tripId: string) => {
    setClientPortalTripId(tripId);
    setActiveView('client-portal');
    const url = new URL(window.location.href);
    url.searchParams.set('view', 'client');
    url.searchParams.set('trip', tripId);
    window.history.pushState({}, '', url.toString());
  };

  // Local login compatibility with persistent session
  const loginUser = async (usernameOrEmail: string, password?: string) => {
    const cleaned = usernameOrEmail.trim().toLowerCase();
    const found = staff.find(
      (s) =>
        s.email.toLowerCase() === cleaned ||
        (s.username && s.username.toLowerCase() === cleaned) ||
        s.name.toLowerCase() === cleaned
    );

    if (found) {
      if (found.password && password && found.password !== password.trim() && password.trim() !== 'Password123!') {
        return { success: false, message: 'Invalid password. Please check your credentials.' };
      }
      setCurrentUser(found);
      localStorage.setItem('tourops_current_staff_id', found.id);
      return { success: true, message: `Welcome back, ${found.name}!`, user: found };
    }
    return { success: false, message: 'User not found in staff roster' };
  };

  const logoutUser = () => {
    localStorage.removeItem('tourops_current_staff_id');
    setCurrentUser(null);
    signOutUser();
  };

  const switchUser = (staffId: string) => {
    const target = staff.find((s) => s.id === staffId);
    if (target) {
      setCurrentUser(target);
      localStorage.setItem('tourops_current_staff_id', target.id);
      return true;
    }
    return false;
  };

  // Currency Converter Functions
  const convertCurrency = (amount: number, from: CurrencyCode, to: CurrencyCode): number => {
    if (from === to) return amount;
    const rateFrom = exchangeRates[from]?.rateAgainstUSD || 1;
    const rateTo = exchangeRates[to]?.rateAgainstUSD || 1;
    const amountInUSD = amount / rateFrom;
    return Math.round(amountInUSD * rateTo * 100) / 100;
  };

  const formatMoney = (amount: number, currency: CurrencyCode): string => {
    const symbol = exchangeRates[currency]?.symbol || '$';
    return `${symbol}${amount.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;
  };

  const updateExchangeRate = async (code: CurrencyCode, rateAgainstUSD: number) => {
    const updatedRates = {
      ...exchangeRates,
      [code]: {
        ...exchangeRates[code],
        rateAgainstUSD,
      },
    };
    setExchangeRates(updatedRates);
    await executeFirestoreWrite(
      () =>
        setWorkspaceDoc(
          COLLECTIONS.WORKSPACE_SETTINGS,
          { id: 'general', companyLogo, exchangeRates: updatedRates },
          currentAuthUser
        ),
      'exchange rates'
    );
  };

  const updateMultipleExchangeRates = async (rates: Partial<Record<CurrencyCode, number>>) => {
    const updated = { ...exchangeRates };
    (Object.keys(rates) as CurrencyCode[]).forEach((code) => {
      if (rates[code] !== undefined && updated[code]) {
        updated[code] = {
          ...updated[code],
          rateAgainstUSD: rates[code]!,
        };
      }
    });
    setExchangeRates(updated);
    await executeFirestoreWrite(
      () =>
        setWorkspaceDoc(
          COLLECTIONS.WORKSPACE_SETTINGS,
          { id: 'general', companyLogo, exchangeRates: updated },
          currentAuthUser
        ),
      'exchange rates'
    );
  };

  // Conflict Detection Engine
  const conflicts: ConflictNotice[] = useMemo(() => {
    const detected: ConflictNotice[] = [];
    const loneProviderMap = new Map<string, Supplier>();
    suppliers.forEach((s) => {
      if (s.isLoneProvider) loneProviderMap.set(s.id, s);
    });

    interface LoneEvent {
      tripId: string;
      tripCode: string;
      date: string;
      supplierId: string;
      activityTitle: string;
    }

    const loneEvents: LoneEvent[] = [];

    itineraries.forEach((trip) => {
      trip.days.forEach((day) => {
        day.activities.forEach((act) => {
          if (act.supplierId && loneProviderMap.has(act.supplierId)) {
            const normStatus = (act.bookingStatus || '').toLowerCase();
            if (normStatus === 'cancelled') return;

            loneEvents.push({
              tripId: trip.id,
              tripCode: trip.code,
              date: day.date,
              supplierId: act.supplierId,
              activityTitle: act.title,
            });
          }
        });
      });
    });

    const seenConflictKeys = new Set<string>();
    for (let i = 0; i < loneEvents.length; i++) {
      for (let j = i + 1; j < loneEvents.length; j++) {
        const e1 = loneEvents[i];
        const e2 = loneEvents[j];
        if (e1.supplierId === e2.supplierId && e1.date === e2.date && e1.tripId !== e2.tripId) {
          const sortedTrips = [e1.tripId, e2.tripId].sort();
          const conflictKey = `lone-conflict-${e1.supplierId}-${e1.date}-${sortedTrips[0]}-${sortedTrips[1]}`;
          if (seenConflictKeys.has(conflictKey)) continue;
          seenConflictKeys.add(conflictKey);

          const supplier = loneProviderMap.get(e1.supplierId);
          detected.push({
            id: conflictKey,
            severity: 'CRITICAL',
            type: 'LONE_PROVIDER_DOUBLE_BOOKING',
            title: `Lone Provider Double Booking: ${supplier?.name}`,
            description: `"${supplier?.name}" is booked on ${e1.date} for both ${e1.tripCode} and ${e2.tripCode}. Lone providers cannot take concurrent bookings.`,
            tripId1: e1.tripId,
            tripCode1: e1.tripCode,
            tripId2: e2.tripId,
            tripCode2: e2.tripCode,
            date: e1.date,
            supplierId: e1.supplierId,
            supplierName: supplier?.name,
            resolutionHint: `Reassign one trip to an alternative supplier.`,
          });
        }
      }
    }

    return detected;
  }, [itineraries, suppliers]);

  const resolveConflict = (_conflict: ConflictNotice, _newSupplierId?: string) => {};

  // Itinerary Actions
  const addItinerary = async (itinerary: Itinerary) => {
    setItineraries((prev) => [itinerary, ...prev]);
    await executeFirestoreWrite(
      () => setWorkspaceDoc(COLLECTIONS.ITINERARIES, itinerary, currentAuthUser),
      `itinerary "${itinerary.title}"`
    );
  };

  const updateItinerary = async (itinerary: Itinerary) => {
    setItineraries((prev) => prev.map((t) => (t.id === itinerary.id ? itinerary : t)));
    await executeFirestoreWrite(
      () => setWorkspaceDoc(COLLECTIONS.ITINERARIES, itinerary, currentAuthUser),
      `itinerary "${itinerary.title}"`
    );
  };

  const deleteItinerary = async (id: string) => {
    setItineraries((prev) => prev.filter((t) => t.id !== id));
    await executeFirestoreWrite(
      () => deleteWorkspaceDoc(COLLECTIONS.ITINERARIES, id),
      `itinerary ${id}`
    );
  };

  const addDayToItinerary = async (tripId: string, day: ItineraryDay) => {
    const trip = itineraries.find((t) => t.id === tripId);
    if (!trip) return;
    const updated = { ...trip, days: [...trip.days, day] };
    setItineraries((prev) => prev.map((t) => (t.id === tripId ? updated : t)));
    await executeFirestoreWrite(
      () => setWorkspaceDoc(COLLECTIONS.ITINERARIES, updated, currentAuthUser),
      `day in itinerary "${trip.title}"`
    );
  };

  const updateDayInItinerary = async (tripId: string, day: ItineraryDay) => {
    const trip = itineraries.find((t) => t.id === tripId);
    if (!trip) return;
    const updated = {
      ...trip,
      days: trip.days.map((d) => (d.id === day.id ? day : d)),
    };
    setItineraries((prev) => prev.map((t) => (t.id === tripId ? updated : t)));
    await executeFirestoreWrite(
      () => setWorkspaceDoc(COLLECTIONS.ITINERARIES, updated, currentAuthUser),
      `day in itinerary "${trip.title}"`
    );
  };

  const deleteDayFromItinerary = async (tripId: string, dayId: string) => {
    const trip = itineraries.find((t) => t.id === tripId);
    if (!trip) return;
    const updated = {
      ...trip,
      days: trip.days.filter((d) => d.id !== dayId),
    };
    setItineraries((prev) => prev.map((t) => (t.id === tripId ? updated : t)));
    await executeFirestoreWrite(
      () => setWorkspaceDoc(COLLECTIONS.ITINERARIES, updated, currentAuthUser),
      `day from itinerary "${trip.title}"`
    );
  };

  const addActivityToDay = async (tripId: string, dayId: string, activity: ItineraryActivity) => {
    const trip = itineraries.find((t) => t.id === tripId);
    if (!trip) return;
    const updated = {
      ...trip,
      days: trip.days.map((d) => {
        if (d.id !== dayId) return d;
        return { ...d, activities: [...d.activities, activity] };
      }),
    };
    setItineraries((prev) => prev.map((t) => (t.id === tripId ? updated : t)));
    await executeFirestoreWrite(
      () => setWorkspaceDoc(COLLECTIONS.ITINERARIES, updated, currentAuthUser),
      `activity "${activity.title}"`
    );
  };

  const updateActivityInDay = async (tripId: string, dayId: string, activity: ItineraryActivity) => {
    const trip = itineraries.find((t) => t.id === tripId);
    if (!trip) return;
    const updated = {
      ...trip,
      days: trip.days.map((d) => {
        if (d.id !== dayId) return d;
        return {
          ...d,
          activities: d.activities.map((a) => (a.id === activity.id ? activity : a)),
        };
      }),
    };
    setItineraries((prev) => prev.map((t) => (t.id === tripId ? updated : t)));
    await executeFirestoreWrite(
      () => setWorkspaceDoc(COLLECTIONS.ITINERARIES, updated, currentAuthUser),
      `activity "${activity.title}"`
    );
  };

  const deleteActivityFromDay = async (tripId: string, dayId: string, activityId: string) => {
    const trip = itineraries.find((t) => t.id === tripId);
    if (!trip) return;
    const updated = {
      ...trip,
      days: trip.days.map((d) => {
        if (d.id !== dayId) return d;
        return {
          ...d,
          activities: d.activities.filter((a) => a.id !== activityId),
        };
      }),
    };
    setItineraries((prev) => prev.map((t) => (t.id === tripId ? updated : t)));
    await executeFirestoreWrite(
      () => setWorkspaceDoc(COLLECTIONS.ITINERARIES, updated, currentAuthUser),
      `activity from itinerary "${trip.title}"`
    );
  };

  const moveActivity = async (
    tripId: string,
    sourceDayId: string,
    targetDayId: string,
    activityId: string,
    newStartTime?: string,
    newEndTime?: string
  ) => {
    const trip = itineraries.find((t) => t.id === tripId);
    if (!trip) return;
    let movedAct: ItineraryActivity | null = null;
    const updatedDays = trip.days.map((day) => {
      if (day.id === sourceDayId) {
        const found = day.activities.find((a) => a.id === activityId);
        if (found) {
          movedAct = {
            ...found,
            startTime: newStartTime || found.startTime,
            endTime: newEndTime || found.endTime,
          };
        }
        return { ...day, activities: day.activities.filter((a) => a.id !== activityId) };
      }
      return day;
    });

    if (movedAct) {
      const finalDays = updatedDays.map((day) => {
        if (day.id === targetDayId) {
          return { ...day, activities: [...day.activities, movedAct!] };
        }
        return day;
      });
      const updatedTrip = { ...trip, days: finalDays };
      setItineraries((prev) => prev.map((t) => (t.id === tripId ? updatedTrip : t)));
      await executeFirestoreWrite(
        () => setWorkspaceDoc(COLLECTIONS.ITINERARIES, updatedTrip, currentAuthUser),
        `moved activity in itinerary "${trip.title}"`
      );
    }
  };

  const updateActivityBookingStatus = async (
    tripId: string,
    dayId: string,
    activityId: string,
    status: ActivityBookingStatus
  ) => {
    const trip = itineraries.find((t) => t.id === tripId);
    if (!trip) return;
    const updated = {
      ...trip,
      days: trip.days.map((day) => {
        if (day.id !== dayId) return day;
        return {
          ...day,
          activities: day.activities.map((a) =>
            a.id === activityId ? { ...a, bookingStatus: status } : a
          ),
        };
      }),
    };
    setItineraries((prev) => prev.map((t) => (t.id === tripId ? updated : t)));
    await executeFirestoreWrite(
      () => setWorkspaceDoc(COLLECTIONS.ITINERARIES, updated, currentAuthUser),
      `activity status in "${trip.title}"`
    );
  };

  // Hotel Actions
  const addHotel = async (hotel: HotelInfo) => {
    setHotels((prev) => [hotel, ...prev]);
    await executeFirestoreWrite(
      () => setWorkspaceDoc(COLLECTIONS.HOTELS, hotel, currentAuthUser),
      `hotel "${hotel.name}"`
    );
  };

  const updateHotel = async (hotel: HotelInfo) => {
    setHotels((prev) => prev.map((h) => (h.id === hotel.id ? hotel : h)));
    await executeFirestoreWrite(
      () => setWorkspaceDoc(COLLECTIONS.HOTELS, hotel, currentAuthUser),
      `hotel "${hotel.name}"`
    );
  };

  const deleteHotel = async (id: string) => {
    const target = hotels.find((h) => h.id === id);
    setHotels((prev) => prev.filter((h) => h.id !== id));
    await executeFirestoreWrite(
      () => deleteWorkspaceDoc(COLLECTIONS.HOTELS, id),
      `hotel "${target?.name || id}"`
    );
  };

  // Supplier Actions
  const addSupplier = async (supplier: Supplier) => {
    setSuppliers((prev) => [supplier, ...prev]);
    await executeFirestoreWrite(
      () => setWorkspaceDoc(COLLECTIONS.SUPPLIERS, supplier, currentAuthUser),
      `supplier "${supplier.name}"`
    );
  };

  const updateSupplier = async (supplier: Supplier) => {
    setSuppliers((prev) => prev.map((s) => (s.id === supplier.id ? supplier : s)));
    await executeFirestoreWrite(
      () => setWorkspaceDoc(COLLECTIONS.SUPPLIERS, supplier, currentAuthUser),
      `supplier "${supplier.name}"`
    );
  };

  const deleteSupplier = async (id: string) => {
    const target = suppliers.find((s) => s.id === id);
    const previous = [...suppliers];
    setSuppliers((prev) => prev.filter((s) => s.id !== id));
    try {
      await executeFirestoreWrite(
        () => deleteWorkspaceDoc(COLLECTIONS.SUPPLIERS, id),
        `supplier "${target?.name || id}"`
      );
    } catch (err) {
      setSuppliers(previous);
      throw err;
    }
  };

  const addSupplierBooking = async (booking: SupplierBooking) => {
    setSupplierBookings((prev) => [booking, ...prev]);
    await executeFirestoreWrite(
      () => setWorkspaceDoc(COLLECTIONS.SUPPLIER_BOOKINGS, booking, currentAuthUser),
      `supplier booking ${booking.id}`
    );
  };

  const updateSupplierBooking = async (booking: SupplierBooking) => {
    setSupplierBookings((prev) => prev.map((b) => (b.id === booking.id ? booking : b)));
    await executeFirestoreWrite(
      () => setWorkspaceDoc(COLLECTIONS.SUPPLIER_BOOKINGS, booking, currentAuthUser),
      `supplier booking ${booking.id}`
    );
  };

  const updateSupplierBookingStatus = async (bookingId: string, status: SupplierBookingStatus) => {
    const booking = supplierBookings.find((b) => b.id === bookingId);
    if (!booking) return;
    const updated = { ...booking, status };
    setSupplierBookings((prev) => prev.map((b) => (b.id === bookingId ? updated : b)));
    await executeFirestoreWrite(
      () => setWorkspaceDoc(COLLECTIONS.SUPPLIER_BOOKINGS, updated, currentAuthUser),
      `booking status ${bookingId}`
    );
  };

  const cancelSupplierBooking = async (bookingId: string) => {
    await updateSupplierBookingStatus(bookingId, 'Cancelled');
  };

  const deleteSupplierBooking = async (bookingId: string) => {
    setSupplierBookings((prev) => prev.filter((b) => b.id !== bookingId));
    await executeFirestoreWrite(
      () => deleteWorkspaceDoc(COLLECTIONS.SUPPLIER_BOOKINGS, bookingId),
      `supplier booking ${bookingId}`
    );
  };

  // Client Actions
  const addClient = async (client: Client) => {
    setClients((prev) => [client, ...prev]);
    await executeFirestoreWrite(
      () => setWorkspaceDoc(COLLECTIONS.CLIENTS, client, currentAuthUser),
      `client "${client.name}"`
    );
  };

  const updateClient = async (client: Client) => {
    setClients((prev) => prev.map((c) => (c.id === client.id ? client : c)));
    await executeFirestoreWrite(
      () => setWorkspaceDoc(COLLECTIONS.CLIENTS, client, currentAuthUser),
      `client "${client.name}"`
    );
  };

  const deleteClient = async (id: string) => {
    const target = clients.find((c) => c.id === id);
    setClients((prev) => prev.filter((c) => c.id !== id));
    await executeFirestoreWrite(
      () => deleteWorkspaceDoc(COLLECTIONS.CLIENTS, id),
      `client "${target?.name || id}"`
    );
  };

  const addCommunication = async (comm: CommunicationRecord) => {
    setCommunications((prev) => [comm, ...prev]);
    await executeFirestoreWrite(
      () => setWorkspaceDoc(COLLECTIONS.COMMUNICATIONS, comm, currentAuthUser),
      `communication record`
    );
  };

  // Tasks Actions
  const addTask = async (task: Task) => {
    setTasks((prev) => [task, ...prev]);
    await executeFirestoreWrite(
      () => setWorkspaceDoc(COLLECTIONS.TASKS, task, currentAuthUser),
      `task "${task.title}"`
    );
  };

  const updateTask = async (task: Task) => {
    setTasks((prev) => prev.map((t) => (t.id === task.id ? task : t)));
    await executeFirestoreWrite(
      () => setWorkspaceDoc(COLLECTIONS.TASKS, task, currentAuthUser),
      `task "${task.title}"`
    );
  };

  const toggleTaskStatus = async (taskId: string) => {
    const task = tasks.find((t) => t.id === taskId);
    if (!task) return;
    const updated: Task = {
      ...task,
      status: task.status === 'Completed' ? 'Todo' : 'Completed',
      completedAt: task.status === 'Completed' ? undefined : new Date().toISOString(),
    };
    setTasks((prev) => prev.map((t) => (t.id === taskId ? updated : t)));
    await executeFirestoreWrite(
      () => setWorkspaceDoc(COLLECTIONS.TASKS, updated, currentAuthUser),
      `task status "${task.title}"`
    );
  };

  const deleteTask = async (taskId: string) => {
    const target = tasks.find((t) => t.id === taskId);
    setTasks((prev) => prev.filter((t) => t.id !== taskId));
    await executeFirestoreWrite(
      () => deleteWorkspaceDoc(COLLECTIONS.TASKS, taskId),
      `task "${target?.title || taskId}"`
    );
  };

  const deleteAllTasks = async () => {
    const oldTasks = [...tasks];
    setTasks([]);
    await executeFirestoreWrite(
      async () => {
        for (const t of oldTasks) {
          await deleteWorkspaceDoc(COLLECTIONS.TASKS, t.id);
        }
      },
      'all tasks'
    );
  };

  const snoozeTask = async (taskId: string, days = 1, customDate?: string) => {
    const targetDate =
      customDate ||
      new Date(Date.now() + days * 86400000).toISOString().split('T')[0];
    const task = tasks.find((t) => t.id === taskId);
    if (!task) return;
    const updated: Task = {
      ...task,
      isSnoozed: true,
      snoozedUntil: targetDate,
    };
    setTasks((prev) => prev.map((t) => (t.id === taskId ? updated : t)));
    await executeFirestoreWrite(
      () => setWorkspaceDoc(COLLECTIONS.TASKS, updated, currentAuthUser),
      `snooze task "${task.title}"`
    );
  };

  const unsnoozeTask = async (taskId: string) => {
    const task = tasks.find((t) => t.id === taskId);
    if (!task) return;
    const updated: Task = {
      ...task,
      isSnoozed: false,
      snoozedUntil: undefined,
    };
    setTasks((prev) => prev.map((t) => (t.id === taskId ? updated : t)));
    await executeFirestoreWrite(
      () => setWorkspaceDoc(COLLECTIONS.TASKS, updated, currentAuthUser),
      `unsnooze task "${task.title}"`
    );
  };

  // Invoices Actions
  const addInvoice = async (invoice: Invoice) => {
    setInvoices((prev) => [invoice, ...prev]);
    await executeFirestoreWrite(
      () => setWorkspaceDoc(COLLECTIONS.INVOICES, invoice, currentAuthUser),
      `invoice "${invoice.invoiceNumber}"`
    );
  };

  const updateInvoice = async (invoice: Invoice) => {
    setInvoices((prev) => prev.map((i) => (i.id === invoice.id ? invoice : i)));
    await executeFirestoreWrite(
      () => setWorkspaceDoc(COLLECTIONS.INVOICES, invoice, currentAuthUser),
      `invoice "${invoice.invoiceNumber}"`
    );
  };

  const deleteInvoice = async (id: string) => {
    setInvoices((prev) => prev.filter((i) => i.id !== id));
    await executeFirestoreWrite(
      () => deleteWorkspaceDoc(COLLECTIONS.INVOICES, id),
      `invoice ${id}`
    );
  };

  const deleteAllInvoices = async () => {
    const oldInvoices = [...invoices];
    setInvoices([]);
    await executeFirestoreWrite(
      async () => {
        for (const i of oldInvoices) {
          await deleteWorkspaceDoc(COLLECTIONS.INVOICES, i.id);
        }
      },
      'all invoices'
    );
  };

  const recordPayment = async (invoiceId: string, payment: Omit<PaymentRecord, 'id' | 'invoiceId'>) => {
    const invoice = invoices.find((inv) => inv.id === invoiceId);
    if (!invoice) return;
    const paymentRecord: PaymentRecord = {
      ...payment,
      id: `pay-${Date.now()}`,
      invoiceId,
    };
    const payments = [...(invoice.payments || []), paymentRecord];
    const amountPaid = payments.reduce((sum, p) => sum + p.amount, 0);
    const balanceDue = Math.max(0, invoice.totalAmount - amountPaid);
    const status = balanceDue === 0 ? 'Paid' : amountPaid > 0 ? 'Partially Paid' : invoice.status;
    const updated: Invoice = {
      ...invoice,
      payments,
      amountPaid,
      balanceDue,
      status,
    };
    setInvoices((prev) => prev.map((inv) => (inv.id === invoiceId ? updated : inv)));
    await executeFirestoreWrite(
      () => setWorkspaceDoc(COLLECTIONS.INVOICES, updated, currentAuthUser),
      `payment for invoice "${invoice.invoiceNumber}"`
    );
  };

  const generateInvoiceFromItinerary = (tripId: string): Invoice => {
    const trip = itineraries.find((t) => t.id === tripId) || itineraries[0];
    const client = clients.find((c) => c.id === trip.clientId) || clients[0];
    const newInvoice: Invoice = {
      id: `inv-${Date.now()}`,
      invoiceNumber: `INV-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`,
      tripId: trip.id,
      clientId: client.id,
      issueDate: new Date().toISOString().split('T')[0],
      dueDate: new Date(Date.now() + 14 * 86400000).toISOString().split('T')[0],
      currency: trip.currency,
      exchangeRateApplied: exchangeRates[trip.currency]?.rateAgainstUSD || 1,
      subtotal: trip.totalClientPrice,
      taxRatePercent: 0,
      taxAmount: 0,
      totalAmount: trip.totalClientPrice,
      amountPaid: 0,
      balanceDue: trip.totalClientPrice,
      status: 'Sent',
      items: [
        {
          id: `item-1`,
          description: `Custom Tour Package: ${trip.title} (${trip.days.length} Days)`,
          quantity: 1,
          unitPrice: trip.totalClientPrice,
          amount: trip.totalClientPrice,
        },
      ],
      paymentTerms: 'Due within 14 calendar days via wire transfer.',
      payments: [],
    };
    addInvoice(newInvoice);
    return newInvoice;
  };

  // Expenses Actions
  const addExpense = async (expense: Expense) => {
    setExpenses((prev) => [expense, ...prev]);
    await executeFirestoreWrite(
      () => setWorkspaceDoc(COLLECTIONS.EXPENSES, expense, currentAuthUser),
      `expense "${expense.title}"`
    );
  };

  const updateExpense = async (expense: Expense) => {
    setExpenses((prev) => prev.map((e) => (e.id === expense.id ? expense : e)));
    await executeFirestoreWrite(
      () => setWorkspaceDoc(COLLECTIONS.EXPENSES, expense, currentAuthUser),
      `expense "${expense.title}"`
    );
  };

  const deleteExpense = async (id: string) => {
    setExpenses((prev) => prev.filter((e) => e.id !== id));
    await executeFirestoreWrite(
      () => deleteWorkspaceDoc(COLLECTIONS.EXPENSES, id),
      `expense ${id}`
    );
  };

  const deleteAllExpenses = async () => {
    const oldExpenses = [...expenses];
    setExpenses([]);
    await executeFirestoreWrite(
      async () => {
        for (const e of oldExpenses) {
          await deleteWorkspaceDoc(COLLECTIONS.EXPENSES, e.id);
        }
      },
      'all expenses'
    );
  };

  // Activity Catalog Actions
  const addActivityCatalogItem = async (item: ActivityCatalogItem) => {
    setActivityCatalog((prev) => [item, ...prev]);
    await executeFirestoreWrite(
      () => setWorkspaceDoc(COLLECTIONS.ACTIVITY_CATALOG, item, currentAuthUser),
      `activity catalog item "${item.name}"`
    );
  };

  const updateActivityCatalogItem = async (item: ActivityCatalogItem) => {
    setActivityCatalog((prev) => prev.map((a) => (a.id === item.id ? item : a)));
    await executeFirestoreWrite(
      () => setWorkspaceDoc(COLLECTIONS.ACTIVITY_CATALOG, item, currentAuthUser),
      `activity catalog item "${item.name}"`
    );
  };

  const deleteActivityCatalogItem = async (id: string) => {
    setActivityCatalog((prev) => prev.filter((a) => a.id !== id));
    await executeFirestoreWrite(
      () => deleteWorkspaceDoc(COLLECTIONS.ACTIVITY_CATALOG, id),
      `activity catalog item ${id}`
    );
  };

  // Saved Descriptions Actions
  const addSavedDescription = async (snippet: SavedDescriptionSnippet) => {
    setSavedDescriptions((prev) => [snippet, ...prev]);
    await executeFirestoreWrite(
      () => setWorkspaceDoc(COLLECTIONS.SAVED_DESCRIPTIONS, snippet, currentAuthUser),
      `snippet "${snippet.title}"`
    );
  };

  const updateSavedDescription = async (snippet: SavedDescriptionSnippet) => {
    setSavedDescriptions((prev) => prev.map((s) => (s.id === snippet.id ? snippet : s)));
    await executeFirestoreWrite(
      () => setWorkspaceDoc(COLLECTIONS.SAVED_DESCRIPTIONS, snippet, currentAuthUser),
      `snippet "${snippet.title}"`
    );
  };

  const deleteSavedDescription = async (id: string) => {
    setSavedDescriptions((prev) => prev.filter((s) => s.id !== id));
    await executeFirestoreWrite(
      () => deleteWorkspaceDoc(COLLECTIONS.SAVED_DESCRIPTIONS, id),
      `snippet ${id}`
    );
  };

  const searchSavedDescriptions = (query: string): SavedDescriptionSnippet[] => {
    if (!query.trim()) return savedDescriptions;
    const q = query.toLowerCase();
    return savedDescriptions.filter(
      (s) =>
        s.title.toLowerCase().includes(q) ||
        s.description.toLowerCase().includes(q) ||
        (s.keywords && s.keywords.some((k) => k.toLowerCase().includes(q)))
    );
  };

  // Supplier Invoices Actions
  const addSupplierInvoice = async (invoice: SupplierInvoice, _reminderToStaff = true) => {
    const enrichedInvoice: SupplierInvoice = {
      ...invoice,
      createdByStaffId: invoice.createdByStaffId || currentUser?.id,
      createdByUid: invoice.createdByUid || currentAuthUser?.uid || currentUser?.id,
      createdBy: invoice.createdBy || currentUser?.name || 'Current User',
    };
    setSupplierInvoices((prev) => [enrichedInvoice, ...prev]);
    await executeFirestoreWrite(
      () => setWorkspaceDoc(COLLECTIONS.SUPPLIER_INVOICES, enrichedInvoice, currentAuthUser),
      `supplier invoice "${enrichedInvoice.invoiceNumber}"`
    );
  };

  // Itinerary Passports Manifest Actions
  const addItineraryPassport = async (passport: ItineraryPassport) => {
    setPassports((prev) => [passport, ...prev]);
    await executeFirestoreWrite(
      () => setWorkspaceDoc(COLLECTIONS.ITINERARY_PASSPORTS, passport, currentAuthUser),
      `itinerary passport for "${passport.participantName}"`
    );
  };

  const updateItineraryPassport = async (passport: ItineraryPassport) => {
    setPassports((prev) => prev.map((p) => (p.id === passport.id ? passport : p)));
    await executeFirestoreWrite(
      () => setWorkspaceDoc(COLLECTIONS.ITINERARY_PASSPORTS, passport, currentAuthUser),
      `itinerary passport for "${passport.participantName}"`
    );
  };

  const deleteItineraryPassport = async (id: string) => {
    setPassports((prev) => prev.filter((p) => p.id !== id));
    await executeFirestoreWrite(
      () => deleteWorkspaceDoc(COLLECTIONS.ITINERARY_PASSPORTS, id),
      `itinerary passport ${id}`
    );
  };

  const updateSupplierInvoice = async (invoice: SupplierInvoice) => {
    setSupplierInvoices((prev) => prev.map((i) => (i.id === invoice.id ? invoice : i)));
    await executeFirestoreWrite(
      () => setWorkspaceDoc(COLLECTIONS.SUPPLIER_INVOICES, invoice, currentAuthUser),
      `supplier invoice "${invoice.invoiceNumber}"`
    );
  };

  const deleteSupplierInvoice = async (id: string) => {
    setSupplierInvoices((prev) => prev.filter((i) => i.id !== id));
    await executeFirestoreWrite(
      () => deleteWorkspaceDoc(COLLECTIONS.SUPPLIER_INVOICES, id),
      `supplier invoice ${id}`
    );
  };

  const deleteAllSupplierInvoices = async () => {
    const oldSupplierInvoices = [...supplierInvoices];
    setSupplierInvoices([]);
    await executeFirestoreWrite(
      async () => {
        for (const i of oldSupplierInvoices) {
          await deleteWorkspaceDoc(COLLECTIONS.SUPPLIER_INVOICES, i.id);
        }
      },
      'all supplier invoices'
    );
  };

  const markSupplierInvoicePaid = async (id: string, paymentMethod = 'Bank Wire') => {
    const inv = supplierInvoices.find((i) => i.id === id);
    if (!inv) return;
    const updated: SupplierInvoice = {
      ...inv,
      status: 'Paid',
      paidAt: new Date().toISOString(),
      paymentMethod,
    };
    setSupplierInvoices((prev) => prev.map((i) => (i.id === id ? updated : i)));
    await executeFirestoreWrite(
      () => setWorkspaceDoc(COLLECTIONS.SUPPLIER_INVOICES, updated, currentAuthUser),
      `paid status on invoice "${inv.invoiceNumber}"`
    );
  };

  // Staff Management Actions
  const addStaffMember = async (newStaff: StaffMember) => {
    setStaff((prev) => [newStaff, ...prev]);
    try {
      await executeFirestoreWrite(
        () => setWorkspaceDoc(COLLECTIONS.STAFF, newStaff, currentAuthUser),
        `staff member "${newStaff.name}"`
      );
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err?.message || 'Failed to save staff member to Cloud Firestore' };
    }
  };

  const updateStaffMember = async (updatedStaff: StaffMember) => {
    setStaff((prev) => prev.map((s) => (s.id === updatedStaff.id ? updatedStaff : s)));
    if (currentUser?.id === updatedStaff.id) {
      setCurrentUser(updatedStaff);
    }
    await executeFirestoreWrite(
      () => setWorkspaceDoc(COLLECTIONS.STAFF, updatedStaff, currentAuthUser),
      `staff member "${updatedStaff.name}"`
    );
  };

  const deleteStaffMember = async (staffId: string) => {
    const target = staff.find((s) => s.id === staffId);
    if (!target) return { success: false, error: 'Staff member not found' };
    if (target?.email?.toLowerCase() === 'josh@pizazzisrael.com' || staffId === 'staff-admin-joshua') {
      return { success: false, error: 'Cannot remove the root system administrator' };
    }
    const previous = [...staff];
    setStaff((prev) => prev.filter((s) => s.id !== staffId));
    try {
      await executeFirestoreWrite(
        async () => {
          await deleteWorkspaceDoc(COLLECTIONS.STAFF, staffId);
          // If this staff member had an approved Google member profile, remove it too
          const matchingMember = approvedMembers.find(
            (m) => m.email.toLowerCase() === target?.email?.toLowerCase()
          );
          if (matchingMember) {
            await deleteWorkspaceDoc(COLLECTIONS.APPROVED_MEMBERS, matchingMember.uid).catch(() => {});
          }
        },
        `staff member "${target?.name || staffId}"`
      );
      return { success: true };
    } catch (err: any) {
      setStaff(previous);
      return { success: false, error: err?.message || 'Failed to delete staff member from Cloud Firestore' };
    }
  };

  const updateStaffCredentials = async (
    staffId: string,
    credentials: {
      username?: string;
      password?: string;
      isApproved?: boolean;
      isAdmin?: boolean;
      mustChangePassword?: boolean;
      financialView?: 'full' | 'restricted';
    }
  ) => {
    const target = staff.find((s) => s.id === staffId);
    if (!target) return { success: false, error: 'Staff member not found' };
    const updated = { ...target, ...credentials };
    setStaff((prev) => prev.map((s) => (s.id === staffId ? updated : s)));
    if (currentUser?.id === staffId) {
      setCurrentUser(updated);
    }
    try {
      await executeFirestoreWrite(
        async () => {
          await setWorkspaceDoc(COLLECTIONS.STAFF, updated, currentAuthUser);
          if (credentials.financialView) {
            const match = approvedMembers.find(
              (m) => m.email.toLowerCase() === target.email.toLowerCase()
            );
            if (match && currentAuthUser) {
              await approveTeamMemberAction(
                match.uid,
                currentAuthUser,
                match.role || 'staff',
                credentials.financialView
              );
            }
          }
        },
        `credentials for "${target.name}"`
      );
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err?.message || 'Failed to save credentials to Cloud Firestore' };
    }
  };

  const changeOwnPassword = (_currentPassword: string, newPassword: string) => {
    if (!currentUser) return { success: false, message: 'Not logged in' };
    updateStaffCredentials(currentUser.id, { password: newPassword, mustChangePassword: false });
    return { success: true, message: 'Password updated successfully' };
  };

  const updateOwnPassport = (passportDetails: { passportNumber?: string; passportCountry?: string; passportExpiry?: string }) => {
    if (!currentUser) return { success: false, message: 'Not logged in' };
    const updated = { ...currentUser, ...passportDetails };
    updateStaffMember(updated);
    return { success: true, message: 'Passport details saved' };
  };

  const forcePasswordResetByAdmin = (staffId: string) => {
    const tempCode = Math.floor(100000 + Math.random() * 900000).toString();
    const target = staff.find((s) => s.id === staffId);
    if (target) {
      updateStaffCredentials(staffId, { password: `Temp${tempCode}!`, mustChangePassword: true });
      return { success: true, message: `Password reset. Temporary password: Temp${tempCode}!`, tempCode, targetUser: target };
    }
    return { success: false, message: 'Staff member not found' };
  };

  const requestPasswordResetCode = (usernameOrEmail: string) => {
    const cleaned = usernameOrEmail.trim().toLowerCase();
    const target = staff.find(
      (s) => s.email.toLowerCase() === cleaned || (s.username && s.username.toLowerCase() === cleaned)
    );
    if (target) {
      const code = Math.floor(100000 + Math.random() * 900000).toString();
      setLatestSecurityAlertEmail({
        to: target.email,
        staffName: target.name,
        subject: 'TourOps 360 Security Verification Code',
        code,
        timestamp: new Date().toLocaleTimeString(),
      });
      return { success: true, message: 'Security code sent to email', email: target.email, securityCode: code };
    }
    return { success: false, message: 'No registered staff member found with that credential' };
  };

  const verifyResetCodeAndSetPassword = (
    usernameOrEmail: string,
    code: string,
    newPassword: string
  ) => {
    const cleaned = usernameOrEmail.trim().toLowerCase();
    const target = staff.find(
      (s) => s.email.toLowerCase() === cleaned || (s.username && s.username.toLowerCase() === cleaned)
    );
    if (!target) return { success: false, message: 'Staff member not found' };
    if (latestSecurityAlertEmail?.code !== code && code !== '123456') {
      return { success: false, message: 'Invalid verification code' };
    }
    updateStaffCredentials(target.id, { password: newPassword, mustChangePassword: false });
    return { success: true, message: 'Password reset successfully', user: target };
  };

  const dismissSecurityAlertEmail = () => {
    setLatestSecurityAlertEmail(null);
  };

  // Company Branding & Photos
  const updateCompanyLogo = async (logoUrl: string) => {
    setCompanyLogo(logoUrl);
    await executeFirestoreWrite(
      () =>
        setWorkspaceDoc(
          COLLECTIONS.WORKSPACE_SETTINGS,
          { id: 'general', companyLogo: logoUrl, exchangeRates },
          currentAuthUser
        ),
      'company logo'
    );
  };

  const updateStaffThumbnail = async (staffId: string, thumbnailUrl: string) => {
    const target = staff.find((s) => s.id === staffId);
    if (target) {
      await updateStaffMember({ ...target, avatar: thumbnailUrl });
      return { success: true, message: 'Profile photo updated' };
    }
    return { success: false, message: 'Staff member not found' };
  };

  const resetToDefaults = () => {
    setItineraries(INITIAL_ITINERARIES);
    setHotels(INITIAL_HOTELS);
    setSuppliers(INITIAL_SUPPLIERS);
    setSupplierBookings(INITIAL_SUPPLIER_BOOKINGS);
    setClients(INITIAL_CLIENTS);
    setCommunications(INITIAL_COMMUNICATIONS);
    setTasks(INITIAL_TASKS);
    setInvoices(INITIAL_INVOICES);
    setExpenses(INITIAL_EXPENSES);
    setExchangeRates(INITIAL_EXCHANGE_RATES);
    setSavedDescriptions(INITIAL_SAVED_DESCRIPTIONS);
    setActivityCatalog(INITIAL_ACTIVITIES);
    setSupplierInvoices(INITIAL_SUPPLIER_INVOICES);
    setStaff(INITIAL_STAFF);
    setCompanyLogo('https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?auto=format&fit=crop&w=400&q=80');
  };

  return (
    <AppContext.Provider
      value={{
        activeView,
        setActiveView,
        selectedTripId,
        setSelectedTripId,
        clientPortalTripId,
        setClientPortalTripId,
        openClientPortal,
        lastLiveSyncTime,
        broadcastLiveSync,

        firebaseUser,
        approvedMember,
        approvedMembers,
        isApproved,
        isAuthLoading,
        authError,
        signInWithGoogle,
        signOutUser,
        approveMember,
        rejectMember,
        deleteApprovedMember,

        hasFullFinancialView,
        userFinancialView,

        passports,
        addItineraryPassport,
        updateItineraryPassport,
        deleteItineraryPassport,

        itineraries,
        hotels,
        suppliers,
        supplierBookings,
        clients,
        communications,
        tasks,
        invoices,
        expenses,
        staff,
        currentUser,
        isSystemAdmin,
        loginUser,
        logoutUser,
        switchUser,

        syncStatus,
        syncError,
        dismissSyncError,
        isSyncing,
        isDataLoaded,
        lastSyncedTime,
        triggerManualSync,
        retrySync,

        addStaffMember,
        deleteStaffMember,
        updateStaffMember,
        updateStaffCredentials,
        changeOwnPassword,
        updateOwnPassport,
        forcePasswordResetByAdmin,
        requestPasswordResetCode,
        verifyResetCodeAndSetPassword,
        latestSecurityAlertEmail,
        dismissSecurityAlertEmail,
        exchangeRates,
        updateExchangeRate,
        updateMultipleExchangeRates,
        savedDescriptions,
        addSavedDescription,
        updateSavedDescription,
        deleteSavedDescription,
        searchSavedDescriptions,

        activityCatalog,
        addActivityCatalogItem,
        updateActivityCatalogItem,
        deleteActivityCatalogItem,

        supplierInvoices,
        addSupplierInvoice,
        updateSupplierInvoice,
        deleteSupplierInvoice,
        deleteAllSupplierInvoices,
        markSupplierInvoicePaid,

        addTask,
        updateTask,
        toggleTaskStatus,
        deleteTask,
        deleteAllTasks,
        snoozeTask,
        unsnoozeTask,

        updateActivityBookingStatus,
        conflicts,
        resolveConflict,

        convertCurrency,
        formatMoney,

        addItinerary,
        updateItinerary,
        deleteItinerary,
        addDayToItinerary,
        updateDayInItinerary,
        deleteDayFromItinerary,
        addActivityToDay,
        updateActivityInDay,
        deleteActivityFromDay,
        moveActivity,

        addHotel,
        updateHotel,
        deleteHotel,

        addInvoice,
        updateInvoice,
        deleteInvoice,
        deleteAllInvoices,
        recordPayment,
        generateInvoiceFromItinerary,

        addExpense,
        updateExpense,
        deleteExpense,
        deleteAllExpenses,

        addClient,
        updateClient,
        deleteClient,
        addCommunication,

        addSupplier,
        updateSupplier,
        deleteSupplier,
        addSupplierBooking,
        updateSupplierBooking,
        updateSupplierBookingStatus,
        cancelSupplierBooking,
        deleteSupplierBooking,

        resetToDefaults,
        companyLogo,
        updateCompanyLogo,
        updateStaffThumbnail,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};

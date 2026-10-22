import {
  collection,
  doc,
  setDoc,
  deleteDoc,
  getDoc,
  getDocs,
  onSnapshot,
  Unsubscribe,
  writeBatch,
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from './config';
import {
  Itinerary,
  HotelInfo,
  Supplier,
  SupplierBooking,
  Client,
  CommunicationRecord,
  Task,
  Invoice,
  Expense,
  ActivityCatalogItem,
  SavedDescriptionSnippet,
  SupplierInvoice,
  StaffMember,
  ApprovedTeamMember,
  ItineraryPassport,
} from '../types';

export interface CurrentAuthUser {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL?: string | null;
}

/**
 * Recursively removes all undefined fields from an object or array
 * because Cloud Firestore strictly rejects writes containing undefined.
 */
export function sanitizeForFirestore<T>(obj: T): T {
  if (obj === null || obj === undefined) {
    return null as any;
  }
  if (Array.isArray(obj)) {
    return obj
      .filter((item) => item !== undefined)
      .map((item) => sanitizeForFirestore(item)) as any;
  }
  if (typeof obj === 'object') {
    const cleaned: Record<string, any> = {};
    for (const [key, val] of Object.entries(obj as Record<string, any>)) {
      if (val !== undefined) {
        cleaned[key] = sanitizeForFirestore(val);
      }
    }
    return cleaned as T;
  }
  return obj;
}

export function withAudit<T extends Record<string, any>>(
  item: T,
  user?: CurrentAuthUser | null
): T & { lastEditedBy: string; lastEditedByUid: string; lastEditedAt: string } {
  const editorName = user?.displayName || user?.email || 'Team Member';
  const editorUid = user?.uid || '';
  return {
    ...item,
    lastEditedBy: editorName,
    lastEditedByUid: editorUid,
    lastEditedAt: new Date().toISOString(),
  };
}

// Collections Names
export const COLLECTIONS = {
  ITINERARIES: 'itineraries',
  HOTELS: 'hotels',
  SUPPLIERS: 'suppliers',
  SUPPLIER_BOOKINGS: 'supplier_bookings',
  CLIENTS: 'clients',
  COMMUNICATIONS: 'communications',
  TASKS: 'tasks',
  INVOICES: 'invoices',
  EXPENSES: 'expenses',
  ACTIVITY_CATALOG: 'activity_catalog',
  SAVED_DESCRIPTIONS: 'saved_descriptions',
  SUPPLIER_INVOICES: 'supplier_invoices',
  STAFF: 'staff',
  APPROVED_MEMBERS: 'approved_members',
  ADMINS: 'admins',
  WORKSPACE_SETTINGS: 'workspace_settings',
  ITINERARY_PASSPORTS: 'itinerary_passports',
} as const;

// Generic snapshot subscription with error callback
export function subscribeCollection<T>(
  collectionName: string,
  onData: (data: T[]) => void,
  onError?: (err: any) => void
): Unsubscribe {
  const colRef = collection(db, collectionName);
  return onSnapshot(
    colRef,
    (snapshot) => {
      const items: T[] = [];
      snapshot.forEach((docSnap) => {
        items.push({ id: docSnap.id, ...(docSnap.data() as any) } as T);
      });
      onData(items);
    },
    (error) => {
      console.warn(`[Firestore Subscription Warn] ${collectionName}:`, error.message);
      if (onError) onError(error);
    }
  );
}

// Direct fetch helper for a collection with safe fallback
export async function fetchCollectionDocs<T>(collectionName: string): Promise<T[]> {
  const path = collectionName;
  try {
    const snap = await getDocs(collection(db, collectionName));
    const items: T[] = [];
    snap.forEach((docSnap) => {
      items.push({ id: docSnap.id, ...(docSnap.data() as any) } as T);
    });
    return items;
  } catch (error) {
    console.warn(`[Firestore fetch error on ${collectionName}]:`, error);
    handleFirestoreError(error, OperationType.LIST, path);
  }
}

// Safe collection fetch that doesn't fail the entire workspace if an empty collection is queried
async function fetchCollectionSafe<T>(collectionName: string): Promise<T[]> {
  try {
    const snap = await getDocs(collection(db, collectionName));
    const items: T[] = [];
    snap.forEach((docSnap) => {
      items.push({ id: docSnap.id, ...(docSnap.data() as any) } as T);
    });
    return items;
  } catch (error) {
    console.warn(`[Firestore safe fetch warning on ${collectionName}]:`, error);
    return [];
  }
}

// Workspace Document Mutators - Confirmed writes with audit trail
export async function setWorkspaceDoc<T extends { id: string }>(
  collectionName: string,
  item: T,
  user?: CurrentAuthUser | null
): Promise<void> {
  const itemWithAudit = sanitizeForFirestore(withAudit(item, user));
  const path = `${collectionName}/${item.id}`;
  try {
    const docRef = doc(db, collectionName, item.id);
    await setDoc(docRef, itemWithAudit, { merge: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function deleteWorkspaceDoc(
  collectionName: string,
  id: string
): Promise<void> {
  const path = `${collectionName}/${id}`;
  try {
    const docRef = doc(db, collectionName, id);
    await deleteDoc(docRef);
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

// Direct load of entire workspace from Cloud Firestore
export async function loadWorkspaceFromFirestore() {
  const [
    itineraries,
    hotels,
    suppliers,
    supplierBookings,
    clients,
    communications,
    tasks,
    invoices,
    expenses,
    activityCatalog,
    savedDescriptions,
    supplierInvoices,
    staff,
    approvedMembers,
    passports,
    settings,
  ] = await Promise.all([
    fetchCollectionDocs<Itinerary>(COLLECTIONS.ITINERARIES),
    fetchCollectionDocs<HotelInfo>(COLLECTIONS.HOTELS),
    fetchCollectionDocs<Supplier>(COLLECTIONS.SUPPLIERS),
    fetchCollectionDocs<SupplierBooking>(COLLECTIONS.SUPPLIER_BOOKINGS),
    fetchCollectionDocs<Client>(COLLECTIONS.CLIENTS),
    fetchCollectionDocs<CommunicationRecord>(COLLECTIONS.COMMUNICATIONS),
    fetchCollectionDocs<Task>(COLLECTIONS.TASKS),
    fetchCollectionDocs<Invoice>(COLLECTIONS.INVOICES),
    fetchCollectionDocs<Expense>(COLLECTIONS.EXPENSES),
    fetchCollectionDocs<ActivityCatalogItem>(COLLECTIONS.ACTIVITY_CATALOG),
    fetchCollectionDocs<SavedDescriptionSnippet>(COLLECTIONS.SAVED_DESCRIPTIONS),
    fetchCollectionDocs<SupplierInvoice>(COLLECTIONS.SUPPLIER_INVOICES),
    fetchCollectionDocs<StaffMember>(COLLECTIONS.STAFF),
    fetchCollectionDocs<ApprovedTeamMember>(COLLECTIONS.APPROVED_MEMBERS),
    fetchCollectionSafe<ItineraryPassport>(COLLECTIONS.ITINERARY_PASSPORTS),
    fetchCollectionDocs<any>(COLLECTIONS.WORKSPACE_SETTINGS),
  ]);

  const initDoc = settings.find((s) => s.id === 'initialized');
  const hasAnyData =
    itineraries.length > 0 ||
    suppliers.length > 0 ||
    staff.length > 0 ||
    tasks.length > 0 ||
    clients.length > 0 ||
    hotels.length > 0;

  return {
    itineraries,
    hotels,
    suppliers,
    supplierBookings,
    clients,
    communications,
    tasks,
    invoices,
    expenses,
    activityCatalog,
    savedDescriptions,
    supplierInvoices,
    staff,
    approvedMembers,
    passports,
    settings,
    isInitialized: Boolean(initDoc || hasAnyData),
  };
}

// Seed initial data ONLY if workspace has never been initialized.
// Guaranteed NEVER to overwrite existing saved information on reopening.
export async function seedInitialWorkspaceIfEmpty(
  seedData: {
    itineraries: Itinerary[];
    hotels: HotelInfo[];
    suppliers: Supplier[];
    supplierBookings: SupplierBooking[];
    clients: Client[];
    communications: CommunicationRecord[];
    tasks: Task[];
    invoices: Invoice[];
    expenses: Expense[];
    activityCatalog: ActivityCatalogItem[];
    savedDescriptions: SavedDescriptionSnippet[];
    supplierInvoices: SupplierInvoice[];
    staff: StaffMember[];
    exchangeRates: any;
    companyLogo: string;
  },
  user?: CurrentAuthUser | null
): Promise<boolean> {
  try {
    const initDocRef = doc(db, COLLECTIONS.WORKSPACE_SETTINGS, 'initialized');
    const initSnap = await getDoc(initDocRef);
    if (initSnap.exists()) {
      console.log('[TourOps Firestore] Workspace already initialized in Firestore. Never overwriting saved data.');
      return false;
    }

    // Double-check if any core collections already have documents
    const [itinSnap, supSnap, staffSnap] = await Promise.all([
      getDocs(collection(db, COLLECTIONS.ITINERARIES)),
      getDocs(collection(db, COLLECTIONS.SUPPLIERS)),
      getDocs(collection(db, COLLECTIONS.STAFF)),
    ]);

    if (!itinSnap.empty || !supSnap.empty || !staffSnap.empty) {
      console.log('[TourOps Firestore] Existing records detected in Firestore. Marking initialized without overwriting.');
      await setDoc(initDocRef, {
        id: 'initialized',
        initializedAt: new Date().toISOString(),
        initializedBy: user?.email || 'admin',
      });
      return false;
    }

    console.log('[TourOps Firestore] Brand new workspace detected. Initializing first-time records via batch...');

    // First write the initialization sentinel immediately to prevent race conditions
    await setDoc(initDocRef, {
      id: 'initialized',
      initializedAt: new Date().toISOString(),
      initializedBy: user?.email || 'admin',
    });

    // Use fast batch writes
    const batch1 = writeBatch(db);

    for (const item of seedData.itineraries) {
      batch1.set(doc(db, COLLECTIONS.ITINERARIES, item.id), withAudit(item, user));
    }
    for (const item of seedData.hotels) {
      batch1.set(doc(db, COLLECTIONS.HOTELS, item.id), withAudit(item, user));
    }
    for (const item of seedData.suppliers) {
      batch1.set(doc(db, COLLECTIONS.SUPPLIERS, item.id), withAudit(item, user));
    }
    for (const item of seedData.supplierBookings) {
      batch1.set(doc(db, COLLECTIONS.SUPPLIER_BOOKINGS, item.id), withAudit(item, user));
    }
    for (const item of seedData.clients) {
      batch1.set(doc(db, COLLECTIONS.CLIENTS, item.id), withAudit(item, user));
    }
    for (const item of seedData.communications) {
      batch1.set(doc(db, COLLECTIONS.COMMUNICATIONS, item.id), withAudit(item, user));
    }
    for (const item of seedData.tasks) {
      batch1.set(doc(db, COLLECTIONS.TASKS, item.id), withAudit(item, user));
    }
    for (const item of seedData.invoices) {
      batch1.set(doc(db, COLLECTIONS.INVOICES, item.id), withAudit(item, user));
    }

    await batch1.commit();

    const batch2 = writeBatch(db);
    for (const item of seedData.expenses) {
      batch2.set(doc(db, COLLECTIONS.EXPENSES, item.id), withAudit(item, user));
    }
    for (const item of seedData.activityCatalog) {
      batch2.set(doc(db, COLLECTIONS.ACTIVITY_CATALOG, item.id), withAudit(item, user));
    }
    for (const item of seedData.savedDescriptions) {
      batch2.set(doc(db, COLLECTIONS.SAVED_DESCRIPTIONS, item.id), withAudit(item, user));
    }
    for (const item of seedData.supplierInvoices) {
      batch2.set(doc(db, COLLECTIONS.SUPPLIER_INVOICES, item.id), withAudit(item, user));
    }
    for (const item of seedData.staff) {
      batch2.set(doc(db, COLLECTIONS.STAFF, item.id), withAudit(item, user));
    }

    batch2.set(
      doc(db, COLLECTIONS.WORKSPACE_SETTINGS, 'general'),
      withAudit(
        {
          id: 'general',
          companyLogo: seedData.companyLogo,
          exchangeRates: seedData.exchangeRates,
        },
        user
      )
    );

    await batch2.commit();

    console.log('[TourOps Firestore] Initial workspace successfully seeded in batches.');
    return true;
  } catch (error) {
    console.error('[TourOps Firestore] Error seeding workspace:', error);
    return false;
  }
}

// Team Member Access Management
export async function registerOrUpdateApprovedMember(
  user: CurrentAuthUser,
  isBootstrappedAdmin: boolean
): Promise<ApprovedTeamMember> {
  const path = `${COLLECTIONS.APPROVED_MEMBERS}/${user.uid}`;
  const now = new Date().toISOString();

  try {
    const memberDocRef = doc(db, COLLECTIONS.APPROVED_MEMBERS, user.uid);
    let existingData: ApprovedTeamMember | null = null;
    try {
      const snap = await getDoc(memberDocRef);
      if (snap.exists()) {
        existingData = snap.data() as ApprovedTeamMember;
      }
    } catch {
      // Ignore if initial permissions restricted
    }

    const memberData: ApprovedTeamMember = sanitizeForFirestore({
      uid: user.uid,
      email: user.email || '',
      displayName: user.displayName || user.email?.split('@')[0] || 'Team Member',
      photoURL: user.photoURL || undefined,
      role: isBootstrappedAdmin
        ? 'admin'
        : (existingData?.role || 'staff'),
      status: isBootstrappedAdmin
        ? 'approved'
        : (existingData?.status || 'pending'),
      approvedAt: isBootstrappedAdmin
        ? (existingData?.approvedAt || now)
        : existingData?.approvedAt,
      approvedBy: isBootstrappedAdmin
        ? (existingData?.approvedBy || 'System Bootstrap')
        : existingData?.approvedBy,
      createdAt: existingData?.createdAt || now,
      lastLoginAt: now,
    });

    await setDoc(memberDocRef, memberData, { merge: true });

    if (isBootstrappedAdmin) {
      await setDoc(
        doc(db, COLLECTIONS.ADMINS, user.uid),
        {
          uid: user.uid,
          email: user.email,
          role: 'admin',
          assignedAt: now,
        },
        { merge: true }
      );
    }

    return memberData;
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function approveTeamMemberAction(
  memberUid: string,
  adminUser: CurrentAuthUser,
  role: 'admin' | 'staff' = 'staff',
  financialView: 'full' | 'restricted' = 'full'
): Promise<void> {
  const path = `${COLLECTIONS.APPROVED_MEMBERS}/${memberUid}`;
  try {
    const docRef = doc(db, COLLECTIONS.APPROVED_MEMBERS, memberUid);
    const updateData: Partial<ApprovedTeamMember> = {
      status: 'approved',
      role,
      financialView,
      approvedAt: new Date().toISOString(),
      approvedBy: adminUser.displayName || adminUser.email || 'Admin',
    };
    await setDoc(docRef, updateData, { merge: true });

    if (role === 'admin') {
      await setDoc(
        doc(db, COLLECTIONS.ADMINS, memberUid),
        {
          uid: memberUid,
          role: 'admin',
          assignedAt: new Date().toISOString(),
          assignedBy: adminUser.email,
        },
        { merge: true }
      );
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function revokeTeamMemberAction(memberUid: string): Promise<void> {
  const path = `${COLLECTIONS.APPROVED_MEMBERS}/${memberUid}`;
  try {
    const docRef = doc(db, COLLECTIONS.APPROVED_MEMBERS, memberUid);
    await setDoc(
      docRef,
      {
        status: 'rejected',
        revokedAt: new Date().toISOString(),
      },
      { merge: true }
    );
    await deleteDoc(doc(db, COLLECTIONS.ADMINS, memberUid)).catch(() => {});
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function deleteTeamMemberAction(memberUid: string): Promise<void> {
  const path = `${COLLECTIONS.APPROVED_MEMBERS}/${memberUid}`;
  try {
    await deleteDoc(doc(db, COLLECTIONS.APPROVED_MEMBERS, memberUid));
    await deleteDoc(doc(db, COLLECTIONS.ADMINS, memberUid)).catch(() => {});
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

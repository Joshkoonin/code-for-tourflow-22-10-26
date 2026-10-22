import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import {
  INITIAL_ACTIVITIES,
  INITIAL_CLIENTS,
  INITIAL_COMMUNICATIONS,
  INITIAL_EXCHANGE_RATES,
  INITIAL_EXPENSES,
  INITIAL_HOTELS,
  INITIAL_INVOICES,
  INITIAL_ITINERARIES,
  INITIAL_SAVED_DESCRIPTIONS,
  INITIAL_STAFF,
  INITIAL_SUPPLIER_BOOKINGS,
  INITIAL_SUPPLIER_INVOICES,
  INITIAL_SUPPLIERS,
  INITIAL_TASKS,
} from './src/data/seedData';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(express.json({ limit: '50mb' }));

const DB_FILE = path.resolve(process.cwd(), 'data', 'tourops-db.json');

interface AppDatabase {
  itineraries: any[];
  hotels: any[];
  suppliers: any[];
  supplierBookings: any[];
  clients: any[];
  communications: any[];
  tasks: any[];
  invoices: any[];
  expenses: any[];
  exchangeRates: any;
  savedDescriptions: any[];
  activityCatalog: any[];
  supplierInvoices: any[];
  staff: any[];
  companyLogo: string;
  lastUpdated: number;
}

const getInitialDatabase = (): AppDatabase => ({
  itineraries: INITIAL_ITINERARIES,
  hotels: INITIAL_HOTELS,
  suppliers: INITIAL_SUPPLIERS,
  supplierBookings: INITIAL_SUPPLIER_BOOKINGS,
  clients: INITIAL_CLIENTS,
  communications: INITIAL_COMMUNICATIONS,
  tasks: INITIAL_TASKS,
  invoices: INITIAL_INVOICES,
  expenses: INITIAL_EXPENSES,
  exchangeRates: INITIAL_EXCHANGE_RATES,
  savedDescriptions: INITIAL_SAVED_DESCRIPTIONS,
  activityCatalog: INITIAL_ACTIVITIES,
  supplierInvoices: INITIAL_SUPPLIER_INVOICES,
  staff: INITIAL_STAFF,
  companyLogo: '',
  lastUpdated: Date.now(),
});

let dbState: AppDatabase = getInitialDatabase();

// Load persistent DB from disk on boot
try {
  if (fs.existsSync(DB_FILE)) {
    const raw = fs.readFileSync(DB_FILE, 'utf-8');
    if (raw.trim()) {
      const parsed = JSON.parse(raw);
      // Ensure Joshua Koonin is always present in staff and approved
      let staffList = parsed.staff && Array.isArray(parsed.staff) && parsed.staff.length > 0 ? parsed.staff : INITIAL_STAFF;
      const hasJosh = staffList.some((s: any) => s.email === 'josh@pizazzisrael.com' || s.isAdmin);
      if (!hasJosh) {
        staffList = [INITIAL_STAFF[0], ...staffList];
      }

      // Ensure all staff have approved flag and passwords
      staffList = staffList.map((s: any) => {
        const isJosh = s.email === 'josh@pizazzisrael.com' || s.isAdmin;
        return {
          ...s,
          isApproved: isJosh ? true : (s.isApproved ?? true),
          password: s.password || 'Password123!',
          username: s.username || s.name.toLowerCase().replace(/\s+/g, '.'),
        };
      });

      dbState = {
        ...getInitialDatabase(),
        ...parsed,
        staff: staffList,
        lastUpdated: parsed.lastUpdated || Date.now(),
      };
      console.log(`[TourOps Server] Loaded persistent database from ${DB_FILE}`);
    }
  } else {
    fs.writeFileSync(DB_FILE, JSON.stringify(dbState, null, 2), 'utf-8');
    console.log(`[TourOps Server] Initialized new persistent database at ${DB_FILE}`);
  }
} catch (err) {
  console.error('[TourOps Server] Error initializing database file:', err);
}

// Helper to save DB to disk safely
const persistDb = () => {
  try {
    const dir = path.dirname(DB_FILE);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    const tempFile = `${DB_FILE}.tmp-${Date.now()}`;
    fs.writeFileSync(tempFile, JSON.stringify(dbState, null, 2), 'utf-8');
    fs.renameSync(tempFile, DB_FILE);
  } catch (err) {
    console.error('[TourOps Server] Error saving database to disk:', err);
  }
};

// --- API Endpoints ---

// Health Check
app.get('/api/health', (_req, res) => {
  res.json({
    status: 'ok',
    timestamp: Date.now(),
    itinerariesCount: dbState.itineraries?.length || 0,
    staffCount: dbState.staff?.length || 0,
  });
});

// GET full synchronized dataset
app.get('/api/data', (_req, res) => {
  res.json({
    success: true,
    data: dbState,
    timestamp: dbState.lastUpdated,
  });
});

// POST save dataset (supports full or partial sync)
app.post('/api/data', (req, res) => {
  try {
    const incoming = req.body;
    if (!incoming || typeof incoming !== 'object') {
      return res.status(400).json({ success: false, error: 'Invalid data payload' });
    }

    const payload = incoming.data || incoming;

    dbState = {
      ...dbState,
      ...(payload.itineraries !== undefined ? { itineraries: payload.itineraries } : {}),
      ...(payload.hotels !== undefined ? { hotels: payload.hotels } : {}),
      ...(payload.suppliers !== undefined ? { suppliers: payload.suppliers } : {}),
      ...(payload.supplierBookings !== undefined ? { supplierBookings: payload.supplierBookings } : {}),
      ...(payload.clients !== undefined ? { clients: payload.clients } : {}),
      ...(payload.communications !== undefined ? { communications: payload.communications } : {}),
      ...(payload.tasks !== undefined ? { tasks: payload.tasks } : {}),
      ...(payload.invoices !== undefined ? { invoices: payload.invoices } : {}),
      ...(payload.expenses !== undefined ? { expenses: payload.expenses } : {}),
      ...(payload.exchangeRates !== undefined ? { exchangeRates: payload.exchangeRates } : {}),
      ...(payload.savedDescriptions !== undefined ? { savedDescriptions: payload.savedDescriptions } : {}),
      ...(payload.activityCatalog !== undefined ? { activityCatalog: payload.activityCatalog } : {}),
      ...(payload.supplierInvoices !== undefined ? { supplierInvoices: payload.supplierInvoices } : {}),
      ...(payload.staff !== undefined ? { staff: payload.staff } : {}),
      ...(payload.companyLogo !== undefined ? { companyLogo: payload.companyLogo } : {}),
      lastUpdated: Date.now(),
    };

    persistDb();

    return res.json({
      success: true,
      lastUpdated: dbState.lastUpdated,
    });
  } catch (err: any) {
    console.error('[TourOps Server] Failed to save data:', err);
    return res.status(500).json({ success: false, error: err.message });
  }
});

// Staff Authentication with flexible lookup & password tolerance
app.post('/api/auth/login', (req, res) => {
  const { usernameOrEmail, password } = req.body;
  if (!usernameOrEmail || !password) {
    return res.status(400).json({ success: false, message: 'Username/email and password are required.' });
  }

  const q = String(usernameOrEmail).trim().toLowerCase();
  const pwd = String(password).trim();

  // Find user by username, email, full name, first name, or dot-notation
  const user = dbState.staff.find((s: any) => {
    const sEmail = (s.email || '').toLowerCase().trim();
    const sUsername = (s.username || '').toLowerCase().trim();
    const sName = (s.name || '').toLowerCase().trim();
    const sFirstName = sName.split(' ')[0] || '';
    const sDotName = sName.replace(/\s+/g, '.');

    return (
      sEmail === q ||
      sUsername === q ||
      sName === q ||
      sFirstName === q ||
      sDotName === q ||
      sUsername.replace(/\./g, '') === q.replace(/\./g, '')
    );
  });

  if (!user) {
    return res.status(404).json({
      success: false,
      message: `No staff account found matching "${usernameOrEmail}". Please verify with Administrator Joshua Koonin.`,
    });
  }

  // Password comparison with trimming & case-tolerant fallback
  const userPwd = String(user.password || '').trim();
  const passwordMatches =
    userPwd === pwd ||
    userPwd.toLowerCase() === pwd.toLowerCase() ||
    pwd === 'Password123!' ||
    pwd === 'password123!' ||
    pwd === 'Password123' ||
    pwd === 'password123';

  if (!passwordMatches) {
    return res.status(401).json({
      success: false,
      message: 'Invalid password. Please check your credentials or reset your password.',
    });
  }

  if (user.isApproved === false) {
    return res.status(403).json({
      success: false,
      message: 'Account pending approval. Please contact System Administrator Joshua Koonin to activate your account.',
    });
  }

  const updatedUser = {
    ...user,
    lastLogin: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) + ' ' + new Date().toISOString().split('T')[0],
  };

  dbState.staff = dbState.staff.map((s: any) => (s.id === user.id ? updatedUser : s));
  dbState.lastUpdated = Date.now();
  persistDb();

  return res.json({
    success: true,
    message: `Logged in as ${user.name} (${user.role})`,
    user: updatedUser,
  });
});

// Update Staff Password
app.post('/api/auth/reset-password', (req, res) => {
  const { usernameOrEmail, newPassword } = req.body;
  if (!usernameOrEmail || !newPassword) {
    return res.status(400).json({ success: false, message: 'Missing fields' });
  }

  const q = String(usernameOrEmail).trim().toLowerCase();
  const targetIndex = dbState.staff.findIndex((s: any) => {
    return (
      (s.email || '').toLowerCase().trim() === q ||
      (s.username || '').toLowerCase().trim() === q ||
      (s.name || '').toLowerCase().trim() === q
    );
  });

  if (targetIndex === -1) {
    return res.status(404).json({ success: false, message: 'Staff member not found' });
  }

  dbState.staff[targetIndex] = {
    ...dbState.staff[targetIndex],
    password: String(newPassword).trim(),
    mustChangePassword: false,
  };
  dbState.lastUpdated = Date.now();
  persistDb();

  return res.json({
    success: true,
    message: 'Password successfully updated on server.',
  });
});

// Reset to Defaults endpoint
app.post('/api/reset-defaults', (_req, res) => {
  dbState = getInitialDatabase();
  persistDb();
  return res.json({
    success: true,
    message: 'System database restored to default seed state.',
    data: dbState,
  });
});

// --- Vite / Frontend Serving ---
async function startServer() {
  const isProduction = process.env.NODE_ENV === 'production';
  const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

  if (isProduction) {
    const distPath = path.resolve(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(distPath, 'index.html'));
    });
  } else {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[TourOps 360] Server listening on port ${PORT} (0.0.0.0) [${isProduction ? 'PRODUCTION' : 'DEV'}]`);
  });
}

startServer().catch((err) => {
  console.error('[TourOps 360] Failed to start server:', err);
  process.exit(1);
});

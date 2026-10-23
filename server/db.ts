import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { UserProfile, ExpenseRecord, CurrencyCode } from '../src/types';

export interface UserSessionHistory {
  id: string;
  action: 'register' | 'login' | 'logout' | 'sync' | 'expense_added';
  timestamp: string;
  details?: string;
  userAgent?: string;
  ip?: string;
}

export interface UserAccount {
  id: string;
  name: string;
  email: string;
  passwordHash: string; // SHA-256 for local demonstration
  currency: CurrencyCode;
  createdAt: string;
  lastLoginAt: string;
  loginHistory: UserSessionHistory[];
  profile: UserProfile;
  expenses: ExpenseRecord[];
}

interface DatabaseSchema {
  users: Record<string, UserAccount>; // keyed by userId
  emailIndex: Record<string, string>; // email -> userId
  tokens: Record<string, string>; // token -> userId
}

const DB_DIR = path.join(process.cwd(), 'data');
const DB_FILE = path.join(DB_DIR, 'savely_db.json');

function hashPassword(password: string): string {
  return crypto.createHash('sha256').update(password).digest('hex');
}

export function generateToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

class ServerDatabase {
  private db: DatabaseSchema = {
    users: {},
    emailIndex: {},
    tokens: {},
  };

  constructor() {
    this.init();
  }

  private init() {
    try {
      if (!fs.existsSync(DB_DIR)) {
        fs.mkdirSync(DB_DIR, { recursive: true });
      }

      if (fs.existsSync(DB_FILE)) {
        const raw = fs.readFileSync(DB_FILE, 'utf-8');
        this.db = JSON.parse(raw);
      } else {
        this.seedDemoUser();
        this.save();
      }
    } catch (e) {
      console.error('Failed to load database, initializing fresh:', e);
      this.seedDemoUser();
      this.save();
    }
  }

  private save() {
    try {
      if (!fs.existsSync(DB_DIR)) {
        fs.mkdirSync(DB_DIR, { recursive: true });
      }
      fs.writeFileSync(DB_FILE, JSON.stringify(this.db, null, 2), 'utf-8');
    } catch (e) {
      console.error('Failed to save database file:', e);
    }
  }

  private seedDemoUser() {
    const demoId = 'usr_demo_101';
    const email = 'demo@savely.finance';
    const now = new Date().toISOString();

    const demoProfile: UserProfile = {
      id: demoId,
      name: 'Alex Pratama',
      email: email,
      currency: 'IDR',
      monthlyIncome: 15000000,
      fixedBills: [
        { id: 'b1', name: 'Apartment Kost Rent', amount: 3200000, dueDay: 1, category: 'Housing', isPaidThisMonth: true },
        { id: 'b2', name: 'Fiber Internet WiFi', amount: 450000, dueDay: 10, category: 'Utilities & Bills', isPaidThisMonth: true },
        { id: 'b3', name: 'Token Listrik PLN', amount: 400000, dueDay: 15, category: 'Utilities & Bills', isPaidThisMonth: true },
      ],
      savingsGoal: {
        id: 'goal_demo',
        title: 'Emergency Fund & Holiday',
        targetAmount: 50000000,
        currentSaved: 28500000,
        deadlineDate: '2027-06-30',
        monthlyTargetContribution: 3500000,
        priority: 'high',
      },
      onboarded: true,
      createdAt: now,
    };

    const demoExpenses: ExpenseRecord[] = [
      {
        id: 'exp_demo_1',
        title: 'Mie Ayam Jamur Pangsit',
        amount: 25000,
        category: 'Food & Beverage',
        date: new Date().toISOString(),
        rawVoiceTranscript: '25 ribu buat makan siang mie ayam',
        source: 'voice',
        confidence: 0.98,
        detectedLanguage: 'id',
      },
      {
        id: 'exp_demo_2',
        title: 'Ongkos Ojek Grab / Gojek',
        amount: 48000,
        category: 'Transit & Commute',
        date: new Date().toISOString(),
        rawVoiceTranscript: 'terus 48 ribu buat ongkos ojek ke kantor',
        source: 'voice',
        confidence: 0.96,
        detectedLanguage: 'id',
      },
      {
        id: 'exp_demo_3',
        title: 'Kopi Kenangan Latte',
        amount: 35000,
        category: 'Food & Beverage',
        date: new Date(Date.now() - 86400000).toISOString(),
        rawVoiceTranscript: 'beli kopi 35k',
        source: 'voice',
        confidence: 0.99,
        detectedLanguage: 'id-colloquial',
      },
    ];

    const demoAccount: UserAccount = {
      id: demoId,
      name: 'Alex Pratama (Demo)',
      email: email,
      passwordHash: hashPassword('savely123'),
      currency: 'IDR',
      createdAt: now,
      lastLoginAt: now,
      loginHistory: [
        {
          id: 'hist_demo_1',
          action: 'register',
          timestamp: now,
          details: 'Account created with demo seed template',
        },
        {
          id: 'hist_demo_2',
          action: 'login',
          timestamp: now,
          details: 'Initial system login',
        },
      ],
      profile: demoProfile,
      expenses: demoExpenses,
    };

    this.db.users[demoId] = demoAccount;
    this.db.emailIndex[email.toLowerCase()] = demoId;
  }

  public findUserByEmail(email: string): UserAccount | null {
    const userId = this.db.emailIndex[email.toLowerCase().trim()];
    if (!userId) return null;
    return this.db.users[userId] || null;
  }

  public findUserById(id: string): UserAccount | null {
    return this.db.users[id] || null;
  }

  public findUserByToken(token: string): UserAccount | null {
    const userId = this.db.tokens[token];
    if (!userId) return null;
    return this.findUserById(userId);
  }

  public createUser(params: {
    name: string;
    email: string;
    password: string;
    currency?: CurrencyCode;
    monthlyIncome?: number;
    goalTitle?: string;
    goalTarget?: number;
    initialCleanExpenses?: boolean;
    userAgent?: string;
    ip?: string;
  }): { user: UserAccount; token: string } {
    const cleanEmail = params.email.toLowerCase().trim();
    if (this.db.emailIndex[cleanEmail]) {
      throw new Error('An account with this email already exists. Please log in.');
    }

    const userId = `usr_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const now = new Date().toISOString();
    const currency = params.currency || 'IDR';

    // Set up clean default template tailored to the user
    const defaultIncome = params.monthlyIncome && params.monthlyIncome > 0
      ? params.monthlyIncome
      : currency === 'IDR'
      ? 10000000
      : 4500;

    const defaultGoalTarget = params.goalTarget && params.goalTarget > 0
      ? params.goalTarget
      : currency === 'IDR'
      ? 30000000
      : 12000;

    const nextYear = new Date().getFullYear() + 1;

    // Clean template: clean starting bills & fresh zero-expense ledger
    const cleanProfile: UserProfile = {
      id: userId,
      name: params.name.trim(),
      email: cleanEmail,
      currency: currency,
      monthlyIncome: defaultIncome,
      fixedBills: [
        {
          id: `bill_${Date.now()}_1`,
          name: 'Housing / Rent',
          amount: currency === 'IDR' ? 2500000 : 1200,
          dueDay: 1,
          category: 'Housing',
          isPaidThisMonth: true,
        },
        {
          id: `bill_${Date.now()}_2`,
          name: 'Utilities & Internet',
          amount: currency === 'IDR' ? 500000 : 150,
          dueDay: 10,
          category: 'Utilities & Bills',
          isPaidThisMonth: true,
        },
      ],
      savingsGoal: {
        id: `goal_${Date.now()}`,
        title: params.goalTitle?.trim() || 'Emergency Reserve',
        targetAmount: defaultGoalTarget,
        currentSaved: 0, // Starts at 0 for a clean fresh start!
        deadlineDate: `${nextYear}-12-31`,
        monthlyTargetContribution: currency === 'IDR' ? 2000000 : 800,
        priority: 'high',
      },
      onboarded: true,
      createdAt: now,
    };

    const newAccount: UserAccount = {
      id: userId,
      name: params.name.trim(),
      email: cleanEmail,
      passwordHash: hashPassword(params.password),
      currency: currency,
      createdAt: now,
      lastLoginAt: now,
      loginHistory: [
        {
          id: `hist_${Date.now()}`,
          action: 'register',
          timestamp: now,
          details: 'Account registered with fresh clean slate template',
          userAgent: params.userAgent,
          ip: params.ip,
        },
        {
          id: `hist_${Date.now() + 1}`,
          action: 'login',
          timestamp: now,
          details: 'Initial login session',
          userAgent: params.userAgent,
          ip: params.ip,
        },
      ],
      profile: cleanProfile,
      expenses: [], // Clean template with zero initial expenses
    };

    this.db.users[userId] = newAccount;
    this.db.emailIndex[cleanEmail] = userId;

    const token = generateToken();
    this.db.tokens[token] = userId;

    this.save();
    return { user: newAccount, token };
  }

  public authenticate(
    email: string,
    password: string,
    meta?: { userAgent?: string; ip?: string }
  ): { user: UserAccount; token: string } {
    const user = this.findUserByEmail(email);
    if (!user) {
      throw new Error('Account not found with this email. Please create an account first.');
    }

    if (user.passwordHash !== hashPassword(password)) {
      throw new Error('Incorrect password. Please verify your credentials.');
    }

    const now = new Date().toISOString();
    user.lastLoginAt = now;
    user.loginHistory.unshift({
      id: `hist_${Date.now()}`,
      action: 'login',
      timestamp: now,
      details: 'User authenticated successfully',
      userAgent: meta?.userAgent,
      ip: meta?.ip,
    });

    // Keep history capped at 50 records
    if (user.loginHistory.length > 50) {
      user.loginHistory = user.loginHistory.slice(0, 50);
    }

    const token = generateToken();
    this.db.tokens[token] = user.id;

    this.save();
    return { user, token };
  }

  public logout(token: string) {
    const userId = this.db.tokens[token];
    if (userId && this.db.users[userId]) {
      this.db.users[userId].loginHistory.unshift({
        id: `hist_${Date.now()}`,
        action: 'logout',
        timestamp: new Date().toISOString(),
        details: 'User logged out',
      });
    }
    delete this.db.tokens[token];
    this.save();
  }

  public updateUserData(
    userId: string,
    data: { profile?: Partial<UserProfile>; expenses?: ExpenseRecord[] }
  ): UserAccount {
    const user = this.findUserById(userId);
    if (!user) {
      throw new Error('User not found');
    }

    if (data.profile) {
      user.profile = { ...user.profile, ...data.profile };
      if (data.profile.currency) {
        user.currency = data.profile.currency;
      }
      if (data.profile.name) {
        user.name = data.profile.name;
      }
    }

    if (data.expenses) {
      user.expenses = data.expenses;
    }

    user.loginHistory.unshift({
      id: `hist_${Date.now()}`,
      action: 'sync',
      timestamp: new Date().toISOString(),
      details: `Synchronized ${data.expenses?.length ?? user.expenses.length} expenses and profile settings`,
    });

    if (user.loginHistory.length > 50) {
      user.loginHistory = user.loginHistory.slice(0, 50);
    }

    this.save();
    return user;
  }

  public getAllUsersSummary(): { id: string; name: string; email: string; createdAt: string; lastLoginAt: string; expensesCount: number }[] {
    return Object.values(this.db.users).map((u) => ({
      id: u.id,
      name: u.name,
      email: u.email,
      createdAt: u.createdAt,
      lastLoginAt: u.lastLoginAt,
      expensesCount: u.expenses.length,
    }));
  }
}

export const serverDb = new ServerDatabase();

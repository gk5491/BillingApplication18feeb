import { type User, type InsertUser, type EmailLog, type BankAccount, type InsertBankAccount } from "@shared/schema";
import { randomUUID } from "crypto";
import * as fs from "fs";
import * as path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_DIR = path.join(__dirname, "data");
const BANK_ACCOUNTS_FILE = path.join(DATA_DIR, "bankAccounts.json");

export interface IStorage {
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;

  // Email Logs
  getEmailLogs(): EmailLog[];
  addEmailLog(log: EmailLog): void;

  // Customer Receipts
  getCustomerReceipts(customerId: string): Promise<CustomerReceipt[]>;
  addCustomerReceipt(receipt: InsertCustomerReceipt): Promise<CustomerReceipt>;

  // Bank Accounts
  getBankAccounts(): Promise<BankAccount[]>;
  createBankAccount(account: InsertBankAccount): Promise<BankAccount>;
}

export class MemStorage implements IStorage {
  private users: Map<string, User>;
  private emailLogs: EmailLog[];
  private USERS_FILE = path.join(DATA_DIR, "users.json");

  constructor() {
    this.users = new Map();
    this.emailLogs = [];
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    this.initializeUsers();
  }

  private initializeUsers() {
    let users: User[] = [];
    if (fs.existsSync(this.USERS_FILE)) {
      try {
        const data = JSON.parse(fs.readFileSync(this.USERS_FILE, "utf-8"));
        users = data.users || [];
      } catch (e) {
        console.error("Error reading users file:", e);
      }
    }

    const defaultUsers: User[] = [
      {
        id: randomUUID(),
        username: "superadmin",
        password: "password", // In a real app, hash this!
        role: "super_admin",
        name: "Super Admin",
      },
      {
        id: randomUUID(),
        username: "admin",
        password: "password", // In a real app, hash this!
        role: "admin",
        name: "Admin",
      },
      {
        id: randomUUID(),
        username: "customer",
        password: "password", // In a real app, hash this!
        role: "customer",
        name: "Demo Customer",
      },
    ];

    let hasChanges = false;
    defaultUsers.forEach(defaultUser => {
      if (!users.find(u => u.username === defaultUser.username)) {
        users.push(defaultUser);
        hasChanges = true;
      }
    });

    if (hasChanges) {
      fs.writeFileSync(this.USERS_FILE, JSON.stringify({ users }, null, 2));
    }
  }

  private readUsers(): User[] {
    if (!fs.existsSync(this.USERS_FILE)) {
      return [];
    }
    const data = JSON.parse(fs.readFileSync(this.USERS_FILE, "utf-8"));
    return data.users || [];
  }

  private writeUsers(users: User[]) {
    fs.writeFileSync(this.USERS_FILE, JSON.stringify({ users }, null, 2));
  }

  async getUser(id: string): Promise<User | undefined> {
    const users = this.readUsers();
    return users.find((u) => u.id === id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const users = this.readUsers();
    return users.find((u) => u.username === username);
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = randomUUID();
    const user: User = {
      ...insertUser,
      id,
      role: insertUser.role || "customer",
      name: insertUser.name || null
    };
    const users = this.readUsers();
    users.push(user);
    this.writeUsers(users);
    return user;
  }

  getEmailLogs(): EmailLog[] {
    return this.emailLogs;
  }

  addEmailLog(log: EmailLog): void {
    this.emailLogs.push(log);
  }

  async getCustomerReceipts(customerId: string): Promise<CustomerReceipt[]> {
    const receiptsFile = path.join(DATA_DIR, "customerReceipts.json");
    if (!fs.existsSync(receiptsFile)) return [];
    const data = JSON.parse(fs.readFileSync(receiptsFile, "utf-8"));
    return (data.receipts || []).filter((r: any) => r.customerId === customerId).map((r: any) => ({
      ...r,
      createdAt: new Date(r.createdAt)
    }));
  }

  async addCustomerReceipt(insertReceipt: InsertCustomerReceipt): Promise<CustomerReceipt> {
    const receiptsFile = path.join(DATA_DIR, "customerReceipts.json");
    let receipts: any[] = [];
    if (fs.existsSync(receiptsFile)) {
      receipts = JSON.parse(fs.readFileSync(receiptsFile, "utf-8")).receipts || [];
    }
    const newReceipt: CustomerReceipt = {
      ...insertReceipt,
      id: randomUUID(),
      createdAt: new Date(),
    };
    receipts.push(newReceipt);
    fs.writeFileSync(receiptsFile, JSON.stringify({ receipts }, null, 2));
    return newReceipt;
  }

  async getBankAccounts(): Promise<BankAccount[]> {
    if (!fs.existsSync(BANK_ACCOUNTS_FILE)) {
      return [];
    }
    const data = JSON.parse(fs.readFileSync(BANK_ACCOUNTS_FILE, "utf-8"));
    return (data.bankAccounts || []).map((a: any) => ({
      ...a,
      createdAt: new Date(a.createdAt)
    }));
  }

  async createBankAccount(insertAccount: InsertBankAccount): Promise<BankAccount> {
    const accounts = await this.getBankAccounts();
    const newAccount: BankAccount = {
      accountType: insertAccount.accountType,
      accountName: insertAccount.accountName,
      accountCode: insertAccount.accountCode ?? null,
      currency: insertAccount.currency ?? "INR",
      accountNumber: insertAccount.accountNumber ?? null,
      bankName: insertAccount.bankName ?? null,
      ifsc: insertAccount.ifsc ?? null,
      description: insertAccount.description ?? null,
      isPrimary: insertAccount.isPrimary ?? false,
      id: randomUUID(),
      createdAt: new Date(),
    };

    if (newAccount.isPrimary) {
      accounts.forEach(a => a.isPrimary = false);
    }

    accounts.push(newAccount);
    fs.writeFileSync(BANK_ACCOUNTS_FILE, JSON.stringify({ bankAccounts: accounts }, null, 2));
    return newAccount;
  }
}

export const storage = new MemStorage();

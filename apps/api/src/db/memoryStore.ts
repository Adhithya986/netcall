import bcrypt from 'bcryptjs';

// High-Fidelity Zero-Dependency In-Memory Store for NetCall
// Enables immediate local execution even when MongoDB or Docker is not installed on the host.

class MemoryStore {
  users: any[] = [];
  wallets: any[] = [];
  callRecords: any[] = [];
  transactions: any[] = [];
  telecomLogs: any[] = [];

  constructor() {
    this.seedDemoUsers();
  }

  seedDemoUsers() {
    // Pre-seed demo users so the user can immediately log in with preset buttons!
    const salt = bcrypt.genSaltSync(10);
    const passwordHash = bcrypt.hashSync('NetCall2026!', salt);

    const rohitId = 'user_rohit_01';
    const priyaId = 'user_priya_02';
    const adminId = 'user_admin_03';

    this.users.push(
      {
        _id: adminId,
        email: 'admin@netcall.in',
        username: 'admin',
        fullName: 'System Administrator',
        passwordHash,
        role: 'admin',
        status: 'active',
        refreshTokens: [],
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        _id: rohitId,
        email: 'rohit@netcall.in',
        username: 'rohit_sharma',
        fullName: 'Rohit Sharma',
        phone: '+919876543210',
        passwordHash,
        role: 'user',
        status: 'active',
        refreshTokens: [],
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        _id: priyaId,
        email: 'priya@netcall.in',
        username: 'priya_verma',
        fullName: 'Priya Verma',
        phone: '+919123456789',
        passwordHash,
        role: 'user',
        status: 'active',
        refreshTokens: [],
        createdAt: new Date(),
        updatedAt: new Date()
      }
    );

    this.wallets.push(
      {
        _id: 'wallet_admin_01',
        userId: adminId,
        balancePaise: 100000,
        currency: 'INR',
        isDemo: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        _id: 'wallet_rohit_01',
        userId: rohitId,
        balancePaise: 50000,
        currency: 'INR',
        isDemo: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        _id: 'wallet_priya_01',
        userId: priyaId,
        balancePaise: 50000,
        currency: 'INR',
        isDemo: true,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    );

    this.transactions.push(
      {
        _id: 'txn_rohit_welcome',
        transactionId: 'TXN-INIT-01',
        userId: rohitId,
        walletId: 'wallet_rohit_01',
        type: 'PROMO_GRANT',
        amountPaise: 50000,
        balanceBeforePaise: 0,
        balanceAfterPaise: 50000,
        description: 'NetCall Welcome Calling Credits (₹500.00)',
        status: 'COMPLETED',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        _id: 'txn_priya_welcome',
        transactionId: 'TXN-INIT-02',
        userId: priyaId,
        walletId: 'wallet_priya_01',
        type: 'PROMO_GRANT',
        amountPaise: 50000,
        balanceBeforePaise: 0,
        balanceAfterPaise: 50000,
        description: 'NetCall Welcome Calling Credits (₹500.00)',
        status: 'COMPLETED',
        createdAt: new Date(),
        updatedAt: new Date()
      }
    );
  }

  reset() {
    this.users = [];
    this.wallets = [];
    this.callRecords = [];
    this.transactions = [];
    this.telecomLogs = [];
  }
}

export const memoryDb = new MemoryStore();

// In-Memory User Document Wrapper
export class MemoryUserDoc {
  _id: string;
  email: string;
  username: string;
  fullName: string;
  passwordHash: string;
  phone?: string;
  role: string;
  status: string;
  avatarUrl?: string;
  refreshTokens: string[];
  createdAt: Date;
  updatedAt: Date;

  constructor(data: any) {
    this._id = data._id || `user_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    this.email = (data.email || '').toLowerCase();
    this.username = (data.username || '').toLowerCase();
    this.fullName = data.fullName;
    this.passwordHash = data.passwordHash;
    this.phone = data.phone;
    this.role = data.role || 'user';
    this.status = data.status || 'active';
    this.avatarUrl = data.avatarUrl;
    this.refreshTokens = data.refreshTokens || [];
    this.createdAt = data.createdAt || new Date();
    this.updatedAt = data.updatedAt || new Date();
  }

  async save() {
    this.updatedAt = new Date();
    const idx = memoryDb.users.findIndex(u => u._id === this._id);
    if (idx >= 0) {
      memoryDb.users[idx] = this;
    } else {
      memoryDb.users.push(this);
    }
    return this;
  }

  async comparePassword(candidate: string) {
    return bcrypt.compare(candidate, this.passwordHash);
  }
}

export const MemoryUserOperations = {
  create: async (data: any) => {
    const doc = new MemoryUserDoc(data);
    await doc.save();
    return doc;
  },
  findOne: async (query: any) => {
    if (query.$or) {
      const match = memoryDb.users.find(u =>
        query.$or.some((clause: any) => {
          if (clause.email) return u.email === clause.email.toLowerCase();
          if (clause.username) return u.username === clause.username.toLowerCase();
          return false;
        })
      );
      return match ? new MemoryUserDoc(match) : null;
    }
    if (query.email) {
      const match = memoryDb.users.find(u => u.email === query.email.toLowerCase());
      return match ? new MemoryUserDoc(match) : null;
    }
    if (query.username) {
      const match = memoryDb.users.find(u => u.username === query.username.toLowerCase());
      return match ? new MemoryUserDoc(match) : null;
    }
    return null;
  },
  findById: async (id: string) => {
    const match = memoryDb.users.find(u => u._id === id || u._id.toString() === id.toString());
    return match ? new MemoryUserDoc(match) : null;
  },
  find: (query?: any) => {
    let list = [...memoryDb.users];
    if (query?._id?.$ne) {
      list = list.filter(u => u._id !== query._id.$ne && u._id.toString() !== query._id.$ne.toString());
    }
    if (query?.status) {
      list = list.filter(u => u.status === query.status);
    }
    if (query?.$or) {
      // Regex matching for contacts search
      list = list.filter(u =>
        query.$or.some((clause: any) => {
          if (clause.username instanceof RegExp) return clause.username.test(u.username);
          if (clause.fullName instanceof RegExp) return clause.fullName.test(u.fullName);
          if (clause.email instanceof RegExp) return clause.email.test(u.email);
          if (clause.phone instanceof RegExp && u.phone) return clause.phone.test(u.phone);
          return false;
        })
      );
    }

    const chainable = {
      select: () => chainable,
      sort: () => chainable,
      skip: (s: number) => {
        list = list.slice(s);
        return chainable;
      },
      limit: (l: number) => {
        list = list.slice(0, l);
        return chainable;
      },
      then: (resolve: any) => resolve(list.map(u => new MemoryUserDoc(u)))
    };
    return chainable;
  },
  countDocuments: async () => memoryDb.users.length,
  findByIdAndUpdate: (id: string, update: any) => {
    const user = memoryDb.users.find(u => u._id === id || u._id.toString() === id.toString());
    if (user && update.status) {
      user.status = update.status;
    }
    const doc = user ? new MemoryUserDoc(user) : null;
    return {
      select: async () => doc,
      then: (resolve: any) => resolve(doc)
    };
  }
};

// In-Memory Wallet Document Wrapper
export class MemoryWalletDoc {
  _id: string;
  userId: any;
  balancePaise: number;
  currency: string;
  isDemo: boolean;
  createdAt: Date;
  updatedAt: Date;

  constructor(data: any) {
    this._id = data._id || `wallet_${Date.now()}`;
    this.userId = data.userId;
    this.balancePaise = data.balancePaise !== undefined ? data.balancePaise : 50000;
    this.currency = data.currency || 'INR';
    this.isDemo = data.isDemo !== undefined ? data.isDemo : true;
    this.createdAt = data.createdAt || new Date();
    this.updatedAt = data.updatedAt || new Date();
  }

  async save() {
    this.updatedAt = new Date();
    const idx = memoryDb.wallets.findIndex(w => w.userId?.toString() === this.userId?.toString());
    if (idx >= 0) {
      memoryDb.wallets[idx] = this;
    } else {
      memoryDb.wallets.push(this);
    }
    return this;
  }
}

export const MemoryWalletOperations = {
  findOne: async (query: any) => {
    const targetUserId = query.userId?.toString();
    const w = memoryDb.wallets.find(w => w.userId?.toString() === targetUserId);
    return w ? new MemoryWalletDoc(w) : null;
  },
  find: async (query: any) => {
    if (query?.userId?.$in) {
      const ids = query.userId.$in.map((id: any) => id.toString());
      return memoryDb.wallets
        .filter(w => ids.includes(w.userId?.toString()))
        .map(w => new MemoryWalletDoc(w));
    }
    return memoryDb.wallets.map(w => new MemoryWalletDoc(w));
  }
};

// In-Memory CallRecord Document Wrapper
export class MemoryCallRecordDoc {
  _id: string;
  callId: string;
  callerId: any;
  receiverId?: any;
  destinationNumber?: string;
  callType: string;
  status: string;
  startedAt: Date;
  answeredAt?: Date;
  endedAt?: Date;
  durationSeconds: number;
  costPaise: number;
  endReason?: string;
  isBilled: boolean;
  metadata?: any;
  createdAt: Date;
  updatedAt: Date;

  constructor(data: any) {
    this._id = data._id || `callrec_${Date.now()}`;
    this.callId = data.callId;
    this.callerId = data.callerId;
    this.receiverId = data.receiverId;
    this.destinationNumber = data.destinationNumber;
    this.callType = data.callType;
    this.status = data.status || 'INITIATED';
    this.startedAt = data.startedAt || new Date();
    this.answeredAt = data.answeredAt;
    this.endedAt = data.endedAt;
    this.durationSeconds = data.durationSeconds || 0;
    this.costPaise = data.costPaise || 0;
    this.endReason = data.endReason;
    this.isBilled = Boolean(data.isBilled);
    this.metadata = data.metadata;
    this.createdAt = data.createdAt || new Date();
    this.updatedAt = data.updatedAt || new Date();
  }

  async save() {
    this.updatedAt = new Date();
    const idx = memoryDb.callRecords.findIndex(c => c.callId === this.callId);
    if (idx >= 0) {
      memoryDb.callRecords[idx] = this;
    } else {
      memoryDb.callRecords.push(this);
    }
    return this;
  }

  async populate(field: string, selectFields?: string) {
    if (field === 'callerId') {
      const user = memoryDb.users.find(u => u._id?.toString() === this.callerId?.toString() || u._id === this.callerId);
      if (user) {
        this.callerId = {
          _id: user._id,
          fullName: user.fullName,
          username: user.username,
          email: user.email
        };
      }
    } else if (field === 'receiverId' && this.receiverId) {
      const user = memoryDb.users.find(u => u._id?.toString() === this.receiverId?.toString() || u._id === this.receiverId);
      if (user) {
        this.receiverId = {
          _id: user._id,
          fullName: user.fullName,
          username: user.username,
          email: user.email
        };
      }
    }
    return this;
  }
}

export const MemoryCallRecordOperations = {
  findOne: async (query: any) => {
    const record = memoryDb.callRecords.find(c => c.callId === query.callId);
    if (!record) return null;
    return new MemoryCallRecordDoc(record);
  },
  find: (query?: any) => {
    let list = [...memoryDb.callRecords];
    if (query?.status) {
      list = list.filter(c => c.status === query.status);
    }
    if (query?.$or) {
      list = list.filter(c =>
        query.$or.some((clause: any) => {
          if (clause.callerId) {
            const cid = clause.callerId.toString();
            return (c.callerId?._id?.toString() || c.callerId?.toString()) === cid;
          }
          if (clause.receiverId) {
            const rid = clause.receiverId.toString();
            return (c.receiverId?._id?.toString() || c.receiverId?.toString()) === rid;
          }
          return false;
        })
      );
    }

    const chainable = {
      select: () => chainable,
      sort: () => chainable,
      skip: (s: number) => {
        list = list.slice(s);
        return chainable;
      },
      limit: (l: number) => {
        list = list.slice(0, l);
        return chainable;
      },
      populate: () => chainable,
      then: async (resolve: any) => {
        const enriched = await Promise.all(
          list.map(async item => {
            const doc = new MemoryCallRecordDoc(item);
            await doc.populate('callerId');
            await doc.populate('receiverId');
            return doc;
          })
        );
        resolve(enriched);
      }
    };
    return chainable;
  },
  countDocuments: async () => memoryDb.callRecords.length
};

// In-Memory TransactionLedger Document Wrapper
export class MemoryLedgerDoc {
  _id: string;
  transactionId: string;
  userId: any;
  walletId: any;
  type: string;
  amountPaise: number;
  balanceBeforePaise: number;
  balanceAfterPaise: number;
  referenceId?: string;
  description: string;
  status: string;
  metadata?: any;
  createdAt: Date;
  updatedAt: Date;

  constructor(data: any) {
    this._id = data._id || `tx_${Date.now()}`;
    this.transactionId = data.transactionId;
    this.userId = data.userId;
    this.walletId = data.walletId;
    this.type = data.type;
    this.amountPaise = data.amountPaise;
    this.balanceBeforePaise = data.balanceBeforePaise;
    this.balanceAfterPaise = data.balanceAfterPaise;
    this.referenceId = data.referenceId;
    this.description = data.description;
    this.status = data.status || 'COMPLETED';
    this.metadata = data.metadata;
    this.createdAt = data.createdAt || new Date();
    this.updatedAt = data.updatedAt || new Date();
  }

  async save() {
    this.updatedAt = new Date();
    memoryDb.transactions.unshift(this);
    return this;
  }
}

export const MemoryLedgerOperations = {
  find: (query?: any) => {
    let list = [...memoryDb.transactions];
    if (query?.userId) {
      list = list.filter(t => t.userId?.toString() === query.userId?.toString());
    }
    const chainable = {
      sort: () => chainable,
      skip: (s: number) => {
        list = list.slice(s);
        return chainable;
      },
      limit: (l: number) => {
        list = list.slice(0, l);
        return chainable;
      },
      then: (resolve: any) => resolve(list.map(t => new MemoryLedgerDoc(t)))
    };
    return chainable;
  },
  countDocuments: async (query?: any) => {
    if (query?.userId) {
      return memoryDb.transactions.filter(t => t.userId?.toString() === query.userId?.toString()).length;
    }
    return memoryDb.transactions.length;
  },
  aggregate: async (pipeline: any[]) => {
    return [
      { _id: 'CREDIT_TOPUP', totalPaise: 50000, count: 1 }
    ];
  }
};

// In-Memory TelecomLog
export const MemoryTelecomLogOperations = {
  create: async (data: any) => {
    const entry = {
      _id: `telecom_${Date.now()}`,
      ...data,
      webhookEvents: [],
      createdAt: new Date(),
      updatedAt: new Date()
    };
    memoryDb.telecomLogs.push(entry);
    return entry;
  },
  findOneAndUpdate: async (query: any, update: any) => {
    const entry = memoryDb.telecomLogs.find(t => t.callId === query.callId);
    if (entry && update.status) {
      entry.status = update.status;
    }
    return entry || null;
  }
};

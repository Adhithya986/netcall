import bcrypt from 'bcryptjs';

// In-Memory Database Store for Fast Automated Testing
class MockDatabase {
  users: any[] = [];
  wallets: any[] = [];
  callRecords: any[] = [];
  transactions: any[] = [];
  telecomLogs: any[] = [];

  reset() {
    this.users = [];
    this.wallets = [];
    this.callRecords = [];
    this.transactions = [];
    this.telecomLogs = [];
  }
}

export const mockDb = new MockDatabase();

export class MockUserInstance {
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
    this._id = data._id || `user_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
    this.email = data.email;
    this.username = data.username;
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
    const existingIdx = mockDb.users.findIndex(u => u._id === this._id);
    if (existingIdx >= 0) {
      mockDb.users[existingIdx] = this;
    } else {
      mockDb.users.push(this);
    }
    return this;
  }

  async comparePassword(candidate: string) {
    return bcrypt.compare(candidate, this.passwordHash);
  }
}

export const MockUser = {
  create: async (data: any) => {
    const inst = new MockUserInstance(data);
    await inst.save();
    return inst;
  },
  findOne: async (query: any) => {
    if (query.$or) {
      const match = mockDb.users.find(u =>
        query.$or.some((clause: any) => {
          if (clause.email) return u.email.toLowerCase() === clause.email.toLowerCase();
          if (clause.username) return u.username.toLowerCase() === clause.username.toLowerCase();
          return false;
        })
      );
      return match || null;
    }
    if (query.email) return mockDb.users.find(u => u.email.toLowerCase() === query.email.toLowerCase()) || null;
    if (query.username) return mockDb.users.find(u => u.username.toLowerCase() === query.username.toLowerCase()) || null;
    return null;
  },
  findById: async (id: string) => {
    return mockDb.users.find(u => u._id === id || u._id.toString() === id.toString()) || null;
  },
  find: (query?: any) => {
    let result = [...mockDb.users];
    if (query?.status) {
      result = result.filter(u => u.status === query.status);
    }
    return {
      select: () => ({
        sort: () => ({
          skip: (skip: number) => ({
            limit: (limit: number) => result.slice(skip, skip + limit)
          }),
          limit: (limit: number) => result.slice(0, limit)
        }),
        limit: (limit: number) => result.slice(0, limit)
      }),
      sort: () => ({
        skip: (skip: number) => ({
          limit: (limit: number) => result.slice(skip, skip + limit)
        })
      })
    };
  },
  countDocuments: async (query?: any) => {
    return mockDb.users.length;
  },
  findByIdAndUpdate: (id: string, update: any, options?: any) => {
    const user = mockDb.users.find(u => u._id === id || u._id.toString() === id.toString());
    if (user && update.status) {
      user.status = update.status;
    }
    return {
      select: async () => user,
      then: (resolve: any) => resolve(user)
    };
  }
};

export class MockWalletInstance {
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
    this.createdAt = new Date();
    this.updatedAt = new Date();
  }

  async save() {
    const existingIdx = mockDb.wallets.findIndex(w => w.userId?.toString() === this.userId?.toString());
    if (existingIdx >= 0) {
      mockDb.wallets[existingIdx] = this;
    } else {
      mockDb.wallets.push(this);
    }
    return this;
  }
}

export const MockWallet = {
  findOne: async (query: any) => {
    const targetUserId = query.userId?.toString();
    const w = mockDb.wallets.find(w => w.userId?.toString() === targetUserId);
    return w || null;
  },
  find: async (query: any) => {
    if (query?.userId?.$in) {
      const ids = query.userId.$in.map((id: any) => id.toString());
      return mockDb.wallets.filter(w => ids.includes(w.userId?.toString()));
    }
    return mockDb.wallets;
  }
};

export class MockCallRecordInstance {
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
    this.durationSeconds = data.durationSeconds || 0;
    this.costPaise = data.costPaise || 0;
    this.isBilled = Boolean(data.isBilled);
    this.createdAt = new Date();
    this.updatedAt = new Date();
  }

  async save() {
    const existingIdx = mockDb.callRecords.findIndex(c => c.callId === this.callId);
    if (existingIdx >= 0) {
      mockDb.callRecords[existingIdx] = this;
    } else {
      mockDb.callRecords.push(this);
    }
    return this;
  }

  async populate(field: string, selectFields: string) {
    if (field === 'callerId') {
      const user = mockDb.users.find(u => u._id?.toString() === this.callerId?.toString() || u._id === this.callerId);
      if (user) {
        this.callerId = {
          _id: user._id,
          fullName: user.fullName,
          username: user.username,
          email: user.email
        };
      }
    } else if (field === 'receiverId' && this.receiverId) {
      const user = mockDb.users.find(u => u._id?.toString() === this.receiverId?.toString() || u._id === this.receiverId);
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

export const MockCallRecord = {
  findOne: async (query: any) => {
    const record = mockDb.callRecords.find(c => c.callId === query.callId);
    if (!record) return null;
    return record;
  },
  find: (query?: any) => {
    let list = [...mockDb.callRecords];
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
      select: () => list,
      sort: () => chainable,
      skip: () => chainable,
      limit: () => chainable,
      populate: () => chainable,
      then: (resolve: any) => resolve(list)
    };
    return chainable;
  },
  countDocuments: async () => mockDb.callRecords.length
};

export class MockLedgerInstance {
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
    this.createdAt = new Date();
    this.updatedAt = new Date();
  }

  async save() {
    mockDb.transactions.unshift(this);
    return this;
  }
}

export const MockTransactionLedger = {
  find: (query?: any) => {
    let list = [...mockDb.transactions];
    if (query?.userId) {
      list = list.filter(t => t.userId?.toString() === query.userId?.toString());
    }
    return {
      sort: () => ({
        skip: (skip: number) => ({
          limit: (limit: number) => list.slice(skip, skip + limit)
        })
      })
    };
  },
  countDocuments: async (query?: any) => {
    if (query?.userId) {
      return mockDb.transactions.filter(t => t.userId?.toString() === query.userId?.toString()).length;
    }
    return mockDb.transactions.length;
  },
  aggregate: async (pipeline: any[]) => {
    return [
      { _id: 'CREDIT_TOPUP', totalPaise: 50000, count: 1 }
    ];
  }
};

export const MockTelecomLog = {
  create: async (data: any) => {
    const entry = {
      _id: `telecom_${Date.now()}`,
      ...data,
      webhookEvents: [],
      createdAt: new Date(),
      updatedAt: new Date()
    };
    mockDb.telecomLogs.push(entry);
    return entry;
  },
  findOneAndUpdate: async (query: any, update: any) => {
    const entry = mockDb.telecomLogs.find(t => t.callId === query.callId);
    if (entry && update.status) {
      entry.status = update.status;
    }
    return entry || null;
  }
};

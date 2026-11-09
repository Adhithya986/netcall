import { beforeAll, afterAll, beforeEach, vi } from 'vitest';
import {
  mockDb,
  MockUserInstance,
  MockUser,
  MockWalletInstance,
  MockWallet,
  MockCallRecordInstance,
  MockCallRecord,
  MockLedgerInstance,
  MockTransactionLedger,
  MockTelecomLog
} from './mocks/dbMock';

process.env.NODE_ENV = 'test';
process.env.JWT_ACCESS_SECRET = 'test_access_secret_32_characters_long!';
process.env.JWT_REFRESH_SECRET = 'test_refresh_secret_32_characters_long!';

// Mock DB connection so it never attempts to download MongoMemoryServer
vi.mock('../src/db/connection', () => ({
  connectDB: vi.fn().mockResolvedValue({}),
  disconnectDB: vi.fn().mockResolvedValue({})
}));

// Mock Models with Constructor + Statics
function UserModel(data: any) {
  return new MockUserInstance(data);
}
Object.assign(UserModel, MockUser);

function WalletModel(data: any) {
  return new MockWalletInstance(data);
}
Object.assign(WalletModel, MockWallet);

function CallRecordModel(data: any) {
  return new MockCallRecordInstance(data);
}
Object.assign(CallRecordModel, MockCallRecord);

function TransactionLedgerModel(data: any) {
  return new MockLedgerInstance(data);
}
Object.assign(TransactionLedgerModel, MockTransactionLedger);

function TelecomLogModel(data: any) {
  return MockTelecomLog.create(data);
}
Object.assign(TelecomLogModel, MockTelecomLog);

vi.mock('../src/models/User', () => ({
  User: UserModel
}));

vi.mock('../src/models/Wallet', () => ({
  Wallet: WalletModel
}));

vi.mock('../src/models/CallRecord', () => ({
  CallRecord: CallRecordModel
}));

vi.mock('../src/models/TransactionLedger', () => ({
  TransactionLedger: TransactionLedgerModel
}));

vi.mock('../src/models/TelecomLog', () => ({
  TelecomLog: TelecomLogModel
}));

beforeEach(() => {
  mockDb.reset();
});

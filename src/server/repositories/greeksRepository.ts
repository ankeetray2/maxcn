import fs from 'fs';
import path from 'path';
import { MongoClient, Db, Collection, ObjectId } from 'mongodb';
import { CreateGreekRecordDTO, GreekRecordDocument } from '../models/GreekRecord';

export interface IGreeksRepository {
  create(record: CreateGreekRecordDTO): Promise<GreekRecordDocument>;
  findById(id: string): Promise<GreekRecordDocument | null>;
  findAll(limit?: number, commodity?: string): Promise<GreekRecordDocument[]>;
  deleteById(id: string): Promise<boolean>;
  count(): Promise<number>;
  getStatus(): { connected: boolean; driver: 'mongodb' | 'local_persistent'; storagePath?: string };
}

/**
 * MongoDB-backed Repository Implementation
 */
export class MongoGreeksRepository implements IGreeksRepository {
  private client: MongoClient | null = null;
  private db: Db | null = null;
  private collection: Collection<any> | null = null;
  private uri: string;
  private dbName: string;
  private isConnected = false;

  constructor(uri: string, dbName: string = 'commodity_greeks') {
    this.uri = uri;
    this.dbName = dbName;
  }

  async connect(): Promise<boolean> {
    try {
      this.client = new MongoClient(this.uri, {
        serverSelectionTimeoutMS: 2000,
        connectTimeoutMS: 2000
      });
      await this.client.connect();
      this.db = this.client.db(this.dbName);
      this.collection = this.db.collection('greek_records');
      // Create indexes for efficient querying
      await this.collection.createIndex({ commodity: 1, createdAt: -1 });
      this.isConnected = true;
      console.log('Successfully connected to MongoDB cluster for Greeks repository');
      return true;
    } catch (err: any) {
      console.warn('MongoDB connection unavailable, using resilient fallback store:', err.message);
      this.isConnected = false;
      return false;
    }
  }

  async create(record: CreateGreekRecordDTO): Promise<GreekRecordDocument> {
    if (!this.isConnected || !this.collection) {
      throw new Error('MongoDB not connected');
    }
    const doc = {
      ...record,
      createdAt: record.createdAt ? new Date(record.createdAt) : new Date()
    };
    const result = await this.collection.insertOne(doc);
    return {
      ...doc,
      _id: result.insertedId.toString(),
      id: result.insertedId.toString()
    } as GreekRecordDocument;
  }

  async findById(id: string): Promise<GreekRecordDocument | null> {
    if (!this.isConnected || !this.collection) return null;
    try {
      const objId = ObjectId.isValid(id) ? new ObjectId(id) : null;
      const query = objId ? { _id: objId } : { id };
      const doc = await this.collection.findOne(query);
      if (!doc) return null;
      return {
        ...doc,
        _id: doc._id.toString(),
        id: doc._id.toString()
      } as GreekRecordDocument;
    } catch {
      return null;
    }
  }

  async findAll(limit: number = 50, commodity?: string): Promise<GreekRecordDocument[]> {
    if (!this.isConnected || !this.collection) return [];
    const query: any = {};
    if (commodity && commodity !== 'ALL') {
      query.commodity = commodity.toUpperCase();
    }
    const cursor = this.collection.find(query).sort({ createdAt: -1 }).limit(limit);
    const docs = await cursor.toArray();
    return docs.map((doc) => ({
      ...doc,
      _id: doc._id.toString(),
      id: doc._id.toString()
    })) as GreekRecordDocument[];
  }

  async deleteById(id: string): Promise<boolean> {
    if (!this.isConnected || !this.collection) return false;
    try {
      const objId = ObjectId.isValid(id) ? new ObjectId(id) : null;
      const query = objId ? { _id: objId } : { id };
      const result = await this.collection.deleteOne(query);
      return result.deletedCount > 0;
    } catch {
      return false;
    }
  }

  async count(): Promise<number> {
    if (!this.isConnected || !this.collection) return 0;
    return await this.collection.countDocuments();
  }

  getStatus() {
    return {
      connected: this.isConnected,
      driver: 'mongodb' as const
    };
  }
}

/**
 * Resilient Local / In-Memory JSON Database Repository
 * Strictly mirrors the MongoDB document schema and persists locally to disk.
 * Guarantees zero downtime in sandbox/container environments.
 */
export class LocalGreeksRepository implements IGreeksRepository {
  private records: GreekRecordDocument[] = [];
  private filePath: string;

  constructor() {
    const dataDir = path.join(process.cwd(), '.data');
    if (!fs.existsSync(dataDir)) {
      try {
        fs.mkdirSync(dataDir, { recursive: true });
      } catch {
        // Fallback to memory
      }
    }
    this.filePath = path.join(dataDir, 'greeks_history.json');
    this.loadFromDisk();
    this.seedDefaultsIfEmpty();
  }

  private loadFromDisk() {
    try {
      if (fs.existsSync(this.filePath)) {
        const raw = fs.readFileSync(this.filePath, 'utf-8');
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          this.records = parsed.map((item) => ({
            ...item,
            createdAt: new Date(item.createdAt)
          }));
        }
      }
    } catch (e) {
      console.warn('Failed to load local greeks store from disk, initializing in memory:', e);
      this.records = [];
    }
  }

  private persistToDisk() {
    try {
      fs.writeFileSync(this.filePath, JSON.stringify(this.records, null, 2), 'utf-8');
    } catch {
      // Ignored if file write restricted
    }
  }

  private seedDefaultsIfEmpty() {
    if (this.records.length === 0) {
      const sampleSeeds: CreateGreekRecordDTO[] = [
        {
          commodity: 'GOLD',
          spotPrice: 78500,
          strikePrice: 79000,
          optionType: 'CALL',
          volatility: 15.4,
          expiry: '2026-10-25',
          delta: 0.461250,
          gamma: 0.000105,
          theta: -18.254100,
          vega: 58.420100,
          rho: 24.120500,
          premium: 1420.50,
          lots: 2,
          lotSize: 100,
          pnl: 0,
          notes: 'Standard MCX Gold Call hedge'
        },
        {
          commodity: 'SILVER',
          spotPrice: 93200,
          strikePrice: 92000,
          optionType: 'PUT',
          volatility: 23.8,
          expiry: '2026-10-20',
          delta: -0.428500,
          gamma: 0.000072,
          theta: -26.850000,
          vega: 79.150000,
          rho: -21.450000,
          premium: 2150.00,
          lots: 1,
          lotSize: 30,
          pnl: 0,
          notes: 'Silver 30kg put protection'
        },
        {
          commodity: 'CRUDEOIL',
          spotPrice: 6240,
          strikePrice: 6200,
          optionType: 'CALL',
          volatility: 32.5,
          expiry: '2026-10-15',
          delta: 0.548200,
          gamma: 0.001240,
          theta: -7.850000,
          vega: 12.340000,
          rho: 2.450000,
          premium: 210.50,
          lots: 5,
          lotSize: 100,
          pnl: 4500,
          notes: 'Crude 100 bbl ATM Call Bull Spread leg'
        },
        {
          commodity: 'NATURALGAS',
          spotPrice: 252.4,
          strikePrice: 260.0,
          optionType: 'CALL',
          volatility: 44.6,
          expiry: '2026-09-30',
          delta: 0.384500,
          gamma: 0.024500,
          theta: -1.250000,
          vega: 1.840000,
          rho: 0.120000,
          premium: 11.20,
          lots: 3,
          lotSize: 1250,
          pnl: -1250,
          notes: 'NatGas winter volatility play'
        },
        {
          commodity: 'COPPER',
          spotPrice: 865.5,
          strikePrice: 860.0,
          optionType: 'CALL',
          volatility: 19.8,
          expiry: '2026-10-28',
          delta: 0.584100,
          gamma: 0.006200,
          theta: -0.920000,
          vega: 2.150000,
          rho: 0.480000,
          premium: 28.40,
          lots: 1,
          lotSize: 2500,
          pnl: 1800,
          notes: 'Copper 2500 kg physical hedging contract'
        }
      ];

      for (const s of sampleSeeds) {
        this.create(s);
      }
    }
  }

  async create(record: CreateGreekRecordDTO): Promise<GreekRecordDocument> {
    const id = 'mongo_' + Math.random().toString(36).substring(2, 9) + Date.now().toString(36);
    const doc: GreekRecordDocument = {
      ...record,
      _id: id,
      id,
      createdAt: record.createdAt ? new Date(record.createdAt) : new Date()
    };
    this.records.unshift(doc);
    this.persistToDisk();
    return doc;
  }

  async findById(id: string): Promise<GreekRecordDocument | null> {
    const found = this.records.find((r) => r.id === id || r._id === id);
    return found || null;
  }

  async findAll(limit: number = 50, commodity?: string): Promise<GreekRecordDocument[]> {
    let list = this.records;
    if (commodity && commodity !== 'ALL') {
      list = list.filter((r) => r.commodity.toUpperCase() === commodity.toUpperCase());
    }
    return list.slice(0, limit);
  }

  async deleteById(id: string): Promise<boolean> {
    const initialLen = this.records.length;
    this.records = this.records.filter((r) => r.id !== id && r._id !== id);
    const deleted = this.records.length < initialLen;
    if (deleted) {
      this.persistToDisk();
    }
    return deleted;
  }

  async count(): Promise<number> {
    return this.records.length;
  }

  getStatus() {
    return {
      connected: true,
      driver: 'local_persistent' as const,
      storagePath: this.filePath
    };
  }
}

// Global Repository Singleton instance
let repositoryInstance: IGreeksRepository | null = null;

export async function getGreeksRepository(): Promise<IGreeksRepository> {
  if (repositoryInstance) {
    return repositoryInstance;
  }

  const mongoUri = process.env.MONGODB_URI;
  if (mongoUri) {
    const mongoRepo = new MongoGreeksRepository(mongoUri);
    const connected = await mongoRepo.connect();
    if (connected) {
      repositoryInstance = mongoRepo;
      return repositoryInstance;
    }
  }

  // Fallback to resilient local JSON store
  repositoryInstance = new LocalGreeksRepository();
  return repositoryInstance;
}

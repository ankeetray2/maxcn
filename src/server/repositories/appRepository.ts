import fs from 'fs';
import path from 'path';
import { MongoClient, Db, Collection, ObjectId } from 'mongodb';
import {
  UserDocument,
  UploadDocument,
  OptionChainDocument,
  GreeksHistoryDocument,
  AnalyticsDocument,
  PriceHistoryDocument,
  ScenarioAnalysisDocument,
  GreekCalculationDocument
} from '../models/AppCollections';

export interface IAppRepository {
  saveUser(user: Partial<UserDocument>): Promise<UserDocument>;
  findUserByEmail(email: string): Promise<UserDocument | null>;
  getUserById(id: string): Promise<UserDocument | null>;
  saveUpload(upload: Omit<UploadDocument, 'id' | 'createdAt'>): Promise<UploadDocument>;
  getUploads(limit?: number): Promise<UploadDocument[]>;
  getUploadById(id: string): Promise<UploadDocument | null>;
  saveOptionChain(doc: Omit<OptionChainDocument, 'id' | 'createdAt'>): Promise<OptionChainDocument>;
  getLatestOptionChain(commodity?: string): Promise<OptionChainDocument | null>;
  saveGreeksHistory(records: Array<Omit<GreeksHistoryDocument, 'id' | 'createdAt'>>): Promise<number>;
  getGreeksHistory(limit?: number, commodity?: string): Promise<GreeksHistoryDocument[]>;
  saveAnalytics(analytics: Omit<AnalyticsDocument, 'id' | 'createdAt'>): Promise<AnalyticsDocument>;
  getLatestAnalytics(commodity?: string): Promise<AnalyticsDocument | null>;
  getAllAnalytics(limit?: number): Promise<AnalyticsDocument[]>;
  savePriceHistory(record: Omit<PriceHistoryDocument, 'id' | 'createdAt'>): Promise<PriceHistoryDocument>;
  getLatestPrice(commodity?: string): Promise<PriceHistoryDocument | null>;
  getPriceHistory(limit?: number, commodity?: string): Promise<PriceHistoryDocument[]>;
  saveScenarioAnalysis(record: Omit<ScenarioAnalysisDocument, 'id' | 'createdAt'>): Promise<ScenarioAnalysisDocument>;
  getScenarioAnalyses(limit?: number, commodity?: string): Promise<ScenarioAnalysisDocument[]>;
  saveGreekCalculation(record: Omit<GreekCalculationDocument, 'id' | 'createdAt'>): Promise<GreekCalculationDocument>;
  getGreekCalculations(limit?: number, commodity?: string): Promise<GreekCalculationDocument[]>;
  deleteUpload(id: string): Promise<boolean>;
  saveStructuredUpload(payload: any): Promise<any>;
  getStatus(): { connected: boolean; driver: 'mongodb' | 'local_persistent'; collections: string[] };
}

export class MongoAppRepository implements IAppRepository {
  private client: MongoClient | null = null;
  private db: Db | null = null;
  private isConnected = false;
  private uri: string;
  private dbName: string;

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
      this.isConnected = true;
      console.log('Successfully connected to MongoDB cluster for AppCollections');
      return true;
    } catch (err: any) {
      console.warn('MongoDB unreachable, using persistent local fallback storage:', err.message);
      this.isConnected = false;
      return false;
    }
  }

  async saveUser(user: Partial<UserDocument>): Promise<UserDocument> {
    if (!this.isConnected || !this.db) throw new Error('MongoDB not connected');
    const doc: any = {
      username: user.username || (user.email ? user.email.split('@')[0] : 'trader_' + Math.random().toString(36).substring(7)),
      name: user.name || user.username || 'MCX Trader',
      email: user.email || 'trader@mcx.pro',
      avatar: user.avatar || '',
      role: user.role || 'trader',
      authProvider: user.authProvider || 'google',
      passwordHash: user.passwordHash || '',
      createdAt: user.createdAt || new Date()
    };
    const res = await this.db.collection('users').insertOne(doc);
    return { ...doc, id: res.insertedId.toString(), _id: res.insertedId.toString() };
  }

  async findUserByEmail(email: string): Promise<UserDocument | null> {
    if (!this.isConnected || !this.db) return null;
    const doc: any = await this.db.collection('users').findOne({ email: email.toLowerCase() });
    if (!doc) return null;
    return { ...doc, id: doc._id?.toString() || doc.id };
  }

  async getUserById(id: string): Promise<UserDocument | null> {
    if (!this.isConnected || !this.db) return null;
    try {
      const query: any = ObjectId.isValid(id)
        ? { $or: [{ id }, { _id: new ObjectId(id) }] }
        : { id };
      const doc: any = await this.db.collection('users').findOne(query);
      if (!doc) return null;
      return { ...doc, id: doc._id?.toString() || doc.id };
    } catch {
      return null;
    }
  }

  async saveUpload(upload: Omit<UploadDocument, 'id' | 'createdAt'>): Promise<UploadDocument> {
    if (!this.isConnected || !this.db) throw new Error('MongoDB not connected');
    const doc: any = { ...upload, createdAt: new Date() };
    delete doc._id;
    delete doc.id;
    const res = await this.db.collection('uploads').insertOne(doc);
    return { ...doc, id: res.insertedId.toString(), _id: res.insertedId.toString() };
  }

  async getUploads(limit: number = 20): Promise<UploadDocument[]> {
    if (!this.isConnected || !this.db) return [];
    const docs = await this.db.collection('uploads').find().sort({ createdAt: -1 }).limit(limit).toArray();
    return docs.map(d => ({ ...d, id: d._id.toString() } as unknown as UploadDocument));
  }

  async getUploadById(id: string): Promise<UploadDocument | null> {
    if (!this.isConnected || !this.db) return null;
    try {
      const q = ObjectId.isValid(id) ? { _id: new ObjectId(id) } : { id };
      const doc = await this.db.collection('uploads').findOne(q);
      return doc ? ({ ...doc, id: doc._id.toString() } as unknown as UploadDocument) : null;
    } catch {
      return null;
    }
  }

  async saveOptionChain(doc: Omit<OptionChainDocument, 'id' | 'createdAt'>): Promise<OptionChainDocument> {
    if (!this.isConnected || !this.db) throw new Error('MongoDB not connected');
    const payload: any = { ...doc, createdAt: new Date() };
    delete payload._id;
    delete payload.id;
    const res = await this.db.collection('optionChains').insertOne(payload);
    return { ...payload, id: res.insertedId.toString(), _id: res.insertedId.toString() };
  }

  async getLatestOptionChain(commodity?: string): Promise<OptionChainDocument | null> {
    if (!this.isConnected || !this.db) return null;
    const q = commodity && commodity !== 'ALL' ? { commodity: new RegExp(commodity, 'i') } : {};
    const doc = await this.db.collection('optionChains').find(q).sort({ createdAt: -1 }).limit(1).toArray();
    return doc.length > 0 ? ({ ...doc[0], id: doc[0]._id.toString() } as unknown as OptionChainDocument) : null;
  }

  async saveGreeksHistory(records: Array<Omit<GreeksHistoryDocument, 'id' | 'createdAt'>>): Promise<number> {
    if (!this.isConnected || !this.db || records.length === 0) return 0;
    const docs: any[] = records.map(r => {
      const copy: any = { ...r, createdAt: new Date() };
      delete copy._id;
      delete copy.id;
      return copy;
    });
    const res = await this.db.collection('greeksHistory').insertMany(docs);
    return res.insertedCount;
  }

  async getGreeksHistory(limit: number = 50, commodity?: string): Promise<GreeksHistoryDocument[]> {
    if (!this.isConnected || !this.db) return [];
    const q = commodity && commodity !== 'ALL' ? { commodity: new RegExp(commodity, 'i') } : {};
    const docs = await this.db.collection('greeksHistory').find(q).sort({ createdAt: -1 }).limit(limit).toArray();
    return docs.map(d => ({ ...d, id: d._id.toString() } as unknown as GreeksHistoryDocument));
  }

  async saveAnalytics(analytics: Omit<AnalyticsDocument, 'id' | 'createdAt'>): Promise<AnalyticsDocument> {
    if (!this.isConnected || !this.db) throw new Error('MongoDB not connected');
    const payload: any = { ...analytics, createdAt: new Date() };
    delete payload._id;
    delete payload.id;
    const res = await this.db.collection('analytics').insertOne(payload);
    return { ...payload, id: res.insertedId.toString(), _id: res.insertedId.toString() };
  }

  async getLatestAnalytics(commodity?: string): Promise<AnalyticsDocument | null> {
    if (!this.isConnected || !this.db) return null;
    const q = commodity && commodity !== 'ALL' ? { commodity: new RegExp(commodity, 'i') } : {};
    const doc = await this.db.collection('analytics').find(q).sort({ createdAt: -1 }).limit(1).toArray();
    return doc.length > 0 ? ({ ...doc[0], id: doc[0]._id.toString() } as unknown as AnalyticsDocument) : null;
  }

  async getAllAnalytics(limit: number = 20): Promise<AnalyticsDocument[]> {
    if (!this.isConnected || !this.db) return [];
    const docs = await this.db.collection('analytics').find().sort({ createdAt: -1 }).limit(limit).toArray();
    return docs.map(d => ({ ...d, id: d._id.toString() } as unknown as AnalyticsDocument));
  }

  async savePriceHistory(record: Omit<PriceHistoryDocument, 'id' | 'createdAt'>): Promise<PriceHistoryDocument> {
    if (!this.isConnected || !this.db) throw new Error('MongoDB not connected');
    const payload: any = { ...record, createdAt: new Date() };
    delete payload._id;
    delete payload.id;
    const res = await this.db.collection('priceHistory').insertOne(payload);
    return { ...payload, id: res.insertedId.toString(), _id: res.insertedId.toString() };
  }

  async getLatestPrice(commodity?: string): Promise<PriceHistoryDocument | null> {
    if (!this.isConnected || !this.db) return null;
    const q = commodity && commodity !== 'ALL' ? { commodity: new RegExp(commodity, 'i') } : {};
    const doc = await this.db.collection('priceHistory').find(q).sort({ createdAt: -1 }).limit(1).toArray();
    return doc.length > 0 ? ({ ...doc[0], id: doc[0]._id.toString() } as unknown as PriceHistoryDocument) : null;
  }

  async getPriceHistory(limit: number = 100, commodity?: string): Promise<PriceHistoryDocument[]> {
    if (!this.isConnected || !this.db) return [];
    const q = commodity && commodity !== 'ALL' ? { commodity: new RegExp(commodity, 'i') } : {};
    const docs = await this.db.collection('priceHistory').find(q).sort({ createdAt: -1 }).limit(limit).toArray();
    return docs.map(d => ({ ...d, id: d._id.toString() } as unknown as PriceHistoryDocument));
  }

  async deleteUpload(id: string): Promise<boolean> {
    if (!this.isConnected || !this.db) return false;
    try {
      const q = ObjectId.isValid(id) ? { _id: new ObjectId(id) } : { id };
      const res = await this.db.collection('uploads').deleteOne(q);
      return (res.deletedCount || 0) > 0;
    } catch {
      return false;
    }
  }

  async saveStructuredUpload(payload: any): Promise<any> {
    if (!this.isConnected || !this.db) throw new Error('MongoDB not connected');
    const doc: any = {
      uploadId: payload.uploadId || 'upl_' + Date.now(),
      uploadType: payload.uploadType || 'Option Chain Screenshot',
      commodity: payload.commodity || 'GOLD',
      expiry: payload.expiry || '2025-10-05',
      spotPrice: Number(payload.spotPrice) || 0,
      optionChainData: payload.optionChainData || [],
      greekData: payload.greekData || {},
      extractedText: payload.extractedText || '',
      uploadDate: payload.uploadDate || new Date(),
      createdAt: new Date()
    };
    const res = await this.db.collection('uploads').insertOne(doc);
    return { ...doc, id: res.insertedId.toString(), _id: res.insertedId.toString() };
  }

  async saveScenarioAnalysis(record: Omit<ScenarioAnalysisDocument, 'id' | 'createdAt'>): Promise<ScenarioAnalysisDocument> {
    if (!this.isConnected || !this.db) throw new Error('MongoDB not connected');
    const doc: any = {
      ...record,
      createdAt: new Date()
    };
    delete doc._id;
    delete doc.id;
    const res = await this.db.collection('scenarioAnalysis').insertOne(doc);
    return { ...doc, id: res.insertedId.toString(), _id: res.insertedId.toString() };
  }

  async getScenarioAnalyses(limit: number = 50, commodity?: string): Promise<ScenarioAnalysisDocument[]> {
    if (!this.isConnected || !this.db) return [];
    const q = commodity && commodity !== 'ALL' ? { commodity: new RegExp(commodity, 'i') } : {};
    const docs = await this.db.collection('scenarioAnalysis').find(q).sort({ createdAt: -1 }).limit(limit).toArray();
    return docs.map(d => ({ ...d, id: d._id.toString() } as unknown as ScenarioAnalysisDocument));
  }

  async saveGreekCalculation(record: Omit<GreekCalculationDocument, 'id' | 'createdAt'>): Promise<GreekCalculationDocument> {
    if (!this.isConnected || !this.db) throw new Error('MongoDB not connected');
    const doc: any = {
      ...record,
      createdAt: new Date()
    };
    delete doc._id;
    delete doc.id;
    const res = await this.db.collection('greekCalculations').insertOne(doc);
    return { ...doc, id: res.insertedId.toString(), _id: res.insertedId.toString() };
  }

  async getGreekCalculations(limit: number = 50, commodity?: string): Promise<GreekCalculationDocument[]> {
    if (!this.isConnected || !this.db) return [];
    const q = commodity && commodity !== 'ALL' ? { commodity: new RegExp(commodity, 'i') } : {};
    const docs = await this.db.collection('greekCalculations').find(q).sort({ createdAt: -1 }).limit(limit).toArray();
    return docs.map(d => ({ ...d, id: d._id.toString() } as unknown as GreekCalculationDocument));
  }

  getStatus() {
    return {
      connected: this.isConnected,
      driver: 'mongodb' as const,
      collections: ['users', 'uploads', 'optionChains', 'greeksHistory', 'analytics', 'priceHistory', 'scenarioAnalysis', 'greekCalculations']
    };
  }
}

export class LocalAppRepository implements IAppRepository {
  private baseDir: string;
  private users: UserDocument[] = [];
  private uploads: UploadDocument[] = [];
  private optionChains: OptionChainDocument[] = [];
  private greeksHistory: GreeksHistoryDocument[] = [];
  private analytics: AnalyticsDocument[] = [];
  private priceHistory: PriceHistoryDocument[] = [];
  private scenarioAnalyses: ScenarioAnalysisDocument[] = [];
  private greekCalculations: GreekCalculationDocument[] = [];

  constructor() {
    this.baseDir = path.join(process.cwd(), '.data');
    if (!fs.existsSync(this.baseDir)) {
      try {
        fs.mkdirSync(this.baseDir, { recursive: true });
      } catch {}
    }
    this.loadCollection('users', (data) => (this.users = data));
    this.loadCollection('uploads', (data) => (this.uploads = data));
    this.loadCollection('optionChains', (data) => (this.optionChains = data));
    this.loadCollection('greeksHistory', (data) => (this.greeksHistory = data));
    this.loadCollection('analytics', (data) => (this.analytics = data));
    this.loadCollection('priceHistory', (data) => (this.priceHistory = data));
    this.loadCollection('scenarioAnalysis', (data) => (this.scenarioAnalyses = data));
    this.loadCollection('greekCalculations', (data) => (this.greekCalculations = data));

    // Seed realistic Gold Mini price history if empty
    if (this.priceHistory.length === 0) {
      this.seedInitialPriceHistory();
    }
  }

  private seedInitialPriceHistory() {
    const baseDate = new Date();
    const seeds: PriceHistoryDocument[] = [
      {
        id: 'prc_init_1',
        commodity: 'Gold Mini',
        currentPrice: 153330,
        open: 153346,
        high: 153346,
        low: 153305,
        close: 153330,
        source: 'screenshot',
        createdAt: new Date(baseDate.getTime() - 2 * 60 * 1000)
      },
      {
        id: 'prc_init_2',
        commodity: 'Gold Mini',
        currentPrice: 153280,
        open: 153250,
        high: 153310,
        low: 153220,
        close: 153280,
        source: 'manual',
        createdAt: new Date(baseDate.getTime() - 15 * 60 * 1000)
      },
      {
        id: 'prc_init_3',
        commodity: 'Gold Mini',
        currentPrice: 153219,
        open: 153180,
        high: 153260,
        low: 153150,
        close: 153219,
        source: 'option-chain',
        createdAt: new Date(baseDate.getTime() - 45 * 60 * 1000)
      },
      {
        id: 'prc_init_4',
        commodity: 'Gold Mini',
        currentPrice: 153120,
        open: 153050,
        high: 153150,
        low: 153020,
        close: 153120,
        source: 'manual',
        createdAt: new Date(baseDate.getTime() - 90 * 60 * 1000)
      },
      {
        id: 'prc_init_5',
        commodity: 'Gold Mini',
        currentPrice: 153040,
        open: 152980,
        high: 153090,
        low: 152940,
        close: 153040,
        source: 'csv',
        createdAt: new Date(baseDate.getTime() - 180 * 60 * 1000)
      }
    ];
    this.priceHistory = seeds;
    this.persistCollection('priceHistory', this.priceHistory);
  }

  private loadCollection(name: string, setter: (data: any[]) => void) {
    try {
      const file = path.join(this.baseDir, `${name}.json`);
      if (fs.existsSync(file)) {
        const raw = fs.readFileSync(file, 'utf-8');
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          setter(parsed.map(item => ({ ...item, createdAt: new Date(item.createdAt) })));
        }
      }
    } catch {}
  }

  private persistCollection(name: string, data: any[]) {
    try {
      const file = path.join(this.baseDir, `${name}.json`);
      fs.writeFileSync(file, JSON.stringify(data, null, 2), 'utf-8');
    } catch {}
  }

  async saveUser(user: Partial<UserDocument>): Promise<UserDocument> {
    const doc: UserDocument = {
      id: user.id || 'usr_' + Date.now() + '_' + Math.random().toString(36).substring(7),
      username: user.username || (user.email ? user.email.split('@')[0] : 'trader_' + Math.random().toString(36).substring(7)),
      name: user.name || user.username || 'MCX Trader',
      email: (user.email || 'trader@mcx.pro').toLowerCase(),
      avatar: user.avatar || '',
      role: user.role || 'trader',
      authProvider: user.authProvider || 'google',
      passwordHash: user.passwordHash || '',
      createdAt: user.createdAt || new Date()
    };
    this.users.unshift(doc);
    this.persistCollection('users', this.users);
    return doc;
  }

  async findUserByEmail(email: string): Promise<UserDocument | null> {
    const target = email.toLowerCase().trim();
    const found = this.users.find(u => u.email?.toLowerCase() === target);
    return found || null;
  }

  async getUserById(id: string): Promise<UserDocument | null> {
    const found = this.users.find(u => u.id === id || u._id === id);
    return found || null;
  }

  async saveUpload(upload: Omit<UploadDocument, 'id' | 'createdAt'>): Promise<UploadDocument> {
    const doc: UploadDocument = {
      ...upload,
      id: 'upl_' + Date.now() + '_' + Math.random().toString(36).substring(7),
      createdAt: new Date()
    };
    this.uploads.unshift(doc);
    this.persistCollection('uploads', this.uploads);
    return doc;
  }

  async getUploads(limit: number = 20): Promise<UploadDocument[]> {
    return this.uploads.slice(0, limit);
  }

  async getUploadById(id: string): Promise<UploadDocument | null> {
    return this.uploads.find(u => u.id === id || u._id === id) || null;
  }

  async deleteUpload(id: string): Promise<boolean> {
    const initialLen = this.uploads.length;
    this.uploads = this.uploads.filter(u => u.id !== id && u._id !== id && (u as any).uploadId !== id);
    if (this.uploads.length !== initialLen) {
      this.persistCollection('uploads', this.uploads);
      return true;
    }
    return false;
  }

  async saveStructuredUpload(payload: any): Promise<any> {
    const doc: any = {
      uploadId: payload.uploadId || 'upl_' + Date.now(),
      uploadType: payload.uploadType || 'Option Chain Screenshot',
      commodity: payload.commodity || 'GOLD',
      expiry: payload.expiry || '2025-10-05',
      spotPrice: Number(payload.spotPrice) || 0,
      optionChainData: payload.optionChainData || [],
      greekData: payload.greekData || {},
      extractedText: payload.extractedText || '',
      uploadDate: payload.uploadDate || new Date(),
      id: payload.uploadId || 'upl_' + Date.now(),
      _id: payload.uploadId || 'upl_' + Date.now(),
      filename: payload.uploadType || 'Upload',
      createdAt: new Date()
    };
    this.uploads.unshift(doc);
    this.persistCollection('uploads', this.uploads);
    return doc;
  }

  async saveOptionChain(doc: Omit<OptionChainDocument, 'id' | 'createdAt'>): Promise<OptionChainDocument> {
    const record: OptionChainDocument = {
      ...doc,
      id: 'opt_' + Date.now() + '_' + Math.random().toString(36).substring(7),
      createdAt: new Date()
    };
    this.optionChains.unshift(record);
    this.persistCollection('optionChains', this.optionChains);
    return record;
  }

  async getLatestOptionChain(commodity?: string): Promise<OptionChainDocument | null> {
    if (commodity && commodity !== 'ALL') {
      const match = this.optionChains.find(o => o.commodity.toLowerCase().includes(commodity.toLowerCase()));
      if (match) return match;
    }
    return this.optionChains[0] || null;
  }

  async saveGreeksHistory(records: Array<Omit<GreeksHistoryDocument, 'id' | 'createdAt'>>): Promise<number> {
    const docs = records.map((r, i) => ({
      ...r,
      id: 'gh_' + Date.now() + '_' + i + '_' + Math.random().toString(36).substring(7),
      createdAt: new Date()
    }));
    this.greeksHistory.unshift(...docs);
    this.persistCollection('greeksHistory', this.greeksHistory);
    return docs.length;
  }

  async getGreeksHistory(limit: number = 50, commodity?: string): Promise<GreeksHistoryDocument[]> {
    let list = this.greeksHistory;
    if (commodity && commodity !== 'ALL') {
      list = list.filter(g => g.commodity.toLowerCase().includes(commodity.toLowerCase()));
    }
    return list.slice(0, limit);
  }

  async saveAnalytics(analytics: Omit<AnalyticsDocument, 'id' | 'createdAt'>): Promise<AnalyticsDocument> {
    const doc: AnalyticsDocument = {
      ...analytics,
      id: 'anl_' + Date.now() + '_' + Math.random().toString(36).substring(7),
      createdAt: new Date()
    };
    this.analytics.unshift(doc);
    this.persistCollection('analytics', this.analytics);
    return doc;
  }

  async getLatestAnalytics(commodity?: string): Promise<AnalyticsDocument | null> {
    if (commodity && commodity !== 'ALL') {
      const match = this.analytics.find(a => a.commodity.toLowerCase().includes(commodity.toLowerCase()));
      if (match) return match;
    }
    return this.analytics[0] || null;
  }

  async getAllAnalytics(limit: number = 20): Promise<AnalyticsDocument[]> {
    return this.analytics.slice(0, limit);
  }

  async savePriceHistory(record: Omit<PriceHistoryDocument, 'id' | 'createdAt'>): Promise<PriceHistoryDocument> {
    const doc: PriceHistoryDocument = {
      ...record,
      id: 'prc_' + Date.now() + '_' + Math.random().toString(36).substring(7),
      createdAt: new Date()
    };
    this.priceHistory.unshift(doc);
    this.persistCollection('priceHistory', this.priceHistory);
    return doc;
  }

  async getLatestPrice(commodity?: string): Promise<PriceHistoryDocument | null> {
    if (commodity && commodity !== 'ALL') {
      const match = this.priceHistory.find(p => p.commodity.toLowerCase().includes(commodity.toLowerCase()));
      if (match) return match;
    }
    return this.priceHistory[0] || null;
  }

  async getPriceHistory(limit: number = 100, commodity?: string): Promise<PriceHistoryDocument[]> {
    let list = this.priceHistory;
    if (commodity && commodity !== 'ALL') {
      list = list.filter(p => p.commodity.toLowerCase().includes(commodity.toLowerCase()));
    }
    return list.slice(0, limit);
  }

  async saveScenarioAnalysis(record: Omit<ScenarioAnalysisDocument, 'id' | 'createdAt'>): Promise<ScenarioAnalysisDocument> {
    const doc: ScenarioAnalysisDocument = {
      ...record,
      id: 'scen_' + Date.now() + '_' + Math.random().toString(36).substring(7),
      createdAt: new Date()
    };
    this.scenarioAnalyses.unshift(doc);
    this.persistCollection('scenarioAnalysis', this.scenarioAnalyses);
    return doc;
  }

  async getScenarioAnalyses(limit: number = 50, commodity?: string): Promise<ScenarioAnalysisDocument[]> {
    let list = this.scenarioAnalyses;
    if (commodity && commodity !== 'ALL') {
      list = list.filter(s => s.commodity.toLowerCase().includes(commodity.toLowerCase()));
    }
    return list.slice(0, limit);
  }

  async saveGreekCalculation(record: Omit<GreekCalculationDocument, 'id' | 'createdAt'>): Promise<GreekCalculationDocument> {
    const doc: GreekCalculationDocument = {
      ...record,
      id: 'calc_' + Date.now() + '_' + Math.random().toString(36).substring(7),
      createdAt: new Date()
    };
    this.greekCalculations.unshift(doc);
    this.persistCollection('greekCalculations', this.greekCalculations);
    return doc;
  }

  async getGreekCalculations(limit: number = 50, commodity?: string): Promise<GreekCalculationDocument[]> {
    let list = this.greekCalculations;
    if (commodity && commodity !== 'ALL') {
      list = list.filter(s => s.commodity.toLowerCase().includes(commodity.toLowerCase()));
    }
    return list.slice(0, limit);
  }

  getStatus() {
    return {
      connected: true,
      driver: 'local_persistent' as const,
      collections: ['users', 'uploads', 'optionChains', 'greeksHistory', 'analytics', 'priceHistory', 'scenarioAnalysis', 'greekCalculations']
    };
  }
}

let appRepositoryInstance: IAppRepository | null = null;

export async function getAppRepository(): Promise<IAppRepository> {
  if (appRepositoryInstance) return appRepositoryInstance;

  const mongoUri = process.env.MONGODB_URI;
  if (mongoUri) {
    const mongoRepo = new MongoAppRepository(mongoUri);
    const connected = await mongoRepo.connect();
    if (connected) {
      appRepositoryInstance = mongoRepo;
      return appRepositoryInstance;
    }
  }

  appRepositoryInstance = new LocalAppRepository();
  return appRepositoryInstance;
}

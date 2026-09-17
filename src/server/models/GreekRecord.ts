import { MongoGreekRecord } from '../types/greeks.types';

/**
 * MongoDB Document representation for Greek Records
 */
export interface GreekRecordDocument extends MongoGreekRecord {
  _id: string;
  id: string;
  commodity: string;
  spotPrice: number;
  strikePrice: number;
  optionType: 'CALL' | 'PUT';
  volatility: number;
  expiry: string | number;
  delta: number;
  gamma: number;
  theta: number;
  vega: number;
  rho: number;
  premium: number;
  lots: number;
  lotSize?: number;
  pnl?: number;
  createdAt: Date;
  notes?: string;
}

export type CreateGreekRecordDTO = Omit<GreekRecordDocument, '_id' | 'id' | 'createdAt'> & {
  createdAt?: Date | string;
};

import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { INITIAL_DATA, SEED_IDS } from './seedData.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const LOCAL_DB_FILE = path.join(__dirname, 'local-db.json');

// Initialize database storage (persistent file or memory)
let localStore = null;

function loadLocalStore() {
  if (localStore) return localStore;

  if (fs.existsSync(LOCAL_DB_FILE)) {
    try {
      const data = fs.readFileSync(LOCAL_DB_FILE, 'utf-8');
      localStore = JSON.parse(data);
      console.log('✅ Loaded existing CompanyBrain database from local-db.json');
      return localStore;
    } catch (err) {
      console.warn('⚠️ Error reading local-db.json, re-seeding...', err.message);
    }
  }

  // Clone initial seed data
  localStore = JSON.parse(JSON.stringify(INITIAL_DATA));
  saveLocalStore();
  console.log('🌱 Seeded CompanyBrain database with initial multi-tenant dataset');
  return localStore;
}

export function saveLocalStore() {
  if (!localStore) return;
  try {
    fs.writeFileSync(LOCAL_DB_FILE, JSON.stringify(localStore, null, 2), 'utf-8');
  } catch (err) {
    console.error('Failed to persist database state:', err);
  }
}

export function resetDatabase() {
  localStore = JSON.parse(JSON.stringify(INITIAL_DATA));
  saveLocalStore();
  return localStore;
}

// Supabase client instance (if configured)
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;
export const isSupabaseConfigured = Boolean(
  supabaseUrl && supabaseKey && !supabaseUrl.includes('your-supabase-url')
);

let supabaseClient = null;
if (isSupabaseConfigured) {
  try {
    supabaseClient = createClient(supabaseUrl, supabaseKey);
    console.log('⚡ Connected to Supabase PostgreSQL at:', supabaseUrl);
  } catch (err) {
    console.warn('⚠️ Could not initialize Supabase client:', err.message);
  }
} else {
  console.log('📦 Using Local Enterprise Database Engine with Supabase schema compatibility');
}

/**
 * Universal Database Client matching Supabase REST / Query Builder patterns
 * Works both with live Supabase and local storage seamlessly
 */
class LocalQueryBuilder {
  constructor(tableName) {
    this.tableName = tableName;
    this.store = loadLocalStore();
    if (!this.store[tableName]) {
      this.store[tableName] = [];
    }
    this.filters = [];
    this.limitCount = null;
    this.orderField = null;
    this.orderAscending = true;
    this.selectedFields = null;
  }

  select(fields = '*') {
    this.selectedFields = fields;
    return this;
  }

  eq(column, value) {
    this.filters.push((row) => row[column] === value);
    return this;
  }

  neq(column, value) {
    this.filters.push((row) => row[column] !== value);
    return this;
  }

  in(column, values) {
    this.filters.push((row) => Array.isArray(values) && values.includes(row[column]));
    return this;
  }

  ilike(column, pattern) {
    const regex = new RegExp(pattern.replace(/%/g, '.*'), 'i');
    this.filters.push((row) => row[column] && regex.test(String(row[column])));
    return this;
  }

  order(column, { ascending = true } = {}) {
    this.orderField = column;
    this.orderAscending = ascending;
    return this;
  }

  limit(count) {
    this.limitCount = count;
    return this;
  }

  async single() {
    const res = await this._execute();
    return {
      data: res.data && res.data.length > 0 ? res.data[0] : null,
      error: res.data && res.data.length > 0 ? null : { message: 'Row not found', code: 'PGRST116' },
    };
  }

  async then(resolve, reject) {
    try {
      const result = await this._execute();
      resolve(result);
    } catch (err) {
      if (reject) reject(err);
      else resolve({ data: null, error: err });
    }
  }

  update(updates) {
    this.pendingOperation = 'update';
    this.pendingUpdates = updates;
    return this;
  }

  delete() {
    this.pendingOperation = 'delete';
    return this;
  }

  async insert(items) {
    const rows = Array.isArray(items) ? items : [items];
    const inserted = [];

    for (const item of rows) {
      const newRow = {
        id: item.id || crypto.randomUUID(),
        created_at: item.created_at || new Date().toISOString(),
        updated_at: new Date().toISOString(),
        ...item,
      };
      this.store[this.tableName].push(newRow);
      inserted.push(newRow);
    }

    saveLocalStore();
    return { data: Array.isArray(items) ? inserted : inserted[0], error: null };
  }

  async _execute() {
    let records = this.store[this.tableName] || [];

    // Handle Update Operation
    if (this.pendingOperation === 'update') {
      const updated = [];
      this.store[this.tableName] = records.map((row) => {
        let matches = true;
        for (const filter of this.filters) {
          if (!filter(row)) {
            matches = false;
            break;
          }
        }

        if (matches) {
          const modified = { ...row, ...this.pendingUpdates, updated_at: new Date().toISOString() };
          updated.push(modified);
          return modified;
        }
        return row;
      });

      saveLocalStore();
      return { data: updated, error: null };
    }

    // Handle Delete Operation
    if (this.pendingOperation === 'delete') {
      const deleted = [];
      const remaining = [];

      for (const row of records) {
        let matches = true;
        for (const filter of this.filters) {
          if (!filter(row)) {
            matches = false;
            break;
          }
        }

        if (matches) {
          deleted.push(row);
        } else {
          remaining.push(row);
        }
      }

      this.store[this.tableName] = remaining;
      saveLocalStore();
      return { data: deleted, error: null };
    }

    // Handle Select Operation
    let queryResults = [...records];
    for (const filter of this.filters) {
      queryResults = queryResults.filter(filter);
    }

    if (this.orderField) {
      queryResults.sort((a, b) => {
        let valA = a[this.orderField];
        let valB = b[this.orderField];
        if (typeof valA === 'string') {
          return this.orderAscending
            ? String(valA).localeCompare(String(valB))
            : String(valB).localeCompare(String(valA));
        }
        return this.orderAscending ? (valA > valB ? 1 : -1) : (valA < valB ? 1 : -1);
      });
    }

    if (this.limitCount !== null) {
      queryResults = queryResults.slice(0, this.limitCount);
    }

    return { data: queryResults, error: null };
  }
}

export const db = {
  from(tableName) {
    if (isSupabaseConfigured && supabaseClient) {
      return supabaseClient.from(tableName);
    }
    return new LocalQueryBuilder(tableName);
  },
  getStore() {
    return loadLocalStore();
  },
  resetDatabase,
  SEED_IDS,
};


import DatabaseConstructor from 'better-sqlite3';
import fs from 'node:fs';
import path from 'node:path';

export type AgentStatus = 'idle' | 'running' | 'paused' | 'error';

export type AgentConfig = {
  cities: string[];
  categories: string[];
  autoContact: boolean;
  intervalHours: number;
  maxBusinessesPerRun: number;
};

export type AgentState = {
  status: AgentStatus;
  lastRunAt: string | null;
  nextRunAt: string | null;
  currentStep: string | null;
  totalScanned: number;
  totalGenerated: number;
  totalContacted: number;
  totalConverted: number;
  config: AgentConfig;
};

export type AgentLog = {
  id?: number;
  level: 'info' | 'success' | 'warning' | 'error';
  step: string;
  message: string;
  createdAt: string;
};

const DB_PATH = path.join(process.cwd(), 'data', 'agent.sqlite');

function initDb() {
  const dir = path.dirname(DB_PATH);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

  const db = new DatabaseConstructor(DB_PATH);
  db.pragma('journal_mode = WAL');
  db.exec(`
    CREATE TABLE IF NOT EXISTS agent_state (
      id INTEGER PRIMARY KEY CHECK (id = 1),
      status TEXT NOT NULL DEFAULT 'idle',
      lastRunAt TEXT,
      nextRunAt TEXT,
      currentStep TEXT,
      totalScanned INTEGER NOT NULL DEFAULT 0,
      totalGenerated INTEGER NOT NULL DEFAULT 0,
      totalContacted INTEGER NOT NULL DEFAULT 0,
      totalConverted INTEGER NOT NULL DEFAULT 0,
      config TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS agent_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      level TEXT NOT NULL,
      step TEXT NOT NULL,
      message TEXT NOT NULL,
      createdAt TEXT NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_logs_created ON agent_logs(createdAt DESC);
  `);

  const existing = db.prepare('SELECT id FROM agent_state WHERE id=1').get();
  if (!existing) {
    const defaultConfig: AgentConfig = {
      cities: ['Paris', 'Lyon', 'Marseille'],
      categories: ['restaurant', 'coiffeur', 'boulangerie', 'plombier', 'pharmacie'],
      autoContact: true,
      intervalHours: 24,
      maxBusinessesPerRun: 50,
    };
    db.prepare(`
      INSERT INTO agent_state (id, status, config)
      VALUES (1, 'idle', ?)
    `).run(JSON.stringify(defaultConfig));
  }

  return db;
}

const db = initDb();

export function getAgentState(): AgentState {
  const row = db.prepare('SELECT * FROM agent_state WHERE id=1').get() as Record<string, unknown>;
  return { ...row, config: JSON.parse(row.config as string) } as AgentState;
}

export function updateAgentState(patch: Partial<Omit<AgentState, 'config'> & { config?: AgentConfig }>) {
  const current = getAgentState();
  const updated = { ...current, ...patch };
  db.prepare(`
    UPDATE agent_state SET
      status=?, lastRunAt=?, nextRunAt=?, currentStep=?,
      totalScanned=?, totalGenerated=?, totalContacted=?, totalConverted=?, config=?
    WHERE id=1
  `).run(
    updated.status,
    updated.lastRunAt,
    updated.nextRunAt,
    updated.currentStep,
    updated.totalScanned,
    updated.totalGenerated,
    updated.totalContacted,
    updated.totalConverted,
    JSON.stringify(updated.config),
  );
}

export function addLog(log: Omit<AgentLog, 'id' | 'createdAt'>) {
  db.prepare('INSERT INTO agent_logs (level, step, message, createdAt) VALUES (?,?,?,?)').run(
    log.level, log.step, log.message, new Date().toISOString()
  );
  // keep only last 500 logs
  db.prepare('DELETE FROM agent_logs WHERE id NOT IN (SELECT id FROM agent_logs ORDER BY createdAt DESC LIMIT 500)').run();
}

export function getLogs(limit = 100): AgentLog[] {
  return db.prepare('SELECT * FROM agent_logs ORDER BY createdAt DESC LIMIT ?').all(limit) as AgentLog[];
}

export function clearLogs() {
  db.prepare('DELETE FROM agent_logs').run();
}

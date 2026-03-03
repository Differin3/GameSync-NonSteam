// Типы для игр
export interface GameInfo {
  name: string;
  prefixPath: string;
  savePaths: string[];
  hasSaves: boolean;
  lastSync?: string;
}

// Статус синхронизации
export interface SyncStatus {
  gameName: string;
  status: "idle" | "syncing" | "success" | "error";
  message?: string;
}

// Конфигурация облака
export interface CloudConfig {
  provider: "webdav";
  autoSync: boolean;
}

// Конфигурация игры
export interface GameConfig {
  gameName: string;
  savePaths: string[];
  enabled: boolean;
}

// Синхронизированная игра
export interface SyncedGame {
  gameName: string;
  lastSync: string; // ISO timestamp
  fileId?: string;
}

// Статистика синхронизаций
export interface SyncStats {
  totalSyncs: number;
  lastSync?: string;
  gamesCount: number;
  totalSize?: number;
  syncsByDate: { date: string; count: number }[];
}

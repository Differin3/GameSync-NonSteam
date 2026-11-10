import { normalizeWebDAVProviderId } from "./storagePresets";

export type StorageProviderType = "webdav" | "s3" | "ftp" | "sftp";

export interface Settings {
  storageProvider: StorageProviderType;
  // WebDAV
  /** id пресета из storagePresets.ts (mail, yandex, nextcloud, ...). */
  webdavProvider: string;
  webdavUrl: string;
  webdavUsername: string;
  webdavPassword: string;
  webdavOAuthToken: string; // Для Яндекс Диска через OAuth
  // S3
  s3Provider: string;
  s3Endpoint: string;
  s3Region: string;
  s3Bucket: string;
  s3AccessKey: string;
  s3SecretKey: string;
  s3PathStyle: boolean;
  s3SignatureVersion: string;
  // FTP / FTPS
  ftpHost: string;
  ftpPort: string;
  ftpUsername: string;
  ftpPassword: string;
  ftpUseTls: boolean;
  ftpPassive: boolean;
  // SFTP
  sftpHost: string;
  sftpPort: string;
  sftpUsername: string;
  sftpPassword: string;
  sftpKeyPath: string;
  sftpKeyPassphrase: string;
  // Общие
  autoSync: boolean;
  defaultSavePaths: string[];
}

export const DEFAULT_SETTINGS: Settings = {
  storageProvider: "webdav",
  // По умолчанию — самый доступный бесплатный вариант для русскоязычного
  // пользователя: Облако Mail.ru. URL подставляется автоматически.
  webdavProvider: "mail",
  webdavUrl: "https://webdav.cloud.mail.ru",
  webdavUsername: "",
  webdavPassword: "",
  webdavOAuthToken: "",
  s3Provider: "custom",
  s3Endpoint: "",
  s3Region: "us-east-1",
  s3Bucket: "",
  s3AccessKey: "",
  s3SecretKey: "",
  s3PathStyle: false,
  s3SignatureVersion: "s3v4",
  ftpHost: "",
  ftpPort: "21",
  ftpUsername: "",
  ftpPassword: "",
  ftpUseTls: false,
  ftpPassive: true,
  sftpHost: "",
  sftpPort: "22",
  sftpUsername: "",
  sftpPassword: "",
  sftpKeyPath: "",
  sftpKeyPassphrase: "",
  autoSync: false,
  defaultSavePaths: [],
};

/** Поля с секретами: их нельзя держать в localStorage (он виден любому скрипту Steam). */
const SECRET_FIELDS: (keyof Settings)[] = [
  "webdavPassword",
  "webdavOAuthToken",
  "s3SecretKey",
  "ftpPassword",
  "sftpPassword",
  "sftpKeyPassphrase",
];

const SETTINGS_KEY = "gamesyncSettings";
const SETTINGS_CHANGE_EVENT = "gamesync-settings-change";

export function loadSettings(): Settings {
  try {
    const saved = localStorage.getItem(SETTINGS_KEY);
    if (saved) {
      const parsed = JSON.parse(saved) as Partial<Settings>;
      return {
        ...DEFAULT_SETTINGS,
        ...parsed,
        webdavProvider: normalizeWebDAVProviderId(parsed.webdavProvider ?? DEFAULT_SETTINGS.webdavProvider),
      };
    }
  } catch (error) {
    console.error("Failed to load settings:", error);
  }
  return DEFAULT_SETTINGS;
}

export function saveSettings(settings: Settings): void {
  try {
    // Секреты живут только в конфиге бэкенда (~/.config/gamesync, права 0600),
    // а в localStorage остаётся всё остальное — чтобы не терять пути и провайдера.
    const persisted: Settings = { ...settings };
    for (const field of SECRET_FIELDS) {
      (persisted as unknown as Record<string, unknown>)[field] = "";
    }
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(persisted));
    window.dispatchEvent(new CustomEvent(SETTINGS_CHANGE_EVENT, { detail: settings }));
  } catch (error) {
    console.error("Failed to save settings:", error);
  }
}

export function subscribeToSettings(callback: (settings: Settings) => void): () => void {
  const handler = (event: CustomEvent<Settings>) => callback(event.detail);
  window.addEventListener(SETTINGS_CHANGE_EVENT as any, handler as EventListener);
  return () => window.removeEventListener(SETTINGS_CHANGE_EVENT as any, handler as EventListener);
}

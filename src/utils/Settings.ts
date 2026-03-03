export type WebDAVProviderType = 'custom' | 'nextcloud' | 'yandex' | 'box' | 'owncloud';

export interface Settings {
  storageProvider: 'webdav';
  // WebDAV
  webdavProvider: WebDAVProviderType;
  webdavUrl: string;
  webdavUsername: string;
  webdavPassword: string;
  webdavOAuthToken: string; // Для Яндекс Диска через OAuth
  // Общие
  autoSync: boolean;
  defaultSavePaths: string[];
}

export const WEBDAV_PROVIDERS: Record<WebDAVProviderType, { name: string; url: string; description: string }> = {
  custom: { name: 'Другой', url: '', description: 'Введите URL вручную' },
  nextcloud: { name: 'Nextcloud', url: 'https://nextcloud.com/remote.php/dav/files/USERNAME/', description: 'Бесплатный облачный хостинг' },
  yandex: { name: 'Яндекс Диск', url: 'https://webdav.yandex.ru', description: '10GB бесплатно, Basic или OAuth' },
  box: { name: 'Box', url: 'https://dav.box.com/dav/', description: 'Корпоративное хранилище' },
  owncloud: { name: 'ownCloud', url: 'https://your-server.com/remote.php/dav/files/USERNAME/', description: 'Свой сервер ownCloud' }
};

export const DEFAULT_SETTINGS: Settings = {
  storageProvider: 'webdav',
  webdavProvider: 'custom',
  webdavUrl: "",
  webdavUsername: "",
  webdavPassword: "",
  webdavOAuthToken: "",
  autoSync: false,
  defaultSavePaths: []
};

const SETTINGS_CHANGE_EVENT = 'gamesync-settings-change';

export function loadSettings(): Settings {
  try {
    const saved = localStorage.getItem('gamesyncSettings');
    if (saved) {
      return { ...DEFAULT_SETTINGS, ...JSON.parse(saved) };
    }
  } catch (error) {
    console.error('Failed to load settings:', error);
  }
  return DEFAULT_SETTINGS;
}

export function saveSettings(settings: Settings): void {
  try {
    localStorage.setItem('gamesyncSettings', JSON.stringify(settings));
    window.dispatchEvent(new CustomEvent(SETTINGS_CHANGE_EVENT, { detail: settings }));
  } catch (error) {
    console.error('Failed to save settings:', error);
  }
}

export function subscribeToSettings(callback: (settings: Settings) => void): () => void {
  const handler = (event: CustomEvent<Settings>) => callback(event.detail);
  window.addEventListener(SETTINGS_CHANGE_EVENT as any, handler as EventListener);
  return () => window.removeEventListener(SETTINGS_CHANGE_EVENT as any, handler as EventListener);
}

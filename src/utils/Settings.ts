export interface Settings {
  refreshToken: string;
  clientId: string;
  clientSecret: string;
  autoSync: boolean;
  defaultSavePaths: string[];
}

export const DEFAULT_SETTINGS: Settings = {
  refreshToken: "",
  clientId: "",
  clientSecret: "",
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

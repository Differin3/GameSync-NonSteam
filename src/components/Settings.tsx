import { useState, useEffect } from "react";
import { call } from "@decky/api";
import {
  PanelSection,
  PanelSectionRow,
  TextField,
  ToggleField,
  ButtonItem,
} from "@decky/ui";
import { loadSettings, saveSettings, Settings, WEBDAV_PROVIDERS, WebDAVProviderType } from "../utils/Settings";

export function Settings() {
  const [settings, setSettings] = useState<Settings>(loadSettings());
  const [testing, setTesting] = useState<boolean>(false);
  const [testResult, setTestResult] = useState<string | null>(null);
  const [newPath, setNewPath] = useState<string>("");
  const [validating, setValidating] = useState<boolean>(false);
  const [pathValidationResult, setPathValidationResult] = useState<string | null>(null);

  useEffect(() => {
    // Загружаем настройки провайдера из backend при монтировании
    const loadStorageConfig = async () => {
      try {
        const result: any = await call("load_storage_config", {});
        if (result.success && result.config) {
          const config = result.config;
          setSettings(prev => ({
            ...prev,
            storageProvider: 'webdav',
            webdavProvider: (config.webdav_provider && ['custom', 'nextcloud', 'yandex', 'box', 'owncloud'].includes(config.webdav_provider)) 
              ? (config.webdav_provider as WebDAVProviderType) 
              : (prev.webdavProvider || 'custom'),
            webdavUrl: config.url || prev.webdavUrl || '',
            webdavUsername: config.username || prev.webdavUsername || '',
            webdavPassword: config.password || prev.webdavPassword || '',
            webdavOAuthToken: config.oauth_token || prev.webdavOAuthToken || ''
          }));
        }
      } catch (error) {
        console.error("Error loading storage config:", error);
      }
    };
    loadStorageConfig();
  }, []);

  useEffect(() => {
    saveSettings(settings);
  }, [settings]);

  const addDefaultPath = async () => {
    if (!newPath.trim()) {
      setPathValidationResult("Введите путь");
      return;
    }

    setValidating(true);
    setPathValidationResult(null);

    try {
      const result: any = await call("validate_save_path", { path: newPath.trim() });

      if (result.success && result.path) {
        const normalizedPath = result.path;
        if (!settings.defaultSavePaths.includes(normalizedPath)) {
          setSettings({
            ...settings,
            defaultSavePaths: [...settings.defaultSavePaths, normalizedPath],
          });
          setNewPath("");
          setPathValidationResult(null);
        } else {
          setPathValidationResult("Этот путь уже добавлен");
        }
      } else {
        setPathValidationResult(`✗ ${result.error || "Ошибка валидации"}`);
      }
    } catch (error) {
      setPathValidationResult(`✗ Ошибка: ${error}`);
    } finally {
      setValidating(false);
    }
  };

  const removeDefaultPath = (index: number) => {
    setSettings({
      ...settings,
      defaultSavePaths: settings.defaultSavePaths.filter((_, i) => i !== index),
    });
  };

  const saveStorageConfig = async (customSettings?: Settings) => {
    try {
      const settingsToSave = customSettings || settings;
      const result: any = await call("save_storage_config", {
        provider: 'webdav',
        url: settingsToSave.webdavUrl,
        username: settingsToSave.webdavUsername,
        password: settingsToSave.webdavPassword,
        oauth_token: settingsToSave.webdavOAuthToken,
        webdav_provider: settingsToSave.webdavProvider
      });
      if (result.success) {
        setTestResult("✓ Настройки сохранены");
      } else {
        setTestResult(`✗ ${result.error || "Ошибка сохранения"}`);
      }
    } catch (error: any) {
      setTestResult(`✗ Ошибка: ${error?.message || String(error)}`);
    }
  };

  return (
    <div>
      {/* WebDAV Settings Section */}
      <PanelSection title="WebDAV Settings">
        <PanelSectionRow>
          <div style={{ fontSize: "12px", color: "#888", marginBottom: "8px" }}>
            WebDAV - простой способ синхронизации без OAuth. Поддерживается Nextcloud, Яндекс Диск, Box и другие.
          </div>
        </PanelSectionRow>

        <PanelSection title="Выберите провайдер">
          {Object.entries(WEBDAV_PROVIDERS).map(([key, provider]) => (
            <PanelSectionRow key={key}>
              <ButtonItem
                layout="below"
                onClick={async () => {
                  const newUrl = key === 'custom' ? settings.webdavUrl : provider.url;
                  const newSettings = { 
                    ...settings, 
                    webdavProvider: key as WebDAVProviderType,
                    webdavUrl: newUrl
                  };
                  setSettings(newSettings);
                  // Автосохранение при выборе провайдера
                  setTimeout(async () => {
                    await saveStorageConfig();
                  }, 100);
                }}
                disabled={settings.webdavProvider === key}
              >
                {settings.webdavProvider === key ? `✓ ${provider.name}` : provider.name}
              </ButtonItem>
            </PanelSectionRow>
          ))}
        </PanelSection>

        <PanelSectionRow>
          <TextField
            label="WebDAV URL"
            value={settings.webdavUrl || ""}
            onChange={(e) =>
              setSettings({ ...settings, webdavUrl: e.target.value })
            }
            description={WEBDAV_PROVIDERS[settings.webdavProvider || 'custom']?.description || "URL WebDAV сервера"}
          />
        </PanelSectionRow>

        {settings.webdavProvider === 'yandex' && (
          <>
            <PanelSectionRow>
              <div style={{ fontSize: "11px", color: "#888", padding: "8px", backgroundColor: "rgba(255,255,255,0.05)", borderRadius: "4px" }}>
                <div style={{ fontWeight: "bold", marginBottom: "4px" }}>Яндекс Диск - два способа авторизации:</div>
                <div><strong>1. Basic-аутентификация:</strong> Логин и пароль приложения (проще)</div>
                <div><strong>2. OAuth-токен:</strong> Токен из oauth.yandex.ru (безопаснее)</div>
                <div style={{ marginTop: "8px", fontSize: "10px" }}>
                  Для Basic: создайте пароль приложения с типом "Файлы" в настройках Яндекс ID
                </div>
              </div>
            </PanelSectionRow>
            <PanelSectionRow>
              <TextField
                label="OAuth токен (опционально, если используете Basic - оставьте пустым)"
                value={settings.webdavOAuthToken || ""}
                onChange={(e) =>
                  setSettings({ ...settings, webdavOAuthToken: e.target.value })
                }
                description="Получите на oauth.yandex.ru/authorize?response_type=token&client_id=YOUR_CLIENT_ID"
              />
            </PanelSectionRow>
          </>
        )}

        {!settings.webdavOAuthToken && (
          <>
            <PanelSectionRow>
              <TextField
                label="Логин"
                value={settings.webdavUsername || ""}
                onChange={(e) =>
                  setSettings({ ...settings, webdavUsername: e.target.value })
                }
                description={settings.webdavProvider === 'yandex' ? "Логин Яндекс ID или пароль приложения" : "Ваш логин для WebDAV"}
              />
            </PanelSectionRow>

            <PanelSectionRow>
              <TextField
                label="Пароль"
                value={settings.webdavPassword || ""}
                onChange={(e) =>
                  setSettings({ ...settings, webdavPassword: e.target.value })
                }
                description={settings.webdavProvider === 'yandex' ? "Пароль приложения (тип: Файлы)" : "Ваш пароль для WebDAV"}
              />
            </PanelSectionRow>
          </>
        )}

        {settings.webdavProvider === 'custom' && (
          <PanelSectionRow>
            <div style={{ fontSize: "11px", color: "#888", padding: "8px", backgroundColor: "rgba(255,255,255,0.05)", borderRadius: "4px" }}>
              <div style={{ fontWeight: "bold", marginBottom: "4px" }}>Примеры WebDAV хостингов:</div>
              <div>• Nextcloud: https://nextcloud.com/remote.php/dav/files/USERNAME/</div>
              <div>• Яндекс Диск: https://webdav.yandex.ru</div>
              <div>• Box: https://dav.box.com/dav/</div>
              <div>• ownCloud: https://your-server.com/remote.php/dav/files/USERNAME/</div>
            </div>
          </PanelSectionRow>
        )}

        <PanelSectionRow>
          <ButtonItem layout="below" onClick={async () => {
            setTesting(true);
            setTestResult(null);
            try {
              const result: any = await call("test_storage_connection", {
                provider: 'webdav',
                url: settings.webdavUrl,
                username: settings.webdavUsername,
                password: settings.webdavPassword,
                oauth_token: settings.webdavOAuthToken
              });
              if (result.success) {
                setTestResult(`✓ ${result.message || "Подключение успешно"}`);
              } else {
                setTestResult(`✗ ${result.error || result.message || "Ошибка подключения"}`);
              }
            } catch (error: any) {
              setTestResult(`✗ Ошибка: ${error?.message || String(error)}`);
            } finally {
              setTesting(false);
            }
          }} disabled={testing || !settings.webdavUrl || (!settings.webdavOAuthToken && (!settings.webdavUsername || !settings.webdavPassword))}>
            {testing ? "Тестирование..." : "Тест подключения"}
          </ButtonItem>
        </PanelSectionRow>

        {testResult && (
          <PanelSectionRow>
            <div
              style={{
                padding: "10px",
                backgroundColor: testResult.startsWith("✓")
                  ? "#0a4a0a"
                  : "#4a0a0a",
                color: "#fff",
                borderRadius: "4px",
                fontSize: "12px",
              }}
            >
              {testResult}
            </div>
          </PanelSectionRow>
        )}
      </PanelSection>

      {/* Clear Data Section */}
      <PanelSection title="Очистка данных">
        <PanelSectionRow>
          <div style={{ fontSize: "12px", color: "#ff6b6b", marginBottom: "8px" }}>
            <strong>Внимание:</strong> Это удалит все настройки, кэш и конфигурацию плагина. Действие необратимо!
          </div>
        </PanelSectionRow>
        <PanelSectionRow>
          <ButtonItem
            layout="below"
            onClick={async () => {
              if (confirm("Вы уверены? Это удалит все настройки, кэш и конфигурацию плагина.")) {
                try {
                  const result: any = await call("clear_all_data", {});
                  if (result.success) {
                    setTestResult(`✓ ${result.message || "Все данные очищены"}`);
                    // Сбрасываем настройки на дефолтные
                    setSettings(loadSettings());
                  } else {
                    setTestResult(`✗ ${result.error || "Ошибка очистки"}`);
                  }
                } catch (error: any) {
                  setTestResult(`✗ Ошибка: ${error?.message || String(error)}`);
                }
              }
            }}
          >
            Очистить все данные плагина
          </ButtonItem>
        </PanelSectionRow>
      </PanelSection>

      {/* Sync Settings Section */}
      <PanelSection title="Sync Settings">
        <PanelSectionRow>
          <ToggleField
            label="Автосинхронизация"
            description="Автоматически синхронизировать сохранения после закрытия игры"
            checked={settings.autoSync}
            onChange={async (value) => {
              setSettings({ ...settings, autoSync: value });
              try {
                await call("enable_auto_sync", { enabled: value });
              } catch (error) {
                console.error("Error enabling auto-sync:", error);
              }
            }}
          />
        </PanelSectionRow>
      </PanelSection>

      {/* Default Save Paths Section */}
      <PanelSection title="Default Save Paths">
        <PanelSectionRow>
          <TextField
            label="Добавить путь сохранений"
            value={newPath}
            onChange={(e) => setNewPath(e.target.value)}
            description="Глобальные пути применяются ко всем играм"
          />
        </PanelSectionRow>

        <PanelSectionRow>
          <ButtonItem
            layout="below"
            onClick={addDefaultPath}
            disabled={validating || !newPath.trim()}
          >
            {validating ? "Проверка..." : "Добавить путь"}
          </ButtonItem>
        </PanelSectionRow>

        {pathValidationResult && (
          <PanelSectionRow>
            <div
              style={{
                fontSize: "12px",
                color: pathValidationResult.startsWith("✓") ? "#0f0" : "#f00",
              }}
            >
              {pathValidationResult}
            </div>
          </PanelSectionRow>
        )}

        {settings.defaultSavePaths.length > 0 && (
          <>
            <PanelSectionRow>
              <div style={{ fontSize: "12px", color: "#888" }}>
                Текущие пути ({settings.defaultSavePaths.length}):
              </div>
            </PanelSectionRow>
            {settings.defaultSavePaths.map((path, index) => (
              <PanelSectionRow key={index}>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    padding: "8px",
                    backgroundColor: "#2a2a2a",
                    borderRadius: "4px",
                    width: "100%",
                  }}
                >
                  <span
                    style={{
                      fontSize: "11px",
                      flex: 1,
                      wordBreak: "break-all",
                      color: "#ccc",
                    }}
                  >
                    {path}
                  </span>
                  <div style={{ marginLeft: "10px" }}>
                    <ButtonItem
                      layout="below"
                      onClick={() => removeDefaultPath(index)}
                    >
                      Удалить
                    </ButtonItem>
                  </div>
                </div>
              </PanelSectionRow>
            ))}
          </>
        )}

        {settings.defaultSavePaths.length === 0 && (
          <PanelSectionRow>
            <div style={{ color: "#888", fontStyle: "italic", fontSize: "12px" }}>
              Нет добавленных путей
            </div>
          </PanelSectionRow>
        )}
      </PanelSection>
    </div>
  );
}

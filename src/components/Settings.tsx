import { useState, useEffect } from "react";
import { call, openFilePicker, FileSelectionType } from "@decky/api";
import {
  PanelSection,
  PanelSectionRow,
  TextField,
  ToggleField,
  ButtonItem,
  Navigation,
} from "@decky/ui";
import { loadSettings, saveSettings, Settings } from "../utils/Settings";

export function Settings() {
  const [settings, setSettings] = useState<Settings>(loadSettings());
  const [testing, setTesting] = useState<boolean>(false);
  const [testResult, setTestResult] = useState<string | null>(null);
  const [newPath, setNewPath] = useState<string>("");
  const [validating, setValidating] = useState<boolean>(false);
  const [pathValidationResult, setPathValidationResult] = useState<string | null>(null);
  const [loadingFile, setLoadingFile] = useState<boolean>(false);
  const [authorizing, setAuthorizing] = useState<boolean>(false);
  const [manualAuthCode, setManualAuthCode] = useState<string>("");
  const [exchangingCode, setExchangingCode] = useState<boolean>(false);
  const [oauthUrl, setOauthUrl] = useState<string>("");
  const [debugLog, setDebugLog] = useState<string[]>([]);

  useEffect(() => {
    saveSettings(settings);
    // Логируем изменения для отладки
    console.log("Settings updated:", {
      clientId: settings.clientId ? `${settings.clientId.length} chars` : "empty",
      clientSecret: settings.clientSecret ? `${settings.clientSecret.length} chars` : "empty",
      refreshToken: settings.refreshToken ? `${settings.refreshToken.length} chars` : "empty"
    });
  }, [settings]);

  const handleLoadFromFile = async () => {
    setLoadingFile(true);
    setTestResult(null);
    
    try {
      // Используем прямой вызов openFilePicker
      const result = await openFilePicker(
        FileSelectionType.FILE,
        '/home/deck/Downloads',
        true, // includeFiles
        true, // includeFolders (для навигации)
        undefined, // filter
        ['json'], // validFileExtensions
        false, // defaultHidden
        false // additional parameter
      );
      
      // Логируем результат для отладки
      console.log("FilePicker result:", result);
      console.log("Result type:", typeof result);
      
      // Проверяем формат результата
      let filePath: string | undefined;
      
      if (typeof result === 'string') {
        // Если результат - строка напрямую
        filePath = result;
      } else if (result && typeof result === 'object') {
        // Если результат - объект с path/realpath
        filePath = (result as any).realpath || (result as any).path;
      }
      
      if (!filePath) {
        console.error("No path in result:", result);
        setTestResult(`✗ Ошибка: путь к файлу не найден в результате`);
        return;
      }
      
      if (typeof filePath !== 'string') {
        console.error("Path is not string:", typeof filePath, filePath);
        setTestResult(`✗ Ошибка: неверный формат пути к файлу (${typeof filePath})`);
        return;
      }
      
      console.log("Calling backend with file_path:", filePath);
      
      const fileData: any = await call("load_credentials_from_file", {
        file_path: filePath
      });
      
            if (fileData.success) {
              const newSettings = {
                ...settings,
                clientId: fileData.client_id || "",
                clientSecret: fileData.client_secret || ""
              };
              console.log("Loaded credentials - clientId:", newSettings.clientId?.length || 0, "clientSecret:", newSettings.clientSecret?.length || 0);
              setSettings(newSettings);
              setTestResult(`✓ Credentials загружены из файла`);
            } else {
        setTestResult(`✗ ${fileData.error || "Ошибка загрузки файла"}`);
      }
    } catch (error: any) {
      if (error === 'User Canceled' || error?.message === 'User Canceled') {
        // Пользователь отменил выбор файла - не показываем ошибку
        setTestResult(null);
      } else {
        setTestResult(`✗ Ошибка: ${error?.message || String(error)}`);
      }
    } finally {
      setLoadingFile(false);
    }
  };

  const addDebugLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    setDebugLog(prev => [...prev.slice(-9), `[${timestamp}] ${message}`]);
  };

  const startAutoAuth = async () => {
    const clientId = settings.clientId?.trim() || "";
    const clientSecret = settings.clientSecret?.trim() || "";
    
    setDebugLog([]);
    addDebugLog(`Проверка параметров: clientId длина=${clientId.length}, clientSecret длина=${clientSecret.length}`);
    
    if (!clientId || !clientSecret) {
      addDebugLog("✗ Ошибка: Client ID или Client Secret пустые");
      setTestResult("✗ Укажите Client ID и Client Secret");
      return;
    }

    setAuthorizing(true);
    setTestResult(null);
    addDebugLog("Начало авторизации...");

    try {
      addDebugLog(`Client ID (первые 20 символов): ${clientId.substring(0, 20)}...`);
      addDebugLog(`Client Secret (первые 20 символов): ${clientSecret.substring(0, 20)}...`);
      
      // Проверяем, что значения действительно не пустые перед отправкой
      if (!clientId || clientId.trim().length === 0) {
        addDebugLog("✗ Client ID пустой после trim!");
        setTestResult("✗ Client ID пустой. Проверьте настройки.");
        setAuthorizing(false);
        return;
      }
      if (!clientSecret || clientSecret.trim().length === 0) {
        addDebugLog("✗ Client Secret пустой после trim!");
        setTestResult("✗ Client Secret пустой. Проверьте настройки.");
        setAuthorizing(false);
        return;
      }
      
      // Передаем параметры напрямую как отдельные аргументы
      // Decky может требовать передачи параметров не как объект, а как отдельные аргументы
      addDebugLog(`Отправка запроса на бэкенд: client_id длина=${clientId.length}, client_secret длина=${clientSecret.length}`);
      
      let result: any;
      try {
        // Вариант 1: передаем как объект (стандартный способ)
        result = await call("start_google_oauth", {
          client_id: clientId,
          client_secret: clientSecret,
        });
        addDebugLog(`Результат: ${result.success ? "Успех" : result.error}`);
        
        // Если не получилось, пробуем передать как отдельные параметры
        if (!result.success && result.error && result.error.includes("client_secret")) {
          addDebugLog("Пробуем альтернативный способ передачи...");
          // Пробуем camelCase
          result = await call("start_google_oauth", {
            clientId: clientId,
            clientSecret: clientSecret,
          });
          addDebugLog(`Результат (camelCase): ${result.success ? "Успех" : result.error}`);
        }
      } catch (error: any) {
        addDebugLog(`Исключение при вызове: ${error.message || error}`);
        result = { success: false, error: error.message || String(error) };
      }
      
      addDebugLog(`Ответ бэкенда: ${result.success ? "Успех" : "Ошибка"}`);
      if (!result.success) {
        addDebugLog(`Ошибка бэкенда: ${result.error}`);
      }

      if (result.success && result.url) {
        // Открываем URL в системном браузере Steam Deck через Decky Navigation API
        Navigation.NavigateToExternalWeb(result.url);

        setTestResult("✓ Браузер открыт. Выполните авторизацию в Google. Ожидание refresh_token...");
        
        // Опрашиваем статус авторизации с визуальным индикатором
        const pollAuthStatus = async () => {
          const maxAttempts = 60; // 5 минут (60 * 5 секунд)
          let attempts = 0;
          
          const pollInterval = setInterval(async () => {
            attempts++;
            
            // Обновляем сообщение с прогрессом
            const remainingTime = Math.max(0, maxAttempts - attempts) * 5;
            const minutes = Math.floor(remainingTime / 60);
            const seconds = remainingTime % 60;
            setTestResult(`⏳ Ожидание авторизации... (осталось ~${minutes}:${seconds.toString().padStart(2, '0')})`);
            
            // Проверяем, обновился ли refresh_token в backend config
            try {
              const backendConfig: any = await call("load_gdrive_config", {});
              if (backendConfig.success && backendConfig.refresh_token && backendConfig.refresh_token.length > 0) {
                // Обновляем локальные настройки
                const updatedSettings = {
                  ...settings,
                  refreshToken: backendConfig.refresh_token
                };
                setSettings(updatedSettings);
                clearInterval(pollInterval);
                setTestResult("✓ Авторизация успешна! Refresh token получен автоматически.");
                setAuthorizing(false);
                return;
              }
            } catch (e) {
              console.error("Error polling auth status:", e);
            }
            
            if (attempts >= maxAttempts) {
              clearInterval(pollInterval);
              setTestResult("✗ Таймаут авторизации. Проверьте, что вы завершили авторизацию в браузере. Попробуйте снова или используйте ручной метод.");
              setAuthorizing(false);
            }
          }, 5000); // Проверяем каждые 5 секунд
        };
        
        pollAuthStatus();
      } else {
        const errorMsg = result.error || "Ошибка запуска авторизации";
        setTestResult(`✗ ${errorMsg}\n\nПроверьте:\n1. Client ID и Client Secret заполнены\n2. Redirect URI добавлен в Google Cloud Console\n3. Логи плагина для деталей`);
        setAuthorizing(false);
      }
    } catch (error) {
      setTestResult(`✗ Ошибка: ${error}`);
      setAuthorizing(false);
    }
  };

  const generateOAuthUrl = async () => {
    if (!settings.clientId?.trim() || !settings.clientSecret?.trim()) {
      setTestResult("✗ Укажите Client ID и Client Secret");
      return;
    }

    try {
      const result: any = await call("generate_oauth_url", {
        client_id: settings.clientId.trim(),
        client_secret: settings.clientSecret.trim(),
      });

      if (result.success && result.url) {
        setOauthUrl(result.url);
        setTestResult(`✓ OAuth URL сгенерирован. Скопируйте его и откройте в браузере.\n\n${result.instructions?.join('\n') || ''}`);
      } else {
        setTestResult(`✗ ${result.error || "Ошибка генерации URL"}`);
      }
    } catch (error) {
      setTestResult(`✗ Ошибка: ${error}`);
    }
  };

  const exchangeAuthCode = async () => {
    if (!manualAuthCode.trim()) {
      setTestResult("✗ Введите authorization code");
      return;
    }

    if (!settings.clientId?.trim() || !settings.clientSecret?.trim()) {
      setTestResult("✗ Укажите Client ID и Client Secret");
      return;
    }

    setExchangingCode(true);
    setTestResult(null);
    addDebugLog("Извлечение authorization code...");

    try {
      // Извлекаем code из URL, если пользователь вставил полный URL
      let authCode = manualAuthCode.trim();
      
      // Если это полный URL, извлекаем code
      if (authCode.includes('code=')) {
        try {
          const url = new URL(authCode);
          const codeParam = url.searchParams.get('code');
          if (codeParam) {
            authCode = codeParam;
            addDebugLog(`Извлечен code из URL: ${authCode.substring(0, 20)}...`);
          }
        } catch (e) {
          // Если не валидный URL, пробуем извлечь вручную
          const codeMatch = authCode.match(/code=([^&]+)/);
          if (codeMatch && codeMatch[1]) {
            authCode = codeMatch[1];
            addDebugLog(`Извлечен code из строки: ${authCode.substring(0, 20)}...`);
          }
        }
      }
      
      if (!authCode || authCode.length < 10) {
        addDebugLog("✗ Не удалось извлечь authorization code");
        setTestResult("✗ Не удалось извлечь authorization code из введенных данных");
        setExchangingCode(false);
        return;
      }

      addDebugLog(`Обмен кода на refresh_token...`);
      const result: any = await call("exchange_code_for_token", {
        auth_code: authCode,
        client_id: settings.clientId.trim(),
        client_secret: settings.clientSecret.trim(),
      });

      if (result.success && result.refresh_token) {
        const updatedSettings = {
          ...settings,
          refreshToken: result.refresh_token
        };
        setSettings(updatedSettings);
        setManualAuthCode("");
        addDebugLog("✓ Refresh token успешно получен!");
        setTestResult("✓ Refresh token успешно получен и сохранен!");
      } else {
        addDebugLog(`✗ Ошибка: ${result.error || "Ошибка обмена кода"}`);
        setTestResult(`✗ ${result.error || "Ошибка обмена кода"}`);
      }
    } catch (error) {
      setTestResult(`✗ Ошибка: ${error}`);
    } finally {
      setExchangingCode(false);
    }
  };

  const testConnection = async () => {
    if (!settings.refreshToken.trim()) {
      setTestResult("Введите refresh_token");
      return;
    }

    setTesting(true);
    setTestResult(null);

    if (!settings.clientId || !settings.clientSecret) {
      setTestResult("✗ Укажите Client ID и Client Secret");
      return;
    }

    try {
      const result: any = await call("test_gdrive_connection", {
        refresh_token: settings.refreshToken,
        client_id: settings.clientId,
        client_secret: settings.clientSecret,
      });

      if (result.success) {
        setTestResult(`✓ ${result.message || "Подключение успешно"}`);
      } else {
        setTestResult(`✗ ${result.error || "Ошибка подключения"}`);
      }
    } catch (error) {
      setTestResult(`✗ Ошибка: ${error}`);
    } finally {
      setTesting(false);
    }
  };

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

  return (
    <div>
      {/* Google Drive Settings Section */}
      <PanelSection title="Google Drive Settings">
        <PanelSectionRow>
          <div style={{ fontSize: "12px", color: "#888", marginBottom: "8px" }}>
            <strong>Важно:</strong> Каждый пользователь должен создать своё приложение в Google Cloud Console.
            <br />Это нужно для безопасности и изоляции данных.
          </div>
        </PanelSectionRow>

        <PanelSection title="📋 Пошаговая инструкция создания приложения">
          <PanelSectionRow>
            <div style={{ fontSize: "11px", color: "#aaa", lineHeight: "1.4" }}>
              <strong>Шаг 1:</strong> Откройте <a href="https://console.cloud.google.com/" target="_blank" style={{ color: "#1a9fff" }}>Google Cloud Console</a>
              <br /><strong>Шаг 2:</strong> Создайте новый проект (или выберите существующий)
              <br /><strong>Шаг 3:</strong> APIs & Services → Enable APIs → включите "Google Drive API"
              <br /><strong>Шаг 4:</strong> APIs & Services → Credentials → Create Credentials → OAuth client ID
              <br /><strong>Шаг 5:</strong> Тип: "Web application", название: "GameSync NonSteam"
              <br /><strong>Шаг 6:</strong> Authorized redirect URIs: <code style={{ color: "#1a9fff" }}>http://localhost:8080/callback</code>
              <br /><strong>Шаг 7:</strong> Скопируйте Client ID и Client Secret
              <br /><strong>Шаг 8:</strong> OAuth consent screen → Test users → добавьте ваш email
            </div>
          </PanelSectionRow>
        </PanelSection>

        <PanelSectionRow>
          <div style={{ fontSize: "12px", color: "#888", marginBottom: "8px" }}>
            Данные из Google Cloud Console → Credentials → Ваш OAuth 2.0 Client ID
          </div>
        </PanelSectionRow>

        <PanelSectionRow>
          <ButtonItem
            layout="below"
            onClick={handleLoadFromFile}
            disabled={loadingFile}
          >
            {loadingFile ? "Загрузка..." : "Загрузить из файла"}
          </ButtonItem>
        </PanelSectionRow>

        <PanelSectionRow>
          <TextField
            label="Client ID"
            value={settings.clientId || ""}
            onChange={(e) => {
              const newValue = e.target.value;
              console.log("Client ID changed:", newValue.length, "chars");
              const updated = { ...settings, clientId: newValue };
              setSettings(updated);
              console.log("Settings after update:", { clientId: updated.clientId?.length || 0, clientSecret: updated.clientSecret?.length || 0 });
            }}
            description="Идентификатор клиента из Google Cloud Console"
          />
        </PanelSectionRow>

        <PanelSectionRow>
          <TextField
            label="Client Secret"
            value={settings.clientSecret || ""}
            onChange={(e) => {
              const newValue = e.target.value;
              console.log("Client Secret changed:", newValue.length, "chars");
              const updated = { ...settings, clientSecret: newValue };
              setSettings(updated);
              console.log("Settings after update:", { clientId: updated.clientId?.length || 0, clientSecret: updated.clientSecret?.length || 0 });
            }}
            description="Секретный ключ клиента из Google Cloud Console"
          />
        </PanelSectionRow>

        <PanelSectionRow>
          <ButtonItem
            layout="below"
            onClick={startAutoAuth}
            disabled={authorizing || !settings.clientId?.trim() || !settings.clientSecret?.trim()}
          >
            {authorizing ? "Авторизация..." : "Авторизоваться автоматически"}
          </ButtonItem>
        </PanelSectionRow>

        {debugLog.length > 0 && (
          <PanelSection title="Отладочная информация">
            {debugLog.map((log, index) => (
              <PanelSectionRow key={index}>
                <div style={{ fontSize: "10px", color: "#aaa", wordBreak: "break-all" }}>
                  {log}
                </div>
              </PanelSectionRow>
            ))}
          </PanelSection>
        )}

        {testResult && (testResult.includes("redirect_uri_mismatch") || testResult.includes("access_denied") || testResult.includes("403")) && (
          <PanelSection title="⚠️ Ошибка авторизации Google">
            <PanelSectionRow>
              <div style={{ fontSize: "12px", color: "#ff6b6b", marginBottom: "8px" }}>
                {testResult.includes("redirect_uri_mismatch") ? (
                  <>
                    <strong>Проблема:</strong> Redirect URI не добавлен в Google Cloud Console
                    <br /><br />
                    <strong>Решение:</strong>
                    <br />1. Откройте Google Cloud Console
                    <br />2. APIs & Services → Credentials
                    <br />3. Откройте ваш OAuth 2.0 Client ID
                    <br />4. В "Authorized redirect URIs" добавьте:
                    <br /><code style={{ color: "#1a9fff" }}>http://localhost:8080/callback</code>
                    <br />5. Сохраните и подождите 5-10 минут
                  </>
                ) : (
                  <>
                    <strong>Проблема:</strong> Приложение не прошло проверку Google (режим тестирования)
                    <br /><br />
                    <strong>Решение:</strong>
                    <br />1. Откройте Google Cloud Console
                    <br />2. APIs & Services → OAuth consent screen
                    <br />3. В разделе "Test users" нажмите "ADD USERS"
                    <br />4. Добавьте ваш email: <code style={{ color: "#1a9fff" }}>differinwaemer@gmail.com</code>
                    <br />5. Сохраните изменения
                    <br />6. Попробуйте авторизацию снова
                    <br /><br />
                    <strong>Альтернатива:</strong> Опубликуйте приложение (требует верификации Google)
                  </>
                )}
              </div>
            </PanelSectionRow>
          </PanelSection>
        )}

        <PanelSection title="Ручная авторизация (если автоматическая не работает)">
          <PanelSectionRow>
            <div style={{ fontSize: "11px", color: "#888", marginBottom: "8px" }}>
              <strong>Важно:</strong> Если видите ошибку 404 на localhost:8080/callback - это нормально! 
              <br />Код авторизации уже в адресной строке браузера.
            </div>
          </PanelSectionRow>

          <PanelSectionRow>
            <ButtonItem
              layout="below"
              onClick={generateOAuthUrl}
              disabled={!settings.clientId?.trim() || !settings.clientSecret?.trim()}
            >
              Сгенерировать OAuth URL
            </ButtonItem>
          </PanelSectionRow>
          
          {oauthUrl && (
            <PanelSectionRow>
              <div style={{ fontSize: "11px", color: "#888", wordBreak: "break-all", marginBottom: "8px" }}>
                {oauthUrl}
              </div>
            </PanelSectionRow>
          )}

          <PanelSectionRow>
            <div style={{ fontSize: "11px", color: "#888", marginBottom: "8px" }}>
              <strong>Как получить код:</strong>
              <br />1. После авторизации Google перенаправит на localhost:8080/callback (может быть ошибка 404 - это нормально)
              <br />2. В адресной строке браузера будет URL: <code style={{ color: "#1a9fff" }}>http://localhost:8080/callback?code=4/0ASc3gC...</code>
              <br />3. Скопируйте весь URL из адресной строки
              <br />4. Вставьте в поле ниже (можно вставить весь URL - код извлечется автоматически)
            </div>
          </PanelSectionRow>

          <PanelSectionRow>
            <TextField
              label="Authorization Code или полный URL"
              value={manualAuthCode}
              onChange={(e) => setManualAuthCode(e.target.value)}
              description="Вставьте код из URL после авторизации (можно вставить весь URL - код извлечется автоматически)"
            />
          </PanelSectionRow>

          <PanelSectionRow>
            <ButtonItem
              layout="below"
              onClick={exchangeAuthCode}
              disabled={exchangingCode || !manualAuthCode.trim()}
            >
              {exchangingCode ? "Обмен кода..." : "Обменять код на refresh_token"}
            </ButtonItem>
          </PanelSectionRow>
        </PanelSection>

        <PanelSectionRow>
          <TextField
            label="Refresh Token"
            value={settings.refreshToken}
            onChange={(e) =>
              setSettings({ ...settings, refreshToken: e.target.value })
            }
            description="Обязательно! Получите через Google OAuth Playground"
          />
        </PanelSectionRow>

        <PanelSectionRow>
          <div style={{ fontSize: "11px", color: "#888", padding: "8px", backgroundColor: "rgba(255,255,255,0.05)", borderRadius: "4px" }}>
            <div style={{ fontWeight: "bold", marginBottom: "4px" }}>Как получить Refresh Token:</div>
            <div>1. Откройте: <span style={{ color: "#4a9eff" }}>developers.google.com/oauthplayground</span></div>
            <div>2. Настройки (⚙️) → "Use your own OAuth credentials"</div>
            <div>3. Вставьте Client ID и Client Secret</div>
            <div>4. В левой панели найдите и выберите: <span style={{ color: "#4a9eff" }}>drive.file</span> (или введите вручную: https://www.googleapis.com/auth/drive.file)</div>
            <div>5. Нажмите "Authorize APIs" → войдите в Google</div>
            <div>6. Нажмите "Exchange authorization code for tokens"</div>
            <div>7. Скопируйте <span style={{ fontWeight: "bold" }}>refresh_token</span> из ответа</div>
          </div>
        </PanelSectionRow>

        <PanelSectionRow>
          <ButtonItem layout="below" onClick={testConnection} disabled={testing}>
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

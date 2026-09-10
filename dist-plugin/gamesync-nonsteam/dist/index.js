const manifest = {"name":"GameSync NonSteam"};
const API_VERSION = 2;
const internalAPIConnection = window.__DECKY_SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED_deckyLoaderAPIInit;
if (!internalAPIConnection) {
    throw new Error('[@decky/api]: Failed to connect to the loader as as the loader API was not initialized. This is likely a bug in Decky Loader.');
}
let api;
try {
    api = internalAPIConnection.connect(API_VERSION, manifest.name);
}
catch {
    api = internalAPIConnection.connect(1, manifest.name);
    console.warn(`[@decky/api] Requested API version ${API_VERSION} but the running loader only supports version 1. Some features may not work.`);
}
if (api._version != API_VERSION) {
    console.warn(`[@decky/api] Requested API version ${API_VERSION} but the running loader only supports version ${api._version}. Some features may not work.`);
}
const call = api.call;
const routerHook = api.routerHook;
const definePlugin = (fn) => {
    return (...args) => {
        return fn(...args);
    };
};

var DefaultContext = {
  color: undefined,
  size: undefined,
  className: undefined,
  style: undefined,
  attr: undefined
};
var IconContext = SP_REACT.createContext && /*#__PURE__*/SP_REACT.createContext(DefaultContext);

var _excluded = ["attr", "size", "title"];
function _objectWithoutProperties(source, excluded) { if (source == null) return {}; var target = _objectWithoutPropertiesLoose(source, excluded); var key, i; if (Object.getOwnPropertySymbols) { var sourceSymbolKeys = Object.getOwnPropertySymbols(source); for (i = 0; i < sourceSymbolKeys.length; i++) { key = sourceSymbolKeys[i]; if (excluded.indexOf(key) >= 0) continue; if (!Object.prototype.propertyIsEnumerable.call(source, key)) continue; target[key] = source[key]; } } return target; }
function _objectWithoutPropertiesLoose(source, excluded) { if (source == null) return {}; var target = {}; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { if (excluded.indexOf(key) >= 0) continue; target[key] = source[key]; } } return target; }
function _extends() { _extends = Object.assign ? Object.assign.bind() : function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; }; return _extends.apply(this, arguments); }
function ownKeys(e, r) { var t = Object.keys(e); if (Object.getOwnPropertySymbols) { var o = Object.getOwnPropertySymbols(e); r && (o = o.filter(function (r) { return Object.getOwnPropertyDescriptor(e, r).enumerable; })), t.push.apply(t, o); } return t; }
function _objectSpread(e) { for (var r = 1; r < arguments.length; r++) { var t = null != arguments[r] ? arguments[r] : {}; r % 2 ? ownKeys(Object(t), true).forEach(function (r) { _defineProperty(e, r, t[r]); }) : Object.getOwnPropertyDescriptors ? Object.defineProperties(e, Object.getOwnPropertyDescriptors(t)) : ownKeys(Object(t)).forEach(function (r) { Object.defineProperty(e, r, Object.getOwnPropertyDescriptor(t, r)); }); } return e; }
function _defineProperty(obj, key, value) { key = _toPropertyKey(key); if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }
function _toPropertyKey(t) { var i = _toPrimitive(t, "string"); return "symbol" == typeof i ? i : i + ""; }
function _toPrimitive(t, r) { if ("object" != typeof t || !t) return t; var e = t[Symbol.toPrimitive]; if (void 0 !== e) { var i = e.call(t, r); if ("object" != typeof i) return i; throw new TypeError("@@toPrimitive must return a primitive value."); } return ("string" === r ? String : Number)(t); }
function Tree2Element(tree) {
  return tree && tree.map((node, i) => /*#__PURE__*/SP_REACT.createElement(node.tag, _objectSpread({
    key: i
  }, node.attr), Tree2Element(node.child)));
}
function GenIcon(data) {
  return props => /*#__PURE__*/SP_REACT.createElement(IconBase, _extends({
    attr: _objectSpread({}, data.attr)
  }, props), Tree2Element(data.child));
}
function IconBase(props) {
  var elem = conf => {
    var {
        attr,
        size,
        title
      } = props,
      svgProps = _objectWithoutProperties(props, _excluded);
    var computedSize = size || conf.size || "1em";
    var className;
    if (conf.className) className = conf.className;
    if (props.className) className = (className ? className + " " : "") + props.className;
    return /*#__PURE__*/SP_REACT.createElement("svg", _extends({
      stroke: "currentColor",
      fill: "currentColor",
      strokeWidth: "0"
    }, conf.attr, attr, svgProps, {
      className: className,
      style: _objectSpread(_objectSpread({
        color: props.color || conf.color
      }, conf.style), props.style),
      height: computedSize,
      width: computedSize,
      xmlns: "http://www.w3.org/2000/svg"
    }), title && /*#__PURE__*/SP_REACT.createElement("title", null, title), props.children);
  };
  return IconContext !== undefined ? /*#__PURE__*/SP_REACT.createElement(IconContext.Consumer, null, conf => elem(conf)) : elem(DefaultContext);
}

// THIS FILE IS AUTO GENERATED
function FaCloud (props) {
  return GenIcon({"attr":{"viewBox":"0 0 640 512"},"child":[{"tag":"path","attr":{"d":"M537.6 226.6c4.1-10.7 6.4-22.4 6.4-34.6 0-53-43-96-96-96-19.7 0-38.1 6-53.3 16.2C367 64.2 315.3 32 256 32c-88.4 0-160 71.6-160 160 0 2.7.1 5.4.2 8.1C40.2 219.8 0 273.2 0 336c0 79.5 64.5 144 144 144h368c70.7 0 128-57.3 128-128 0-61.9-44-113.6-102.4-125.4z"},"child":[]}]})(props);
}

const WEBDAV_PROVIDERS = {
    custom: { name: 'Другой', url: '', description: 'Введите URL вручную' },
    nextcloud: { name: 'Nextcloud', url: 'https://nextcloud.com/remote.php/dav/files/USERNAME/', description: 'Бесплатный облачный хостинг' },
    yandex: { name: 'Яндекс Диск', url: 'https://webdav.yandex.ru', description: '10GB бесплатно, Basic или OAuth' },
    box: { name: 'Box', url: 'https://dav.box.com/dav/', description: 'Корпоративное хранилище' },
    owncloud: { name: 'ownCloud', url: 'https://your-server.com/remote.php/dav/files/USERNAME/', description: 'Свой сервер ownCloud' }
};
const S3_PROVIDERS = {
    custom: { name: 'Другой S3', endpoint: '', region: 'us-east-1', pathStyle: false },
    yandex: { name: 'Yandex Object Storage', endpoint: 'https://storage.yandexcloud.net', region: 'ru-central1', pathStyle: false },
    vk: { name: 'VK Cloud', endpoint: 'https://s3.mcs.mail.ru', region: 'ru-1', pathStyle: true },
    cloudru: { name: 'Cloud.ru', endpoint: 'https://s3.cloud.ru', region: 'ru-central1', pathStyle: true },
    aws: { name: 'AWS S3', endpoint: 'https://s3.amazonaws.com', region: 'us-east-1', pathStyle: false },
    backblaze: { name: 'Backblaze B2', endpoint: 'https://s3.us-west-004.backblazeb2.com', region: 'us-west-004', pathStyle: true },
    wasabi: { name: 'Wasabi', endpoint: 'https://s3.wasabisys.com', region: 'us-east-1', pathStyle: true },
    digitalocean: { name: 'DigitalOcean Spaces', endpoint: 'https://nyc3.digitaloceanspaces.com', region: 'nyc3', pathStyle: true }
};
const DEFAULT_SETTINGS = {
    storageProvider: 'webdav',
    webdavProvider: 'custom',
    webdavUrl: "",
    webdavUsername: "",
    webdavPassword: "",
    webdavOAuthToken: "",
    s3Provider: 'custom',
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
    defaultSavePaths: []
};
const SETTINGS_CHANGE_EVENT = 'gamesync-settings-change';
function loadSettings() {
    try {
        const saved = localStorage.getItem('gamesyncSettings');
        if (saved) {
            return { ...DEFAULT_SETTINGS, ...JSON.parse(saved) };
        }
    }
    catch (error) {
        console.error('Failed to load settings:', error);
    }
    return DEFAULT_SETTINGS;
}
function saveSettings(settings) {
    try {
        localStorage.setItem('gamesyncSettings', JSON.stringify(settings));
        window.dispatchEvent(new CustomEvent(SETTINGS_CHANGE_EVENT, { detail: settings }));
    }
    catch (error) {
        console.error('Failed to save settings:', error);
    }
}

/** Единая палитра интерфейса (совместима с тёмной темой Steam). */
const colors = {
    text: "#e8eaed",
    muted: "#9aa0a6",
    dim: "#71767b",
    success: "#5bb85b",
    error: "#e06060",
    warning: "#e0a94a",
    accent: "#66aaff",
    card: "rgba(255, 255, 255, 0.05)",
    border: "rgba(255, 255, 255, 0.08)",
};
const radius = { sm: 6, md: 8 };
const card = {
    background: colors.card,
    border: `1px solid ${colors.border}`,
    borderRadius: radius.md,
    padding: "8px 10px",
    width: "100%",
    boxSizing: "border-box",
};
const dimText = {
    fontSize: "11px",
    color: colors.dim,
    lineHeight: 1.4,
};
const pathText = {
    fontSize: "11px",
    color: "#c7ccd1",
    wordBreak: "break-all",
    fontFamily: "monospace",
    lineHeight: 1.35,
};
const actionRow = {
    display: "flex",
    gap: "8px",
    alignItems: "stretch",
    width: "100%",
};

const toneColor = {
    success: colors.success,
    error: colors.error,
    warning: colors.warning,
    info: colors.accent,
};
const toneBg = {
    success: "rgba(91, 184, 91, 0.12)",
    error: "rgba(224, 96, 96, 0.12)",
    warning: "rgba(224, 169, 74, 0.12)",
    info: "rgba(102, 170, 255, 0.12)",
};
/** Короткая подсказка под заголовком. */
function Hint({ children }) {
    return SP_JSX.jsx("div", { style: { fontSize: "12px", color: colors.muted, lineHeight: 1.4 }, children: children });
}
/** Цветное сообщение статуса (успех/ошибка/предупреждение). */
function StatusMessage({ tone, children }) {
    return (SP_JSX.jsx("div", { style: {
            display: "flex",
            alignItems: "center",
            gap: "8px",
            padding: "8px 10px",
            borderRadius: radius.sm,
            background: toneBg[tone],
            borderLeft: `3px solid ${toneColor[tone]}`,
            color: colors.text,
            fontSize: "12px",
            lineHeight: 1.4,
            width: "100%",
            boxSizing: "border-box",
        }, children: children }));
}
/** Небольшой цветной бейдж. */
function Badge({ tone = "info", children }) {
    return (SP_JSX.jsx("span", { style: {
            display: "inline-block",
            padding: "1px 7px",
            borderRadius: "999px",
            fontSize: "10px",
            fontWeight: 600,
            color: toneColor[tone],
            background: toneBg[tone],
            border: `1px solid ${toneColor[tone]}44`,
            whiteSpace: "nowrap",
        }, children: children }));
}
/** Моноширинный путь с переносом. */
function PathText({ children }) {
    return SP_JSX.jsx("div", { style: pathText, children: children });
}
function Loading({ text }) {
    return (SP_JSX.jsx(DFL.PanelSection, { children: SP_JSX.jsx(DFL.PanelSectionRow, { children: SP_JSX.jsxs("div", { style: { display: "flex", alignItems: "center", gap: "10px", color: colors.muted, fontSize: "12px" }, children: [SP_JSX.jsx(DFL.Spinner, {}), SP_JSX.jsx("span", { children: text })] }) }) }));
}
function EmptyState({ text }) {
    return (SP_JSX.jsx(DFL.PanelSection, { children: SP_JSX.jsx(DFL.PanelSectionRow, { children: SP_JSX.jsx("div", { style: { textAlign: "center", color: colors.dim, fontSize: "12px", padding: "12px 0" }, children: text }) }) }));
}
function ErrorState({ text, onRetry }) {
    return (SP_JSX.jsxs(DFL.PanelSection, { children: [SP_JSX.jsx(DFL.PanelSectionRow, { children: SP_JSX.jsx(StatusMessage, { tone: "error", children: text }) }), onRetry && (SP_JSX.jsx(DFL.PanelSectionRow, { children: SP_JSX.jsx(DFL.ButtonItem, { layout: "below", onClick: onRetry, children: "\u041F\u043E\u0432\u0442\u043E\u0440\u0438\u0442\u044C" }) }))] }));
}

function GameList() {
    const [games, setGames] = SP_REACT.useState([]);
    const [loading, setLoading] = SP_REACT.useState(true);
    const [error, setError] = SP_REACT.useState(null);
    const [syncing, setSyncing] = SP_REACT.useState({});
    const [syncStatus, setSyncStatus] = SP_REACT.useState({});
    const loadGames = async (forceRefresh = false) => {
        setLoading(true);
        setError(null);
        try {
            const result = await call("scan_games", { force_refresh: forceRefresh });
            if (result.success && result.games) {
                setGames(result.games);
            }
            else {
                setError(result.error || "Ошибка загрузки игр");
            }
        }
        catch (err) {
            setError(`Ошибка: ${err}`);
        }
        finally {
            setLoading(false);
        }
    };
    const syncGame = async (game) => {
        const settings = loadSettings();
        const allSavePaths = [...settings.defaultSavePaths, ...game.savePaths];
        const uniquePaths = Array.from(new Set(allSavePaths));
        if (uniquePaths.length === 0) {
            setSyncStatus((prev) => ({
                ...prev,
                [game.name]: { gameName: game.name, status: "error", message: "Нет путей сохранений" },
            }));
            return;
        }
        setSyncing((prev) => ({ ...prev, [game.name]: true }));
        setSyncStatus((prev) => ({ ...prev, [game.name]: { gameName: game.name, status: "syncing" } }));
        try {
            const result = await call("sync_game", { game_name: game.name, save_paths: uniquePaths });
            setSyncStatus((prev) => ({
                ...prev,
                [game.name]: {
                    gameName: game.name,
                    status: result.success ? "success" : "error",
                    message: result.success ? result.message || "Синхронизация завершена" : result.error || "Ошибка синхронизации",
                },
            }));
        }
        catch (err) {
            setSyncStatus((prev) => ({
                ...prev,
                [game.name]: { gameName: game.name, status: "error", message: `Ошибка: ${err}` },
            }));
        }
        finally {
            setSyncing((prev) => ({ ...prev, [game.name]: false }));
        }
    };
    SP_REACT.useEffect(() => {
        loadGames();
    }, []);
    return (SP_JSX.jsxs("div", { children: [SP_JSX.jsx(DFL.PanelSection, { title: `Найденные игры (${games.length})`, children: SP_JSX.jsx(DFL.PanelSectionRow, { children: SP_JSX.jsxs("div", { style: actionRow, children: [SP_JSX.jsx("div", { style: { flex: 1 }, children: SP_JSX.jsx(DFL.ButtonItem, { layout: "below", onClick: () => loadGames(true), disabled: loading, children: loading ? "Сканирование..." : "Обновить" }) }), SP_JSX.jsx("div", { style: { flex: 1 }, children: SP_JSX.jsx(DFL.ButtonItem, { layout: "below", onClick: () => {
                                        DFL.Router.CloseSideMenus();
                                        DFL.Router.Navigate("/gamesync-settings");
                                        setTimeout(() => window.dispatchEvent(new CustomEvent("gamesync-switch-tab", { detail: "game_paths" })), 100);
                                    }, children: "\u041D\u0430\u0441\u0442\u0440\u043E\u0438\u0442\u044C \u043F\u0443\u0442\u0438" }) })] }) }) }), loading && SP_JSX.jsx(Loading, { text: "\u0421\u043A\u0430\u043D\u0438\u0440\u043E\u0432\u0430\u043D\u0438\u0435 \u0438\u0433\u0440 PortProton..." }), error && !loading && SP_JSX.jsx(ErrorState, { text: error, onRetry: () => loadGames() }), games.length === 0 && !loading && !error && SP_JSX.jsx(EmptyState, { text: "\u0418\u0433\u0440\u044B \u043D\u0435 \u043D\u0430\u0439\u0434\u0435\u043D\u044B" }), !loading &&
                games.map((game, index) => {
                    const isSyncing = syncing[game.name];
                    const status = syncStatus[game.name];
                    return (SP_JSX.jsxs(DFL.PanelSection, { title: game.name, children: [SP_JSX.jsx(DFL.PanelSectionRow, { children: SP_JSX.jsxs("div", { style: { display: "flex", flexWrap: "wrap", gap: "6px", alignItems: "center" }, children: [SP_JSX.jsx(Badge, { tone: game.hasSaves ? "success" : "warning", children: game.hasSaves ? `${game.savePaths.length} путей` : "нет сохранений" }), typeof game.steamAppId === "number" && SP_JSX.jsxs(Badge, { children: ["appid ", game.steamAppId] }), game.sharedPrefix && SP_JSX.jsx(Badge, { tone: "warning", children: "\u043E\u0431\u0449\u0438\u0439 \u043F\u0440\u0435\u0444\u0438\u043A\u0441" })] }) }), game.savePaths.length > 0 && (SP_JSX.jsx(DFL.PanelSectionRow, { children: SP_JSX.jsxs("div", { style: card, children: [SP_JSX.jsx("div", { style: { ...dimText, marginBottom: "6px" }, children: "\u041F\u0443\u0442\u0438 \u0441\u043E\u0445\u0440\u0430\u043D\u0435\u043D\u0438\u0439:" }), game.savePaths.slice(0, 3).map((path, pathIdx) => (SP_JSX.jsx("div", { style: { marginBottom: pathIdx < Math.min(game.savePaths.length, 3) - 1 ? "6px" : 0 }, children: SP_JSX.jsx(PathText, { children: path }) }, pathIdx))), game.savePaths.length > 3 && (SP_JSX.jsxs("div", { style: { ...dimText, marginTop: "6px" }, children: ["+", game.savePaths.length - 3, " \u0435\u0449\u0451\u2026"] }))] }) })), SP_JSX.jsx(DFL.PanelSectionRow, { children: SP_JSX.jsxs("div", { style: actionRow, children: [SP_JSX.jsx("div", { style: { flex: 1 }, children: SP_JSX.jsx(DFL.ButtonItem, { layout: "below", onClick: () => {
                                                    DFL.Router.CloseSideMenus();
                                                    DFL.Router.Navigate("/gamesync-settings");
                                                    setTimeout(() => window.dispatchEvent(new CustomEvent("gamesync-switch-tab", { detail: "game_paths" })), 100);
                                                }, children: "\u0418\u0437\u043C\u0435\u043D\u0438\u0442\u044C \u043F\u0443\u0442\u0438" }) }), SP_JSX.jsx("div", { style: { flex: 1 }, children: SP_JSX.jsx(DFL.ButtonItem, { layout: "below", onClick: () => syncGame(game), disabled: isSyncing || !game.hasSaves, children: isSyncing ? (SP_JSX.jsxs("span", { style: { display: "flex", alignItems: "center", gap: "8px", justifyContent: "center" }, children: [SP_JSX.jsx(DFL.Spinner, {}), SP_JSX.jsx("span", { children: "\u0421\u0438\u043D\u0445\u0440\u043E\u043D\u0438\u0437\u0430\u0446\u0438\u044F\u2026" })] })) : ("Синхронизировать") }) })] }) }), status && (SP_JSX.jsx(DFL.PanelSectionRow, { children: SP_JSX.jsx(StatusMessage, { tone: status.status === "success" ? "success" : status.status === "error" ? "error" : "info", children: status.message || "Синхронизация…" }) }))] }, index));
                })] }));
}

const formatDate$1 = (isoString) => {
    try {
        return new Date(isoString).toLocaleString("ru-RU", {
            year: "numeric",
            month: "2-digit",
            day: "2-digit",
            hour: "2-digit",
            minute: "2-digit",
        });
    }
    catch {
        return isoString;
    }
};
function SyncedGamesList() {
    const [syncedGames, setSyncedGames] = SP_REACT.useState([]);
    const [loading, setLoading] = SP_REACT.useState(true);
    const [error, setError] = SP_REACT.useState(null);
    const [syncing, setSyncing] = SP_REACT.useState({});
    const [status, setStatus] = SP_REACT.useState(null);
    const loadSyncedGames = async () => {
        setLoading(true);
        setError(null);
        try {
            const result = await call("get_synced_games", {});
            if (result.success && result.games) {
                setSyncedGames(result.games);
            }
            else {
                setError(result.error || "Ошибка загрузки списка");
            }
        }
        catch (err) {
            setError(`Ошибка: ${err}`);
        }
        finally {
            setLoading(false);
        }
    };
    const resyncGame = async (game) => {
        setSyncing((prev) => ({ ...prev, [game.gameName]: true }));
        setStatus(null);
        try {
            const scanResult = await call("scan_games", {});
            if (scanResult.success && scanResult.games) {
                const gameInfo = scanResult.games.find((g) => g.name === game.gameName);
                if (gameInfo && gameInfo.savePaths && gameInfo.savePaths.length > 0) {
                    const settings = loadSettings();
                    const uniquePaths = Array.from(new Set([...settings.defaultSavePaths, ...gameInfo.savePaths]));
                    const syncResult = await call("sync_game", { game_name: game.gameName, save_paths: uniquePaths });
                    if (syncResult.success) {
                        await loadSyncedGames();
                    }
                    else {
                        setStatus(syncResult.error || "Ошибка синхронизации");
                    }
                }
                else {
                    setStatus(`Для «${game.gameName}» не найдены пути сохранений`);
                }
            }
        }
        catch (err) {
            setStatus(`Ошибка: ${err}`);
        }
        finally {
            setSyncing((prev) => ({ ...prev, [game.gameName]: false }));
        }
    };
    SP_REACT.useEffect(() => {
        loadSyncedGames();
    }, []);
    if (loading) {
        return SP_JSX.jsx(Loading, { text: "\u0417\u0430\u0433\u0440\u0443\u0437\u043A\u0430 \u0441\u043F\u0438\u0441\u043A\u0430 \u0441\u0438\u043D\u0445\u0440\u043E\u043D\u0438\u0437\u0430\u0446\u0438\u0439..." });
    }
    if (error) {
        return SP_JSX.jsx(ErrorState, { text: error, onRetry: loadSyncedGames });
    }
    if (syncedGames.length === 0) {
        return SP_JSX.jsx(EmptyState, { text: "\u0421\u0438\u043D\u0445\u0440\u043E\u043D\u0438\u0437\u0438\u0440\u043E\u0432\u0430\u043D\u043D\u044B\u0445 \u0438\u0433\u0440 \u043F\u043E\u043A\u0430 \u043D\u0435\u0442" });
    }
    return (SP_JSX.jsxs(DFL.PanelSection, { title: `Синхронизированные игры (${syncedGames.length})`, children: [SP_JSX.jsx(DFL.PanelSectionRow, { children: SP_JSX.jsx(DFL.ButtonItem, { layout: "below", onClick: loadSyncedGames, disabled: loading, children: "\u041E\u0431\u043D\u043E\u0432\u0438\u0442\u044C \u0441\u043F\u0438\u0441\u043E\u043A" }) }), status && (SP_JSX.jsx(DFL.PanelSectionRow, { children: SP_JSX.jsx(StatusMessage, { tone: "error", children: status }) })), syncedGames.map((game, index) => {
                const isSyncing = syncing[game.gameName];
                return (SP_JSX.jsx(DFL.PanelSectionRow, { children: SP_JSX.jsxs("div", { style: { display: "flex", flexDirection: "column", gap: "6px", width: "100%" }, children: [SP_JSX.jsxs("div", { style: { display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: "8px" }, children: [SP_JSX.jsx("span", { style: { fontSize: "13px", fontWeight: 600, color: colors.text }, children: game.gameName }), SP_JSX.jsx("span", { style: { fontSize: "11px", color: colors.dim }, children: formatDate$1(game.lastSync) })] }), SP_JSX.jsx("div", { style: actionRow, children: SP_JSX.jsx(DFL.ButtonItem, { layout: "below", onClick: () => resyncGame(game), disabled: isSyncing, children: isSyncing ? (SP_JSX.jsxs("span", { style: { display: "flex", alignItems: "center", gap: "8px", justifyContent: "center" }, children: [SP_JSX.jsx(DFL.Spinner, {}), SP_JSX.jsx("span", { children: "\u0421\u0438\u043D\u0445\u0440\u043E\u043D\u0438\u0437\u0430\u0446\u0438\u044F\u2026" })] })) : ("Синхронизировать снова") }) })] }) }, index));
            })] }));
}

function GameSyncMain() {
    const [status, setStatus] = SP_REACT.useState("Проверка подключения...");
    const [connected, setConnected] = SP_REACT.useState(false);
    SP_REACT.useEffect(() => {
        call("get_test", {})
            .then((result) => {
            if (result && result.success) {
                setConnected(true);
                setStatus("Плагин готов к работе");
            }
            else {
                setConnected(false);
                setStatus(result?.error || result?.message || "Неизвестная ошибка");
            }
        })
            .catch((error) => {
            setConnected(false);
            setStatus(String(error?.message || error));
        });
    }, []);
    return (SP_JSX.jsxs("div", { children: [SP_JSX.jsxs(DFL.PanelSection, { children: [SP_JSX.jsx(DFL.PanelSectionRow, { children: SP_JSX.jsxs(StatusMessage, { tone: connected ? "success" : "error", children: [SP_JSX.jsx("span", { style: { fontWeight: 600 }, children: connected ? "Подключено" : "Нет связи" }), SP_JSX.jsxs("span", { style: { color: colors.muted }, children: ["\u00B7 ", status] })] }) }), SP_JSX.jsx(DFL.PanelSectionRow, { children: SP_JSX.jsx(DFL.ButtonItem, { layout: "below", onClick: () => {
                                DFL.Router.CloseSideMenus();
                                DFL.Router.Navigate("/gamesync-settings");
                            }, children: "\u041D\u0430\u0441\u0442\u0440\u043E\u0439\u043A\u0438 \u0438 \u043F\u0443\u0442\u0438 \u0441\u043E\u0445\u0440\u0430\u043D\u0435\u043D\u0438\u0439" }) })] }), connected && (SP_JSX.jsxs(SP_JSX.Fragment, { children: [SP_JSX.jsx(SyncedGamesList, {}), SP_JSX.jsx(GameList, {})] }))] }));
}

function Settings() {
    const [settings, setSettings] = SP_REACT.useState(loadSettings());
    const [testing, setTesting] = SP_REACT.useState(false);
    const [testResult, setTestResult] = SP_REACT.useState(null);
    const [newPath, setNewPath] = SP_REACT.useState("");
    const [validating, setValidating] = SP_REACT.useState(false);
    const [pathValidationResult, setPathValidationResult] = SP_REACT.useState(null);
    const update = (patch) => setSettings((prev) => ({ ...prev, ...patch }));
    SP_REACT.useEffect(() => {
        const loadStorageConfig = async () => {
            try {
                const result = await call("load_storage_config", {});
                if (result.success && result.config) {
                    const config = result.config;
                    setSettings((prev) => ({
                        ...prev,
                        storageProvider: ["s3", "webdav", "ftp", "sftp"].includes(config.provider) ? config.provider : "webdav",
                        webdavProvider: config.webdav_provider && ["custom", "nextcloud", "yandex", "box", "owncloud"].includes(config.webdav_provider)
                            ? config.webdav_provider
                            : prev.webdavProvider || "custom",
                        webdavUrl: config.url || prev.webdavUrl || "",
                        webdavUsername: config.username || prev.webdavUsername || "",
                        webdavPassword: config.password || prev.webdavPassword || "",
                        webdavOAuthToken: config.oauth_token || prev.webdavOAuthToken || "",
                        s3Provider: config.s3_provider &&
                            ["custom", "yandex", "vk", "cloudru", "aws", "backblaze", "wasabi", "digitalocean"].includes(config.s3_provider)
                            ? config.s3_provider
                            : prev.s3Provider || "custom",
                        s3Endpoint: config.endpoint || prev.s3Endpoint || "",
                        s3Region: config.region || prev.s3Region || "us-east-1",
                        s3Bucket: config.bucket || prev.s3Bucket || "",
                        s3AccessKey: config.access_key || prev.s3AccessKey || "",
                        s3SecretKey: config.secret_key || prev.s3SecretKey || "",
                        s3PathStyle: typeof config.path_style === "boolean" ? config.path_style : prev.s3PathStyle ?? false,
                        s3SignatureVersion: config.signature_version || prev.s3SignatureVersion || "s3v4",
                        ftpHost: config.provider === "ftp" ? config.host || "" : prev.ftpHost || "",
                        ftpPort: config.provider === "ftp" ? String(config.port ?? prev.ftpPort ?? "21") : prev.ftpPort || "21",
                        ftpUsername: config.provider === "ftp" ? config.username || "" : prev.ftpUsername || "",
                        ftpPassword: config.provider === "ftp" ? config.password || "" : prev.ftpPassword || "",
                        ftpUseTls: config.provider === "ftp" ? !!config.use_tls : prev.ftpUseTls ?? false,
                        ftpPassive: config.provider === "ftp" ? config.passive ?? true : prev.ftpPassive ?? true,
                        sftpHost: config.provider === "sftp" ? config.host || "" : prev.sftpHost || "",
                        sftpPort: config.provider === "sftp" ? String(config.port ?? prev.sftpPort ?? "22") : prev.sftpPort || "22",
                        sftpUsername: config.provider === "sftp" ? config.username || "" : prev.sftpUsername || "",
                        sftpPassword: config.provider === "sftp" ? config.password || "" : prev.sftpPassword || "",
                        sftpKeyPath: config.provider === "sftp" ? config.key_path || "" : prev.sftpKeyPath || "",
                        sftpKeyPassphrase: config.provider === "sftp" ? config.key_passphrase || "" : prev.sftpKeyPassphrase || "",
                    }));
                }
            }
            catch (error) {
                console.error("Error loading storage config:", error);
            }
        };
        loadStorageConfig();
    }, []);
    SP_REACT.useEffect(() => {
        saveSettings(settings);
    }, [settings]);
    const buildPayload = (s) => {
        const provider = s.storageProvider;
        if (provider === "webdav") {
            return {
                provider,
                url: s.webdavUrl,
                username: s.webdavUsername,
                password: s.webdavPassword,
                oauth_token: s.webdavOAuthToken,
                webdav_provider: s.webdavProvider,
            };
        }
        if (provider === "s3") {
            return {
                provider,
                s3_provider: s.s3Provider,
                endpoint: s.s3Endpoint,
                region: s.s3Region,
                bucket: s.s3Bucket,
                access_key: s.s3AccessKey,
                secret_key: s.s3SecretKey,
                path_style: s.s3PathStyle,
                signature_version: s.s3SignatureVersion,
            };
        }
        if (provider === "ftp") {
            return {
                provider,
                host: s.ftpHost,
                port: s.ftpPort,
                username: s.ftpUsername,
                password: s.ftpPassword,
                use_tls: s.ftpUseTls,
                passive: s.ftpPassive,
            };
        }
        return {
            provider,
            host: s.sftpHost,
            port: s.sftpPort,
            username: s.sftpUsername,
            password: s.sftpPassword,
            key_path: s.sftpKeyPath,
            key_passphrase: s.sftpKeyPassphrase,
        };
    };
    const saveStorageConfig = async (customSettings) => {
        try {
            const result = await call("save_storage_config", buildPayload(customSettings || settings));
            setTestResult(result.success
                ? { tone: "success", text: "Настройки сохранены" }
                : { tone: "error", text: result.error || "Ошибка сохранения" });
        }
        catch (error) {
            setTestResult({ tone: "error", text: error?.message || String(error) });
        }
    };
    const testConnection = async () => {
        setTesting(true);
        setTestResult(null);
        try {
            const result = await call("test_storage_connection", buildPayload(settings));
            setTestResult(result.success
                ? { tone: "success", text: result.message || "Подключение успешно" }
                : { tone: "error", text: result.error || result.message || "Ошибка подключения" });
        }
        catch (error) {
            setTestResult({ tone: "error", text: error?.message || String(error) });
        }
        finally {
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
            const result = await call("validate_save_path", { path: newPath.trim() });
            if (result.success && result.path) {
                if (settings.defaultSavePaths.includes(result.path)) {
                    setPathValidationResult("Этот путь уже добавлен");
                }
                else {
                    update({ defaultSavePaths: [...settings.defaultSavePaths, result.path] });
                    setNewPath("");
                }
            }
            else {
                setPathValidationResult(`✗ ${result.error || "Ошибка валидации"}`);
            }
        }
        catch (error) {
            setPathValidationResult(`✗ Ошибка: ${error}`);
        }
        finally {
            setValidating(false);
        }
    };
    const removeDefaultPath = (index) => {
        update({ defaultSavePaths: settings.defaultSavePaths.filter((_, i) => i !== index) });
    };
    const storageOptions = [
        { data: "webdav", label: "WebDAV" },
        { data: "s3", label: "S3 (Object Storage)" },
        { data: "ftp", label: "FTP / FTPS" },
        { data: "sftp", label: "SFTP" },
    ];
    return (SP_JSX.jsxs("div", { children: [SP_JSX.jsx(DFL.PanelSection, { title: "\u0425\u0440\u0430\u043D\u0438\u043B\u0438\u0449\u0435", children: SP_JSX.jsx(DFL.PanelSectionRow, { children: SP_JSX.jsx(DFL.Dropdown, { menuLabel: "\u0422\u0438\u043F \u0445\u0440\u0430\u043D\u0438\u043B\u0438\u0449\u0430", rgOptions: storageOptions, selectedOption: settings.storageProvider, onChange: (opt) => {
                            const next = { ...settings, storageProvider: opt.data };
                            setSettings(next);
                            setTimeout(() => saveStorageConfig(next), 100);
                        } }) }) }), settings.storageProvider === "webdav" && (SP_JSX.jsxs(DFL.PanelSection, { title: "WebDAV", children: [SP_JSX.jsx(DFL.PanelSectionRow, { children: SP_JSX.jsx(DFL.Dropdown, { menuLabel: "\u041F\u0440\u043E\u0432\u0430\u0439\u0434\u0435\u0440", rgOptions: Object.entries(WEBDAV_PROVIDERS).map(([key, provider]) => ({ data: key, label: provider.name })), selectedOption: settings.webdavProvider, onChange: (opt) => {
                                const key = opt.data;
                                const next = {
                                    ...settings,
                                    webdavProvider: key,
                                    webdavUrl: key === "custom" ? settings.webdavUrl : WEBDAV_PROVIDERS[key].url,
                                };
                                setSettings(next);
                                setTimeout(() => saveStorageConfig(next), 100);
                            } }) }), SP_JSX.jsx(DFL.PanelSectionRow, { children: SP_JSX.jsx(DFL.TextField, { label: "URL", value: settings.webdavUrl || "", onChange: (e) => update({ webdavUrl: e.target.value }), description: WEBDAV_PROVIDERS[settings.webdavProvider || "custom"]?.description || "URL WebDAV сервера" }) }), settings.webdavProvider === "yandex" && (SP_JSX.jsx(DFL.PanelSectionRow, { children: SP_JSX.jsx(DFL.TextField, { label: "OAuth \u0442\u043E\u043A\u0435\u043D (\u043E\u043F\u0446\u0438\u043E\u043D\u0430\u043B\u044C\u043D\u043E)", value: settings.webdavOAuthToken || "", onChange: (e) => update({ webdavOAuthToken: e.target.value }), description: "\u041E\u0441\u0442\u0430\u0432\u044C\u0442\u0435 \u043F\u0443\u0441\u0442\u044B\u043C, \u0447\u0442\u043E\u0431\u044B \u0438\u0441\u043F\u043E\u043B\u044C\u0437\u043E\u0432\u0430\u0442\u044C \u043B\u043E\u0433\u0438\u043D \u0438 \u043F\u0430\u0440\u043E\u043B\u044C \u043F\u0440\u0438\u043B\u043E\u0436\u0435\u043D\u0438\u044F" }) })), !settings.webdavOAuthToken && (SP_JSX.jsxs(SP_JSX.Fragment, { children: [SP_JSX.jsx(DFL.PanelSectionRow, { children: SP_JSX.jsx(DFL.TextField, { label: "\u041B\u043E\u0433\u0438\u043D", value: settings.webdavUsername || "", onChange: (e) => update({ webdavUsername: e.target.value }) }) }), SP_JSX.jsx(DFL.PanelSectionRow, { children: SP_JSX.jsx(DFL.TextField, { label: "\u041F\u0430\u0440\u043E\u043B\u044C", value: settings.webdavPassword || "", onChange: (e) => update({ webdavPassword: e.target.value }), bIsPassword: true }) })] })), SP_JSX.jsx(DFL.PanelSectionRow, { children: SP_JSX.jsx(Hint, { children: "Nextcloud, \u042F\u043D\u0434\u0435\u043A\u0441 \u0414\u0438\u0441\u043A, Box, ownCloud \u0438 \u0434\u0440\u0443\u0433\u0438\u0435 WebDAV\u2011\u0441\u0435\u0440\u0432\u0435\u0440\u044B." }) })] })), settings.storageProvider === "s3" && (SP_JSX.jsxs(DFL.PanelSection, { title: "S3 / Object Storage", children: [SP_JSX.jsx(DFL.PanelSectionRow, { children: SP_JSX.jsx(DFL.Dropdown, { menuLabel: "\u041F\u0440\u043E\u0432\u0430\u0439\u0434\u0435\u0440 S3", rgOptions: Object.entries(S3_PROVIDERS).map(([key, provider]) => ({ data: key, label: provider.name })), selectedOption: settings.s3Provider, onChange: (opt) => {
                                const key = opt.data;
                                const preset = S3_PROVIDERS[key];
                                const next = {
                                    ...settings,
                                    s3Provider: key,
                                    s3Endpoint: preset.endpoint || settings.s3Endpoint,
                                    s3Region: preset.region || settings.s3Region,
                                    s3PathStyle: preset.pathStyle,
                                };
                                setSettings(next);
                                setTimeout(() => saveStorageConfig(next), 100);
                            } }) }), SP_JSX.jsx(DFL.PanelSectionRow, { children: SP_JSX.jsx(DFL.TextField, { label: "Bucket", value: settings.s3Bucket || "", onChange: (e) => update({ s3Bucket: e.target.value }) }) }), SP_JSX.jsx(DFL.PanelSectionRow, { children: SP_JSX.jsx(DFL.TextField, { label: "Endpoint", value: settings.s3Endpoint || "", onChange: (e) => update({ s3Endpoint: e.target.value }) }) }), SP_JSX.jsx(DFL.PanelSectionRow, { children: SP_JSX.jsx(DFL.TextField, { label: "Region", value: settings.s3Region || "", onChange: (e) => update({ s3Region: e.target.value }) }) }), SP_JSX.jsx(DFL.PanelSectionRow, { children: SP_JSX.jsx(DFL.TextField, { label: "Access Key", value: settings.s3AccessKey || "", onChange: (e) => update({ s3AccessKey: e.target.value }) }) }), SP_JSX.jsx(DFL.PanelSectionRow, { children: SP_JSX.jsx(DFL.TextField, { label: "Secret Key", value: settings.s3SecretKey || "", onChange: (e) => update({ s3SecretKey: e.target.value }), bIsPassword: true }) })] })), settings.storageProvider === "ftp" && (SP_JSX.jsxs(DFL.PanelSection, { title: "FTP / FTPS", children: [SP_JSX.jsx(DFL.PanelSectionRow, { children: SP_JSX.jsx(DFL.TextField, { label: "\u0425\u043E\u0441\u0442", value: settings.ftpHost || "", onChange: (e) => update({ ftpHost: e.target.value }), description: "ftp.example.com" }) }), SP_JSX.jsx(DFL.PanelSectionRow, { children: SP_JSX.jsx(DFL.TextField, { label: "\u041F\u043E\u0440\u0442", value: settings.ftpPort || "", onChange: (e) => update({ ftpPort: e.target.value }), description: "\u043F\u043E \u0443\u043C\u043E\u043B\u0447\u0430\u043D\u0438\u044E 21" }) }), SP_JSX.jsx(DFL.PanelSectionRow, { children: SP_JSX.jsx(DFL.TextField, { label: "\u041B\u043E\u0433\u0438\u043D", value: settings.ftpUsername || "", onChange: (e) => update({ ftpUsername: e.target.value }) }) }), SP_JSX.jsx(DFL.PanelSectionRow, { children: SP_JSX.jsx(DFL.TextField, { label: "\u041F\u0430\u0440\u043E\u043B\u044C", value: settings.ftpPassword || "", onChange: (e) => update({ ftpPassword: e.target.value }), bIsPassword: true }) }), SP_JSX.jsx(DFL.PanelSectionRow, { children: SP_JSX.jsx(DFL.ToggleField, { label: "\u0418\u0441\u043F\u043E\u043B\u044C\u0437\u043E\u0432\u0430\u0442\u044C TLS (FTPS)", checked: settings.ftpUseTls, onChange: (v) => update({ ftpUseTls: v }) }) }), SP_JSX.jsx(DFL.PanelSectionRow, { children: SP_JSX.jsx(DFL.ToggleField, { label: "\u041F\u0430\u0441\u0441\u0438\u0432\u043D\u044B\u0439 \u0440\u0435\u0436\u0438\u043C (PASV)", checked: settings.ftpPassive, onChange: (v) => update({ ftpPassive: v }) }) })] })), settings.storageProvider === "sftp" && (SP_JSX.jsxs(DFL.PanelSection, { title: "SFTP", children: [SP_JSX.jsx(DFL.PanelSectionRow, { children: SP_JSX.jsx(DFL.TextField, { label: "\u0425\u043E\u0441\u0442", value: settings.sftpHost || "", onChange: (e) => update({ sftpHost: e.target.value }), description: "sftp.example.com" }) }), SP_JSX.jsx(DFL.PanelSectionRow, { children: SP_JSX.jsx(DFL.TextField, { label: "\u041F\u043E\u0440\u0442", value: settings.sftpPort || "", onChange: (e) => update({ sftpPort: e.target.value }), description: "\u043F\u043E \u0443\u043C\u043E\u043B\u0447\u0430\u043D\u0438\u044E 22" }) }), SP_JSX.jsx(DFL.PanelSectionRow, { children: SP_JSX.jsx(DFL.TextField, { label: "\u041B\u043E\u0433\u0438\u043D", value: settings.sftpUsername || "", onChange: (e) => update({ sftpUsername: e.target.value }) }) }), SP_JSX.jsx(DFL.PanelSectionRow, { children: SP_JSX.jsx(DFL.TextField, { label: "\u041F\u0430\u0440\u043E\u043B\u044C", value: settings.sftpPassword || "", onChange: (e) => update({ sftpPassword: e.target.value }), bIsPassword: true }) }), SP_JSX.jsx(DFL.PanelSectionRow, { children: SP_JSX.jsx(DFL.TextField, { label: "\u041F\u0440\u0438\u0432\u0430\u0442\u043D\u044B\u0439 \u043A\u043B\u044E\u0447 (\u043E\u043F\u0446\u0438\u043E\u043D\u0430\u043B\u044C\u043D\u043E)", value: settings.sftpKeyPath || "", onChange: (e) => update({ sftpKeyPath: e.target.value }), description: "/home/deck/.ssh/id_ed25519" }) }), SP_JSX.jsx(DFL.PanelSectionRow, { children: SP_JSX.jsx(DFL.TextField, { label: "\u041F\u0430\u0440\u043E\u043B\u044C \u043A\u043B\u044E\u0447\u0430 (\u043E\u043F\u0446\u0438\u043E\u043D\u0430\u043B\u044C\u043D\u043E)", value: settings.sftpKeyPassphrase || "", onChange: (e) => update({ sftpKeyPassphrase: e.target.value }), bIsPassword: true }) })] })), SP_JSX.jsxs(DFL.PanelSection, { children: [SP_JSX.jsx(DFL.PanelSectionRow, { children: SP_JSX.jsxs("div", { style: actionRow, children: [SP_JSX.jsx("div", { style: { flex: 1 }, children: SP_JSX.jsx(DFL.ButtonItem, { layout: "below", onClick: testConnection, disabled: testing, children: testing ? "Проверка…" : "Тест подключения" }) }), SP_JSX.jsx("div", { style: { flex: 1 }, children: SP_JSX.jsx(DFL.ButtonItem, { layout: "below", onClick: () => saveStorageConfig(), children: "\u0421\u043E\u0445\u0440\u0430\u043D\u0438\u0442\u044C" }) })] }) }), testResult && (SP_JSX.jsx(DFL.PanelSectionRow, { children: SP_JSX.jsx(StatusMessage, { tone: testResult.tone, children: testResult.text }) }))] }), SP_JSX.jsx(DFL.PanelSection, { title: "\u0410\u0432\u0442\u043E\u0441\u0438\u043D\u0445\u0440\u043E\u043D\u0438\u0437\u0430\u0446\u0438\u044F", children: SP_JSX.jsx(DFL.PanelSectionRow, { children: SP_JSX.jsx(DFL.ToggleField, { label: "\u0421\u0438\u043D\u0445\u0440\u043E\u043D\u0438\u0437\u0438\u0440\u043E\u0432\u0430\u0442\u044C \u043F\u0440\u0438 \u0432\u044B\u0445\u043E\u0434\u0435 \u0438\u0437 \u0438\u0433\u0440\u044B", checked: settings.autoSync, onChange: async (value) => {
                            update({ autoSync: value });
                            try {
                                await call("enable_auto_sync", { enabled: value });
                            }
                            catch (error) {
                                console.error("Error enabling auto-sync:", error);
                            }
                        } }) }) }), SP_JSX.jsxs(DFL.PanelSection, { title: "\u0413\u043B\u043E\u0431\u0430\u043B\u044C\u043D\u044B\u0435 \u043F\u0443\u0442\u0438 \u0441\u043E\u0445\u0440\u0430\u043D\u0435\u043D\u0438\u0439", children: [SP_JSX.jsx(DFL.PanelSectionRow, { children: SP_JSX.jsx(Hint, { children: "\u041F\u0440\u0438\u043C\u0435\u043D\u044F\u044E\u0442\u0441\u044F \u043A\u043E \u0432\u0441\u0435\u043C \u0438\u0433\u0440\u0430\u043C \u0432 \u0434\u043E\u043F\u043E\u043B\u043D\u0435\u043D\u0438\u0435 \u043A \u0438\u043D\u0434\u0438\u0432\u0438\u0434\u0443\u0430\u043B\u044C\u043D\u044B\u043C \u043F\u0443\u0442\u044F\u043C." }) }), SP_JSX.jsx(DFL.PanelSectionRow, { children: SP_JSX.jsx(DFL.TextField, { label: "\u0414\u043E\u0431\u0430\u0432\u0438\u0442\u044C \u043F\u0443\u0442\u044C", value: newPath, onChange: (e) => setNewPath(e.target.value) }) }), SP_JSX.jsx(DFL.PanelSectionRow, { children: SP_JSX.jsx(DFL.ButtonItem, { layout: "below", onClick: addDefaultPath, disabled: validating || !newPath.trim(), children: validating ? "Проверка…" : "Добавить путь" }) }), pathValidationResult && (SP_JSX.jsx(DFL.PanelSectionRow, { children: SP_JSX.jsx(StatusMessage, { tone: pathValidationResult.startsWith("✓") ? "success" : "error", children: pathValidationResult }) })), settings.defaultSavePaths.length === 0 ? (SP_JSX.jsx(DFL.PanelSectionRow, { children: SP_JSX.jsx("div", { style: { color: colors.dim, fontSize: "12px", fontStyle: "italic" }, children: "\u041D\u0435\u0442 \u0434\u043E\u0431\u0430\u0432\u043B\u0435\u043D\u043D\u044B\u0445 \u043F\u0443\u0442\u0435\u0439" }) })) : (settings.defaultSavePaths.map((path, index) => (SP_JSX.jsx(DFL.PanelSectionRow, { children: SP_JSX.jsxs("div", { style: { ...card, display: "flex", flexDirection: "column", gap: "8px" }, children: [SP_JSX.jsx("div", { style: { fontSize: "11px", color: "#c7ccd1", wordBreak: "break-all", fontFamily: "monospace" }, children: path }), SP_JSX.jsx("div", { style: actionRow, children: SP_JSX.jsx(DFL.ButtonItem, { layout: "below", onClick: () => removeDefaultPath(index), children: "\u0423\u0434\u0430\u043B\u0438\u0442\u044C" }) })] }) }, index))))] }), SP_JSX.jsxs(DFL.PanelSection, { title: "\u041E\u043F\u0430\u0441\u043D\u0430\u044F \u0437\u043E\u043D\u0430", children: [SP_JSX.jsx(DFL.PanelSectionRow, { children: SP_JSX.jsx(Hint, { children: "\u0423\u0434\u0430\u043B\u044F\u0435\u0442 \u0432\u0441\u0435 \u043D\u0430\u0441\u0442\u0440\u043E\u0439\u043A\u0438, \u043A\u044D\u0448, \u0438\u0437\u0443\u0447\u0435\u043D\u043D\u044B\u0435 \u043F\u0443\u0442\u0438 \u0438 \u043A\u043E\u043D\u0444\u0438\u0433\u0443\u0440\u0430\u0446\u0438\u044E \u043F\u043B\u0430\u0433\u0438\u043D\u0430." }) }), SP_JSX.jsx(DFL.PanelSectionRow, { children: SP_JSX.jsx(DFL.ButtonItem, { layout: "below", onClick: async () => {
                                if (!confirm("Удалить все данные плагина? Действие необратимо."))
                                    return;
                                try {
                                    const result = await call("clear_all_data", {});
                                    setTestResult(result.success
                                        ? { tone: "success", text: result.message || "Все данные очищены" }
                                        : { tone: "error", text: result.error || "Ошибка очистки" });
                                    setSettings(loadSettings());
                                }
                                catch (error) {
                                    setTestResult({ tone: "error", text: error?.message || String(error) });
                                }
                            }, children: "\u041E\u0447\u0438\u0441\u0442\u0438\u0442\u044C \u0432\u0441\u0435 \u0434\u0430\u043D\u043D\u044B\u0435 \u043F\u043B\u0430\u0433\u0438\u043D\u0430" }) })] })] }));
}

const sourceLabel = (source) => {
    switch (source) {
        case "known":
            return "база";
        case "learned":
            return "изучено";
        case "heuristic":
            return "поиск";
        default:
            return source;
    }
};
function GamePathsTab() {
    const [games, setGames] = SP_REACT.useState([]);
    const [loading, setLoading] = SP_REACT.useState(true);
    const [error, setError] = SP_REACT.useState(null);
    const [editingGame, setEditingGame] = SP_REACT.useState(null);
    const [editingPathIndex, setEditingPathIndex] = SP_REACT.useState(null);
    const [editingPathValue, setEditingPathValue] = SP_REACT.useState("");
    const [newPath, setNewPath] = SP_REACT.useState("");
    const [validating, setValidating] = SP_REACT.useState(false);
    const [pathValidationResult, setPathValidationResult] = SP_REACT.useState(null);
    const loadGames = async () => {
        setLoading(true);
        setError(null);
        try {
            const result = await call("scan_games", {});
            if (result.success && result.games) {
                setGames(result.games);
            }
            else {
                setError(result.error || "Ошибка загрузки игр");
            }
        }
        catch (err) {
            setError(`Ошибка: ${err}`);
        }
        finally {
            setLoading(false);
        }
    };
    const persistPaths = async (game, savePaths, excludePaths) => {
        try {
            const payload = { game_name: game.name, save_paths: savePaths };
            if (excludePaths !== undefined)
                payload.exclude_paths = excludePaths;
            const result = await call("update_game_paths", payload);
            if (result.success) {
                await loadGames();
                return true;
            }
            setPathValidationResult(`✗ ${result.error || "Ошибка сохранения"}`);
            return false;
        }
        catch (err) {
            setPathValidationResult(`✗ Ошибка: ${err}`);
            return false;
        }
    };
    const addPathToGame = async (game) => {
        if (!newPath.trim()) {
            setPathValidationResult("Введите путь");
            return;
        }
        setValidating(true);
        setPathValidationResult(null);
        try {
            const result = await call("validate_save_path", { path: newPath.trim() });
            if (result.success && result.path) {
                if (game.savePaths.includes(result.path)) {
                    setPathValidationResult("Этот путь уже добавлен");
                }
                else if (await persistPaths(game, [...game.savePaths, result.path])) {
                    setNewPath("");
                }
            }
            else {
                setPathValidationResult(`✗ ${result.error || "Ошибка валидации"}`);
            }
        }
        finally {
            setValidating(false);
        }
    };
    const addCandidateToGame = async (game, candidatePath) => {
        if (game.savePaths.includes(candidatePath))
            return;
        await persistPaths(game, [...game.savePaths, candidatePath]);
    };
    const removePathFromGame = async (game, pathIndex) => {
        await persistPaths(game, game.savePaths.filter((_, i) => i !== pathIndex));
    };
    const excludePathFromGame = async (game, path) => {
        const updatedPaths = game.savePaths.filter((p) => p !== path);
        const updatedExcludes = Array.from(new Set([...(game.excludePaths || []), path]));
        await persistPaths(game, updatedPaths, updatedExcludes);
    };
    const startEditingPath = (game, pathIndex) => {
        setEditingGame(game);
        setEditingPathIndex(pathIndex);
        setEditingPathValue(game.savePaths[pathIndex]);
    };
    const saveEditedPath = async (game, pathIndex) => {
        if (!editingPathValue.trim()) {
            setPathValidationResult("Введите путь");
            return;
        }
        setValidating(true);
        setPathValidationResult(null);
        try {
            const result = await call("validate_save_path", { path: editingPathValue.trim() });
            if (result.success && result.path) {
                const updatedPaths = [...game.savePaths];
                updatedPaths[pathIndex] = result.path;
                if (await persistPaths(game, updatedPaths)) {
                    setEditingPathIndex(null);
                    setEditingPathValue("");
                }
            }
            else {
                setPathValidationResult(`✗ ${result.error || "Ошибка валидации"}`);
            }
        }
        finally {
            setValidating(false);
        }
    };
    const cancelEditingPath = () => {
        setEditingPathIndex(null);
        setEditingPathValue("");
        setPathValidationResult(null);
    };
    SP_REACT.useEffect(() => {
        loadGames();
    }, []);
    if (loading)
        return SP_JSX.jsx(Loading, { text: "\u0417\u0430\u0433\u0440\u0443\u0437\u043A\u0430 \u0438\u0433\u0440..." });
    if (error)
        return SP_JSX.jsx(ErrorState, { text: error, onRetry: loadGames });
    const settings = loadSettings();
    return (SP_JSX.jsxs("div", { children: [SP_JSX.jsx(DFL.PanelSection, { title: `Управление путями (${games.length})`, children: SP_JSX.jsx(DFL.PanelSectionRow, { children: SP_JSX.jsx(DFL.ButtonItem, { layout: "below", onClick: loadGames, disabled: loading, children: "\u041E\u0431\u043D\u043E\u0432\u0438\u0442\u044C \u0441\u043F\u0438\u0441\u043E\u043A" }) }) }), games.length === 0 && SP_JSX.jsx(EmptyState, { text: "\u0418\u0433\u0440\u044B \u043D\u0435 \u043D\u0430\u0439\u0434\u0435\u043D\u044B" }), games.map((game, index) => {
                const isEditing = editingGame?.name === game.name;
                const candidates = (game.saveCandidates || []).filter((c) => !game.savePaths.includes(c.path));
                return (SP_JSX.jsxs(DFL.PanelSection, { title: game.name, children: [SP_JSX.jsx(DFL.PanelSectionRow, { children: SP_JSX.jsxs("div", { style: { display: "flex", flexWrap: "wrap", gap: "6px", alignItems: "center" }, children: [SP_JSX.jsx(Badge, { tone: game.hasSaves ? "success" : "warning", children: game.hasSaves ? `${game.savePaths.length} путей` : "нет сохранений" }), typeof game.steamAppId === "number" && SP_JSX.jsxs(Badge, { children: ["appid ", game.steamAppId] }), (game.excludePaths?.length || 0) > 0 && SP_JSX.jsxs(Badge, { tone: "error", children: ["\u0438\u0441\u043A\u043B\u044E\u0447\u0435\u043D\u043E ", game.excludePaths.length] })] }) }), game.sharedPrefix && (SP_JSX.jsx(DFL.PanelSectionRow, { children: SP_JSX.jsxs(StatusMessage, { tone: "warning", children: ["\u041E\u0431\u0449\u0438\u0439 \u043F\u0440\u0435\u0444\u0438\u043A\u0441 \u0441: ", (game.sharedWith || []).join(", ")] }) })), settings.defaultSavePaths.length > 0 && (SP_JSX.jsx(DFL.PanelSectionRow, { children: SP_JSX.jsxs("div", { style: dimText, children: ["\u0413\u043B\u043E\u0431\u0430\u043B\u044C\u043D\u044B\u0435 \u043F\u0443\u0442\u0438: ", settings.defaultSavePaths.length, " (\u043F\u0440\u0438\u043C\u0435\u043D\u044F\u044E\u0442\u0441\u044F \u043A\u043E \u0432\u0441\u0435\u043C \u0438\u0433\u0440\u0430\u043C)"] }) })), game.savePaths.map((path, pathIndex) => {
                            const isEditingThisPath = editingGame?.name === game.name && editingPathIndex === pathIndex;
                            return (SP_JSX.jsx(DFL.PanelSectionRow, { children: isEditingThisPath ? (SP_JSX.jsxs("div", { style: { ...card, display: "flex", flexDirection: "column", gap: "8px" }, children: [SP_JSX.jsx(DFL.TextField, { label: "\u041F\u0443\u0442\u044C", value: editingPathValue, onChange: (e) => setEditingPathValue(e.target.value) }), pathValidationResult && (SP_JSX.jsx(StatusMessage, { tone: pathValidationResult.startsWith("✓") ? "success" : "error", children: pathValidationResult })), SP_JSX.jsxs("div", { style: actionRow, children: [SP_JSX.jsx("div", { style: { flex: 1 }, children: SP_JSX.jsx(DFL.ButtonItem, { layout: "below", onClick: () => saveEditedPath(game, pathIndex), disabled: validating || !editingPathValue.trim(), children: validating ? "Проверка…" : "Сохранить" }) }), SP_JSX.jsx("div", { style: { flex: 1 }, children: SP_JSX.jsx(DFL.ButtonItem, { layout: "below", onClick: cancelEditingPath, children: "\u041E\u0442\u043C\u0435\u043D\u0430" }) })] })] })) : (SP_JSX.jsxs("div", { style: { ...card, display: "flex", flexDirection: "column", gap: "8px" }, children: [SP_JSX.jsx(PathText, { children: path }), SP_JSX.jsxs("div", { style: actionRow, children: [SP_JSX.jsx("div", { style: { flex: 1 }, children: SP_JSX.jsx(DFL.ButtonItem, { layout: "below", onClick: () => startEditingPath(game, pathIndex), children: "\u0418\u0437\u043C\u0435\u043D\u0438\u0442\u044C" }) }), SP_JSX.jsx("div", { style: { flex: 1 }, children: SP_JSX.jsx(DFL.ButtonItem, { layout: "below", onClick: () => excludePathFromGame(game, path), children: "\u0418\u0441\u043A\u043B\u044E\u0447\u0438\u0442\u044C" }) }), SP_JSX.jsx("div", { style: { flex: 1 }, children: SP_JSX.jsx(DFL.ButtonItem, { layout: "below", onClick: () => removePathFromGame(game, pathIndex), children: "\u0423\u0434\u0430\u043B\u0438\u0442\u044C" }) })] })] })) }, pathIndex));
                        }), candidates.length > 0 && (SP_JSX.jsx(DFL.PanelSectionRow, { children: SP_JSX.jsxs("div", { style: { display: "flex", flexDirection: "column", gap: "6px", width: "100%" }, children: [SP_JSX.jsxs("div", { style: { ...dimText, fontWeight: 600 }, children: ["\u041D\u0430\u0439\u0434\u0435\u043D\u043D\u044B\u0435 \u043A\u0430\u043D\u0434\u0438\u0434\u0430\u0442\u044B (", candidates.length, ")"] }), candidates.map((c, ci) => (SP_JSX.jsxs("div", { style: { ...card, display: "flex", flexDirection: "column", gap: "6px" }, children: [SP_JSX.jsx(PathText, { children: c.path }), SP_JSX.jsxs("div", { style: { display: "flex", justifyContent: "space-between", alignItems: "center", gap: "8px" }, children: [SP_JSX.jsxs("span", { style: { fontSize: "10px", color: colors.dim }, children: ["\u0438\u0441\u0442\u043E\u0447\u043D\u0438\u043A: ", sourceLabel(c.source), " \u00B7 \u043E\u0446\u0435\u043D\u043A\u0430: ", c.score, c.fileCount ? ` · файлов: ${c.fileCount}` : ""] }), SP_JSX.jsx("div", { style: { minWidth: "110px" }, children: SP_JSX.jsx(DFL.ButtonItem, { layout: "below", onClick: () => addCandidateToGame(game, c.path), children: "\u0414\u043E\u0431\u0430\u0432\u0438\u0442\u044C" }) })] })] }, ci)))] }) })), isEditing && (SP_JSX.jsxs(SP_JSX.Fragment, { children: [SP_JSX.jsx(DFL.PanelSectionRow, { children: SP_JSX.jsx(DFL.TextField, { label: "\u0414\u043E\u0431\u0430\u0432\u0438\u0442\u044C \u043F\u0443\u0442\u044C", value: newPath, onChange: (e) => setNewPath(e.target.value) }) }), SP_JSX.jsx(DFL.PanelSectionRow, { children: SP_JSX.jsx(DFL.ButtonItem, { layout: "below", onClick: () => addPathToGame(game), disabled: validating || !newPath.trim(), children: validating ? "Проверка…" : "Добавить" }) }), pathValidationResult && !editingPathIndex && (SP_JSX.jsx(DFL.PanelSectionRow, { children: SP_JSX.jsx(StatusMessage, { tone: pathValidationResult.startsWith("✓") ? "success" : "error", children: pathValidationResult }) }))] })), SP_JSX.jsx(DFL.PanelSectionRow, { children: SP_JSX.jsx(DFL.ButtonItem, { layout: "below", onClick: () => {
                                    if (isEditing) {
                                        setEditingGame(null);
                                        setNewPath("");
                                        setPathValidationResult(null);
                                    }
                                    else {
                                        setEditingGame(game);
                                    }
                                }, children: isEditing ? "Готово" : "Редактировать пути" }) })] }, index));
            })] }));
}

const formatBytes = (bytes) => {
    if (!bytes)
        return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB"];
    const i = Math.min(Math.floor(Math.log(bytes) / Math.log(k)), sizes.length - 1);
    return `${Math.round((bytes / Math.pow(k, i)) * 100) / 100} ${sizes[i]}`;
};
const formatDate = (isoString) => {
    try {
        return new Date(isoString).toLocaleString("ru-RU", {
            year: "numeric",
            month: "2-digit",
            day: "2-digit",
            hour: "2-digit",
            minute: "2-digit",
        });
    }
    catch {
        return isoString;
    }
};
function StatRow({ label, value }) {
    return (SP_JSX.jsxs("div", { style: { ...card, display: "flex", justifyContent: "space-between", alignItems: "center", gap: "10px" }, children: [SP_JSX.jsx("span", { style: { fontSize: "12px", color: colors.muted }, children: label }), SP_JSX.jsx("span", { style: { fontSize: "13px", fontWeight: 600, color: colors.text }, children: value })] }));
}
function StatsTab() {
    const [stats, setStats] = SP_REACT.useState(null);
    const [loading, setLoading] = SP_REACT.useState(true);
    const [error, setError] = SP_REACT.useState(null);
    const loadStats = async () => {
        setLoading(true);
        setError(null);
        try {
            const result = await call("get_sync_stats", {});
            if (result.success && result.stats) {
                setStats(result.stats);
            }
            else {
                setError(result.error || "Ошибка загрузки статистики");
            }
        }
        catch (err) {
            setError(`Ошибка: ${err}`);
        }
        finally {
            setLoading(false);
        }
    };
    SP_REACT.useEffect(() => {
        loadStats();
    }, []);
    if (loading)
        return SP_JSX.jsx(Loading, { text: "\u0417\u0430\u0433\u0440\u0443\u0437\u043A\u0430 \u0441\u0442\u0430\u0442\u0438\u0441\u0442\u0438\u043A\u0438..." });
    if (error)
        return SP_JSX.jsx(ErrorState, { text: error, onRetry: loadStats });
    if (!stats)
        return SP_JSX.jsx(EmptyState, { text: "\u041D\u0435\u0442 \u0434\u0430\u043D\u043D\u044B\u0445 \u0434\u043B\u044F \u043E\u0442\u043E\u0431\u0440\u0430\u0436\u0435\u043D\u0438\u044F" });
    return (SP_JSX.jsxs(DFL.PanelSection, { title: "\u0421\u0442\u0430\u0442\u0438\u0441\u0442\u0438\u043A\u0430 \u0441\u0438\u043D\u0445\u0440\u043E\u043D\u0438\u0437\u0430\u0446\u0438\u0439", children: [SP_JSX.jsx(DFL.PanelSectionRow, { children: SP_JSX.jsxs("div", { style: { display: "flex", flexDirection: "column", gap: "6px", width: "100%" }, children: [SP_JSX.jsx(StatRow, { label: "\u0412\u0441\u0435\u0433\u043E \u0441\u0438\u043D\u0445\u0440\u043E\u043D\u0438\u0437\u0430\u0446\u0438\u0439", value: stats.totalSyncs.toLocaleString() }), SP_JSX.jsx(StatRow, { label: "\u0418\u0433\u0440 \u0441\u0438\u043D\u0445\u0440\u043E\u043D\u0438\u0437\u0438\u0440\u043E\u0432\u0430\u043D\u043E", value: stats.gamesCount.toLocaleString() }), stats.lastSync && SP_JSX.jsx(StatRow, { label: "\u041F\u043E\u0441\u043B\u0435\u0434\u043D\u044F\u044F \u0441\u0438\u043D\u0445\u0440\u043E\u043D\u0438\u0437\u0430\u0446\u0438\u044F", value: formatDate(stats.lastSync) }), typeof stats.totalSize === "number" && stats.totalSize > 0 && (SP_JSX.jsx(StatRow, { label: "\u041E\u0431\u0449\u0438\u0439 \u0440\u0430\u0437\u043C\u0435\u0440", value: formatBytes(stats.totalSize) }))] }) }), stats.syncsByDate && stats.syncsByDate.length > 0 && (SP_JSX.jsxs(SP_JSX.Fragment, { children: [SP_JSX.jsx(DFL.PanelSectionRow, { children: SP_JSX.jsx("div", { style: { fontSize: "12px", fontWeight: 600, color: colors.muted, marginTop: "6px" }, children: "\u0421\u0438\u043D\u0445\u0440\u043E\u043D\u0438\u0437\u0430\u0446\u0438\u0438 \u043F\u043E \u0434\u0430\u0442\u0430\u043C" }) }), SP_JSX.jsx(DFL.PanelSectionRow, { children: SP_JSX.jsx("div", { style: { display: "flex", flexDirection: "column", gap: "6px", width: "100%" }, children: stats.syncsByDate.slice(0, 10).map((item, index) => (SP_JSX.jsx(StatRow, { label: new Date(item.date).toLocaleDateString("ru-RU"), value: item.count.toLocaleString() }, index))) }) })] }))] }));
}

var SettingsTab;
(function (SettingsTab) {
    SettingsTab["MAIN"] = "main";
    SettingsTab["GAME_PATHS"] = "game_paths";
    SettingsTab["STATS"] = "stats";
})(SettingsTab || (SettingsTab = {}));
function SettingsPage() {
    const [currentTab, setCurrentTab] = SP_REACT.useState(SettingsTab.MAIN);
    SP_REACT.useEffect(() => {
        const handleTabSwitch = (event) => {
            const tab = event.detail;
            if (tab === "game_paths" || tab === "main" || tab === "stats") {
                setCurrentTab(tab);
            }
        };
        window.addEventListener("gamesync-switch-tab", handleTabSwitch);
        return () => {
            window.removeEventListener("gamesync-switch-tab", handleTabSwitch);
        };
    }, []);
    return (SP_JSX.jsx("div", { style: { paddingTop: "var(--basicui-header-height, 50px)", minHeight: "100vh" }, children: SP_JSX.jsx(DFL.Tabs, { activeTab: currentTab, onShowTab: (tab) => setCurrentTab(tab), tabs: [
                {
                    id: SettingsTab.MAIN,
                    title: "Основные",
                    content: SP_JSX.jsx(Settings, {}),
                },
                {
                    id: SettingsTab.GAME_PATHS,
                    title: "Пути игр",
                    content: SP_JSX.jsx(GamePathsTab, {}),
                },
                {
                    id: SettingsTab.STATS,
                    title: "Статистика",
                    content: SP_JSX.jsx(StatsTab, {}),
                },
            ] }) }));
}

var index = definePlugin(() => {
    // Регистрация маршрута для полноразмерной страницы настроек
    routerHook.addRoute("/gamesync-settings", () => {
        return SP_JSX.jsx(SettingsPage, {});
    });
    return {
        name: "GameSync NonSteam",
        titleView: SP_JSX.jsx("div", { className: DFL.staticClasses.Title, children: "GameSync" }),
        content: (SP_JSX.jsx("div", { children: SP_JSX.jsx(GameSyncMain, {}) })),
        icon: SP_JSX.jsx(FaCloud, {}),
        onDismount() {
            routerHook.removeRoute("/gamesync-settings");
        },
    };
});

export { index as default };
//# sourceMappingURL=index.js.map

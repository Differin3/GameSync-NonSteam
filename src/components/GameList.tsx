import { useState, useEffect } from "react";
import { call } from "@decky/api";
import { Spinner, ButtonItem, PanelSection, PanelSectionRow, Router } from "@decky/ui";
import { GameInfo, SyncStatus } from "../utils/types";
import { loadSettings } from "../utils/Settings";

export function GameList() {
  const [games, setGames] = useState<GameInfo[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [syncing, setSyncing] = useState<{ [key: string]: boolean }>({});
  const [syncStatus, setSyncStatus] = useState<{ [key: string]: SyncStatus }>({});

  const loadGames = async (forceRefresh: boolean = false) => {
    setLoading(true);
    setError(null);
    try {
      const result: any = await call("scan_games", { force_refresh: forceRefresh });
      if (result.success && result.games) {
        setGames(result.games);
      } else {
        setError(result.error || "Ошибка загрузки игр");
      }
    } catch (err) {
      setError(`Ошибка: ${err}`);
    } finally {
      setLoading(false);
    }
  };

  const syncGame = async (game: GameInfo) => {
    // Объединяем глобальные пути из настроек с путями игры
    const settings = loadSettings();
    const allSavePaths = [...settings.defaultSavePaths, ...game.savePaths];
    
    // Убираем дубликаты
    const uniquePaths = Array.from(new Set(allSavePaths));
    
    if (uniquePaths.length === 0) {
      setSyncStatus((prev) => ({ ...prev, [game.name]: { gameName: game.name, status: "error", message: "Нет путей сохранений. Настройте пути в настройках." } }));
      return;
    }

    setSyncing((prev) => ({ ...prev, [game.name]: true }));
    setSyncStatus((prev) => ({ ...prev, [game.name]: { gameName: game.name, status: "syncing" } }));

    try {
      const result: any = await call("sync_game", { game_name: game.name, save_paths: uniquePaths });

      if (result.success) {
        setSyncStatus((prev) => ({ ...prev, [game.name]: { gameName: game.name, status: "success", message: result.message || "Синхронизация завершена" } }));
      } else {
        setSyncStatus((prev) => ({ ...prev, [game.name]: { gameName: game.name, status: "error", message: result.error || "Ошибка синхронизации" } }));
      }
    } catch (err) {
      setSyncStatus((prev) => ({ ...prev, [game.name]: { gameName: game.name, status: "error", message: `Ошибка: ${err}` } }));
    } finally {
      setSyncing((prev) => ({ ...prev, [game.name]: false }));
    }
  };

  useEffect(() => {
    loadGames();
  }, []);

  return (
    <div>
      <PanelSection title={`Найденные игры (${games.length})`}>
        <PanelSectionRow>
          <ButtonItem
            layout="below"
            onClick={() => { loadGames(true); }}
            disabled={loading}
          >
            {loading ? "Сканирование..." : "Обновить список игр"}
          </ButtonItem>
        </PanelSectionRow>
        <PanelSectionRow>
          <ButtonItem
            layout="below"
            onClick={() => {
              Router.CloseSideMenus();
              Router.Navigate("/gamesync-settings");
            }}
          >
            Настроить пути сохранений
          </ButtonItem>
        </PanelSectionRow>
      </PanelSection>

      {loading && (
        <PanelSection>
          <PanelSectionRow>
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <Spinner />
              <span>Сканирование игр PortProton...</span>
            </div>
          </PanelSectionRow>
        </PanelSection>
      )}

      {error && (
        <PanelSection>
          <PanelSectionRow>
            <div style={{ color: "red" }}>{error}</div>
          </PanelSectionRow>
          <PanelSectionRow>
            <ButtonItem
              layout="below"
              onClick={() => { loadGames(); }}
            >
              Повторить
            </ButtonItem>
          </PanelSectionRow>
        </PanelSection>
      )}

      {games.length === 0 && !loading && !error && (
        <PanelSection>
          <PanelSectionRow>
            <div>Игры не найдены</div>
          </PanelSectionRow>
        </PanelSection>
      )}

      {games.map((game, index) => {
        const isSyncing = syncing[game.name];
        const status = syncStatus[game.name];

        return (
          <PanelSection key={index} title={game.name}>
            <PanelSectionRow>
              <div style={{ fontSize: "12px", color: "#888" }}>
                {game.hasSaves ? `Сохранения найдены (${game.savePaths.length} путей)` : "Сохранения не найдены"}
              </div>
            </PanelSectionRow>

            {game.savePaths.length > 0 && (
              <>
                <PanelSectionRow>
                  <div style={{ fontSize: "11px", color: "#888", marginBottom: "8px" }}>
                    Автоопределенные пути (из drive_c/users/steamuser/ или users/deck/):
                  </div>
                </PanelSectionRow>
                {game.savePaths.slice(0, 3).map((path, pathIdx) => (
                  <PanelSectionRow key={pathIdx}>
                    <div style={{ fontSize: "10px", color: "#aaa", wordBreak: "break-all" }}>
                      {path}
                    </div>
                  </PanelSectionRow>
                ))}
                {game.savePaths.length > 3 && (
                  <PanelSectionRow>
                    <div style={{ fontSize: "10px", color: "#888" }}>
                      +{game.savePaths.length - 3} еще...
                    </div>
                  </PanelSectionRow>
                )}
              </>
            )}

            <PanelSectionRow>
              <ButtonItem
                layout="below"
                onClick={() => {
                  Router.CloseSideMenus();
                  Router.Navigate("/gamesync-settings");
                  // Переключиться на вкладку путей игр
                  setTimeout(() => {
                    const event = new CustomEvent("gamesync-switch-tab", { detail: "game_paths" });
                    window.dispatchEvent(event);
                  }, 100);
                }}
              >
                Редактировать пути
              </ButtonItem>
            </PanelSectionRow>

            {game.hasSaves && (
              <PanelSectionRow>
                <ButtonItem
                  layout="below"
                  onClick={() => syncGame(game)}
                  disabled={isSyncing}
                >
                  {isSyncing ? (
                    <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                      <Spinner />
                      <span>Синхронизация...</span>
                    </div>
                  ) : (
                    "Синхронизировать"
                  )}
                </ButtonItem>
              </PanelSectionRow>
            )}

            {status && (
              <PanelSectionRow>
                <div style={{ 
                  fontSize: "12px", 
                  color: status.status === "success" ? "#0f0" : status.status === "error" ? "#f00" : "#aaa" 
                }}>
                  {status.message}
                </div>
              </PanelSectionRow>
            )}
          </PanelSection>
        );
      })}
    </div>
  );
}
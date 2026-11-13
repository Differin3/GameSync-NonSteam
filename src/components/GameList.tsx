import { useEffect, useState } from "react";
import type { ReactNode } from "react";
import { call } from "@decky/api";
import { ButtonItem, PanelSection, PanelSectionRow, Router, Spinner } from "@decky/ui";
import { FaFolderOpen, FaSyncAlt, FaRedo } from "react-icons/fa";
import { GameInfo, SyncStatus } from "../utils/types";
import { loadSettings } from "../utils/Settings";
import { Badge, EmptyState, ErrorState, Loading, PathText, StatusMessage } from "./ui";
import { card, colors, dimText } from "../utils/theme";

const actionButton = (children: ReactNode) => (
  <span style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", gap: "7px" }}>
    {children}
  </span>
);

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

  const openPaths = () => {
    Router.CloseSideMenus();
    Router.Navigate("/gamesync-settings");
    setTimeout(() => window.dispatchEvent(new CustomEvent("gamesync-switch-tab", { detail: "game_paths" })), 100);
  };

  const syncGame = async (game: GameInfo) => {
    const settings = loadSettings();
    const uniquePaths = Array.from(new Set([...settings.defaultSavePaths, ...game.savePaths]));

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
      const result: any = await call("sync_game", { game_name: game.name, save_paths: uniquePaths });
      setSyncStatus((prev) => ({
        ...prev,
        [game.name]: {
          gameName: game.name,
          status: result.success ? "success" : "error",
          message: result.success ? result.message || "Синхронизация завершена" : result.error || "Ошибка синхронизации",
        },
      }));
    } catch (err) {
      setSyncStatus((prev) => ({
        ...prev,
        [game.name]: { gameName: game.name, status: "error", message: `Ошибка: ${err}` },
      }));
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
          <div style={{ display: "flex", gap: "8px", width: "100%" }}>
            <div style={{ flex: 1 }}>
              <ButtonItem layout="below" onClick={() => loadGames(true)} disabled={loading}>
                {actionButton(
                  <>
                    <FaRedo />
                    {loading ? "Сканирование…" : "Обновить"}
                  </>
                )}
              </ButtonItem>
            </div>
            <div style={{ flex: 1 }}>
              <ButtonItem layout="below" onClick={openPaths}>
                {actionButton(
                  <>
                    <FaFolderOpen />
                    Настроить пути
                  </>
                )}
              </ButtonItem>
            </div>
          </div>
        </PanelSectionRow>
      </PanelSection>

      {loading && <Loading text="Сканирование игр PortProton..." />}
      {error && !loading && <ErrorState text={error} onRetry={() => loadGames()} />}
      {games.length === 0 && !loading && !error && <EmptyState text="Игры не найдены" />}

      {!loading &&
        games.map((game, index) => {
          const isSyncing = syncing[game.name];
          const status = syncStatus[game.name];

          return (
            <PanelSection key={index} title={game.name}>
              <PanelSectionRow>
                <div style={{ ...card, display: "flex", flexDirection: "column", gap: "8px" }}>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: "6px", alignItems: "center" }}>
                    <Badge tone={game.hasSaves ? "success" : "warning"}>
                      {game.hasSaves ? `${game.savePaths.length} путей` : "нет сохранений"}
                    </Badge>
                    {typeof game.steamAppId === "number" && <Badge>appid {game.steamAppId}</Badge>}
                    {game.sharedPrefix && <Badge tone="warning">общий префикс</Badge>}
                  </div>

                  {game.savePaths.length > 0 ? (
                    <PathText>{game.savePaths[0]}</PathText>
                  ) : (
                    <div style={dimText}>Пути не найдены — добавьте их вручную.</div>
                  )}

                  <div style={{ display: "flex", gap: "8px", width: "100%" }}>
                    <div style={{ flex: 1 }}>
                      <ButtonItem layout="below" onClick={openPaths}>
                        {actionButton(
                          <>
                            <FaFolderOpen />
                            Изменить пути
                          </>
                        )}
                      </ButtonItem>
                    </div>
                    <div style={{ flex: 1 }}>
                      <ButtonItem layout="below" onClick={() => syncGame(game)} disabled={isSyncing || !game.hasSaves}>
                        {isSyncing ? (
                          <span style={{ display: "flex", alignItems: "center", gap: "8px", justifyContent: "center" }}>
                            <Spinner />
                            <span>Синхронизация…</span>
                          </span>
                        ) : (
                          actionButton(
                            <>
                              <FaSyncAlt />
                              Синхронизировать
                            </>
                          )
                        )}
                      </ButtonItem>
                    </div>
                  </div>
                </div>
              </PanelSectionRow>

              {status && (
                <PanelSectionRow>
                  <StatusMessage tone={status.status === "success" ? "success" : status.status === "error" ? "error" : "info"}>
                    {status.message || "Синхронизация…"}
                  </StatusMessage>
                </PanelSectionRow>
              )}
            </PanelSection>
          );
        })}

      {!loading && games.length > 0 && (
        <PanelSection>
          <PanelSectionRow>
            <div style={{ ...dimText, textAlign: "center", width: "100%", color: colors.dim }}>
              Игры находятся автоматически по префиксам PortProton и ярлыкам Steam
            </div>
          </PanelSectionRow>
        </PanelSection>
      )}
    </div>
  );
}

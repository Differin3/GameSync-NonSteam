import { useEffect, useState } from "react";
import { call } from "@decky/api";
import { ButtonItem, PanelSection, PanelSectionRow, Router, Spinner } from "@decky/ui";
import { FaFolderOpen, FaGamepad, FaRedo } from "react-icons/fa";
import { GameInfo, SyncStatus } from "../utils/types";
import { loadSettings } from "../utils/Settings";
import { EmptyState, ErrorState, Loading, StatusMessage } from "./ui";

const VISIBLE_LIMIT = 8;

const descriptionFor = (game: GameInfo): string => {
  const parts = [game.hasSaves ? `${game.savePaths.length} путей` : "нет сохранений"];
  if (typeof game.steamAppId === "number") parts.push(`appid ${game.steamAppId}`);
  if (game.sharedPrefix) parts.push(`общий префикс: ${(game.sharedWith || []).slice(0, 2).join(", ")}`);
  parts.push("синхронизировать");
  return parts.join(" · ");
};

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

  if (loading) {
    return <Loading text="Сканирование игр PortProton..." />;
  }

  if (error) {
    return <ErrorState text={error} onRetry={() => loadGames()} />;
  }

  if (games.length === 0) {
    return <EmptyState text="Игры не найдены" />;
  }

  return (
    <PanelSection title={`Найденные игры (${games.length})`}>
      <PanelSectionRow>
        <ButtonItem layout="below" icon={<FaRedo />} onClick={() => loadGames(true)}>
          Обновить список
        </ButtonItem>
      </PanelSectionRow>

      {games.slice(0, VISIBLE_LIMIT).map((game) => {
        const isSyncing = syncing[game.name];
        const status = syncStatus[game.name];
        return (
          <PanelSectionRow key={game.name}>
            <div style={{ width: "100%" }}>
              <ButtonItem
                icon={isSyncing ? <Spinner /> : <FaGamepad />}
                label={game.name}
                description={descriptionFor(game)}
                onClick={() => syncGame(game)}
                disabled={isSyncing || !game.hasSaves}
              />
              {status && (
                <StatusMessage tone={status.status === "success" ? "success" : status.status === "error" ? "error" : "info"}>
                  {status.message || "Синхронизация…"}
                </StatusMessage>
              )}
            </div>
          </PanelSectionRow>
        );
      })}

      <PanelSectionRow>
        <ButtonItem layout="below" icon={<FaFolderOpen />} onClick={openPaths}>
          {games.length > VISIBLE_LIMIT ? `Все игры и пути (${games.length})` : "Настроить пути"}
        </ButtonItem>
      </PanelSectionRow>
    </PanelSection>
  );
}

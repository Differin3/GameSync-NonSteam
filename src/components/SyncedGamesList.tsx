import { useEffect, useState } from "react";
import { call } from "@decky/api";
import { ButtonItem, PanelSection, PanelSectionRow, Spinner } from "@decky/ui";
import { FaCloud, FaRedo } from "react-icons/fa";
import { SyncedGame } from "../utils/types";
import { loadSettings } from "../utils/Settings";
import { StatusMessage } from "./ui";

const VISIBLE_LIMIT = 5;

const formatDate = (isoString: string): string => {
  try {
    return new Date(isoString).toLocaleString("ru-RU", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return isoString;
  }
};

export function SyncedGamesList() {
  const [syncedGames, setSyncedGames] = useState<SyncedGame[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [syncing, setSyncing] = useState<{ [key: string]: boolean }>({});
  const [status, setStatus] = useState<string | null>(null);

  const loadSyncedGames = async () => {
    setLoading(true);
    try {
      const result: any = await call("get_synced_games", {});
      if (result.success && result.games) {
        setSyncedGames(result.games);
      }
    } catch (error) {
      console.error("Failed to load synced games", error);
    } finally {
      setLoading(false);
    }
  };

  const resyncGame = async (game: SyncedGame) => {
    setSyncing((prev) => ({ ...prev, [game.gameName]: true }));
    setStatus(null);
    try {
      const scanResult: any = await call("scan_games", {});
      if (scanResult.success && scanResult.games) {
        const gameInfo = scanResult.games.find((g: any) => g.name === game.gameName);
        if (gameInfo && gameInfo.savePaths && gameInfo.savePaths.length > 0) {
          const settings = loadSettings();
          const uniquePaths = Array.from(new Set([...settings.defaultSavePaths, ...gameInfo.savePaths]));
          const syncResult: any = await call("sync_game", { game_name: game.gameName, save_paths: uniquePaths });
          if (syncResult.success) {
            await loadSyncedGames();
          } else {
            setStatus(syncResult.error || "Ошибка синхронизации");
          }
        } else {
          setStatus(`Для «${game.gameName}» не найдены пути сохранений`);
        }
      }
    } catch (err) {
      setStatus(`Ошибка: ${err}`);
    } finally {
      setSyncing((prev) => ({ ...prev, [game.gameName]: false }));
    }
  };

  useEffect(() => {
    loadSyncedGames();
  }, []);

  if (loading || syncedGames.length === 0) {
    return null;
  }

  return (
    <PanelSection title={`Синхронизированные игры (${syncedGames.length})`}>
      <PanelSectionRow>
        <ButtonItem layout="below" icon={<FaRedo />} onClick={loadSyncedGames}>
          Обновить список
        </ButtonItem>
      </PanelSectionRow>

      {status && (
        <PanelSectionRow>
          <StatusMessage tone="error">{status}</StatusMessage>
        </PanelSectionRow>
      )}

      {syncedGames.slice(0, VISIBLE_LIMIT).map((game) => {
        const isSyncing = syncing[game.gameName];
        return (
          <PanelSectionRow key={game.gameName}>
            <ButtonItem
              icon={isSyncing ? <Spinner /> : <FaCloud />}
              label={game.gameName}
              description={`в облаке · ${formatDate(game.lastSync)} · синхронизировать снова`}
              onClick={() => resyncGame(game)}
              disabled={isSyncing}
            />
          </PanelSectionRow>
        );
      })}
    </PanelSection>
  );
}

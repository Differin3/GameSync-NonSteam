import { useState, useEffect } from "react";
import { call } from "@decky/api";
import { PanelSection, PanelSectionRow, ButtonItem, Spinner } from "@decky/ui";
import { SyncedGame } from "../utils/types";
import { loadSettings } from "../utils/Settings";

export function SyncedGamesList() {
  const [syncedGames, setSyncedGames] = useState<SyncedGame[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [syncing, setSyncing] = useState<{ [key: string]: boolean }>({});

  const loadSyncedGames = async () => {
    setLoading(true);
    setError(null);
    try {
      const result: any = await call("get_synced_games", {});
      if (result.success && result.games) {
        setSyncedGames(result.games);
      } else {
        setError(result.error || "Ошибка загрузки списка");
      }
    } catch (err) {
      setError(`Ошибка: ${err}`);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (isoString: string) => {
    try {
      const date = new Date(isoString);
      return date.toLocaleString("ru-RU", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit"
      });
    } catch {
      return isoString;
    }
  };

  const resyncGame = async (game: SyncedGame) => {
    setSyncing((prev) => ({ ...prev, [game.gameName]: true }));
    try {
      // Получаем пути сохранений для игры
      const scanResult: any = await call("scan_games", {});
      if (scanResult.success && scanResult.games) {
        const gameInfo = scanResult.games.find((g: any) => g.name === game.gameName);
        if (gameInfo && gameInfo.savePaths && gameInfo.savePaths.length > 0) {
          // Используем глобальные пути из настроек + пути игры
          const settings = loadSettings();
          const allSavePaths = [...settings.defaultSavePaths, ...gameInfo.savePaths];
          const uniquePaths = Array.from(new Set(allSavePaths));
          
          const syncResult: any = await call("sync_game", {
            game_name: game.gameName,
            save_paths: uniquePaths
          });
          if (syncResult.success) {
            await loadSyncedGames();
          }
        }
      }
    } catch (err) {
      console.error("Error resyncing game:", err);
    } finally {
      setSyncing((prev) => ({ ...prev, [game.gameName]: false }));
    }
  };

  useEffect(() => {
    loadSyncedGames();
  }, []);

  if (loading) {
    return (
      <PanelSection title="Синхронизированные игры">
        <PanelSectionRow>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <Spinner />
            <span>Загрузка...</span>
          </div>
        </PanelSectionRow>
      </PanelSection>
    );
  }

  if (error) {
    return (
      <PanelSection title="Синхронизированные игры">
        <PanelSectionRow>
          <div style={{ color: "red" }}>{error}</div>
        </PanelSectionRow>
        <PanelSectionRow>
          <ButtonItem layout="below" onClick={loadSyncedGames}>
            Повторить
          </ButtonItem>
        </PanelSectionRow>
      </PanelSection>
    );
  }

  if (syncedGames.length === 0) {
    return (
      <PanelSection title="Синхронизированные игры">
        <PanelSectionRow>
          <div style={{ color: "#888" }}>Нет синхронизированных игр</div>
        </PanelSectionRow>
      </PanelSection>
    );
  }

  return (
    <PanelSection title={`Синхронизированные игры (${syncedGames.length})`}>
      <PanelSectionRow>
        <ButtonItem layout="below" onClick={loadSyncedGames} disabled={loading}>
          Обновить список
        </ButtonItem>
      </PanelSectionRow>

      {syncedGames.map((game, index) => {
        const isSyncing = syncing[game.gameName];

        return (
          <PanelSection key={index} title={game.gameName}>
            <PanelSectionRow>
              <div style={{ fontSize: "12px", color: "#888" }}>
                Последняя синхронизация: {formatDate(game.lastSync)}
              </div>
            </PanelSectionRow>

            <PanelSectionRow>
              <ButtonItem
                layout="below"
                onClick={() => resyncGame(game)}
                disabled={isSyncing}
              >
                {isSyncing ? (
                  <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                    <Spinner />
                    <span>Синхронизация...</span>
                  </div>
                ) : (
                  "Повторить синхронизацию"
                )}
              </ButtonItem>
            </PanelSectionRow>
          </PanelSection>
        );
      })}
    </PanelSection>
  );
}

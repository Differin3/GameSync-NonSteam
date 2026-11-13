import { useEffect, useState } from "react";
import { call } from "@decky/api";
import { ButtonItem, ConfirmModal, PanelSection, PanelSectionRow, showModal } from "@decky/ui";
import { FaCloud, FaCloudDownloadAlt, FaHistory, FaRedo, FaUndoAlt } from "react-icons/fa";
import type { BackupEntry, GameBackups } from "../utils/types";
import { Badge, EmptyState, ErrorState, Hint, Loading, StatusMessage } from "./ui";
import type { Tone } from "./ui";
import { card, colors } from "../utils/theme";

const formatBytes = (bytes?: number): string => {
  if (!bytes || bytes <= 0) return "—";
  const units = ["Б", "КБ", "МБ", "ГБ"];
  const index = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
  return `${Math.round((bytes / Math.pow(1024, index)) * 10) / 10} ${units[index]}`;
};

const formatDate = (value?: string): string => {
  if (!value) return "дата неизвестна";
  try {
    return new Date(value).toLocaleString("ru-RU", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return value;
  }
};

export function BackupsTab() {
  const [games, setGames] = useState<GameBackups[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<string | null>(null);
  const [restoring, setRestoring] = useState<boolean>(false);
  const [status, setStatus] = useState<{ tone: Tone; text: string } | null>(null);

  const load = async (silent: boolean = false) => {
    if (silent) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }
    setError(null);
    try {
      const response: any = await call("get_backups", {});
      if (response?.success) {
        setGames(response.games || []);
      } else {
        setError(response?.error || "Не удалось загрузить список бэкапов");
      }
    } catch (err) {
      setError(`Ошибка: ${err}`);
    } finally {
      if (silent) {
        setRefreshing(false);
      } else {
        setLoading(false);
      }
    }
  };

  useEffect(() => {
    load();
  }, []);

  const selectedGame = games.find((item) => item.game === selected) || games[0] || null;

  const doRestore = async (gameName: string, entry: BackupEntry) => {
    setRestoring(true);
    setStatus(null);
    try {
      const response: any = await call("restore_backup", { game_name: gameName, backup_id: entry.id });
      if (response?.success) {
        const suffix = response.safety_backup ? " · текущие сейвы сохранены в резерв" : "";
        setStatus({ tone: "success", text: `${response.message || "Восстановлено"}${suffix}` });
        await load(true);
      } else {
        setStatus({ tone: "error", text: response?.error || "Ошибка восстановления" });
      }
    } catch (err: any) {
      setStatus({ tone: "error", text: err?.message || String(err) });
    } finally {
      setRestoring(false);
    }
  };

  const askRestore = (gameName: string, entry: BackupEntry) => {
    let modal: { Close: () => void } | null = null;
    modal = showModal(
      <ConfirmModal
        strTitle={`Восстановить «${gameName}»?`}
        strDescription={
          <>
            Бэкап от {formatDate(entry.created)} · {formatBytes(entry.size)}.
            <br />
            Сохранения будут распакованы в папки этой игры и заменят текущие файлы. Перед заменой плагин
            сохранит их в резервный архив.
          </>
        }
        strOKButtonText="Восстановить"
        strCancelButtonText="Отмена"
        bDestructiveWarning
        onOK={() => {
          modal?.Close();
          doRestore(gameName, entry);
        }}
        onCancel={() => modal?.Close()}
      />
    );
  };

  if (loading) return <Loading text="Загрузка бэкапов..." />;
  if (error) return <ErrorState text={error} onRetry={load} />;
  if (games.length === 0) return <EmptyState text="В облаке пока нет бэкапов — синхронизируйте игру" />;

  return (
    <div>
      <PanelSection>
        <PanelSectionRow>
          <div style={{ ...card, display: "flex", alignItems: "center", gap: "10px", width: "100%" }}>
            <FaCloudDownloadAlt style={{ color: "#66c0f4", fontSize: "18px" }} />
            <div style={{ flex: "1 1 auto", minWidth: 0 }}>
              <div style={{ fontSize: "13px", fontWeight: 600, color: colors.text }}>Восстановление сохранений</div>
              <div style={{ fontSize: "11px", color: colors.dim, marginTop: "2px" }}>
                {games.length} игр · {games.reduce((sum, item) => sum + item.entries.length, 0)} бэкапов
              </div>
            </div>
            <div style={{ minWidth: "160px" }}>
              <ButtonItem layout="below" icon={<FaRedo />} onClick={() => load(true)} disabled={refreshing}>
                {refreshing ? "Обновление…" : "Обновить"}
              </ButtonItem>
            </div>
          </div>
        </PanelSectionRow>
        <PanelSectionRow>
          <Hint>Восстановление перезапишет локальные сейвы. Перед этим плагин сохранит их в резервный архив.</Hint>
        </PanelSectionRow>
        {status && (
          <PanelSectionRow>
            <StatusMessage tone={status.tone}>{status.text}</StatusMessage>
          </PanelSectionRow>
        )}
      </PanelSection>

      <div style={{ display: "flex", gap: "14px", alignItems: "flex-start", padding: "0 16px", flexWrap: "wrap" }}>
        <div style={{ flex: "1 1 520px", minWidth: "0", display: "flex", flexDirection: "column", gap: "10px" }}>
          {games.map((item) => {
            const last = item.entries[0];
            const isSelected = selectedGame?.game === item.game;
            return (
              <div
                key={item.game}
                style={{
                  ...card,
                  display: "flex",
                  flexDirection: "column",
                  gap: "8px",
                  borderColor: isSelected ? "rgba(102,192,244,0.45)" : undefined,
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", gap: "10px", alignItems: "center" }}>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontSize: "13px", fontWeight: 600, color: colors.text }}>{item.game}</div>
                    <div style={{ fontSize: "10.5px", color: colors.dim, marginTop: "2px" }}>
                      {formatDate(last?.created)} · {formatBytes(last?.size)}
                    </div>
                  </div>
                  <div style={{ display: "flex", gap: "6px", alignItems: "center" }}>
                    <Badge tone="success">
                      <FaCloud style={{ marginRight: "4px" }} />
                      {item.entries.length} версий
                    </Badge>
                  </div>
                </div>
                <div style={{ display: "flex", gap: "8px" }}>
                  <div style={{ flex: 1 }}>
                    <ButtonItem layout="below" icon={<FaHistory />} onClick={() => setSelected(item.game)}>
                      Версии
                    </ButtonItem>
                  </div>
                  <div style={{ flex: 1 }}>
                    <ButtonItem
                      layout="below"
                      icon={<FaUndoAlt />}
                      onClick={() => last && askRestore(item.game, last)}
                      disabled={!last || restoring}
                    >
                      Восстановить
                    </ButtonItem>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {selectedGame && (
          <div style={{ ...card, width: "320px", flex: "0 0 auto", display: "flex", flexDirection: "column", gap: "8px" }}>
            <div style={{ fontSize: "13px", fontWeight: 600, color: colors.text }}>{selectedGame.game}</div>
            <div style={{ fontSize: "10.5px", color: colors.dim }}>
              последний бэкап: {formatDate(selectedGame.entries[0]?.created)}
            </div>
            <div style={{ fontSize: "22px", fontWeight: 600, color: colors.text }}>
              {formatBytes(selectedGame.entries[0]?.size)}
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "6px", marginTop: "4px" }}>
              {selectedGame.entries.slice(0, 6).map((entry) => (
                <ButtonItem
                  key={entry.id}
                  icon={<FaUndoAlt />}
                  label={formatDate(entry.created)}
                  description={`${formatBytes(entry.size)} · восстановить`}
                  onClick={() => askRestore(selectedGame.game, entry)}
                  disabled={restoring}
                />
              ))}
            </div>

            <Hint>Версии хранятся в облаке, старые записи исчезают из списка после 10 штук.</Hint>
          </div>
        )}
      </div>
    </div>
  );
}

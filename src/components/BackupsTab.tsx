import { useEffect, useState } from "react";
import { FaHistory, FaRedo, FaUndoAlt } from "react-icons/fa";
import { call } from "@decky/api";
import { ButtonItem, ConfirmModal, PanelSection, PanelSectionRow, showModal } from "@decky/ui";
import type { BackupEntry, GameBackups } from "../utils/types";
import { Badge, EmptyState, ErrorState, Hint, Loading, StatusMessage } from "./ui";
import type { Tone } from "./ui";
import { card, dimText } from "../utils/theme";

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
      <PanelSection title={`Бэкапы (${games.length})`}>
        <PanelSectionRow>
          <Hint>
            Восстановление перезапишет локальные сейвы. Перед этим плагин сохранит их в резервный архив — он появится
            в истории этой же игры.
          </Hint>
        </PanelSectionRow>
        <PanelSectionRow>
          <ButtonItem layout="below" onClick={() => load(true)} disabled={loading || refreshing || restoring}>
            <span style={{display:"inline-flex",alignItems:"center",gap:"7px"}}><FaRedo />{refreshing ? "Обновление…" : "Обновить список"}</span>
          </ButtonItem>
        </PanelSectionRow>

        {games.map((item) => {
          const last = item.entries[0];
          const isSelected = selectedGame?.game === item.game;
          return (
            <PanelSectionRow key={item.game}>
              <ButtonItem layout="below" onClick={() => setSelected(item.game)} disabled={restoring}>
                <div style={{ display: "flex", flexDirection: "column", gap: "3px", width: "100%" }}>
                  <div style={{ display: "flex", gap: "6px", alignItems: "center", flexWrap: "wrap" }}>
                    <span style={{ fontSize: "13px", fontWeight: 600 }}>{item.game}</span>
                    <Badge tone="info"><FaHistory style={{marginRight:"4px"}} />{item.entries.length} версий</Badge>
                    {isSelected && <Badge tone="success">выбрано</Badge>}
                    {last?.legacy && <Badge tone="warning">старый бэкап</Badge>}
                  </div>
                  <div style={dimText}>
                    {formatDate(last?.created)} · {formatBytes(last?.size)}
                  </div>
                </div>
              </ButtonItem>
            </PanelSectionRow>
          );
        })}
      </PanelSection>

      {selectedGame && (
        <PanelSection title={`Версии · ${selectedGame.game}`}>
          {selectedGame.entries.map((entry) => (
            <PanelSectionRow key={entry.id}>
              <div style={{ ...card, display: "flex", flexDirection: "column", gap: "8px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: "8px" }}>
                  <span style={{ fontSize: "12px", fontWeight: 600 }}>{formatDate(entry.created)}</span>
                  <span style={dimText}>{formatBytes(entry.size)}</span>
                </div>
                <div style={dimText}>
                  {entry.kind === "prerestore"
                    ? "автоматическая копия перед восстановлением"
                    : "синхронизация"}
                  {entry.legacy ? " · создан старой версией плагина" : ""}
                </div>
                <ButtonItem layout="below" onClick={() => askRestore(selectedGame.game, entry)} disabled={restoring}>
                  <span style={{display:"inline-flex",alignItems:"center",justifyContent:"center",gap:"7px"}}><FaUndoAlt />{restoring ? "Восстановление…" : "Восстановить"}</span>
                </ButtonItem>
              </div>
            </PanelSectionRow>
          ))}
          {status && (
            <PanelSectionRow>
              <StatusMessage tone={status.tone}>{status.text}</StatusMessage>
            </PanelSectionRow>
          )}
        </PanelSection>
      )}
    </div>
  );
}

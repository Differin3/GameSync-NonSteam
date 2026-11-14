import { useEffect, useState } from "react";
import { call } from "@decky/api";
import { ConfirmModal, Dropdown, PanelSection, PanelSectionRow, showModal } from "@decky/ui";
import { FaCloud, FaCloudDownloadAlt, FaDownload, FaRedo, FaUndoAlt } from "react-icons/fa";
import type { BackupEntry, GameBackups } from "../utils/types";
import { ActionButton, Badge, EmptyState, ErrorState, Hint, Loading, Pager, StatusMessage } from "./ui";
import type { Tone } from "./ui";
import { card, colors, dimText } from "../utils/theme";

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

const VERSION_OPTIONS = [3, 5, 10, 20, 50].map((value) => ({ data: value, label: `${value} версий` }));
const PAGE_SIZE = 6;

export function BackupsTab() {
  const [games, setGames] = useState<GameBackups[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<string | null>(null);
  const [page, setPage] = useState<number>(1);
  const [restoring, setRestoring] = useState<boolean>(false);
  const [downloading, setDownloading] = useState<boolean>(false);
  const [maxVersions, setMaxVersions] = useState<number>(10);
  const [providerName, setProviderName] = useState<string>("хранилище");
  const [downloadDir, setDownloadDir] = useState<string>("~/Downloads");
  const [status, setStatus] = useState<{ tone: Tone; text: string } | null>(null);

  const load = async (silent: boolean = false) => {
    if (silent) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }
    setError(null);
    try {
      const [response, appSettings, storage]: any[] = await Promise.all([
        call("get_backups", {}),
        call("get_app_settings", {}),
        call("get_storage_status", {}),
      ]);
      if (response?.success) {
        setGames(response.games || []);
      } else {
        setError(response?.error || "Не удалось загрузить список бэкапов");
      }
      setMaxVersions(Number(appSettings?.max_backup_versions || 10));
      if (appSettings?.download_dir) setDownloadDir(String(appSettings.download_dir));
      setProviderName(storage?.provider || "хранилище");
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

  useEffect(() => {
    const pages = Math.max(1, Math.ceil(games.length / PAGE_SIZE));
    if (page > pages) setPage(pages);
  }, [games.length, page]);

  const selectedGame = games.find((item) => item.game === selected) || games[0] || null;

  const changeMaxVersions = async (value: number) => {
    setMaxVersions(value);
    try {
      const result: any = await call("set_max_backup_versions", { count: value });
      if (result?.success) {
        setStatus({ tone: "success", text: `Будем хранить до ${value} версий на игру` });
      } else {
        setStatus({ tone: "error", text: result?.error || "Не удалось сохранить настройку" });
      }
    } catch (err: any) {
      setStatus({ tone: "error", text: err?.message || String(err) });
    }
  };

  const doRestore = async (gameName: string, entry: BackupEntry) => {
    setRestoring(true);
    setStatus(null);
    try {
      const response: any = await call("restore_backup", { game_name: gameName, backup_id: entry.id });
      if (response?.success) {
        const files = Number(response.files || 0);
        const suffix = response.safety_backup ? " · текущие сейвы сохранены в резерв" : "";
        if (files === 0) {
          setStatus({
            tone: "warning",
            text: "Восстановлено 0 файлов: в этом бэкапе, похоже, только служебные файлы. Пересинхронизируйте игру после исправления путей.",
          });
        } else {
          setStatus({ tone: "success", text: `${response.message || "Восстановлено"}${suffix}` });
        }
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

  const download = async (gameName: string, entry: BackupEntry) => {
    setDownloading(true);
    setStatus(null);
    try {
      const result: any = await call("download_backup", { game_name: gameName, backup_id: entry.id });
      if (result?.success) {
        setStatus({ tone: "success", text: `Скачано в ${result.path}` });
      } else {
        setStatus({ tone: "error", text: result?.error || "Не удалось скачать архив" });
      }
    } catch (err: any) {
      setStatus({ tone: "error", text: err?.message || String(err) });
    } finally {
      setDownloading(false);
    }
  };

  if (loading) return <Loading text="Загрузка бэкапов..." />;
  if (error) return <ErrorState text={error} onRetry={load} />;
  if (games.length === 0) return <EmptyState text="В облаке пока нет бэкапов — синхронизируйте игру" />;

  const totalBackups = games.reduce((sum, item) => sum + item.entries.length, 0);
  const totalSize = games.reduce((sum, item) => sum + item.entries.reduce((acc, entry) => acc + (entry.size || 0), 0), 0);
  const latest = selectedGame?.entries[0];
  const pages = Math.max(1, Math.ceil(games.length / PAGE_SIZE));
  const visibleGames = games.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  return (
    <div>
      <PanelSection>
        <PanelSectionRow>
          <div style={{ ...card, display: "flex", alignItems: "center", gap: "10px" }}>
            <FaCloudDownloadAlt style={{ color: "#66c0f4", fontSize: "18px", flex: "0 0 auto" }} />
            <div style={{ flex: "1 1 auto", minWidth: 0 }}>
              <div style={{ fontSize: "13px", fontWeight: 600, color: colors.text }}>Восстановление сохранений</div>
              <div style={{ fontSize: "11px", color: colors.dim, marginTop: "2px" }}>
                {providerName} · {games.length} игр · {totalBackups} бэкапов · {formatBytes(totalSize)}
              </div>
            </div>
            <div style={{ width: "176px", flex: "0 0 auto" }}>
              <ActionButton icon={<FaRedo />} onClick={() => load(true)} disabled={refreshing}>
                {refreshing ? "Обновление…" : "Обновить список"}
              </ActionButton>
            </div>
          </div>
        </PanelSectionRow>

        <PanelSectionRow>
          <Dropdown
            menuLabel="Хранить версий на игру"
            rgOptions={VERSION_OPTIONS}
            selectedOption={maxVersions}
            onChange={(option) => changeMaxVersions(Number(option.data))}
          />
        </PanelSectionRow>

        <PanelSectionRow>
          <Hint>
            Плагин хранит последнюю версию и до {Math.max(0, maxVersions - 1)} предыдущих. Перед восстановлением
            текущие сейвы сохраняются в резервный архив.
          </Hint>
        </PanelSectionRow>

        {status && (
          <PanelSectionRow>
            <StatusMessage tone={status.tone}>{status.text}</StatusMessage>
          </PanelSectionRow>
        )}
      </PanelSection>

      <div style={{ display: "flex", gap: "12px", alignItems: "flex-start", padding: "0 16px" }}>
        <div style={{ flex: "1 1 0", minWidth: "0", display: "flex", flexDirection: "column", gap: "10px" }}>
          {visibleGames.map((item) => {
            const last = item.entries[0];
            const isSelected = selectedGame?.game === item.game;
            return (
              <div
                key={item.game}
                onClick={() => setSelected(item.game)}
                style={{
                  ...card,
                  display: "flex",
                  flexDirection: "column",
                  gap: "8px",
                  cursor: "pointer",
                  borderColor: isSelected ? "rgba(102,192,244,0.45)" : undefined,
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", gap: "10px", alignItems: "center" }}>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontSize: "13px", fontWeight: 600, color: colors.text }}>{item.game}</div>
                    <div style={{ fontSize: "10.5px", color: colors.dim, marginTop: "2px" }}>
                      {formatDate(last?.created)} · {formatBytes(last?.size)} · {(last?.paths || []).length} путей
                    </div>
                  </div>
                  <Badge tone="success">
                    <FaCloud style={{ marginRight: "4px" }} />в облаке
                  </Badge>
                </div>
                <ActionButton icon={<FaUndoAlt />} onClick={() => last && askRestore(item.game, last)} disabled={!last || restoring}>
                  Восстановить
                </ActionButton>
              </div>
            );
          })}
          <Pager page={page} pages={pages} onChange={setPage} totalLabel={`${games.length} игр`} />
        </div>

        {selectedGame && latest && (
          <aside style={{ ...card, width: "296px", flex: "0 0 296px", display: "flex", flexDirection: "column", gap: "8px", minWidth: 0 }}>
            <div style={{ fontSize: "14px", fontWeight: 600, color: colors.text }}>{selectedGame.game}</div>
            <div style={dimText}>последний бэкап: {formatDate(latest.created)}</div>

            <div style={{ fontSize: "24px", fontWeight: 600, color: colors.text }}>
              {formatBytes(latest.size)}{" "}
              <span style={{ fontSize: "11px", fontWeight: 400, color: colors.dim }}>· {selectedGame.entries.length} версий</span>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "4px", fontSize: "11px", color: colors.muted }}>
              <div style={{ display: "flex", justifyContent: "space-between", gap: "8px" }}>
                <span>Путей сохранений</span>
                <span style={{ color: colors.text }}>{(latest.paths || []).length}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", gap: "8px", minWidth: 0 }}>
                <span>В облаке</span>
                <span style={{ color: colors.text, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", minWidth: 0, flex: "0 1 auto" }}>
                  {String(latest.remote || "").split("/").slice(-2).join("/")}
                </span>
              </div>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "4px", marginTop: "4px" }}>
              {selectedGame.entries.slice(0, 6).map((entry) => (
                <div
                  key={entry.id}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    gap: "8px",
                    fontSize: "10.5px",
                    color: colors.dim,
                    padding: "3px 0",
                    borderTop: "1px solid rgba(255,255,255,0.05)",
                  }}
                >
                  <span>{formatDate(entry.created)}</span>
                  <span>{formatBytes(entry.size)}</span>
                </div>
              ))}
            </div>

            <ActionButton icon={<FaUndoAlt />} onClick={() => askRestore(selectedGame.game, latest)} disabled={restoring}>
              Восстановить из облака
            </ActionButton>
            <ActionButton icon={<FaDownload />} onClick={() => download(selectedGame.game, latest)} disabled={downloading}>
              {downloading ? "Скачивание…" : "Скачать .tar.gz"}
            </ActionButton>

            <Hint>Скачивается в {downloadDir}</Hint>
            <Hint>Восстановление перезапишет локальные сейвы. Текущая версия будет сохранена как резервная.</Hint>
          </aside>
        )}
      </div>
    </div>
  );
}

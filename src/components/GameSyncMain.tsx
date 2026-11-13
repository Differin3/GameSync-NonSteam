import { useEffect, useState } from "react";
import { call } from "@decky/api";
import { Field, PanelSection, PanelSectionRow, Router, Spinner } from "@decky/ui";
import { FaCloud, FaCloudDownloadAlt, FaCog, FaSyncAlt } from "react-icons/fa";
import { ActionButton, Hint, Icon, StatusMessage } from "./ui";
import type { Tone } from "./ui";

interface Summary {
  games: number;
  synced: number;
  lastSync?: string;
}

interface StorageStatus {
  success: boolean;
  provider: string;
  error?: string;
}

interface SyncProgress {
  active: boolean;
  stage: string;
  percent: number;
  currentGame: string;
  index: number;
  total: number;
  ok: number;
  failed: number;
}

const formatDate = (value?: string): string => {
  if (!value) return "";
  try {
    return new Date(value).toLocaleDateString("ru-RU", { day: "2-digit", month: "2-digit" });
  } catch {
    return value;
  }
};

export function GameSyncMain() {
  const [pluginOk, setPluginOk] = useState<boolean>(false);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [storage, setStorage] = useState<StorageStatus | null>(null);
  const [syncing, setSyncing] = useState<boolean>(false);
  const [progress, setProgress] = useState<SyncProgress | null>(null);
  const [message, setMessage] = useState<{ tone: Tone; text: string } | null>(null);

  const loadStorage = async () => {
    try {
      const result: any = await call("get_storage_status", {});
      setStorage({
        success: Boolean(result?.success),
        provider: result?.provider || "хранилище",
        error: result?.error,
      });
    } catch (error: any) {
      setStorage({ success: false, provider: "хранилище", error: error?.message || String(error) });
    }
  };

  const load = async () => {
    try {
      const [test, stats, scan] = await Promise.all([
        call("get_test", {}),
        call("get_sync_stats", {}),
        call("scan_games", {}),
      ]);
      setPluginOk(Boolean((test as any)?.success));
      setSummary({
        games: Array.isArray((scan as any)?.games) ? (scan as any).games.length : 0,
        synced: Number((stats as any)?.stats?.gamesCount || 0),
        lastSync: (stats as any)?.stats?.lastSync,
      });
    } catch (error) {
      setPluginOk(false);
      setSummary(null);
    }
  };

  useEffect(() => {
    load();
    loadStorage();
  }, []);

  // Пока идёт синхронизация — опрашиваем прогресс (этап, проценты, игра).
  useEffect(() => {
    if (!syncing) return;
    let cancelled = false;
    const tick = async () => {
      try {
        const next: any = await call("get_sync_progress", {});
        if (!cancelled && next) setProgress(next as SyncProgress);
      } catch {
        /* плагин мог перезапуститься — просто пропускаем тик */
      }
    };
    tick();
    const timer = setInterval(tick, 500);
    return () => {
      cancelled = true;
      clearInterval(timer);
    };
  }, [syncing]);

  const openSettings = (tab: string) => {
    Router.CloseSideMenus();
    Router.Navigate("/gamesync-settings");
    setTimeout(() => window.dispatchEvent(new CustomEvent("gamesync-switch-tab", { detail: tab })), 120);
  };

  const syncAll = async () => {
    setSyncing(true);
    setMessage(null);
    setProgress({ active: true, stage: "Запуск…", percent: 0, currentGame: "", index: 0, total: 0, ok: 0, failed: 0 });
    try {
      const result: any = await call("sync_all_games", {});
      if (result?.success) {
        const synced = (result.synced || []).length;
        const failed = (result.failed || []).length;
        setMessage({
          tone: failed > 0 ? "warning" : "success",
          text: failed > 0 ? `Синхронизировано ${synced}, с ошибками ${failed}` : `Синхронизировано игр: ${synced}`,
        });
        await load();
        await loadStorage();
      } else {
        setMessage({ tone: "error", text: result?.error || "Не удалось синхронизировать" });
      }
    } catch (error: any) {
      setMessage({ tone: "error", text: error?.message || String(error) });
    } finally {
      setSyncing(false);
    }
  };

  const percent = Math.max(0, Math.min(100, Math.round(progress?.percent ?? 0)));
  const storageLabel = storage ? `${storage.provider} · ${storage.success ? "подключено" : "нет связи"}` : "проверка хранилища…";
  const storageOk = storage?.success ?? false;

  return (
    <PanelSection>
      <PanelSectionRow>
        <Field
          icon={
            <Icon>
              <FaCloud style={{ color: storageOk ? "#5fd88a" : storage ? "#e05b5b" : "#8b929a" }} />
            </Icon>
          }
          label="GameSync"
          description={`${storageLabel} · ${summary?.games ?? "…"} игр · ${summary?.synced ?? 0} в облаке${
            summary?.lastSync ? ` · ${formatDate(summary.lastSync)}` : ""
          }`}
        />
      </PanelSectionRow>

      <PanelSectionRow>
        <ActionButton
          icon={syncing ? <Spinner /> : <FaSyncAlt />}
          onClick={syncAll}
          disabled={syncing || !pluginOk}
        >
          {syncing ? "Синхронизация…" : "Синхронизировать всё"}
        </ActionButton>
      </PanelSectionRow>

      {(syncing || progress?.active) && (
        <PanelSectionRow>
          <div style={{ width: "100%" }}>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "11px", color: "#b8bcbf", marginBottom: "4px" }}>
              <span>{progress?.stage || "Подготовка…"}</span>
              <span>{percent}%</span>
            </div>
            <div style={{ height: "6px", borderRadius: "3px", background: "rgba(255,255,255,0.08)", overflow: "hidden" }}>
              <div
                style={{
                  width: `${percent}%`,
                  height: "100%",
                  borderRadius: "3px",
                  background: "linear-gradient(90deg, #1a9fff, #66c0f4)",
                  transition: "width 0.3s ease",
                }}
              />
            </div>
            <div style={{ fontSize: "10.5px", color: "#8b929a", marginTop: "4px", minHeight: "13px" }}>
              {progress?.currentGame
                ? `${progress.currentGame}${progress.total ? ` · ${progress.index}/${progress.total}` : ""}`
                : progress?.total
                  ? `${progress.index}/${progress.total}`
                  : ""}
              {progress && (progress.ok > 0 || progress.failed > 0) ? ` · ок: ${progress.ok}, ошибок: ${progress.failed}` : ""}
            </div>
          </div>
        </PanelSectionRow>
      )}

      <PanelSectionRow>
        <ActionButton icon={<FaCloudDownloadAlt />} onClick={() => openSettings("backups")}>
          Бэкапы и восстановление
        </ActionButton>
      </PanelSectionRow>

      <PanelSectionRow>
        <ActionButton icon={<FaCog />} onClick={() => openSettings("main")}>
          Настройки
        </ActionButton>
      </PanelSectionRow>

      {message && (
        <PanelSectionRow>
          <StatusMessage tone={message.tone}>{message.text}</StatusMessage>
        </PanelSectionRow>
      )}

      {storage && !storage.success && !syncing && (
        <PanelSectionRow>
          <StatusMessage tone="error">Хранилище: {storage.error || "нет подключения"}</StatusMessage>
        </PanelSectionRow>
      )}

      <PanelSectionRow>
        <Hint>Пути сохранений и история бэкапов — на полноэкранной странице плагина.</Hint>
      </PanelSectionRow>
    </PanelSection>
  );
}

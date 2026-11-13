import { useEffect, useState } from "react";
import { call } from "@decky/api";
import { ButtonItem, Field, PanelSection, PanelSectionRow, Router, Spinner } from "@decky/ui";
import { FaCloud, FaCloudDownloadAlt, FaCog, FaSyncAlt } from "react-icons/fa";
import { Hint, StatusMessage } from "./ui";
import type { Tone } from "./ui";

interface Summary {
  games: number;
  synced: number;
  lastSync?: string;
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
  const [connected, setConnected] = useState<boolean>(false);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [syncing, setSyncing] = useState<boolean>(false);
  const [message, setMessage] = useState<{ tone: Tone; text: string } | null>(null);

  const load = async () => {
    try {
      const [test, stats, scan] = await Promise.all([
        call("get_test", {}),
        call("get_sync_stats", {}),
        call("scan_games", {}),
      ]);
      const ok = Boolean((test as any)?.success);
      setConnected(ok);
      setSummary({
        games: Array.isArray((scan as any)?.games) ? (scan as any).games.length : 0,
        synced: Number((stats as any)?.stats?.gamesCount || 0),
        lastSync: (stats as any)?.stats?.lastSync,
      });
    } catch (error) {
      setConnected(false);
      setSummary(null);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const openSettings = (tab: string) => {
    Router.CloseSideMenus();
    Router.Navigate("/gamesync-settings");
    setTimeout(() => window.dispatchEvent(new CustomEvent("gamesync-switch-tab", { detail: tab })), 120);
  };

  const syncAll = async () => {
    setSyncing(true);
    setMessage(null);
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
      } else {
        setMessage({ tone: "error", text: result?.error || "Не удалось синхронизировать" });
      }
    } catch (error: any) {
      setMessage({ tone: "error", text: error?.message || String(error) });
    } finally {
      setSyncing(false);
    }
  };

  const description = connected
    ? `подключено · ${summary?.games ?? "…"} игр · ${summary?.synced ?? 0} в облаке${
        summary?.lastSync ? ` · ${formatDate(summary.lastSync)}` : ""
      }`
    : "нет связи с бэкендом";

  return (
    <PanelSection>
      <PanelSectionRow>
        <Field icon={<FaCloud style={{ color: "#66c0f4" }} />} label="GameSync" description={description} />
      </PanelSectionRow>

      <PanelSectionRow>
        <ButtonItem
          layout="below"
          icon={syncing ? <Spinner /> : <FaSyncAlt />}
          onClick={syncAll}
          disabled={syncing || !connected}
        >
          {syncing ? "Синхронизация…" : "Синхронизировать всё"}
        </ButtonItem>
      </PanelSectionRow>

      <PanelSectionRow>
        <ButtonItem layout="below" icon={<FaCloudDownloadAlt />} onClick={() => openSettings("backups")}>
          Бэкапы и восстановление
        </ButtonItem>
      </PanelSectionRow>

      <PanelSectionRow>
        <ButtonItem layout="below" icon={<FaCog />} onClick={() => openSettings("main")}>
          Настройки
        </ButtonItem>
      </PanelSectionRow>

      {message && (
        <PanelSectionRow>
          <StatusMessage tone={message.tone}>{message.text}</StatusMessage>
        </PanelSectionRow>
      )}

      <PanelSectionRow>
        <Hint>Пути сохранений и история бэкапов — на полноэкранной странице плагина.</Hint>
      </PanelSectionRow>
    </PanelSection>
  );
}

import { useEffect, useState } from "react";
import { call } from "@decky/api";
import { DialogButton, Focusable, Router } from "@decky/ui";
import { FaCloud } from "react-icons/fa";

interface GameSyncStatus {
  game: string;
  last_sync?: string;
  size?: number;
  versions?: number;
  provider?: string;
  save_paths?: number;
}

interface Props {
  appId: number;
  title?: string;
}

const formatDate = (value?: string): string => {
  if (!value) return "";
  try {
    return new Date(value).toLocaleString("ru-RU", {
      day: "2-digit",
      month: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return value;
  }
};

const formatBytes = (bytes?: number): string => {
  if (!bytes || bytes <= 0) return "";
  const units = ["Б", "КБ", "МБ", "ГБ"];
  const index = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
  return `${Math.round((bytes / Math.pow(1024, index)) * 10) / 10} ${units[index]}`;
};

/**
 * Строка GameSync на странице non-Steam игры в библиотеке Steam.
 *
 * Патч страницы передаёт сюда appid и название; для игр, которые плагин
 * не знает, бэкенд отвечает found=false и строка не рисуется.
 */
export function GameSyncGameRow({ appId, title }: Props) {
  const [status, setStatus] = useState<GameSyncStatus | null>(null);
  const [checked, setChecked] = useState<boolean>(false);
  const [busy, setBusy] = useState<boolean>(false);
  const [message, setMessage] = useState<string | null>(null);

  const load = async () => {
    try {
      const response: any = await call("get_game_sync_status", { appid: appId, game_name: title });
      setStatus(response?.found ? response : null);
    } catch (error) {
      console.error("[GameSync] status request failed", error);
      setStatus(null);
    } finally {
      setChecked(true);
    }
  };

  useEffect(() => {
    setChecked(false);
    setStatus(null);
    load();
  }, [appId]);

  if (!checked || !status) {
    return null;
  }

  const syncNow = async () => {
    setBusy(true);
    setMessage(null);
    try {
      const response: any = await call("sync_game", { game_name: status.game });
      if (!response?.success) {
        setMessage(response?.error || "Не удалось синхронизировать");
      }
      await load();
    } catch (error: any) {
      setMessage(error?.message || String(error));
    } finally {
      setBusy(false);
    }
  };

  const openSettings = () => {
    try {
      Router.CloseSideMenus();
      Router.Navigate("/gamesync-settings");
      setTimeout(() => window.dispatchEvent(new CustomEvent("gamesync-switch-tab", { detail: "game_paths" })), 150);
    } catch (error) {
      console.error("[GameSync] navigation failed", error);
    }
  };

  const details = [
    status.last_sync ? `в облаке с ${formatDate(status.last_sync)}` : "ещё не синхронизировались",
    formatBytes(status.size),
    status.versions && status.versions > 1 ? `${status.versions} версий` : "",
    status.save_paths ? `${status.save_paths} путей` : "",
  ]
    .filter(Boolean)
    .join(" · ");

  return (
    <Focusable
      flow-children="row"
      style={{
        display: "flex",
        alignItems: "center",
        gap: "12px",
        width: "100%",
        boxSizing: "border-box",
        padding: "10px 16px",
        margin: "0 0 10px",
        background: "rgba(20, 32, 40, 0.72)",
        borderLeft: "3px solid #66c0f4",
        borderRadius: "4px",
      }}
    >
      <FaCloud style={{ fontSize: "20px", color: "#7fd0ff", flex: "0 0 auto" }} />
      <div style={{ display: "flex", flexDirection: "column", gap: "2px", flex: "1 1 auto", minWidth: 0 }}>
        <div style={{ fontSize: "11px", letterSpacing: "0.6px", textTransform: "uppercase", color: "rgba(255,255,255,0.55)" }}>
          GameSync
        </div>
        <div style={{ fontSize: "13px", color: "#e8eef3", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {details}
        </div>
        {message && <div style={{ fontSize: "11px", color: "#f0a0a0" }}>{message}</div>}
      </div>
      <DialogButton style={{ minWidth: "170px" }} onClick={syncNow} disabled={busy}>
        {busy ? "Синхронизация…" : "Синхронизировать"}
      </DialogButton>
      <DialogButton style={{ minWidth: "110px" }} onClick={openSettings}>
        Настроить
      </DialogButton>
    </Focusable>
  );
}

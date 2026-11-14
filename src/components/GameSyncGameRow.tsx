import { useEffect, useState } from "react";
import { call } from "@decky/api";
import { Focusable, Router, Spinner } from "@decky/ui";
import { FaCloud, FaCog, FaSyncAlt } from "react-icons/fa";

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

const IconAction = ({
  title,
  onClick,
  active,
  disabled,
  children,
}: {
  title: string;
  onClick: () => void;
  active?: boolean;
  disabled?: boolean;
  children: React.ReactNode;
}) => {
  const [hovered, setHovered] = useState(false);
  const [focused, setFocused] = useState(false);
  return (
    <Focusable
      onClick={disabled ? undefined : onClick}
      onActivate={disabled ? undefined : onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onFocus={() => setFocused(true)}
      onBlur={() => setFocused(false)}
      title={title}
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        width: "34px",
        height: "34px",
        flex: "0 0 auto",
        borderRadius: "50%",
        cursor: disabled ? "default" : "pointer",
        background: active ? "rgba(91,216,138,0.20)" : focused || hovered ? "rgba(102,192,244,0.22)" : "rgba(102,192,244,0.10)",
        boxShadow: focused ? "0 0 0 2px rgba(102,192,244,0.65)" : "none",
        transition: "background 0.15s ease, box-shadow 0.15s ease",
        opacity: disabled ? 0.55 : 1,
      }}
    >
      {children}
    </Focusable>
  );
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
    // Автосинхронизация после выхода из игры должна отражаться без перезахода.
    const timer = setInterval(load, 60000);
    return () => clearInterval(timer);
  }, [appId]);

  if (!checked || !status) {
    return null;
  }

  const recent = Boolean(
    status.last_sync && Date.now() - new Date(status.last_sync).getTime() < 24 * 3600 * 1000
  );

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
    status.last_sync ? `сохранено ${formatDate(status.last_sync)}` : "ещё не синхронизировалось",
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
        gap: "10px",
        width: "100%",
        boxSizing: "border-box",
        padding: "8px 12px",
        margin: "0 0 8px",
        background: "rgba(20, 32, 40, 0.72)",
        borderLeft: "3px solid #66c0f4",
        borderRadius: "4px",
      }}
    >
      <Focusable
        onClick={syncNow}
        onActivate={syncNow}
        title={busy ? "Синхронизация…" : recent ? "Синхронизировать ещё раз" : "Синхронизировать игру"}
        style={{
          position: "relative",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          width: "34px",
          height: "34px",
          flex: "0 0 auto",
          borderRadius: "50%",
          cursor: "pointer",
          background: "rgba(102,192,244,0.10)",
        }}
      >
        {busy ? <Spinner /> : <FaCloud style={{ fontSize: "19px", color: "#7fd0ff" }} />}
        {recent && !busy && (
          <span
            style={{
              position: "absolute",
              right: "1px",
              bottom: "1px",
              width: "9px",
              height: "9px",
              borderRadius: "50%",
              background: "#5fd88a",
              boxShadow: "0 0 0 2px rgba(20, 32, 40, 0.95)",
            }}
          />
        )}
      </Focusable>

      <div style={{ display: "flex", flexDirection: "column", gap: "1px", flex: "1 1 auto", minWidth: 0 }}>
        <div style={{ fontSize: "10px", letterSpacing: "0.7px", textTransform: "uppercase", color: "rgba(255,255,255,0.5)" }}>
          GameSync
        </div>
        <div
          style={{
            fontSize: "12px",
            lineHeight: "1.35",
            color: "#e8eef3",
            overflow: "hidden",
            display: "-webkit-box",
            WebkitLineClamp: 2,
            WebkitBoxOrient: "vertical",
          }}
        >
          {details}
        </div>
        {message && <div style={{ fontSize: "11px", color: "#f0a0a0" }}>{message}</div>}
      </div>

      <IconAction title={busy ? "Синхронизация…" : "Синхронизировать"} onClick={syncNow} disabled={busy}>
        {busy ? <Spinner /> : <FaSyncAlt style={{ fontSize: "15px", color: "#bcd8ea" }} />}
      </IconAction>
      <IconAction title="Настроить пути сохранений" onClick={openSettings}>
        <FaCog style={{ fontSize: "15px", color: "#bcd8ea" }} />
      </IconAction>
    </Focusable>
  );
}

import { useEffect, useRef, useState } from "react";
import { addEventListener, call, toaster } from "@decky/api";
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
      onClick={disabled ? undefined : (event: any) => {
        event?.stopPropagation?.();
        onClick();
      }}
      onTouchEnd={disabled ? undefined : (event: any) => {
        event?.preventDefault?.();
        event?.stopPropagation?.();
        onClick();
      }}
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
        touchAction: "manipulation",
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
  const [autoBusy, setAutoBusy] = useState<boolean>(false);
  const [serverBusy, setServerBusy] = useState<boolean>(false);
  const statusRef = useRef<GameSyncStatus | null>(null);
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

  const matchesGame = (eventGame?: string): boolean => {
    const current = (statusRef.current?.game || title || "").toLowerCase().trim();
    const incoming = (eventGame || "").toLowerCase().trim();
    if (!current || !incoming) return false;
    return current === incoming || incoming.includes(current) || current.includes(incoming);
  };

  useEffect(() => {
    setChecked(false);
    setStatus(null);
    load();

    // Автосинхронизация после выхода из игры должна отражаться без перезахода.
    const timer = setInterval(load, 60000);

    const offStarted = addEventListener("gamesync_sync_started", (data: any) => {
      if (matchesGame(data?.game)) {
        setAutoBusy(true);
        setMessage(null);
      }
    });
    const offFinished = addEventListener("gamesync_sync_finished", (data: any) => {
      if (!matchesGame(data?.game)) return;
      setAutoBusy(false);
      if (!data?.success && data?.error) setMessage(String(data.error));
      load();
    });

    return () => {
      clearInterval(timer);
      if (typeof offStarted === "function") (offStarted as () => void)();
      if (typeof offFinished === "function") (offFinished as () => void)();
    };
  }, [appId, title]);

  // Страховка на случай потерянного события: спрашиваем бэкенд, что синхронизируется.
  useEffect(() => {
    let mounted = true;
    let wasActive = false;
    const check = async () => {
      try {
        const response: any = await call("get_sync_state", {});
        if (!mounted) return;
        const active = (response?.active || []).some((item: any) => matchesGame(item?.game));
        setServerBusy(active);
        if (wasActive && !active) load();
        wasActive = active;
      } catch {
        // Бэкенд может быть занят — просто повторим на следующем тике.
      }
    };
    check();
    const timer = setInterval(check, 2000);
    return () => {
      mounted = false;
      clearInterval(timer);
    };
  }, [appId, title]);

  statusRef.current = status;

  if (!checked || !status) {
    return null;
  }

  const isSyncing = busy || autoBusy || serverBusy;

  const recent = Boolean(
    status.last_sync && Date.now() - new Date(status.last_sync).getTime() < 24 * 3600 * 1000
  );

  const syncNow = async () => {
    if (isSyncing) return;
    setBusy(true);
    setMessage(null);
    try {
      const response: any = await call("sync_game", { game_name: status.game });
      if (response?.success) {
        toaster.toast({
          title: "GameSync",
          body: `Сохранено: ${status.game}`,
          subtext: "Ручная синхронизация",
        } as any);
      } else {
        const error = response?.error || "Не удалось синхронизировать";
        setMessage(error);
        toaster.toast({
          title: "GameSync",
          body: `Ошибка синхронизации: ${status.game}`,
          subtext: String(error).slice(0, 160),
        } as any);
      }
      await load();
    } catch (error: any) {
      setMessage(error?.message || String(error));
      toaster.toast({
        title: "GameSync",
        body: `Ошибка синхронизации: ${status.game}`,
        subtext: String(error?.message || error).slice(0, 160),
      } as any);
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

  const details = isSyncing
    ? autoBusy
      ? "Синхронизация сохранений после игры…"
      : "Синхронизация…"
    : [
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
      onClick={(event: any) => {
        event?.stopPropagation?.();
        openSettings();
      }}
      onTouchEnd={(event: any) => {
        event?.preventDefault?.();
        event?.stopPropagation?.();
        openSettings();
      }}
      style={{
        display: "flex",
        alignItems: "center",
        gap: "10px",
        width: "100%",
        boxSizing: "border-box",
        padding: "8px 12px",
        margin: "0 0 8px",
        cursor: "pointer",
        touchAction: "manipulation",
        background: "rgba(20, 32, 40, 0.72)",
        borderLeft: "3px solid #66c0f4",
        borderRadius: "4px",
        boxShadow: isSyncing ? "0 0 0 1px rgba(102,192,244,0.45), 0 0 18px rgba(102,192,244,0.18)" : "none",
        transition: "box-shadow 0.25s ease",
      }}
    >
      <Focusable
        onClick={(event: any) => {
          event?.stopPropagation?.();
          void syncNow();
        }}
        onTouchEnd={(event: any) => {
          event?.preventDefault?.();
          event?.stopPropagation?.();
          void syncNow();
        }}
        onActivate={syncNow}
        title={isSyncing ? "Синхронизация…" : recent ? "Синхронизировать ещё раз" : "Синхронизировать игру"}
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
        {isSyncing ? <Spinner /> : <FaCloud style={{ fontSize: "19px", color: "#7fd0ff" }} />}
        {recent && !isSyncing && (
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

      <IconAction title={isSyncing ? "Синхронизация…" : "Синхронизировать"} onClick={syncNow} disabled={isSyncing}>
        {isSyncing ? <Spinner /> : <FaSyncAlt style={{ fontSize: "15px", color: "#bcd8ea" }} />}
      </IconAction>
      <IconAction title="Настроить пути сохранений" onClick={openSettings}>
        <FaCog style={{ fontSize: "15px", color: "#bcd8ea" }} />
      </IconAction>
    </Focusable>
  );
}

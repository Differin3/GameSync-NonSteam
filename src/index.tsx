import { call, definePlugin, routerHook, toaster } from "@decky/api";
import { staticClasses } from "@decky/ui";
import type { ReactNode } from "react";
import {
  FaCloud,
  FaCloudDownloadAlt,
  FaCloudUploadAlt,
  FaExclamationTriangle,
  FaTrash,
  FaUndoAlt,
} from "react-icons/fa";
import { GameSyncMain } from "./components/GameSyncMain";
import { SettingsPage } from "./components/SettingsPage";
import { installAppDetailsPatch } from "./patches/appDetailsPatch";

const formatSize = (bytes: number): string => {
  if (!bytes || bytes <= 0) return "";
  const units = ["Б", "КБ", "МБ", "ГБ"];
  const index = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
  return ` · ${Math.round((bytes / Math.pow(1024, index)) * 10) / 10} ${units[index]}`;
};

const notify = (body: ReactNode, options: { icon?: ReactNode; subtext?: ReactNode; title?: string } = {}) => {
  try {
    toaster.toast({
      title: options.title || "GameSync",
      body,
      icon: options.icon,
      subtext: options.subtext,
      duration: 7000,
    } as any);
  } catch (error) {
    console.error("[GameSync] toast failed", error);
  }
};

const handleEvent = (event: string, data: any) => {
  switch (event) {
    case "gamesync_auto_saved": {
      const game = data?.game || "игра";
      const size = formatSize(Number(data?.size || 0));
      notify(`Сохранено: ${game}${size}`, {
        icon: <FaCloudUploadAlt style={{ color: "#5fd88a" }} />,
        subtext: "Автосинхронизация после выхода из игры",
      });
      break;
    }
    case "gamesync_sync_started": {
      if (data?.source !== "auto") return;
      notify(`Синхронизация сохранений: ${data?.game || "игра"}`, {
        icon: <FaCloudUploadAlt style={{ color: "#66c0f4" }} />,
        subtext: "Игра закрыта, сохраняем в облако",
      });
      break;
    }
    case "gamesync_sync_finished": {
      if (data?.success) return;
      const error = String(data?.error || "").slice(0, 160);
      notify(`Не удалось синхронизировать: ${data?.game || "игра"}`, {
        icon: <FaExclamationTriangle style={{ color: "#f0a0a0" }} />,
        subtext: error || "Проверьте хранилище в настройках",
      });
      break;
    }
    case "gamesync_pull_started": {
      notify(`Загружаем облачные сейвы: ${data?.game || "игра"}`, {
        icon: <FaCloudDownloadAlt style={{ color: "#66c0f4" }} />,
        subtext: "Перед запуском игры",
      });
      break;
    }
    case "gamesync_pull_done": {
      const game = data?.game || "игра";
      if (data?.success) {
        const files = Number(data?.files || 0);
        notify(`Сохранения загружены: ${game}`, {
          icon: <FaCloudDownloadAlt style={{ color: "#5fd88a" }} />,
          subtext: files > 0 ? `Восстановлено файлов: ${files}` : undefined,
        });
      } else if (data?.error) {
        notify(`Не удалось загрузить сейвы: ${game}`, {
          icon: <FaExclamationTriangle style={{ color: "#f0a0a0" }} />,
          subtext: String(data.error).slice(0, 160),
        });
      }
      break;
    }
    case "gamesync_restore_done": {
      if (!data?.success) return;
      const game = data?.game || "игра";
      const files = Number(data?.files || 0);
      const quarantined = Number(data?.quarantined || 0);
      notify(`Восстановлено: ${game}`, {
        icon: <FaUndoAlt style={{ color: "#5fd88a" }} />,
        subtext:
          quarantined > 0
            ? `${files} файлов, ${quarantined} перемещено в резерв`
            : `${files} файлов`,
      });
      break;
    }
    case "gamesync_backup_deleted": {
      notify(`Версия удалена: ${data?.game || "игра"}`, {
        icon: <FaTrash style={{ color: "#bcd8ea" }} />,
        subtext: "Файл и запись удалены из облака",
      });
      break;
    }
    case "gamesync_restore_started": {
      const created = data?.created ? new Date(data.created).toLocaleString("ru-RU") : "";
      notify(`Восстанавливаем: ${data?.game || "игра"}`, {
        icon: <FaUndoAlt style={{ color: "#66c0f4" }} />,
        subtext: created ? `Версия от ${created}` : "Скачиваем бэкап из облака",
      });
      break;
    }
    case "gamesync_restore_failed": {
      notify(`Не удалось восстановить: ${data?.game || "игра"}`, {
        icon: <FaExclamationTriangle style={{ color: "#f0a0a0" }} />,
        subtext: String(data?.error || "").slice(0, 160),
      });
      break;
    }
    case "gamesync_backup_delete_failed": {
      notify(`Не удалось удалить версию: ${data?.game || "игра"}`, {
        icon: <FaExclamationTriangle style={{ color: "#f0a0a0" }} />,
        subtext: String(data?.error || "").slice(0, 160),
      });
      break;
    }
    case "gamesync_sync_all_done": {
      if (data?.success) {
        const ok = Number(data?.ok || 0);
        const failed = Number(data?.failed || 0);
        notify("Синхронизация завершена", {
          icon: <FaCloudUploadAlt style={{ color: failed ? "#f0c674" : "#5fd88a" }} />,
          subtext: failed ? `${ok} игр, ${failed} с ошибкой` : `${ok} игр синхронизировано`,
        });
      } else {
        notify("Синхронизация всех игр не удалась", {
          icon: <FaExclamationTriangle style={{ color: "#f0a0a0" }} />,
          subtext: String(data?.error || "").slice(0, 160),
        });
      }
      break;
    }
    default:
      break;
  }
};

let notificationsStarted = false;

/**
 * Уведомления забираются опросом get_notifications: события decky.emit
 * из Python-бэкенда не всегда доходят до слушателей фронтенда.
 */
const startNotifications = () => {
  if (notificationsStarted) return;
  notificationsStarted = true;

  let lastId = -1;
  const poll = async () => {
    try {
      const response: any = await call("get_notifications", {
        after_id: lastId < 0 ? 0 : lastId,
      });
      if (!response?.success) return;
      if (lastId < 0) {
        // Первый опрос: запоминаем позицию, старые уведомления не показываем.
        lastId = Number(response.last_id || 0);
        return;
      }
      lastId = Number(response.last_id || lastId);
      for (const item of response.items || []) {
        handleEvent(String(item?.event || ""), item?.data || {});
      }
    } catch (error) {
      // Бэкенд может быть занят синхронизацией — повторим на следующем тике.
    }
  };

  poll();
  setInterval(poll, 1500);
};

export default definePlugin(() => {
  startNotifications();

  // Строка статуса на странице non-Steam игры в библиотеке Steam
  const removeAppDetailsPatch = installAppDetailsPatch();

  // Регистрация маршрута для полноразмерной страницы настроек
  routerHook.addRoute("/gamesync-settings", () => {
    return <SettingsPage />;
  });

  return {
    name: "GameSync",
    titleView: (
      <div className={staticClasses.Title}>
        GameSync
        <span style={{ fontSize: "11px", opacity: 0.6, marginLeft: "8px" }}>PortProton</span>
      </div>
    ),
    content: (
      <div>
        <GameSyncMain />
      </div>
    ),
    icon: <FaCloud />,
    onDismount() {
      try {
        removeAppDetailsPatch();
      } catch (error) {
        console.error("[GameSync] failed to remove app details patch", error);
      }
      routerHook.removeRoute("/gamesync-settings");
    },
  };
});

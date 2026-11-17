import { addEventListener, definePlugin, routerHook, toaster } from "@decky/api";
import { staticClasses } from "@decky/ui";
import { FaCloud } from "react-icons/fa";
import { GameSyncMain } from "./components/GameSyncMain";
import { SettingsPage } from "./components/SettingsPage";
import { installAppDetailsPatch } from "./patches/appDetailsPatch";

const formatSize = (bytes: number): string => {
  if (!bytes || bytes <= 0) return "";
  const units = ["Б", "КБ", "МБ", "ГБ"];
  const index = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
  return ` · ${Math.round((bytes / Math.pow(1024, index)) * 10) / 10} ${units[index]}`;
};

// Тост после автосинхронизации по выходу из игры.
import type { ReactNode } from "react";
import { FaCloudDownloadAlt, FaCloudUploadAlt, FaExclamationTriangle, FaTrash, FaUndoAlt } from "react-icons/fa";

const notify = (body: ReactNode, options: { icon?: ReactNode; subtext?: ReactNode; title?: string } = {}) => {
  try {
    toaster.toast({
      title: options.title || "GameSync",
      body,
      icon: options.icon,
      subtext: options.subtext,
    });
  } catch (error) {
    console.error("[GameSync] toast failed", error);
  }
};

addEventListener("gamesync_auto_saved", (data: any) => {
  const game = data?.game || "игра";
  const size = formatSize(Number(data?.size || 0));
  notify(`Сохранено: ${game}${size}`, {
    icon: <FaCloudUploadAlt style={{ color: "#5fd88a" }} />,
    subtext: "Автосинхронизация после выхода из игры",
  });
});

addEventListener("gamesync_sync_started", (data: any) => {
  if (data?.source !== "auto") return;
  notify(`Синхронизация сохранений: ${data?.game || "игра"}`, {
    icon: <FaCloudUploadAlt style={{ color: "#66c0f4" }} />,
    subtext: "Игра закрыта, сохраняем в облако",
  });
});

addEventListener("gamesync_sync_finished", (data: any) => {
  if (data?.success) return;
  const error = String(data?.error || "").slice(0, 160);
  notify(`Не удалось синхронизировать: ${data?.game || "игра"}`, {
    icon: <FaExclamationTriangle style={{ color: "#f0a0a0" }} />,
    subtext: error || "Проверьте хранилище в настройках",
  });
});

addEventListener("gamesync_pull_started", (data: any) => {
  notify(`Загружаем облачные сейвы: ${data?.game || "игра"}`, {
    icon: <FaCloudDownloadAlt style={{ color: "#66c0f4" }} />,
    subtext: "Перед запуском игры",
  });
});

addEventListener("gamesync_pull_done", (data: any) => {
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
});

addEventListener("gamesync_restore_done", (data: any) => {
  const game = data?.game || "игра";
  if (!data?.success) return;
  const files = Number(data?.files || 0);
  const quarantined = Number(data?.quarantined || 0);
  notify(`Восстановлено: ${game}`, {
    icon: <FaUndoAlt style={{ color: "#5fd88a" }} />,
    subtext: quarantined > 0
      ? `${files} файлов, ${quarantined} перемещено в резерв`
      : `${files} файлов`,
  });
});

addEventListener("gamesync_backup_deleted", (data: any) => {
  notify(`Версия удалена: ${data?.game || "игра"}`, {
    icon: <FaTrash style={{ color: "#bcd8ea" }} />,
    subtext: "Файл и запись удалены из облака",
  });
});

export default definePlugin(() => {
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

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
addEventListener("gamesync_auto_saved", (data: any) => {
  try {
    const game = data?.game || "игра";
    const size = formatSize(Number(data?.size || 0));
    toaster.toast({
      title: "GameSync",
      body: `Сохранено: ${game}${size}`,
    });
  } catch (error) {
    console.error("[GameSync] toast failed", error);
  }
});

addEventListener("gamesync_sync_started", (data: any) => {
  try {
    if (data?.source !== "auto") return;
    const game = data?.game || "игра";
    toaster.toast({ title: "GameSync", body: `Синхронизация сохранений: ${game}` });
  } catch (error) {
    console.error("[GameSync] sync-start toast failed", error);
  }
});

addEventListener("gamesync_pull_done", (data: any) => {
  try {
    const game = data?.game || "игра";
    if (data?.success) {
      toaster.toast({ title: "GameSync", body: `Сохранения загружены: ${game}` });
    } else if (data?.error) {
      toaster.toast({ title: "GameSync", body: `Не удалось загрузить сейвы: ${game}` });
    }
  } catch (error) {
    console.error("[GameSync] pull toast failed", error);
  }
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

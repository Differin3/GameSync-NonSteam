import { definePlugin, routerHook } from "@decky/api";
import { staticClasses } from "@decky/ui";
import { FaCloud } from "react-icons/fa";
import { GameSyncMain } from "./components/GameSyncMain";
import { SettingsPage } from "./components/SettingsPage";
import { installAppDetailsPatch } from "./patches/appDetailsPatch";

export default definePlugin(() => {
  // Строка статуса на странице non-Steam игры в библиотеке Steam
  const removeAppDetailsPatch = installAppDetailsPatch();

  // Регистрация маршрута для полноразмерной страницы настроек
  routerHook.addRoute("/gamesync-settings", () => {
    return <SettingsPage />;
  });

  return {
    name: "GameSync NonSteam",
    titleView: <div className={staticClasses.Title}>GameSync</div>,
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

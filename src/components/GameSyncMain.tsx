import { useState, useEffect } from "react";
import { call } from "@decky/api";
import { ButtonItem, PanelSection, PanelSectionRow, staticClasses, Router } from "@decky/ui";
import { GameList } from "./GameList";
import { SyncedGamesList } from "./SyncedGamesList";

export function GameSyncMain() {
  const [status, setStatus] = useState<string>("Проверка подключения...");
  const [connected, setConnected] = useState<boolean>(false);

  useEffect(() => {
    // Тестовый вызов Python-метода
    call("get_test", {})
      .then((result: any) => {
        if (result && result.success) {
          setStatus(result.status || result.message || "Подключено");
          setConnected(true);
        } else {
          const errorMsg = result?.error || result?.message || "Неизвестная ошибка";
          setStatus(`Ошибка: ${errorMsg}`);
          setConnected(false);
          console.error("Backend error:", result);
        }
      })
      .catch((error) => {
        const errorMsg = error?.message || error?.toString() || String(error);
        setStatus(`Ошибка подключения: ${errorMsg}`);
        setConnected(false);
        console.error("Connection error:", error);
      });
  }, []);

  return (
    <div>
      <PanelSection>
        <PanelSectionRow>
          <div className={staticClasses.Title}>Статус подключения</div>
        </PanelSectionRow>
        <PanelSectionRow>
          <div style={{ 
            fontSize: "14px", 
            color: connected ? "#0f0" : "#f00",
            padding: "8px",
            backgroundColor: connected ? "rgba(0, 255, 0, 0.1)" : "rgba(255, 0, 0, 0.1)",
            borderRadius: "4px"
          }}>
            {status}
          </div>
        </PanelSectionRow>
        <PanelSectionRow>
          <ButtonItem
            layout="below"
            onClick={() => {
              Router.CloseSideMenus();
              Router.Navigate("/gamesync-settings");
            }}
          >
            Настройки
          </ButtonItem>
        </PanelSectionRow>
      </PanelSection>
      {connected && (
        <>
          <SyncedGamesList />
          <GameList />
        </>
      )}
    </div>
  );
}
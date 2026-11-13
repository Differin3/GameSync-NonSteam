import { useEffect, useState } from "react";
import { call } from "@decky/api";
import { ButtonItem, Field, PanelSection, PanelSectionRow, Router } from "@decky/ui";
import { FaCloud, FaCog } from "react-icons/fa";
import { GameList } from "./GameList";
import { SyncedGamesList } from "./SyncedGamesList";
import { Hint, Loading } from "./ui";

export function GameSyncMain() {
  const [status, setStatus] = useState<string>("Проверка подключения...");
  const [connected, setConnected] = useState<boolean>(false);
  const [checking, setChecking] = useState<boolean>(true);

  useEffect(() => {
    call("get_test", {})
      .then((result: any) => {
        if (result && result.success) {
          setConnected(true);
          setStatus("Плагин готов к работе");
        } else {
          setConnected(false);
          setStatus(result?.error || result?.message || "Неизвестная ошибка");
        }
      })
      .catch((error) => {
        setConnected(false);
        setStatus(String(error?.message || error));
      })
      .finally(() => setChecking(false));
  }, []);

  const openSettings = () => {
    Router.CloseSideMenus();
    Router.Navigate("/gamesync-settings");
  };

  return (
    <div>
      <PanelSection>
        <PanelSectionRow>
          <Field
            icon={<FaCloud style={{ color: "#66c0f4" }} />}
            label="GameSync"
            description={checking ? "Проверка связи…" : `${connected ? "подключено" : "нет связи"} · ${status}`}
          />
        </PanelSectionRow>
        <PanelSectionRow>
          <ButtonItem layout="below" icon={<FaCog />} onClick={openSettings}>
            Настройки и пути сохранений
          </ButtonItem>
        </PanelSectionRow>
      </PanelSection>

      {checking && !connected && <Loading text="Проверка подключения..." />}

      {connected && (
        <>
          <SyncedGamesList />
          <GameList />
        </>
      )}

      {!checking && !connected && (
        <PanelSection>
          <PanelSectionRow>
            <Hint>Проверьте настройки хранилища и перезапустите плагин из Decky.</Hint>
          </PanelSectionRow>
        </PanelSection>
      )}
    </div>
  );
}

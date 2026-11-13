import { useEffect, useState } from "react";
import type { CSSProperties } from "react";
import { call } from "@decky/api";
import { ButtonItem, PanelSection, PanelSectionRow, Router } from "@decky/ui";
import { FaCloud, FaCog } from "react-icons/fa";
import { GameList } from "./GameList";
import { SyncedGamesList } from "./SyncedGamesList";
import { Badge, Hint, Loading } from "./ui";
import { colors } from "../utils/theme";

const heroCard: CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: "10px",
  width: "100%",
  boxSizing: "border-box",
  padding: "12px",
  borderRadius: "10px",
  background: "linear-gradient(135deg, rgba(30, 48, 62, 0.9), rgba(18, 26, 33, 0.9))",
  border: "1px solid rgba(102, 192, 244, 0.18)",
};

const iconBubble: CSSProperties = {
  width: "34px",
  height: "34px",
  borderRadius: "9px",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  color: "#fff",
  background: "linear-gradient(145deg, #1a9fff, #0b5fa5)",
  boxShadow: "0 4px 14px rgba(26, 159, 255, 0.35)",
  flex: "0 0 auto",
};

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
          <div style={heroCard}>
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <div style={iconBubble}>
                <FaCloud size={16} />
              </div>
              <div style={{ flex: "1 1 auto", minWidth: 0 }}>
                <div style={{ fontSize: "14px", fontWeight: 600, color: colors.text }}>GameSync</div>
                <div style={{ fontSize: "11px", color: colors.muted, marginTop: "2px" }}>
                  {checking ? "Проверка связи…" : status}
                </div>
              </div>
              <Badge tone={connected ? "success" : "error"}>{connected ? "подключено" : "нет связи"}</Badge>
            </div>
            <ButtonItem layout="below" onClick={openSettings}>
              <span style={{ display: "inline-flex", alignItems: "center", gap: "8px" }}>
                <FaCog />
                Настройки и пути сохранений
              </span>
            </ButtonItem>
          </div>
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

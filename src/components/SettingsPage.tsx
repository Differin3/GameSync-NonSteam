import { useEffect, useState } from "react";
import { Focusable } from "@decky/ui";
import { FaChartBar, FaCloudDownloadAlt, FaFolderOpen, FaSlidersH } from "react-icons/fa";
import type { ReactNode } from "react";
import { Settings } from "./Settings";
import { GamePathsTab } from "./GamePathsTab";
import { BackupsTab } from "./BackupsTab";
import { StatsTab } from "./StatsTab";
import { Icon } from "./ui";

interface TabDef {
  id: string;
  title: string;
  icon: ReactNode;
  content: ReactNode;
}

const TABS: TabDef[] = [
  { id: "main", title: "Основные", icon: <FaSlidersH />, content: <Settings /> },
  { id: "game_paths", title: "Пути игр", icon: <FaFolderOpen />, content: <GamePathsTab /> },
  { id: "backups", title: "Бэкапы", icon: <FaCloudDownloadAlt />, content: <BackupsTab /> },
  { id: "stats", title: "Статистика", icon: <FaChartBar />, content: <StatsTab /> },
];

export function SettingsPage() {
  const [currentTab, setCurrentTab] = useState<string>("main");

  useEffect(() => {
    const handleTabSwitch = (event: CustomEvent) => {
      const tab = event.detail;
      if (TABS.some((item) => item.id === tab)) {
        setCurrentTab(tab);
      }
    };
    window.addEventListener("gamesync-switch-tab" as any, handleTabSwitch as EventListener);
    return () => {
      window.removeEventListener("gamesync-switch-tab" as any, handleTabSwitch as EventListener);
    };
  }, []);

  const active = TABS.find((item) => item.id === currentTab) || TABS[0];

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        height: "100vh",
        boxSizing: "border-box",
        paddingTop: "var(--basicui-header-height, 50px)",
        background: "transparent",
      }}
    >
      <Focusable
        flow-children="row"
        style={{
          display: "flex",
          alignItems: "flex-end",
          justifyContent: "center",
          gap: "4px",
          padding: "0 12px",
          height: "52px",
          flex: "0 0 auto",
          borderBottom: "1px solid rgba(255,255,255,0.06)",
        }}
      >
        {TABS.map((tab) => {
          const isActive = tab.id === active.id;
          return (
            <Focusable
              key={tab.id}
              autoFocus={isActive}
              onClick={() => setCurrentTab(tab.id)}
              onActivate={() => setCurrentTab(tab.id)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                padding: "9px 18px 10px",
                borderRadius: "4px 4px 0 0",
                fontSize: "13px",
                color: isActive ? "#ffffff" : "rgba(200,210,218,0.65)",
                background: isActive ? "rgba(255,255,255,0.07)" : "transparent",
                boxShadow: isActive ? "inset 0 -2px 0 #66c0f4" : "none",
                cursor: "pointer",
                userSelect: "none",
              }}
            >
              <Icon>{tab.icon}</Icon>
              {tab.title}
            </Focusable>
          );
        })}
      </Focusable>

      <Focusable
        flow-children="column"
        style={{ flex: "1 1 auto", overflowY: "auto", overflowX: "hidden", padding: "14px 24px 24px" }}
      >
        {active.content}
      </Focusable>
    </div>
  );
}

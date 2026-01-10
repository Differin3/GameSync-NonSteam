import { useState, useEffect } from "react";
import { call } from "@decky/api";
import { PanelSection, PanelSectionRow, Spinner, ButtonItem } from "@decky/ui";
import { SyncStats } from "../utils/types";

const statBoxStyle = {
  background: "rgba(255, 255, 255, 0.05)",
  borderRadius: "4px",
  padding: "8px 12px",
  fontSize: "12px",
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  marginBottom: "6px",
};

const formatBytes = (bytes: number): string => {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + " " + sizes[i];
};

const formatDate = (isoString: string): string => {
  try {
    const date = new Date(isoString);
    return date.toLocaleString("ru-RU", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return isoString;
  }
};

export function StatsTab() {
  const [stats, setStats] = useState<SyncStats | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const loadStats = async () => {
    setLoading(true);
    setError(null);
    try {
      const result: any = await call("get_sync_stats", {});
      if (result.success && result.stats) {
        setStats(result.stats);
      } else {
        setError(result.error || "Ошибка загрузки статистики");
      }
    } catch (err) {
      setError(`Ошибка: ${err}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStats();
  }, []);

  if (loading) {
    return (
      <PanelSection>
        <PanelSectionRow>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <Spinner />
            <span>Загрузка статистики...</span>
          </div>
        </PanelSectionRow>
      </PanelSection>
    );
  }

  if (error) {
    return (
      <PanelSection>
        <PanelSectionRow>
          <div style={{ color: "red" }}>{error}</div>
        </PanelSectionRow>
        <PanelSectionRow>
          <ButtonItem layout="below" onClick={loadStats}>
            Повторить
          </ButtonItem>
        </PanelSectionRow>
      </PanelSection>
    );
  }

  if (!stats) {
    return (
      <PanelSection>
        <PanelSectionRow>
          <div style={{ color: "#888" }}>Нет данных для отображения</div>
        </PanelSectionRow>
      </PanelSection>
    );
  }

  return (
    <div style={{ padding: "4px" }}>
      <PanelSection title="Статистика синхронизаций">
        <PanelSectionRow>
          <div style={{ fontWeight: "bold", marginBottom: "8px", fontSize: "13px" }}>
            Общая статистика
          </div>
        </PanelSectionRow>

        <PanelSectionRow>
          <div style={statBoxStyle}>
            <span>Всего синхронизаций</span>
            <span style={{ fontWeight: "bold" }}>{stats.totalSyncs.toLocaleString()}</span>
          </div>
        </PanelSectionRow>

        <PanelSectionRow>
          <div style={statBoxStyle}>
            <span>Игр синхронизировано</span>
            <span style={{ fontWeight: "bold" }}>{stats.gamesCount.toLocaleString()}</span>
          </div>
        </PanelSectionRow>

        {stats.lastSync && (
          <PanelSectionRow>
            <div style={statBoxStyle}>
              <span>Последняя синхронизация</span>
              <span style={{ fontSize: "11px" }}>{formatDate(stats.lastSync)}</span>
            </div>
          </PanelSectionRow>
        )}

        {stats.totalSize && stats.totalSize > 0 && (
          <PanelSectionRow>
            <div style={statBoxStyle}>
              <span>Общий размер сохранений</span>
              <span style={{ fontWeight: "bold" }}>{formatBytes(stats.totalSize)}</span>
            </div>
          </PanelSectionRow>
        )}

        {stats.syncsByDate && stats.syncsByDate.length > 0 && (
          <>
            <PanelSectionRow>
              <div style={{ fontWeight: "bold", marginTop: "12px", marginBottom: "8px", fontSize: "13px" }}>
                Синхронизации по датам
              </div>
            </PanelSectionRow>
            {stats.syncsByDate.slice(0, 10).map((item, index) => (
              <PanelSectionRow key={index}>
                <div style={statBoxStyle}>
                  <span>{new Date(item.date).toLocaleDateString("ru-RU")}</span>
                  <span style={{ fontWeight: "bold" }}>{item.count}</span>
                </div>
              </PanelSectionRow>
            ))}
          </>
        )}
      </PanelSection>
    </div>
  );
}

import { useEffect, useState } from "react";
import { call } from "@decky/api";
import { PanelSection, PanelSectionRow } from "@decky/ui";
import { FaChartBar, FaClock, FaCloudDownloadAlt, FaGamepad, FaHistory } from "react-icons/fa";
import type { IconType } from "react-icons";
import { SyncStats } from "../utils/types";
import { EmptyState, ErrorState, Loading } from "./ui";
import { card, colors } from "../utils/theme";

const formatBytes = (bytes: number): string => {
  if (!bytes) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.min(Math.floor(Math.log(bytes) / Math.log(k)), sizes.length - 1);
  return `${Math.round((bytes / Math.pow(k, i)) * 100) / 100} ${sizes[i]}`;
};

const formatDate = (isoString?: string): string => {
  if (!isoString) return "—";
  try {
    return new Date(isoString).toLocaleString("ru-RU", {
      day: "2-digit",
      month: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return isoString;
  }
};

function StatCard({ icon: Icon, label, value, sub }: { icon: IconType; label: string; value: string; sub?: string }) {
  return (
    <div
      style={{
        flex: "1 1 0",
        minWidth: "150px",
        background: "rgba(255,255,255,0.035)",
        border: "1px solid rgba(255,255,255,0.06)",
        borderRadius: "8px",
        padding: "12px 14px",
        boxSizing: "border-box",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "7px",
          fontSize: "10px",
          letterSpacing: "0.7px",
          textTransform: "uppercase",
          color: colors.dim,
          fontWeight: 600,
        }}
      >
        <Icon style={{ color: "#66c0f4" }} />
        {label}
      </div>
      <div style={{ fontSize: "24px", fontWeight: 600, marginTop: "8px", color: colors.text }}>{value}</div>
      {sub && <div style={{ fontSize: "10.5px", color: colors.dim, marginTop: "3px" }}>{sub}</div>}
    </div>
  );
}

export function StatsTab() {
  const [stats, setStats] = useState<SyncStats | null>(null);
  const [recent, setRecent] = useState<{ game: string; created?: string; size?: number }[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const loadStats = async () => {
    setLoading(true);
    setError(null);
    try {
      const result: any = await call("get_sync_stats", {});
      if (!result.success || !result.stats) {
        setError(result.error || "Ошибка загрузки статистики");
        return;
      }
      setStats(result.stats);

      try {
        const backups: any = await call("get_backups", {});
        const flat: { game: string; created?: string; size?: number }[] = [];
        for (const group of backups?.games || []) {
          for (const entry of group.entries || []) {
            flat.push({ game: group.game, created: entry.created, size: entry.size });
          }
        }
        flat.sort((a, b) => String(b.created || "").localeCompare(String(a.created || "")));
        setRecent(flat.slice(0, 4));
      } catch (err) {
        console.error("Failed to load recent backups", err);
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

  if (loading) return <Loading text="Загрузка статистики..." />;
  if (error) return <ErrorState text={error} onRetry={loadStats} />;
  if (!stats) return <EmptyState text="Нет данных для отображения" />;

  const maxCount = Math.max(1, ...(stats.syncsByDate || []).map((item) => item.count));

  return (
    <div>
      <PanelSection>
        <PanelSectionRow>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "10px", width: "100%" }}>
            <StatCard icon={FaChartBar} label="Всего синхронизаций" value={String(stats.totalSyncs)} sub="за всё время" />
            <StatCard icon={FaGamepad} label="Игр" value={String(stats.gamesCount)} sub="в облаке" />
            <StatCard icon={FaCloudDownloadAlt} label="Общий размер" value={formatBytes(stats.totalSize || 0)} sub="в облаке" />
            <StatCard icon={FaClock} label="Последняя" value={formatDate(stats.lastSync).split(",")[1]?.trim() || "—"} sub={formatDate(stats.lastSync).split(",")[0]} />
          </div>
        </PanelSectionRow>
      </PanelSection>

      <PanelSection title="Синхронизации по датам">
        <PanelSectionRow>
          <div style={{ ...card, display: "flex", flexDirection: "column", gap: "8px" }}>
            {(stats.syncsByDate || []).slice(0, 7).map((item) => (
              <div key={item.date} style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <span style={{ width: "86px", fontSize: "10.5px", color: colors.muted }}>
                  {new Date(item.date).toLocaleDateString("ru-RU")}
                </span>
                <div style={{ flex: 1, height: "8px", borderRadius: "4px", background: "rgba(255,255,255,0.06)" }}>
                  <div
                    style={{
                      width: `${Math.max(4, Math.round((item.count / maxCount) * 100))}%`,
                      height: "100%",
                      borderRadius: "4px",
                      background: "linear-gradient(90deg,#1a9fff,#3fb6ff)",
                    }}
                  />
                </div>
                <span style={{ fontSize: "10px", color: colors.dim, width: "18px", textAlign: "right" }}>{item.count}</span>
              </div>
            ))}
          </div>
        </PanelSectionRow>
      </PanelSection>

      {recent.length > 0 && (
        <PanelSection title="Последние синхронизации">
          <PanelSectionRow>
            <div style={{ ...card, display: "flex", flexDirection: "column", gap: "6px" }}>
              {recent.map((entry, index) => (
                <div
                  key={`${entry.game}-${index}`}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "baseline",
                    gap: "10px",
                    paddingTop: index > 0 ? "6px" : 0,
                    borderTop: index > 0 ? "1px solid rgba(255,255,255,0.05)" : "none",
                  }}
                >
                  <span style={{ display: "inline-flex", alignItems: "center", gap: "7px", fontSize: "12px", color: colors.text }}>
                    <FaHistory style={{ color: colors.dim }} />
                    {entry.game}
                  </span>
                  <span style={{ fontSize: "10.5px", color: colors.dim }}>
                    {formatDate(entry.created)}
                    {entry.size ? ` · ${formatBytes(entry.size)}` : ""}
                  </span>
                </div>
              ))}
            </div>
          </PanelSectionRow>
        </PanelSection>
      )}
    </div>
  );
}

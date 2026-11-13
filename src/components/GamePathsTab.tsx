import { useEffect, useState } from "react";
import type { CSSProperties } from "react";
import { call } from "@decky/api";
import { PanelSection, PanelSectionRow, TextField } from "@decky/ui";
import { FaBan, FaCheck, FaEdit, FaFolderOpen, FaPlus, FaRedo, FaTimes, FaTrash } from "react-icons/fa";
import { GameInfo } from "../utils/types";
import { loadSettings } from "../utils/Settings";
import { Badge, EmptyState, ErrorState, Loading, StatusMessage } from "./ui";
import { ActionButton } from "./ui";
import { card, colors, dimText } from "../utils/theme";

const pathLine: CSSProperties = {
  fontFamily: "Consolas, 'Cascadia Mono', monospace",
  fontSize: "11px",
  color: "#a9bcc7",
  whiteSpace: "nowrap",
  overflow: "hidden",
  textOverflow: "ellipsis",
  flex: "1 1 auto",
  minWidth: 0,
};

const sourceLabel = (source: string): string => {
  switch (source) {
    case "known":
      return "база";
    case "learned":
      return "изучено";
    case "heuristic":
      return "поиск";
    default:
      return source;
  }
};

export function GamePathsTab() {
  const [games, setGames] = useState<GameInfo[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [editingGame, setEditingGame] = useState<string | null>(null);
  const [editingPathIndex, setEditingPathIndex] = useState<number | null>(null);
  const [editingPathValue, setEditingPathValue] = useState<string>("");
  const [newPath, setNewPath] = useState<string>("");
  const [validating, setValidating] = useState<boolean>(false);
  const [pathValidationResult, setPathValidationResult] = useState<string | null>(null);

  const loadGames = async (forceRefresh: boolean = false) => {
    setLoading(true);
    setError(null);
    try {
      const result: any = await call("scan_games", { force_refresh: forceRefresh });
      if (result.success && result.games) {
        setGames(result.games);
      } else {
        setError(result.error || "Ошибка загрузки игр");
      }
    } catch (err) {
      setError(`Ошибка: ${err}`);
    } finally {
      setLoading(false);
    }
  };

  const persistPaths = async (game: GameInfo, savePaths: string[], excludePaths?: string[]): Promise<boolean> => {
    try {
      const payload: any = { game_name: game.name, save_paths: savePaths };
      if (excludePaths !== undefined) payload.exclude_paths = excludePaths;
      const result: any = await call("update_game_paths", payload);
      if (result.success) {
        await loadGames();
        return true;
      }
      setPathValidationResult(`✗ ${result.error || "Ошибка сохранения"}`);
      return false;
    } catch (err) {
      setPathValidationResult(`✗ Ошибка: ${err}`);
      return false;
    }
  };

  const addPathToGame = async (game: GameInfo) => {
    if (!newPath.trim()) {
      setPathValidationResult("Введите путь");
      return;
    }
    setValidating(true);
    setPathValidationResult(null);
    try {
      const result: any = await call("validate_save_path", { path: newPath.trim() });
      if (result.success && result.path) {
        if (game.savePaths.includes(result.path)) {
          setPathValidationResult("Этот путь уже добавлен");
        } else if (await persistPaths(game, [...game.savePaths, result.path])) {
          setNewPath("");
        }
      } else {
        setPathValidationResult(`✗ ${result.error || "Ошибка валидации"}`);
      }
    } finally {
      setValidating(false);
    }
  };

  const addCandidateToGame = async (game: GameInfo, candidatePath: string) => {
    if (game.savePaths.includes(candidatePath)) return;
    await persistPaths(game, [...game.savePaths, candidatePath]);
  };

  const removePathFromGame = async (game: GameInfo, pathIndex: number) => {
    await persistPaths(game, game.savePaths.filter((_, i) => i !== pathIndex));
  };

  const excludePathFromGame = async (game: GameInfo, path: string) => {
    const updatedPaths = game.savePaths.filter((p) => p !== path);
    const updatedExcludes = Array.from(new Set([...(game.excludePaths || []), path]));
    await persistPaths(game, updatedPaths, updatedExcludes);
  };

  const saveEditedPath = async (game: GameInfo, pathIndex: number) => {
    if (!editingPathValue.trim()) {
      setPathValidationResult("Введите путь");
      return;
    }
    setValidating(true);
    setPathValidationResult(null);
    try {
      const result: any = await call("validate_save_path", { path: editingPathValue.trim() });
      if (result.success && result.path) {
        const updatedPaths = [...game.savePaths];
        updatedPaths[pathIndex] = result.path;
        if (await persistPaths(game, updatedPaths)) {
          setEditingPathIndex(null);
          setEditingPathValue("");
        }
      } else {
        setPathValidationResult(`✗ ${result.error || "Ошибка валидации"}`);
      }
    } finally {
      setValidating(false);
    }
  };

  useEffect(() => {
    loadGames();
  }, []);

  if (loading) return <Loading text="Загрузка игр..." />;
  if (error) return <ErrorState text={error} onRetry={loadGames} />;

  const settings = loadSettings();

  return (
    <div>
      <PanelSection>
        <PanelSectionRow>
          <div style={{ ...card, display: "flex", alignItems: "center", gap: "10px" }}>
            <FaFolderOpen style={{ color: "#66c0f4", fontSize: "18px", flex: "0 0 auto" }} />
            <div style={{ flex: "1 1 auto", minWidth: 0 }}>
              <div style={{ fontSize: "13px", fontWeight: 600, color: colors.text }}>Управление путями</div>
              <div style={{ fontSize: "11px", color: colors.dim, marginTop: "2px" }}>
                {games.length} игр · глобальных путей: {settings.defaultSavePaths.length}
              </div>
            </div>
            <div style={{ width: "176px", flex: "0 0 auto" }}>
              <ActionButton icon={<FaRedo />} onClick={() => loadGames(true)} disabled={loading}>
                Обновить
              </ActionButton>
            </div>
          </div>
        </PanelSectionRow>
      </PanelSection>

      {games.length === 0 && <EmptyState text="Игры не найдены" />}

      {games.map((game) => {
        const isEditing = editingGame === game.name;
        const candidates = (game.saveCandidates || []).filter((c) => !game.savePaths.includes(c.path));

        return (
          <PanelSection key={game.name}>
            <PanelSectionRow>
              <div style={{ ...card, display: "flex", flexDirection: "column", gap: "6px" }}>
                <div style={{ display: "flex", alignItems: "flex-start", gap: "10px" }}>
                  <div style={{ flex: "1 1 auto", minWidth: 0 }}>
                    <div style={{ fontSize: "14px", fontWeight: 600, color: colors.text }}>{game.name}</div>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: "6px", marginTop: "4px" }}>
                      <Badge tone={game.hasSaves ? "success" : "warning"}>
                        {game.hasSaves ? `${game.savePaths.length} путей` : "нет сохранений"}
                      </Badge>
                      {typeof game.steamAppId === "number" && <Badge>appid {game.steamAppId}</Badge>}
                      {(game.excludePaths?.length || 0) > 0 && (
                        <Badge tone="error">исключено {game.excludePaths!.length}</Badge>
                      )}
                      {game.sharedPrefix && <Badge tone="warning">общий префикс</Badge>}
                    </div>
                  </div>
                  <div style={{ width: "176px", flex: "0 0 auto" }}>
                    <ActionButton
                      icon={isEditing ? <FaTimes /> : <FaEdit />}
                      onClick={() => {
                        setEditingGame(isEditing ? null : game.name);
                        setEditingPathIndex(null);
                        setNewPath("");
                        setPathValidationResult(null);
                      }}
                    >
                      {isEditing ? "Готово" : "Изменить"}
                    </ActionButton>
                  </div>
                </div>

                {game.savePaths.length === 0 && <div style={dimText}>Пути не найдены — добавьте вручную.</div>}

                {game.savePaths.map((path, pathIndex) => {
                  const isEditingThisPath = isEditing && editingPathIndex === pathIndex;
                  if (isEditingThisPath) {
                    return (
                      <div key={pathIndex} style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                        <TextField label="Путь" value={editingPathValue} onChange={(e) => setEditingPathValue(e.target.value)} />
                        <div style={{ display: "flex", gap: "8px" }}>
                          <div style={{ flex: 1 }}>
                            <ActionButton
                              icon={<FaCheck />}
                              onClick={() => saveEditedPath(game, pathIndex)}
                              disabled={validating || !editingPathValue.trim()}
                            >
                              Сохранить
                            </ActionButton>
                          </div>
                          <div style={{ flex: 1 }}>
                            <ActionButton icon={<FaTimes />} onClick={() => setEditingPathIndex(null)}>
                              Отмена
                            </ActionButton>
                          </div>
                        </div>
                      </div>
                    );
                  }

                  return (
                    <div key={pathIndex} style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                        <div style={pathLine} title={path}>
                          {path}
                        </div>
                        {isEditing && (
                          <div style={{ display: "flex", flexDirection: "column", gap: "4px", width: "100%", marginTop: "2px" }}>
                            <ActionButton
                              icon={<FaEdit />}
                              onClick={() => {
                                setEditingPathIndex(pathIndex);
                                setEditingPathValue(path);
                              }}
                            >
                              Изменить путь
                            </ActionButton>
                            <ActionButton icon={<FaBan />} onClick={() => excludePathFromGame(game, path)}>
                              Исключить из синхронизации
                            </ActionButton>
                            <ActionButton icon={<FaTrash />} onClick={() => removePathFromGame(game, pathIndex)}>
                              Удалить путь
                            </ActionButton>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}

                {isEditing && candidates.length > 0 && (
                  <div style={{ display: "flex", flexDirection: "column", gap: "4px", paddingTop: "6px", borderTop: "1px solid rgba(255,255,255,0.06)" }}>
                    <div style={{ ...dimText, fontWeight: 600 }}>Кандидаты ({candidates.length})</div>
                    {candidates.map((candidate, ci) => (
                      <div key={ci} style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={pathLine} title={candidate.path}>
                            {candidate.path}
                          </div>
                          <div style={{ fontSize: "10px", color: colors.dim }}>
                            {sourceLabel(candidate.source)} · оценка {candidate.score}
                            {candidate.fileCount ? ` · файлов: ${candidate.fileCount}` : ""}
                          </div>
                        </div>
                        <div style={{ width: "176px", flex: "0 0 auto" }}>
                          <ActionButton icon={<FaPlus />} onClick={() => addCandidateToGame(game, candidate.path)}>
                            Добавить
                          </ActionButton>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {isEditing && (
                  <div style={{ display: "flex", flexDirection: "column", gap: "6px", paddingTop: "6px", borderTop: "1px solid rgba(255,255,255,0.06)" }}>
                    <TextField label="Добавить путь" value={newPath} onChange={(e) => setNewPath(e.target.value)} />
                    <ActionButton
                      icon={<FaPlus />}
                      onClick={() => addPathToGame(game)}
                      disabled={validating || !newPath.trim()}
                    >
                      {validating ? "Проверка…" : "Добавить путь"}
                    </ActionButton>
                  </div>
                )}

                {pathValidationResult && (
                  <StatusMessage tone={pathValidationResult.startsWith("✓") ? "success" : "error"}>
                    {pathValidationResult}
                  </StatusMessage>
                )}
              </div>
            </PanelSectionRow>
          </PanelSection>
        );
      })}
    </div>
  );
}

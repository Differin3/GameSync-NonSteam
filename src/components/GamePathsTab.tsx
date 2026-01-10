import { useState, useEffect } from "react";
import { call } from "@decky/api";
import { PanelSection, PanelSectionRow, ButtonItem, Spinner, TextField } from "@decky/ui";
import { GameInfo } from "../utils/types";
import { loadSettings } from "../utils/Settings";

export function GamePathsTab() {
  const [games, setGames] = useState<GameInfo[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [editingGame, setEditingGame] = useState<GameInfo | null>(null);
  const [editingPathIndex, setEditingPathIndex] = useState<number | null>(null);
  const [editingPathValue, setEditingPathValue] = useState<string>("");
  const [newPath, setNewPath] = useState<string>("");
  const [validating, setValidating] = useState<boolean>(false);
  const [pathValidationResult, setPathValidationResult] = useState<string | null>(null);

  const loadGames = async () => {
    setLoading(true);
    setError(null);
    try {
      const result: any = await call("scan_games", {});
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
        const normalizedPath = result.path;
        const updatedPaths = [...game.savePaths];
        
        if (!updatedPaths.includes(normalizedPath)) {
          updatedPaths.push(normalizedPath);
          
          const updateResult: any = await call("update_game_paths", {
            game_name: game.name,
            save_paths: updatedPaths
          });
          
          if (updateResult.success) {
            setNewPath("");
            setPathValidationResult(null);
            await loadGames();
          } else {
            setPathValidationResult(`✗ Ошибка сохранения: ${updateResult.error}`);
          }
        } else {
          setPathValidationResult("Этот путь уже добавлен");
        }
      } else {
        setPathValidationResult(`✗ ${result.error || "Ошибка валидации"}`);
      }
    } catch (error) {
      setPathValidationResult(`✗ Ошибка: ${error}`);
    } finally {
      setValidating(false);
    }
  };

  const removePathFromGame = async (game: GameInfo, pathIndex: number) => {
    const updatedPaths = game.savePaths.filter((_, i) => i !== pathIndex);
    
    try {
      const result: any = await call("update_game_paths", {
        game_name: game.name,
        save_paths: updatedPaths
      });
      
      if (result.success) {
        await loadGames();
      }
    } catch (error) {
      console.error("Error removing path:", error);
    }
  };

  const startEditingPath = (game: GameInfo, pathIndex: number) => {
    setEditingGame(game);
    setEditingPathIndex(pathIndex);
    setEditingPathValue(game.savePaths[pathIndex]);
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
        const normalizedPath = result.path;
        const updatedPaths = [...game.savePaths];
        updatedPaths[pathIndex] = normalizedPath;
        
        const updateResult: any = await call("update_game_paths", {
          game_name: game.name,
          save_paths: updatedPaths
        });
        
        if (updateResult.success) {
          setEditingPathIndex(null);
          setEditingPathValue("");
          setPathValidationResult(null);
          await loadGames();
        } else {
          setPathValidationResult(`✗ Ошибка сохранения: ${updateResult.error}`);
        }
      } else {
        setPathValidationResult(`✗ ${result.error || "Ошибка валидации"}`);
      }
    } catch (error) {
      setPathValidationResult(`✗ Ошибка: ${error}`);
    } finally {
      setValidating(false);
    }
  };

  const cancelEditingPath = () => {
    setEditingPathIndex(null);
    setEditingPathValue("");
    setPathValidationResult(null);
  };

  useEffect(() => {
    loadGames();
  }, []);

  if (loading) {
    return (
      <PanelSection>
        <PanelSectionRow>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <Spinner />
            <span>Загрузка игр...</span>
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
          <ButtonItem layout="below" onClick={loadGames}>
            Повторить
          </ButtonItem>
        </PanelSectionRow>
      </PanelSection>
    );
  }

  const settings = loadSettings();

  return (
    <div style={{ paddingTop: "var(--basicui-header-height, 40px)" }}>
      <PanelSection title={`Управление путями игр (${games.length})`}>
        <PanelSectionRow>
          <ButtonItem layout="below" onClick={loadGames} disabled={loading}>
            Обновить список
          </ButtonItem>
        </PanelSectionRow>
      </PanelSection>

      {games.map((game, index) => {
        const isEditing = editingGame?.name === game.name;

        return (
          <PanelSection key={index} title={game.name}>
            <PanelSectionRow>
              <div style={{ fontSize: "12px", color: "#888" }}>
                {game.hasSaves ? `Найдено путей: ${game.savePaths.length}` : "Сохранения не найдены"}
              </div>
            </PanelSectionRow>

            {settings.defaultSavePaths.length > 0 && (
              <PanelSectionRow>
                <div style={{ fontSize: "11px", color: "#aaa" }}>
                  Глобальные пути ({settings.defaultSavePaths.length}): {settings.defaultSavePaths.slice(0, 2).join(", ")}
                  {settings.defaultSavePaths.length > 2 && ` +${settings.defaultSavePaths.length - 2}`}
                </div>
              </PanelSectionRow>
            )}

            {game.savePaths.length > 0 && (
              <>
                <PanelSectionRow>
                  <div style={{ fontSize: "11px", color: "#888", fontWeight: "bold" }}>
                    Индивидуальные пути ({game.savePaths.length}):
                  </div>
                </PanelSectionRow>
                {game.savePaths.map((path, pathIndex) => {
                  const isEditingThisPath = editingGame?.name === game.name && editingPathIndex === pathIndex;
                  
                  return (
                    <PanelSectionRow key={pathIndex}>
                      {isEditingThisPath ? (
                        <div style={{ width: "100%" }}>
                          <TextField
                            label="Редактировать путь"
                            value={editingPathValue}
                            onChange={(e) => setEditingPathValue(e.target.value)}
                          />
                          <div style={{ display: "flex", gap: "8px", marginTop: "8px" }}>
                            <div style={{ flex: 1 }}>
                              <ButtonItem
                                layout="below"
                                onClick={() => saveEditedPath(game, pathIndex)}
                                disabled={validating || !editingPathValue.trim()}
                              >
                                {validating ? "Проверка..." : "Сохранить"}
                              </ButtonItem>
                            </div>
                            <div style={{ flex: 1 }}>
                              <ButtonItem
                                layout="below"
                                onClick={cancelEditingPath}
                              >
                                Отмена
                              </ButtonItem>
                            </div>
                          </div>
                          {pathValidationResult && (
                            <div
                              style={{
                                fontSize: "12px",
                                color: pathValidationResult.startsWith("✓") ? "#0f0" : "#f00",
                                marginTop: "4px",
                              }}
                            >
                              {pathValidationResult}
                            </div>
                          )}
                        </div>
                      ) : (
                        <div
                          style={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                            padding: "8px",
                            backgroundColor: "#2a2a2a",
                            borderRadius: "4px",
                            width: "100%",
                            gap: "8px",
                          }}
                        >
                          <span
                            style={{
                              fontSize: "11px",
                              flex: 1,
                              wordBreak: "break-all",
                              color: "#ccc",
                            }}
                          >
                            {path}
                          </span>
                          <div style={{ display: "flex", gap: "4px", flexShrink: 0 }}>
                            <ButtonItem
                              layout="below"
                              onClick={() => startEditingPath(game, pathIndex)}
                            >
                              Изменить
                            </ButtonItem>
                            <ButtonItem
                              layout="below"
                              onClick={() => removePathFromGame(game, pathIndex)}
                            >
                              Удалить
                            </ButtonItem>
                          </div>
                        </div>
                      )}
                    </PanelSectionRow>
                  );
                })}
              </>
            )}

            {isEditing && (
              <>
                <PanelSectionRow>
                  <TextField
                    label="Добавить путь"
                    value={newPath}
                    onChange={(e) => setNewPath(e.target.value)}
                  />
                </PanelSectionRow>
                <PanelSectionRow>
                  <ButtonItem
                    layout="below"
                    onClick={() => addPathToGame(game)}
                    disabled={validating || !newPath.trim()}
                  >
                    {validating ? "Проверка..." : "Добавить"}
                  </ButtonItem>
                </PanelSectionRow>
                {pathValidationResult && (
                  <PanelSectionRow>
                    <div
                      style={{
                        fontSize: "12px",
                        color: pathValidationResult.startsWith("✓") ? "#0f0" : "#f00",
                      }}
                    >
                      {pathValidationResult}
                    </div>
                  </PanelSectionRow>
                )}
              </>
            )}

            <PanelSectionRow>
              <ButtonItem
                layout="below"
                onClick={() => {
                  if (isEditing) {
                    setEditingGame(null);
                    setNewPath("");
                    setPathValidationResult(null);
                  } else {
                    setEditingGame(game);
                  }
                }}
              >
                {isEditing ? "Отмена" : "Редактировать пути"}
              </ButtonItem>
            </PanelSectionRow>
          </PanelSection>
        );
      })}

      {games.length === 0 && (
        <PanelSection>
          <PanelSectionRow>
            <div style={{ color: "#888" }}>Игры не найдены</div>
          </PanelSectionRow>
        </PanelSection>
      )}
    </div>
  );
}

import { useState } from "react";
import { call } from "@decky/api";
import { ButtonItem, PanelSection, PanelSectionRow, TextField, staticClasses } from "@decky/ui";
import { GameInfo } from "../utils/types";

interface GamePathEditorProps {
  game: GameInfo;
  onClose: () => void;
  onSave: () => void;
}

export function GamePathEditor({ game, onClose, onSave }: GamePathEditorProps) {
  const [paths, setPaths] = useState<string[]>(game.savePaths || []);
  const [newPath, setNewPath] = useState<string>("");
  const [validating, setValidating] = useState<boolean>(false);
  const [validationResult, setValidationResult] = useState<string | null>(null);

  const addPath = async () => {
    if (!newPath.trim()) {
      setValidationResult("Введите путь");
      return;
    }

    setValidating(true);
    setValidationResult(null);

    try {
      const result: any = await call("validate_save_path", { path: newPath.trim() });

      if (result.success && result.path) {
        const normalizedPath = result.path;
        if (!paths.includes(normalizedPath)) {
          setPaths([...paths, normalizedPath]);
          setNewPath("");
          setValidationResult(null);
        } else {
          setValidationResult("Этот путь уже добавлен");
        }
      } else {
        setValidationResult(`✗ ${result.error || "Ошибка валидации"}`);
      }
    } catch (error) {
      setValidationResult(`✗ Ошибка: ${error}`);
    } finally {
      setValidating(false);
    }
  };

  const removePath = (index: number) => {
    setPaths(paths.filter((_, i) => i !== index));
  };

  const savePaths = async () => {
    try {
      const result: any = await call("update_game_paths", { game_name: game.name, save_paths: paths });

      if (result.success) {
        onSave();
        onClose();
      } else {
        setValidationResult(`✗ Ошибка сохранения: ${result.error}`);
      }
    } catch (error) {
      setValidationResult(`✗ Ошибка: ${error}`);
    }
  };

  return (
    <div>
      <PanelSection title={`Настройка путей сохранений: ${game.name}`}>
        <PanelSectionRow>
          <div className={staticClasses.Title}>Добавить путь</div>
        </PanelSectionRow>

        <PanelSectionRow>
          <TextField
            label="Путь к сохранениям"
            value={newPath}
            onChange={(e) => setNewPath(e.target.value)}
          />
        </PanelSectionRow>

        <PanelSectionRow>
          <ButtonItem
            layout="below"
            onClick={addPath}
            disabled={validating || !newPath.trim()}
          >
            {validating ? "Проверка..." : "Добавить путь"}
          </ButtonItem>
        </PanelSectionRow>

        {validationResult && (
          <PanelSectionRow>
            <div style={{
              fontSize: "12px",
              color: validationResult.startsWith("✓") ? "#0f0" : "#f00",
              marginTop: "5px",
            }}>
              {validationResult}
            </div>
          </PanelSectionRow>
        )}
      </PanelSection>

      <PanelSection title={`Текущие пути (${paths.length})`}>
        {paths.length === 0 ? (
          <PanelSectionRow>
            <div style={{ color: "#888", fontStyle: "italic" }}>Нет добавленных путей</div>
          </PanelSectionRow>
        ) : (
          paths.map((path, index) => (
            <PanelSectionRow key={index}>
              <div style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                padding: "8px",
                backgroundColor: "#2a2a2a",
                borderRadius: "4px",
                width: "100%"
              }}>
                <span style={{ fontSize: "12px", flex: 1, wordBreak: "break-all" }}>{path}</span>
                <div style={{ marginLeft: "10px" }}>
                  <ButtonItem
                    layout="below"
                    onClick={() => removePath(index)}
                  >
                    Удалить
                  </ButtonItem>
                </div>
              </div>
            </PanelSectionRow>
          ))
        )}
      </PanelSection>

      <PanelSection>
        <PanelSectionRow>
          <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end", width: "100%" }}>
            <ButtonItem
              layout="below"
              onClick={onClose}
            >
              Отмена
            </ButtonItem>
            <ButtonItem
              layout="below"
              onClick={savePaths}
            >
              Сохранить
            </ButtonItem>
          </div>
        </PanelSectionRow>
      </PanelSection>
    </div>
  );
}
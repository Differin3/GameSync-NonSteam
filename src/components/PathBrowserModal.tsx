import { useEffect, useState } from "react";
import { call } from "@decky/api";
import { ModalRoot, TextField, ButtonItem, ToggleField, Spinner } from "@decky/ui";
import { FaCheck, FaChevronUp, FaFolder, FaHome, FaTimes } from "react-icons/fa";

interface Props {
  initialPath?: string;
  onSelect: (path: string) => void;
  onClose: () => void;
}

export function PathBrowserModal({ initialPath, onSelect, onClose }: Props) {
  const [input, setInput] = useState<string>(initialPath || "");
  const [current, setCurrent] = useState<string>(initialPath || "");
  const [dirs, setDirs] = useState<Array<{ name: string; path: string }>>([]);
  const [shortcuts, setShortcuts] = useState<Array<{ name: string; path: string }>>([]);
  const [parent, setParent] = useState<string>("");
  const [showHidden, setShowHidden] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const load = async (path?: string) => {
    setLoading(true);
    setError(null);
    try {
      const response: any = await call("browse_path", {
        path: path || current || initialPath || "",
        show_hidden: showHidden,
      });
      if (response?.success) {
        setCurrent(response.path);
        setInput(response.path);
        setDirs(Array.isArray(response.dirs) ? response.dirs : []);
        setShortcuts(Array.isArray(response.shortcuts) ? response.shortcuts : []);
        setParent(response.parent || "");
      } else {
        setError(response?.error || "Не удалось прочитать папку");
      }
    } catch (e: any) {
      setError(e?.message || String(e));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load(initialPath || undefined);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showHidden]);

  return (
    <ModalRoot onCancel={onClose} bAllowFullSize={false}>
      <div style={{ display: "flex", flexDirection: "column", gap: "8px", maxHeight: "440px", overflowY: "auto", paddingRight: "4px" }}>
        <TextField
          label="Папка"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e: any) => {
            if (e.key === "Enter") load(input);
          }}
        />

        <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
          <ButtonItem layout="below" onClick={() => load(input)} disabled={loading}>
            Перейти
          </ButtonItem>
          <ButtonItem layout="below" onClick={() => load(parent)} disabled={!parent || loading}>
            <span style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}><FaChevronUp />Наверх</span>
          </ButtonItem>
          <ButtonItem layout="below" onClick={() => load("~")} disabled={loading}>
            <span style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}><FaHome />Домой</span>
          </ButtonItem>
          <ButtonItem layout="below" onClick={() => onSelect(current)} disabled={!current || loading}>
            <span style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}><FaCheck />Выбрать</span>
          </ButtonItem>
        </div>

        <ToggleField
          label="Показывать скрытые папки"
          checked={showHidden}
          onChange={setShowHidden}
        />

        {shortcuts.length > 0 && (
          <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
            {shortcuts.map((item) => (
              <ButtonItem key={item.path} layout="below" onClick={() => load(item.path)}>
                {item.name}
              </ButtonItem>
            ))}
          </div>
        )}

        {loading && <div style={{ display: "flex", justifyContent: "center", padding: "8px" }}><Spinner /></div>}
        {error && <div style={{ color: "#f0a0a0", fontSize: "12px" }}>{error}</div>}

        {!loading && !error && (
          <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
            {dirs.length === 0 && <div style={{ color: "#8b929a", fontSize: "12px" }}>Пусто</div>}
            {dirs.map((dir) => (
              <ButtonItem key={dir.path} layout="below" onClick={() => load(dir.path)}>
                <span style={{ display: "inline-flex", alignItems: "center", gap: "7px", minWidth: 0 }}>
                  <FaFolder style={{ color: "#e0b341", flex: "0 0 auto" }} />
                  <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{dir.name}</span>
                </span>
              </ButtonItem>
            ))}
          </div>
        )}

        <div style={{ display: "flex", justifyContent: "flex-end", gap: "8px", paddingTop: "6px" }}>
          <ButtonItem layout="below" onClick={onClose}>
            <span style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}><FaTimes />Отмена</span>
          </ButtonItem>
        </div>
      </div>
    </ModalRoot>
  );
}

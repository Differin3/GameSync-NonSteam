import { showModal } from "@decky/ui";
import { PathBrowserModal } from "../components/PathBrowserModal";

/** Открыть файловый браузер и вернуть выбранную папку. */
export function browseDirectory(
  initialPath: string,
  onSelect: (path: string) => void,
  title = "Выбрать папку"
) {
  let modal: any = null;
  const close = () => modal?.Close?.();
  modal = showModal(
    <PathBrowserModal
      initialPath={initialPath}
      onSelect={(path) => {
        onSelect(path);
        close();
      }}
      onClose={close}
    />,
    undefined,
    { strTitle: title, bNeverPopOut: true }
  );
}

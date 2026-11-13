import type { ComponentProps, ReactNode } from "react";
import { PanelSection, PanelSectionRow, Spinner, ButtonItem } from "@decky/ui";
import { colors, radius, pathText } from "../utils/theme";
import { FaChevronLeft, FaChevronRight } from "react-icons/fa";

export type Tone = "success" | "error" | "warning" | "info";

const toneColor: Record<Tone, string> = {
  success: colors.success,
  error: colors.error,
  warning: colors.warning,
  info: colors.accent,
};

const toneBg: Record<Tone, string> = {
  success: "rgba(91, 184, 91, 0.12)",
  error: "rgba(224, 96, 96, 0.12)",
  warning: "rgba(224, 169, 74, 0.12)",
  info: "rgba(102, 170, 255, 0.12)",
};

/** Короткая подсказка под заголовком. */
export function Hint({ children }: { children: ReactNode }) {
  return <div style={{ fontSize: "12px", color: colors.muted, lineHeight: 1.4 }}>{children}</div>;
}

/** Цветное сообщение статуса (успех/ошибка/предупреждение). */
export function StatusMessage({ tone, children }: { tone: Tone; children: ReactNode }) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: "8px",
        padding: "8px 10px",
        borderRadius: radius.sm,
        background: toneBg[tone],
        borderLeft: `3px solid ${toneColor[tone]}`,
        color: colors.text,
        fontSize: "12px",
        lineHeight: 1.4,
        width: "100%",
        boxSizing: "border-box",
      }}
    >
      {children}
    </div>
  );
}

/** Небольшой цветной бейдж. */
export function Badge({ tone = "info", children }: { tone?: Tone; children: ReactNode }) {
  return (
    <span
      style={{
        display: "inline-block",
        padding: "1px 7px",
        borderRadius: "999px",
        fontSize: "10px",
        fontWeight: 600,
        color: toneColor[tone],
        background: toneBg[tone],
        border: `1px solid ${toneColor[tone]}44`,
        whiteSpace: "nowrap",
      }}
    >
      {children}
    </span>
  );
}

/** Моноширинный путь с переносом. */
export function PathText({ children }: { children: ReactNode }) {
  return <div style={pathText}>{children}</div>;
}

export function Loading({ text }: { text: string }) {
  return (
    <PanelSection>
      <PanelSectionRow>
        <div style={{ display: "flex", alignItems: "center", gap: "10px", color: colors.muted, fontSize: "12px" }}>
          <Spinner />
          <span>{text}</span>
        </div>
      </PanelSectionRow>
    </PanelSection>
  );
}

export function EmptyState({ text }: { text: string }) {
  return (
    <PanelSection>
      <PanelSectionRow>
        <div style={{ textAlign: "center", color: colors.dim, fontSize: "12px", padding: "12px 0" }}>{text}</div>
      </PanelSectionRow>
    </PanelSection>
  );
}

export function ErrorState({ text, onRetry }: { text: string; onRetry?: () => void }) {
  return (
    <PanelSection>
      <PanelSectionRow>
        <StatusMessage tone="error">{text}</StatusMessage>
      </PanelSectionRow>
      {onRetry && (
        <PanelSectionRow>
          <ButtonItem layout="below" onClick={onRetry}>
            Повторить
          </ButtonItem>
        </PanelSectionRow>
      )}
    </PanelSection>
  );
}
/** Обёртка для иконок: фиксированный слот, чтобы иконки не «съезжали» */
export function Icon({ children }: { children: ReactNode }) {
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        width: "20px",
        height: "20px",
        flex: "0 0 auto",
      }}
    >
      {children}
    </span>
  );
}
/** Кнопка с иконкой в одной строке: icon-проп у ButtonItem с layout=below
 *  ставит иконку над текстом, поэтому иконку кладём внутрь children. */
export function ActionButton({
  icon,
  children,
  ...rest
}: {
  icon?: ReactNode;
  children?: ReactNode;
} & Omit<ComponentProps<typeof ButtonItem>, "layout" | "icon" | "children">) {
  return (
    <ButtonItem layout="below" {...rest}>
      <span style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", gap: "8px" }}>
        {icon ? <Icon>{icon}</Icon> : null}
        {children}
      </span>
    </ButtonItem>
  );
}

/** Пагинация: «Назад / N из M / Вперёд» в стиле кнопок плагина. */
export function Pager({
  page,
  pages,
  onChange,
  totalLabel,
}: {
  page: number;
  pages: number;
  onChange: (page: number) => void;
  totalLabel?: string;
}) {
  if (pages <= 1) return null;
  return (
    <div style={{ display: "flex", alignItems: "center", gap: "8px", justifyContent: "space-between", marginTop: "8px" }}>
      <div style={{ width: "176px", flex: "0 0 auto" }}>
        <ActionButton icon={<FaChevronLeft />} onClick={() => onChange(page - 1)} disabled={page <= 1}>
          Назад
        </ActionButton>
      </div>
      <span style={{ fontSize: "11px", color: colors.dim }}>
        {totalLabel ? `${totalLabel} · ` : ""}
        {page} / {pages}
      </span>
      <div style={{ width: "176px", flex: "0 0 auto" }}>
        <ActionButton icon={<FaChevronRight />} onClick={() => onChange(page + 1)} disabled={page >= pages}>
          Вперёд
        </ActionButton>
      </div>
    </div>
  );
}
import { createElement } from "react";
import { routerHook } from "@decky/api";
import { afterPatch, appDetailsClasses, createReactTreePatcher, findInReactTree } from "@decky/ui";
import { GameSyncGameRow } from "../components/GameSyncGameRow";

const ROUTE = "/library/app/:appid";

/** renderFunc уже пропатченные — не навешиваем второй afterPatch. */
const patchedRenderFuncs = new WeakSet<object>();

/** Патчи, которые надо снять при выгрузке плагина. */
const appliedPatches: { unpatch: () => void }[] = [];

function getOverview(tree: any): any {
  const node = findInReactTree(tree, (x: any) => x?.props?.children?.props?.overview);
  return node?.props?.children?.props?.overview;
}

function getInnerContainer(tree: any): any {
  const innerClass = (appDetailsClasses as any)?.InnerContainer;
  if (!innerClass) {
    return null;
  }
  return findInReactTree(
    tree,
    (x: any) =>
      Array.isArray(x?.props?.children) &&
      typeof x?.props?.className === "string" &&
      x.props.className.includes(innerClass)
  );
}

function injectRow(tree: any): void {
  const overview = getOverview(tree);
  const appId = overview?.appid ?? overview?.app_id;
  if (appId === undefined || appId === null) {
    return;
  }

  const container = getInnerContainer(tree);
  if (!container) {
    return;
  }

  const key = `gamesync-status-${appId}`;
  const children = container.props.children;
  if (children.some((child: any) => child?.key === key)) {
    return;
  }

  const title = overview?.display_name || overview?.localized_name || overview?.name;
  // 0 — обложка, 1 — строка Play, дальше — описание игры.
  const index = Math.min(2, children.length);
  children.splice(index, 0, createElement(GameSyncGameRow, { key, appId, title }));
}

/**
 * Добавляет строку GameSync на страницу игры.
 * Возвращает функцию очистки для `onDismount`.
 */
export function installAppDetailsPatch(): () => void {
  try {
    const routePatch = routerHook.addPatch(ROUTE, (tree: any) => {
      try {
        const routeProps = findInReactTree(tree, (x: any) => x?.renderFunc);
        if (routeProps && !patchedRenderFuncs.has(routeProps)) {
          patchedRenderFuncs.add(routeProps);
          const handler = createReactTreePatcher(
            [(node: any) => findInReactTree(node, (x: any) => x?.props?.children?.props?.overview)?.props?.children],
            (_args: any[], ret: any) => {
              try {
                injectRow(ret);
              } catch (error) {
                console.error("[GameSync] failed to inject game row", error);
              }
              return ret;
            }
          );
          appliedPatches.push(afterPatch(routeProps, "renderFunc", handler));
        }
      } catch (error) {
        console.error("[GameSync] app details patch setup failed", error);
      }
      return tree;
    });

    return () => {
      try {
        routerHook.removePatch(ROUTE, routePatch);
      } catch (error) {
        console.error("[GameSync] failed to remove route patch", error);
      }
      while (appliedPatches.length > 0) {
        try {
          appliedPatches.pop()?.unpatch();
        } catch (error) {
          console.error("[GameSync] failed to unpatch renderFunc", error);
        }
      }
    };
  } catch (error) {
    console.error("[GameSync] cannot register app details patch", error);
    return () => {};
  }
}

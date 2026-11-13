// Мини-клиент CEF DevTools для проверки интерфейса на Deck.
// Требует SSH-туннеля: ssh -L 8080:127.0.0.1:8080 deck@<ip>
// Использование:
//   node tools/cdp.mjs <target-substring> shot <out.png>
//   node tools/cdp.mjs <target-substring> eval "<js-expression>"

import { writeFileSync } from "node:fs";

const [, , targetMatch, action, arg] = process.argv;
if (!targetMatch || !action || !arg) {
  console.error("usage: node cdp.mjs <target> shot|eval <arg>");
  process.exit(1);
}

const list = await (await fetch("http://127.0.0.1:8080/json")).json();
const target = list.find(
  (t) => (t.url || "").includes(targetMatch) || (t.title || "").includes(targetMatch)
);
if (!target) {
  console.error("target not found. available:", list.map((t) => `${t.title} :: ${t.url}`).join("\n"));
  process.exit(1);
}

const ws = new WebSocket(target.webSocketDebuggerUrl);
let seq = 0;
const pending = new Map();

ws.addEventListener("message", (event) => {
  const message = JSON.parse(event.data);
  if (message.id && pending.has(message.id)) {
    const { resolve, reject } = pending.get(message.id);
    pending.delete(message.id);
    if (message.error) reject(new Error(JSON.stringify(message.error)));
    else resolve(message.result);
  }
});

const send = (method, params = {}) =>
  new Promise((resolve, reject) => {
    const id = ++seq;
    pending.set(id, { resolve, reject });
    ws.send(JSON.stringify({ id, method, params }));
  });

await new Promise((resolve) => ws.addEventListener("open", resolve, { once: true }));

try {
  if (action === "shot") {
    const result = await send("Page.captureScreenshot", { format: "png" });
    writeFileSync(arg, Buffer.from(result.data, "base64"));
    console.log(`saved ${arg}`);
  } else {
    const result = await send("Runtime.evaluate", {
      expression: arg,
      returnByValue: true,
      awaitPromise: true,
      userGesture: true,
    });
    console.log(JSON.stringify(result.result?.value ?? result.result, null, 2));
  }
} finally {
  ws.close();
}

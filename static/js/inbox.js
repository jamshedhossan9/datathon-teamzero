// Inbox demo: messages arrive one by one and are checked as they land.

const ARRIVAL_SECONDS = 3;
const screen = document.getElementById("messages");
const detail = document.getElementById("detail");
const restart = document.getElementById("restart");
let timer = null;

function addMessage(item) {
  const row = el("div", "msg");
  const top = el("div", "top");
  top.appendChild(el("span", "sender", item.sender));
  const badge = el("span", "badge checking", "checking…");
  top.appendChild(badge);
  row.appendChild(top);
  row.appendChild(el("div", "text", item.message));
  screen.insertBefore(row, screen.children[1]); // newest first, under the title bar

  checkMessage(item.message)
    .then((result) => {
      badge.className = `badge ${result.verdict}`;
      badge.textContent = LABELS[result.verdict];
      row.addEventListener("click", () => {
        renderResult(detail, result, "detail");
        detail.prepend(el("p", "hint", `From: ${item.sender}`));
        detail.prepend(el("p", null, item.message));
      });
    })
    .catch(() => {
      badge.textContent = "error";
    });
}

async function start() {
  clearInterval(timer);
  [...screen.querySelectorAll(".msg")].forEach((m) => m.remove());
  detail.className = "card detail";
  detail.textContent = "Tap a message to see why it got its label.";
  const items = await (await fetch("/demo-messages")).json();
  let next = 0;
  addMessage(items[next++]);
  timer = setInterval(() => {
    if (next >= items.length) return clearInterval(timer);
    addMessage(items[next++]);
  }, ARRIVAL_SECONDS * 1000);
}

restart.addEventListener("click", start);
start();

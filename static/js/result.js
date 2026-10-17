// Shared by the checker page and the inbox demo: call the API and draw a result card.

const LABELS = { safe: "✅ Safe", suspicious: "⚠️ Suspicious", scam: "🚨 Scam" };
const COLORS = { safe: "var(--safe)", suspicious: "var(--warn)", scam: "var(--scam)" };

async function checkMessage(message) {
  const response = await fetch("/check", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ message }),
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || "Check failed");
  return data;
}

// Build elements with textContent only, so message text can never inject HTML
function el(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}

function list(items) {
  const ul = el("ul");
  items.forEach((item) => ul.appendChild(el("li", null, item)));
  return ul;
}

function renderResult(container, result, extraClass = "") {
  container.innerHTML = "";
  container.className = `card result ${result.verdict} ${extraClass}`.trim();

  container.appendChild(el("span", `badge ${result.verdict}`, LABELS[result.verdict]));

  const risk = el("div", "risk");
  const bar = el("span");
  bar.style.width = `${Math.round(result.risk_score * 100)}%`;
  bar.style.background = COLORS[result.verdict];
  risk.appendChild(bar);
  container.appendChild(risk);
  container.appendChild(el("div", "hint", `Risk score: ${Math.round(result.risk_score * 100)} / 100`));

  // Who receives the money, read from the payment link's page (step 406)
  const receivers = result.layers.receivers;
  if (receivers && receivers.results.length) {
    const r = receivers.results[0];
    let text = r.receiver ? `💳 Payment goes to: ${r.receiver}` : "💳 Payment goes to: couldn't verify";
    if (r.mismatch) text += ` (but the message claims to be from ${receivers.claimed_sender})`;
    container.appendChild(el("p", `payee ${r.mismatch || !r.receiver ? "warn" : ""}`.trim(), text));
  }

  container.appendChild(el("h3", null, "Why"));
  container.appendChild(el("p", null, result.explanation.summary));

  if (result.reasons.length) {
    container.appendChild(el("h3", null, "What we found"));
    container.appendChild(list(result.reasons));
  }

  container.appendChild(el("h3", null, "What you should do"));
  container.appendChild(list(result.advice));

  container.appendChild(el("h3", null, "What our server processed (personal data masked, nothing stored)"));
  container.appendChild(el("div", "masked", result.masked_message));
}

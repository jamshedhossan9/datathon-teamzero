"""Team Zero scam checker: Flask API and pages, running on IBM LinuxONE.

Run from the repo folder:  python app.py   (listens on port 38889)
"""
import csv
import os
import time
from pathlib import Path

from flask import Flask, abort, jsonify, request, send_from_directory

from checker import granite, webapi
from checker import model as word_model
from checker.pipeline import MAX_MESSAGE_LENGTH, check_message

BASE_DIR = Path(__file__).resolve().parent
PAY_DIR = BASE_DIR / "static" / "pay"
# The ZeroScam web UI, built from web/ with `npm run build`
UI_DIR = BASE_DIR / "static" / "app"
TEST_MESSAGES = BASE_DIR / "data" / "test_messages" / "test_messages.csv"

# Messages for the inbox demo (step 412), in arrival order, with made-up senders.
# Test message 10 imitates a real bank's domain, so it is never used in the demo.
DEMO_INBOX = [
    (1, "Mum"),
    (11, "+60 11-xxxx 2468"),
    (2, "Hafiz"),
    (17, "Unknown number"),
    (12, "Security Team"),
    (6, "Bank notification"),
    (22, "Syarikat Elektrik Contoh"),
    (15, "+60 11-xxxx 6789"),
    (18, "Cikgu Aina"),
    (9, "+60 17-xxxx 1357"),
    (20, "Kedai Contoh"),
]

app = Flask(__name__, static_folder="static")


def _demo_link(message):
    # Demo messages point to localhost; show them with the address this page was opened from (e.g. the VM IP)
    return message.replace("http://localhost:38889", request.host_url.rstrip("/"))


@app.get("/")
@app.get("/inbox")
def web_ui():
    # One web app for both pages: the checker one-pager at "/" and the live inbox demo at "/inbox"
    if not (UI_DIR / "index.html").is_file():
        return "The web UI is not built yet: run `npm run build` in web/.", 503
    return send_from_directory(UI_DIR, "index.html")


@app.get("/demo-messages")
def demo_messages():
    with TEST_MESSAGES.open(encoding="utf-8") as f:
        rows = {int(row["id"]): row for row in csv.DictReader(f)}
    return jsonify([{"id": i, "sender": sender, "message": _demo_link(rows[i]["message"])} for i, sender in DEMO_INBOX])


@app.get("/health")
def health():
    try:
        word_model.load_model()
        model_ready = True
    except FileNotFoundError:
        model_ready = False
    return jsonify({"status": "ok", "model_loaded": model_ready, "granite": granite.status()})


def _message_from_request(field="message"):
    """Return (message, None) or (None, error response)."""
    data = request.get_json(silent=True) or {}
    message = data.get(field)
    if not isinstance(message, str) or not message.strip():
        return None, (jsonify({"error": f"Send JSON like {{\"{field}\": \"text to check\"}}"}), 400)
    if len(message) > MAX_MESSAGE_LENGTH:
        return None, (jsonify({"error": f"Message too long (max {MAX_MESSAGE_LENGTH} characters)"}), 400)
    return message, None


def _explain(message):
    result = check_message(message, self_netloc=request.host)
    answer = granite.explain(message, result)
    if answer:
        return jsonify(answer)
    if granite.status() == "unavailable":
        return jsonify({"text": "The AI explanation isn't available on this server right now.", "source": "unavailable"})
    return jsonify({
        "text": "Sorry, the AI model couldn't write a clear explanation for this message. The checks above still apply.",
        "source": "fallback",
    })


# --- API used by the ZeroScam web UI (web/) ---

@app.post("/api/check")
def api_check():
    message, error = _message_from_request("text")
    if error:
        return error
    started = time.perf_counter()
    result = check_message(message, self_netloc=request.host)  # in memory only: never stored or logged
    latency_ms = max(1, round((time.perf_counter() - started) * 1000))
    return jsonify(webapi.to_web_result(message, result, latency_ms))


@app.post("/api/explain")
def api_explain():
    message, error = _message_from_request("text")
    if error:
        return error
    return _explain(message)


@app.get("/api/stats")
def api_stats():
    # Measured results and the model's top scam words (no live counters, no messages)
    return jsonify(webapi.stats())


@app.get("/pay/<name>")
def demo_payment_page(name):
    # The three made-up demo payment pages (step 405)
    if not (PAY_DIR / f"{name}.html").is_file():
        abort(404)
    return send_from_directory(PAY_DIR, f"{name}.html")


if __name__ == "__main__":
    port = int(os.environ.get("PORT", "38889"))
    # Load Granite BEFORE starting the server: while llama.cpp loads it silences the terminal, and a server
    # started during that moment would never show its request log lines
    print("Loading Granite...", flush=True)
    granite.load()
    print(f"Granite: {granite.status()}", flush=True)
    # threaded=True so the checker can fetch our own demo payment pages while answering a request
    app.run(host="0.0.0.0", port=port, threaded=True)

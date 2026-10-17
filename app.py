"""Team Zero scam checker: Flask API and pages, running on IBM LinuxONE.

Run from the repo folder:  python app.py   (listens on port 38889)
"""
import csv
import os
from pathlib import Path

from flask import Flask, abort, jsonify, render_template, request, send_from_directory

from checker import granite
from checker import model as word_model
from checker.pipeline import MAX_MESSAGE_LENGTH, check_message

BASE_DIR = Path(__file__).resolve().parent
PAY_DIR = BASE_DIR / "static" / "pay"
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

app = Flask(__name__, static_folder="static", template_folder="templates")


def _demo_link(message):
    # Demo messages point to localhost; show them with the address this page was opened from (e.g. the VM IP)
    return message.replace("http://localhost:38889", request.host_url.rstrip("/"))


@app.get("/")
def home():
    return render_template("index.html")


@app.get("/inbox")
def inbox():
    return render_template("inbox.html")


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


def _message_from_request():
    """Return (message, None) or (None, error response)."""
    data = request.get_json(silent=True) or {}
    message = data.get("message")
    if not isinstance(message, str) or not message.strip():
        return None, (jsonify({"error": "Send JSON like {\"message\": \"text to check\"}"}), 400)
    if len(message) > MAX_MESSAGE_LENGTH:
        return None, (jsonify({"error": f"Message too long (max {MAX_MESSAGE_LENGTH} characters)"}), 400)
    return message, None


@app.post("/check")
def check():
    message, error = _message_from_request()
    if error:
        return error
    # The message is checked in memory only: it is never stored or logged
    return jsonify(check_message(message, self_netloc=request.host))


@app.post("/explain")
def explain():
    # Granite's plain-language explanation (step 407), asked for after /check so the result shows instantly
    message, error = _message_from_request()
    if error:
        return error
    result = check_message(message, self_netloc=request.host)
    answer = granite.explain(message, result)
    if answer:
        return jsonify(answer)
    return jsonify({"text": result["explanation"]["summary"], "source": "rules", "granite": granite.status()})


@app.get("/pay/<name>")
def demo_payment_page(name):
    # The three made-up demo payment pages (step 405)
    if not (PAY_DIR / f"{name}.html").is_file():
        abort(404)
    return send_from_directory(PAY_DIR, f"{name}.html")


if __name__ == "__main__":
    port = int(os.environ.get("PORT", "38889"))
    granite.load_in_background()  # load Granite once at start-up, so the first explanation is not slow
    # threaded=True so the checker can fetch our own demo payment pages while answering a request
    app.run(host="0.0.0.0", port=port, threaded=True)

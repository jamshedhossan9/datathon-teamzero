"""Adapter between the checker and the ZeroScam web UI (web/): turns a check_message() result into the
shape the UI expects (verdict, scam_probability, highlighted keywords with positions, explanation, advice...).
"""
import re

from . import model as word_model
from .pipeline import OTP_NOTICE, STRONG_TACTICS

MODEL_VERSION = "TF-IDF + logistic regression + rule layers (trained on IBM LinuxONE)"

# Measured in sms_spam.ipynb and with the full checker on the dataset's held-out test split (1,035 messages:
# 904 genuine, 131 spam). Model recall on spam 0.916; genuine messages judged "safe" by the full checker 844/904.
MEASURED = {
    "scam_recall": 0.916,
    "genuine_pass": round(844 / 904, 3),
    "test_messages": 1035,
    "genuine_test_messages": 904,
    "trained_on": "IBM LinuxONE",
}

VERDICT = {"safe": "legit", "suspicious": "suspicious", "scam": "scam"}

FLAG_PRIORITY = ["lookalike", "ip_url", "shortener", "suspicious_tld"]

LINK_REASON = {
    "lookalike": "Website imitating {lookalike_of}",
    "ip_url": "Link uses a raw IP address instead of a website name",
    "shortener": "Shortened link hides the real website",
    "suspicious_tld": "Website ending often used in scams",
}

_top_words = None


def _find_all(message, phrase):
    """Positions of a phrase in the message, whole words only, ignoring case."""
    pattern = re.compile(r"(?<![a-z])" + re.escape(phrase) + r"(?![a-z])", re.IGNORECASE)
    return [(m.start(), m.end()) for m in pattern.finditer(message)]


def _keywords(message, result):
    """Highlighted parts of the message, each with a reason (offsets are Python string indices = code points)."""
    layers = result["layers"]
    payments = layers["payments"]
    notice = OTP_NOTICE.search(message)
    out = []

    seen = set()

    def add(start, end, direction, weight, reason):
        if (start, end) in seen:
            return  # the same words found twice (e.g. by a phrase and by a pattern)
        seen.add((start, end))
        out.append({"text": message[start:end], "start": start, "end": end,
                    "direction": direction, "weight": weight, "reason": reason})

    # Links first, so words inside a link (".../pay/...") are not highlighted again as tactics
    link_spans = []
    for link in layers["links"]["links"]:
        start = message.find(link["url"])
        if start < 0:
            continue
        end = start + len(link["url"])
        link_spans.append((start, end))
        if link["flags"]:
            flag = min(link["flags"], key=FLAG_PRIORITY.index)  # most serious warning first
            weight = 0.35 if flag in ("lookalike", "ip_url") else 0.25
            add(start, end, "fraud", weight, LINK_REASON[flag].format(lookalike_of=link["lookalike_of"]))
        elif link["url"] in payments["payment_links"]:
            add(start, end, "fraud", 0.2, "Payment link: check who receives the money before paying")
        elif link["official"]:
            add(start, end, "legit", 0.1, "Official website of a known organisation")

    def inside_link(start, end):
        return any(s <= start and end <= e for s, e in link_spans)

    for tactic in layers["tactics"]:
        weight = 0.3 if tactic["id"] in STRONG_TACTICS else 0.15
        genuine_code_notice = tactic["id"] == "credentials" and notice
        for phrase in tactic["matches"]:
            for start, end in _find_all(message, phrase):
                if inside_link(start, end):
                    continue
                if genuine_code_notice:
                    add(start, end, "legit", 0.1, "Mentions a code, but tells you never to share it")
                else:
                    add(start, end, "fraud", weight, f"{tactic['label']}: {tactic['description']}")

    for raw in payments["bank_accounts"]:
        for m in re.finditer(re.escape(raw), message):
            add(m.start(), m.end(), "fraud", 0.25, "Account number to pay into: check who owns it before paying")
    for raw in payments["ewallet_phones"]:
        for m in re.finditer(re.escape(raw), message):
            add(m.start(), m.end(), "fraud", 0.25, "Phone number to pay to: check who owns it before paying")

    if notice:
        add(notice.start(), notice.end(), "legit", 0.2, "Genuine code notices warn you never to share the code")
    return out


def _payee(result):
    receivers = result["layers"]["receivers"]
    if not receivers or not receivers["results"]:
        return None
    first = receivers["results"][0]
    return {"receiver": first["receiver"], "claimed_sender": receivers["claimed_sender"],
            "mismatch": first["mismatch"], "status": first["status"]}


def to_web_result(message, result, latency_ms):
    return {
        "verdict": VERDICT[result["verdict"]],
        "scam_probability": result["risk_score"],
        "keywords": _keywords(message, result),
        "explanation": result["explanation"]["summary"],
        "advice": result["advice"],
        "reasons": result["reasons"],
        "payee": _payee(result),
        "masked_message": result["masked_message"],
        "latency_ms": latency_ms,
        "model_version": MODEL_VERSION,
    }


def top_scam_words(n=12):
    """The words with the highest learned spam weights in the trained word model."""
    global _top_words
    if _top_words is None:
        pipeline = word_model.load_model()
        classifier = pipeline.named_steps["model"]
        if not hasattr(classifier, "coef_"):
            return []  # only a linear model (logistic regression) has one weight per word
        names = pipeline.named_steps["tfidf"].get_feature_names_out()
        weights = classifier.coef_[0]
        ranked = sorted(zip(names, weights), key=lambda pair: pair[1], reverse=True)
        _top_words = [{"text": w, "count": round(float(c), 1)} for w, c in ranked if w.isalpha() and len(w) > 2][:n]
    return _top_words


def stats():
    try:
        words = top_scam_words()
    except FileNotFoundError:
        words = []  # the model has not been trained on this machine yet
    return {**MEASURED, "top_keywords": words}

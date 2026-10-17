"""The full checker: runs every layer on a message and combines them into one verdict.

Layers: word-based ML model, scam tactics, payment details, links, payment-link receiver.
Verdict: "safe", "suspicious" or "scam", with a risk score from 0 to 1 and the reasons.
"""
import re

from . import model as word_model
from .advice import build_advice
from .explain import build_explanation, build_reasons
from .links import check_links
from .payments import find_payment_details
from .privacy import mask
from .receiver import check_receivers
from .tactics import find_tactics

MAX_MESSAGE_LENGTH = 2000

# Tactics that on their own point to a scam
STRONG_TACTICS = {"impersonation", "prize", "threat", "credentials", "easy_money"}
# Tactics that add pressure but are common in normal messages too
WEAK_TACTICS = {"urgency", "payment_request", "contact_push"}

# Genuine one-time-code notices warn you NOT to share the code
OTP_NOTICE = re.compile(r"do not share|don't share|never share|jangan kongsi|jangan berikan", re.IGNORECASE)


def _decide(model, tactic_ids, payment_flags, link_flags, links, receivers, message):
    """Combine the layers into one verdict. Returns (verdict, reassured)."""
    strong = tactic_ids & STRONG_TACTICS
    weak = tactic_ids & WEAK_TACTICS
    if "credentials" in strong and OTP_NOTICE.search(message):
        strong = strong - {"credentials"}  # a genuine OTP notice, not a request for the code
    model_band = model["band"] if model else "safe"

    # Scam: strong evidence
    if model_band == "scam":
        return "scam", False
    if {"lookalike", "ip_url"} & link_flags:
        return "scam", False
    if len(strong) >= 2:
        return "scam", False
    if strong and (weak or payment_flags or link_flags):
        return "scam", False
    if "urgency" in weak and payment_flags and {"shortener", "suspicious_tld"} & link_flags:
        return "scam", False  # pay urgently through a hidden or risky link

    # Suspicious: something needs checking
    unverified = receivers and any(r["status"] != "verified" or r["mismatch"] for r in receivers["results"])
    if strong or payment_flags or link_flags or unverified:
        return "suspicious", False

    # Only the word model is unsure: reassure if the message is a genuine OTP notice or uses only official links
    official_only = links["links"] and all(link["official"] for link in links["links"])
    if model_band == "suspicious" and not (OTP_NOTICE.search(message) or official_only):
        return "suspicious", False
    return "safe", model_band == "suspicious"


def _risk_score(verdict, model, tactic_ids, payment_flags, link_flags):
    """A 0..1 score that always agrees with the verdict band."""
    score = model["probability"] if model else 0.0
    score += 0.15 * len(tactic_ids & STRONG_TACTICS) + 0.05 * len(tactic_ids & WEAK_TACTICS)
    score += 0.25 * bool({"lookalike", "ip_url"} & link_flags) + 0.1 * bool(payment_flags)
    low, high = {"safe": (0.0, 0.29), "suspicious": (0.30, 0.69), "scam": (0.70, 1.0)}[verdict]
    return round(min(max(score, low), high), 2)


def check_message(message, check_payment_links=True, self_netloc=None):
    """Run every layer on one message and return the full result (nothing is stored).

    self_netloc: host:port of our own app, so links to our demo payment pages can be checked (see receiver.py).
    """
    message = (message or "").strip()[:MAX_MESSAGE_LENGTH]

    try:
        model = word_model.score(message)
    except FileNotFoundError:
        model = None  # the model has not been trained yet on this machine; the rule layers still work

    tactics = find_tactics(message)
    payments = find_payment_details(message, tactics)
    links = check_links(message, self_netloc)
    receivers = None
    if check_payment_links and payments["payment_links"]:
        receivers = check_receivers(message, payments["payment_links"], self_netloc)

    tactic_ids = {t["id"] for t in tactics}
    payment_flags = set(payments["flags"])
    link_flags = set(links["flags"])

    verdict, reassured = _decide(model, tactic_ids, payment_flags, link_flags, links, receivers, message)
    reasons = build_reasons(model, tactics, payments, links, receivers)
    if reassured:
        reasons.append("The word model was unsure, but this looks like a genuine notice (official link or a "
                       "'do not share this code' warning).")

    return {
        "verdict": verdict,
        "risk_score": _risk_score(verdict, model, tactic_ids, payment_flags, link_flags),
        "explanation": build_explanation(verdict, reasons),
        "reasons": reasons,
        "advice": build_advice(verdict, tactic_ids, payments["flags"], links["flags"],
                               receivers["advice"] if receivers else None),
        "layers": {
            "word_model": model,
            "tactics": tactics,
            "payments": payments,
            "links": links,
            "receivers": receivers,
        },
        "masked_message": mask(message),
    }

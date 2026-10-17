"""Privacy by design: mask personal data before anything is logged or sent to the explanation model.

Messages are never stored. Masking keeps only enough to recognise a value (e.g. the last 4 digits).
"""
import re

EMAIL = re.compile(r"\b[\w.+-]+@[\w-]+(?:\.[\w-]+)+\b")
# Malaysian IC number: 900101-14-5678
IC_NUMBER = re.compile(r"\b\d{6}-\d{2}-\d{4}\b")
# Phone numbers and account numbers: runs of 8+ digits, with optional dashes or spaces
LONG_NUMBER = re.compile(r"(?<![\d])\+?\d[\d\- ]{6,22}\d(?![\d])")


def _keep_last_four(match):
    text = match.group()
    digits_seen = 0
    out = []
    # Walk backwards so the last 4 digits stay visible and the rest become "*"
    for ch in reversed(text):
        if ch.isdigit():
            digits_seen += 1
            out.append(ch if digits_seen <= 4 else "*")
        else:
            out.append(ch)
    return "".join(reversed(out))


def mask(text):
    """Return the text with emails, IC numbers, phone and account numbers masked."""
    text = EMAIL.sub("[email]", text)
    text = IC_NUMBER.sub("[IC number]", text)
    return LONG_NUMBER.sub(lambda m: _keep_last_four(m) if sum(c.isdigit() for c in m.group()) >= 8 else m.group(), text)

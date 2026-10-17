"""Scam-tactic detector: finds the persuasion tricks a message uses (English and Malay).

The phrase lists live in data/scam_tactics/tactics.json, so they can be extended without changing code.
"""
import json
import re
from pathlib import Path

TACTICS_PATH = Path(__file__).resolve().parent.parent / "data" / "scam_tactics" / "tactics.json"

_tactics = None


def _phrase_pattern(phrase):
    # Whole words only: no letter directly before or after, so "pin" does not match inside "shopping".
    # Digits may follow, so "earn rm" still matches "earn rm300".
    return re.compile(r"(?<![a-z])" + re.escape(phrase) + r"(?![a-z])")


def load_tactics(path=TACTICS_PATH):
    """Load the tactic list once and pre-build one pattern per phrase."""
    global _tactics
    if _tactics is None:
        data = json.loads(Path(path).read_text(encoding="utf-8"))
        _tactics = []
        for tactic in data["tactics"]:
            phrases = tactic["phrases"]["en"] + tactic["phrases"]["ms"]
            patterns = [(p, _phrase_pattern(p)) for p in phrases]
            # Regular expressions for phrases with a changing part, e.g. "within 12 hours"
            patterns += [(None, re.compile(r"(?<![a-z])(?:" + p + r")(?![a-z])")) for p in tactic.get("patterns", [])]
            _tactics.append({
                "id": tactic["id"],
                "label": tactic["label"],
                "description": tactic["description"],
                "patterns": patterns,
            })
    return _tactics


def find_tactics(message):
    """Return the tactics found in a message, each with the phrases that matched."""
    text = message.lower()
    found = []
    for tactic in load_tactics():
        matches = []
        for phrase, pattern in tactic["patterns"]:
            hit = pattern.search(text)
            if hit:
                matches.append(phrase or hit.group())  # for a regex, show the text it matched
        if matches:
            found.append({
                "id": tactic["id"],
                "label": tactic["label"],
                "description": tactic["description"],
                "matches": matches,
            })
    return found

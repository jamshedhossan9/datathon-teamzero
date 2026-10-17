"""Plain-language explanation of a verdict.

Round 1: built from the findings with fixed sentences (works everywhere).
Round 2: IBM Granite on LinuxONE will write the explanation, with this as the fallback.
"""

VERDICT_TEXT = {
    "scam": "This message shows clear signs of a scam.",
    "suspicious": "Be careful: this message has warning signs.",
    "safe": "No warning signs found in this message.",
}

LINK_TEXT = {
    "lookalike": "a link that imitates {lookalike_of}",
    "ip_url": "a link that uses a raw IP address instead of a website name",
    "shortener": "a shortened link that hides where it really goes",
    "suspicious_tld": "a link with a domain ending often used in scams",
}


def build_reasons(model, tactics, payments, links, receivers):
    """List the findings as short, plain sentences."""
    reasons = []
    for t in tactics:
        reasons.append(f"{t['label']}: {t['description']} (found: {', '.join(t['matches'][:3])})")
    for link in links["links"]:
        for flag in link["flags"]:
            reasons.append("It contains " + LINK_TEXT[flag].format(lookalike_of=link["lookalike_of"]) + f": {link['url']}")
    if payments["bank_accounts"]:
        reasons.append("It asks you to pay into a bank account: " + ", ".join(payments["bank_accounts"]))
    if payments["ewallet_phones"]:
        reasons.append("It asks you to pay to a phone number (e-wallet): " + ", ".join(payments["ewallet_phones"]))
    if payments["payment_links"]:
        reasons.append("It contains a payment link.")
    if receivers:
        for r in receivers["results"]:
            if r["mismatch"]:
                reasons.append(f"It says it is from {receivers['claimed_sender']}, but the payment goes to {r['receiver']}.")
            elif r["status"] == "verified":
                reasons.append(f"The payment link pays {r['receiver']}.")
            else:
                reasons.append("We couldn't read who receives the payment link's money.")
    if model is not None and model["band"] != "safe":
        reasons.append(f"Its wording is similar to known spam messages (word model: {model['probability']:.0%}).")
    return reasons


def build_explanation(verdict, reasons):
    """A one-paragraph summary: the verdict plus the top reasons."""
    summary = VERDICT_TEXT[verdict]
    if reasons:
        summary += " " + " ".join(r.rstrip(".") + "." for r in reasons[:3])
    return {"summary": summary, "source": "rules"}

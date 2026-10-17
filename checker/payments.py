"""Payment-details warning: spots where a message asks you to send money.

This layer works even when every other layer says "safe": a copied real-looking bill with a swapped bank
account has no scam words, but it still asks you to pay a stranger.

Flags:
  payment_link    a link in a message that asks for payment, or a link that looks like a payment page
  bank_account    a 10-16 digit account number
  ewallet_phone   a Malaysian mobile number given as the payment destination
"""
import re

from .links import find_urls
from .tactics import find_tactics

# A link that looks like a payment or invoice page, even without payment words around it
PAYMENT_URL_WORDS = re.compile(r"pay|checkout|invoice|/inv|bill|bayar|toyyib|senangpay|duitnow|fpx", re.IGNORECASE)

# Runs of digits with optional dashes or spaces, e.g. "1234-5678-9012" or "012-345 6789"
DIGIT_RUN = re.compile(r"(?<![\d])(?:\+?6)?\d[\d\- ]{7,22}\d(?![\d])")

# Malaysian mobile numbers start with 01 (or +601 / 601)
MOBILE = re.compile(r"^(?:\+?60|0)1\d{8,9}$")
# Any other Malaysian phone number starts with 0 (landlines such as 03-...)
PHONE = re.compile(r"^(?:\+?60|0)\d{8,10}$")

# Words that show a phone number is where the money goes
EWALLET_WORDS = re.compile(r"e-?wallet|tng|touch ?'?n ?go|duitnow|boost|grabpay|transfer|bayar|pay|pindah", re.IGNORECASE)

WARNING = "This message asks you to pay. Confirm who you are paying before you send any money."


def find_payment_details(message, tactics=None):
    """Return the payment details in a message and, if there are any, the warning text."""
    if tactics is None:
        tactics = find_tactics(message)
    asks_for_payment = any(t["id"] == "payment_request" for t in tactics)

    payment_links = [url for url in find_urls(message) if asks_for_payment or PAYMENT_URL_WORDS.search(url)]

    bank_accounts = []
    ewallet_phones = []
    for match in DIGIT_RUN.finditer(message):
        raw = match.group().strip()
        digits = re.sub(r"\D", "", raw)
        if MOBILE.match(digits) or MOBILE.match("0" + digits):
            if asks_for_payment or EWALLET_WORDS.search(message):
                ewallet_phones.append(raw)
        elif PHONE.match(digits):
            continue  # a landline to call, not a payment destination
        elif 10 <= len(digits) <= 16:
            bank_accounts.append(raw)

    flags = []
    if payment_links:
        flags.append("payment_link")
    if bank_accounts:
        flags.append("bank_account")
    if ewallet_phones:
        flags.append("ewallet_phone")

    return {
        "payment_links": payment_links,
        "bank_accounts": bank_accounts,
        "ewallet_phones": ewallet_phones,
        "flags": flags,
        "warning": WARNING if flags else None,
    }

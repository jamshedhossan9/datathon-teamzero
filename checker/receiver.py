"""Payment-link receiver check: opens a payment link safely and reads who the money goes to.

Safety rules for fetching links from possibly malicious messages:
  - only http and https; a 5-second timeout; at most 200 KB read; at most 3 redirects
  - never runs the page's scripts (the page is read as text only)
  - refuses internal network addresses, except our own demo hosts (DEMO_HOSTS)
"""
import html
import ipaddress
import os
import re
import socket
import urllib.request
from urllib.parse import urlsplit

TIMEOUT_SECONDS = 5
MAX_BYTES = 200_000
MAX_REDIRECTS = 3

# Hosts allowed even though they are internal: our own machine, where the made-up demo payment pages run.
# On the VM, add its address with the environment variable CHECKER_DEMO_HOSTS (comma-separated).
DEMO_HOSTS = {"localhost", "127.0.0.1"} | {
    h.strip().lower() for h in os.environ.get("CHECKER_DEMO_HOSTS", "").split(",") if h.strip()
}

# "Pay to: Kedai Contoh Sdn Bhd" etc. The name must be on the same line as the label.
RECEIVER_PATTERN = re.compile(
    r"(?:pay to|payee|receiver|recipient|merchant|beneficiary|bayar kepada|penerima)[ \t]*[:\-][ \t]*([^\n|]{2,80})",
    re.IGNORECASE,
)

# A sender named at the start of a message: "Syarikat Elektrik Contoh: Your bill ..."
SENDER_AT_START = re.compile(r"^\s*([A-Z][\w&.' -]{2,40}?)\s*:")
# A company name anywhere: "... (Bank Contoh Sdn Bhd) ..."
COMPANY_NAME = re.compile(r"([A-Z][\w&.'-]*(?:\s+[A-Z][\w&.'-]*){0,4}\s+(?:Sdn\.?\s*Bhd\.?|Berhad|Bhd|Enterprise))")

# Words that say nothing about who a company is
GENERIC_WORDS = {"sdn", "bhd", "berhad", "enterprise", "the", "of", "and", "dan", "company", "syarikat", "co"}


class UnsafeLink(Exception):
    pass


def _check_host(url):
    """Refuse non-web links and internal addresses (except our own demo hosts)."""
    parts = urlsplit(url)
    if parts.scheme not in ("http", "https") or not parts.hostname:
        raise UnsafeLink("not a web link")
    host = parts.hostname.lower()
    if host in DEMO_HOSTS:
        return
    try:
        addresses = {info[4][0] for info in socket.getaddrinfo(host, parts.port or 80)}
    except socket.gaierror:
        raise UnsafeLink("the address does not exist")
    for address in addresses:
        if not ipaddress.ip_address(address).is_global:
            raise UnsafeLink("internal network address")


class _SafeRedirects(urllib.request.HTTPRedirectHandler):
    max_redirections = MAX_REDIRECTS

    def redirect_request(self, req, fp, code, msg, headers, newurl):
        _check_host(newurl)  # every hop must be safe too
        return super().redirect_request(req, fp, code, msg, headers, newurl)


_opener = urllib.request.build_opener(_SafeRedirects)


def fetch_page_text(url):
    """Download a page safely and return its visible text (scripts and styles removed, never run)."""
    if "://" not in url:
        url = "http://" + url  # a bare link such as "pay.example.xyz/inv"
    _check_host(url)
    request = urllib.request.Request(url, headers={"User-Agent": "TeamZero-ScamChecker/1.0"})
    with _opener.open(request, timeout=TIMEOUT_SECONDS) as response:
        content_type = response.headers.get("Content-Type", "")
        if "html" not in content_type and "text" not in content_type:
            raise UnsafeLink("not a web page")
        raw = response.read(MAX_BYTES).decode("utf-8", errors="replace")
    raw = re.sub(r"(?is)<(script|style)\b.*?</\1>", " ", raw)  # drop scripts and styles without running them
    raw = re.sub(r"(?is)<!--.*?-->", " ", raw)
    raw = re.sub(r"(?i)<(br|/p|/div|/h\d|/li|/tr|/title)\b[^>]*>", "\n", raw)  # keep line breaks
    text = html.unescape(re.sub(r"<[^>]+>", " ", raw))
    return "\n".join(" ".join(line.split()) for line in text.splitlines() if line.strip())


def find_receiver(page_text):
    """Return the receiver's name written on a payment page, or None."""
    match = RECEIVER_PATTERN.search(page_text)
    return match.group(1).strip(" .") if match else None


def find_claimed_sender(message):
    """Return the organisation a message says it comes from, or None."""
    match = SENDER_AT_START.match(message) or COMPANY_NAME.search(message)
    return match.group(1).strip() if match else None


def _key_words(name):
    return {w for w in re.findall(r"[a-z0-9]+", name.lower()) if w not in GENERIC_WORDS}


def _local_url(url, self_netloc):
    """A link to our own server (e.g. http://<VM IP>:38889/pay/...) is fetched through 127.0.0.1,
    because a machine cannot always reach itself through its public address."""
    if self_netloc and "://" in url:
        parts = urlsplit(url)
        if parts.netloc.lower() == self_netloc.lower():
            port = parts.port or 80
            return parts._replace(netloc=f"127.0.0.1:{port}").geturl()
    return url


def check_receivers(message, payment_links, self_netloc=None):
    """Check up to 2 payment links: who receives the money, and does it match who the message claims to be?

    self_netloc: the host:port our own app is served on, so links to our demo pages can be fetched locally.
    """
    sender = find_claimed_sender(message)
    results = []
    for url in payment_links[:2]:
        try:
            receiver = find_receiver(fetch_page_text(_local_url(url, self_netloc)))
            if receiver:
                mismatch = bool(sender) and not (_key_words(sender) & _key_words(receiver))
                results.append({"url": url, "status": "verified", "receiver": receiver, "mismatch": mismatch})
            else:
                results.append({"url": url, "status": "unverified", "receiver": None, "mismatch": False,
                                "reason": "no receiver name readable on the page"})
        except UnsafeLink as error:
            results.append({"url": url, "status": "blocked", "receiver": None, "mismatch": False, "reason": str(error)})
        except Exception as error:  # timeouts, connection errors, bad pages
            results.append({"url": url, "status": "unverified", "receiver": None, "mismatch": False,
                            "reason": type(error).__name__})
    return {"claimed_sender": sender, "results": results, "advice": _advice(sender, results)}


def _advice(sender, results):
    for r in results:
        if r["mismatch"]:
            return (f"This message says it is from {sender}, but the payment goes to {r['receiver']}. "
                    "Do not pay until you confirm with the organisation directly.")
    for r in results:
        if r["status"] == "verified":
            return f"This payment goes to {r['receiver']}. Is this who you meant to pay?"
    if results:
        return "We couldn't verify who receives this payment. Be extra careful before paying."
    return None

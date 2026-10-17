"""Link checker: finds the links in a message and flags warning signs. No outside service is called.

Flags per link:
  ip_url          the link uses a raw IP address instead of a name
  shortener       a link-shortening service hides the real destination
  suspicious_tld  the domain ending is often abused in scams
  lookalike       the domain imitates a real Malaysian bank, e-wallet or organisation
"""
import ipaddress
import re
from pathlib import Path
from urllib.parse import urlsplit

LINK_DIR = Path(__file__).resolve().parent.parent / "data" / "link_check"

URL_PATTERN = re.compile(r"(?:https?://|www\.)[^\s<>\"']+", re.IGNORECASE)

# Links written without http:// or www., e.g. "maybank2u-login.top/verify"
BARE_DOMAIN_PATTERN = re.compile(r"(?<![\w@./-])(?:[a-z0-9-]+\.)+([a-z]{2,})(?:/[^\s<>\"']*)?", re.IGNORECASE)
# Only count a bare "word.word" as a link when it ends in a real domain ending (so "Mr.Smith" is not a link)
COMMON_TLDS = {"com", "net", "org", "my", "co", "info", "biz", "io", "app", "link", "me", "asia", "gov", "edu"}

# Characters scammers swap in to make a domain look real ("rn" looks like "m", "0" like "o")
HOMOGLYPHS = [("rn", "m"), ("vv", "w"), ("0", "o"), ("1", "l"), ("3", "e"), ("5", "s"), ("@", "a")]

_lists = None


def _read_list(name):
    lines = (LINK_DIR / name).read_text(encoding="utf-8").splitlines()
    return [line.strip().lower() for line in lines if line.strip() and not line.strip().startswith("#")]


def load_lists():
    """Load the domain lists once."""
    global _lists
    if _lists is None:
        legit = _read_list("legit_domains.txt")
        _lists = {
            "legit": legit,
            # The brand part of each real domain, e.g. "maybank2u" from "maybank2u.com.my"
            "brands": {domain: domain.split(".")[0] for domain in legit},
            "shorteners": set(_read_list("shorteners.txt")),
            "tlds": set(_read_list("suspicious_tlds.txt")),
        }
    return _lists


def find_urls(message):
    """Return the links in a message (with or without http://), without trailing punctuation."""
    urls = [url.rstrip(".,;:!?)]}") for url in URL_PATTERN.findall(message)]
    # Remove the full links first, so their parts are not found again as bare domains
    rest = URL_PATTERN.sub(" ", message)
    known_tlds = COMMON_TLDS | load_lists()["tlds"]
    for match in BARE_DOMAIN_PATTERN.finditer(rest):
        if match.group(1).lower() in known_tlds:
            urls.append(match.group().rstrip(".,;:!?)]}"))
    return urls


def _host(url):
    if not re.match(r"https?://", url, re.IGNORECASE):
        url = "http://" + url
    host = (urlsplit(url).hostname or "").lower()
    return host[4:] if host.startswith("www.") else host


def _is_ip(host):
    try:
        ipaddress.ip_address(host)
        return True
    except ValueError:
        return False


def _normalise(text):
    for fake, real in HOMOGLYPHS:
        text = text.replace(fake, real)
    return text


def _one_edit_apart(a, b):
    """True if a and b differ by exactly one letter added, removed or changed."""
    if a == b or abs(len(a) - len(b)) > 1:
        return False
    if len(a) == len(b):
        return sum(x != y for x, y in zip(a, b)) == 1
    short, long_ = (a, b) if len(a) < len(b) else (b, a)
    return any(long_[:i] + long_[i + 1:] == short for i in range(len(long_)))


def _lookalike_of(host, lists):
    """Return the real domain this host imitates, or None."""
    labels = host.split(".")
    normalised = _normalise(host)
    for domain, brand in lists["brands"].items():
        if len(brand) < 3:
            continue
        if len(brand) >= 5 and brand in normalised:
            return domain  # brand name (or a disguised copy) inside an unofficial domain
        if brand in labels:
            return domain  # e.g. "tnb.com.co" or "pos.my-delivery.top"
        if len(brand) >= 6 and _one_edit_apart(labels[0], brand):
            return domain  # one letter off, e.g. "maybamk2u"
    return None


def check_link(url, self_host=None):
    """Check one link and return its findings. self_host: our own server's address (demo pages), never flagged."""
    lists = load_lists()
    host = _host(url)
    official = any(host == d or host.endswith("." + d) for d in lists["legit"]) or (bool(self_host) and host == self_host)
    flags = []
    lookalike = None
    if host and not official:
        if _is_ip(host):
            flags.append("ip_url")
        if host in lists["shorteners"]:
            flags.append("shortener")
        if host.rsplit(".", 1)[-1] in lists["tlds"]:
            flags.append("suspicious_tld")
        lookalike = _lookalike_of(host, lists)
        if lookalike:
            flags.append("lookalike")
    return {"url": url, "host": host, "official": official, "flags": flags, "lookalike_of": lookalike}


def check_links(message, self_netloc=None):
    """Check every link in a message. Returns the per-link results and all flags together.

    self_netloc: host:port of our own app; links to it (the demo payment pages) are treated as official.
    """
    self_host = self_netloc.split(":")[0].lower() if self_netloc else None
    links = [check_link(url, self_host) for url in find_urls(message)]
    flags = sorted({flag for link in links for flag in link["flags"]})
    return {"links": links, "flags": flags}

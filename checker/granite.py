"""Granite explanation (step 407): IBM Granite, running on LinuxONE, explains the verdict in plain words.

The rule layers decide the verdict; Granite only explains it. The model in IBM's image is a small *base*
(text-continuation) model, so the prompt shows two worked examples for it to follow, and every answer is
checked. If Granite is missing, slow to load, or writes something unusable, the rules-based explanation is used.
"""
import os
import re
import sys
import threading
from pathlib import Path

from .privacy import mask

# In IBM's Jupyter image the model file sits in the home folder (/home/ibm-user)
MODEL_PATH = Path(os.environ.get("GRANITE_MODEL_PATH", Path.home() / "granite-4.0-h-350m-base-be.f16.gguf"))

PROMPT = """Below, a scam checker explains its verdict to an elderly person in two short, simple sentences.

Message: Congratulations! You won RM5,000. Click bit.ly/x9 to claim your prize.
Verdict: scam
Findings: prize you did not ask for; shortened link
Explanation: This message promises a prize you never entered for, which is a common scam trick. The short link hides where it really goes, so do not click it.

Message: Dear customer, your bill for October is RM120.50. Please pay to account ****-****-4321 by Friday.
Verdict: suspicious
Findings: payment request; bank account to pay into
Explanation: This message asks you to pay into a bank account that we cannot verify. Check with the company using a phone number you already trust before you pay.

Message: Hi mum, I'll be home by 7. Can you keep some rice for me?
Verdict: safe
Findings: none
Explanation: This looks like a normal personal message. It does not ask for money, codes or clicks.

Message: {message}
Verdict: {verdict}
Findings: {findings}
Explanation:"""

LINK_WORDS = {
    "lookalike": "link imitating a real organisation",
    "ip_url": "link using a raw IP address",
    "shortener": "shortened link",
    "suspicious_tld": "risky website ending",
}
PAYMENT_WORDS = {
    "payment_link": "payment link",
    "bank_account": "bank account to pay into",
    "ewallet_phone": "phone number to pay to",
}

_model = None
_state = "not loaded"  # "not loaded" -> "loading" -> "ready" or "unavailable"
_load_lock = threading.Lock()
_generate_lock = threading.Lock()  # the model must answer one request at a time


def status():
    return _state


def load():
    """Load Granite once. Safe to call from a background thread at start-up."""
    global _model, _state
    with _load_lock:
        if _state in ("ready", "unavailable"):
            return _model
        _state = "loading"
        try:
            from llama_cpp import Llama  # only installed in IBM's LinuxONE image

            if not MODEL_PATH.is_file():
                raise FileNotFoundError(MODEL_PATH)
            _model = Llama(model_path=str(MODEL_PATH), n_ctx=1024, n_threads=min(os.cpu_count() or 1, 3), verbose=False)
            _state = "ready"
        except Exception:
            _model, _state = None, "unavailable"
        return _model


def load_in_background():
    threading.Thread(target=load, daemon=True).start()


def findings_text(result):
    """Short phrases describing what the layers found, for the prompt."""
    layers = result["layers"]
    parts = [t["label"].lower() for t in layers["tactics"]]
    parts += [PAYMENT_WORDS[f] for f in layers["payments"]["flags"]]
    parts += [LINK_WORDS[f] for f in layers["links"]["flags"]]
    receivers = layers["receivers"]
    if receivers:
        for r in receivers["results"]:
            if r["mismatch"]:
                parts.append(f"says it is from {receivers['claimed_sender']} but the money goes to {r['receiver']}")
            elif r["receiver"]:
                parts.append(f"the money goes to {r['receiver']}")
            else:
                parts.append("the receiver of the payment could not be checked")
    return "; ".join(parts) or "none"


def build_prompt(message, result):
    one_line = " ".join(mask(message).split())[:400]  # personal data masked before it reaches the model
    return PROMPT.format(message=one_line, verdict=result["verdict"], findings=findings_text(result))


def clean(text, verdict):
    """Keep at most 2 distinct sentences; return None if the answer is unusable."""
    sentences, seen = [], []
    for sentence in re.split(r"(?<=[.!?])\s+", text.strip()):
        words = set(re.findall(r"[a-z]+", sentence.lower()))
        if len(words) < 3:
            continue
        # Skip a sentence that mostly repeats an earlier one ("This is a scam. The message is a scam.")
        if any(len(words & w) / len(words | w) >= 0.5 for w in seen):
            continue
        seen.append(words)
        sentences.append(sentence.strip())
        if len(sentences) == 2:
            break
    answer = " ".join(sentences)
    if len(answer) < 25:
        return None
    if not answer.endswith((".", "!", "?")):
        answer += "."
    lowered = answer.lower()
    # Reject answers that contradict the verdict the rules decided
    if verdict != "safe" and re.search(r"\b(safe|normal|genuine)\b", lowered) and "not safe" not in lowered:
        return None
    if verdict == "safe" and re.search(r"\bscam\b", lowered) and not re.search(r"\bnot (a )?scam\b", lowered):
        return None
    if verdict == "suspicious" and re.search(r"\b(is|this is) (a|definitely a) scam\b", lowered):
        return None  # "suspicious" means "check first", not a confirmed scam
    return answer


def explain(message, result, model=None):
    """Return {"text", "source": "granite"} or None if Granite is not available or its answers are unusable.

    Tries twice: a careful first attempt, then a slightly more varied one if the first answer is rejected.
    """
    model = model or (load() if _state != "unavailable" else None)
    if model is None:
        return None
    prompt = build_prompt(message, result)
    for attempt, temperature in enumerate((0.2, 0.6), start=1):
        with _generate_lock:
            out = model(
                prompt,
                max_tokens=70,
                temperature=temperature,
                top_p=0.9,
                repeat_penalty=1.3,
                stop=["\n", "Message:", "Verdict:"],
            )
        text = clean(out["choices"][0]["text"], result["verdict"])
        if text:
            return {"text": text, "source": "granite"}
        # Only a note, never the message or the answer: messages are not logged
        print(f"granite: answer rejected by the quality check (attempt {attempt})", file=sys.stderr, flush=True)
    return None

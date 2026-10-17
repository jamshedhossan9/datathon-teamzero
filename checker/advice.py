"""Plain advice for the user, based on what the checker found (includes Semak Mule and NSRC 997)."""

SEMAK_MULE = ("Check the account or phone number at PDRM Semak Mule (semakmule.rmp.gov.my). A report there is "
              "strong evidence of fraud; no report does not prove it is safe.")
NSRC_997 = ("Already paid or shared your details? Call the National Scam Response Centre at 997 immediately, "
            "then your bank.")


def build_advice(verdict, tactic_ids, payment_flags, link_flags, receiver_advice):
    """Return a short list of things the user should do, most important first."""
    advice = []
    if verdict == "scam":
        advice.append("Do not reply, click any link, or call any number in this message.")
    if "credentials" in tactic_ids and verdict != "safe":
        advice.append("Never share an OTP, TAC, PIN or password. No bank, police or government office will ask for it.")
    if {"lookalike", "ip_url"} & set(link_flags):
        advice.append("Do not open the link. If you need the service, type its official website address yourself.")
    if receiver_advice:
        advice.append(receiver_advice)
    if payment_flags:
        advice.append("Confirm who you are paying before you send any money: contact the organisation using a number "
                      "you already trust, not one from this message.")
        advice.append(SEMAK_MULE)
    if verdict == "scam" or payment_flags:
        advice.append(NSRC_997)
    if not advice:
        advice.append("No warning signs found. Still be careful with any unexpected request for money or codes.")
    return advice

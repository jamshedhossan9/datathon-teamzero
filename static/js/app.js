// Landing page: check a pasted message.

const EXAMPLES = {
  normal: "Hi mum, I'll be home by 7. Can you keep some rice for me?",
  scam: "Pegawai bank di sini. Akaun anda akan disekat. Sila kongsi kod pengesahan yang dihantar ke telefon anda segera.",
  bill: `Syarikat Elektrik Contoh: Your electricity bill for September is RM84.20. Pay here: ${location.origin}/pay/mismatch`,
};

const form = document.getElementById("check-form");
const input = document.getElementById("message");
const button = document.getElementById("check-button");
const output = document.getElementById("result");

document.querySelectorAll("[data-example]").forEach((btn) => {
  btn.addEventListener("click", () => {
    input.value = EXAMPLES[btn.dataset.example];
    input.focus();
  });
});

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  const message = input.value.trim();
  if (!message) return;
  button.disabled = true;
  button.textContent = "Checking…";
  try {
    renderResult(output, await checkMessage(message));
  } catch (error) {
    output.className = "card";
    output.textContent = `Sorry, the check failed: ${error.message}`;
  } finally {
    button.disabled = false;
    button.textContent = "Check message";
    output.scrollIntoView({ behavior: "smooth", block: "start" });
  }
});

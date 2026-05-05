import { EmailService } from "./src/utils/email.service";
import { env } from "./src/config/env";

async function diagnoseEmail() {
  console.log("Starting Email Diagnosis...");
  console.log("SMTP Host:", env.SMTP_HOST);
  console.log("SMTP Port:", env.SMTP_PORT);
  console.log("SMTP User defined:", !!env.SMTP_USER);
  console.log("SMTP Pass defined:", !!env.SMTP_PASS);
  console.log("From Email:", env.FROM_EMAIL);

  try {
    // Attempting to send a test email if USER and PASS are present
    if (env.SMTP_USER && env.SMTP_PASS) {
      console.log("Attempting to send a test email to the configured user...");
      await EmailService.sendAmbassadorWelcomeEmail(
        env.SMTP_USER,
        "Test",
        "User"
      );
      console.log("✅ Test email sent successfully!");
    } else {
      console.log(
        "❌ SMTP_USER or SMTP_PASS is missing. Email cannot be sent."
      );
    }
  } catch (error) {
    console.error("❌ Email diagnosis failed:", error);
  }
}

diagnoseEmail();

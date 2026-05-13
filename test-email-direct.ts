import { EmailService } from "./src/utils/email.service";
import { env } from "./src/config/env";

async function test() {
  console.log("Testing email sending to mustapha.it@nextif.org...");
  try {
    await EmailService.sendOtpEmail("mustapha.it@nextif.org", "Mustapha", "123456");
    console.log("✅ Test email sent!");
  } catch (error) {
    console.error("❌ Test email failed:", error);
  }
}

test();

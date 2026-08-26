import { verifyEmailTransport } from "./services/emailService.js";

async function main() {
  try {
    await verifyEmailTransport();
    console.log("SMTP connection verified successfully");
  } catch (error) {
    console.error("SMTP connection verification failed:", error);
    process.exitCode = 1;
  }
}

void main();

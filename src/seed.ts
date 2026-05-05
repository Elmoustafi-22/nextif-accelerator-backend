import mongoose from "mongoose";
import dotenv from "dotenv";
import Admin from "./modules/admin/admin.model";
import { hashPassword } from "./utils/password";
import { EmailService } from "./utils/email.service";

dotenv.config();

const seedAdmin = async () => {
  const args = process.argv.slice(2);
  const [email, firstName, lastName, title] = args;

  if (!email || !firstName || !lastName || !title) {
    console.error(
      "Usage: npx ts-node src/seed.ts <email> <firstName> <lastName> <position>"
    );
    console.error(
      'Example: npx ts-node src/seed.ts "admin@nextif.com" "John" "Doe" "Manager"'
    );
    process.exit(1);
  }

  try {
    const mongoUri =
      process.env.MONGODB_URI || "mongodb://localhost:27017/nextif-ambassador";
    await mongoose.connect(mongoUri);
    console.log("Connected to MongoDB for seeding...");

    const adminExists = await Admin.findOne({ email: email.toLowerCase() });
    if (adminExists) {
      console.log(`❌ Admin with email ${email} already exists.`);
      return;
    }

    // Pre-loaded admin uses a dummy password and is forced to reset on first login
    const dummyPassword = await hashPassword("INITIAL_LOGIN_ONLY");

    await Admin.create({
      firstName,
      lastName,
      title,
      email: email.toLowerCase(),
      password: dummyPassword,
      role: "ADMIN",
      passwordSet: false,
      accountStatus: "PRELOADED",
    });

    // Send Welcome Email
    try {
      await EmailService.sendAdminWelcomeEmail(
        email.toLowerCase(),
        firstName,
        lastName
      );
      console.log("📧 Welcome email sent to admin via Brevo API.");
    } catch (error) {
      console.error("❌ Failed to send welcome email to admin:", error);
    }

    console.log("✅ Pre-loaded Admin created successfully:");
    console.log(`Email: ${email}`);
    console.log(`Name: ${firstName} ${lastName}`);
    console.log(`Position: ${title}`);
    console.log(
      `\nNext Step: Log in via "First time logging in?" using Email and Last Name.`
    );
  } catch (error) {
    console.error("Error seeding admin:", error);
  } finally {
    await mongoose.disconnect();
    console.log("Disconnected.");
    process.exit(0);
  }
};

seedAdmin();

import mongoose from "mongoose";
import dotenv from "dotenv";
import Ambassador from "./modules/ambassador/ambassador.model";
import { hashPassword } from "./utils/password";
import { EmailService } from "./utils/email.service";

dotenv.config();

const seedAmbassador = async () => {
  const args = process.argv.slice(2);
  const [email, firstName, lastName, institution, courseOfStudy] = args;

  if (!email || !firstName || !lastName || !institution || !courseOfStudy) {
    console.error(
      "Usage: npx ts-node src/seed-ambassadors.ts <email> <firstName> <lastName> <institution> <courseOfStudy>"
    );
    console.error(
      'Example: npx ts-node src/seed-ambassadors.ts "ambassador@nextif.com" "Alice" "Smith" "Lagos State University" "Computer Science"'
    );
    process.exit(1);
  }

  try {
    const mongoUri =
      process.env.MONGODB_URI || 
      process.env.MONGO_URI || 
      "mongodb://localhost:27017/nextif-ambassador";
    
    console.log("Attempting to connect to database...");
    await mongoose.connect(mongoUri);
    console.log("Connected to MongoDB for seeding...");

    const exists = await Ambassador.findOne({ email: email.toLowerCase() });
    if (exists) {
      console.log(`❌ Ambassador with email ${email} already exists.`);
      return;
    }

    // Pre-loaded ambassadors use a dummy password and are forced to reset on first login
    const dummyPassword = await hashPassword("INITIAL_LOGIN_ONLY");

    const ambassador = await Ambassador.create({
      firstName,
      lastName,
      email: email.toLowerCase(),
      password: dummyPassword,
      role: "AMBASSADOR",
      passwordSet: false,
      accountStatus: "PRELOADED",
      profile: {
        institution,
        courseOfStudy,
      },
    });

    // Send Welcome Email
    try {
      await EmailService.sendAmbassadorWelcomeEmail(
        email.toLowerCase(),
        firstName,
        lastName
      );
      console.log("📧 Welcome email sent via Brevo API.");
    } catch (error) {
      console.error("❌ Failed to send welcome email:", error);
    }

    console.log("✅ Pre-loaded Ambassador created successfully:");
    console.log(`Email: ${email}`);
    console.log(`Name: ${firstName} ${lastName}`);
    console.log(`Institution: ${institution}`);
    console.log(`Course: ${courseOfStudy}`);
    console.log(
      `\nNext Step: Log in via "First time logging in?" using Email and Last Name (${lastName}).`
    );
  } catch (error) {
    console.error("Error seeding ambassador:", error);
  } finally {
    await mongoose.disconnect();
    console.log("Disconnected.");
    process.exit(0);
  }
};

seedAmbassador();

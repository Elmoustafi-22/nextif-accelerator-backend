import mongoose from "mongoose";
import dotenv from "dotenv";
import Admin from "./src/modules/admin/admin.model";

dotenv.config();

async function checkAdmin(email: string) {
  try {
    const mongoUri = process.env.MONGODB_URI;
    if (!mongoUri) throw new Error("MONGODB_URI not defined");
    
    await mongoose.connect(mongoUri);
    console.log("Connected to MongoDB...");

    const admin = await Admin.findOne({ email: email.toLowerCase().trim() });
    if (admin) {
      console.log(`✅ Admin found: ${admin.firstName} ${admin.lastName}`);
      console.log(`Email: ${admin.email}`);
      console.log(`Account Status: ${admin.accountStatus}`);
      console.log(`Password Set: ${admin.passwordSet}`);
    } else {
      console.log(`❌ No admin found with email: ${email}`);
    }
  } catch (error) {
    console.error("Error:", error);
  } finally {
    await mongoose.disconnect();
  }
}

const emailToCheck = process.argv[2] || "mustapha.it@nextif.org";
checkAdmin(emailToCheck);

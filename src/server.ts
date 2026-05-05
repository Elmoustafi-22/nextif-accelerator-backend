import app from "./app";
import { config } from "dotenv";
import connectDB from "./config/db";

config();

const PORT = process.env.PORT || 5000;

const startServer = async () => {
    try {
        await connectDB();
    } catch (error) {
        console.error("Database connection failed", error);
        // Continue to start server even if DB fails, for testing
    }

    app.listen(PORT, () => {
        console.log(`Server is now running on http://localhost:${PORT}`);
    });
}

startServer();
import "dotenv/config";
import app from "./app.js";
import { prisma } from "./db/prisma.js";
const PORT = process.env.PORT || 8000;
const startServer = async () => {
    try {
        // Check Database connection
        await prisma.$connect();
        console.log("✅ Successfully connected to Supabase PostgreSQL.");
        const server = app.listen(PORT, () => {
            console.log(`🚀 Library Attendance Backend listening actively on http://localhost:${PORT}`);
        });
        // Graceful Shutdown
        process.on("SIGTERM", async () => {
            console.log("SIGTERM signal received: closing HTTP server");
            server.close(async () => {
                console.log("HTTP server closed");
                await prisma.$disconnect();
                process.exit(0);
            });
        });
    }
    catch (error) {
        console.error("❌ Failed to start the server:", error);
        await prisma.$disconnect();
        process.exit(1);
    }
};
startServer();
//# sourceMappingURL=server.js.map
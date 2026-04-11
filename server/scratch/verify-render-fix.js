import nodemailer from "nodemailer";
import dotenv from "dotenv";
dotenv.config();

// Logic to check if timeouts are correctly set in the transporter
const transporter = nodemailer.createTransport({
  host: "example.com",
  port: 587,
  secure: false,
  auth: { user: "test", pass: "test" },
  connectionTimeout: 10000,
  greetingTimeout: 10000,
  socketTimeout: 15000,
});

console.log("Connection Timeout:", transporter.options.connectionTimeout);
console.log("Greeting Timeout:", transporter.options.greetingTimeout);
console.log("Socket Timeout:", transporter.options.socketTimeout);

if (transporter.options.connectionTimeout === 10000 && 
    transporter.options.greetingTimeout === 10000 && 
    transporter.options.socketTimeout === 15000) {
    console.log("VERIFICATION SUCCESS: Timeouts correctly configured.");
} else {
    console.log("VERIFICATION FAILED: Timeouts missing or incorrect.");
    process.exit(1);
}

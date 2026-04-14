import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyCTdUVmqg61WXXdxA4dWD-vhpXuIbFl2O8",
  authDomain: "smart-libraries.firebaseapp.com",
  projectId: "smart-libraries",
  storageBucket: "smart-libraries.firebasestorage.app",
  messagingSenderId: "801908786317",
  appId: "1:801908786317:web:faeec3324e2c265976cec4",
  measurementId: "G-QBT9EK5F92"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export default app;

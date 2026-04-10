import { Router } from "express";
import { createStudent, getStudents, updateStudent } from "../controllers/student.controller.js";
import { authenticate, requireVerified } from "../middlewares/auth.middleware.js";
const router = Router();
// Used for admin specific routes. Admins must be fully verified and authenticated.
router.use(authenticate, requireVerified);
router.post("/", createStudent); // Creates the User and Student mapping
router.get("/", getStudents); // Returns all students mapping
router.put("/:id", updateStudent); // Updates a student profile
export default router;
//# sourceMappingURL=student.routes.js.map
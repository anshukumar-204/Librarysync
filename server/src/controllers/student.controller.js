import { prisma } from "../db/prisma.js";
import { hashPassword } from "../utils/security.js";
// Basic Student creation handler (Admin feature)
export const createStudent = async (req, res) => {
    try {
        // Only Admin can create students
        if (req.user?.role !== "admin") {
            return res.status(403).json({ success: false, message: "Forbidden: Admin access required" });
        }
        const { fullName, fatherName, mobile, email, address, city, state, pincode } = req.body;
        if (!fullName || !mobile) {
            return res.status(400).json({ success: false, message: "Full Name and Mobile are required" });
        }
        // Default password as mobile number
        const defaultPassword = await hashPassword(mobile);
        // Create the User profile AND attached Student profile transactionally
        const newStudent = await prisma.user.create({
            data: {
                name: fullName,
                mobile,
                email: email || null,
                passwordHash: defaultPassword,
                role: "student",
                student: {
                    create: {
                        fullName,
                        fatherName,
                        address,
                        city,
                        state,
                        pincode
                    }
                }
            },
            include: {
                student: true
            }
        });
        return res.status(201).json({
            success: true,
            message: "Student profile securely created",
            data: newStudent.student
        });
    }
    catch (error) {
        console.error("Error creating student:", error);
        if (error.code === 'P2002') {
            return res.status(400).json({ success: false, message: "Mobile number or Email already exists" });
        }
        return res.status(500).json({ success: false, message: "Server error occurred" });
    }
};
export const getStudents = async (req, res) => {
    try {
        if (req.user?.role !== "admin") {
            return res.status(403).json({ success: false, message: "Forbidden: Admin access required" });
        }
        const students = await prisma.student.findMany({
            include: {
                user: {
                    select: {
                        mobile: true,
                        email: true,
                        status: true
                    }
                }
            },
            orderBy: { joinDate: 'desc' }
        });
        return res.json({ success: true, data: students });
    }
    catch (error) {
        return res.status(500).json({ success: false, message: "Server error occurred" });
    }
};
export const updateStudent = async (req, res) => {
    try {
        if (req.user?.role !== "admin") {
            return res.status(403).json({ success: false, message: "Forbidden: Admin access required" });
        }
        const studentId = Number(req.params.id);
        const { fullName, fatherName, mobile, email, address, city, state, pincode, status } = req.body;
        // Check if student exists
        const existingStudent = await prisma.student.findUnique({ where: { id: studentId } });
        if (!existingStudent) {
            return res.status(404).json({ success: false, message: "Student not found" });
        }
        // Update Transaction
        const updatedUser = await prisma.user.update({
            where: { id: existingStudent.userId },
            data: {
                name: fullName,
                ...(mobile && { mobile }),
                ...(email !== undefined && { email }),
                ...(status && { status }),
                student: {
                    update: {
                        fullName,
                        fatherName,
                        address,
                        city,
                        state,
                        pincode
                    }
                }
            },
            include: {
                student: true
            }
        });
        return res.json({
            success: true,
            message: "Student profile updated successfully",
            data: updatedUser.student
        });
    }
    catch (error) {
        console.error("Error updating student:", error);
        if (error.code === 'P2002') {
            return res.status(400).json({ success: false, message: "Mobile number or Email already in use by another account" });
        }
        return res.status(500).json({ success: false, message: "Server error occurred" });
    }
};
//# sourceMappingURL=student.controller.js.map
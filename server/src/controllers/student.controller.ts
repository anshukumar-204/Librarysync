import type { Request, Response } from "express";
import { prisma } from "../db/prisma.js";
import { hashPassword } from "../utils/security.js";

// Basic Student creation handler (Admin feature)
export const createStudent = async (req: Request, res: Response) => {
  try {
    // Only Admin can create students (Temporarily disabled for testing)
    /* if (req.user?.role !== "admin") {
      return res.status(403).json({ success: false, message: "Forbidden: Admin access required" });
    } */

    const { 
      fullName, fatherName, profileImage, mobile, email, 
      address, village, post, district, city, state, pincode 
    } = req.body;

    // MANDATORY CHANGE: Only Mobile and Email are strictly required for Admin
    if (!mobile || !email) {
      return res.status(400).json({ success: false, message: "Registry creation requires both Mobile and Email nodes." });
    }

    // Default password as mobile number
    const defaultPassword = await hashPassword(mobile);

    // Create the User profile AND attached Student profile transactionally
    const newStudent = await prisma.user.create({
      data: {
        name: fullName || "New Student",
        mobile,
        email: email || null,
        passwordHash: defaultPassword,
        role: "student",
        student: {
          create: {
            fullName: fullName || "New Student",
            fatherName: fatherName || null,
            profileImage: profileImage || null,
            address: address || null,
            village: village || null,
            post: post || null,
            district: district || null,
            city: city || null,
            state: state || null,
            pincode: pincode || null
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
      data: {
        ...newStudent.student,
        user: {
          mobile: newStudent.mobile,
          email: newStudent.email,
          status: newStudent.status
        }
      }
    });

  } catch (error: any) {
    console.error("CRITICAL REGISTRY ERROR:", error);
    if (error.code === 'P2002') {
      return res.status(400).json({ success: false, message: "Duplicate Entity: Mobile number or Email already exists in the registry" });
    }
    // Return the specific error message in development for faster debugging
    return res.status(500).json({ 
      success: false, 
      message: "Registry Node Failure", 
      error: error.message,
      code: error.code,
      meta: error.meta 
    });
  }
};

export const getStudents = async (req: Request, res: Response) => {
  try {
    /* if (req.user?.role !== "admin") {
      return res.status(403).json({ success: false, message: "Forbidden: Admin access required" });
    } */

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
  } catch (error) {
    return res.status(500).json({ success: false, message: "Server error occurred" });
  }
};

export const updateStudent = async (req: Request, res: Response) => {
  try {
    /* if (req.user?.role !== "admin") {
      return res.status(403).json({ success: false, message: "Forbidden: Admin access required" });
    } */

    const studentId = Number(req.params.id);
    const { 
      fullName, fatherName, profileImage, mobile, email, 
      address, village, post, district, city, state, pincode, status 
    } = req.body;

    // MANDATORY CHANGE: Only Mobile and Email are strictly required for Admin
    if (!mobile || !email) {
      return res.status(400).json({ success: false, message: "Update aborted: Mobile and Email nodes are mandatory." });
    }

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
            profileImage,
            address,
            village,
            post,
            district,
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
      data: {
        ...updatedUser.student,
        user: {
          mobile: updatedUser.mobile,
          email: updatedUser.email,
          status: updatedUser.status
        }
      }
    });

  } catch (error: any) {
    console.error("Error updating student:", error);
    if (error.code === 'P2002') {
      return res.status(400).json({ success: false, message: "Mobile number or Email already in use by another account" });
    }
    return res.status(500).json({ success: false, message: "Server error occurred" });
  }
};

export const updateDailyGoal = async (req: Request, res: Response) => {
  try {
    const { dailyGoalHours } = req.body;
    if (dailyGoalHours < 0 || dailyGoalHours > 24) {
      return res.status(400).json({ success: false, message: "Invalid goal range (0-24 hrs)" });
    }

    const student = await prisma.student.update({
      where: { userId: req.user!.id },
      data: { dailyGoalHours: Number(dailyGoalHours) }
    });

    return res.json({ success: true, data: student });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Goal update failure" });
  }
};

export const getLeaderboard = async (req: Request, res: Response) => {
  try {
    // Rank by Current Streak and then by joining date
    const topStudents = await prisma.student.findMany({
      take: 10,
      orderBy: [
        { currentStreak: 'desc' },
        { joinDate: 'asc' }
      ],
      select: {
        id: true,
        fullName: true,
        currentStreak: true,
        maxStreak: true,
        profileImage: true,
        user: {
          select: { status: true }
        }
      }
    });

    return res.json({ success: true, data: topStudents });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Leaderboard sync failed" });
  }
};

export const createStudyLog = async (req: Request, res: Response) => {
  try {
    const { subject, topicsCovered, hoursSpent, productivityRating } = req.body;
    const student = await prisma.student.findUnique({ where: { userId: req.user!.id } });
    
    if (!student) return res.status(404).json({ success: false, message: "Student not found" });

    const log = await prisma.studyLog.create({
      data: {
        studentId: student.id,
        subject,
        topicsCovered,
        hoursSpent: Number(hoursSpent),
        productivityRating: Number(productivityRating)
      }
    });

    return res.status(201).json({ success: true, data: log });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Log preservation failure" });
  }
};

export const getStudyLogs = async (req: Request, res: Response) => {
  try {
    const student = await prisma.student.findUnique({ where: { userId: req.user!.id } });
    if (!student) return res.status(404).json({ success: false, message: "Student not found" });

    const logs = await prisma.studyLog.findMany({
      where: { studentId: student.id },
      orderBy: { date: 'desc' },
      take: 20
    });

    return res.json({ success: true, data: logs });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Log retrieval failure" });
  }
};

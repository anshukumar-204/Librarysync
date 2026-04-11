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
    console.error("LEADERBOARD ERROR:", error);
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

export const deleteStudyLog = async (req: Request, res: Response) => {
  try {
    const logId = Number(req.params.id);
    const student = await prisma.student.findUnique({ where: { userId: req.user!.id } });
    
    if (!student) return res.status(404).json({ success: false, message: "Student not found" });

    const log = await prisma.studyLog.findUnique({ where: { id: logId } });
    if (!log) return res.status(404).json({ success: false, message: "Log not found" });

    if (log.studentId !== student.id) {
      return res.status(403).json({ success: false, message: "Unauthorized log access" });
    }

    await prisma.studyLog.delete({ where: { id: logId } });

    return res.json({ success: true, message: "Log node purged from history" });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Log deletion failure" });
  }
};
export const getTasks = async (req: Request, res: Response) => {
  try {
    const student = await prisma.student.findUnique({ where: { userId: req.user!.id } });
    if (!student) return res.status(404).json({ success: false, message: "Student not found" });

    const { date } = req.query;
    let whereClause: any = { studentId: student.id };

    if (date) {
      const targetDate = new Date(date as string);
      const startOfDay = new Date(targetDate.setHours(0, 0, 0, 0));
      const endOfDay = new Date(targetDate.setHours(23, 59, 59, 999));
      whereClause.createdAt = { gte: startOfDay, lte: endOfDay };
    } else {
      // Logic for active dashboard: show incomplete tasks OR tasks completed today
      const today = new Date();
      const startOfToday = new Date(today.setHours(0, 0, 0, 0));
      whereClause.OR = [
        { isCompleted: false },
        { createdAt: { gte: startOfToday } }
      ];
    }

    const tasks = await prisma.task.findMany({
      where: whereClause,
      orderBy: { createdAt: 'desc' }
    });

    // AUTO-POPULATE LOGIC: If it's today and NO tasks exist, fetch from WeeklyRoutine
    if (!date && tasks.length === 0) {
      const todayDay = new Date().getDay(); // 0 (Sun) to 6 (Sat)
      const routines = await prisma.weeklyRoutine.findMany({
        where: { studentId: student.id, dayOfWeek: todayDay }
      });

      if (routines.length > 0) {
        // Bulk create tasks for today from routines
        const createdTasks = await Promise.all(routines.map(r => 
          prisma.task.create({
            data: {
              studentId: student.id,
              title: r.subject,
              estimatedMinutes: r.estimatedMinutes,
              priority: r.priority
            }
          })
        ));
        return res.json({ success: true, data: createdTasks, message: "Routine rhythms synchronized for today." });
      }
    }

    return res.json({ success: true, data: tasks });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Task retrieval failure" });
  }
};

export const createTask = async (req: Request, res: Response) => {
  try {
    const { title, estimatedMinutes, priority } = req.body;
    const student = await prisma.student.findUnique({ where: { userId: req.user!.id } });
    if (!student) return res.status(404).json({ success: false, message: "Student not found" });

    const task = await prisma.task.create({
      data: {
        studentId: student.id,
        title,
        estimatedMinutes: estimatedMinutes ? parseInt(estimatedMinutes) : null,
        priority: priority || "medium"
      }
    });

    return res.status(201).json({ success: true, data: task });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Task creation failure" });
  }
};

export const toggleTaskStatus = async (req: Request, res: Response) => {
  try {
    const taskId = Number(req.params.id);
    const { isCompleted } = req.body;
    const student = await prisma.student.findUnique({ where: { userId: req.user!.id } });
    
    if (!student) return res.status(404).json({ success: false, message: "Student not found" });

    const task = await prisma.task.findUnique({ where: { id: taskId } });
    if (!task || task.studentId !== student.id) {
      return res.status(403).json({ success: false, message: "Unauthorized task access" });
    }

    const updatedTask = await prisma.task.update({
      where: { id: taskId },
      data: { 
        isCompleted,
        completedAt: isCompleted ? new Date() : null
      }
    });

    return res.json({ success: true, data: updatedTask });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Task update failure" });
  }
};

export const deleteTask = async (req: Request, res: Response) => {
  try {
    const taskId = Number(req.params.id);
    const student = await prisma.student.findUnique({ where: { userId: req.user!.id } });
    
    if (!student) return res.status(404).json({ success: false, message: "Student not found" });

    const task = await prisma.task.findUnique({ where: { id: taskId } });
    if (!task || task.studentId !== student.id) {
      return res.status(403).json({ success: false, message: "Unauthorized task access" });
    }

    await prisma.task.delete({ where: { id: taskId } });

    return res.json({ success: true, message: "Task node removed" });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Task deletion failure" });
  }
};

export const updateTask = async (req: Request, res: Response) => {
  try {
    const taskId = Number(req.params.id);
    const { title, estimatedMinutes, priority } = req.body;
    const student = await prisma.student.findUnique({ where: { userId: req.user!.id } });
    
    if (!student) return res.status(404).json({ success: false, message: "Student not found" });

    const task = await prisma.task.findUnique({ where: { id: taskId } });
    if (!task || task.studentId !== student.id) {
      return res.status(403).json({ success: false, message: "Unauthorized task access" });
    }

    const updatedTask = await prisma.task.update({
      where: { id: taskId },
      data: {
        ...(title && { title }),
        ...(estimatedMinutes !== undefined && { estimatedMinutes: estimatedMinutes ? parseInt(estimatedMinutes) : null }),
        ...(priority && { priority })
      }
    });

    return res.json({ success: true, data: updatedTask });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Task update failure" });
  }
};

// --- Weekly Routine Management ---

export const getWeeklyRoutine = async (req: Request, res: Response) => {
  try {
    const student = await prisma.student.findUnique({ where: { userId: req.user!.id } });
    if (!student) return res.status(404).json({ success: false, message: "Student not found" });

    const routines = await prisma.weeklyRoutine.findMany({
      where: { studentId: student.id },
      orderBy: [{ dayOfWeek: 'asc' }, { createdAt: 'asc' }]
    });

    return res.json({ success: true, data: routines });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Routine retrieval error" });
  }
};

export const syncRoutineTasks = async (req: Request, res: Response) => {
  try {
    const student = await prisma.student.findUnique({ where: { userId: req.user!.id } });
    if (!student) return res.status(404).json({ success: false, message: "Student not found" });

    const todayDay = new Date().getDay(); // 0 (Sun) to 6 (Sat)
    
    // Get routine nodes for today
    const routines = await prisma.weeklyRoutine.findMany({
      where: { studentId: student.id, dayOfWeek: todayDay }
    });

    if (routines.length === 0) {
      return res.json({ success: true, data: [], message: "No routine nodes found for today." });
    }

    // Get today's tasks to avoid duplicates
    const today = new Date();
    const startOfToday = new Date(today.setHours(0, 0, 0, 0));
    const existingTasks = await prisma.task.findMany({
      where: { 
        studentId: student.id, 
        createdAt: { gte: startOfToday }
      }
    });

    // Filter routines that haven't been added yet (by title)
    const newRoutines = routines.filter(r => 
      !existingTasks.some(t => t.title === r.subject)
    );

    if (newRoutines.length === 0) {
      return res.json({ success: true, data: [], message: "Registry already in sync with rhythm pattern." });
    }

    // Bulk create new tasks
    const createdTasks = await Promise.all(newRoutines.map(r => 
      prisma.task.create({
        data: {
          studentId: student.id,
          title: r.subject,
          estimatedMinutes: r.estimatedMinutes,
          priority: r.priority
        }
      })
    ));

    return res.json({ 
      success: true, 
      data: createdTasks, 
      message: `${createdTasks.length} nodes synchronized for today.` 
    });

  } catch (error) {
    console.error("SYNC ROUTINE ERROR:", error);
    return res.status(500).json({ success: false, message: "Rhythm sync failure" });
  }
};


export const createRoutineNode = async (req: Request, res: Response) => {
  try {
    const { dayOfWeek, subject, estimatedMinutes, priority } = req.body;
    const student = await prisma.student.findUnique({ where: { userId: req.user!.id } });
    if (!student) return res.status(404).json({ success: false, message: "Student not found" });

    const routine = await prisma.weeklyRoutine.create({
      data: {
        studentId: student.id,
        dayOfWeek: parseInt(dayOfWeek),
        subject,
        estimatedMinutes: estimatedMinutes ? parseInt(estimatedMinutes) : null,
        priority: priority || "medium"
      }
    });

    return res.status(201).json({ success: true, data: routine });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Routine design error" });
  }
};

export const deleteRoutineNode = async (req: Request, res: Response) => {
  try {
    const routineId = Number(req.params.id);
    const student = await prisma.student.findUnique({ where: { userId: req.user!.id } });
    if (!student) return res.status(404).json({ success: false, message: "Student not found" });

    const routine = await prisma.weeklyRoutine.findUnique({ where: { id: routineId } });
    if (!routine || routine.studentId !== student.id) {
      return res.status(403).json({ success: false, message: "Unauthorized access" });
    }

    await prisma.weeklyRoutine.delete({ where: { id: routineId } });
    return res.json({ success: true, message: "Routine node purged" });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Purge failure" });
  }
};

export const getSubjectAnalytics = async (req: Request, res: Response) => {
  try {
    const student = await prisma.student.findUnique({ where: { userId: req.user!.id } });
    if (!student) return res.status(404).json({ success: false, message: "Student not found" });

    // Aggregate time spent per subject from COMPLETED tasks and StudyLogs
    const completedTasks = await prisma.task.findMany({
      where: { studentId: student.id, isCompleted: true, estimatedMinutes: { not: null } },
      select: { title: true, estimatedMinutes: true }
    });

    const studyLogs = await prisma.studyLog.findMany({
      where: { studentId: student.id, hoursSpent: { not: null } },
      select: { subject: true, hoursSpent: true }
    });

    const subjectData: Record<string, number> = {};

    // Process tasks (minutes to hours)
    completedTasks.forEach(task => {
      const subject = task.title.split(":")[0].trim(); // Extract subject if title is "Subject: Topic"
      const hours = (task.estimatedMinutes || 0) / 60;
      subjectData[subject] = (subjectData[subject] || 0) + hours;
    });

    // Process study logs
    studyLogs.forEach(log => {
      const subject = log.subject || "Uncategorized";
      subjectData[subject] = (subjectData[subject] || 0) + (log.hoursSpent || 0);
    });

    const formattedData = Object.keys(subjectData).map(subject => ({
      subject,
      hours: Number(subjectData[subject].toFixed(2))
    }));

    return res.json({ success: true, data: formattedData });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Analytics sync error" });
  }
};

const express = require("express");
const dotenv = require("dotenv");
const cors = require("cors");
const path = require("path");

dotenv.config({
    path: path.join(__dirname, ".env"),
});

const connectDB = require("./config/db");

// Import Routes
const authRoutes = require("./routes/authRoutes");
const adminRoutes = require("./routes/adminRoutes");
const attendanceRoutes = require("./routes/attendanceRoutes");
const dashboardRoutes = require("./routes/dashboardRoutes");
const studentRoutes = require("./routes/studentRoutes");
const attendanceSessionRoutes = require("./routes/attendanceSessionRoutes");
const attendanceMarkRoutes = require("./routes/attendanceMarkRoutes");
const teacherRoutes = require("./routes/teacherRoutes");
const notificationRoutes = require("./routes/notificationRoutes");
const studentAttendanceRoutes = require("./routes/studentAttendanceRoutes");
const timetableRoutes = require("./routes/timetableRoutes");
const settingsRoutes = require("./routes/settingsRoutes");

// Connect Database
connectDB();

const app = express();

// Middlewares
app.use(cors());
app.use(express.json());

// Serve uploaded profile images
app.use(
    "/uploads",
    express.static(path.join(__dirname, "uploads"))
);

// Root Route
app.get("/", (req, res) => {
    res.status(200).json({
        success: true,
        message: "Attendance Management System API is Running 🚀",
    });
});

// API Routes
app.use("/api/auth", authRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/attendance", attendanceRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/students", studentRoutes);
app.use("/api/session", attendanceSessionRoutes);
app.use("/api/attendance-mark", attendanceMarkRoutes);
app.use("/api/teacher", teacherRoutes);
app.use("/api/timetable", timetableRoutes);
app.use(
    "/api/settings",
    settingsRoutes
);
app.use(
    "/api/notifications",
    notificationRoutes
);
app.use(
    "/api/student-attendance",
    studentAttendanceRoutes
);
app.use(
    "/api/timetable",
    timetableRoutes
);

// 404 Handler
app.use((req, res) => {
    res.status(404).json({
        success: false,
        message: "Route Not Found",
    });
});

// Error Handler
app.use((err, req, res, next) => {
    console.error(err);

    res.status(500).json({
        success: false,
        message: err.message || "Internal Server Error",
    });
});

// Start Server
const PORT = process.env.PORT || 5000;

app.listen(PORT, "0.0.0.0", () => {
    console.log(`🚀 Server running on http://0.0.0.0:${PORT}`);
});


const express = require("express");
const cors = require("cors");
const pool = require("./db");
const buildingRoutes = require("./routes/buildingRoutes");
const floorRoutes = require("./routes/floorRoutes");
const roomRoutes = require("./routes/roomRoutes");
const facilityRoutes = require("./routes/facilityRoutes");
const facultyCabinRoutes = require("./routes/facultyCabinRoutes");
const occupancyRoutes = require("./routes/occupancyRoutes");
const announcementRoutes = require("./routes/announcementRoutes");
const dashboardRoutes = require("./routes/dashboardRoutes");
const resourceConsumptionRoutes = require("./routes/resourceConsumptionRoutes");
const eventRoutes = require("./routes/eventRoutes");
const analyticsRoutes = require("./routes/analyticsRoutes");

const app = express();

app.use(cors());
app.use(express.json());
app.use("/occupancy", occupancyRoutes);
app.use("/faculty-cabins", facultyCabinRoutes);
app.use("/facilities", facilityRoutes);
app.use("/rooms", roomRoutes);
app.use("/floors", floorRoutes);
app.use("/buildings", buildingRoutes);
app.use("/announcements", announcementRoutes);
app.use("/dashboard", dashboardRoutes);
app.use("/resource-consumption", resourceConsumptionRoutes);
app.use("/events", eventRoutes);
app.use("/analytics", analyticsRoutes);
pool.getConnection()
    .then(conn => {
        console.log("Database connected successfully!");
        conn.release();
    })
    .catch(err => {
        console.log("Database connection failed:", err);
    });

app.get("/", (req, res) => {
    res.send("Digital Campus Backend is running!");
});

const PORT = 3000;

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
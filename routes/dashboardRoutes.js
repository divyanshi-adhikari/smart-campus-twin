const express = require("express");
const pool = require("../db");

const router = express.Router();

router.get("/", async (req, res) => {
    try {
        const buildingResult = await pool.query(
            "SELECT COUNT(*) AS total_buildings FROM Buildings"
        );

        const floorResult = await pool.query(
            "SELECT COUNT(*) AS total_floors FROM Floors"
        );

        const roomResult = await pool.query(`
            SELECT
                COUNT(*) AS total_rooms,
                SUM(status = 'Available') AS available_rooms,
                SUM(status = 'Occupied') AS occupied_rooms,
                SUM(status = 'Maintenance') AS maintenance_rooms
            FROM Rooms
        `);

        const facilityResult = await pool.query(
            "SELECT COUNT(*) AS total_facilities FROM Facilities"
        );

        const facultyResult = await pool.query(
            "SELECT COUNT(*) AS total_faculty_cabins FROM Faculty_Cabins"
        );

        res.json({
            buildings: Number(buildingResult[0].total_buildings),
            floors: Number(floorResult[0].total_floors),
            rooms: {
                total: Number(roomResult[0].total_rooms),
                available: Number(roomResult[0].available_rooms),
                occupied: Number(roomResult[0].occupied_rooms),
                maintenance: Number(roomResult[0].maintenance_rooms)
            },
            facilities: Number(facilityResult[0].total_facilities),
            faculty_cabins: Number(facultyResult[0].total_faculty_cabins)
        });

    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
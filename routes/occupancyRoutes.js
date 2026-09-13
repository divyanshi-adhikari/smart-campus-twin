const express = require("express");
const pool = require("../db");

const router = express.Router();

router.get("/", async (req, res) => {
    try {
        const rows = await pool.query("SELECT * FROM Occupancy");
        res.json(rows);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.post("/", async (req, res) => {
    try {
        const { room_id, occupancy_count, source } = req.body;

        const result = await pool.query(
            "INSERT INTO Occupancy (room_id, occupancy_count, source) VALUES (?, ?, ?)",
            [room_id, occupancy_count, source || "IoT"]
        );

        res.status(201).json({
            message: "Occupancy data added successfully",
            occupancy_id: Number(result.insertId)
        });

    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.get("/details/:roomId", async (req, res) => {
    try {
        const { roomId } = req.params;

        const rows = await pool.query(
            `SELECT
                Occupancy.occupancy_id,
                Rooms.room_number,
                Buildings.building_name,
                Floors.floor_number,
                Occupancy.occupancy_count,
                Occupancy.source,
                Occupancy.recorded_at
             FROM Occupancy
             JOIN Rooms ON Occupancy.room_id = Rooms.room_id
             JOIN Floors ON Rooms.floor_id = Floors.floor_id
             JOIN Buildings ON Rooms.building_id = Buildings.building_id
             WHERE Occupancy.room_id = ?
             ORDER BY Occupancy.recorded_at DESC`,
            [roomId]
        );

        res.json(rows);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
const express = require("express");
const pool = require("../db");

const router = express.Router();

router.get("/", async (req, res) => {
    try {
        const rows = await pool.query("SELECT * FROM Rooms");
        res.json(rows);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.get("/building/:buildingId", async (req, res) => {
    try {
        const { buildingId } = req.params;

        const rows = await pool.query(
            "SELECT * FROM Rooms WHERE building_id = ?",
            [buildingId]
        );

        res.json(rows);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.get("/status/:status", async (req, res) => {
    try {
        const { status } = req.params;

        const rows = await pool.query(
            "SELECT * FROM Rooms WHERE status = ?",
            [status]
        );

        res.json(rows);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.get("/floor/:floorId", async (req, res) => {
    try {
        const { floorId } = req.params;

        const rows = await pool.query(
            "SELECT * FROM Rooms WHERE floor_id = ?",
            [floorId]
        );

        res.json(rows);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.get("/details/:roomId", async (req, res) => {
    try {
        const { roomId } = req.params;

        const rows = await pool.query(
            `SELECT
                Rooms.room_id,
                Rooms.room_number,
                Rooms.room_type,
                Rooms.capacity,
                Rooms.current_occupancy,
                Rooms.occupancy_source,
                Rooms.status,
                Floors.floor_number,
                Buildings.building_name
             FROM Rooms
             JOIN Floors ON Rooms.floor_id = Floors.floor_id
             JOIN Buildings ON Rooms.building_id = Buildings.building_id
             WHERE Rooms.room_id = ?`,
            [roomId]
        );

        res.json(rows);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Update room status
router.put("/status/:roomId", async (req, res) => {
    try {
        const { roomId } = req.params;
        const { status } = req.body;

        await pool.query(
            "UPDATE Rooms SET status = ? WHERE room_id = ?",
            [status, roomId]
        );

        res.json({
            message: "Room status updated successfully"
        });

    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});


// Update room occupancy
router.put("/occupancy/:roomId", async (req, res) => {
    try {
        const { roomId } = req.params;
        const { occupancy, source } = req.body;

        await pool.query(
            `UPDATE Rooms
             SET current_occupancy = ?,
                 occupancy_source = ?
             WHERE room_id = ?`,
            [occupancy, source || "Manual", roomId]
        );

        res.json({
            message: "Room occupancy updated successfully"
        });

    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
const express = require("express");
const pool = require("../db");

const router = express.Router();

router.get("/", async (req, res) => {
    try {
        const rows = await pool.query("SELECT * FROM Faculty_Cabins");
        res.json(rows);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.get("/search/:name", async (req, res) => {
    try {
        const { name } = req.params;
const rows = await pool.query(
    `SELECT 
        Faculty_Cabins.cabin_id,
        Faculty_Cabins.cabin_number,
        Faculty_Cabins.faculty_name,
        Rooms.room_number,
        Floors.floor_number,
        Buildings.building_name
     FROM Faculty_Cabins
     JOIN Rooms ON Faculty_Cabins.room_id = Rooms.room_id
     JOIN Floors ON Rooms.floor_id = Floors.floor_id
     JOIN Buildings ON Rooms.building_id = Buildings.building_id
     WHERE Faculty_Cabins.faculty_name = ?
        OR Faculty_Cabins.faculty_name LIKE ?`,
    [name, `${name} - %`]
);
        res.json(rows);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.get("/details/:cabinId", async (req, res) => {
    try {
        const { cabinId } = req.params;

        const rows = await pool.query(
            `SELECT
                Faculty_Cabins.cabin_id,
                Faculty_Cabins.cabin_number,
                Faculty_Cabins.faculty_name,
                Rooms.room_number,
                Rooms.room_type,
                Floors.floor_number,
                Buildings.building_name
             FROM Faculty_Cabins
             JOIN Rooms ON Faculty_Cabins.room_id = Rooms.room_id
             JOIN Floors ON Rooms.floor_id = Floors.floor_id
             JOIN Buildings ON Rooms.building_id = Buildings.building_id
             WHERE Faculty_Cabins.cabin_id = ?`,
            [cabinId]
        );

        res.json(rows);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
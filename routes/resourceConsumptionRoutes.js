const express = require("express");
const pool = require("../db");

const router = express.Router();

// Get all energy/water consumption data
router.get("/", async (req, res) => {
    try {
        const rows = await pool.query(`
            SELECT
                Resource_Consumption.consumption_id,
                Resource_Consumption.resource_type,
                Resource_Consumption.consumption_value,
                Resource_Consumption.unit,
                Resource_Consumption.recorded_at,
                Buildings.building_name,
                Rooms.room_number
            FROM Resource_Consumption
            LEFT JOIN Buildings
                ON Resource_Consumption.building_id = Buildings.building_id
            LEFT JOIN Rooms
                ON Resource_Consumption.room_id = Rooms.room_id
            ORDER BY Resource_Consumption.recorded_at DESC
        `);

        res.json(rows);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Add energy/water consumption data
router.post("/", async (req, res) => {
    try {
        const {
            resource_type,
            building_id,
            room_id,
            consumption_value,
            unit
        } = req.body;

        const result = await pool.query(
            `INSERT INTO Resource_Consumption
            (resource_type, building_id, room_id, consumption_value, unit)
            VALUES (?, ?, ?, ?, ?)`,
            [
                resource_type,
                building_id || null,
                room_id || null,
                consumption_value,
                unit
            ]
        );

        res.status(201).json({
            message: "Resource consumption data added successfully",
            consumption_id: Number(result.insertId)
        });

    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
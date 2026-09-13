const express = require("express");
const pool = require("../db");

const router = express.Router();

// Get all events
router.get("/", async (req, res) => {
    try {
        const rows = await pool.query(`
            SELECT *
            FROM Events
            ORDER BY start_datetime ASC
        `);

        res.json(rows);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Add an event
router.post("/", async (req, res) => {
    try {
        const {
            event_name,
            event_type,
            start_datetime,
            end_datetime,
            description
        } = req.body;

        const result = await pool.query(
            `INSERT INTO Events
            (event_name, event_type, start_datetime, end_datetime, description)
            VALUES (?, ?, ?, ?, ?)`,
            [
                event_name,
                event_type,
                start_datetime,
                end_datetime,
                description || null
            ]
        );

        res.status(201).json({
            message: "Event added successfully",
            event_id: Number(result.insertId)
        });

    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
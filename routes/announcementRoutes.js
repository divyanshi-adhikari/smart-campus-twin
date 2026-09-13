const express = require("express");
const pool = require("../db");

const router = express.Router();

router.get("/", async (req, res) => {
    try {
        const rows = await pool.query("SELECT * FROM Announcements");
        res.json(rows);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.post("/", async (req, res) => {
    try {
        const { title, message, target_audience } = req.body;

        const result = await pool.query(
            "INSERT INTO Announcements (title, message, target_audience) VALUES (?, ?, ?)",
            [title, message, target_audience || "All"]
        );

        res.status(201).json({
            message: "Announcement added successfully",
            announcement_id: Number(result.insertId)
        });

    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.get("/audience/:audience", async (req, res) => {
    try {
        const { audience } = req.params;

        const rows = await pool.query(
            `SELECT *
             FROM Announcements
             WHERE target_audience = ?
                OR target_audience = 'All'
             ORDER BY created_at DESC`,
            [audience]
        );

        res.json(rows);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
const express = require("express");
const pool = require("../db");

const router = express.Router();

router.get("/", async (req, res) => {
    try {
        const rows = await pool.query("SELECT * FROM Facilities");
        res.json(rows);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.get("/type/:type", async (req, res) => {
    try {
        const { type } = req.params;

        const rows = await pool.query(
            `SELECT *
             FROM Facilities
             WHERE facility_type = ?`,
            [type]
        );

        res.json(rows);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.get("/details/:facilityId", async (req, res) => {
    try {
        const { facilityId } = req.params;

        const rows = await pool.query(
            `SELECT
                Facilities.facility_id,
                Facilities.facility_name,
                Facilities.facility_type,
                Facilities.status,
                Floors.floor_number,
                Buildings.building_name
             FROM Facilities
             LEFT JOIN Floors ON Facilities.floor_id = Floors.floor_id
             LEFT JOIN Buildings ON Facilities.building_id = Buildings.building_id
             WHERE Facilities.facility_id = ?`,
            [facilityId]
        );

        res.json(rows);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
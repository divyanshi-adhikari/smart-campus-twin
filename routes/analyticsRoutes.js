const express = require("express");
const pool = require("../db");

const router = express.Router();

router.get("/", async (req, res) => {
    try {

        const occupancy = await pool.query(`
            SELECT
                Occupancy.occupancy_id,
                Occupancy.room_id,
                Rooms.room_number,
                Buildings.building_name,
                Rooms.capacity,
                Occupancy.occupancy_count,
                Occupancy.source,
                Occupancy.recorded_at
            FROM Occupancy
            JOIN Rooms ON Occupancy.room_id = Rooms.room_id
            JOIN Buildings ON Rooms.building_id = Buildings.building_id
            ORDER BY Occupancy.recorded_at DESC
        `);

        const resources = await pool.query(`
            SELECT
                Resource_Consumption.consumption_id,
                Resource_Consumption.resource_type,
                Resource_Consumption.building_id,
                Buildings.building_name,
                Resource_Consumption.room_id,
                Resource_Consumption.consumption_value,
                Resource_Consumption.unit,
                Resource_Consumption.recorded_at
            FROM Resource_Consumption
            LEFT JOIN Buildings
                ON Resource_Consumption.building_id = Buildings.building_id
            ORDER BY Resource_Consumption.recorded_at DESC
        `);

        const events = await pool.query(`
            SELECT *
            FROM Events
            ORDER BY start_datetime ASC
        `);

        res.json({
            occupancy: occupancy,
            resource_consumption: resources,
            events: events
        });

    } catch (error) {
        res.status(500).json({
            error: error.message
        });
    }
});

module.exports = router;
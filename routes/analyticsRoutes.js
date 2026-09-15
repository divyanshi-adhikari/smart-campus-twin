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


/* ---------- AI OCCUPANCY PREDICTION ---------- */

router.post("/predict", async (req, res) => {
    try {

        const response = await fetch("http://127.0.0.1:8000/predict", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(req.body)
        });

        const data = await response.json();

        if (!response.ok) {
            return res.status(response.status).json(data);
        }

        res.json(data);

    } catch (error) {
        res.status(500).json({
            error: "AI service is unavailable",
            details: error.message
        });
    }
});


/* ---------- AI ANOMALY RESULTS ---------- */

router.get("/anomalies", async (req, res) => {
    try {
        const fs = require("fs");
        const path = require("path");

        const filePath = path.join(
            __dirname,
            "..",
            "ai",
            "dataset",
            "occupancy_anomaly_results.csv"
        );

        if (!fs.existsSync(filePath)) {
            return res.status(404).json({
                error: "Anomaly results file not found"
            });
        }

        const csvData = fs.readFileSync(filePath, "utf8");

        const lines = csvData.trim().split(/\r?\n/);
        const headers = lines[0].split(",");

        const results = lines.slice(1).map(line => {
            const values = line.split(",");
            const row = {};

            headers.forEach((header, index) => {
                row[header.trim()] = values[index]?.trim();
            });

            return row;
        });

        const anomalies = results.filter(row =>
            row.is_anomaly &&
            row.is_anomaly.trim().toLowerCase() === "true"
        );

        res.json({
            total_records: results.length,
            anomaly_count: anomalies.length,
            anomalies: anomalies,
            data: results
        });

    } catch (error) {
        res.status(500).json({
            error: error.message
        });
    }
});


module.exports = router;
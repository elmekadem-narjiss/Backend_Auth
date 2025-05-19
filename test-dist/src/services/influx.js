"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.queryEquipmentMetrics = exports.flushWrites = exports.writeEquipmentMetrics = void 0;
const influxdb_client_1 = require("@influxdata/influxdb-client");
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
// Validate environment variables
const requiredEnvVars = ['INFLUXDB_URL', 'INFLUXDB_TOKEN', 'INFLUXDB_ORG', 'INFLUXDB_BUCKET'];
for (const envVar of requiredEnvVars) {
    if (!process.env[envVar]) {
        throw new Error(`Missing required environment variable: ${envVar}`);
    }
}
const influxDB = new influxdb_client_1.InfluxDB({
    url: process.env.INFLUXDB_URL,
    token: process.env.INFLUXDB_TOKEN,
});
const writeApi = influxDB.getWriteApi(process.env.INFLUXDB_ORG, process.env.INFLUXDB_BUCKET, 'ms', {
    batchSize: 100,
    flushInterval: 1000,
    maxRetries: 3,
});
const queryApi = influxDB.getQueryApi(process.env.INFLUXDB_ORG);
const writeEquipmentMetrics = (equipmentId, type, metrics) => {
    const point = new influxdb_client_1.Point('equipment')
        .tag('equipmentId', equipmentId)
        .tag('type', type);
    if (type === 'sensor') {
        point.floatField('temperature', metrics.temperature || 0)
            .floatField('humidity', metrics.humidity || 0);
    }
    else if (type === 'panel') {
        point.floatField('energyProduced', metrics.energyProduced || 0);
    }
    else if (type === 'cpu') {
        point.floatField('cpuUsage', metrics.cpuUsage || 0);
    }
    else if (type === 'ram') {
        point.floatField('ramUsage', metrics.ramUsage || 0);
    }
    else if (type === 'storage') {
        point.floatField('storageUsed', metrics.storageUsed || 0)
            .floatField('storageTotal', metrics.storageTotal || 0);
    }
    point.timestamp(new Date());
    console.log(`Writing point for ${equipmentId} (${type}):`, JSON.stringify(point.toLineProtocol())); // Debugging
    writeApi.writePoint(point);
};
exports.writeEquipmentMetrics = writeEquipmentMetrics;
const flushWrites = async () => {
    try {
        await writeApi.flush();
    }
    catch (err) {
        console.error('Error flushing InfluxDB writes:', err);
        throw err;
    }
};
exports.flushWrites = flushWrites;
const queryEquipmentMetrics = async (equipmentId, type, range = '1h') => {
    const fluxQuery = `
    from(bucket: "${process.env.INFLUXDB_BUCKET}")
      |> range(start: -${range})
      |> filter(fn: (r) => r._measurement == "equipment")
      |> filter(fn: (r) => r.equipmentId == "${equipmentId}")
      |> filter(fn: (r) => r.type == "${type}")
      |> pivot(rowKey: ["_time"], columnKey: ["_field"], valueColumn: "_value")
      |> sort(columns: ["_time"])
  `;
    try {
        const rows = await queryApi.collectRows(fluxQuery);
        console.log(`Raw InfluxDB rows for ${equipmentId} (${type}):`, JSON.stringify(rows, null, 2)); // Debugging
        return rows.map((row) => {
            const metrics = {};
            if (row.temperature !== undefined)
                metrics.temperature = row.temperature;
            if (row.humidity !== undefined)
                metrics.humidity = row.humidity;
            if (row.energyProduced !== undefined)
                metrics.energyProduced = row.energyProduced;
            if (row.cpuUsage !== undefined)
                metrics.cpuUsage = row.cpuUsage;
            if (row.ramUsage !== undefined)
                metrics.ramUsage = row.ramUsage;
            if (row.storageUsed !== undefined)
                metrics.storageUsed = row.storageUsed;
            if (row.storageTotal !== undefined)
                metrics.storageTotal = row.storageTotal;
            return {
                timestamp: new Date(row._time).toISOString(),
                metrics,
            };
        });
    }
    catch (err) {
        console.error(`Error querying InfluxDB for ${equipmentId} (${type}):`, err);
        return [];
    }
};
exports.queryEquipmentMetrics = queryEquipmentMetrics;

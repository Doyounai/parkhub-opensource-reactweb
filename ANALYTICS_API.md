# Parkhub — Parking Analytics API Documentation

> **For**: React Dashboard Developers  
> **Base URL**: `http://localhost:3000` (development)  
> **Auth**: ❌ No authentication required — all analytics endpoints are public  
> **Version**: 1.0.0

---

## Overview

The Analytics API provides pre-computed parking insights for a given **Area** (parking lot zone).  
All data is derived from **AreaSession** scan records and per-slot **SlotEvents**.

### Data Model Quick Reference

```
Area (parking zone)
  └── Slot[] (individual parking spaces, e.g. "A1", "A2")
  └── AreaSession[] (one snapshot/scan of the entire area at a point in time)
        └── SlotEvents[] (each slot's status at that snapshot)
                         status: "occupied" | "empty"
                         type:   "drone" | "manual"
```

---

## Common Query Parameters

All endpoints under `/analytics/area/:areaId/...` accept the following query params:

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `from` | ISO 8601 string | No | 7 days ago | Start of the date range |
| `to` | ISO 8601 string | No | now | End of the date range |
| `granularity` | `"hour"` \| `"day"` \| `"week"` | No | `"day"` | Time bucket size for time-series data |

**Example:**
```
GET /analytics/area/1/occupancy-timeline?from=2026-04-20T00:00:00Z&to=2026-04-27T00:00:00Z&granularity=day
```

---

## Endpoints

---

### 1. Occupancy Timeline

```
GET /analytics/area/:areaId/occupancy-timeline
```

**Description**: Returns a time-series of the **average occupancy rate** across all slots in the area, bucketed by `granularity`. Use this for a main **line chart** or **area chart** showing how busy the parking lot is over time.

**Recommended Chart**: Line chart / Area chart

**Query Params**: `from`, `to`, `granularity`

**Response**:
```json
{
  "areaId": 1,
  "from": "2026-04-20T00:00:00.000Z",
  "to": "2026-04-27T00:00:00.000Z",
  "granularity": "day",
  "data": [
    {
      "timestamp": "2026-04-20T00:00:00.000Z",
      "occupancyRate": 0.65,
      "occupiedCount": 13,
      "totalSlots": 20,
      "sessionCount": 12
    },
    {
      "timestamp": "2026-04-21T00:00:00.000Z",
      "occupancyRate": 0.42,
      "occupiedCount": 8,
      "totalSlots": 20,
      "sessionCount": 9
    }
  ]
}
```

| Field | Type | Description |
|-------|------|-------------|
| `timestamp` | string | Start of the time bucket (ISO 8601) |
| `occupancyRate` | number | 0.0 – 1.0 ratio of occupied slots |
| `occupiedCount` | number | Average number of occupied slots in this bucket |
| `totalSlots` | number | Total slots in the area |
| `sessionCount` | number | Number of AreaSession scans within this bucket |

---

### 2. Arrival Rate

```
GET /analytics/area/:areaId/arrival-rate
```

**Description**: Returns the **number of new parking arrivals** per time bucket. An "arrival" is detected as an `empty → occupied` state transition for a slot between two consecutive sessions.

**Recommended Chart**: Bar chart (grouped by hour or day)

**Query Params**: `from`, `to`, `granularity`

**Response**:
```json
{
  "areaId": 1,
  "from": "2026-04-20T00:00:00.000Z",
  "to": "2026-04-27T00:00:00.000Z",
  "granularity": "hour",
  "data": [
    {
      "timestamp": "2026-04-20T08:00:00.000Z",
      "arrivals": 5
    },
    {
      "timestamp": "2026-04-20T09:00:00.000Z",
      "arrivals": 3
    },
    {
      "timestamp": "2026-04-20T10:00:00.000Z",
      "arrivals": 7
    }
  ]
}
```

| Field | Type | Description |
|-------|------|-------------|
| `timestamp` | string | Start of the time bucket (ISO 8601) |
| `arrivals` | number | Count of `empty → occupied` transitions in this bucket |

---

### 3. Average Parking Duration

```
GET /analytics/area/:areaId/avg-parking-duration
```

**Description**: Computes how long cars stay on average. Duration is measured from the first `occupied` event to the subsequent `empty` event for each slot. Returns an **area-wide average** and a **per-slot breakdown**.

**Recommended Chart**: KPI card (overall avg) + Horizontal bar chart (per slot)

**Query Params**: `from`, `to`  
*(granularity is not applicable here)*

**Response**:
```json
{
  "areaId": 1,
  "from": "2026-04-20T00:00:00.000Z",
  "to": "2026-04-27T00:00:00.000Z",
  "avgDurationMinutes": 47.3,
  "slots": [
    {
      "slotId": 1,
      "slotName": "A1",
      "avgDurationMinutes": 52.1,
      "minDurationMinutes": 12.0,
      "maxDurationMinutes": 120.5,
      "parkingCount": 8
    },
    {
      "slotId": 2,
      "slotName": "A2",
      "avgDurationMinutes": 41.5,
      "minDurationMinutes": 5.0,
      "maxDurationMinutes": 95.0,
      "parkingCount": 6
    }
  ]
}
```

| Field | Type | Description |
|-------|------|-------------|
| `avgDurationMinutes` | number | Area-wide average parking duration in minutes |
| `slotId` | number | Slot ID |
| `slotName` | string | Slot display name (e.g. "A1") |
| `avgDurationMinutes` | number | Average duration for this specific slot |
| `minDurationMinutes` | number | Shortest parking stay observed |
| `maxDurationMinutes` | number | Longest parking stay observed |
| `parkingCount` | number | Number of completed parking sessions counted |

---

### 4. Slot Heatmap

```
GET /analytics/area/:areaId/slot-heatmap
```

**Description**: Returns the **occupancy rate per individual slot** over the selected date range. Useful to identify which slots are most/least used.

**Recommended Chart**: Heatmap grid, Horizontal bar chart, or color-coded floor plan overlay

**Query Params**: `from`, `to`

**Response**:
```json
{
  "areaId": 1,
  "from": "2026-04-20T00:00:00.000Z",
  "to": "2026-04-27T00:00:00.000Z",
  "slots": [
    {
      "slotId": 1,
      "slotName": "A1",
      "occupancyRate": 0.78,
      "totalOccupied": 42,
      "totalEmpty": 12,
      "totalEvents": 54
    },
    {
      "slotId": 2,
      "slotName": "A2",
      "occupancyRate": 0.33,
      "totalOccupied": 18,
      "totalEmpty": 36,
      "totalEvents": 54
    }
  ]
}
```

| Field | Type | Description |
|-------|------|-------------|
| `slotId` | number | Slot ID |
| `slotName` | string | Slot display name |
| `occupancyRate` | number | 0.0 – 1.0, fraction of time this slot was occupied |
| `totalOccupied` | number | Number of scan records where this slot was `occupied` |
| `totalEmpty` | number | Number of scan records where this slot was `empty` |
| `totalEvents` | number | Total scan records for this slot in the range |

---

### 5. Peak Hours

```
GET /analytics/area/:areaId/peak-hours
```

**Description**: Shows the **average occupancy rate grouped by hour of day (0–23)** across all days in the selected range. Reveals which times of day are typically busiest.

**Recommended Chart**: Bar chart, Radar/Spider chart

**Query Params**: `from`, `to`

**Response**:
```json
{
  "areaId": 1,
  "from": "2026-04-20T00:00:00.000Z",
  "to": "2026-04-27T00:00:00.000Z",
  "data": [
    { "hour": 0,  "avgOccupancyRate": 0.05 },
    { "hour": 1,  "avgOccupancyRate": 0.03 },
    { "hour": 7,  "avgOccupancyRate": 0.22 },
    { "hour": 8,  "avgOccupancyRate": 0.55 },
    { "hour": 9,  "avgOccupancyRate": 0.72 },
    { "hour": 12, "avgOccupancyRate": 0.68 },
    { "hour": 17, "avgOccupancyRate": 0.88 },
    { "hour": 18, "avgOccupancyRate": 0.61 },
    { "hour": 23, "avgOccupancyRate": 0.08 }
  ]
}
```

> ℹ️ All 24 hours (0–23) are always returned. Hours with no data will have `avgOccupancyRate: 0`.

| Field | Type | Description |
|-------|------|-------------|
| `hour` | number | Hour of day in 24h format (0 = midnight, 17 = 5pm) |
| `avgOccupancyRate` | number | Average occupancy across all days in the range for this hour |

---

### 6. Summary (KPI Snapshot)

```
GET /analytics/area/:areaId/summary
```

**Description**: Returns a single high-level summary of key metrics for the selected date range. Use this for **dashboard header KPI cards**.

**Recommended UI**: Card row with 6 KPI tiles

**Query Params**: `from`, `to`

**Response**:
```json
{
  "areaId": 1,
  "areaName": "Zone A",
  "from": "2026-04-20T00:00:00.000Z",
  "to": "2026-04-27T00:00:00.000Z",
  "totalSessions": 150,
  "totalSlots": 20,
  "avgOccupancyRate": 0.61,
  "peakOccupancyRate": 0.95,
  "peakTimestamp": "2026-04-22T17:00:00.000Z",
  "totalArrivals": 320,
  "avgParkingDurationMinutes": 47.3,
  "mostUsedSlot": {
    "slotId": 3,
    "slotName": "A3",
    "occupancyRate": 0.91
  },
  "leastUsedSlot": {
    "slotId": 7,
    "slotName": "A7",
    "occupancyRate": 0.12
  }
}
```

| Field | Type | Description |
|-------|------|-------------|
| `totalSessions` | number | Total AreaSession scans in the date range |
| `totalSlots` | number | Number of slots in this area |
| `avgOccupancyRate` | number | Average occupancy rate across the entire range |
| `peakOccupancyRate` | number | Highest single-session occupancy rate observed |
| `peakTimestamp` | string | Timestamp of the peak occupancy session |
| `totalArrivals` | number | Total `empty → occupied` transitions detected |
| `avgParkingDurationMinutes` | number | Average parking duration in minutes |
| `mostUsedSlot` | object | Slot with the highest occupancy rate in the period |
| `leastUsedSlot` | object | Slot with the lowest occupancy rate in the period |

---

## Error Responses

All endpoints return standard HTTP errors:

| Status | Meaning |
|--------|---------|
| `400 Bad Request` | Invalid query param (e.g. bad date format, unknown granularity) |
| `404 Not Found` | Area with the given `:areaId` does not exist |
| `500 Internal Server Error` | Unexpected server error |

**Error body shape:**
```json
{
  "statusCode": 400,
  "message": "Invalid granularity value. Must be one of: hour, day, week",
  "error": "Bad Request"
}
```

---

## Usage Examples

### Dashboard default load (last 7 days, daily view)
```
GET /analytics/area/1/summary
GET /analytics/area/1/occupancy-timeline?granularity=day
GET /analytics/area/1/peak-hours
GET /analytics/area/1/slot-heatmap
```

### Drill-down into a specific day (hourly)
```
GET /analytics/area/1/occupancy-timeline?from=2026-04-22T00:00:00Z&to=2026-04-23T00:00:00Z&granularity=hour
GET /analytics/area/1/arrival-rate?from=2026-04-22T00:00:00Z&to=2026-04-23T00:00:00Z&granularity=hour
```

### Slot performance comparison
```
GET /analytics/area/1/slot-heatmap?from=2026-04-01T00:00:00Z&to=2026-04-27T00:00:00Z
GET /analytics/area/1/avg-parking-duration?from=2026-04-01T00:00:00Z&to=2026-04-27T00:00:00Z
```

---

## Notes for Frontend

- **Timestamps** are always returned in **UTC ISO 8601** format. Convert to local timezone on the client as needed.
- **`occupancyRate`** is always a float between `0.0` and `1.0`. Multiply by 100 to display as percentage.
- **`granularity`** only affects time-series endpoints (`/occupancy-timeline`, `/arrival-rate`). Other endpoints ignore it.
- **Empty data buckets**: Time buckets with no sessions are **omitted** from the response array. Handle gaps in your charting library (e.g. fill with `0`).
- All analytics endpoints **do not require any Authorization header**.

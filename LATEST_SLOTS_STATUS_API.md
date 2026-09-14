# Latest Area Slots Status API

This documentation details the API endpoint to fetch the latest occupancy status for all parking slots within a specific area. 

## Get Latest Area Slots Status

Fetches an array of all parking slots for a given area, alongside their most up-to-date occupancy status. The endpoint leverages the latest events to determine the status or falls back to the default status if no events have occurred.

**Endpoint:** `GET /slot/latest-status`

**Query Parameters:**
- `area` (Required, Number): The ID of the area you want to query.

### Example Request

```http
GET http://localhost:3000/slot/latest-status?area=1
```

### Success Response (200 OK)

The response is wrapped by the global `TransformInterceptor`, returning the following structure:

```json
{
  "success": true,
  "code": 200,
  "message": "Success",
  "timestamp": 1714290720000,
  "data": [
    {
      "id": 1,
      "name": "A1",
      "area_id": 1,
      "status": "occupied",
      "last_updated": "2026-04-28T14:45:00.000Z"
    },
    {
      "id": 2,
      "name": "A2",
      "area_id": 1,
      "status": "empty",
      "last_updated": "2026-04-28T14:30:00.000Z"
    }
  ]
}
```

### Notes
- `status` will always be either `"occupied"` or `"empty"`.
- If a slot has never had a tracking event, its `status` will fall back to its default state, and `last_updated` will represent its original creation or last metadata update time.

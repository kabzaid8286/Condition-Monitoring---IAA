# IoT Gateway

The hardware protocol is intentionally not selected yet. The gateway should:

- collect readings from the agreed sensor/PLC interface,
- normalize timestamps to UTC and attach gateway/asset identifiers,
- batch and retry outbound data,
- buffer safely while disconnected,
- authenticate with a rotating device credential, and
- never expose control functions through this application.

Target request: `POST /api/v1/ingestion/measurements`. The payload schema is available in FastAPI's `/docs` endpoint.

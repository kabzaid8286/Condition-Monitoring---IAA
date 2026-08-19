# Initial data model

| Entity | Purpose | Required fields |
| --- | --- | --- |
| Asset | Monitored machine or test rig | id, key, name, location, active |
| Sensor | Signal definition on an asset | id, asset_id, key, label, unit, sampling_interval_s |
| Gateway | Edge device identity | id, key, status, last_seen_at |
| Measurement | Immutable raw observation | id, sensor_id, gateway_id, observed_at, received_at, value, quality |
| Alert | Derived condition needing attention | id, asset_id, rule/version, severity, opened_at, state, explanation |

Store all timestamps in UTC. Keep `observed_at` (when measured) separate from `received_at` (when the API received it) so delayed or buffered data is auditable.

## Ingestion contract

The current endpoint accepts batches of a gateway ID, asset key, and a list of `{sensor_key, value, unit, observed_at}` objects. The next implementation step is to persist validated batches with a unique source event ID, ensuring a gateway can retry safely without duplicate readings.

# Contract: Skeleton Health Endpoints

**Scope**: X-00 · The only HTTP surface in this spec. BE-01 replaces/extends it later; until then these are the objective "app responds" assertions for acceptance scenarios and smoke tests.

## `apps/api`

### `GET /healthz`

| Aspect | Contract |
|--------|----------|
| Success response | `200 OK` |
| Content-Type | `application/json` |
| Body | `{"status":"ok"}` — exact shape; extra fields forbidden at this spec |
| Failure mode | If the process is up but the route errors, that is an X-00 defect |

Server binds to `process.env.PORT` (default `4000`) on all interfaces.

## `apps/web`

### `GET /` (root page)

| Aspect | Contract |
|--------|----------|
| Success response | `200 OK`, HTML document |
| Marker | Rendered content contains the string `Waslah` (smoke-test marker per research D6) |

## Usage

- Quickstart scenario S2 asserts both endpoints within 2 minutes of `pnpm dev` + `pnpm db:up` (SC-002).
- CI `build` stage proves both packages compile and their smoke tests pass; live endpoint checks remain a local/deploy validation (CI has no long-running server assertion at this spec).

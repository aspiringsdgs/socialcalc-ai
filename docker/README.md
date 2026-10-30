# Running socialcalc-ai in Docker

Production image: the demo app built with Vite and served by an unprivileged nginx (non-root,
uid 101, port 8080). The same nginx proxies `/api/*` to the Tornado backend, so the browser sees one
origin and Tornado's signed `user` cookie needs no CORS or `SameSite=None`.

```bash
docker build -t socialcalc-ai .
docker run --rm -p 8081:8080 -e TORNADO_API_URL=http://host.docker.internal:8080 socialcalc-ai
# open http://localhost:8081
```

## Configuration (environment only, nothing is baked into the image)

| Variable | Default | Meaning |
|---|---|---|
| `TORNADO_API_URL` | *(empty, required)* | Origin of the Tornado backend, no path. In the Tornado compose stack: `http://nginx:80` |
| `TORNADO_CONNECT_TIMEOUT` | `5` | Seconds to connect to the backend. Failure: **502** `{"error":"backend unreachable"}` |
| `TORNADO_READ_TIMEOUT` | `60` | Seconds to wait for the backend. Exceeded: **504** `{"error":"backend timed out"}` |
| `NGINX_RESOLVER` | `127.0.0.11` | DNS server used to resolve the backend per request (Docker's embedded DNS) |

Build-time (public, non-secret) switch: `--build-arg VITE_STORAGE_BACKEND=none` hides the save/open UI.
`VITE_API_BASE_URL` is deliberately left empty in the image (relative `/api` URLs).

The backend is resolved per request, so the container starts and stays healthy while Tornado is down;
API calls then answer 502/504 as above and recover on their own when it is back.

## Health

`GET /healthz` returns `200 ok` and is answered by nginx itself (it does not depend on the backend).
The image has a `HEALTHCHECK` on it.

## Not included

No `/agent` proxy yet (there is no agent service). No TLS: terminate it in front of this container.

Ouroboros vs Souz vs Souz Go vs Hermes Agent vs PicoClaw

Below provide the path to the project folders. 

Requirements:

- Docker, for Emerge reports
- Python 3.11+ and `repowise`, for Repowise reports

## Documentation

- [How calculations are produced with Emerge](docs/emerge.md)
- [How Souz analysis is produced with Repowise](docs/repowise.md)

## HTML Reports

- [Ouroboros](output/ouroboros/html/emerge.html)
- [Hermes Agent, Python](output/hermes/html/emerge.html)
- [Souz](output/souz/html/emerge.html)
- [Souz Go, Go](output/souz-go/html/emerge.html)
- [PicoClaw, Go](output/picoclaw/html/emerge.html)

## Local UI

This repository includes a static dashboard for browsing the checked-in Emerge and Souz Repowise artifacts:

```bash
python3 -m http.server 8787 --bind 127.0.0.1
```

Then open:

```text
http://127.0.0.1:8787/ui/
```

The dashboard reads files from `output/`; it does not start Repowise. To open the real Repowise dashboard, run `repowise serve` from the Souz checkout and open `http://127.0.0.1:3000`.

# Ouroboros

https://github.com/joi-lab/ouroboros-desktop

```bash
docker run --rm \
  --platform linux/amd64 \
  --user "$(id -u):$(id -g)" \
  -e HOME=/tmp \
  -v "$OUROBOROS_REPO:/work/source:ro" \
  -v "$PWD/output/ouroboros:/work/export" \
  -v "$PWD/configs/ouroboros.yml:/work/config.yml:ro" \
  achtelik/emerge:2.0.0 \
  /work/config.yml
```

# Hermes Agent, Python

https://github.com/nousresearch/hermes-agent

```bash
docker run --rm \
  --platform linux/amd64 \
  --user "$(id -u):$(id -g)" \
  -e HOME=/tmp \
  -v "$HERMES_AGENT_REPO:/work/source:ro" \
  -v "$PWD/output/hermes:/work/export" \
  -v "$PWD/configs/hermes.yml:/work/config.yml:ro" \
  achtelik/emerge:2.0.0 \
  /work/config.yml
```

# Souz

https://github.com/D00mch/souz/

## Emerge

```bash
docker run --rm \
  --platform linux/amd64 \
  --user "$(id -u):$(id -g)" \
  -e HOME=/tmp \
  -v "$SOUZ_REPO:/work/source:ro" \
  -v "$PWD/output/souz:/work/export" \
  -v "$PWD/configs/souz.yml:/work/config.yml:ro" \
  achtelik/emerge:2.0.0 \
  /work/config.yml
```

## Repowise

```bash
pip install repowise
export SOUZ_REPO=/path/to/souz
scripts/run-repowise-souz.sh
```

The full Repowise index is stored in `$SOUZ_REPO/.repowise/`. Snapshot files for this comparison repository are written to `output/souz/repowise/`; the runner also records the Souz checkout status after indexing.

# Souz Go, Go

https://github.com/jilees/souz-go

```bash
docker run --rm \
  --platform linux/amd64 \
  --user "$(id -u):$(id -g)" \
  -e HOME=/tmp \
  -v "$SOUZ_GO_REPO:/work/source:ro" \
  -v "$PWD/output/souz-go:/work/export" \
  -v "$PWD/configs/souz-go.yml:/work/config.yml:ro" \
  achtelik/emerge:2.0.0 \
  /work/config.yml
```

# PicoClaw, Go

https://github.com/sipeed/picoclaw

```bash
docker run --rm \
  --platform linux/amd64 \
  --user "$(id -u):$(id -g)" \
  -e HOME=/tmp \
  -v "$PICOCLAW_REPO:/work/source:ro" \
  -v "$PWD/output/picoclaw:/work/export" \
  -v "$PWD/configs/picoclaw.yml:/work/config.yml:ro" \
  achtelik/emerge:2.0.0 \
  /work/config.yml
```

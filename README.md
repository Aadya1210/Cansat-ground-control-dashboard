# CanSat Ground Control Software

This project is a complete single-page Ground Control Software dashboard for the CanSat assignment brief.

## Files

- `index.html` - main dashboard page
- `src/styles.css` - dashboard styling and responsive layout
- `src/app.js` - telemetry simulation, controls, graphs, map, camera, serial, and export logic
- `docs/layout.md` - full layout plan
- `docs/report.md` - project report
- `data/sample_telemetry.csv` - sample telemetry log

## Run

Open `index.html` in a browser.

For camera and serial features, run from localhost:

```powershell
python -m http.server 8080
```

Then visit:

```text
http://localhost:8080
```

Use a Chromium-based browser for Web Serial support.

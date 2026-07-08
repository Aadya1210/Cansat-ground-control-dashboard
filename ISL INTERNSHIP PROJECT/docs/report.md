# Project Report: Single-Page CanSat Ground Control Software

## Objective

The objective of this project is to develop a professional single-page Ground Control Software dashboard for a CanSat mission. The dashboard monitors simulated or serial telemetry, displays mission health, visualizes key parameters, tracks GPS position, supports mission commands, and provides export features.

## Implemented Features

- Aerospace-style single-page operator interface
- Start and stop telemetry controls
- CSV telemetry export
- Graph PNG export
- PC time display and elapsed mission timer
- Packet reset functionality
- Manual separation command
- Emergency parachute command
- Redundant activation command
- Dynamic command execution status
- Separate container and payload telemetry panels
- 4-digit live error code system
- Real-time graph visualization using HTML Canvas
- GPS trajectory map using HTML Canvas
- Artificial horizon orientation visualization
- Browser camera stream support
- Telemetry log table
- Optional Web Serial API support for microcontroller telemetry

## Technologies Used

- HTML5 for structure
- CSS3, CSS Grid, and Flexbox for layout
- JavaScript for telemetry simulation, parsing, commands, exports, graphs, map, camera, and serial handling
- HTML Canvas for graphing and GPS trajectory visualization
- MediaDevices API for live camera streaming
- Web Serial API for optional microcontroller connection
- Blob API for CSV file export

## Testing Strategy

The dashboard can be tested in two modes:

1. Simulation mode
   - Open the app.
   - Click Start Telemetry.
   - Verify telemetry cards, graph, map, orientation, error code, packet count, and table updates.
   - Trigger mission commands and verify command status changes.
   - Export CSV and graph image files.

2. Microcontroller mode
   - Flash the microcontroller with code that transmits comma-separated telemetry packets over serial.
   - Open the dashboard in a Chromium-based browser.
   - Click Connect Serial.
   - Select the device and verify live telemetry reception.

## Evaluation Mapping

| Criteria | Implementation |
| --- | --- |
| UI/UX Design | Professional dark dashboard with responsive panels |
| Telemetry Handling | Simulation and optional serial packet parsing |
| Real-Time Visualization | Canvas graphs, map updates, telemetry cards, artificial horizon |
| Mission Control Features | Separation, parachute, redundant activation, status log |
| Graphing and Tracking | Multi-series graph and GPS path history |
| Orientation and Video Systems | Roll-pitch-yaw horizon and browser camera support |
| Code Quality and Scalability | Modular JavaScript functions and separated HTML/CSS/JS files |

## How To Run

Open `index.html` in a browser, or start a local static server from the project folder:

```powershell
python -m http.server 8080
```

Then open:

```text
http://localhost:8080
```

Camera and Web Serial features work best from `localhost` in a Chromium-based browser.

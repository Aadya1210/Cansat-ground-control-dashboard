# CanSat Ground Control Software - Full Layout

## Page Structure

The application is a single-page aerospace operator dashboard. It is designed for quick mission awareness, real-time telemetry monitoring, and command execution.

1. Top header
   - Mission title: CanSat Ground Control Software
   - Current PC time
   - Mission elapsed timer
   - Telemetry link status: SIMULATION, STREAMING, SERIAL, or STOPPED

2. Top control bar
   - Start Telemetry
   - Stop
   - Export CSV
   - Export Graph
   - Sync PC Time
   - Reset Packet
   - Connect Serial

3. Mission status strip
   - Mission State
   - Packet Count
   - 4-digit Error Code
   - GPS Lock
   - Last Command

4. Mission control panel
   - Manual Separation
   - Emergency Parachute Deployment
   - Redundant Activation
   - Dynamic command execution log

5. Container telemetry panel
   - Altitude
   - Pressure
   - Descent Rate
   - Battery Voltage
   - Container Temperature
   - Signal Strength

6. Payload telemetry panel
   - Payload Temperature
   - Humidity
   - Roll
   - Pitch
   - Yaw
   - GPS Status

7. Real-time graphs
   - Altitude
   - Pressure
   - Temperature
   - Descent Rate
   - Battery Voltage

8. Tracking map
   - Live latitude and longitude display
   - Trajectory path history
   - Latest payload position marker

9. Orientation visualization
   - Artificial horizon
   - Roll, pitch, yaw numerical display

10. Live video streaming
   - Camera selector
   - Start Camera
   - Stop Camera
   - Stream status

11. Telemetry log table
   - Latest packets
   - Timestamp
   - Altitude
   - Temperature
   - Descent rate
   - Battery voltage
   - Error code

## Error Code Logic

The dashboard implements the required 4-digit error code system:

| Digit | Condition | 0 Meaning | 1 Meaning |
| --- | --- | --- | --- |
| 1 | Descent Rate | Within 8-10 m/s | Outside safe range |
| 2 | GPS Availability | GPS available | GPS unavailable |
| 3 | Payload Separation | Payload separated successfully | Payload separation failure |
| 4 | Emergency Parachute | Parachute inactive | Emergency parachute activated |

Examples:

| Code | Meaning |
| --- | --- |
| 0000 | All systems normal |
| 1000 | Descent rate fault |
| 0100 | GPS unavailable |
| 0010 | Payload separation failure |
| 0001 | Emergency parachute activated |
| 1111 | All fault conditions active |

## Color And Style

- Background: dark mission-control theme
- Good/active state: green
- Warning state: amber
- Fault state: red
- Telemetry traces: distinct bright colors
- Layout system: CSS Grid and Flexbox
- Responsive behavior: three columns on desktop, two columns on tablets, one column on mobile

## Data Flow

1. Start Telemetry begins simulated packet streaming.
2. Each packet updates telemetry cards, graphs, map, orientation, table, mission state, GPS state, and error code.
3. Mission commands update command status and affect relevant telemetry conditions.
4. CSV export stores the current telemetry history.
5. Graph export saves the current graph canvas as a PNG.
6. Connect Serial can receive comma-separated telemetry from a microcontroller through the Web Serial API.

## Serial Packet Format

For real microcontroller testing, transmit one comma-separated line per packet:

```text
altitude,pressure,descentRate,battery,containerTemp,payloadTemp,humidity,roll,pitch,yaw,lat,lon,gpsStatus,signal,separated,parachute
```

Example:

```text
245.5,986.3,8.7,7.92,29.1,28.4,46,12.5,-4.2,175,28.61522,77.21018,LOCK,91,1,0
```

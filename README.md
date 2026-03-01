# Usage

1. [Download the files](https://github.com/Johnnycyan/obs-stopwatch/archive/refs/heads/main.zip)
2. Put them in a folder that you won't delete
3. Add the index.html as a browser source in OBS
4. Set the resolution of the browser source to at least 1400x800
5. Hover over the timer to reveal the action buttons (Start/Pause, Reset, Settings)
6. To change the settings click on the source and click the Interact button, then hover to reveal the ⚙ Settings button
7. Settings are saved when you click "Save" in the settings modal
8. When you change the font the source size may need adjustment
9. You can resize the source afterwards to make it the size you want but don't change it in the properties
10. When resizing sources in OBS it is best to right-click them and set Scale Filtering to Area

# Features

## Timer Modes

- **Stopwatch** — counts up from the set time
- **Countdown** — counts down from a configurable duration
  - **Allow negative time** — timer continues past zero into negative values
  - **Alert at zero** — plays a sound when the countdown reaches zero (uses `alert.mp3` in the script directory, or a custom URL)

## Text Appearance

- **Google Fonts** — paste a Google Fonts embed code and it auto-detects the font name
- **Font Weight** — slider from 100 to 900 (step 50)
- **Text Color** — color picker for the timer text
- **Static Glow** — optional glow effect with adjustable opacity and color

## Animated Gradient

- Two-color animated gradient with configurable speed and glow intensity
- When enabled, overrides text color and static glow settings

## Settings Modal

- All settings are organized in collapsible, animated sections
- **Import/Export** — export all settings as JSON, import from a file

## Set Time

- Set the elapsed time in `HH:MM:SS` format with a reset button
- In countdown mode, the label changes to "Set Time Elapsed" for clarity
- Elapsed time is clamped when negative time is not allowed

# Control from Stream Deck via OBS WebSocket

1. Make sure OBS WebSocket is enabled (OBS 28+ has it built in). Note the host, port (default 4455), and password.
2. In the browser source Interact view, open Settings → OBS WebSocket section. Enable it, enter host/port/password, and click Connect. (Credentials are stored locally in your browser source.)
3. In Stream Deck, download the "Multi OBS Controller" plugin, add the "Raw WS Request" Key, configure the OBS websocket info in the "General Configuration" section, and set the "Request Type" to `BroadcastCustomEvent`.

## Generic Commands

These work with whatever timer mode is currently active:

| Action | Request Data                                                     |
| ------ | ---------------------------------------------------------------- |
| Start  | `{"eventData": {"source": "obs-stopwatch", "action": "start"}}`  |
| Stop   | `{"eventData": {"source": "obs-stopwatch", "action": "stop"}}`   |
| Toggle | `{"eventData": {"source": "obs-stopwatch", "action": "toggle"}}` |
| Reset  | `{"eventData": {"source": "obs-stopwatch", "action": "reset"}}`  |

## Stopwatch-Specific Commands

These switch to stopwatch mode and perform the action:

| Action           | `"action"` value     |
| ---------------- | -------------------- |
| Start Stopwatch  | `"stopwatch_start"`  |
| Stop Stopwatch   | `"stopwatch_stop"`   |
| Toggle Stopwatch | `"stopwatch_toggle"` |

## Countdown-Specific Commands

These switch to countdown mode and perform the action:

| Action           | `"action"` value     |
| ---------------- | -------------------- |
| Start Countdown  | `"countdown_start"`  |
| Stop Countdown   | `"countdown_stop"`   |
| Toggle Countdown | `"countdown_toggle"` |

## Set Commands

| Action                 | Example                                                                                                                |
| ---------------------- | ---------------------------------------------------------------------------------------------------------------------- |
| Set elapsed time       | `{"eventData": {"source": "obs-stopwatch", "action": "set_elapsed", "milliseconds": 90500}}` (sets to 1m30.5s)         |
| Set countdown duration | `{"eventData": {"source": "obs-stopwatch", "action": "set_countdown", "milliseconds": 300000}}` (sets countdown to 5m) |

> You can also use m/minutes, s/seconds, h/hours, ms/milliseconds in the set_elapsed and set_countdown actions.

> **Note:** If you change the realm in Settings, update `"source"` in the Stream Deck key to match.

# Getting Google Fonts

1. Go to [Google Fonts](https://fonts.google.com/)
2. Select a font

![image](https://github.com/Johnnycyan/obs-stopwatch/assets/24556317/34d8cf8e-f9e6-4438-bf5d-5d6172e549a2)

4. Click Get Embed Code

![image](https://github.com/Johnnycyan/obs-stopwatch/assets/24556317/f5ba762e-a9db-4c8a-bf2e-f5fdf0df88a6)

5. Click "Copy code"

![image](https://github.com/Johnnycyan/obs-stopwatch/assets/24556317/60a97b2e-6fbf-4426-af84-a31033e4200b)

6. Enter that in the "Google Fonts Code" box
7. It should auto-populate the correct font name; but if it doesn't you can enter the font name in the "Font Name" box. In this example it would be: Archivo Black

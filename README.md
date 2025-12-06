# Usage
1. [Download the files](https://github.com/Johnnycyan/obs-stopwatch/archive/refs/heads/main.zip)
2. Put them in a folder that you won't delete
3. Add the index.html as a browser source in OBS
4. Set the resolution of the browser source to 1400x800
5. Crop the bottom of the source to just the point where the buttons don't appear (this will ensure vertical centering stays intact)
6. To change the settings click on the source and click the Interact button (Settings will be disabled until timer is paused)
7. Settings are automatically and immediately applied
8. When you change the font the vertical crop will probably change so make sure to update it
9. You can resize the source afterwards to make it the size you want but don't change it in the properties
10. When resizing sources in OBS it is best to right-click them and set Scale Filtering to Area

# Control from Stream Deck via OBS WebSocket
1. Make sure OBS WebSocket is enabled (OBS 28+ has it built in). Note the host, port (default 4455), and password.
2. In the browser source Interact view enable "OBS WebSocket Control". Enter host/port/password and click Connect. (Credentials are stored locally in your browser source.)
3. In Stream Deck, download the "Multi OBS Controller" plugin, add the "Raw WS Request" Key, configure the OBS websocket info in the "General Configuration" section, and then set the "Request Type" to `BroadcastCustomEvent` the "Request Data" for Starting the timer is:
	 ```json
	 {
		"eventData": {
			"source": "obs-stopwatch",
			"action": "start"
		}
	}
	 ```
	 Other actions are:
	 - Stop: set `"action": "stop"`
	 - Reset: `"action": "reset"`
	 - Toggle: `"action": "toggle"`
	 - Set time: `"action": "set", "milliseconds": 90500` (sets to 1m30.5s)
4. If you change the realm in the html Settings, update `"source"` in the Stream Deck key to match.
5. Leave the browser source visible while connecting so you can see status. Once connected, the Start/Stop/Reset buttons in Stream Deck will control the timer.

# Getting Google Fonts
1. Go to [Google Fonts](https://fonts.google.com/)
2. Select a font

![image](https://github.com/Johnnycyan/obs-stopwatch/assets/24556317/34d8cf8e-f9e6-4438-bf5d-5d6172e549a2)

4. Click Get Embed Code

![image](https://github.com/Johnnycyan/obs-stopwatch/assets/24556317/f5ba762e-a9db-4c8a-bf2e-f5fdf0df88a6)

5. Click @import and copy just the link

![image](https://github.com/Johnnycyan/obs-stopwatch/assets/24556317/60a97b2e-6fbf-4426-af84-a31033e4200b)

6. Enter that link in the "Google Fonts @import" box
7. Enter the font name in the "Font Name" box, in this example it would be: Archivo Black

## Customize Font
If you want a Google Font to have a specific weight or italics etc. just specify a "One-value" in the Google Font settings before grabbing the @import link

![image](https://github.com/Johnnycyan/obs-stopwatch/assets/24556317/3d6ccb58-e381-49b8-91a2-4639bae58ac8)

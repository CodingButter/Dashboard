# Racing Sim Dashboard

A customizable 3D dashboard for racing simulations, designed to work as an OBS overlay.

## Features

- 3D visualization of steering wheel, throttle, and brake
- Real-time data from WebSocket server
- Customizable shadows and lighting
- Transparent background for OBS integration
- Interactive controls for development

## Development Setup

### Installation

```bash
npm install
```

### Environment Variables

Create a `.env` file at the root of the project with:

```
VITE_WS_SERVER=ws://your-websocket-server:port
VITE_CONTROL=true  # Enable development controls
```

### Running the Development Server

```bash
npm run dev
```

### Browser Console Debugging

For debugging browser console output, run the debug server in a separate terminal:

```bash
# Terminal 1: Start the debug server
npm run debug-server

# Terminal 2: Start the app
npm run dev

# Terminal 3: Monitor logs
npm run check-logs
```

This setup allows you to:
1. Capture all browser console logs and errors
2. Monitor them in a separate terminal
3. Debug application issues without needing browser dev tools

## Building for Production

```bash
npm run build
```

## License

MIT
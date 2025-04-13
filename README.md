# Racing Sim Dashboard

A state-of-the-art 3D dashboard for racing simulations, designed to create stunning visualizations for stream overlays, content creation, and race analytics. This powerful tool brings your racing telemetry to life in beautiful, customizable 3D.

![Racing Dashboard](public/placeholder.jpg)

## Why This Dashboard Is Amazing

- **Real-time 3D Visualization**: Experience your racing inputs as dynamic 3D models that respond instantly to your real racing hardware
- **Broadcast-Ready**: Designed specifically for streamers with transparent backgrounds, perfect for OBS and other streaming software
- **Ultra Customizable**: Fine-tune everything from lighting and shadows to camera angles and model properties
- **Three.js Powered**: Built on React Three Fiber for high-performance, WebGL-accelerated 3D rendering
- **WebSocket Integration**: Connects seamlessly to racing telemetry sources through WebSockets
- **Multiple Components**: Visualize steering wheel, throttle, brake and more independently or together
- **Persistence**: All your settings are saved automatically between sessions
- **Development Tools**: Built-in debug server and logging system make development and troubleshooting easy

## Getting Started

### Installation

```bash
npm install
```

### Environment Variables

Create a `.env` file at the root of the project with:

```
VITE_WS_SERVER=ws://your-websocket-server:port  # Your telemetry WebSocket endpoint
VITE_CONTROL=true  # Enable development controls (set to false for production)
```

### Running the Development Server

We've separated the development server and debug server for better stability:

```bash
# Start the debug server in one terminal (for logging)
npm run start-debug

# Start the development server in another terminal
npm run dev
```

> ⚠️ **IMPORTANT**: To stop the servers when you're done:
>
> ```bash
> # Stop the debug server
> npm run stop-debug
> 
> # Stop the dev server
> npm run kill-vite
> ```

### Component Views

The dashboard offers two viewing modes:

1. **Single component view** - Focus on one component at a time (steering wheel, throttle, or brake)
2. **All components view** - See all racing inputs simultaneously in a grid layout

Switch between views using the controls in the top-left corner of the application.

### Customization Controls

Each component has extensive customization options:

- **Steering Control**: Fine-tune the steering wheel rotation and response
- **Wheel Model**: Adjust rotation, scale, and camera position
- **Shadow Surface**: Configure ground plane height, size, visibility, and shadow opacity
- **Lighting Setup**: Control ambient light, brightness, fill light, and main light positioning

All settings are automatically saved to your browser's session storage.

### Enhanced Logging System

For advanced debugging and development, we've implemented a comprehensive logging system:

```bash
# Terminal 1: Start the logging server
npm run logs:start

# Terminal 2: View logs in real-time with automatic refresh
npm run logs:view

# Terminal 3: Run the development server
npm run dev
```

#### Log Management Commands

The enhanced logging system offers several useful commands:

```bash
# Clear all current logs
npm run logs:clear

# List all log files
npm run logs:files

# Stop the logging server
npm run logs:stop

# Stop all servers (both logging and development)
npm run stop-all
```

#### Features

- **Real-time log monitoring** - See logs as they happen with automatic refresh
- **Persistent log files** - All logs are saved to timestamped files in the `logs/` directory
- **Log rotation** - New log files are created when current file exceeds 500 lines
- **Log categorization** - Logs are displayed by type (error, warning, info, debug)
- **Full console capture** - All browser console output is captured and stored
- **API access** - Access logs via HTTP endpoints:
  - `http://localhost:3030/logs` - Get all in-memory logs
  - `http://localhost:3030/log-files` - List all log files
  - `http://localhost:3030/log-file/FILENAME` - View specific log file
  - `http://localhost:3030/clear-logs` - Clear in-memory logs (POST)

## Production Deployment

Build an optimized version for deployment:

```bash
npm run build
npm run preview  # Preview the production build locally
```

The production build creates static files that can be hosted on any web server or CDN.

## Integration with OBS and Streaming Software

The dashboard renders with a transparent background by default, making it perfect for overlays in your streams:

1. Add a Browser Source in OBS 
2. Point it to your hosted dashboard URL
3. Set the width and height to match your stream layout
4. Position and scale as needed over your gameplay footage

## License

MIT License - Free for personal and commercial use
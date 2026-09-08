# PalServerLogger WebSocket Client

A lightweight WebSocket client for PalServerLogger that automatically reconnects when the server is unavailable.

## What this project does

This project connects to a WebSocket server and prints incoming messages from the server. If the connection is refused or closes unexpectedly, it automatically retries every 5 seconds.

## Requirements

- Node.js 18+
- npm
- A running PalServerLogger WebSocket server on the configured host and port

## Setup

1. Install dependencies:

   ```bash
   npm install
   ```

2. Create a `.env` file in the project root:

   ```env
   WS_HOST=127.0.0.1
   WS_PORT=8765
   ```

   You can copy the example file instead:

   ```bash
   cp .env.example .env
   ```

3. Start the client:

   ```bash
   npm start
   ```

## Build

To compile the TypeScript project:

```bash
npm run build
```

## Usage

Once the server is running and reachable, the script will connect automatically.

- When connected, it logs:

  ```text
  Connected to PalServerLogger
  ```

- When a message is received, it prints the message payload.
- If the server is offline or the connection drops, it waits 5 seconds and retries automatically.

## Default connection settings

By default, the client connects to:

```text
ws://127.0.0.1:8765
```

You can change this by editing your `.env` file:

```env
WS_HOST=your-server-ip
WS_PORT=your-server-port
```

## Project structure

```text
.
├── .env.example
├── .env
├── package.json
├── README.md
├── src/
│   └── index.ts
└── tsconfig.json
```

## Troubleshooting

### Connection refused

This usually means the WebSocket server is not running yet or the host/port in `.env` is incorrect.

Check:

- the server is started
- the IP is correct
- the port matches the server configuration
- no firewall is blocking the connection

### Reconnect loop

The script automatically retries every 5 seconds. If the server comes back online, the client reconnects without needing a restart.

# PalServerLogger WebSocket Client

A lightweight WebSocket client for PalServerLogger that automatically reconnects when the server is unavailable.

## What this project does

This project connects to a WebSocket server and prints incoming messages from the server. If the connection is refused or closes unexpectedly, it automatically retries using the configured retry interval and retry cap.

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
   WS_MAX_RETRIES=30
   WS_RETRY_INTERVAL_MS=1000
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
- If the server is offline or the connection drops, it waits for the configured retry interval and retries automatically until the max retry count is reached.

## Default connection settings

By default, the client connects to:

```text
ws://127.0.0.1:8765
```

You can change this by editing your `.env` file:

```env
WS_HOST=your-server-ip
WS_PORT=your-server-port
WS_MAX_RETRIES=30
WS_RETRY_INTERVAL_MS=1000
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

### Common errors and fixes

#### ECONNREFUSED

This usually means the target WebSocket server is not running or is listening on a different port.

Fix:

- confirm the server is started
- check the value in `WS_HOST`
- verify the value in `WS_PORT`
- make sure the server is actually listening on that socket
- confirm there is no firewall or local security rule blocking the connection

#### ENOTFOUND

This means the hostname cannot be resolved.

Fix:

- use a valid IP address or hostname
- verify DNS resolution
- ensure the machine can reach the target host

#### ETIMEDOUT / EHOSTUNREACH

This usually means the host is unreachable or the network path is timing out.

Fix:

- check network connectivity
- verify the host is online
- confirm the correct LAN/WAN address
- ensure the server is reachable from the machine running this client

#### ECONNRESET / EPIPE

This often happens when the remote server closes the socket unexpectedly or the connection is interrupted.

Fix:

- check whether the server restarted or crashed
- verify the server is not dropping idle connections
- restart the server if needed
- confirm the client and server are using compatible protocols

#### EAI_AGAIN

This is commonly a DNS or transient network issue.

Fix:

- retry later
- check your internet or LAN connectivity
- confirm the hostname resolves correctly
- verify the host is reachable before retrying

#### Generic WebSocket error

This may mean the server accepted the connection but then disconnected or sent invalid data.

Fix:

- check the server logs
- verify the WebSocket endpoint is correct
- check for protocol mismatches or malformed messages
- confirm the server is still running and healthy

### Connection refused

This usually means the WebSocket server is not running yet or the host/port in `.env` is incorrect.

Check:

- the server is started
- the IP is correct
- the port matches the server configuration
- no firewall is blocking the connection

### Reconnect loop

The script automatically retries according to `WS_RETRY_INTERVAL_MS`. It stops after `WS_MAX_RETRIES` attempts and logs the connection refusal details, including the underlying Node error fields such as `errno`, `code`, `syscall`, `address`, `port`, and `message`.

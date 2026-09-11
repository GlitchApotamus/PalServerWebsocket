import dotenv from "dotenv";
import WebSocket from "ws";

dotenv.config();

const host = process.env.WS_HOST ?? "127.0.0.1";

if (!host) {
    console.error("WS_HOST is not set. Please set it in your environment variables.");
    process.exit(1);
}
const port = process.env.WS_PORT ?? "8765";

if (!port) {
    console.error("WS_PORT is not set. Please set it in your environment variables.");
    process.exit(1);
}

const token = process.env.WS_TOKEN;

if (!token) {
    console.error("WS_TOKEN is not set. Please set it in your environment variables.");
    process.exit(1);
}
const maxRetries = Number(process.env.WS_MAX_RETRIES ?? "30");
const retryIntervalMs = Number(process.env.WS_RETRY_INTERVAL_MS ?? "1000");
const websocketUrl = `ws://${host}:${port}`;

let retryTimer: NodeJS.Timeout | null = null;
let retryCount = 0;
let authFailure = false;

const commonSocketErrorCodes = new Set([
    "ECONNREFUSED",
    "ECONNRESET",
    "ENOTFOUND",
    "EHOSTUNREACH",
    "ETIMEDOUT",
    "EPIPE",
    "EAI_AGAIN"
]);

const getSocketErrorMap = (error: unknown) => {
    const e = error as {
        errno?: number;
        code?: string;
        syscall?: string;
        address?: string;
        port?: number;
        message?: string;
        statusCode?: number;
    };

    return {
        attempts: retryCount + 1,
        errno: e?.errno,
        code: e?.code ?? "UNKNOWN",
        syscall: e?.syscall,
        address: e?.address,
        port: e?.port,
        statusCode: e?.statusCode,
        message: e?.message ?? "Unknown socket error"
    };
};

const scheduleReconnect = () => {
    if (retryTimer) {
        return;
    }

    if (authFailure) {
        console.error("Reconnects are blocked because authentication failed. Update WS_TOKEN and restart the client.");
        return;
    }

    if (retryCount >= maxRetries) {
        console.error(`Maximum retry attempts reached (${maxRetries}). Stopping reconnect attempts.`);
        return;
    }

    const delayMs = retryIntervalMs;
    retryCount += 1;

    console.log(`Reconnecting in ${delayMs}ms (attempt ${retryCount}/${maxRetries})...`);

    retryTimer = setTimeout(() => {
        retryTimer = null;
        connect();
    }, delayMs);
};

const connect = () => {
    const socket = new WebSocket(websocketUrl, {
        headers: {
            Authorization: `Bearer ${token}`
        },
        timeout: 30000
    });

    socket.on("open", () => {
        retryCount = 0;
        console.log("Connected to PalServerLogger");
    });

    socket.on("message", (data) => {
        const msg = JSON.parse(data.toString());
        console.log("WS:", msg);
    });

    socket.on("error", (error) => {
        const socketError = getSocketErrorMap(error);

        if (socketError.message?.includes("401") || socketError.statusCode === 401) {
            authFailure = true;
            console.error("Authentication failed. Verify the WS_TOKEN is valid and the server expects the same token:", socketError);
            return;
        }

        if (commonSocketErrorCodes.has(socketError.code)) {
            // console.error("Common socket error:", socketError);
            scheduleReconnect();
            return;
        }

        console.error("WebSocket error:", error);
        scheduleReconnect();
    });

    socket.on("close", (code, reason) => {
        const reasonText = reason.toString();
        console.log("Closed:", code, reasonText || "No reason provided");
        scheduleReconnect();
    });
};

connect();
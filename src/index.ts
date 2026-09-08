import dotenv from "dotenv";
import WebSocket from "ws";

dotenv.config();

const host = process.env.WS_HOST ?? "127.0.0.1";
const port = process.env.WS_PORT ?? "8765";
const maxRetries = Number(process.env.WS_MAX_RETRIES ?? "30");
const retryIntervalMs = Number(process.env.WS_RETRY_INTERVAL_MS ?? "1000");
const websocketUrl = `ws://${host}:${port}`;

let retryTimer: NodeJS.Timeout | null = null;
let retryCount = 0;

const scheduleReconnect = () => {
    if (retryTimer) {
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
        const e = error as {
            code?: string;
            message?: string;
            address?: string;
            port?: number;
        };

        if (e?.code === "ECONNREFUSED") {
            const socketError = error as {
                errno?: number;
                code?: string;
                syscall?: string;
                address?: string;
                port?: number;
                message?: string;
            };


            const errorMap = {
                attempts: retryCount + 1,
                errno: socketError.errno,
                code: socketError.code,
                syscall: socketError.syscall,
                address: socketError.address,
                port: socketError.port,
                message: socketError.message
            };

            console.error("Connection refused:", errorMap);
        } else {
            console.error("WebSocket error:", error);
        }

        scheduleReconnect();
    });

    socket.on("close", (code, reason) => {
        const reasonText = reason.toString();
        console.log("Closed:", code, reasonText || "No reason provided");
        scheduleReconnect();
    });
};

connect();
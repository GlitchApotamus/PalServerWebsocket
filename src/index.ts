import dotenv from "dotenv";
import WebSocket from "ws";

dotenv.config();

const host = process.env.WS_HOST ?? "127.0.0.1";
const port = process.env.WS_PORT ?? "8765";
const websocketUrl = `ws://${host}:${port}`;

let retryTimer: NodeJS.Timeout | null = null;
let retryCount = 0;

const scheduleReconnect = () => {
    if (retryTimer) {
        return;
    }

    const delayMs = 1000;
    retryCount += 1;

    console.log(`Reconnecting in ${delayMs}ms (attempt ${retryCount})...`);

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
            errors?: Array<{
                code?: string;
                address?: string;
                port?: number;
                message?: string;
            }>;
        };

        if (e?.code === "ECONNREFUSED") {
            const errorDetails = e.errors?.map((entry) => ({
                code: entry.code,
                address: entry.address,
                port: entry.port,
                message: entry.message
            })) ?? [];

            console.error("Connection refused:", {
                attempts: retryCount + 1,
                code: e.code,
                message: e.message,
                address: e.address,
                port: e.port,
                errors: errorDetails
            });
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
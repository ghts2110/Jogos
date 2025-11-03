// bot.js
import { io } from "socket.io-client";
import { decideMove } from "./decideMove.js"; // (+)


const SERVER_URL = "http://localhost:3000";
const socket = io(SERVER_URL, { transports: ["websocket"] });

let latestState = null;
let myId = null;

socket.on("connect", () => {
    console.log("[BOT] Conectado:", socket.id);
    myId = socket.id;
});

// intercepta todos os eventos recebidos
const oldOnevent = socket.onevent;
socket.onevent = function (packet) {
    const [event, data] = packet.data || [];
    console.log(`[BOT] evento recebido: ${event}`);
    oldOnevent.call(this, packet);
};

socket.on("setup", (state) => {
    console.log("[BOT] setup inicial");
    printSummary(state);
});

socket.on("state-tick", (state) => {
    latestState = state;
    printSummary(state);
    moveRandomly();
});

async function moveRandomly() {
  if (!myId || !latestState?.players?.[myId]) return;
  const directions = await decideMove({players: latestState.players, fruits: latestState.fruits, myId: latestState.players[myId]});

  socket.emit("move-player", { keyPressed: directions });
  console.log(`[BOT] moveu para ${directions}`);
}

function printSummary(state) {
    const players = Object.keys(state.players || {}).length;
    const fruits = Object.keys(state.fruits || {}).length;
    console.log(`players: ${players}, fruits: ${fruits}`);
}

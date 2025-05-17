
const express = require("express");
const bodyParser = require("body-parser");
const fs = require("fs");
const path = require("path");
const http = require("http");
const socketIo = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = socketIo(server);
const PORT = process.env.PORT || 3000;

app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, "public")));

let highscoresGissa = [];
let highscoresRps = [];
const HIGHSCORE_GISSA = "highscores_gissa.json";
const HIGHSCORE_RPS = "highscores_rps.json";

// Gissa talet API
app.get("/api/gissa/highscores", (_, res) => {
    fs.readFile(HIGHSCORE_GISSA, (err, data) => {
        res.json(err ? [] : JSON.parse(data));
    });
});
app.post("/api/gissa/highscores", (req, res) => {
    const { name, attempts } = req.body;
    if (!name || typeof attempts !== "number") return res.status(400).send("Ogiltiga data");

    fs.readFile(HIGHSCORE_GISSA, (err, data) => {
        let scores = err ? [] : JSON.parse(data);
        scores.push({ name, attempts });
        scores.sort((a, b) => a.attempts - b.attempts);
        scores = scores.slice(0, 10);
        fs.writeFile(HIGHSCORE_GISSA, JSON.stringify(scores), () => res.json(scores));
    });
});

// RPS WebSocket
let rooms = {};
io.on("connection", (socket) => {
    socket.on("createRoom", ({ roomId, maxScore, playerName }) => {
        rooms[roomId] = {
            players: [socket.id],
            names: { [socket.id]: playerName },
            choices: {},
            scores: {},
            maxScore
        };
        socket.join(roomId);
        socket.emit("roomCreated", roomId);
    });

    socket.on("joinRoom", ({ roomId, playerName }) => {
        const room = rooms[roomId];
        if (room && room.players.length === 1) {
            room.players.push(socket.id);
            room.names[socket.id] = playerName;
            room.scores[room.players[0]] = 0;
            room.scores[socket.id] = 0;
            socket.join(roomId);
            io.to(roomId).emit("startGame", room.names);
        } else {
            socket.emit("errorMsg", "Rummet finns inte eller är fullt.");
        }
    });

    socket.on("choice", ({ roomId, choice }) => {
        const room = rooms[roomId];
        if (!room) return;

        room.choices[socket.id] = choice;
        if (Object.keys(room.choices).length === 2) {
            const [p1, p2] = room.players;
            const c1 = room.choices[p1], c2 = room.choices[p2];
            const result = getResult(c1, c2);

            if (result === 1) room.scores[p1]++;
            if (result === 2) room.scores[p2]++;

            io.to(roomId).emit("roundResult", {
                choices: { [p1]: c1, [p2]: c2 },
                scores: room.scores,
                names: room.names
            });

            const winner = room.scores[p1] >= room.maxScore ? p1 :
                          room.scores[p2] >= room.maxScore ? p2 : null;

            if (winner) {
                io.to(roomId).emit("gameOver", { winner: room.names[winner] });
                saveRpsScore(room.names[winner], room.maxScore);
                delete rooms[roomId];
            } else {
                room.choices = {};
            }
        }
    });

    socket.on("disconnect", () => {
        for (const roomId in rooms) {
            const room = rooms[roomId];
            if (room.players.includes(socket.id)) {
                io.to(roomId).emit("opponentLeft");
                delete rooms[roomId];
                break;
            }
        }
    });
});

function getResult(c1, c2) {
    if (c1 === c2) return 0;
    if ((c1 === 'rock' && c2 === 'scissors') ||
        (c1 === 'scissors' && c2 === 'paper') ||
        (c1 === 'paper' && c2 === 'rock')) return 1;
    return 2;
}

function saveRpsScore(name, score) {
    fs.readFile(HIGHSCORE_RPS, (err, data) => {
        let scores = err ? [] : JSON.parse(data);
        scores.push({ name, score });
        scores.sort((a, b) => a.score - b.score);
        scores = scores.slice(0, 10);
        fs.writeFile(HIGHSCORE_RPS, JSON.stringify(scores), () => {});
    });
}

app.get("/api/rps/highscores", (_, res) => {
    fs.readFile(HIGHSCORE_RPS, (err, data) => {
        res.json(err ? [] : JSON.parse(data));
    });
});

server.listen(PORT, () => console.log(`Nimas spelhörna körs på port ${PORT}`));

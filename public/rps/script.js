const socket = io('/', { transports: ['websocket'] });
let roomId = '';
let playerName = '';

function createRoom() {
    roomId = document.getElementById('roomId').value;
    playerName = document.getElementById('playerName').value;
    const maxScore = parseInt(document.getElementById('scoreSelect').value);
    socket.emit('createRoom', { roomId, maxScore, playerName });
}

function joinRoom() {
    roomId = document.getElementById('roomId').value;
    playerName = document.getElementById('playerName').value;
    socket.emit('joinRoom', { roomId, playerName });
}

socket.on('roomCreated', () => {
    document.getElementById('status').textContent = "Väntar på motståndare...";
    showGame();
});

socket.on('startGame', (names) => {
    document.getElementById('status').textContent = "Motståndare ansluten! Välj sten, sax eller påse.";
    document.getElementById('roundResult').textContent = '';
    document.getElementById('scoreboard').textContent = '';
    showGame();  // säkerställ att även andra spelaren ser spelet
});

function makeChoice(choice) {
    socket.emit('choice', { roomId, choice });
    document.getElementById('status').textContent = "Väntar på motståndare...";
}

socket.on('roundResult', ({ choices, scores, names }) => {
    const [p1, p2] = Object.keys(choices);
    const opponent = socket.id === p1 ? p2 : p1;

    document.getElementById('roundResult').textContent = 
        `Du valde ${choices[socket.id]} – Motståndaren valde ${choices[opponent]}`;
    document.getElementById('scoreboard').textContent =
        `Ställning: Du ${scores[socket.id] || 0} – ${scores[opponent] || 0} Motståndaren`;
    document.getElementById('status').textContent = "Välj igen!";
});

socket.on('gameOver', ({ winner }) => {
    if (winner === playerName) {
        document.getElementById('status').textContent = "🎉 Du vann matchen!";
    } else {
        document.getElementById('status').textContent = `😢 ${winner} vann matchen.`;
    }
});

socket.on('opponentLeft', () => {
    document.getElementById('status').textContent = "Motståndaren lämnade spelet.";
});

socket.on('errorMsg', (msg) => {
    document.getElementById('error').textContent = msg;
});

function showGame() {
    document.getElementById('setup').style.display = 'none';
    document.getElementById('game').style.display = 'block';
}

function updateHighscores(data) {
    const ul = document.getElementById("highscores");
    ul.innerHTML = "";
    data.forEach(entry => {
        const li = document.createElement("li");
        li.textContent = `${entry.name} – vann en match till ${entry.score}`;
        ul.appendChild(li);
    });
}

window.onload = () => {
    fetch("/api/rps/highscores")
        .then(res => res.json())
        .then(updateHighscores);
};


let targetNumber = Math.floor(Math.random() * 100) + 1;
let attempts = 0;

function checkGuess() {
    const guess = parseInt(document.getElementById('guessInput').value);
    const feedback = document.getElementById('feedback');
    const attemptsDisplay = document.getElementById('attempts');
    attempts++;

    if (isNaN(guess) || guess < 1 || guess > 100) {
        feedback.textContent = "Skriv ett giltigt tal mellan 1 och 100.";
        return;
    }

    if (guess < targetNumber) {
        feedback.textContent = "För lågt!";
    } else if (guess > targetNumber) {
        feedback.textContent = "För högt!";
    } else {
        feedback.textContent = `Rätt! Talet var ${targetNumber}. Du gissade rätt på ${attempts} försök.`;
        document.getElementById("submitScore").style.display = "block";
    }

    attemptsDisplay.textContent = `Försök: ${attempts}`;
}

function submitHighscore() {
    const name = document.getElementById("playerName").value;
    fetch("/api/gissa/highscores", {
        method: "POST",
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, attempts })
    })
    .then(res => res.json())
    .then(updateHighscores);
}

function updateHighscores(data) {
    const ul = document.getElementById("highscores");
    ul.innerHTML = "";
    data.forEach(entry => {
        const li = document.createElement("li");
        li.textContent = `${entry.name} – ${entry.attempts} försök`;
        ul.appendChild(li);
    });
}

window.onload = () => {
    fetch("/api/gissa/highscores")
        .then(res => res.json())
        .then(updateHighscores);
};

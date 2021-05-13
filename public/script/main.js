'use strict'
const playButton = document.getElementById("playNow");
playButton.onclick = playNow;

onLoad();

function onLoad() {
    let socket= io();

    socket.on(
        'RETURN_STATUS',
        setGameStatus.bind(this)
    );

    socket.emit('GIVE_STATUS');

    console.log('onLoad finished');
}

function setGameStatus(status) {
    const serverStatus = document.createElement('span');

    if(status == 'OK') {
        serverStatus.setAttribute('class', 'spinner-grow spinner-grow-sm me-2 text-success serverStatus');
        playButton.setAttribute('title','Game is Online :)');
    } else if(status == 'ERROR') {
        serverStatus.setAttribute('class', 'spinner-grow spinner-grow-sm me-2 text-danger serverStatus');
        playButton.setAttribute('title','Game is Offline :(');
        playButton.setAttribute('disabled','disabled');
    }

    var tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'))
    var tooltipList = tooltipTriggerList.map(function (tooltipTriggerEl) {
        return new bootstrap.Tooltip(tooltipTriggerEl)
    })
    
    serverStatus.setAttribute('role', 'status');
    serverStatus.setAttribute('aria-hidden', 'true');
    playButton.appendChild(serverStatus);

    const newContent = document.createTextNode("Play Now");
    playButton.appendChild(newContent);
}

function playNow() {
    window.location.href="game.html";
}
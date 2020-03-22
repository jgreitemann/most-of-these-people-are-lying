function update_player_list(players) {
  var player_list = document.getElementById('player_list');
  player_list.innerHTML = '';
  players.forEach(player => {
    var entry = document.createElement('li');
    entry.innerText = player;
    player_list.appendChild(entry);
  });
}

function load_players() {
  var request = new Request('/players');
  fetch(request)
      .then(response => response.text())
      .then(JSON.parse)
      .then(update_player_list);
}
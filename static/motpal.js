function update_players() {
  var request = new Request('/players');
  fetch(request)
      .then(function(response) {
        return response.text();
      })
      .then(JSON.parse)
      .then(function(players) {
        var player_list = document.getElementById('player_list');
        player_list.innerHTML = '';
        players.forEach(player => {
          var entry = document.createElement('li');
          entry.innerText = player;
          player_list.appendChild(entry);
        });
      });
}
update_players();
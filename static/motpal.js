function update_player_list(players) {
  var player_list = document.getElementById('player-list');
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

function update_quest(quest) {
  var quest_block = document.getElementById('quest-block');
  if (quest.active) {
    var quest_text = document.getElementById('quest-text');
    quest_text.innerText = quest.article;
    quest_block.classList.remove('hidden')
  } else {
    quest_block.classList.add('hidden');
  }
}

function load_quest() {
  var request = new Request('/quest');
  fetch(request)
      .then(response => response.text())
      .then(JSON.parse)
      .then(update_quest);
}

function connect_stream(timeout = 250) {
  console.log('Connecting to stream...');
  var source = new EventSource('/stream');
  source.addEventListener('player_update', function(event) {
    update_player_list(JSON.parse(event.data));
  }, false);
  source.addEventListener('quest_update', function(event) {
    update_quest(JSON.parse(event.data));
  }, false);
  source.addEventListener('error', async function(event) {
    console.log('Connection lost. Trying again in ' + timeout + ' ms.');
    await new Promise(r => setTimeout(r, timeout));
    connect_stream(timeout);
  }, false);
}
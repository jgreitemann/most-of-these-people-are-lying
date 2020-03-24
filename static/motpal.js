var old_player_ids = [];

function update_player_list(players) {
  var player_ids = players.map(p => p.id);
  var new_players = players.filter(p => !old_player_ids.includes(p.id));
  var dead_player_ids = old_player_ids.filter(i => !player_ids.includes(i));
  var player_list = document.getElementById('player-list');

  // remove dead players
  for (var i = 0; i < player_list.childElementCount; ++i) {
    if (!player_ids.includes(old_player_ids[i])) {
      var dead_player_node = player_list.childNodes[i];
      dead_player_node.classList.add('disappearing');
      setTimeout(() => player_list.removeChild(dead_player_node), 500);
    }
  }

  // add new players
  new_players.forEach(player => {
    var entry = document.createElement('li');
    var span = document.createElement('span');
    span.innerText = player.name;
    entry.appendChild(span);
    var delete_button = document.createElement('input');
    delete_button.type = 'button';
    delete_button.value = '';
    delete_button.onclick = () => {
      delete_player(player.id);
    };
    entry.appendChild(delete_button);
    entry.classList.add('disappearing');
    setTimeout(() => entry.classList.remove('disappearing'), 500);
    player_list.appendChild(entry);
  });

  old_player_ids = player_ids;
}

function load_players() {
  var request = new Request('/players');
  fetch(request)
      .then(response => response.text())
      .then(JSON.parse)
      .then(update_player_list);
}

function delete_player(id) {
  var request = new Request('/pop/' + id);
  fetch(request);
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
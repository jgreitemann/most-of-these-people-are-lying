var old_player_ids = [];

function update_player_list(players) {
  var player_ids = players.map(p => p.id);
  var new_players = players.filter(p => !old_player_ids.includes(p.id));
  var dead_player_ids = old_player_ids.filter(i => !player_ids.includes(i));
  var player_list = document.getElementById('player-list');
  var add_player_button = document.getElementById('add-player-button');

  // remove dead players
  for (var i = 0; i < old_player_ids.length; ++i) {
    if (!player_ids.includes(old_player_ids[i])) {
      var dead_player_node = player_list.children[i];
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
    player_list.insertBefore(entry, add_player_button);
  });

  // show / hide quest button
  if (player_ids.length >= 2) {
    show_quest();
  } else {
    hide_quest();
  }

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
  var request = new Request('/players/pop/' + id);
  fetch(request);
}

function update_quest(quest) {
  var quest_button = document.getElementById('quest-button');
  var player_list = document.getElementById('player-list');
  var player_submit = document.getElementById('add-player-submit');
  if (quest.active) {
    player_list.classList.add('immutable');
    player_submit.disabled = true;
    if (quest_button.innerText != quest.article) {
      quest_button.classList.add('collapsed');
      quest_button.classList.remove('primed');
      setTimeout(() => {
        quest_button.innerText = quest.article;
        quest_button.classList.remove('draw');
        quest_button.classList.remove('collapsed');
      }, 500);
    }
  } else {
    player_list.classList.remove('immutable');
    player_submit.disabled = false;
    if (quest_button.innerText != 'Draw') {
      quest_button.classList.add('collapsed');
      quest_button.classList.remove('primed');
      setTimeout(() => {
        quest_button.innerText = 'Draw';
        quest_button.classList.add('draw');
        quest_button.classList.remove('collapsed');
      }, 500);
    }
  }
}

function load_quest() {
  var request = new Request('/quest');
  fetch(request)
      .then(response => response.text())
      .then(JSON.parse)
      .then(update_quest);
}

function draw_quest() {
  fetch(new Request('/quest/draw'));
}

function reset_quest() {
  fetch(new Request('/quest/reset'));
}

function connect_stream(timeout = 250) {
  console.log('Connecting to stream...');
  var source = new EventSource('/stream');
  source.addEventListener(
      'player_update', event => update_player_list(JSON.parse(event.data)),
      false);
  source.addEventListener(
      'quest_update', event => update_quest(JSON.parse(event.data)), false);
  source.addEventListener(
      'heartbeat', event => tock(JSON.parse(event.data)), false);
  source.addEventListener('error', async function(event) {
    console.log('Connection lost. Trying again in ' + timeout + ' ms.');
    setTimeout(() => {
      source.close();
      connect_stream(timeout);
      load_players();
      load_quest();
    }, timeout);
  }, false);
}

function tick(event) {
  fetch(new Request('/tick'))
      .then(response => response.text())
      .then(console.log);
}

function tock(json) {
  console.log(json.message);
}

function show_modal() {
  keyCodesEnabled = true;

  var overlay = document.getElementById('modal-overlay');
  var form = document.getElementById('add-player-form');
  var dialog = document.getElementById('add-player-dialog');
  var name_text = document.getElementById('name-text');
  var article_text = document.getElementById('article-text')

  name_text.value = '';
  article_text.value = '';

  overlay.classList.remove('hidden');
  form.classList.remove('hidden');
  name_text.focus();
  setTimeout(() => {
    overlay.classList.add('modal');
    dialog.classList.add('modal');
  }, 100);
}

function hide_modal() {
  keyCodesEnabled = false;

  var overlay = document.getElementById('modal-overlay');
  var form = document.getElementById('add-player-form');
  var dialog = document.getElementById('add-player-dialog');

  overlay.classList.remove('modal');
  dialog.classList.remove('modal');
  setTimeout(() => {
    overlay.classList.add('hidden');
    form.classList.add('hidden');
  }, 250);
}

function show_quest() {
  var quest_block = document.getElementById('quest-block');

  quest_block.classList.remove('hidden');
  setTimeout(() => quest_block.classList.add('visible'), 250);
}

function hide_quest() {
  var quest_block = document.getElementById('quest-block');

  quest_block.classList.remove('visible');
  setTimeout(() => quest_block.classList.add('hidden'), 250);
}

function quest_action_click(event) {
  event.stopPropagation();
  quest_action();
}

function quest_action() {
  var button = document.getElementById('quest-button');

  if (button.classList.contains('draw')) {
    draw_quest();
  } else if (button.classList.contains('primed')) {
    reset_quest();
  } else {
    button.classList.add('primed');
  }
}

function quest_unprime(event) {
  var button = document.getElementById('quest-button');
  button.classList.remove('primed');
}

function escape_action(event) {
  var overlay = document.getElementById('modal-overlay');
  if (overlay.classList.contains('modal')) {
    hide_modal();
  } else {
    quest_unprime(event);
  }
}
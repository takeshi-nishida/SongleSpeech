//-----------------------------------------------------------------------------
// Settings
//-----------------------------------------------------------------------------

const defaultMessages = ["はい！", "おい！"];

// Files should be put in the "sounds" folder.
const audioFileNames = {
  "👏" : "clap1.wav",
  "👏👏" : "clap2.wav"
};

//-----------------------------------------------------------------------------
// Songle Widget event handlers
//-----------------------------------------------------------------------------
let focusedElement;

window.onload = function(){
  const url = new URLSearchParams(new URL(location.href).search).get('url') || "www.youtube.com/watch?v=zweVJrnE1uY";
  const songleWidget = SongleWidgetAPI.createSongleWidgetElement({ api: "songle-widget-api", url });
  document.getElementById("songle-widget-container").appendChild(songleWidget);

  loadAudioFiles();
  loadDefaultMessages();
}

window.onSongleWidgetReady = function(apiKey, songleWidget){
  songleWidget.volume = document.getElementById("volumeRange").value;
  songleWidget.beatEventTimingOffset = -100;
  songleWidget.chorusSegmentEventTimingOffset =  -1000;
  songleWidget.eventPollingInterval = 10;
  console.log(songleWidget.song);
  createTable(songleWidget);

  document.getElementById("volumeRange").onchange = e => {
    songleWidget.volume = e.target.value;
  }

  songleWidget.on("play", function(e){
  });

  songleWidget.on("beatPlay", function(e){
    const el = beatElement(e.beat);
    el.classList.add('table-info');
    el.scrollIntoView(false);
    focusedElement = el;
    const call = calls[el.id];
    if(call){
      switch(call.type){
        case "text": speakImmediately(call.utterance); break;
        case "audio": call.audio.play(); break;
      }
    }
  });

  songleWidget.on("beatLeave", function(e){
    beatElement(e.beat).classList.remove('table-info');
  });

  songleWidget.on("chorusSegmentEnter", function(e){
  });

  songleWidget.on("seek", function(e){
    document.querySelectorAll('.table-info').forEach(el => {
      el.classList.remove('table-info');
    })
  })
}

//-----------------------------------------------------------------------------
// Connecting the user interface with Songle Widget
//-----------------------------------------------------------------------------

function createTable(songleWidget){
  const table = document.getElementById('bars');
  songleWidget.song.scene.bars.forEach(bar => {
    const tr = document.createElement('tr');
    const th = document.createElement('th');
    if(isInChorus(bar.start, songleWidget.song)) th.classList.add('table-warning');
    const b = createBootstrapButton(bar.index);
    b.dataset.start = bar.start;
    th.appendChild(b);
    tr.appendChild(th);
    bar.beats.forEach(beat => {
      const td = document.createElement('td');
      td.id = beatElementId(beat);
      td.textContent = beat.position;
      td.dataset.position = beat.position;
      tr.appendChild(td);
    });
    table.appendChild(tr);
  });

  table.onclick = e => {
    switch(event.target.tagName){
      case 'TD':
        setCallToElement(getSelectedCall(), event.target);
        break;
      case 'TH':
      　let span = event.target.querySelector('span');
        if(!span) span = document.createElement('span');
        if(!span.textContent) span.textContent = '編集可能テキスト';
        span.setAttribute('contentEditable', true);
        event.target.appendChild(span);
      case 'BUTTON':
        if(!event.target.dataset.start) break;
        const wasPlaying = songleWidget.isPlaying;
        songleWidget.seekTo(event.target.dataset.start);
        if(!wasPlaying) songleWidget.pause();
        break;
      default:
    }
  }
}

function beatElementId(beat){ return 'beat' + beat.index; }
function beatElement(beat){ return document.getElementById(beatElementId(beat)); }

function isInChorus(t, song){
  return song.scene.chorusSegments[0].repeats.some(c => t > c.start && t < c.start + c.duration);
}

//-----------------------------------------------------------------------------
// User interface
//-----------------------------------------------------------------------------

document.getElementById('addMessageButton').onclick = e => {
  const messageInput = document.getElementById('messageInput');
  const t = messageInput.value;
  if(!t) return;
  speakImmediately(createUtterance(t));
  messageInput.value = '';
  const select = document.getElementById("messages");
  addOption(select, t, t);
}

document.getElementById('addSyncButton').onclick = e => {
  if(focusedElement) setCallToElement(getSelectedCall(), focusedElement);
}

document.addEventListener('keydown', e => {
  if(e.target.tagName != "BODY") return;
  const index = parseInt(e.key);
  if(!index) return;
  const call = getNthCall(index - 1);
  if(call){
    if(focusedElement) setCallToElement(call, focusedElement);
    document.getElementById("messages").value = call.key;
  }
});

function getSelectedCall(){
  return callItems[document.getElementById("messages").value];
}

function getNthCall(n){
  return callItems[document.getElementById("messages").children[n].value];
}

function setCallToElement(callItem, el){
  const id = el.id;
  if(!calls[id]) calls[id] = {};
  calls[id] = callItem;
  el.textContent = callItem.key;
}

function createBootstrapButton(label){
  const b = document.createElement('button');
  b.setAttribute('type', 'button');
  b.classList.add('btn', 'btn-outline-primary', 'mx-1');
  b.textContent = label;
  return b;
}

function addOption(select, text, value){
  const o = document.createElement('option');
  o.textContent = "(" + (select.childElementCount + 1) + ") " + text;
  o.value = value;
  select.appendChild(o);
  return o;
}

//-----------------------------------------------------------------------------
// Calls
//-----------------------------------------------------------------------------

let calls = {};
const callItems = {};

speechSynthesis.onvoiceschanged = e => {
  const select = document.getElementById("selectVoice");
  speechSynthesis.getVoices().forEach(v => {
    const o = document.createElement('option');
    o.value = v.name;
    o.text = v.name;
    select.appendChild(o);
  })
}

function loadDefaultMessages(){
  const select = document.getElementById("messages");
  defaultMessages.forEach(m => {
    createUtterance(m);
    const o = addOption(select, m, m);
  });
}

function createUtterance(text){
  if(callItems[text]) return callItems[text].utterance;
  const select = document.getElementById("selectVoice");
  const u = new SpeechSynthesisUtterance(text);
  u.voice = speechSynthesis.getVoices().find(v => v.name == select.value);
  u.rate = 4;
//  u.pitch = 0;
  callItems[text] = { type: "text", key: text, utterance: u };
  return u;
}

function speakImmediately(u){
  speechSynthesis.cancel();
  speechSynthesis.speak(u);
}

function speakModestly(u){
  if(speechSynthesis.speaking || speechSynthesis.pending) return;
  speechSynthesis.speak(u);
}

function loadAudioFiles(){
  const select = document.getElementById("messages");
  Object.keys(audioFileNames).forEach(key => {
    const name = audioFileNames[key];
    const a = new Audio();
    a.src = "./sounds/" + name;
    a.load();
    callItems[key] = { type: "audio", key: key, audio: a };
    const o = addOption(select, key, key);
  });
}

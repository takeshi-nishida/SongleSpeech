//-----------------------------------------------------------------------------
// Songle Widget event handlers
//-----------------------------------------------------------------------------
let focusedElement;

window.onload = function(){
  const url = new URLSearchParams(new URL(location.href).search).get('url') || "www.youtube.com/watch?v=zweVJrnE1uY";
  const songleWidget = SongleWidgetAPI.createSongleWidgetElement({ api: "songle-widget-api", url });
  document.getElementById("songle-widget-container").appendChild(songleWidget);
}

window.onSongleWidgetReady = function(apiKey, songleWidget){
  songleWidget.volume = 30;
  songleWidget.beatEventTimingOffset = -100;
  songleWidget.chorusSegmentEventTimingOffset =  -1000;
  songleWidget.eventPollingInterval = 10;
  console.log(songleWidget.song);
  createTable(songleWidget);

  songleWidget.on("play", function(e){
  });

  songleWidget.on("beatPlay", function(e){
    const el = beatElement(e.beat);
    el.classList.add('table-info');
    el.scrollIntoView(false);
    focusedElement = el;
    if(el.dataset.message) speakImmediately(el.dataset.message);
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
        setMessageToElement(getSelectedCallMessage(), event.target);
        break;
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
  console.log(song.scene.chorusSegments[0].repeats);
  return song.scene.chorusSegments[0].repeats.some(c => t > c.start && t < c.start + c.duration);
}

//-----------------------------------------------------------------------------
// User interface
//-----------------------------------------------------------------------------

document.getElementById('addMessageButton').onclick = e => {
  const messageInput = document.getElementById('messageInput');
  const t = messageInput.value;
  if(!t) return;
  const u = getUtterance(t);
  speakImmediately(u);
  messageInput.value = '';

  const messages = document.getElementById('messages');
  const n = messages.querySelector('label').cloneNode(true);
  n.classList.remove('d-none');
  n.lastChild.textContent = t;
  messages.appendChild(n);
}

document.getElementById('addSyncButton').onclick = e => {
  if(focusedElement) setMessageToElement(getSelectedCallMessage(), focusedElement);
}

function getSelectedCallMessage(){
  return document.querySelector('[name=calls]:checked').labels[0].textContent.trim();
}

function setMessageToElement(t, el){
  if(el.dataset.message == t){
    el.textContent = el.dataset.position;
    el.dataset.message = null;
  }
  else{
    el.textContent = t;
    el.dataset.message = t;
  }
}

function createBootstrapButton(label){
  const b = document.createElement('button');
  b.setAttribute('type', 'button');
  b.classList.add('btn', 'btn-outline-primary');
  b.textContent = label;
  return b;
}

//-----------------------------------------------------------------------------
// Speech Synthesis utility functions
//-----------------------------------------------------------------------------

const utterances = {};

speechSynthesis.onvoiceschanged = e => {
  const select = document.getElementById("selectVoice");
  speechSynthesis.getVoices().forEach(v => {
    const o = document.createElement('option');
    o.value = v.name;
    o.text = v.name;
    select.appendChild(o);
  })
}

function getUtterance(text){
  if(utterances[text]) return utterances[text];
  const select = document.getElementById("selectVoice");
  const u = new SpeechSynthesisUtterance(text);
  u.voice = speechSynthesis.getVoices().find(v => v.name == select.value);
  u.rate = 5;
  u.pitch = 0;
  utterances[text] = u;
  return u;
}

function speakImmediately(t){
  const u = getUtterance(t);
  speechSynthesis.cancel();
  speechSynthesis.speak(u);
}

function speakModestly(t){
  if(speechSynthesis.speaking || speechSynthesis.pending) return;
  const u = getUtterance(t);
  speechSynthesis.speak(u);
}

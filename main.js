//-----------------------------------------------------------------------------
// Songle Widget event handlers
//-----------------------------------------------------------------------------

window.onSongleWidgetReady = function(apiKey, songleWidget){
  songleWidget.beatEventTimingOffset = -100;
  songleWidget.chorusSegmentEventTimingOffset =  -1000;
  songleWidget.eventPollingInterval = 10;
  console.log(songleWidget.song);
  createTable(songleWidget.song);

  songleWidget.on("play", function(e){
  });

  songleWidget.on("beatPlay", function(e){
    const el = beatElement(e.beat);
    el.classList.add('table-info');
    el.scrollIntoView(false);
  });

  songleWidget.on("beatLeave", function(e){
    beatElement(e.beat).classList.remove('table-info');
  });

  songleWidget.on("chorusSegmentEnter", function(e){
  });
}

//-----------------------------------------------------------------------------
// Connecting the user interface with Songle Widget
//-----------------------------------------------------------------------------

function createTable(song){
  const table = document.getElementById('bars');
  song.scene.bars.forEach(bar => {
    const tr = document.createElement('tr');
    const th = document.createElement('th');
    th.textContent = bar.index;
    tr.appendChild(th);
    bar.beats.forEach(beat => {
      const td = document.createElement('td');
      td.id = beatElementId(beat);
      td.textContent = beat.position;
      td.onclick = e => {
        const call = document.querySelector('[name=calls]:checked').labels[0].textContent.trim();
        td.textContent = call;
      };
      tr.appendChild(td);
    });
    table.appendChild(tr);
  });
}

function beatElementId(beat){ return 'beat' + beat.index; }
function beatElement(beat){ return document.getElementById(beatElementId(beat)); }

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
  utterances[text] = u;
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

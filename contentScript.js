console.log("outside")
let currentSongUrl;
console.log("inside")

let pub = true;
let sub = true;
var autoGet = false;
var html = `
<div style="height:1000px;width:500px;">
<div id="floatbar" tabindex="1">
  <span id="receive-icon" class="material-symbols-outlined receive-icon">
    download
  </span>

  <div class="float-button" >
  <span class="sync-settings hide-sync-settings">
  <input class="sync-settings hide-sync-settings" type="checkbox"> automatically get
  
  <span class="float-icon material-symbols-outlined">
    download
    <span class="float-icon-badge material-symbols-outlined">
    sync
    </span>
  </span>
</div>
  
  
  </span>
  <span id="sync-publish" class="material-symbols-outlined">
    publish
  </span>
  <span class="material-symbols-outlined">
    sync
  </span>
  <span class="material-symbols-outlined">
    sync_disabled
  </span>
  <span class="material-symbols-outlined">
    sync_problem
  </span>
  
<div class="float-button" >

    <input id="session-input" class="sync-settings hide-sync-settings">
  </input>
  <span id="sync-settings-icon" class="float-icon material-symbols-outlined">
    settings
  </span>
</div>
</div>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@48,400,0,0" />
`
document.body.insertAdjacentHTML("beforeend", html);

function toggleSettingsVisibility() {
  console.log("toggle")
  for (const x of document.getElementsByClassName('sync-settings')) { x.classList.toggle('hide-sync-settings') }
}
document.getElementById("sync-settings-icon").addEventListener('click', toggleSettingsVisibility);

function blurSettings(event) {
  console.log("blur", event)
  if (!(event.relatedTarget && (event.relatedTarget.classList.contains("sync-settings") || event.relatedTarget.id == "floatbar")))
    toggleSettingsVisibility();
}
document.getElementById("floatbar").addEventListener('focusout', blurSettings);

document.getElementById("sync-publish").addEventListener('click', function () { let actualSongUrl = getSongUrl(document.location.href); console.log("publishing.", actualSongUrl); publishSongUrl() });

function blurSessionInput(event) {
  console.log(event.target.value)
  chrome.storage.local.set({ session: event.target.value })
}
document.getElementById("session-input").addEventListener('blur', blurSessionInput, true);

/* storage initial check */
chrome.storage.local.get(null, function (data) {
  document.getElementById("session-input").value = data["session"]
  document.getElementById("sync-settings-auto-get").value = data["autoGet"]
  autoPush = false
  let actualSongUrl = getSongUrl(document.location.href);
  if (autoPush && (data["sessionSong"] === actualSongUrl)) {
    publishSongUrl()
  }
});
/* storage listeners */
chrome.storage.onChanged.addListener((changes, namespace) => {
  for (let [key, { oldValue, newValue }] of Object.entries(changes)) {
    console.log(
      `Storage key "${key}" in namespace "${namespace}" changed.`,
      `Old value was "${oldValue}", new value is "${newValue}".`
    );
    if (key === "session") {
      document.getElementById("session-input").value = newValue;
    }
    if (key === "sessionSong") {
      if (newValue) {
        if (newValue != getSongUrl(document.location.href)) {
          if (autoGet)
            receiveSong(newValue)
          else {
            receivedSongAvailable(newValue);
          }
        } else {
          receivedSongIsOurs();
        }
      }
    }
  }
});

function receiveSong(songUrl) {
  window.location = baseSongUrlHttps + songUrl;
}

function receivedSongAvailable(songUrl) {
  console.log("receivedSongAvailable", songUrl)
  let icon = document.getElementById('receive-icon');
  icon.classList.add('receive-icon-available');
  icon.addEventListener('click', function () {
    receiveSong(songUrl);
  });
}

function receivedSongIsOurs() {
  let icon = document.getElementById('receive-icon');
  icon.classList.remove('receive-icon-available');
  icon.removeAttr('onclick');
}

/* message listeners */
chrome.runtime.onMessage.addListener((obj, sender, response) => {
  const { type, songUrl } = obj;
  if (type === "anything?") {
  }
});

function publishSongUrl() {
  // send message to background worker
  let actualSongUrl = getSongUrl(document.location.href);
  console.log("publishSongUrl", actualSongUrl)
  chrome.runtime.sendMessage({
    message: "publishSong",
    payload: actualSongUrl
  }/*, response => {
    if (response.message === 'success') {
      ce_name.innerHTML = `Hello ${ce_input.value}`;
    }
  }*/);
}


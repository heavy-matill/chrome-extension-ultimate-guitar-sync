var autoGet = false
var autoPush = false

var html = `
  <div id="floatbar" tabindex="1">

    <div class="float-button">
      <a class="sync-settings hide-sync-settings">
        automatically push <input id="checkbox-push" class="sync-settings hide-sync-settings" type="checkbox">
      </a>
      <span id="sync-publish" class="material-symbols-outlined">
        cloud_upload
      </span>
    </div>

    <div class="float-button">
      <a class="sync-settings hide-sync-settings">
        automatically get <input id="checkbox-get" class="sync-settings hide-sync-settings" type="checkbox">
      </a>
      <span id="receive-icon" class="material-symbols-outlined receive-icon">
        browser_updated
      </span>
    </div>

    <div class="float-button sync-settings hide-sync-settings" style="text-align: left">
      <a class="sync-settings hide-sync-settings">
        Session ID
      </a><a class="sync-settings hide-sync-settings">
        <span id="sync-random-icon" class="float-icon material-symbols-outlined">
          casino
        </span>
      </a>
      <a class="sync-settings hide-sync-settings">
        <span id="sync-share-icon" class="float-icon material-symbols-outlined">
          share
        </span>
      </a>
      <div>
        <input id="session-input" class="sync-settings hide-sync-settings">
        </input>
      </div>
    </div>

    <div class="float-button">
      <span id="sync-settings-icon" class="float-icon material-symbols-outlined">
        settings
      </span>
    </div>

<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@48,400,0,0" />
`
document.body.insertAdjacentHTML("beforeend", html);

function toggleSettingsVisibility() {
  for (const x of document.getElementsByClassName('sync-settings')) { x.classList.toggle('hide-sync-settings') }
}
document.getElementById("sync-settings-icon").addEventListener('click', toggleSettingsVisibility);

function blurSettings(event) {
  console.log("blur", event)
  if (!(event.relatedTarget && (event.relatedTarget.classList.contains("sync-settings") || event.relatedTarget.id == "floatbar")))
    toggleSettingsVisibility();
}
document.getElementById("floatbar").addEventListener('focusout', blurSettings);

function randomSession() {
  let randomString = (Math.random() + 1).toString(36).substring(2);
  setSessionId(randomString);
}
document.getElementById("sync-random-icon").addEventListener('click', randomSession);

function shareSession() {
  let sessionId = document.getElementById("session-input").value;
  const shareData = {
    title: 'Synced Ultimate Guitar Session',
    text: 'Join my session with id: ' + sessionId,
    url: window.location.href + '?syncSessionId=' + sessionId
  }
  navigator.share(shareData)
}
document.getElementById("sync-share-icon").addEventListener('click', shareSession);

document.getElementById("sync-publish").addEventListener('click', function () { let actualSongUrl = getSongUrl(document.location.href); console.log("publishing.", actualSongUrl); publishSongUrl() });

function setSessionId(sessionId) {
  document.getElementById("session-input").value = sessionId;
  chrome.storage.local.set({ session: sessionId })
}
function blurSessionInput(event) {
  setSessionId(event.target.value);
}
// check if query param for session was passed
const urlSearchParams = new URLSearchParams(window.location.search);
const params = Object.fromEntries(urlSearchParams.entries());
if (params["syncSessionId"]) {
  setSessionId(params["syncSessionId"])
}

document.getElementById("session-input").addEventListener('blur', blurSessionInput, true);

// checkboxes
document.getElementById("checkbox-get").addEventListener('change', function () {
  console.log(this.checked)
  autoGet = this.checked
  chrome.storage.local.set({ autoGet: this.checked })
});
document.getElementById("checkbox-push").addEventListener('change', function () {
  console.log(this.checked)
  autoPush = this.checked
  chrome.storage.local.set({ autoPush: this.checked })
});

/* storage initial check */
chrome.storage.local.get(null, function (data) {
  document.getElementById("session-input").value = data["session"]
  autoGet = data["autoGet"] ? true : false;
  document.getElementById("checkbox-get").checked = autoGet
  autoPush = data["autoPush"] ? true : false;
  document.getElementById("checkbox-push").checked = autoPush
  let actualSongUrl = getSongUrl(document.location.href);
  if (autoPush && (data["sessionSong"] != getSongUrl(document.location.href))) {
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
    /*if (key === "autoGet") {
      autoGet = newValue;
    }
    if (key === "autoPush") {
      autoPush = newValue;
    }*/
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


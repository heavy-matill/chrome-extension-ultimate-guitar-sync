console.log("outside")
let currentSongUrl;
console.log("inside")

let pub = true;
let sub = true;
var html = `
<div style="height:1000px;width:500px;">
<div id="floatbar" tabindex="1">
  <span class="material-symbols-outlined">
    download
  </span>
  
  <span class="float-icon material-symbols-outlined">
    download
    <span class="float-icon-badge material-symbols-outlined">
    sync
  </span>
  </span>
  <span class="material-symbols-outlined">
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
  
<a class="float-button" >

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
    console.log("blur",event)
    if (!(event.relatedTarget && (event.relatedTarget.classList.contains("sync-settings") || event.relatedTarget.id == "floatbar")))
        toggleSettingsVisibility();
}
document.getElementById("floatbar").addEventListener('focusout', blurSettings);

function blurSessionInput(event) {
    console.log(event.target.value)
    chrome.storage.local.set({session: event.target.value})
}
document.getElementById("session-input").addEventListener('blur', blurSessionInput, true);

/* storage initial check */
chrome.storage.local.get(null, function (data) {
    document.getElementById("session-input").value = data["session"]
  });
/*storage listeners*/
chrome.storage.onChanged.addListener((changes, namespace) => {
    for (let [key, { oldValue, newValue }] of Object.entries(changes)) {
      console.log(
        `Storage key "${key}" in namespace "${namespace}" changed.`,
        `Old value was "${oldValue}", new value is "${newValue}".`
      );
      if (key === "session") {
        document.getElementById("session-input").value = newValue;
      }
    }
  });
/* other part */
chrome.runtime.onMessage.addListener((obj, sender, response) => {
    const { type, value, songUrl } = obj;

    if (type === "newSong") {
        if (pub && session) {
            // we want to publish and we are part of a session
            if (currentSongUrl != songUrl) {
                // new songUrl is not equal to the latest subscribed change, othwise we may just have gotten in sync with the latest sub
                publishSongUrl(songUrl);
            }
        }
    } else if (type === "updatedSong") {
        if (session) {
            // we subscribed to a session
            let activeSongUrl = getSongUrl(document.location.href);
            let tempSongUrl = currentSongUrl;
            currentSongUrl = songUrl;
            if (activeSongUrl === tempSongUrl) {
                // we were on the last active song when a new one was published
                // update without asking
                window.location = baseSongUrlHttps + songUrl;
            } else {
                // we were on a different song or browsing while a new one was published
                // ask if user wants update
            }

        }
    }
    //var fixedDiv = document.createElement("div");
    //fixedDiv.classList.add('fixed-action-btn horizontal click-to-toggle spin-close');
    // floating actions from https://codepen.io/deseanwu/pen/gwNjve

});

const publishSongUrl = (songUrl) => {
    // publish mqtt via background

    // set currentSongUrl
    currentSongUrl = songUrl;
}


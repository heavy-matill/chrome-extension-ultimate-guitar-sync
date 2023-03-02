console.log(tabId, data)
if (tabId in data) {
  var tabSettings = data[tabId]
} else {
  var tabSettings = { autoGet: false, autoPush: false }
  chrome.storage.sync.set({ [tabId]: tabSettings });
}
var autoGet = tabSettings.autoGet;
var autoPush = tabSettings.autoPush;
var sessionId = data['sessionId'] ?? randomSession();
var initialDragTop = data['dragTop'] ?? "50%";
var initialDragLeft = data['dragLeft'] ?? "0px";

/* overwrite with query params */
// check if query param for session was passed
const urlSearchParams = new URLSearchParams(window.location.search);
const params = Object.fromEntries(urlSearchParams.entries());
if (params["syncSessionId"]) {
  sessionId = params["syncSessionId"];
  autoGet = true;
  autoPush = false;
}

var html = `
  <div id="floatbar" tabindex="1">
    <div id="sync-link"><a>
        Artist - Song Title
      </a></div>
    <div id="sync-get" class="sync-icon sync-icon-button sync-active">
      <svg viewBox="0 0 640 512 " width="100" title="download">
        <path d="m 640,357.65545 c 0,64 -64,121.6 -128,121.6 -64,0 -309.5597,1.67523 -384,0 -64,0 -128,-64 -128,-128 v -192 C 0,95.255453 64,31.255453 128,31.255453 h 384 c 64,0 128,64 128,127.999997 z M 425.38689,253.73585 h -65.4 v -112 c 0,-8.8 -7.2,-16 -16,-16 h -48 c -8.8,0 -16,7.20001 -16,16 v 112 h -65.4 c -14.3,0 -21.4,17.2 -11.3,27.3 l 105.4,105.4 c 6.2,6.2 16.4,6.2 22.6,0 l 105.4,-105.4 c 10.1,-10.1 2.9,-27.3 -11.3,-27.3 z" />
      </svg>
    </div>
    <div id="sync-publish" class="sync-icon sync-icon-button sync-inactive">
      <svg viewBox="0 0 640 512" width="100" title="cloud-upload-alt">
        <path d="M537.6 226.6c4.1-10.7 6.4-22.4 6.4-34.6 0-53-43-96-96-96-19.7 0-38.1 6-53.3 16.2C367 64.2 315.3 32 256 32c-88.4 0-160 71.6-160 160 0 2.7.1 5.4.2 8.1C40.2 219.8 0 273.2 0 336c0 79.5 64.5 144 144 144h368c70.7 0 128-57.3 128-128 0-61.9-44-113.6-102.4-125.4zM393.4 288H328v112c0 8.8-7.2 16-16 16h-48c-8.8 0-16-7.2-16-16V288h-65.4c-14.3 0-21.4-17.2-11.3-27.3l105.4-105.4c6.2-6.2 16.4-6.2 22.6 0l105.4 105.4c10.1 10.1 2.9 27.3-11.3 27.3z" />
      </svg>
    </div>
    <div id="sync-session" class="sync-icon sync-icon-button sync-active">
      <svg viewBox="0 0 640 512" width="100" title="users">
        <path d="M96 224c35.3 0 64-28.7 64-64s-28.7-64-64-64-64 28.7-64 64 28.7 64 64 64zm448 0c35.3 0 64-28.7 64-64s-28.7-64-64-64-64 28.7-64 64 28.7 64 64 64zm32 32h-64c-17.6 0-33.5 7.1-45.1 18.6 40.3 22.1 68.9 62 75.1 109.4h66c17.7 0 32-14.3 32-32v-32c0-35.3-28.7-64-64-64zm-256 0c61.9 0 112-50.1 112-112S381.9 32 320 32 208 82.1 208 144s50.1 112 112 112zm76.8 32h-8.3c-20.8 10-43.9 16-68.5 16s-47.6-6-68.5-16h-8.3C179.6 288 128 339.6 128 403.2V432c0 26.5 21.5 48 48 48h288c26.5 0 48-21.5 48-48v-28.8c0-63.6-51.6-115.2-115.2-115.2zm-223.7-13.4C161.5 263.1 145.6 256 128 256H64c-35.3 0-64 28.7-64 64v32c0 17.7 14.3 32 32 32h65.9c6.3-47.4 34.9-87.3 75.2-109.4z" />
      </svg>
      <div id="sync-userCount" class="sync-badge">3</div>
    </div>
  </div>

  <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@48,400,0,0" />
  <svg>
    <filter id='inset-shadow'>
      <!-- Shadow offset -->
      <feOffset dx='0' dy='0' />

      <!-- Shadow blur -->
      <feGaussianBlur stdDeviation='60' result='offset-blur' />

      <!-- Invert drop shadow to make an inset shadow -->
      <feComposite operator='out' in='SourceGraphic' in2='offset-blur' result='inverse' />

      <!-- Cut color inside shadow -->
      <feFlood flood-color='black' flood-opacity='.95' result='color' />
      <feComposite operator='in' in='color' in2='inverse' result='shadow' />

      <!-- Placing shadow over element -->
      <feComposite operator='over' in='shadow' in2='SourceGraphic' />
    </filter>
  </svg>

  <dialog id="sync-session-dialog">
    <div id="sync-session-actual-dialog">
      <div id="sync-session-dialog-header" class=" sync-icon sync-active"><svg viewBox="0 0 640 512" width="100" title="users">
          <path d="M96 224c35.3 0 64-28.7 64-64s-28.7-64-64-64-64 28.7-64 64 28.7 64 64 64zm448 0c35.3 0 64-28.7 64-64s-28.7-64-64-64-64 28.7-64 64 28.7 64 64 64zm32 32h-64c-17.6 0-33.5 7.1-45.1 18.6 40.3 22.1 68.9 62 75.1 109.4h66c17.7 0 32-14.3 32-32v-32c0-35.3-28.7-64-64-64zm-256 0c61.9 0 112-50.1 112-112S381.9 32 320 32 208 82.1 208 144s50.1 112 112 112zm76.8 32h-8.3c-20.8 10-43.9 16-68.5 16s-47.6-6-68.5-16h-8.3C179.6 288 128 339.6 128 403.2V432c0 26.5 21.5 48 48 48h288c26.5 0 48-21.5 48-48v-28.8c0-63.6-51.6-115.2-115.2-115.2zm-223.7-13.4C161.5 263.1 145.6 256 128 256H64c-35.3 0-64 28.7-64 64v32c0 17.7 14.3 32 32 32h65.9c6.3-47.4 34.9-87.3 75.2-109.4z" />
        </svg>
        <div>Session Settings</div>
      </div>
      <div id="sync-session-dialog-content">
        Enter Session name to create a session or join an existing. You are one of <b id="sync-session-dialog-user-count">0</b> users in session <b id="sync-session-dialog-session-label">XYZ</b>.<input id="sync-session-dialog-session-input" type="text" />
        <div>
          <button id="sync-session-dialog-random" class="pure-material-button-contained pure-material-button-contained-secondary">Random</button>
          <button id="sync-session-dialog-share" class="pure-material-button-contained pure-material-button-contained-secondary">Share</button>
          <button id="sync-session-dialog-ok" style="float: right;" class="pure-material-button-contained pure-material-button-contained-primary">Ok</button>
        </div>
      </div>
    </div>
  </dialog>
`
document.body.insertAdjacentHTML("beforeend", html);

// JS https://codepen.io/heavy-matill/pen/ZEMQbMm

/* Dialog settings */
const elDlgOk = document.getElementById('sync-session-dialog-ok');
const elDlgRandom = document.getElementById('sync-session-dialog-random');
const elDlgShare = document.getElementById('sync-session-dialog-share');
const elDlgSessionLabel = document.getElementById('sync-session-dialog-session-label')
const elDlgSessionInput = document.getElementById('sync-session-dialog-session-input')
const elDlgUserCount = document.getElementById('sync-session-dialog-user-count')

const elDlgBackground = document.getElementById('sync-session-dialog');
elDlgBackground.addEventListener('click', () => elDlgBackground.close());
elDlgOk.addEventListener('click', () => elDlgBackground.close());

const elDlg = document.getElementById('sync-session-actual-dialog');
elDlg.addEventListener('click', (event) => event.stopPropagation());

elDlgSessionInput.addEventListener('blur', (event) => setSessionId(event.target.value));
function setSessionId(sId) {
  sessionId = sId;
  elDlgSessionInput.value = sId;
  elDlgSessionLabel.innerHTML = sId;
  chrome.storage.sync.set({ "sessionId": sessionId });
  countUsers();
}

/* Other */
const elLink = document.getElementById("synk-link");
const elGet = document.getElementById("sync-get");
const elPublish = document.getElementById("sync-publish");
const elSession = document.getElementById("sync-session");
const elUserCount = document.getElementById("sync-userCount");

var allowClick = true;
elPublish.addEventListener("click", () => { if (allowClick) publish() });
elGet.addEventListener("click", () => { if (allowClick) get() });
elSession.addEventListener("click", () => { if (allowClick) elDlgBackground.showModal() });

function setAutoGet(b) {
  autoGet = b;
  if (b) {
    activate(elGet);
    autoPush = false;
    deactivate(elPublish);
  } else deactivate(elGet);
}

function setAutoPublish(b) {
  autoPush = b;
  if (b) {
    activate(elPublish);
    autoGet = false;
    deactivate(elGet);
  } else deactivate(elPublish);
}

function publish(event) {
  if (autoPush) {
    // stop auto publishing
    setAutoPublish(false);
  } else {
    setAutoPublish(true);
    // actually publish
    publishSongUrl()
  }
}

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

function get(event) {
  console.log("get")
  if (autoGet) {
    setAutoGet(false);
  } else {
    setAutoGet(true);
    // actually get
  }
}

function activate(el) {
  el.classList.remove("sync-inactive");
  el.classList.add("sync-active");
}

function deactivate(el) {
  el.classList.add("sync-inactive");
  el.classList.remove("sync-active");
}

function randomSession() {
  return (Math.random() + 1).toString(36).substring(2);
}

elDlgRandom.addEventListener("click", () => {
  setSessionId(randomSession())
});

function shareSession() {
  const shareData = {
    title: "Synced Ultimate Guitar Session",
    text: "Join my session with id: " + sessionId,
    url: window.location.href + "?syncSessionId=" + sessionId
  };
  navigator.share(shareData);
}
elDlgShare.addEventListener("click", shareSession);

function countUsers() {
  elDlgUserCount.innerHTML = "?"
  elUserCount.innerHTML = "?"
  chrome.runtime.sendMessage({
    message: "countUsers",
    payload: ""
  })
}

// hide push button if url is not a song
if (!document.location.href.includes(baseSongUrl)) {
  elPublish.classList.add("sync-settings")
  elPublish.classList.add("hide-sync-settings")
}


/* old */
//document.getElementById("sync-users-icon").addEventListener('click', countUsers);

//document.getElementById("sync-publish").addEventListener('click', function () { let actualSongUrl = getSongUrl(document.location.href); console.log("publishing.", actualSongUrl); publishSongUrl() });


/* handle initially set values */
setSessionId(sessionId); // somewhere later!

/* storage initial check */
/* chrome.storage.sync.get(null, function (data) {
  document.getElementById("session-input").value = data["session"]
  autoPush = data["autoPush"] ? true : false;
  document.getElementById("checkbox-push").checked = autoPush
  autoGet = data["autoGet"] ? true : false;
  document.getElementById("checkbox-get").checked = autoGet
  userCount = data["sync-userCount"] ?? 0;
  elUserCount.innerHTML = userCount
  elDlgUserCount.innerHTML = userCount

  let actualSongUrl = getSongUrl(document.location.href);
  if (autoPush) {
    if (data["sessionSong"] != actualSongUrl)
      publishSongUrl()
  } else {
    handleNewSong(data["sessionSong"])
  }
}); */
/* storage listeners */
chrome.storage.onChanged.addListener((changes, namespace) => {
  for (let [key, { oldValue, newValue }] of Object.entries(changes)) {
    console.log(
      `Storage key "${key}" in namespace "${namespace}" changed.`,
      `Old value was "${oldValue}", new value is "${newValue}".`
    );
    if (key === "session") {
      document.getElementById("session-input").value = newValue;
    } else if (key === "sessionSong") {
      handleNewSong(newValue)
    } else if (key === "userCount") {
      elUserCount.innerHTML = newValue.toString();
      elDlgUserCount.innerHTML = newValue.toString();
    }
  }
});

function handleNewSong(songUrl) {
  console.log("handling new song", songUrl) // also handle time pitch etc
  if (songUrl && (songUrl != getSongUrl(document.location.href))) {
    if (autoGet)
      window.location = buildSongUrl(songUrl)
    else {
      receivedSongAvailable(songUrl);
    }
  } else {
    noGettableSong();
  }
}

function buildSongUrl(songUrl) {
  return baseSongUrlHttps + songUrl;
}

function receivedSongAvailable(songUrl) {
  elLink.classList.remove(["hide"])
  elLink.href = buildSongUrl(songUrl);
}

function noGettableSong() {
  console.log("not gettable")
  let icon = document.getElementById('receive-icon');
  icon.classList.remove('receive-icon-available');
  icon.parentElement.classList.add("sync-settings");
  if (icon.previousSibling.classList.includes("hide-sync-settings"))
    icon.parentElement.classList.add("hide-sync-settings");
  icon.removeAttribute('onclick');
}

/* message listeners */
chrome.runtime.onMessage.addListener((obj, sender, response) => {
  const { type, songUrl } = obj;
  if (type === "anything?") {
  }
});



// make draggable

/* Make the DIV element draggable */
const dragDelay = 200;
var dragTimeout;
const elFloatbar = document.getElementById("floatbar");
elFloatbar.style.top = initialDragTop;
elFloatbar.style.left = initialDragLeft;
dragElement(elFloatbar,elFloatbar);

function dragElement(elmnt, dragpoint) {
  var pos1 = 0, pos2 = 0, pos3 = 0, pos4 = 0;
  if (dragpoint) {
    // if present, the header is where you move the DIV from:
    dragpoint.onmousedown = dragMouseDown;
  } else {
    // otherwise, move the DIV from anywhere inside the DIV:
    elmnt.onmousedown = dragMouseDown;
  }

  function dragMouseDown(e) {
    console.log("dragMouseDown")
    clearTimeout(dragTimeout);
    console.log(allowClick)
    dragTimeout = setTimeout(() => allowClick = false, dragDelay)
    e = e || window.event;
    e.preventDefault();
    // get the mouse cursor position at startup:
    pos3 = e.clientX;
    pos4 = e.clientY;
    document.onmouseup = closeDragElement;
    // call a function whenever the cursor moves:
    document.onmousemove = elementDrag;
  }

  function elementDrag(e) {
    console.log("elementDrag")
    e = e || window.event;
    e.preventDefault();
    // calculate the new cursor position:
    pos1 = pos3 - e.clientX;
    pos2 = pos4 - e.clientY;
    pos3 = e.clientX;
    pos4 = e.clientY;
    // set the element's new position:
    elmnt.style.top = Math.min(elmnt.parentElement.offsetHeight - elmnt.offsetHeight, Math.max(0, elmnt.offsetTop - pos2)) + "px";
    elmnt.style.left = Math.min(elmnt.parentElement.offsetWidth - elmnt.offsetWidth - 1, Math.max(0, elmnt.offsetLeft - pos1)) + "px";
  }

  function closeDragElement() {
    console.log("closeDragElement")
    console.log(allowClick)
    clearTimeout(dragTimeout);
    dragTimeout = setTimeout(() => {
      allowClick = true
      chrome.storage.sync.set({ dragTop: elmnt.style.top, dragLeft: elmnt.style.left });
    }, dragDelay)
    // stop moving when mouse button is released:
    document.onmouseup = null;
    document.onmousemove = null;
  }
}
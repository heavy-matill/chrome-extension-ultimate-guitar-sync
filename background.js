//import { baseSongUrl, getSongUrl } from "./utils.js";

var window = window ?? self;
var document = { URL: "wss://" }
var client;
//importScripts("./mqttws31.min.js", "./utils2.js");
importScripts("./browserMqtt.js", "./utils2.js");
async function initialize() {
  console.log(storageCache)
  if (storageCache["userId"]) {
    userId = storageCache["userId"];
  }
  else {
    userId = `${Date.now()}-${Math.floor(Math.random() * 100)}`;
    chrome.storage.local.set({ "userId": userId });
  }
  if (storageCache["session"]) {
    session = storageCache["session"];
  }
  else {
    session = "session";
    chrome.storage.local.set({ "session": session });
  }
  console.log(userId)
  client = mqtt.connect('wss://broker.emqx.io:8084/mqtt', { clientId: userId })

  client.on('connect', function () {
    /*client.subscribe('presence', function (err) {
      if (!err) {
        client.publish('presence', 'Hello mqtt')
      }
    })*/
    client.subscribe(session)
  })

  client.on('message', function (topic, message) {
    console.log(topic.toString(), message.toString())
    if (topic === session) {
      if (message.toString().startsWith("sessionSong:")) {
        let sessionSongUrl = message.toString().replace("sessionSong:", "");
        if (sessionSongUrl)
          chrome.storage.local.set({ "sessionSong": sessionSongUrl })
      }
    }
    //client.end()
  })
}

var storageCache = {};
chrome.storage.local.get(null, function (data) {
  storageCache = data;
  initialize(); // All your code is contained here, or executes later that this
});
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if ((changeInfo.status === 'complete') && tab.url) {
    console.log(tab.url)
    chrome.scripting.executeScript({
      target: { tabId: tabId },
      files: ["utils2.js", "contentScript.js"]
    })
  }
});


chrome.runtime.onMessage.addListener((obj, sender, response) => {
  const { message, payload } = obj;
  console.log(obj)
  if (message === "publishSong") {
    console.log("Publishing via mqtt:", session, payload)
    client.publish(session, 'sessionSong:' + payload)
  }
});
function subscribeNewSession(oldSession, newSession) {
  console.log("subscribing new session")
  if (oldSession)
    client.unsubscribe(oldSession)
  chrome.storage.local.set({ sessionSong: "" })
  client.subscribe(newSession)
}
chrome.storage.onChanged.addListener((changes, namespace) => {
  for (let [key, { oldValue, newValue }] of Object.entries(changes)) {
    console.log(
      `Storage key "${key}" in namespace "${namespace}" changed.`,
      `Old value was "${oldValue}", new value is "${newValue}".`
    );
    if (key === "session") {
      subscribeNewSession(oldValue, newValue)
    }
  }
});

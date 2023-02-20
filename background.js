//import { baseSongUrl, getSongUrl } from "./utils.js";

var window = window ?? self;
var document = { URL: "wss://" }
var userId;
var userCount = 0;
var countingUser = "";
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
    chrome.storage.sync.set({ "userId": userId });
  }
  if (storageCache["session"]) {
    session = storageCache["session"];
  }
  else {
    session = "session";
    chrome.storage.sync.set({ "session": session });
  }

  client = mqtt.connect('wss://broker.emqx.io:8084/mqtt', { clientId: userId })

  client.on('message', function (topic, message) {
    console.log(topic.toString(), message.toString())
    console.log(session)
    if (topic === session) {
      parsed = JSON.parse(message);
      console.log(parsed)
      if (parsed.user) {
        if (parsed.sessionSong && (parsed.user != userId)) {
          console.log("storing", { "sessionSong": parsed.sessionSong })
          chrome.storage.sync.set({ "sessionSong": parsed.sessionSong })
        } else if (parsed.scan) {
          userCount = 0;
          countingUser = parsed.user;
          chrome.storage.sync.set({ "userCount": userCount })
          // respond        
          client.publish(session, JSON.stringify({ user: userId, scanResponse: countingUser }), { qos: 2 })
        } else if (parsed.scanResponse && (parsed.scanResponse === countingUser)) {
          userCount++;
          chrome.storage.sync.set({ "userCount": userCount })
        } else if (parsed.sync && (parsed.user != userId)) {
          chrome.runtime.sendMessage({
            message: "publishSync",
            payload: parsed.sync
          })
        }
      }
    }
  })

  client.on('connect', function () {
    subscribeNewSession(session, false)
  })


}

var storageCache = {};
chrome.storage.sync.get(null, function (data) {
  storageCache = data;
  initialize(); // All your code is contained here, or executes later that this
});
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if ((changeInfo.status === 'complete') && tab.url && tab.url.includes(baseUGUrl)) {
    chrome.scripting.executeScript({
      target: { tabId: tabId },
      files: ["utils2.js", "contentScript.js", "controls.js"]
    })
  }
});


chrome.runtime.onMessage.addListener((obj, sender, response) => {
  const { message, payload } = obj;
  console.log(obj)
  if (message === "publishSong") {
    console.log("Publishing via mqtt:", session, payload)
    client.publish(session, JSON.stringify({ user: userId, sessionSong: payload }), { retain: true })
  } else if (message === "countUsers") {
    countUsers();
  } else if (message === "publishSync") {
    client.publish(session, JSON.stringify({ user: userId, sync: payload }), { qos: 1 })
  }
});
function subscribeNewSession(newSession, oldSession) {
  //console.log("subscribing new session")
  session = newSession;
  if (oldSession)
    client.unsubscribe(oldSession)
  chrome.storage.sync.set({ sessionSong: "", session: session })
  client.subscribe(session, function (err) {
    if (!err) {
      countUsers();
    }
  })

}
chrome.storage.onChanged.addListener((changes, namespace) => {
  for (let [key, { oldValue, newValue }] of Object.entries(changes)) {
    console.log(
      `Storage key "${key}" in namespace "${namespace}" changed.`,
      `Old value was "${oldValue}", new value is "${newValue}".`
    );
    if (key === "session") {
      subscribeNewSession(newValue, oldValue)
    }
  }
});

function countUsers() {
  client.publish(session, JSON.stringify({ user: userId, scan: true }), { qos: 2 })
}

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
    client.subscribe(session, function (err) {
      if (!err) {
        countUsers();
      }
    })
  })

  client.on('message', function (topic, message) {
    console.log(topic.toString(), message.toString())
    if (topic === session) {
      //JSON.parse(JSON.stringify({a:"asd",b:"yxc"}))
      parsed = JSON.parse(message);
      if (parsed.user) {
        if (parsed.sessionSong && (parsed.user != userId)) {
          chrome.storage.local.set({ "sessionSong": parsed.sessionSong })
        } else if (parsed.scan) {
          userCount = 0;
          countingUser = parsed.user;
          chrome.storage.local.set({ "userCount": userCount })
          // respond        
          client.publish(session, JSON.stringify({ user: userId, scanResponse: countingUser }))
        } else if (parsed.scanResponse && (parsed.scanResponse === countingUser)) {
          userCount++;
          chrome.storage.local.set({ "userCount": userCount })
        }
      }
    }
  })
}

var storageCache = {};
chrome.storage.local.get(null, function (data) {
  storageCache = data;
  initialize(); // All your code is contained here, or executes later that this
});
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if ((changeInfo.status === 'complete') && tab.url && tab.url.includes(baseUGUrl)) {
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
    client.publish(session, JSON.stringify({ user: userId, sessionSong: payload }))
  } else if (message === "countUsers") {
    countUsers();
  }
});
function subscribeNewSession(oldSession, newSession) {
  console.log("subscribing new session")
  if (oldSession)
    client.unsubscribe(oldSession)
  chrome.storage.local.set({ sessionSong: "" })
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
      subscribeNewSession(oldValue, newValue)
    }
  }
});

function countUsers() {
  client.publish(session, JSON.stringify({ user: userId, scan: true }))
}

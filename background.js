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
  session = "session"
  /*if (storageCache["session"]) {
    session = storageCache["session"];
  }
  else {
    session = "session";
    chrome.storage.local.set({ "session": session });
  }*/
  console.log(userId)
  client = mqtt.connect('wss://broker.emqx.io:8084/mqtt', { clientId: userId })

  client.on('connect', function () {
    client.subscribe('presence', function (err) {
      if (!err) {
        client.publish('presence', 'Hello mqtt')
      }
    })
    client.subscribe(session, function (err) {
      if (!err) {
        client.publish(session, 'new user')
      }
    })
  })

  client.on('message', function (topic, message) {
    // message is Buffer
    console.log(message.toString())
    //client.end()
  })

  /* Paho
//script.onload = function () {
  //do stuff with the script
  // Create a client instance
  console.log(userId)
  client = new Paho.MQTT.Client("wss://broker.emqx.io:8084/mqtt", userId);
  // always reconnect
  client.loop_forever();


  // set callback handlers
  client.onConnectionLost = onConnectionLost;
  client.onMessageArrived = onMessageArrived;

  // connect the client
  client.connect({ onSuccess: onConnect });


  // called when the client connects
  function onConnect() {
    // Once a connection has been made, make a subscription and send a message.
    console.log("onConnect");
    client.subscribe("World");
    message = new Paho.MQTT.Message("Hello");
    message.destinationName = "World";
    client.send(message);
    if (session) {
      client.subscribe(session);
    }
  }

  // called when the client loses its connection
  function onConnectionLost(responseObject) {
    if (responseObject.errorCode !== 0) {
      console.log("onConnectionLost:" + responseObject.errorMessage);
    }
  }

  // called when a message arrives
  function onMessageArrived(message) {
    console.log("onMessageArrived:" + message.payloadString);
  }*/


}
//};
//script.src = "https://cdnjs.cloudflare.com/ajax/libs/paho-mqtt/1.0.1/mqttws31.min.js";

//document.head.appendChild(script); //or something of the likes

var storageCache = {};
chrome.storage.local.get(null, function (data) {
  storageCache = data;
  initialize(); // All your code is contained here, or executes later that this
});
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete' && tab.url && tab.url.includes(baseSongUrl)) {
    const songUrl = getSongUrl(tab.url);
    console.log("newSong", songUrl)

    /*chrome.tabs.sendMessage(tabId, {
      type: "newSong",
      songUrl: songUrl,
    });*/
    chrome.scripting.executeScript({
      target: { tabId: tabId },
      files: [ "contentScript.js"]
    })
    console.log("executed contetnScript")
  }
});


chrome.runtime.onMessage.addListener((obj, sender, response) => {
  const { type, value, payload } = obj;

  if (type === "joinSession") {
    // redundant, solved via storage
  }
});
function subscribeNewSession(oldSession, newSession) {
  console.log("subscribing new session")
  if (oldSession)
    client.unsubscribe(oldSession);
  client.subscribe(newSession);
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

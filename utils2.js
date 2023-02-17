async function getActiveTabURL() {
    const tabs = await chrome.tabs.query({
        currentWindow: true,
        active: true
    });

    return tabs[0];
}

const baseSongUrl = "tabs.ultimate-guitar.com/tab/";

const baseSongUrlHttps = "https://" + baseSongUrl;

function getSongUrl(url) {
    if (url.includes(baseSongUrl))
        return url.split(baseSongUrl)[1];
    else
        return "";
}
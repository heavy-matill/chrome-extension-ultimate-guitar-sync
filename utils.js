export async function getActiveTabURL() {
    const tabs = await chrome.tabs.query({
        currentWindow: true,
        active: true
    });

    return tabs[0];
}

export const baseSongUrl = "tabs.ultimate-guitar.com/tab/";

export const baseSongUrlHttps = "https://" + baseSongUrl;

export function getSongUrl(url) {
    if (url.includes(baseSongUrl))
        return url.split(baseSongUrl)[1];
    else
        return "";
}

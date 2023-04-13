
splitUrl = document.location.href.split('-');
if (splitUrl[splitUrl.length - 2] === "official") {
    var observer;

    /*var pitchSup = false;
    var transposeSup = false;*/

    var pitch = 0;
    var transpose = 0;
    var time = 0;
    async function initializeSync() {
        console.log("initializing sync")
        //var playButton = document.querySelector("[data-for='play-tooltip']").children[0];
        function getElementsByText(str, tag = 'a', startElement = document) {
            return Array.prototype.slice.call(startElement.getElementsByTagName(tag)).filter(el => el.textContent.trim() === str.trim());
        }

        /*function getElementsByTextStartsWith(str, tag = 'a', startElement = document) {
            return Array.prototype.slice.call(startElement.getElementsByTagName(tag)).filter(el => el.textContent.startsWith(str));
        }*/

        var timerDiv = getElementsByText('PARTS', tag = 'div')[0].nextSibling;
        //let timeLineSection = timerDiv.parentElement.nextSibling;
        //var timeMaxDiv = timerDiv.parentElement.parentElement.lastChild;
        //var timeMax = secondsFromString(timeMaxDiv.textContent);
        /*var toolbarSection = playButton.parentElement.parentElement.parentElement;*/
        //toolbarSection.lastChild.click(); toolbarSection.lastChild.click();
        // watch their children (a sup with e.g. "-1" will be appended)

        // MutationObserver: https://developer.mozilla.org/en-US/docs/Web/API/MutationObserver
        // Select the node that will be observed for mutations
        // const targetNode = document.getElementById('some-id');

        // Options for the observer (which mutations to observe)
        const config = { attributes: true, childList: true, subtree: true, characterData: true };
        // Callback function to execute when mutations are observed
        const callback = async (mutationList, observer) => {
            for (const mutation of mutationList) {
                console.log(mutation)
                if (mutation.type === 'childList') {
                    /*if (mutation.target.parentElement == toolbarSection) {
                        if (mutation.addedNodes.length) {
                            if (!pitchSup) {
                                pitchSup = getElementsByTextStartsWith('Pitch', tag = 'span')[0];
                                observer.observe(pitchSup, config);
                            }
                            if (!transposeSup) {
                                transposeSup = getElementsByTextStartsWith('Transpose', tag = 'span')[0];
                                observer.observe(transposeSup, { attributes: true, subtree: true, characterData: true });
                            }
                        }
                    } else if (mutation.target == pitchSup) {
                        if (mutation.removedNodes.length)
                            pitch = 0;
                        else
                            pitch = await getPitch();
                        publishSync();
                    } else if (mutation.target == transposeSup) {
                        if (mutation.removedNodes.length)
                            transpose = 0;
                        else
                            transpose = await getTranspose();
                        publishSync();
                    }*/
                } else if (mutation.type === 'characterData') {
                    /*if (mutation.target.parentElement.parentElement == pitchSup) {
                        pitch = await getPitch();
                        publishSync();
                    }
                    else if (mutation.target.parentElement.parentElement == transposeSup) {
                        transpose = await getTranspose();
                        publishSync();
                    }
                    else */if (mutation.target.parentElement == timerDiv) {
                        time = secondsFromString(timerDiv.textContent);
                        publishSync();
                    }
                }
            }
        };

        /*async function getPitch() {
            console.log("getPitch")
            if (pitchSup)
                return Number(pitchSup.textContent.replace("Pitch", ""))
            else {
                toolbarSection.lastChild.click();
                await new Promise(r => setTimeout(r, 200));
                setTimeout(toolbarSection.lastChild.click(), 200);
                return await getPitch()
            }
        }
        async function getTranspose() {
            if (transposeSup)
                return Number(transposeSup.textContent.replace("Transpose", ""))
            else {
                toolbarSection.lastChild.click();
                await new Promise(r => setTimeout(r, 200));
                setTimeout(toolbarSection.lastChild.click(), 200);
                return await getTranspose()
            }
        }*/

        function secondsFromString(timeString) {
            return Number(timeString.split(':')[0] * 60) + Number(timeString.split(':')[1]);
        }

        // Create an observer instance linked to the callback function
        observer = new MutationObserver(callback);
        //observer.observe(document, config);

        // Start observing the target node for configured mutations
        observer.observe(timerDiv, config);
        /*observer.observe(toolbarSection, config);*/
        //observer.observe(pitchSup, config);
        //observer.observe(transposeSup, config);

        // Later, you can stop observing
        // observer.disconnect();

        async function setTime(timeSet) {
            if (secondsFromString(timerDiv.textContent) > timeSet) {
                while (secondsFromString(timerDiv.textContent) > timeSet) {
                    await new Promise(p => {
                        document.dispatchEvent(new KeyboardEvent("keydown", {
                            keyCode: 37, // left arrow
                        }));
                        console.log("went left")
                        setTimeout(p, 50)
                    });
                }
            } else {
                while (secondsFromString(timerDiv.textContent) < timeSet) {
                    await new Promise(p => {
                        document.dispatchEvent(new KeyboardEvent("keydown", {
                            keyCode: 39, // right arrow 
                        }));
                        console.log("went right")
                        setTimeout(p, 50)
                    });
                }
            }
        }

        function publishSync() {
            if (autoPush)
                chrome.runtime.sendMessage({
                    action: "publishSync",
                    payload: JSON.stringify({ song: getSongUrl(document.location.href), pitch: pitch, transpose: transpose, time: time })
                })
        }

        chrome.runtime.onMessage.addListener((obj, sender, response) => {
            const { type, payload } = obj;
            if (type === "publishSync") {
                console.log("received", type, payload)
                parsed = JSON.parse(payload)
                if (autoGet && getSongUrl(document.location.href) == parsed.song) {
                    setTime(parsed.time);
                }
            }
        });

        /*await getPitch()
        await getTranspose()
        publishSync()*/
    }
    setTimeout(async () => { initializeSync() }, 6000);
}


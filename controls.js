let playButton = document.querySelector("[data-for='play-tooltip']").children[0];
function getElementsByText(str, tag = 'a', startElement = document) {
    return Array.prototype.slice.call(startElement.getElementsByTagName(tag)).filter(el => el.textContent.trim() === str.trim());
}

function getElementsByTextStartsWith(str, tag = 'a', startElement = document) {
    return Array.prototype.slice.call(startElement.getElementsByTagName(tag)).filter(el => el.textContent.startsWith(str));
}

let timerDiv = getElementsByText('PARTS', tag = 'div')[0].nextSibling;
let timeLineSection = timerDiv.parentElement.nextSibling;
let timeMaxDiv = timerDiv.parentElement.parentElement.lastChild;
let timeMax = secondsFromString(timeMaxDiv.textContent);
let toolbarSection = playButton.parentElement.parentElement.parentElement;
//toolbarSection.lastChild.click(); toolbarSection.lastChild.click();
// watch their children (a sup with e.g. "-1" will be appended)
let pitchSup = false;
let transposeSup = false;

var pitch, transpose;

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
            if (mutation.target.parentElement == toolbarSection) {
                if (mutation.addedNodes.length) {
                    if (!pitchSup) {
                        pitchSup = getElementsByTextStartsWith('Pitch', tag = 'span')[0];
                        observer.observe(pitchSup, { attributes: true, subtree: true, characterData: true });
                    }
                    if (!transposeSup) {
                        transposeSup = getElementsByTextStartsWith('Transpose', tag = 'span')[0];
                        observer.observe(transposeSup, { attributes: true, subtree: true, characterData: true });
                    }
                }
            } else if (mutation.target == pitchSup)
                if (mutation.removedNodes.length)
                    pitch = 0;
                else
                    pitch = await getPitch();
            else if (mutation.target == transposeSup)
                if (mutation.removedNodes.length)
                    transpose = 0;
                else
                    transpose = await getTranspose();
        } else if (mutation.type === 'characterData') {
            if (mutation.target.parentElement.parentElement == pitchSup)
                pitch = await getPitch();
            else if (mutation.target.parentElement.parentElement == transposeSup)
                transpose = await getTranspose();
            else if (mutation.target.parentElement == timerDiv) {
                time = secondsFromString(timerDiv.textContent);
            }
        }
    }
};

async function getPitch() {
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
}

function secondsFromString(timeString) {
    return Number(timeString.split(':')[0] * 60) + Number(timeString.split(':')[1]);
}

// Create an observer instance linked to the callback function
const observer = new MutationObserver(callback);
//observer.observe(document, config);

// Start observing the target node for configured mutations
observer.observe(timerDiv, config);
observer.observe(toolbarSection, { subtree: true, childList: true });
//observer.observe(pitchSup, config);
//observer.observe(transposeSup, config);

// Later, you can stop observing
// observer.disconnect();

function click(el, x, y) {
    var ev = new MouseEvent('click', {
        'view': window,
        'bubbles': true,
        'cancelable': false,
        'screenX': x,
        'screenY': y
    });

    el = document.elementFromPoint(x, y);

    el.dispatchEvent(ev);
}

function getPosition(el) {
    var x = 0;
    var y = 0;
    while (el && !isNaN(el.offsetLeft) && !isNaN(el.offsetTop)) {
        x += el.offsetLeft - el.scrollLeft;
        y += el.offsetTop - el.scrollTop;
        el = el.offsetParent;
    }
    return { top: y, left: x };
}

function clickRelative(el, x = 0.5, y = 0.5) {
    const { top, left } = getPosition(el);
    console.log(left + el.offsetWidth * x, top + el.offsetHeight * y)
    click(el, left + el.offsetWidth * x, top + el.offsetHeight * y)
}

async function skipToTime(r = 0.5) {
    if (secondsFromString(timerDiv.textContent) > timeMax * r) {
        while (secondsFromString(timerDiv.textContent) > timeMax * r) {
            await new Promise(p => {
                document.dispatchEvent(new KeyboardEvent("keydown", {
                    keyCode: 37, // left arrow
                }));
                console.log("went left")
                setTimeout(p, 50)
            });
        }
    } else {
        while (secondsFromString(timerDiv.textContent) < timeMax * r) {
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

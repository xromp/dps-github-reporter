/**
 * @fileoverview Description of this file.
 */
(function(){
  let commentEl;

  (async function init() {
    await appendForm();
    commentEl = getRoot().querySelector('#comment-text');
    /* commentEl.addEventListener('change', onchange);
    commentEl.addEventListener('blur', onchange); */
  })();

  function onchange(e) {
    commentEl.focus();
  }

  function sendRequest({url, option}) {
    return new Promise(resolve => {
      fetch(url, option)
      .then(response => resolve(response.text()))
      .then(data => {
      }).catch(err => {
        resolve(err.message);
      });
    });
  };


  async function appendForm() {
    const data = {
      url: chrome.extension.getURL('/templates/form.html'),
      option : {
        method: 'GET',
        headers: {
          'Content-Type': 'text/html'
        }
      }
    };
    const cssData = {
      url: chrome.extension.getURL('/templates/form.css'),
      option : {
        method: 'GET',
        headers: {
          'Content-Type': 'text/css'
        }
      }
    }

    const formHtml = await sendRequest(data);
    const cssContent = await sendRequest(cssData);

    const text = document.createElement('input');
    text.setAttribute("type", "text")

    const parent = document.createElement('p');
    parent.id="reporter-parent";
    parent.attachShadow({mode: 'open'});
    
    const form = document.createElement('p');
    form.innerHTML = formHtml;
    form.id="reporter-form";
    
    const css = document.createElement('style');
    css.innerText = cssContent;

    parent.shadowRoot.appendChild(form);
    parent.shadowRoot.appendChild(css);
    parent.shadowRoot.appendChild(text);
    document.body.appendChild(parent);
  }

  function getRoot() {
    return document.getElementById('reporter-parent').shadowRoot;
  }

  Array.from(document.querySelectorAll(['[data-hotkey]'])).forEach(e=>e.removeAttribute('data-hotkey'))
  chrome.runtime.onMessage.addListener(gotMessage);
  function gotMessage(message, sender, sendResponse) {
      console.log(message.txt);
  }
}());
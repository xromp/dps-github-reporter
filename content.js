/**
 * @fileoverview Description of this file.
 */
(function(){
  let commentEl, addNoteEl, commentContainerEl, needReproEl;

  const repos = [
    {type:'js', key: 'firebase-js-sdk'},
    {type:'android', key: 'firebase-android-sdk'},
    {type:'ios', key: 'firebase-ios-sdk'},
  ];

  chrome.runtime.onMessage.addListener(gotMessage);

  (async function init() {
    await appendForm();
    commentEl = getRoot().querySelector('#comment-text');
    addNoteEl = getRoot().querySelector('#add-note');
    commentContainerEl = getRoot().querySelector('#comment-container');
    needReproEl = getRoot().querySelector('#needed-repro');
    
    addNoteEl.addEventListener('click', addNote);
    needReproEl.addEventListener('change', saveNeedRepro);

    getEntry();
    
    Array.from(document.querySelectorAll(['[data-hotkey]'])).forEach(e=>e.removeAttribute('data-hotkey'))
  })();

  function gotMessage(message, sender, sendResponse) {
      console.log({message});
  }


  function saveNeedRepro(e) {
    const option = {
      ...getParam(),
      needRepro: needReproEl.checked,
    }
    chrome.runtime.sendMessage({code: "UPDATE_NEED_REPRO", option}, (response) => {});
  }

  function addNote(e) {
    if (!commentEl.value) return;

    const option = {
      ...getParam(),
      message: commentEl.value,
      isNeedReproModified: needReproEl.getAttribute('isNeedReproModified'),
    }
    chrome.runtime.sendMessage({code: "ADD_NOTE", option}, (response) => {
      getEntry();
      commentEl.value='';
    });
  }

  function getEntry() {
    const option = {... getParam()};
    commentContainerEl.innerHTML = '';
    chrome.runtime.sendMessage({code: "GET_ENTRY", option}, (response) => {
      const result = response.result;
      result.data.forEach(entry => {
        commentContainerEl.innerHTML +=`
        
        <li class="comment user-comment">
          <p>${entry.message}</p>
          <div class="info">
            <span>1 hour ago</span>
        </div>
        </li>
      `;
      });
      if (result.status.hasOwnProperty('isModified')) {
        needReproEl.checked = result.status ? result.status.needRepro : false;
        if (result.status.isModified) needReproEl.setAttribute('isNeedReproModified', true);needReproEl.checked = result.status ? result.status.needRepro : false;
      }
    });
  }

  function getParam() {
    const url = window.location.href.split('/');
    const type = repos.find(element => element.key === url[4])['type'];
    return {type, issueId:url[6]}
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
}());
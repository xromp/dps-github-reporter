// TODO(DEVELOPER): Change the values below using values from the initialization snippet: Firebase Console > Overview > Add Firebase to your web app.
// Initialize Firebase
const config = {
};
firebase.initializeApp(config);

const firestore = firebase.firestore();
/**
 * initApp handles setting up the Firebase context and registering
 * callbacks for the auth status.
 *
 * The core initialization is in firebase.App - this is the glue class
 * which stores configuration. We provide an app name here to allow
 * distinguishing multiple app instances.
 *
 * This method also registers a listener with firebase.auth().onAuthStateChanged.
 * This listener is called when the user is signed in or out, and that
 * is where we update the UI.
 *
 * When signed in, we also authenticate to the Firebase Realtime Database.
 */
function initApp() {
  // Listen for auth state changes.
  firebase.auth().onAuthStateChanged(function(user) {
    console.log('User state change detected from the Background script of the Chrome Extension:', user);
  });
}

window.onload = function() {
  initApp();
};
chrome.browserAction.onClicked.addListener(buttonClicked);
chrome.runtime.onMessage.addListener(gotMessage);

function gotMessage(request, sender, sendResponse) {
  (async () => {
    switch (request.code) {
      case 'ADD_NOTE':
        const note = await addNote(request.option);
        sendResponse({status: "SUCCESS", note});
        break;
  
      case 'GET_ENTRY':
        const result = await getReport(request.option)
        sendResponse({status: "SUCCESS", result});
        break;

      case 'UPDATE_NEED_REPRO':
        const needRepro = await updateNeedRepro(request.option)
        sendResponse({status: "SUCCESS", needRepro});
        break;
    
      default:
        break;
    }
  })();
  return true;
}

function addNote({type, issueId, message, isNeedReproModified}){
  return new Promise(resolve => {
    const ref = firestore.collection("notes").doc(type).collection(issueId).doc("data")
    if (!isNeedReproModified) ref.set({needRepro: false, status: '', isModified: true})
    ref.collection("notes").add({message, created_at: new Date()})
    .then(function({id}) {
      resolve({id});
    })
    .catch(function(error) {
      console.error("Error adding document: ", error);
    });
  })
};

function getReport({type, issueId}) {
  return new Promise(resolve => {
    const result = {};
    const ref = firestore.collection("notes").doc(type).collection(issueId).doc("data");
    ref.collection("notes")
    .orderBy("created_at", "desc")
    .get()
    .then(querySnapshot => {
      const data = [];
      querySnapshot.forEach(function(doc) {
        data.push(doc.data());
      });

      ref.get().then(status => {
        resolve({data, status: status.data()})
      })

    });
  })
}

function updateNeedRepro({type, issueId, needRepro}) {
  return new Promise(resolve => {
    const ref = firestore.collection("notes").doc(type).collection(issueId).doc("data");
    ref.update({needRepro})
    .then(() => {
      resolve({message: 'Updated!'});
    })
    .catch(function(error) {
      console.error("Error adding document: ", error);
    });
  });
}

function buttonClicked(tab) {
  console.log("button clicked", tab);

  const msg = {
      txt: "Hello this is from background script, how are you there?",
      isEnable:"true"
  }
  chrome.tabs.sendMessage(tab.id, msg);
}
importScripts('https://www.gstatic.com/firebasejs/10.8.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.8.0/firebase-messaging-compat.js');

// Config mapping for background operations
firebase.initializeApp({
  apiKey: "AIzaSyCExki28m1NNepVQEIjmcQzR8z8O68LqIc",
  authDomain: "rinolski-notifications.firebaseapp.com",
  projectId: "rinolski-notifications",
  messagingSenderId: "355554579853",
  appId: "1:355554579853:web:3caa961653c0cdc0a359c4"
});

const messaging = firebase.messaging();

// Launches native tray alerts when message arrives and browser tab is closed
messaging.onBackgroundMessage((payload) => {
  console.log('Received background notification payload: ', payload);
  
  const notificationTitle = payload.notification.title || "Rinolski Alert";
  const notificationOptions = {
    body: payload.notification.body || "New event occurred.",
    icon: 'https://github.githubassets.com/images/modules/logos_page/GitHub-Mark.png' // fall-back webicon placeholder
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});

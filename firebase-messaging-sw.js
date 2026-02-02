// firebase-messaging-sw.js
importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-messaging-compat.js');

firebase.initializeApp({
  apiKey: "AIzaSyCExki28m1NNepVQEIjmcQzR8z8O68LqIc",
  projectId: "rinolski-notifications",
  appId: "1:355554579853:web:3caa961653c0cdc0a359c4",
});

const messaging = firebase.messaging();

// This handles background notifications
messaging.onBackgroundMessage((payload) => {
  const notificationTitle = payload.notification.title;
  const notificationOptions = {
    body: payload.notification.body,
    icon: '/firebase-logo.png'
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});


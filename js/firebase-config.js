const firebaseConfig = {
  apiKey: "AIzaSyDpGvUSkcVpQwQmcBhSrefoQI3TewwbKYg",
  authDomain: "opsi-shart-test.firebaseapp.com",
  databaseURL: "https://opsi-shart-test-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "opsi-shart-test",
  storageBucket: "opsi-shart-test.firebasestorage.app",
  messagingSenderId: "237172952906",
  appId: "1:237172952906:web:86399beae4bcfb942a3bb3",
  measurementId: "G-G1B0WBTGWE"
};

// Initialize Firebase using compat globals:
firebase.initializeApp(firebaseConfig);
firebase.analytics();
const db = firebase.database();  // <-- compat style

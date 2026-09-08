const { initializeApp } = require("firebase/app");
const { getFirestore, collection, getDocs } = require("firebase/firestore");

const firebaseConfig = {
  projectId: "isometric-density-gd2jw",
  appId: "1:369490798032:web:51c0810c5cc801e6fc05d5",
  apiKey: "AIzaSyD_tW8Opsi6ldKKomNM_e6JzmFGgmFro1I",
  authDomain: "isometric-density-gd2jw.firebaseapp.com",
};
const app = initializeApp(firebaseConfig);
const db = getFirestore(app, "ai-studio-sipinterapp-b6b570ca-f030-4ca8-b7cf-c83c6e4299ce");

async function check() {
  const asgSnap = await getDocs(collection(db, "assignments"));
  console.log("Assignments in DB:", asgSnap.size);
  asgSnap.forEach(d => {
    console.log(d.id, "=>", d.data().title || d.data().materi, "| kelas:", d.data().kelas, "| targetClasses:", d.data().targetClasses);
  });
  process.exit(0);
}
check();

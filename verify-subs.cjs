const { initializeApp } = require("firebase/app");
const { getFirestore, collection, getDocs, query, where } = require("firebase/firestore");

const firebaseConfig = {
  projectId: "isometric-density-gd2jw",
  appId: "1:369490798032:web:51c0810c5cc801e6fc05d5",
  apiKey: "AIzaSyD_tW8Opsi6ldKKomNM_e6JzmFGgmFro1I",
  authDomain: "isometric-density-gd2jw.firebaseapp.com",
};
const app = initializeApp(firebaseConfig);
const db = getFirestore(app, "ai-studio-sipinterapp-b6b570ca-f030-4ca8-b7cf-c83c6e4299ce");

async function checkSubs() {
  const q = query(collection(db, "submissions"), where("assignmentId", "==", "TGS-1785884777808"));
  const snap = await getDocs(q);
  console.log("Submissions for TGS-1785884777808:", snap.size);
  const byClass = {};
  snap.forEach(d => {
    const k = d.data().kelas || "Unknown";
    byClass[k] = (byClass[k] || 0) + 1;
  });
  console.log("By Class:", byClass);
  process.exit(0);
}
checkSubs();

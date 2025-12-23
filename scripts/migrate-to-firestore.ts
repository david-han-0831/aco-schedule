/**
 * 기존 JSON 파일 데이터를 Firestore로 마이그레이션하는 스크립트
 * 
 * 사용법:
 * npx ts-node scripts/migrate-to-firestore.ts
 */

import { initializeApp } from "firebase/app";
import { getFirestore, collection, doc, setDoc, getDocs, Timestamp } from "firebase/firestore";
import fs from "fs";
import path from "path";

const firebaseConfig = {
  apiKey: "AIzaSyAFLteKwxPZhjSQNpojoY0xga84XjxeFyQ",
  authDomain: "aco-project-8e5cf.firebaseapp.com",
  projectId: "aco-project-8e5cf",
  storageBucket: "aco-project-8e5cf.firebasestorage.app",
  messagingSenderId: "119245672460",
  appId: "1:119245672460:web:dd45a8d991168833825e29",
  measurementId: "G-7YNE1R9PGP"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function migrateData() {
  const dataDir = path.join(process.cwd(), "data");

  // Members 마이그레이션
  console.log("Migrating members...");
  const membersPath = path.join(dataDir, "members.json");
  if (fs.existsSync(membersPath)) {
    const membersData = JSON.parse(fs.readFileSync(membersPath, "utf8"));
    const membersCollection = collection(db, "members");

    for (const member of membersData.members) {
      const docRef = doc(membersCollection);
      await setDoc(docRef, {
        name: member.name,
        instrument: member.instrument,
        part: member.part || "",
        remarks: member.remarks || "",
        createdAt: Timestamp.fromDate(new Date(member.createdAt)),
        updatedAt: Timestamp.fromDate(new Date(member.updatedAt)),
      });
      console.log(`Migrated member: ${member.name}`);
    }
  }

  // Instruments 마이그레이션
  console.log("Migrating instruments...");
  const instrumentsPath = path.join(dataDir, "instruments.json");
  if (fs.existsSync(instrumentsPath)) {
    const instrumentsData = JSON.parse(fs.readFileSync(instrumentsPath, "utf8"));
    const instrumentsCollection = collection(db, "instruments");

    for (const instrument of instrumentsData.instruments) {
      const docRef = doc(instrumentsCollection);
      await setDoc(docRef, {
        name: instrument.name,
        english: instrument.english,
        abbreviation: instrument.abbreviation,
      });
      console.log(`Migrated instrument: ${instrument.name}`);
    }
  }

  // Schedules 마이그레이션
  console.log("Migrating schedules...");
  const schedulesPath = path.join(dataDir, "schedules.json");
  if (fs.existsSync(schedulesPath)) {
    const schedulesData = JSON.parse(fs.readFileSync(schedulesPath, "utf8"));
    const schedulesCollection = collection(db, "schedules");

    // 먼저 members를 로드하여 memberId를 매핑
    const membersSnapshot = await getDocs(collection(db, "members"));
    const memberMap = new Map();
    membersSnapshot.forEach((doc) => {
      const data = doc.data();
      memberMap.set(data.name, doc.id);
    });

    for (const schedule of schedulesData.schedules) {
      const memberId = memberMap.get(schedule.memberName);
      if (memberId) {
        const docRef = doc(schedulesCollection);
        await setDoc(docRef, {
          memberId: memberId,
          memberName: schedule.memberName,
          availableDays: schedule.availableDays || [],
          weekStartDate: schedule.weekStartDate || new Date().toISOString().split("T")[0],
          updatedAt: Timestamp.fromDate(new Date(schedule.updatedAt || new Date())),
        });
        console.log(`Migrated schedule: ${schedule.memberName}`);
      }
    }
  }

  console.log("Migration completed!");
}

migrateData().catch(console.error);


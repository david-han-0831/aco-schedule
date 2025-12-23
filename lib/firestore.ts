import { 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  setDoc, 
  updateDoc, 
  deleteDoc,
  query,
  where,
  Timestamp,
  DocumentData,
  QueryDocumentSnapshot
} from "firebase/firestore";
import { db } from "./firebase";

// 타입 정의
export type UserRole = "SuperAdmin" | "Admin" | "User";

export interface Member {
  id: string;
  name: string;
  instrument: string;
  part?: string;
  remarks?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface UserProfile {
  id: string; // Firebase Auth UID
  email: string;
  displayName?: string; // 구글 이름 (자동 설정)
  name?: string; // 사용자가 입력한 이름
  role: UserRole;
  instrument?: string;
  part?: string;
  remarks?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Instrument {
  id: string;
  name: string;
  english: string;
  abbreviation: string;
}

export interface Schedule {
  id?: string;
  memberId: string;
  memberName: string;
  availableDays: string[]; // 요일 기반 (기존 호환성)
  availableDates?: string[]; // 날짜 기반 (YYYY-MM-DD 형식)
  dateNotes?: { [dateStr: string]: string }; // 날짜별 메모 (YYYY-MM-DD 형식의 키)
  weekStartDate: string;
  updatedAt: Date;
}

// Helper: Firestore Timestamp를 Date로 변환
const timestampToDate = (timestamp: any): Date => {
  if (timestamp?.toDate) {
    return timestamp.toDate();
  }
  if (timestamp instanceof Date) {
    return timestamp;
  }
  return new Date();
};

// Helper: Date를 Firestore Timestamp로 변환
const dateToTimestamp = (date: Date) => {
  return Timestamp.fromDate(date);
};

// Members Collection
export const membersCollection = collection(db, "members");

export async function getMembers(): Promise<Member[]> {
  const snapshot = await getDocs(membersCollection);
  return snapshot.docs.map((doc) => {
    const data = doc.data();
    return {
      id: doc.id,
      name: data.name,
      instrument: data.instrument,
      part: data.part || "",
      remarks: data.remarks || "",
      createdAt: timestampToDate(data.createdAt),
      updatedAt: timestampToDate(data.updatedAt),
    };
  });
}

export async function getMember(id: string): Promise<Member | null> {
  const docRef = doc(membersCollection, id);
  const docSnap = await getDoc(docRef);
  if (docSnap.exists()) {
    const data = docSnap.data();
    return {
      id: docSnap.id,
      name: data.name,
      instrument: data.instrument,
      part: data.part || "",
      remarks: data.remarks || "",
      createdAt: timestampToDate(data.createdAt),
      updatedAt: timestampToDate(data.updatedAt),
    };
  }
  return null;
}

export async function createMember(member: Omit<Member, "id" | "createdAt" | "updatedAt">): Promise<string> {
  const now = new Date();
  const docRef = doc(membersCollection);
  await setDoc(docRef, {
    ...member,
    createdAt: dateToTimestamp(now),
    updatedAt: dateToTimestamp(now),
  });
  return docRef.id;
}

export async function updateMember(id: string, member: Partial<Omit<Member, "id" | "createdAt">>): Promise<void> {
  const docRef = doc(membersCollection, id);
  await updateDoc(docRef, {
    ...member,
    updatedAt: dateToTimestamp(new Date()),
  });
}

export async function deleteMember(id: string): Promise<void> {
  const docRef = doc(membersCollection, id);
  await deleteDoc(docRef);
}

// Instruments Collection
export const instrumentsCollection = collection(db, "instruments");

export async function getInstruments(): Promise<Instrument[]> {
  const snapshot = await getDocs(instrumentsCollection);
  return snapshot.docs.map((doc) => {
    const data = doc.data();
    return {
      id: doc.id,
      name: data.name,
      english: data.english,
      abbreviation: data.abbreviation,
    };
  });
}

export async function createInstrument(instrument: Omit<Instrument, "id">): Promise<string> {
  const docRef = doc(instrumentsCollection);
  await setDoc(docRef, instrument);
  return docRef.id;
}

// Schedules Collection
export const schedulesCollection = collection(db, "schedules");

export async function getSchedules(): Promise<Schedule[]> {
  const snapshot = await getDocs(schedulesCollection);
  return snapshot.docs.map((doc) => {
    const data = doc.data();
    return {
      id: doc.id,
      memberId: data.memberId,
      memberName: data.memberName,
      availableDays: data.availableDays || [],
      availableDates: data.availableDates || [],
      dateNotes: data.dateNotes || {},
      weekStartDate: data.weekStartDate || "",
      updatedAt: timestampToDate(data.updatedAt),
    };
  });
}

export async function getScheduleByMemberId(memberId: string): Promise<Schedule | null> {
  const q = query(schedulesCollection, where("memberId", "==", memberId));
  const snapshot = await getDocs(q);
  if (snapshot.empty) return null;
  const doc = snapshot.docs[0];
  const data = doc.data();
  return {
    id: doc.id,
    memberId: data.memberId,
    memberName: data.memberName,
    availableDays: data.availableDays || [],
    weekStartDate: data.weekStartDate || "",
    updatedAt: timestampToDate(data.updatedAt),
  };
}

export async function createOrUpdateSchedule(schedule: Omit<Schedule, "id" | "updatedAt">): Promise<string> {
  // 기존 일정이 있는지 확인
  const existing = await getScheduleByMemberId(schedule.memberId);
  
  const now = new Date();
  const scheduleData = {
    ...schedule,
    updatedAt: dateToTimestamp(now),
  };

  if (existing?.id) {
    // 업데이트
    const docRef = doc(schedulesCollection, existing.id);
    await updateDoc(docRef, scheduleData);
    return existing.id;
  } else {
    // 생성
    const docRef = doc(schedulesCollection);
    await setDoc(docRef, scheduleData);
    return docRef.id;
  }
}

export async function updateSchedules(schedules: Omit<Schedule, "id" | "updatedAt">[]): Promise<void> {
  const promises = schedules.map((schedule) => createOrUpdateSchedule(schedule));
  await Promise.all(promises);
}

export async function deleteSchedule(id: string): Promise<void> {
  const docRef = doc(schedulesCollection, id);
  await deleteDoc(docRef);
}

// Users Collection (Firebase Auth UID를 문서 ID로 사용)
export const usersCollection = collection(db, "users");

export async function getUserProfile(uid: string): Promise<UserProfile | null> {
  const docRef = doc(usersCollection, uid);
  const docSnap = await getDoc(docRef);
  if (docSnap.exists()) {
    const data = docSnap.data();
    return {
      id: docSnap.id,
      email: data.email,
      displayName: data.displayName || "",
      name: data.name || "",
      role: data.role || "User",
      instrument: data.instrument || "",
      part: data.part || "",
      remarks: data.remarks || "",
      createdAt: timestampToDate(data.createdAt),
      updatedAt: timestampToDate(data.updatedAt),
    };
  }
  return null;
}

export async function createOrUpdateUserProfile(
  uid: string,
  email: string,
  displayName?: string,
  role: UserRole = "User",
  name?: string,
  instrument?: string,
  part?: string,
  remarks?: string
): Promise<void> {
  const docRef = doc(usersCollection, uid);
  const now = new Date();
  const existing = await getDoc(docRef);
  
  if (existing.exists()) {
    // 업데이트
    const existingData = existing.data();
    await updateDoc(docRef, {
      email,
      displayName: displayName !== undefined ? displayName : existingData.displayName || "",
      name: name !== undefined ? name : existingData.name || "",
      role: role !== undefined ? role : existingData.role || "User",
      instrument: instrument !== undefined ? instrument : existingData.instrument || "",
      part: part !== undefined ? part : existingData.part || "",
      remarks: remarks !== undefined ? remarks : existingData.remarks || "",
      updatedAt: dateToTimestamp(now),
    });
  } else {
    // 생성
    await setDoc(docRef, {
      email,
      displayName: displayName || "",
      name: name || "",
      role,
      instrument: instrument || "",
      part: part || "",
      remarks: remarks || "",
      createdAt: dateToTimestamp(now),
      updatedAt: dateToTimestamp(now),
    });
  }
}

export async function updateUserRole(uid: string, role: UserRole): Promise<void> {
  const docRef = doc(usersCollection, uid);
  await updateDoc(docRef, {
    role,
    updatedAt: dateToTimestamp(new Date()),
  });
}

export async function updateUserProfile(
  uid: string,
  updates: {
    displayName?: string;
    name?: string;
    instrument?: string;
    part?: string;
    remarks?: string;
  }
): Promise<void> {
  const docRef = doc(usersCollection, uid);
  const docSnap = await getDoc(docRef);
  
  if (!docSnap.exists()) {
    throw new Error(`User with uid ${uid} does not exist`);
  }

  // undefined 값은 제거하고, 빈 문자열은 그대로 저장
  const updateData: any = {
    updatedAt: dateToTimestamp(new Date()),
  };

  if (updates.displayName !== undefined) {
    updateData.displayName = updates.displayName;
  }
  if (updates.name !== undefined) {
    updateData.name = updates.name;
  }
  if (updates.instrument !== undefined) {
    updateData.instrument = updates.instrument;
  }
  if (updates.part !== undefined) {
    updateData.part = updates.part;
  }
  if (updates.remarks !== undefined) {
    updateData.remarks = updates.remarks;
  }

  await updateDoc(docRef, updateData);
}

export async function getAllUsers(): Promise<UserProfile[]> {
  const snapshot = await getDocs(usersCollection);
  return snapshot.docs.map((doc) => {
    const data = doc.data();
    return {
      id: doc.id,
      email: data.email,
      displayName: data.displayName || "",
      name: data.name || "",
      role: data.role || "User",
      instrument: data.instrument || "",
      part: data.part || "",
      remarks: data.remarks || "",
      createdAt: timestampToDate(data.createdAt),
      updatedAt: timestampToDate(data.updatedAt),
    };
  });
}


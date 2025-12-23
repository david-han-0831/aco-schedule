"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { 
  User, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  signOut,
  onAuthStateChanged,
  updateProfile
} from "firebase/auth";
import { auth } from "@/lib/firebase";
import { getUserProfile, createOrUpdateUserProfile, UserProfile, UserRole } from "@/lib/firestore";

interface AuthContextType {
  user: User | null;
  userProfile: UserProfile | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, name: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  updateUserProfile: (displayName: string) => Promise<void>;
  logout: () => Promise<void>;
  hasRole: (roles: UserRole[]) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);
      
      if (firebaseUser) {
        // 사용자 프로필 로드
        let profile = await getUserProfile(firebaseUser.uid);
        
        // 프로필이 없으면 생성 (이름은 나중에 입력받음)
        if (!profile) {
          await createOrUpdateUserProfile(
            firebaseUser.uid,
            firebaseUser.email || "",
            firebaseUser.displayName || undefined,
            "User" // 기본값은 User
          );
          profile = await getUserProfile(firebaseUser.uid);
        }
        
        setUserProfile(profile);
      } else {
        setUserProfile(null);
      }
      
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const signIn = async (email: string, password: string) => {
    await signInWithEmailAndPassword(auth, email, password);
  };

  const signUp = async (email: string, password: string, name: string) => {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    // 사용자 이름을 프로필에 저장 (선택사항)
    // await updateProfile(userCredential.user, { displayName: name });
  };

  const signInWithGoogle = async () => {
    const provider = new GoogleAuthProvider();
    const result = await signInWithPopup(auth, provider);
    // 구글 로그인 후 프로필이 없거나 이름이 없으면 이름 입력 화면으로 이동
    // (이 로직은 로그인 페이지에서 처리)
  };

  const updateUserProfile = async (name: string) => {
    if (!user) {
      throw new Error("User not found");
    }
    
    // Firestore의 UserProfile에 name 필드만 업데이트 (displayName은 구글 이름 유지)
    await createOrUpdateUserProfile(
      user.uid,
      user.email || "",
      user.displayName || undefined, // 구글 이름은 그대로 유지
      "User", // 기본 role은 User
      name // 사용자가 입력한 이름
    );
    
    // 프로필 다시 로드
    const profile = await getUserProfile(user.uid);
    setUserProfile(profile);
  };

  const logout = async () => {
    await signOut(auth);
    setUserProfile(null);
  };

  const hasRole = (roles: UserRole[]): boolean => {
    if (!userProfile) return false;
    return roles.includes(userProfile.role);
  };

  return (
    <AuthContext.Provider 
      value={{ 
        user, 
        userProfile,
        loading, 
        signIn, 
        signUp, 
        signInWithGoogle,
        updateUserProfile,
        logout,
        hasRole
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}


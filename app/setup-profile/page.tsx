"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { User, Loader2 } from "lucide-react";
import { useToast } from "@/components/ui/toast";

export default function SetupProfilePage() {
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const { user, userProfile, loading: authLoading, updateUserProfile } = useAuth();
  const router = useRouter();
  const { addToast } = useToast();

  useEffect(() => {
    if (!authLoading) {
      // 로그인하지 않았으면 로그인 페이지로
      if (!user) {
        router.push("/login");
        return;
      }
      // 이미 프로필이 있고 name이 있으면 대시보드로
      if (userProfile?.name) {
        router.push("/");
        return;
      }
      // 기존 name이 있으면 설정
      if (userProfile?.name) {
        setName(userProfile.name);
      }
    }
  }, [user, userProfile, authLoading, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      addToast("이름을 입력해주세요.", "error", 3000);
      return;
    }

    setLoading(true);
    try {
      await updateUserProfile(name.trim());
      addToast("프로필이 설정되었습니다.", "success", 3000);
      router.push("/");
    } catch (error: any) {
      addToast("프로필 설정에 실패했습니다: " + (error.message || String(error)), "error", 4000);
    } finally {
      setLoading(false);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100">
        <div className="text-gray-500">로딩 중...</div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 px-4">
      <Card className="w-full max-w-md border-0 shadow-xl">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 text-white font-bold text-lg">
              ACO
            </div>
          </div>
          <CardTitle className="text-2xl">프로필 설정</CardTitle>
          <CardDescription>
            안양시민오케스트라에 오신 것을 환영합니다
            <br />
            이름을 입력해주세요
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="name">이름</Label>
              <div className="relative mt-1">
                <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  id="name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  className="pl-10"
                  placeholder="이름을 입력하세요"
                  autoFocus
                />
              </div>
              <p className="mt-2 text-xs text-gray-500">
                악기나 역할은 관리자가 나중에 설정합니다.
              </p>
            </div>

            <Button
              type="submit"
              disabled={loading || !name.trim()}
              className="w-full bg-gray-900 hover:bg-gray-800 text-white"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  처리 중...
                </>
              ) : (
                "시작하기"
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}


"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Upload, CheckCircle, AlertCircle, Loader2 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/components/ui/toast";

export default function MigratePage() {
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<{
    type: "idle" | "success" | "error";
    message: string;
    results?: any;
  }>({ type: "idle", message: "" });
  const { user, userProfile, loading: authLoading } = useAuth();
  const router = useRouter();
  const { addToast } = useToast();

  // 접근 권한 체크 (SuperAdmin만 접근 가능)
  useEffect(() => {
    if (!authLoading) {
      if (!user) {
        router.push("/login");
        return;
      }
      if (userProfile?.role !== "SuperAdmin") {
        addToast("데이터 마이그레이션 페이지에 접근할 권한이 없습니다.", "error", 3000);
        router.push("/");
        return;
      }
    }
  }, [user, userProfile, authLoading, router, addToast]);

  const checkStatus = async () => {
    try {
      const response = await fetch("/api/migrate");
      const data = await response.json();
      setStatus({
        type: "success",
        message: "현재 Firestore 상태",
        results: data.firestore,
      });
    } catch (error) {
      setStatus({
        type: "error",
        message: "상태 확인 실패",
      });
    }
  };

  const runMigration = async () => {
    if (!confirm("JSON 파일 데이터를 Firestore로 마이그레이션하시겠습니까?")) {
      return;
    }

    setLoading(true);
    setStatus({ type: "idle", message: "마이그레이션 중..." });

    try {
      const response = await fetch("/api/migrate", {
        method: "POST",
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setStatus({
          type: "success",
          message: "마이그레이션이 완료되었습니다!",
          results: data.results,
        });
      } else {
        setStatus({
          type: "error",
          message: data.error || "마이그레이션 실패",
          results: data.results,
        });
      }
    } catch (error) {
      setStatus({
        type: "error",
        message: `마이그레이션 중 오류 발생: ${error}`,
      });
    } finally {
      setLoading(false);
    }
  };

  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-gray-500">로딩 중...</div>
      </div>
    );
  }

  if (!user || userProfile?.role !== "SuperAdmin") {
    return null;
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">데이터 마이그레이션</h1>
          <p className="text-gray-600 mt-2">
            JSON 파일 데이터를 Firestore로 마이그레이션합니다
          </p>
        </div>

        <Card className="border-0 shadow-md">
          <CardHeader>
            <CardTitle>마이그레이션 도구</CardTitle>
            <CardDescription>
              data 폴더의 JSON 파일을 Firestore로 가져옵니다
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex space-x-4">
              <Button
                onClick={checkStatus}
                variant="outline"
                className="flex-1"
              >
                상태 확인
              </Button>
              <Button
                onClick={runMigration}
                disabled={loading}
                className="flex-1 bg-gray-900 hover:bg-gray-800 text-white"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    마이그레이션 중...
                  </>
                ) : (
                  <>
                    <Upload className="h-4 w-4 mr-2" />
                    마이그레이션 실행
                  </>
                )}
              </Button>
            </div>

            {status.type !== "idle" && (
              <div
                className={`p-4 rounded-lg ${
                  status.type === "success"
                    ? "bg-green-50 border border-green-200"
                    : "bg-red-50 border border-red-200"
                }`}
              >
                <div className="flex items-start space-x-3">
                  {status.type === "success" ? (
                    <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
                  ) : (
                    <AlertCircle className="h-5 w-5 text-red-600 mt-0.5" />
                  )}
                  <div className="flex-1">
                    <p
                      className={`font-medium ${
                        status.type === "success" ? "text-green-900" : "text-red-900"
                      }`}
                    >
                      {status.message}
                    </p>
                    {status.results && (
                      <div className="mt-2 text-sm space-y-1">
                        {status.results.members !== undefined && (
                          <p className="text-gray-700">
                            회원: {status.results.members}개
                          </p>
                        )}
                        {status.results.instruments !== undefined && (
                          <p className="text-gray-700">
                            악기: {status.results.instruments}개
                          </p>
                        )}
                        {status.results.schedules !== undefined && (
                          <p className="text-gray-700">
                            일정: {status.results.schedules}개
                          </p>
                        )}
                        {status.results.errors && status.results.errors.length > 0 && (
                          <div className="mt-2">
                            <p className="font-medium text-red-800">오류:</p>
                            <ul className="list-disc list-inside text-red-700">
                              {status.results.errors.map((error: string, index: number) => (
                                <li key={index}>{error}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="border-0 shadow-md">
          <CardHeader>
            <CardTitle>마이그레이션 정보</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-gray-600">
            <p>• 기존 데이터가 있으면 마이그레이션이 건너뜁니다</p>
            <p>• Members, Instruments, Schedules 순서로 마이그레이션됩니다</p>
            <p>• Schedules는 Members와 연결되어야 하므로 Members가 먼저 필요합니다</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}


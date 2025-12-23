"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar as CalendarIcon, Grid } from "lucide-react";
import { CalendarView } from "@/components/calendar-view";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/ui/toast";
import { canAccessSchedules } from "@/lib/permissions";

const daysOfWeek = ["월", "화", "수", "목", "금", "토", "일"];

interface Member {
  id: string;
  name: string;
  instrument: string;
  part?: string;
}

interface Schedule {
  memberId: string;
  memberName: string;
  availableDays: string[];
  availableDates?: string[];
  dateNotes?: { [dateStr: string]: string };
}

export default function SchedulesPage() {
  const [viewMode, setViewMode] = useState<"table" | "calendar">("calendar");
  const [members, setMembers] = useState<Member[]>([]);
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [loading, setLoading] = useState(true);
  const { user, userProfile, loading: authLoading } = useAuth();
  const router = useRouter();
  const { addToast } = useToast();

  // 인증 및 권한 확인
  useEffect(() => {
    if (!authLoading) {
      if (!user) {
        router.push("/login");
        return;
      }
      if (!canAccessSchedules(userProfile?.role || null)) {
        addToast("연습일정 페이지에 접근할 권한이 없습니다.", "error", 3000);
        router.push("/");
        return;
      }
    }
  }, [user, userProfile, authLoading, router, addToast]);

  // 데이터 로드
  useEffect(() => {
    if (user) {
      loadData();
    }
  }, [user]);

  const loadData = async () => {
    try {
      const [membersRes, schedulesRes] = await Promise.all([
        fetch("/api/members"),
        fetch("/api/schedules"),
      ]);

      const membersData = await membersRes.json();
      const schedulesData = await schedulesRes.json();

      setMembers(membersData.members || []);
      
      // 현재 로그인한 사용자의 일정만 필터링
      const userSchedule = schedulesData.schedules?.find(
        (s: Schedule) => s.memberId === user?.uid
      ) || {
        memberId: user?.uid || "",
        memberName: user?.displayName || user?.email?.split("@")[0] || "사용자",
        availableDays: [],
      };

      setSchedules([userSchedule]);
    } catch (error) {
      console.error("Failed to load data:", error);
    } finally {
      setLoading(false);
    }
  };

  // 일정 업데이트 (본인 일정만)
  const handleUpdateSchedules = async (updatedSchedules: Schedule[], toastMessage?: string) => {
    if (!user) {
      console.error("User not found");
      return;
    }

    try {
      // 본인 일정만 업데이트 (첫 번째 일정 사용)
      const scheduleToUpdate = updatedSchedules[0] || {
        memberId: user.uid,
        memberName: user.displayName || user.email?.split("@")[0] || "사용자",
        availableDays: [],
        availableDates: [],
        dateNotes: {},
      };

      // memberId를 user.uid로 강제 설정하고 모든 필드 포함
      const mySchedule: Schedule = {
        memberId: user.uid,
        memberName: user.displayName || user.email?.split("@")[0] || "사용자",
        availableDays: scheduleToUpdate.availableDays || [],
        availableDates: scheduleToUpdate.availableDates || [],
        dateNotes: scheduleToUpdate.dateNotes || {},
      };

      console.log("Updating schedule:", JSON.stringify(mySchedule, null, 2));
      // updateSchedule에서 토스트를 표시
      const success = await updateSchedule(mySchedule, toastMessage || "일정이 저장되었습니다");
      if (success) {
        // 성공 시 데이터 다시 로드
        await loadData();
      }
    } catch (error) {
      console.error("Failed to update schedules:", error);
      addToast("일정 저장에 실패했습니다: " + (error instanceof Error ? error.message : String(error)), "error", 4000);
    }
  };

  const updateSchedule = async (schedule: Schedule, toastMessage?: string) => {
    try {
      const response = await fetch("/api/schedules", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          schedules: [schedule],
          currentWeek: new Date().toISOString().split("T")[0],
        }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setSchedules([schedule]);
        if (toastMessage) {
          addToast(toastMessage, "success", 3000);
        }
        return true;
      } else {
        throw new Error(data.error || "Failed to save schedules");
      }
    } catch (error) {
      console.error("Update schedule error:", error);
      throw error;
    }
  };

  // 요일별 출석 가능 인원 수 계산 (전체)
  const dayStats = daysOfWeek.map((day) => ({
    day,
    count: schedules.filter((schedule) =>
      schedule.availableDays.includes(day)
    ).length,
  }));

  if (authLoading || loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-gray-500">로딩 중...</div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  const mySchedule = schedules[0] || {
    memberId: user.uid,
    memberName: user.displayName || user.email?.split("@")[0] || "사용자",
    availableDays: [],
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">내 연습일정</h1>
          <p className="text-gray-600 mt-2">
            {user.displayName || user.email?.split("@")[0]}님의 출석 가능한 날짜를 선택하세요
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button
            variant={viewMode === "table" ? "default" : "outline"}
            onClick={() => setViewMode("table")}
            className={viewMode === "table" ? "bg-gray-900 hover:bg-gray-800 text-white" : ""}
          >
            <Grid className="h-4 w-4 mr-2" />
            테이블
          </Button>
          <Button
            variant={viewMode === "calendar" ? "default" : "outline"}
            onClick={() => setViewMode("calendar")}
            className={viewMode === "calendar" ? "bg-gray-900 hover:bg-gray-800 text-white" : ""}
          >
            <CalendarIcon className="h-4 w-4 mr-2" />
            캘린더
          </Button>
        </div>
      </div>

      {viewMode === "table" ? (
        <>
          <Card className="border-0 shadow-md">
            <CardHeader>
              <CardTitle>주간 일정 현황</CardTitle>
              <CardDescription>출석 가능한 요일을 확인하세요</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-3 px-4 font-semibold text-gray-700">이름</th>
                      {daysOfWeek.map((day) => (
                        <th
                          key={day}
                          className="text-center py-3 px-4 font-semibold text-gray-700"
                        >
                          {day}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                      <td className="py-4 px-4 font-medium text-gray-900">
                        {mySchedule.memberName}
                      </td>
                      {daysOfWeek.map((day) => (
                        <td key={day} className="py-4 px-4 text-center">
                          {mySchedule.availableDays.includes(day) ? (
                            <div className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-blue-100 text-blue-600">
                              <span className="text-xs font-semibold">✓</span>
                            </div>
                          ) : (
                            <div className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-gray-100 text-gray-400">
                              <span className="text-xs">-</span>
                            </div>
                          )}
                        </td>
                      ))}
                    </tr>
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </>
      ) : (
        <CalendarView
          members={[{
            id: user.uid,
            name: user.displayName || user.email?.split("@")[0] || "사용자",
            instrument: "",
          }]}
          schedules={[mySchedule]}
          onUpdate={handleUpdateSchedules}
        />
      )}
    </div>
  );
}

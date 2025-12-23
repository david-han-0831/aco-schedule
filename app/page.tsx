"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Music, Calendar, TrendingUp } from "lucide-react";
import { DashboardCalendar } from "@/components/dashboard-calendar";
import { DateAttendanceModal } from "@/components/date-attendance-modal";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { canAccessDashboard } from "@/lib/permissions";
import { Instrument } from "@/lib/firestore";

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

export default function DashboardPage() {
  const [members, setMembers] = useState<Member[]>([]);
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [instruments, setInstruments] = useState<Instrument[]>([]);
  const [loading, setLoading] = useState(true);
  const [attendanceModalOpen, setAttendanceModalOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const { user, userProfile, loading: authLoading } = useAuth();
  const router = useRouter();

  const loadData = useCallback(async () => {
    try {
      const [usersRes, schedulesRes, instrumentsRes] = await Promise.all([
        fetch("/api/users"),
        fetch("/api/schedules"),
        fetch("/api/instruments"),
      ]);

      const usersData = await usersRes.json();
      const schedulesData = await schedulesRes.json();
      const instrumentsData = await instrumentsRes.json();

      // users를 members 형식으로 변환
      const membersData = (usersData.users || []).map((user: any) => ({
        id: user.id,
        name: user.name || user.displayName || user.email?.split("@")[0] || "",
        instrument: user.instrument || "",
        part: user.part || "",
      }));

      setMembers(membersData);
      setSchedules(schedulesData.schedules || []);
      setInstruments(instrumentsData.instruments || []);
    } catch (error) {
      console.error("Failed to load dashboard data:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  // 접근 권한 체크 및 프로필 설정 확인
  useEffect(() => {
    if (!authLoading) {
      if (!user) {
        router.push("/login");
        return;
      }
      // name이 없으면 프로필 설정 페이지로
      if (!userProfile?.name) {
        router.push("/setup-profile");
        return;
      }
      if (!canAccessDashboard(userProfile?.role || null)) {
        router.push("/login");
        return;
      }
    }
  }, [user, userProfile, authLoading, router]);

  // 데이터 로드
  useEffect(() => {
    if (user && canAccessDashboard(userProfile?.role || null) && !authLoading) {
      loadData();
    }
  }, [user, userProfile, authLoading, loadData]);

  if (authLoading || loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-gray-500">로딩 중...</div>
      </div>
    );
  }

  if (!user || !canAccessDashboard(userProfile?.role || null)) {
    return null;
  }

  // 통계 계산
  const totalMembers = members.length;
  const totalInstruments = new Set(members.map((m) => m.instrument)).size;

  // 악기별 통계
  const instrumentCounts: Record<string, number> = {};
  members.forEach((member) => {
    if (member.instrument) {
      instrumentCounts[member.instrument] = (instrumentCounts[member.instrument] || 0) + 1;
    }
  });

  // 악기 약어로 실제 악기 이름 찾기
  const getInstrumentName = (abbreviation: string): string => {
    const instrument = instruments.find((inst) => inst.abbreviation === abbreviation);
    return instrument ? instrument.name : abbreviation;
  };

  const instrumentStats = Object.entries(instrumentCounts).map(([abbreviation, count]) => {
    return {
      name: getInstrumentName(abbreviation),
      count: count as number,
      abbreviation,
    };
  });

  // 대한민국 공휴일 확인 함수
  const isHoliday = (date: Date): boolean => {
    const month = date.getMonth() + 1; // 1-12
    const day = date.getDate();

    // 양력 고정 휴일
    const fixedHolidays: { [key: string]: number[] } = {
      "1": [1],      // 신정
      "3": [1],      // 삼일절
      "5": [5],      // 어린이날
      "6": [6],      // 현충일
      "8": [15],     // 광복절
      "10": [3, 9],  // 개천절, 한글날
      "12": [25],    // 크리스마스
    };

    return fixedHolidays[month.toString()]?.includes(day) || false;
  };

  // 요일별 출석 가능 인원 수 계산 (availableDates 기반으로도 계산)
  const daysOfWeek = ["월", "화", "수", "목", "금", "토", "일"];
  const today = new Date();
  // 오늘을 기준으로 이번 주 월요일 계산 (한국 기준: 월요일이 주의 시작)
  const currentDay = today.getDay(); // 0: 일요일, 1: 월요일, ..., 6: 토요일
  const daysToMonday = currentDay === 0 ? -6 : 1 - currentDay; // 일요일이면 -6, 아니면 1 - currentDay
  const currentWeekStart = new Date(today);
  currentWeekStart.setDate(today.getDate() + daysToMonday);
  currentWeekStart.setHours(0, 0, 0, 0); // 시간 초기화
  
  const weeklyStats = daysOfWeek.map((day, index) => {
    const targetDate = new Date(currentWeekStart);
    targetDate.setDate(currentWeekStart.getDate() + index);
    const dateStr = `${targetDate.getFullYear()}-${String(targetDate.getMonth() + 1).padStart(2, "0")}-${String(targetDate.getDate()).padStart(2, "0")}`;
    
    // 날짜 기반과 요일 기반 모두 확인
    const count = schedules.filter((schedule) => {
      if (schedule.availableDates && schedule.availableDates.length > 0) {
        return schedule.availableDates.includes(dateStr);
      }
      return schedule.availableDays?.includes(day) || false;
    }).length;
    
    // 날짜 포맷팅 (월/일)
    const dateDisplay = `${targetDate.getMonth() + 1}/${targetDate.getDate()}`;
    
    // 휴일 확인
    const holiday = isHoliday(targetDate);
    
    return { day, count, date: targetDate, dateDisplay, holiday };
  });

  const weeklyPractices = weeklyStats.filter((stat) => stat.count > 0).length;
  const averageAttendance =
    weeklyStats.reduce((sum, stat) => sum + stat.count, 0) / 7;

  return (
    <div className="space-y-4 sm:space-y-6 md:space-y-8">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">대시보드</h1>
        <p className="text-sm sm:text-base text-gray-600 mt-1 sm:mt-2">전체 현황 및 통계 정보를 확인하세요</p>
      </div>

      {/* 통계 카드 섹션 - 주석처리 */}
      {/* <div className="grid gap-3 sm:gap-4 grid-cols-2 md:grid-cols-2 lg:grid-cols-4">
        <Card className="border-0 shadow-md hover:shadow-lg transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              전체 구성원
            </CardTitle>
            <Users className="h-4 w-4 text-gray-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">{totalMembers}</div>
            <p className="text-xs text-gray-500 mt-1">명</p>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-md hover:shadow-lg transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              악기 종류
            </CardTitle>
            <Music className="h-4 w-4 text-gray-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">{totalInstruments}</div>
            <p className="text-xs text-gray-500 mt-1">종류</p>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-md hover:shadow-lg transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              주간 연습일
            </CardTitle>
            <Calendar className="h-4 w-4 text-gray-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">{weeklyPractices}</div>
            <p className="text-xs text-gray-500 mt-1">일</p>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-md hover:shadow-lg transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              평균 출석 인원
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-gray-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">
              {averageAttendance.toFixed(1)}
            </div>
            <p className="text-xs text-gray-500 mt-1">명/일</p>
          </CardContent>
        </Card>
      </div> */}

      <div className="grid gap-3 sm:gap-4 grid-cols-1 md:grid-cols-2">
        <Card className="border-0 shadow-md">
          <CardHeader>
            <CardTitle className="text-lg sm:text-xl">악기별 구성원 분포</CardTitle>
            <CardDescription className="text-xs sm:text-sm">악기별 구성원 수를 확인하세요</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 sm:space-y-4">
              {instrumentStats.map((instrument) => (
                <div key={instrument.abbreviation} className="flex items-center justify-between">
                  <div className="flex items-center space-x-2 sm:space-x-3">
                    <div className="flex h-8 w-8 sm:h-10 sm:w-10 items-center justify-center rounded-lg bg-gradient-to-br from-blue-50 to-blue-100 text-blue-600 font-semibold text-xs sm:text-sm">
                      {instrument.abbreviation}
                    </div>
                    <span className="font-medium text-sm sm:text-base text-gray-900">{instrument.name}</span>
                  </div>
                  <div className="flex items-center space-x-1 sm:space-x-2">
                    <span className="text-xl sm:text-2xl font-bold text-gray-900">{instrument.count}</span>
                    <span className="text-xs sm:text-sm text-gray-500">명</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-md">
          <CardHeader>
            <CardTitle>주간 연습일정 요약</CardTitle>
            <CardDescription>이번 주 연습일정을 확인하세요</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 sm:space-y-3">
              {weeklyStats.map((stat) => {
                const isToday = stat.date.toDateString() === today.toDateString();
                return (
                  <div 
                    key={stat.day} 
                    onClick={() => {
                      setSelectedDate(stat.date);
                      setAttendanceModalOpen(true);
                    }}
                    className={cn(
                      "flex items-center justify-between rounded-lg p-2 sm:p-3 cursor-pointer transition-colors",
                      isToday ? "bg-blue-50 border border-blue-200 hover:bg-blue-100" : "bg-gray-50 hover:bg-gray-100"
                    )}
                  >
                    <div className="flex items-center space-x-1.5 sm:space-x-2 flex-1 min-w-0">
                      <span className={cn(
                        "font-medium text-sm sm:text-base",
                        stat.holiday ? "text-red-600" : "text-gray-700"
                      )}>
                        {stat.day}요일
                      </span>
                      <span className={cn(
                        "text-xs sm:text-sm",
                        stat.holiday ? "text-red-500" : "text-gray-500"
                      )}>
                        ({stat.dateDisplay})
                      </span>
                      {isToday && (
                        <span className="text-xs px-1.5 sm:px-2 py-0.5 rounded-full bg-blue-500 text-white font-medium whitespace-nowrap">
                          오늘
                        </span>
                      )}
                    </div>
                    {stat.count > 0 && (
                      <div className="flex items-center space-x-1.5 sm:space-x-2 flex-shrink-0">
                        <span className="text-xs sm:text-sm text-gray-500 whitespace-nowrap">출석 가능 인원: {stat.count}명</span>
                        <div className="h-2 w-2 rounded-full bg-green-500" />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>

          {/* 이번달 연습 현황 캘린더 */}
          <Card className="border-0 shadow-md">
            <CardHeader>
              <CardTitle>이번달 연습 현황</CardTitle>
              <CardDescription>전체 회원의 일정을 캘린더로 확인하세요</CardDescription>
            </CardHeader>
            <CardContent>
              <DashboardCalendar 
                members={members} 
                schedules={schedules}
                onDateClick={(date) => {
                  setSelectedDate(date);
                  setAttendanceModalOpen(true);
                }}
              />
            </CardContent>
          </Card>

          {/* 출석 가능 인원 모달 */}
          <DateAttendanceModal
            open={attendanceModalOpen}
            onOpenChange={setAttendanceModalOpen}
            date={selectedDate}
            members={
              selectedDate
                ? schedules
                    .filter((schedule) => {
                      const dateStr = `${selectedDate.getFullYear()}-${String(selectedDate.getMonth() + 1).padStart(2, "0")}-${String(selectedDate.getDate()).padStart(2, "0")}`;
                      if (schedule.availableDates && schedule.availableDates.length > 0) {
                        return schedule.availableDates.includes(dateStr);
                      }
                      const dayOfWeek = ["일", "월", "화", "수", "목", "금", "토"][selectedDate.getDay()];
                      return schedule.availableDays?.includes(dayOfWeek) || false;
                    })
                    .map((schedule) => {
                      const member = members.find((m) => m.id === schedule.memberId);
                      const dateStr = `${selectedDate.getFullYear()}-${String(selectedDate.getMonth() + 1).padStart(2, "0")}-${String(selectedDate.getDate()).padStart(2, "0")}`;
                      return {
                        memberId: schedule.memberId,
                        memberName: member?.name || schedule.memberName || "알 수 없음",
                        memo: schedule.dateNotes?.[dateStr] || "",
                        instrument: member?.instrument || "",
                        part: member?.part || "",
                      };
                    })
                : []
            }
          />
        </div>
      );
    }

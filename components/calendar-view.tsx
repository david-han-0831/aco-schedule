"use client";

import { useState, useRef, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, Save, CheckCircle2, FileText } from "lucide-react";
import { cn } from "@/lib/utils";
import { useToast } from "@/components/ui/toast";
import { DateMemoDialog } from "@/components/date-memo-dialog";

interface Member {
  id: string;
  name: string;
  instrument: string;
  part?: string;
}

interface Schedule {
  memberId: string;
  memberName: string;
  availableDays: string[]; // 요일 기반 (기존 호환성)
  availableDates?: string[]; // 날짜 기반 (YYYY-MM-DD 형식)
  dateNotes?: { [dateStr: string]: string }; // 날짜별 메모 (YYYY-MM-DD 형식의 키)
}

interface CalendarViewProps {
  members: Member[];
  schedules: Schedule[];
  onUpdate: (schedules: Schedule[], toastMessage?: string) => void;
}

const daysOfWeek = ["일", "월", "화", "수", "목", "금", "토"];

export function CalendarView({ members, schedules, onUpdate }: CalendarViewProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedMember, setSelectedMember] = useState<string | null>(
    members.length > 0 ? members[0].id : null
  );
  const [isDragging, setIsDragging] = useState(false);
  const [localSchedules, setLocalSchedules] = useState<Schedule[]>(schedules);
  const [hasChanges, setHasChanges] = useState(false);
  const [saving, setSaving] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const [mouseDownPos, setMouseDownPos] = useState<{ x: number; y: number; date: Date } | null>(null);
  const calendarRef = useRef<HTMLDivElement>(null);
  const lastClickRef = useRef<{ dateStr: string; timestamp: number } | null>(null);
  const [memoDialogOpen, setMemoDialogOpen] = useState(false);
  const [selectedDateForMemo, setSelectedDateForMemo] = useState<Date | null>(null);
  const { addToast } = useToast();

  // members가 변경되면 첫 번째 멤버 자동 선택
  useEffect(() => {
    if (members.length > 0 && !selectedMember) {
      setSelectedMember(members[0].id);
    }
  }, [members, selectedMember]);

  // schedules가 변경되면 localSchedules 업데이트 (초기 로드 시에만)
  useEffect(() => {
    if (!isInitialized && schedules.length > 0) {
      console.log("Initializing localSchedules from props:", schedules);
      setLocalSchedules(schedules);
      setIsInitialized(true);
    } else if (isInitialized && schedules.length === 0 && localSchedules.length > 0) {
      // schedules가 비워졌을 때만 초기화 (저장 후 새로고침 등)
      console.log("Resetting localSchedules because schedules is empty");
      setLocalSchedules([]);
      setIsInitialized(false);
    }
  }, [schedules.length, isInitialized]); // schedules.length만 의존성으로 사용

  // 현재 월의 첫 날과 마지막 날 계산
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const daysInMonth = lastDay.getDate();
  const startingDayOfWeek = firstDay.getDay();

  // 날짜 배열 생성 (이전 달과 다음 달 일부 포함)
  const days: Date[] = [];
  
  // 이전 달의 마지막 날짜들 추가
  const prevMonth = month === 0 ? 11 : month - 1;
  const prevYear = month === 0 ? year - 1 : year;
  const prevMonthLastDay = new Date(prevYear, prevMonth + 1, 0).getDate();
  
  for (let i = startingDayOfWeek - 1; i >= 0; i--) {
    days.push(new Date(prevYear, prevMonth, prevMonthLastDay - i));
  }
  
  // 현재 달의 날짜 추가
  for (let day = 1; day <= daysInMonth; day++) {
    days.push(new Date(year, month, day));
  }
  
  // 다음 달의 첫 날짜들 추가 (7일 단위로 맞추기 위해)
  const totalDays = days.length;
  const remainingDays = 42 - totalDays; // 6주 * 7일 = 42일
  const nextMonth = month === 11 ? 0 : month + 1;
  const nextYear = month === 11 ? year + 1 : year;
  
  for (let day = 1; day <= remainingDays; day++) {
    days.push(new Date(nextYear, nextMonth, day));
  }

  // 날짜를 요일로 변환 (한글)
  const getDayOfWeek = (date: Date): string => {
    return daysOfWeek[date.getDay()];
  };

  // 대한민국 공휴일 확인 (양력 고정 휴일)
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

  // 날짜를 YYYY-MM-DD 형식으로 변환
  const formatDate = (date: Date): string => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  // 특정 회원이 특정 날짜에 출석 가능한지 확인
  const isMemberAvailable = (memberId: string, date: Date): boolean => {
    const schedule = localSchedules.find((s) => s.memberId === memberId);
    if (!schedule) return false;
    
    // 날짜 기반이 우선 (availableDates가 있으면 사용)
    if (schedule.availableDates && schedule.availableDates.length > 0) {
      const dateStr = formatDate(date);
      return schedule.availableDates.includes(dateStr);
    }
    
    // 요일 기반 (기존 호환성)
    const dayOfWeek = getDayOfWeek(date);
    return schedule.availableDays?.includes(dayOfWeek) || false;
  };

  // 날짜 클릭/드래그 처리 (업데이트된 스케줄 배열 반환)
  const handleDateInteraction = (date: Date, toggle: boolean = false, showToast: boolean = false): Schedule[] => {
    if (selectedMember === null) {
      console.warn("handleDateInteraction: selectedMember is null");
      return localSchedules;
    }

    const dateStr = formatDate(date);
    
    // 중복 호출 방지: 같은 날짜를 500ms 이내에 다시 클릭하면 토스트만 무시
    let shouldShowToast = showToast;
    if (showToast) {
      const now = Date.now();
      if (lastClickRef.current) {
        const timeSinceLastClick = now - lastClickRef.current.timestamp;
        // 같은 날짜를 500ms 이내에 다시 클릭한 경우에만 토스트 무시
        if (lastClickRef.current.dateStr === dateStr && timeSinceLastClick < 500) {
          console.log("Duplicate click ignored (toast only):", dateStr, "timeSinceLastClick:", timeSinceLastClick);
          shouldShowToast = false; // 토스트만 무시, 상태는 업데이트
        } else {
          // 다른 날짜이거나 시간이 지났으면 토스트 표시
          lastClickRef.current = { dateStr, timestamp: now };
        }
      } else {
        // 첫 클릭이면 항상 토스트 표시
        lastClickRef.current = { dateStr, timestamp: now };
      }
    }
    
    console.log("handleDateInteraction:", { date: date.toDateString(), dateStr, selectedMember, toggle, shouldShowToast });
    
    // 토스트 메시지 준비 (상태 업데이트 전에 확인)
    let toastMessage: string | null = null;
    let toastType: "success" | "info" = "success";
    
    if (toggle && shouldShowToast) {
      // 현재 상태에서 날짜가 있는지 확인
      const currentSchedule = localSchedules.find((s) => s.memberId === selectedMember);
      const currentDates = currentSchedule?.availableDates || [];
      const isCurrentlySelected = currentDates.includes(dateStr);
      
      if (isCurrentlySelected) {
        toastMessage = `${date.getMonth() + 1}월 ${date.getDate()}일이 제거되었습니다`;
        toastType = "info";
      } else {
        toastMessage = `${date.getMonth() + 1}월 ${date.getDate()}일이 추가되었습니다`;
        toastType = "success";
      }
    }
    
    const updated = localSchedules.map(s => ({
      ...s,
      availableDays: s.availableDays ? [...s.availableDays] : [],
      availableDates: s.availableDates ? [...s.availableDates] : [],
      dateNotes: s.dateNotes ? { ...s.dateNotes } : {}
    }));
    
    let schedule = updated.find((s) => s.memberId === selectedMember);

    if (!schedule) {
      const member = members.find((m) => m.id === selectedMember);
      if (!member) return localSchedules;
      schedule = {
        memberId: selectedMember,
        memberName: member.name,
        availableDays: [],
        availableDates: [],
        dateNotes: {},
      };
      updated.push(schedule);
    }

    const index = updated.findIndex((s) => s.memberId === selectedMember);
    
    // availableDates 배열을 새로 생성 (불변성 유지)
    let newAvailableDates = schedule.availableDates ? [...schedule.availableDates] : [];
    
    if (toggle) {
      // 토글: 있으면 제거, 없으면 추가
      const dateIndex = newAvailableDates.indexOf(dateStr);
      if (dateIndex > -1) {
        newAvailableDates = newAvailableDates.filter((d) => d !== dateStr);
        console.log("Removed date:", dateStr);
      } else {
        newAvailableDates = [...newAvailableDates, dateStr];
        console.log("Added date:", dateStr, "Current dates:", newAvailableDates);
      }
    } else {
      // 드래그: 없으면 추가
      if (!newAvailableDates.includes(dateStr)) {
        newAvailableDates = [...newAvailableDates, dateStr];
      }
    }

    // availableDates 정렬 (날짜 순서대로)
    newAvailableDates.sort();

    // 새로운 스케줄 객체 생성 (불변성 유지)
    updated[index] = {
      ...schedule,
      availableDates: newAvailableDates
    };
    
    // 상태 업데이트
    setLocalSchedules(updated);
    setHasChanges(true);
    console.log("Updated schedule:", updated[index]);
    console.log("All localSchedules:", updated);
    
    return updated;
    
    // 토스트 표시 (상태 업데이트 후)
    if (toastMessage) {
      console.log("Calling addToast:", toastMessage, toastType);
      addToast(toastMessage, toastType, 2000);
    } else {
      console.log("No toast message (toggle:", toggle, "shouldShowToast:", shouldShowToast, ")");
    }
  };

  const handleMouseEnter = (date: Date) => {
    if (isDragging && selectedMember) {
      handleDateInteraction(date, false);
    }
  };

  // 메모 저장 핸들러 (업데이트된 스케줄을 반환)
  const handleSaveMemo = (date: Date, memo: string): Schedule[] => {
    if (selectedMember === null) return localSchedules;

    const dateStr = formatDate(date);
    const updated = localSchedules.map(s => ({
      ...s,
      availableDays: s.availableDays ? [...s.availableDays] : [],
      availableDates: s.availableDates ? [...s.availableDates] : [],
      dateNotes: s.dateNotes ? { ...s.dateNotes } : {}
    }));
    
    let schedule = updated.find((s) => s.memberId === selectedMember);
    if (!schedule) {
      const member = members.find((m) => m.id === selectedMember);
      if (!member) return localSchedules;
      schedule = {
        memberId: selectedMember,
        memberName: member.name,
        availableDays: [],
        availableDates: [],
        dateNotes: {},
      };
      updated.push(schedule);
    }

    const index = updated.findIndex((s) => s.memberId === selectedMember);
    
    // availableDates 초기화
    if (!updated[index].availableDates) {
      updated[index].availableDates = [];
    }
    
    // 날짜가 선택되어 있지 않으면 선택 (일정 등록)
    if (!updated[index].availableDates.includes(dateStr)) {
      updated[index].availableDates = [...updated[index].availableDates, dateStr].sort();
    }
    
    // dateNotes 초기화
    if (!updated[index].dateNotes) {
      updated[index].dateNotes = {};
    }
    
    // 메모 저장
    if (memo.trim()) {
      updated[index].dateNotes![dateStr] = memo.trim();
    } else {
      // 빈 메모면 삭제
      delete updated[index].dateNotes![dateStr];
    }

    // 상태 업데이트
    setLocalSchedules(updated);
    setHasChanges(true);
    console.log("handleSaveMemo - Updated schedule:", updated[index]);
    return updated;
  };

  // 날짜의 메모 가져오기
  const getDateMemo = (date: Date): string => {
    if (!selectedMember) return "";
    const schedule = localSchedules.find((s) => s.memberId === selectedMember);
    if (!schedule || !schedule.dateNotes) return "";
    const dateStr = formatDate(date);
    return schedule.dateNotes[dateStr] || "";
  };

  useEffect(() => {
    const handleGlobalMouseUp = () => {
      setIsDragging(false);
    };

    if (isDragging) {
      document.addEventListener("mouseup", handleGlobalMouseUp);
      return () => document.removeEventListener("mouseup", handleGlobalMouseUp);
    }
  }, [isDragging]);

  // 이전/다음 월 이동
  const goToPreviousMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const goToNextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  // 오늘로 이동
  const goToToday = () => {
    setCurrentDate(new Date());
  };

  // 저장 (메모 다이얼로그에서 호출)
  const handleSave = async (toastMessage?: string) => {
    setSaving(true);
    try {
      console.log("handleSave - Saving localSchedules:", localSchedules);
      await onUpdate(localSchedules, toastMessage);
      setHasChanges(false);
      // 토스트는 부모 컴포넌트(updateSchedule)에서 표시
    } catch (error) {
      console.error("Failed to save schedules:", error);
      addToast("저장에 실패했습니다. 다시 시도해주세요.", "error", 4000);
      throw error;
    } finally {
      setSaving(false);
    }
  };

  const monthNames = [
    "1월", "2월", "3월", "4월", "5월", "6월",
    "7월", "8월", "9월", "10월", "11월", "12월",
  ];

  const currentSchedule = localSchedules.find((s) => s.memberId === selectedMember);
  // 현재 월의 선택된 날짜 수 계산
  const selectedDaysCount = currentSchedule?.availableDates 
    ? currentSchedule.availableDates.filter(dateStr => {
        const date = new Date(dateStr);
        return date.getFullYear() === year && date.getMonth() === month;
      }).length
    : (currentSchedule?.availableDays?.length || 0);

  return (
    <div className="space-y-3 sm:space-y-6">
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2 sm:space-x-4 flex-1">
          <Button
            variant="outline"
            size="icon"
            onClick={goToPreviousMonth}
            className="h-9 w-9 sm:h-10 sm:w-10 rounded-full hover:bg-gray-100"
          >
            <ChevronLeft className="h-4 w-4 sm:h-5 sm:w-5" />
          </Button>
          <div className="flex items-center space-x-2 sm:space-x-3 flex-1 justify-center">
            <h2 className="text-lg sm:text-2xl font-bold text-gray-900 text-center">
              {year}년 {monthNames[month]}
            </h2>
            <Button
              variant="outline"
              size="sm"
              onClick={goToToday}
              className="text-xs h-7 sm:h-8 px-2 sm:px-3"
            >
              오늘
            </Button>
          </div>
          <Button
            variant="outline"
            size="icon"
            onClick={goToNextMonth}
            className="h-9 w-9 sm:h-10 sm:w-10 rounded-full hover:bg-gray-100"
          >
            <ChevronRight className="h-4 w-4 sm:h-5 sm:w-5" />
          </Button>
        </div>
      </div>

      {/* 회원 정보 및 선택된 날짜 수 */}
      {members.length === 1 && (
        <div className="flex items-center justify-between p-3 sm:p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-100">
          <div>
            <p className="text-xs sm:text-sm text-gray-600 mb-1">나의 일정</p>
            <p className="text-base sm:text-lg font-semibold text-gray-900">
              {members[0].name}님
            </p>
          </div>
          <div className="text-right">
            <p className="text-xs sm:text-sm text-gray-600 mb-1">선택된 요일</p>
            <p className="text-xl sm:text-2xl font-bold text-blue-600">
              {selectedDaysCount}일
            </p>
          </div>
        </div>
      )}

      {selectedMember ? (
        <p className="text-xs sm:text-sm text-gray-600 px-1">
          💡 날짜를 <span className="font-semibold">터치</span>하여 메모를 작성하거나 <span className="font-semibold">드래그</span>하여 출석 가능한 요일을 선택하세요.
        </p>
      ) : (
        <p className="text-xs sm:text-sm text-red-600 px-1">
          ⚠️ 회원이 선택되지 않았습니다. 날짜를 클릭할 수 없습니다.
        </p>
      )}

      {/* 캘린더 그리드 */}
      <Card className="border-0 shadow-lg overflow-hidden" ref={calendarRef}>
        <CardContent className="p-2 sm:p-4 md:p-6">
          {/* 요일 헤더 */}
          <div className="grid grid-cols-7 gap-1 sm:gap-2 mb-1 sm:mb-3">
            {daysOfWeek.map((day, index) => (
              <div
                key={day}
                className={cn(
                  "text-center text-xs sm:text-sm font-bold py-2 sm:py-3 rounded-lg",
                  index === 0 ? "text-red-500 bg-red-50" : index === 6 ? "text-blue-500 bg-blue-50" : "text-gray-700 bg-gray-50"
                )}
              >
                {day}
              </div>
            ))}
          </div>

          {/* 날짜 그리드 */}
          <div className="grid grid-cols-7 gap-1 sm:gap-2">
            {days.map((date, index) => {
              const isToday =
                date.toDateString() === new Date().toDateString();
              const isSelected =
                selectedMember &&
                isMemberAvailable(selectedMember, date);
              const dayOfWeek = date.getDay();
              const hasMemo = getDateMemo(date) !== "";
              const isHolidayDate = isHoliday(date);
              
              // 현재 달인지 확인
              const isCurrentMonth = date.getMonth() === month && date.getFullYear() === year;
              const isOtherMonth = !isCurrentMonth;

              return (
                <button
                  key={date.toDateString()}
                  type="button"
                  onMouseDown={(e) => {
                    // 마우스 다운 시 위치와 날짜 기록
                    if (selectedMember !== null && e.button === 0) {
                      e.preventDefault(); // onClick 이벤트 방지
                      setMouseDownPos({ x: e.clientX, y: e.clientY, date });
                      setIsDragging(false);
                    }
                  }}
                  onMouseMove={(e) => {
                    // 마우스가 움직이면 드래그로 간주
                    if (mouseDownPos && selectedMember !== null) {
                      const distance = Math.sqrt(
                        Math.pow(e.clientX - mouseDownPos.x, 2) + 
                        Math.pow(e.clientY - mouseDownPos.y, 2)
                      );
                      if (distance > 5) {
                        // 5px 이상 움직이면 드래그
                        setIsDragging(true);
                      }
                    }
                  }}
                  onMouseEnter={() => {
                    if (selectedMember !== null && isDragging && mouseDownPos) {
                      handleMouseEnter(date);
                    }
                  }}
                  onMouseUp={(e) => {
                    if (selectedMember !== null && mouseDownPos) {
                      if (!isDragging) {
                        // 드래그가 아니면 클릭으로 처리
                        const distance = Math.sqrt(
                          Math.pow(e.clientX - mouseDownPos.x, 2) + 
                          Math.pow(e.clientY - mouseDownPos.y, 2)
                        );
                        if (distance < 5) {
                          // 5px 이내면 클릭 - 모달만 열기 (날짜 선택/해제는 모달 안에서 처리)
                          if (isOtherMonth) {
                            // 다른 달의 날짜를 클릭하면 해당 달로 이동
                            setCurrentDate(new Date(date.getFullYear(), date.getMonth(), 1));
                            // 메모 다이얼로그 열기
                            setTimeout(() => {
                              setSelectedDateForMemo(date);
                              setMemoDialogOpen(true);
                            }, 100); // 달 변경 후 약간의 지연
                          } else {
                            // 현재 달의 날짜 클릭 - 메모 다이얼로그만 열기
                            setSelectedDateForMemo(date);
                            setMemoDialogOpen(true);
                          }
                        }
                      }
                      setIsDragging(false);
                      setMouseDownPos(null);
                    }
                  }}
                  onMouseLeave={() => {
                    if (isDragging) {
                      setIsDragging(false);
                    }
                  }}
                  disabled={selectedMember === null}
                  className={cn(
                    "aspect-square rounded-lg sm:rounded-xl border-2 transition-all relative group flex flex-col items-center justify-center",
                    "active:scale-95 sm:hover:scale-105 sm:hover:shadow-md",
                    "touch-manipulation", // 모바일 터치 최적화
                    selectedMember === null ? "cursor-not-allowed opacity-50" : "cursor-pointer",
                    isToday && !isSelected && "border-blue-500 bg-blue-50 ring-1 sm:ring-2 ring-blue-200",
                    isSelected && selectedMember
                      ? "bg-gradient-to-br from-blue-500 to-blue-600 border-blue-600 text-white shadow-md sm:shadow-lg"
                      : isOtherMonth
                      ? "bg-gray-50 border-gray-100 sm:hover:border-gray-200 sm:hover:bg-gray-100"
                      : "bg-white border-gray-200 sm:hover:border-gray-300 sm:hover:bg-gray-50",
                    dayOfWeek === 0 && !isSelected && !isOtherMonth && "bg-red-50/50",
                    dayOfWeek === 6 && !isSelected && !isOtherMonth && "bg-blue-50/50"
                  )}
                >
                  <span
                    className={cn(
                      "text-sm sm:text-base font-semibold",
                      isToday && !isSelected && "text-blue-600",
                      isSelected && selectedMember
                        ? "text-white"
                        : isHolidayDate
                        ? "text-red-600"
                        : isOtherMonth
                        ? "text-gray-400"
                        : "text-gray-900"
                    )}
                  >
                    {date.getDate()}
                  </span>
                  {isSelected && selectedMember && (
                    <CheckCircle2 className="h-3 w-3 sm:h-4 sm:w-4 text-white mt-0.5" />
                  )}
                  {isToday && !isSelected && (
                    <div className="absolute top-0.5 right-0.5 sm:top-1 sm:right-1 h-1.5 w-1.5 sm:h-2 sm:w-2 bg-blue-500 rounded-full" />
                  )}
                  {hasMemo && !isSelected && (
                    <FileText className={cn(
                      "h-2.5 w-2.5 sm:h-3 sm:w-3 absolute bottom-0.5 sm:bottom-1",
                      isOtherMonth ? "text-gray-300" : "text-gray-400"
                    )} />
                  )}
                </button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* 범례 */}
      <div className="flex items-center justify-center space-x-8 text-sm">
        <div className="flex items-center space-x-2">
          <div className="w-5 h-5 rounded-lg border-2 border-blue-500 bg-blue-50 ring-2 ring-blue-200" />
          <span className="text-gray-700 font-medium">오늘</span>
        </div>
        <div className="flex items-center space-x-2">
          <div className="w-5 h-5 rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 border-2 border-blue-600 shadow-md">
            <CheckCircle2 className="h-3 w-3 text-white m-0.5" />
          </div>
          <span className="text-gray-700 font-medium">선택된 날짜</span>
        </div>
        <div className="flex items-center space-x-2">
          <div className="w-5 h-5 rounded-lg border-2 border-gray-200 bg-white" />
          <span className="text-gray-700 font-medium">일반 날짜</span>
        </div>
      </div>

      {/* 메모 다이얼로그 */}
      {selectedDateForMemo && selectedMember && (
        <DateMemoDialog
          open={memoDialogOpen}
          onOpenChange={setMemoDialogOpen}
          date={selectedDateForMemo}
          memberName={members.find((m) => m.id === selectedMember)?.name || ""}
          currentMemo={getDateMemo(selectedDateForMemo)}
          isDateSelected={isMemberAvailable(selectedMember, selectedDateForMemo)}
          onSave={handleSaveMemo}
          onSaveComplete={async (updatedSchedules: Schedule[]) => {
            // 일정 저장/수정: 메모 저장 후 일정도 저장
            if (updatedSchedules && updatedSchedules.length > 0) {
              await onUpdate(updatedSchedules, "일정이 저장되었습니다");
            }
          }}
          onCancelComplete={async (updatedSchedules: Schedule[]) => {
            // 일정 취소: 날짜 해제 후 일정 저장
            // handleDateInteraction이 반환한 업데이트된 스케줄 사용
            if (updatedSchedules && updatedSchedules.length > 0) {
              await onUpdate(updatedSchedules, "일정이 취소되었습니다");
            }
          }}
          onToggleDate={(date) => {
            // 날짜 선택/해제 토글 (일정 취소 시 사용)
            // handleDateInteraction이 업데이트된 스케줄을 반환하므로 이를 사용
            return handleDateInteraction(date, true, false);
          }}
        />
      )}
    </div>
  );
}

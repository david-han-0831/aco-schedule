"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, CheckCircle2, Users } from "lucide-react";
import { cn } from "@/lib/utils";

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

interface DashboardCalendarProps {
  members: Member[];
  schedules: Schedule[];
  onDateClick?: (date: Date) => void;
}

const daysOfWeek = ["일", "월", "화", "수", "목", "금", "토"];

export function DashboardCalendar({ members, schedules, onDateClick }: DashboardCalendarProps) {
  const [currentDate, setCurrentDate] = useState(new Date());

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
  const remainingDays = 42 - totalDays;
  const nextMonth = month === 11 ? 0 : month + 1;
  const nextYear = month === 11 ? year + 1 : year;
  
  for (let day = 1; day <= remainingDays; day++) {
    days.push(new Date(nextYear, nextMonth, day));
  }

  // 날짜를 YYYY-MM-DD 형식으로 변환
  const formatDate = (date: Date): string => {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, "0");
    const d = String(date.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
  };

  // 특정 날짜에 출석 가능한 회원 목록 가져오기
  const getAvailableMembers = (date: Date): Schedule[] => {
    const dateStr = formatDate(date);
    return schedules.filter((schedule) => {
      // 날짜 기반이 우선
      if (schedule.availableDates && schedule.availableDates.length > 0) {
        return schedule.availableDates.includes(dateStr);
      }
      // 요일 기반 (기존 호환성)
      const dayOfWeek = daysOfWeek[date.getDay()];
      return schedule.availableDays?.includes(dayOfWeek) || false;
    });
  };

  // 대한민국 공휴일 확인
  const isHoliday = (date: Date): boolean => {
    const m = date.getMonth() + 1;
    const d = date.getDate();
    
    const fixedHolidays: { [key: string]: number[] } = {
      "1": [1],
      "3": [1],
      "5": [5],
      "6": [6],
      "8": [15],
      "10": [3, 9],
      "12": [25],
    };
    
    return fixedHolidays[m.toString()]?.includes(d) || false;
  };

  const goToPreviousMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const goToNextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  const monthNames = [
    "1월", "2월", "3월", "4월", "5월", "6월",
    "7월", "8월", "9월", "10월", "11월", "12월",
  ];

  // 회원별 색상 매핑 (악기별로 다른 색상)
  const getMemberColor = (memberId: string): string => {
    const member = members.find((m) => m.id === memberId);
    if (!member) return "bg-gray-400";
    
    const colors = [
      "bg-blue-500",
      "bg-green-500",
      "bg-yellow-500",
      "bg-purple-500",
      "bg-pink-500",
      "bg-indigo-500",
      "bg-red-500",
      "bg-teal-500",
      "bg-orange-500",
      "bg-cyan-500",
    ];
    
    const index = members.findIndex((m) => m.id === memberId);
    return colors[index % colors.length];
  };

  return (
    <div className="space-y-4">
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
            <h3 className="text-lg sm:text-xl font-bold text-gray-900 text-center">
              {year}년 {monthNames[month]}
            </h3>
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

      {/* 캘린더 그리드 */}
      <Card className="border-0 shadow-lg overflow-hidden">
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
              const dayOfWeek = date.getDay();
              const isHolidayDate = isHoliday(date);
              const isCurrentMonth = date.getMonth() === month && date.getFullYear() === year;
              const isOtherMonth = !isCurrentMonth;
              const availableMembers = getAvailableMembers(date);
              const memberCount = availableMembers.length;

              return (
                <div
                  key={date.toDateString()}
                  onClick={() => {
                    if (onDateClick && isCurrentMonth) {
                      onDateClick(date);
                    }
                  }}
                  className={cn(
                    "aspect-square rounded-lg sm:rounded-xl border-2 transition-all relative flex flex-col p-1 sm:p-2 group",
                    isCurrentMonth && onDateClick && "cursor-pointer active:scale-95",
                    isToday && !isOtherMonth && "border-blue-500 bg-blue-50 ring-1 sm:ring-2 ring-blue-200",
                    !isToday && isOtherMonth && "bg-gray-50 border-gray-100",
                    !isToday && !isOtherMonth && "bg-white border-gray-200 sm:hover:border-gray-300",
                    dayOfWeek === 0 && !isOtherMonth && "bg-red-50/50",
                    dayOfWeek === 6 && !isOtherMonth && "bg-blue-50/50"
                  )}
                >
                  {/* 날짜 숫자 */}
                  <div className="flex items-center justify-between mb-0.5 sm:mb-1">
                    <span
                      className={cn(
                        "text-xs sm:text-sm font-semibold",
                        isToday && !isOtherMonth && "text-blue-600",
                        isHolidayDate && !isOtherMonth && "text-red-600",
                        isOtherMonth && "text-gray-400",
                        !isToday && !isHolidayDate && !isOtherMonth && "text-gray-900"
                      )}
                    >
                      {date.getDate()}
                    </span>
                    {isToday && !isOtherMonth && (
                      <div className="h-1.5 w-1.5 sm:h-2 sm:w-2 bg-blue-500 rounded-full" />
                    )}
                  </div>

                  {/* 출석 가능한 회원 표시 */}
                  {isCurrentMonth && availableMembers.length > 0 && (
                    <div className="flex-1 flex flex-col gap-1 overflow-y-auto min-h-0">
                      {availableMembers.map((schedule) => {
                        const member = members.find((m) => m.id === schedule.memberId);
                        // member가 없어도 schedule.memberName을 사용
                        const displayName = member?.name || schedule.memberName || "알 수 없음";
                        const instrument = member?.instrument || "";
                        const displayText = instrument ? `${displayName} ${instrument}` : displayName;
                        const dateStr = formatDate(date);
                        const memo = schedule.dateNotes?.[dateStr] || "";
                        return (
                          <div
                            key={schedule.memberId}
                            className={cn(
                              "flex items-center gap-1 px-1.5 py-0.5 rounded text-xs",
                              "bg-white/80 border border-gray-200",
                              "hover:bg-white hover:shadow-sm transition-all"
                            )}
                            title={memo ? `${displayText}: ${memo}` : displayText}
                          >
                            <div
                              className={cn(
                                "h-2 w-2 rounded-full flex-shrink-0",
                                getMemberColor(schedule.memberId)
                              )}
                            />
                            <span className="text-gray-700 font-medium truncate flex-1">
                              {displayText}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* 출석 가능 인원 수 (하단) */}
                  {isCurrentMonth && memberCount > 0 && (
                    <div className="flex items-center justify-center gap-1 mt-auto pt-1 border-t border-gray-100">
                      <Users className="h-3 w-3 text-gray-500" />
                      <span className="text-xs text-gray-600 font-semibold">
                        {memberCount}명
                      </span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

    </div>
  );
}


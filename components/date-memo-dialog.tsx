"use client";

import { useState, useEffect, useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogClose } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Save, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface DateMemoDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  date: Date | null;
  memberName: string;
  currentMemo: string;
  isDateSelected: boolean; // 날짜가 이미 선택되어 있는지 여부
  onSave: (date: Date, memo: string) => any; // 업데이트된 스케줄 배열을 반환
  onSaveComplete?: (updatedSchedules: any[]) => Promise<void>; // 메모 저장 완료 후 호출되는 콜백 (일정 저장용)
  onCancelComplete?: (updatedSchedules: any[]) => Promise<void>; // 일정 취소 완료 후 호출되는 콜백 (일정 저장용)
  onToggleDate?: (date: Date) => any; // 날짜 선택/해제 토글 (업데이트된 스케줄 배열 반환)
}

export function DateMemoDialog({
  open,
  onOpenChange,
  date,
  memberName,
  currentMemo,
  isDateSelected,
  onSave,
  onSaveComplete,
  onCancelComplete,
  onToggleDate,
}: DateMemoDialogProps) {
  const [memo, setMemo] = useState("");
  const initialMemo = useRef<string>("");

  useEffect(() => {
    if (open && date) {
      setMemo(currentMemo || "");
      initialMemo.current = currentMemo || "";
    }
  }, [open, date, currentMemo]);

  // 저장 버튼 클릭 핸들러
  const handleSave = async () => {
    if (date) {
      // 메모 저장 (handleSaveMemo에서 날짜도 자동 선택되고 업데이트된 스케줄 반환)
      const updatedSchedules = onSave(date, memo);
      
      // 메모 저장 후 일정도 저장 (토스트는 부모 컴포넌트에서 표시)
      if (onSaveComplete && updatedSchedules) {
        await onSaveComplete(updatedSchedules);
      }
      onOpenChange(false);
    }
  };

  // 취소 버튼 클릭 핸들러 (저장 안함)
  const handleCancel = () => {
    // 변경사항 롤백
    setMemo(initialMemo.current);
    onOpenChange(false);
  };

  // 일정 취소 버튼 클릭 핸들러
  const handleCancelSchedule = async () => {
    if (date && onToggleDate) {
      // 날짜 선택 해제 (업데이트된 스케줄 반환)
      const updatedSchedules = onToggleDate(date);
      // 일정 취소 후 저장 (토스트는 부모 컴포넌트에서 표시)
      if (onCancelComplete && updatedSchedules) {
        await onCancelComplete(updatedSchedules);
      }
      onOpenChange(false);
    }
  };

  if (!date) return null;

  const dateString = `${date.getFullYear()}년 ${date.getMonth() + 1}월 ${date.getDate()}일`;

  return (
    <Dialog open={open} onOpenChange={handleCancel}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{dateString} 메모</DialogTitle>
          <DialogClose onClose={handleCancel} />
        </DialogHeader>
        <div className="space-y-4">
          <div>
            {isDateSelected ? (
              <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm font-semibold text-blue-900 mb-1">
                  ✓ 출석 가능 날짜로 등록됨
                </p>
                <p className="text-xs text-blue-700">
                  이 날짜는 출석 가능한 날짜로 등록되어 있습니다. 메모를 수정하거나 일정을 취소할 수 있습니다.
                </p>
              </div>
            ) : (
              <div className="mb-4 p-3 bg-gray-50 border border-gray-200 rounded-lg">
                <p className="text-sm font-semibold text-gray-900 mb-1">
                  일정 등록
                </p>
                <p className="text-xs text-gray-700">
                  메모를 작성하고 저장하면 이 날짜가 출석 가능한 날짜로 등록됩니다.
                </p>
              </div>
            )}
            <Textarea
              value={memo}
              onChange={(e) => setMemo(e.target.value)}
              placeholder="예: 20시 이후 가능, 오후 2시부터 가능 등"
              className="min-h-[100px]"
              autoFocus
            />
          </div>
          <div className="flex justify-between items-center">
            {isDateSelected && onToggleDate ? (
              <Button
                variant="outline"
                onClick={handleCancelSchedule}
                className="border-red-300 text-red-600 hover:bg-red-50 hover:border-red-400"
              >
                <X className="h-4 w-4 mr-2" />
                일정 취소
              </Button>
            ) : (
              <div /> // 공간 채우기
            )}
            <div className="flex space-x-2">
              <Button
                variant="outline"
                onClick={handleCancel}
              >
                닫기
              </Button>
              <Button
                onClick={handleSave}
                className="bg-gray-900 hover:bg-gray-800 text-white"
              >
                <Save className="h-4 w-4 mr-2" />
                저장
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}


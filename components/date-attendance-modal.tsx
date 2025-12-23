"use client";

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogClose } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { X, FileText } from "lucide-react";
import { cn } from "@/lib/utils";

interface Member {
  id: string;
  name: string;
  instrument?: string;
  part?: string;
}

interface AttendanceMember {
  memberId: string;
  memberName: string;
  memo?: string;
  instrument?: string;
  part?: string;
}

interface DateAttendanceModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  date: Date | null;
  members: AttendanceMember[];
}

export function DateAttendanceModal({
  open,
  onOpenChange,
  date,
  members,
}: DateAttendanceModalProps) {
  if (!date) return null;

  const dateString = `${date.getFullYear()}년 ${date.getMonth() + 1}월 ${date.getDate()}일`;
  const dayOfWeek = ["일", "월", "화", "수", "목", "금", "토"][date.getDay()];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {dateString} ({dayOfWeek}요일) 출석 가능 인원
          </DialogTitle>
          <DialogClose onClose={() => onOpenChange(false)} />
        </DialogHeader>
        <div className="space-y-3">
          {members.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <p className="text-sm">출석 가능한 인원이 없습니다.</p>
            </div>
          ) : (
            <>
              <div className="text-sm text-gray-600 mb-4">
                총 <span className="font-semibold text-gray-900">{members.length}명</span>이 출석 가능합니다.
              </div>
              <div className="space-y-2">
                {members.map((member) => (
                  <div
                    key={member.memberId}
                    className="p-3 rounded-lg border border-gray-200 bg-gray-50 hover:bg-gray-100 transition-colors"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-2 mb-1">
                          <span className="font-semibold text-gray-900 text-sm">
                            {member.memberName}
                          </span>
                          {member.instrument && (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                              {member.instrument}
                            </span>
                          )}
                        </div>
                        {member.part && (
                          <p className="text-xs text-gray-600 mb-1">{member.part}</p>
                        )}
                        {member.memo && (
                          <div className="flex items-start space-x-1.5 mt-2">
                            <FileText className="h-3 w-3 text-gray-400 mt-0.5 flex-shrink-0" />
                            <p className="text-xs text-gray-700 flex-1">{member.memo}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
          <div className="pt-4 border-t">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="w-full"
            >
              닫기
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}


"use client";

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogClose } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2 } from "lucide-react";

interface Member {
  id?: string;
  name: string;
  instrument: string;
  part?: string;
  remarks?: string;
}

interface Instrument {
  id: string;
  name: string;
  english: string;
  abbreviation: string;
}

interface MemberDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  member?: Member | null;
  onSave: (member: { id?: string; name: string; instrument: string; part?: string; remarks?: string }) => Promise<void>;
}

export function MemberDialog({ open, onOpenChange, member, onSave }: MemberDialogProps) {
  const [name, setName] = useState("");
  const [instrument, setInstrument] = useState("");
  const [part, setPart] = useState("");
  const [remarks, setRemarks] = useState("");
  const [instruments, setInstruments] = useState<Instrument[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingInstruments, setLoadingInstruments] = useState(true);

  useEffect(() => {
    if (open) {
      loadInstruments();
      if (member) {
        setName(member.name || "");
        setInstrument(member.instrument || "");
        setPart(member.part || "");
        setRemarks(member.remarks || "");
      } else {
        setName("");
        setInstrument("");
        setPart("");
        setRemarks("");
      }
    }
  }, [open, member]);

  const loadInstruments = async () => {
    try {
      const response = await fetch("/api/instruments");
      const data = await response.json();
      setInstruments(data.instruments || []);
    } catch (error) {
      console.error("Failed to load instruments:", error);
    } finally {
      setLoadingInstruments(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!member?.id) {
      alert("사용자 ID가 필요합니다. Firebase Auth로 먼저 가입해야 합니다.");
      return;
    }
    if (!name.trim() || !instrument.trim()) {
      alert("이름과 악기는 필수 입력 항목입니다.");
      return;
    }

    setLoading(true);
    try {
      await onSave({
        id: member.id,
        name: name.trim(),
        instrument: instrument.trim(),
        part: part.trim() || undefined,
        remarks: remarks.trim() || undefined,
      });
      onOpenChange(false);
    } catch (error) {
      console.error("Failed to save member:", error);
      // 에러는 onSave에서 토스트로 표시되므로 여기서는 로그만
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>회원 정보 수정</DialogTitle>
          <DialogClose onClose={() => onOpenChange(false)} />
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="name">이름 *</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              placeholder="이름을 입력하세요"
            />
          </div>

          <div>
            <Label htmlFor="instrument">악기 *</Label>
            {loadingInstruments ? (
              <div className="flex items-center justify-center py-2">
                <Loader2 className="h-4 w-4 animate-spin text-gray-400" />
              </div>
            ) : (
              <Select value={instrument} onValueChange={setInstrument} required>
                <SelectTrigger>
                  <SelectValue placeholder="악기를 선택하세요" />
                </SelectTrigger>
                <SelectContent>
                  {instruments.map((inst) => (
                    <SelectItem key={inst.id} value={inst.abbreviation}>
                      {inst.name} ({inst.abbreviation})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>

          <div>
            <Label htmlFor="part">파트</Label>
            <Input
              id="part"
              value={part}
              onChange={(e) => setPart(e.target.value)}
              placeholder="파트를 입력하세요 (선택사항)"
            />
          </div>

          <div>
            <Label htmlFor="remarks">비고</Label>
            <Textarea
              id="remarks"
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              placeholder="비고를 입력하세요 (선택사항)"
              className="min-h-[100px]"
            />
          </div>

          <div className="flex justify-end space-x-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              취소
            </Button>
            <Button
              type="submit"
              disabled={loading || !name.trim() || !instrument.trim()}
              className="bg-gray-900 hover:bg-gray-800 text-white"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  저장 중...
                </>
              ) : (
                "저장"
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}


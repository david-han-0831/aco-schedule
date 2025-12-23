import { NextRequest, NextResponse } from "next/server";
import { getSchedules, createOrUpdateSchedule } from "@/lib/firestore";

// GET: 일정 데이터 조회
export async function GET() {
  try {
    const schedules = await getSchedules();
    return NextResponse.json({ 
      schedules,
      currentWeek: new Date().toISOString().split("T")[0]
    });
  } catch (error) {
    console.error("Error fetching schedules:", error);
    return NextResponse.json(
      { error: "Failed to fetch schedules" },
      { status: 500 }
    );
  }
}

// POST/PUT: 일정 데이터 업데이트
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { schedules } = body;

    if (!schedules || !Array.isArray(schedules)) {
      return NextResponse.json(
        { error: "Schedules array is required" },
        { status: 400 }
      );
    }

    // Firestore에 저장할 데이터 형식으로 변환
    const schedulesToSave = schedules.map((schedule: any) => ({
      memberId: schedule.memberId.toString(),
      memberName: schedule.memberName,
      availableDays: schedule.availableDays || [],
      availableDates: schedule.availableDates || [],
      dateNotes: schedule.dateNotes || {},
      weekStartDate: schedule.weekStartDate || new Date().toISOString().split("T")[0],
    }));

    // 각 일정을 개별적으로 저장 (createOrUpdateSchedule 사용)
    for (const schedule of schedulesToSave) {
      await createOrUpdateSchedule(schedule);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error updating schedules:", error);
    return NextResponse.json(
      { error: "Failed to update schedules" },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  return POST(request);
}

import { NextResponse } from "next/server";
import { getMembers, getInstruments, getSchedules, createMember, createInstrument, createOrUpdateSchedule } from "@/lib/firestore";
import fs from "fs";
import path from "path";

// GET: 마이그레이션 상태 확인
export async function GET() {
  try {
    const [members, instruments, schedules] = await Promise.all([
      getMembers(),
      getInstruments(),
      getSchedules(),
    ]);

    return NextResponse.json({
      firestore: {
        members: members.length,
        instruments: instruments.length,
        schedules: schedules.length,
      },
    });
  } catch (error) {
    console.error("Error checking migration status:", error);
    return NextResponse.json(
      { error: "Failed to check migration status" },
      { status: 500 }
    );
  }
}

// POST: JSON 파일 데이터를 Firestore로 마이그레이션
export async function POST() {
  try {
    const dataDir = path.join(process.cwd(), "data");
    const results = {
      members: 0,
      instruments: 0,
      schedules: 0,
      errors: [] as string[],
    };

    // Members 마이그레이션
    const membersPath = path.join(dataDir, "members.json");
    if (fs.existsSync(membersPath)) {
      const membersData = JSON.parse(fs.readFileSync(membersPath, "utf8"));
      
      // 기존 데이터 확인
      const existingMembers = await getMembers();
      if (existingMembers.length > 0) {
        results.errors.push("Members already exist in Firestore. Skipping members migration.");
      } else {
        for (const member of membersData.members) {
          try {
            await createMember({
              name: member.name,
              instrument: member.instrument,
              part: member.part || "",
              remarks: member.remarks || "",
            });
            results.members++;
          } catch (error) {
            results.errors.push(`Failed to migrate member ${member.name}: ${error}`);
          }
        }
      }
    }

    // Instruments 마이그레이션
    const instrumentsPath = path.join(dataDir, "instruments.json");
    if (fs.existsSync(instrumentsPath)) {
      const instrumentsData = JSON.parse(fs.readFileSync(instrumentsPath, "utf8"));
      
      // 기존 데이터 확인
      const existingInstruments = await getInstruments();
      if (existingInstruments.length > 0) {
        results.errors.push("Instruments already exist in Firestore. Skipping instruments migration.");
      } else {
        for (const instrument of instrumentsData.instruments) {
          try {
            await createInstrument({
              name: instrument.name,
              english: instrument.english,
              abbreviation: instrument.abbreviation,
            });
            results.instruments++;
          } catch (error) {
            results.errors.push(`Failed to migrate instrument ${instrument.name}: ${error}`);
          }
        }
      }
    }

    // Schedules 마이그레이션
    const schedulesPath = path.join(dataDir, "schedules.json");
    if (fs.existsSync(schedulesPath)) {
      const schedulesData = JSON.parse(fs.readFileSync(schedulesPath, "utf8"));
      
      // 기존 데이터 확인
      const existingSchedules = await getSchedules();
      if (existingSchedules.length > 0) {
        results.errors.push("Schedules already exist in Firestore. Skipping schedules migration.");
      } else {
        // Members를 먼저 로드
        const members = await getMembers();
        const memberMap = new Map(members.map((m) => [m.name, m.id]));

        for (const schedule of schedulesData.schedules) {
          try {
            const memberId = memberMap.get(schedule.memberName);
            if (memberId) {
              await createOrUpdateSchedule({
                memberId: memberId,
                memberName: schedule.memberName,
                availableDays: schedule.availableDays || [],
                weekStartDate: schedule.weekStartDate || new Date().toISOString().split("T")[0],
              });
              results.schedules++;
            } else {
              results.errors.push(`Member not found for schedule: ${schedule.memberName}`);
            }
          } catch (error) {
            results.errors.push(`Failed to migrate schedule ${schedule.memberName}: ${error}`);
          }
        }
      }
    }

    return NextResponse.json({
      success: true,
      results,
    });
  } catch (error) {
    console.error("Migration error:", error);
    return NextResponse.json(
      { error: "Migration failed", details: String(error) },
      { status: 500 }
    );
  }
}


import { NextRequest, NextResponse } from "next/server";
import { getMembers, createMember, updateMember, deleteMember } from "@/lib/firestore";

// GET: 회원 목록 조회
export async function GET() {
  try {
    const members = await getMembers();
    return NextResponse.json({ members });
  } catch (error) {
    console.error("Error fetching members:", error);
    return NextResponse.json(
      { error: "Failed to fetch members" },
      { status: 500 }
    );
  }
}

// POST: 회원 생성
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, instrument, part, remarks } = body;

    if (!name || !instrument) {
      return NextResponse.json(
        { error: "Name and instrument are required" },
        { status: 400 }
      );
    }

    const id = await createMember({
      name,
      instrument,
      part: part || "",
      remarks: remarks || "",
    });

    return NextResponse.json({ success: true, id });
  } catch (error) {
    console.error("Error creating member:", error);
    return NextResponse.json(
      { error: "Failed to create member" },
      { status: 500 }
    );
  }
}

// PUT: 회원 수정
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, name, instrument, part, remarks } = body;

    if (!id) {
      return NextResponse.json(
        { error: "Member ID is required" },
        { status: 400 }
      );
    }

    await updateMember(id, {
      name,
      instrument,
      part,
      remarks,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error updating member:", error);
    return NextResponse.json(
      { error: "Failed to update member" },
      { status: 500 }
    );
  }
}

// DELETE: 회원 삭제
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { error: "Member ID is required" },
        { status: 400 }
      );
    }

    await deleteMember(id);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting member:", error);
    return NextResponse.json(
      { error: "Failed to delete member" },
      { status: 500 }
    );
  }
}

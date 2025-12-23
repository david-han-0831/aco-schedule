import { NextRequest, NextResponse } from "next/server";
import {
  getAllUsers,
  getUserProfile,
  updateUserRole,
  updateUserProfile,
  UserRole,
} from "@/lib/firestore";

// GET: 모든 사용자 목록 조회 (회원 정보 포함)
export async function GET(request: NextRequest) {
  try {
    const users = await getAllUsers();
    return NextResponse.json({ users });
  } catch (error) {
    console.error("Error fetching users:", error);
    return NextResponse.json(
      { message: "Failed to fetch users" },
      { status: 500 }
    );
  }
}

// POST: 사용자 프로필 업데이트 (악기, 파트, 비고 등)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { uid, displayName, name, instrument, part, remarks } = body;

    if (!uid) {
      return NextResponse.json(
        { message: "uid is required", error: "uid is required" },
        { status: 400 }
      );
    }

    await updateUserProfile(uid, {
      displayName,
      name,
      instrument,
      part,
      remarks,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error updating user profile:", error);
    const errorMessage = error instanceof Error ? error.message : "Failed to update user profile";
    return NextResponse.json(
      { message: errorMessage, error: errorMessage },
      { status: 500 }
    );
  }
}

// PUT: 사용자 프로필 업데이트 (POST와 동일)
export async function PUT(request: NextRequest) {
  return POST(request);
}

// PATCH: 사용자 역할 업데이트 (SuperAdmin만)
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { uid, role } = body;

    if (!uid || !role) {
      return NextResponse.json(
        { message: "uid and role are required" },
        { status: 400 }
      );
    }

    if (!["SuperAdmin", "Admin", "User"].includes(role)) {
      return NextResponse.json(
        { message: "Invalid role" },
        { status: 400 }
      );
    }

    await updateUserRole(uid, role as UserRole);
    return NextResponse.json({ message: "User role updated successfully" });
  } catch (error) {
    console.error("Error updating user role:", error);
    return NextResponse.json(
      { message: "Failed to update user role" },
      { status: 500 }
    );
  }
}


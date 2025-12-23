"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Search, Edit, Trash2, Users, Shield } from "lucide-react";
import { useToast } from "@/components/ui/toast";
import { useAuth } from "@/contexts/AuthContext";
import { canAccessMembers, canManageRoles } from "@/lib/permissions";
import { UserRole } from "@/lib/firestore";
import { MemberDialog } from "@/components/member-dialog";

interface UserProfile {
  id: string;
  email: string;
  displayName?: string;
  role: UserRole;
  instrument?: string;
  part?: string;
  remarks?: string;
}

export default function MembersPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"members" | "users">("members");
  const [memberDialogOpen, setMemberDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<UserProfile | null>(null);
  const { addToast } = useToast();
  const { user, userProfile, loading: authLoading } = useAuth();
  const router = useRouter();

  // 접근 권한 체크
  useEffect(() => {
    if (!authLoading) {
      if (!user) {
        router.push("/login");
        return;
      }
      if (!canAccessMembers(userProfile?.role || null)) {
        addToast("회원 관리 페이지에 접근할 권한이 없습니다.", "error", 3000);
        router.push("/");
        return;
      }
    }
  }, [user, userProfile, authLoading, router, addToast]);

  useEffect(() => {
    loadUsers();
  }, [userProfile]);

  const loadUsers = async () => {
    try {
      const response = await fetch("/api/users");
      const data = await response.json();
      setUsers(data.users || []);
    } catch (error) {
      console.error("Failed to load users:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleRoleChange = async (uid: string, newRole: UserRole) => {
    try {
      const response = await fetch("/api/users", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ uid, role: newRole }),
      });

      if (response.ok) {
        await loadUsers();
        addToast("사용자 역할이 변경되었습니다", "success", 3000);
      } else {
        throw new Error("Failed to update role");
      }
    } catch (error) {
      console.error("Failed to update user role:", error);
      addToast("역할 변경에 실패했습니다", "error", 4000);
    }
  };

  const handleEdit = (user: UserProfile) => {
    setEditingUser(user);
    setMemberDialogOpen(true);
  };

  const handleSave = async (userData: { id?: string; name: string; instrument: string; part?: string; remarks?: string }) => {
    try {
      if (!userData.id) {
        addToast("사용자 ID가 필요합니다. Firebase Auth로 먼저 가입해야 합니다.", "error", 4000);
        return;
      }

      const response = await fetch("/api/users", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          uid: userData.id,
          name: userData.name,
          instrument: userData.instrument,
          part: userData.part || "",
          remarks: userData.remarks || "",
        }),
      });

      const data = await response.json();

      if (response.ok) {
        await loadUsers();
        addToast("회원 정보가 수정되었습니다", "success", 3000);
      } else {
        const errorMessage = data.message || data.error || "회원 정보 저장에 실패했습니다";
        console.error("Failed to update user:", errorMessage);
        addToast(errorMessage, "error", 4000);
        throw new Error(errorMessage);
      }
    } catch (error) {
      console.error("Failed to save user:", error);
      const errorMessage = error instanceof Error ? error.message : "회원 정보 저장에 실패했습니다";
      addToast(errorMessage, "error", 4000);
      throw error;
    }
  };

  // 회원 삭제는 Firebase Auth에서 사용자를 삭제해야 하므로 제거
  // 대신 악기/파트/비고 정보만 초기화할 수 있도록 함

  const filteredUsers = users.filter(
    (user) =>
      (user.displayName || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      (user.instrument || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading || authLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-gray-500">로딩 중...</div>
      </div>
    );
  }

  const isSuperAdmin = canManageRoles(userProfile?.role || null);

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-0">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">회원 관리</h1>
          <p className="text-sm sm:text-base text-gray-600 mt-1 sm:mt-2">구성원 정보를 관리하세요</p>
        </div>
        {activeTab === "members" && (
          <p className="text-xs sm:text-sm text-gray-500">
            회원은 Firebase Auth로 가입한 후 여기서 악기 정보를 설정할 수 있습니다.
          </p>
        )}
      </div>

      {/* 탭 메뉴 */}
      {isSuperAdmin && (
        <div className="flex space-x-2 border-b border-gray-200">
          <button
            onClick={() => setActiveTab("members")}
            className={`px-4 py-2 font-medium text-sm transition-colors ${
              activeTab === "members"
                ? "text-gray-900 border-b-2 border-gray-900"
                : "text-gray-600 hover:text-gray-900"
            }`}
          >
            <Users className="h-4 w-4 inline mr-2" />
            구성원 목록
          </button>
          <button
            onClick={() => setActiveTab("users")}
            className={`px-4 py-2 font-medium text-sm transition-colors ${
              activeTab === "users"
                ? "text-gray-900 border-b-2 border-gray-900"
                : "text-gray-600 hover:text-gray-900"
            }`}
          >
            <Shield className="h-4 w-4 inline mr-2" />
            사용자 역할 관리
          </button>
        </div>
      )}

      {/* 구성원 목록 */}
      {activeTab === "members" && (

      <Card className="border-0 shadow-md">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>구성원 목록</CardTitle>
              <CardDescription>총 {filteredUsers.length}명</CardDescription>
            </div>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="이름, 악기 또는 이메일로 검색..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">No.</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">이름</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">이메일</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">악기</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">파트</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">비고</th>
                  <th className="text-right py-3 px-4 font-semibold text-gray-700">액션</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map((user, index) => (
                  <tr
                    key={user.id}
                    className="border-b border-gray-100 hover:bg-gray-50 transition-colors"
                  >
                    <td className="py-4 px-4 text-gray-600">{index + 1}</td>
                    <td className="py-4 px-4 font-medium text-gray-900">{user.displayName || "-"}</td>
                    <td className="py-4 px-4 text-gray-600 text-sm">{user.email}</td>
                    <td className="py-4 px-4">
                      {user.instrument ? (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          {user.instrument}
                        </span>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </td>
                    <td className="py-4 px-4 text-gray-600">
                      {user.part || <span className="text-gray-400">-</span>}
                    </td>
                    <td className="py-4 px-4 text-gray-500 text-sm">
                      {user.remarks || <span className="text-gray-400">-</span>}
                    </td>
                    <td className="py-4 px-4">
                      <div className="flex items-center justify-end space-x-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-gray-600 hover:text-gray-900"
                          onClick={() => handleEdit(user)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
      )}

      {/* 사용자 역할 관리 */}
      {activeTab === "users" && isSuperAdmin && (
        <Card className="border-0 shadow-md">
          <CardHeader>
            <div>
              <CardTitle>사용자 역할 관리</CardTitle>
              <CardDescription>사용자의 역할을 변경할 수 있습니다 (SuperAdmin만 가능)</CardDescription>
            </div>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">이메일</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">이름</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">현재 역할</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">역할 변경</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((userProfile) => (
                    <tr
                      key={userProfile.id}
                      className="border-b border-gray-100 hover:bg-gray-50 transition-colors"
                    >
                      <td className="py-4 px-4 font-medium text-gray-900">{userProfile.email}</td>
                      <td className="py-4 px-4 text-gray-600">
                        {userProfile.displayName || <span className="text-gray-400">-</span>}
                      </td>
                      <td className="py-4 px-4">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            userProfile.role === "SuperAdmin"
                              ? "bg-purple-100 text-purple-800"
                              : userProfile.role === "Admin"
                              ? "bg-blue-100 text-blue-800"
                              : "bg-gray-100 text-gray-800"
                          }`}
                        >
                          {userProfile.role}
                        </span>
                      </td>
                      <td className="py-4 px-4">
                        <select
                          value={userProfile.role}
                          onChange={(e) =>
                            handleRoleChange(userProfile.id, e.target.value as UserRole)
                          }
                          disabled={userProfile.id === user?.uid} // 본인은 변경 불가
                          className="px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <option value="User">User</option>
                          <option value="Admin">Admin</option>
                          <option value="SuperAdmin">SuperAdmin</option>
                        </select>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* 회원 정보 수정 다이얼로그 */}
      {editingUser && (
        <MemberDialog
          open={memberDialogOpen}
          onOpenChange={setMemberDialogOpen}
          member={{
            id: editingUser.id,
            name: editingUser.displayName || "",
            instrument: editingUser.instrument || "",
            part: editingUser.part || "",
            remarks: editingUser.remarks || "",
          }}
          onSave={handleSave}
        />
      )}
    </div>
  );
}

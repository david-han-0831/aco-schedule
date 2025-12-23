"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { LayoutDashboard, Users, Calendar, Database, LogOut, User, Menu, X } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { canAccessMembers } from "@/lib/permissions";

const navigationItems = [
  {
    name: "대시보드",
    href: "/",
    icon: LayoutDashboard,
  },
  {
    name: "회원 관리",
    href: "/members",
    icon: Users,
  },
  {
    name: "연습일정",
    href: "/schedules",
    icon: Calendar,
  },
  {
    name: "데이터 마이그레이션",
    href: "/migrate",
    icon: Database,
  },
];

export function Navigation() {
  const pathname = usePathname();
  const { user, userProfile, logout, loading } = useAuth();
  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    router.push("/login");
  };

  if (loading) {
    return null;
  }

  if (!user && pathname !== "/login" && pathname !== "/setup-profile") {
    router.push("/login");
    return null;
  }

  // 로그인했지만 프로필이 없거나 name이 없으면 프로필 설정 페이지로
  if (user && pathname !== "/login" && pathname !== "/setup-profile") {
    if (!userProfile || !userProfile.name) {
      router.push("/setup-profile");
      return null;
    }
  }

  const filteredNavigationItems = navigationItems.filter((item) => {
    // 회원 관리 링크는 Admin, SuperAdmin만 표시
    if (item.href === "/members") {
      return canAccessMembers(userProfile?.role || null);
    }
    // 데이터 마이그레이션 링크는 SuperAdmin만 표시
    if (item.href === "/migrate") {
      return userProfile?.role === "SuperAdmin";
    }
    return true;
  });

  return (
    <nav className="sticky top-0 z-50 border-b bg-white/80 backdrop-blur-sm shadow-sm">
      <div className="container mx-auto px-2 sm:px-4">
        <div className="flex h-14 sm:h-16 items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="flex h-7 w-7 sm:h-8 sm:w-8 items-center justify-center rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 text-white font-bold text-xs sm:text-sm">
              ACO
            </div>
            <span className="text-base sm:text-lg font-semibold text-gray-900">
              <span className="hidden sm:inline">안양시민오케스트라</span>
              <span className="sm:hidden">ACO</span>
            </span>
          </div>
          
          {/* 데스크톱 메뉴 */}
          <div className="hidden md:flex items-center space-x-4">
            {user && (
              <>
                <div className="flex items-center space-x-1">
                  {filteredNavigationItems.map((item) => {
                    const Icon = item.icon;
                    const isActive = pathname === item.href;
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        className={cn(
                          "flex items-center space-x-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors",
                          isActive
                            ? "bg-gray-100 text-gray-900"
                            : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                        )}
                      >
                        <Icon className="h-4 w-4" />
                        <span>{item.name}</span>
                      </Link>
                    );
                  })}
                </div>
                <div className="flex items-center space-x-2 border-l pl-4">
                  <div className="flex items-center space-x-2 text-sm text-gray-600">
                    <User className="h-4 w-4" />
                    <span className="max-w-[120px] truncate">{userProfile?.name || user.displayName || user.email}</span>
                    {userProfile?.role && (
                      <span
                        className={cn(
                          "px-2 py-0.5 rounded-full text-xs font-medium hidden lg:inline-block",
                          userProfile.role === "SuperAdmin"
                            ? "bg-purple-100 text-purple-800"
                            : userProfile.role === "Admin"
                            ? "bg-blue-100 text-blue-800"
                            : "bg-gray-100 text-gray-800"
                        )}
                      >
                        {userProfile.role}
                      </span>
                    )}
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleLogout}
                    className="text-gray-600 hover:text-gray-900"
                  >
                    <LogOut className="h-4 w-4 sm:mr-2" />
                    <span className="hidden sm:inline">로그아웃</span>
                  </Button>
                </div>
              </>
            )}
          </div>

          {/* 모바일 메뉴 버튼 */}
          {user && (
            <div className="md:hidden flex items-center space-x-2">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="h-9 w-9"
              >
                {mobileMenuOpen ? (
                  <X className="h-5 w-5" />
                ) : (
                  <Menu className="h-5 w-5" />
                )}
              </Button>
            </div>
          )}
        </div>

        {/* 모바일 메뉴 */}
        {user && mobileMenuOpen && (
          <div className="md:hidden border-t bg-white">
            <div className="px-2 py-3 space-y-1">
              {filteredNavigationItems.map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className={cn(
                      "flex items-center space-x-3 rounded-lg px-4 py-3 text-sm font-medium transition-colors",
                      isActive
                        ? "bg-gray-100 text-gray-900"
                        : "text-gray-600 hover:bg-gray-50"
                    )}
                  >
                    <Icon className="h-5 w-5" />
                    <span>{item.name}</span>
                  </Link>
                );
              })}
              <div className="border-t pt-3 mt-3 space-y-2">
                <div className="flex items-center space-x-2 px-4 py-2 text-sm text-gray-600">
                  <User className="h-4 w-4" />
                  <span className="flex-1 truncate">{userProfile?.name || user.displayName || user.email}</span>
                  {userProfile?.role && (
                    <span
                      className={cn(
                        "px-2 py-0.5 rounded-full text-xs font-medium",
                        userProfile.role === "SuperAdmin"
                          ? "bg-purple-100 text-purple-800"
                          : userProfile.role === "Admin"
                          ? "bg-blue-100 text-blue-800"
                          : "bg-gray-100 text-gray-800"
                      )}
                    >
                      {userProfile.role}
                    </span>
                  )}
                </div>
                <Button
                  variant="ghost"
                  onClick={() => {
                    handleLogout();
                    setMobileMenuOpen(false);
                  }}
                  className="w-full justify-start text-gray-600 hover:text-gray-900"
                >
                  <LogOut className="h-4 w-4 mr-2" />
                  로그아웃
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}


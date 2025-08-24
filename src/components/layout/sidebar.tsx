"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Package, 
  ShoppingCart, 
  BarChart3, 
  Users, 
  Settings, 
  Bell,
  Home,
  FileText,
  Truck,
  AlertTriangle,
  ChevronDown,
  ChevronRight,
  Minus,
  Plus,
  TrendingUp,
  PieChart as PieChartIcon,
  Layers,
  Box,
  MapPin
} from "lucide-react";
import { 
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useI18n } from "@/lib/i18n/context";
import { useTheme } from "@/lib/theme/context";
import { useSidebar } from "@/lib/sidebar/context";
import Link from "next/link";
import { usePathname } from "next/navigation";

interface NavigationItem {
  name: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: number;
  adminOnly?: boolean;
  children?: NavigationItem[];
  group?: string;
}

interface SidebarProps {
  className?: string;
}

export function Sidebar({ className }: SidebarProps) {
  const { t } = useI18n();
  const { resolvedTheme } = useTheme();
  const { isCollapsed, isMobileOpen, toggleCollapse, toggleMobile, closeMobile, expandedItems, toggleExpanded } = useSidebar();
  const pathname = usePathname();
  
  // Mock user role - in real app this would come from auth context
  const userRole = "admin";

  const navigation: NavigationItem[] = [
    { 
      name: t('nav.dashboard'), 
      href: "/app-dashboard", 
      icon: Home,
      group: "main"
    },
    { 
      name: t('nav.products'), 
      href: "/products", 
      icon: Package,
      group: "inventory"
    },
    { 
      name: "Locations", 
      href: "/locations", 
      icon: MapPin,
      group: "inventory"
    },
    { 
      name: t('nav.stock'), 
      href: "/stock", 
      icon: Package,
      group: "inventory"
    },
    { 
      name: t('nav.batches'), 
      href: "/batches", 
      icon: Layers,
      group: "inventory"
    },
    { 
      name: t('nav.transfers'), 
      href: "/transfers", 
      icon: Truck,
      group: "inventory"
    },
    { 
      name: t('nav.transactions'), 
      href: "/transactions", 
      icon: ShoppingCart,
      group: "sales"
    },
    { 
      name: t('common.customers'), 
      href: "/customers", 
      icon: Users,
      group: "sales"
    },
    { 
      name: "Advanced Analytics", 
      href: "/analytics", 
      icon: TrendingUp,
      group: "analytics"
    },
    { 
      name: t('nav.reports'), 
      href: "/reports", 
      icon: BarChart3,
      group: "analytics"
    },
    { 
      name: t('nav.alerts'), 
      href: "/alerts", 
      icon: AlertTriangle, 
      badge: 3,
      group: "notifications"
    },
    { 
      name: t('nav.users'), 
      href: "/users", 
      icon: Users, 
      adminOnly: true,
      group: "admin"
    },
    { 
      name: t('nav.settings'), 
      href: "/settings", 
      icon: Settings,
      group: "admin"
    },
  ];

  const filteredNavigation = navigation.filter(item => 
    !item.adminOnly || userRole === "admin"
  );

  // Group navigation items
  const groupedNavigation = filteredNavigation.reduce((acc, item) => {
    if (!acc[item.group!]) {
      acc[item.group!] = [];
    }
    acc[item.group!].push(item);
    return acc;
  }, {} as Record<string, NavigationItem[]>);

  const groupLabels = {
    main: t('nav.groups.main'),
    inventory: t('nav.groups.inventory'),
    sales: t('nav.groups.sales'),
    analytics: t('nav.groups.analytics'),
    notifications: t('nav.groups.notifications'),
    admin: t('nav.groups.admin'),
  };

  const NavigationItemComponent = ({ item, level = 0 }: { item: NavigationItem; level?: number }) => {
    const Icon = item.icon;
    const isActive = pathname === item.href;
    const hasChildren = item.children && item.children.length > 0;
    const isExpanded = expandedItems.includes(item.name);

    if (hasChildren) {
      return (
        <div className="space-y-1">
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                onClick={() => toggleExpanded(item.name)}
                className={cn(
                  "flex items-center w-full px-3 py-2 text-sm font-medium rounded-md transition-colors",
                  level > 0 && "ml-4",
                  isExpanded
                    ? resolvedTheme === 'dark'
                      ? "bg-gray-800 text-white"
                      : "bg-gray-100 text-gray-900"
                    : resolvedTheme === 'dark'
                      ? "text-gray-300 hover:bg-gray-800 hover:text-white"
                      : "text-gray-700 hover:bg-gray-100 hover:text-gray-900"
                )}
              >
                <Icon className={cn("w-4 h-4 text-yellow-600", level === 0 && !isCollapsed ? "mr-3" : "")} />
                {!isCollapsed && (
                  <>
                    <span className="flex-1 text-left">{item.name}</span>
                    {isExpanded ? (
                      <ChevronDown className="w-4 h-4 text-yellow-600" />
                    ) : (
                      <ChevronRight className="w-4 h-4 text-yellow-600" />
                    )}
                  </>
                )}
              </button>
            </TooltipTrigger>
            {isCollapsed && (
              <TooltipContent side="right" className="hidden lg:block">
                <p>{item.name}</p>
              </TooltipContent>
            )}
          </Tooltip>
          
          {isExpanded && !isCollapsed && (
            <div className="space-y-1">
              {item.children.map((child) => (
                <NavigationItemComponent key={child.name} item={child} level={level + 1} />
              ))}
            </div>
          )}
        </div>
      );
    }

    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <Link
            key={item.name}
            href={item.href}
            className={cn(
              "flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors",
              level > 0 && "ml-4",
              isActive
                ? resolvedTheme === 'dark'
                  ? "bg-gray-800 text-white"
                  : "bg-gray-100 text-gray-900"
                : resolvedTheme === 'dark'
                  ? "text-gray-300 hover:bg-gray-800 hover:text-white"
                  : "text-gray-700 hover:bg-gray-100 hover:text-gray-900"
            )}
            onClick={() => {
              // Only close mobile sidebar, let Next.js handle navigation naturally
              closeMobile();
            }}
          >
            <Icon className={cn("w-4 h-4", level === 0 && !isCollapsed ? "mr-3" : "")} />
            {!isCollapsed && (
              <>
                <span className="flex-1">{item.name}</span>
                {item.badge && (
                  <Badge variant="destructive" className="ml-auto">
                    {item.badge}
                  </Badge>
                )}
              </>
            )}
          </Link>
        </TooltipTrigger>
        {isCollapsed && (
          <TooltipContent side="right" className="hidden lg:block">
            <p>{item.name}</p>
          </TooltipContent>
        )}
      </Tooltip>
    );
  };

  const SidebarContent = () => (
    <TooltipProvider>
      <div className="flex flex-col h-full">
        {/* Header with collapse button */}
        <div className="flex flex-col space-y-2 h-auto px-4 border-b pb-3">
          <div className="flex items-center justify-between h-12">
            {!isCollapsed && (
              <h1 className="text-xl font-bold">Stock Pro</h1>
            )}
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={toggleCollapse}
                  className="hidden lg:flex"
                >
                  {isCollapsed ? (
                    <Plus className="w-4 h-4 text-yellow-600" />
                  ) : (
                    <Minus className="w-4 h-4 text-yellow-600" />
                  )}
                </Button>
              </TooltipTrigger>
              <TooltipContent side="right" className="hidden lg:block">
                <p>{isCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}</p>
              </TooltipContent>
            </Tooltip>
          </div>
        </div>
        
        {/* Navigation */}
        <nav className="flex-1 px-3 py-4 space-y-4 overflow-y-auto">
          {Object.entries(groupedNavigation).map(([group, items]) => (
            <div key={group} className="space-y-1">
              {!isCollapsed && (
                <h4 className="px-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  {groupLabels[group as keyof typeof groupLabels]}
                </h4>
              )}
              {items.map((item) => (
                <NavigationItemComponent key={item.name} item={item} />
              ))}
            </div>
          ))}
        </nav>
        
        {/* User Info Section */}
        {!isCollapsed && (
          <div className="p-4 border-t">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center">
                <span className="text-sm font-medium">JD</span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">John Doe</p>
                <p className="text-xs text-gray-500 truncate">john.doe@example.com</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </TooltipProvider>
  );

  const MobileSidebarContent = () => (
    <div className="flex flex-col h-full">
      {/* Header with close button */}
      <div className="flex flex-col space-y-2 h-auto px-4 border-b pb-3">
        <div className="flex items-center justify-between h-12">
          <h1 className="text-xl font-bold">Stock Pro</h1>
          <Button
            variant="ghost"
            size="sm"
            onClick={toggleMobile}
          >
            <Minus className="w-4 h-4 text-yellow-600" />
          </Button>
        </div>
        </div>
      
      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-4 overflow-y-auto">
        {Object.entries(groupedNavigation).map(([group, items]) => (
          <div key={group} className="space-y-1">
            <h4 className="px-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
              {groupLabels[group as keyof typeof groupLabels]}
            </h4>
            {items.map((item) => (
              <MobileNavigationItemComponent key={item.name} item={item} />
            ))}
          </div>
        ))}
      </nav>
      
      {/* User Info Section */}
      <div className="p-4 border-t">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center">
            <span className="text-sm font-medium">JD</span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">John Doe</p>
            <p className="text-xs text-gray-500 truncate">john.doe@example.com</p>
          </div>
        </div>
      </div>
    </div>
  );

  const MobileNavigationItemComponent = ({ item, level = 0 }: { item: NavigationItem; level?: number }) => {
    const Icon = item.icon;
    const isActive = pathname === item.href;
    const hasChildren = item.children && item.children.length > 0;
    const isExpanded = expandedItems.includes(item.name);

    if (hasChildren) {
      return (
        <div className="space-y-1">
          <button
            onClick={() => toggleExpanded(item.name)}
            className={cn(
              "flex items-center w-full px-3 py-2 text-sm font-medium rounded-md transition-colors",
              level > 0 && "ml-4",
              isExpanded
                ? resolvedTheme === 'dark'
                  ? "bg-gray-800 text-white"
                  : "bg-gray-100 text-gray-900"
                : resolvedTheme === 'dark'
                  ? "text-gray-300 hover:bg-gray-800 hover:text-white"
                  : "text-gray-700 hover:bg-gray-100 hover:text-gray-900"
            )}
          >
            <Icon className="w-4 h-4 text-yellow-600 mr-3" />
            <span className="flex-1 text-left">{item.name}</span>
            {isExpanded ? (
              <ChevronDown className="w-4 h-4 text-yellow-600" />
            ) : (
              <ChevronRight className="w-4 h-4 text-yellow-600" />
            )}
          </button>
          
          {isExpanded && (
            <div className="space-y-1">
              {item.children.map((child) => (
                <MobileNavigationItemComponent key={child.name} item={child} level={level + 1} />
              ))}
            </div>
          )}
        </div>
      );
    }

    return (
      <Link
        key={item.name}
        href={item.href}
        className={cn(
          "flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors",
          level > 0 && "ml-4",
          isActive
            ? resolvedTheme === 'dark'
              ? "bg-gray-800 text-white"
              : "bg-gray-100 text-gray-900"
            : resolvedTheme === 'dark'
              ? "text-gray-300 hover:bg-gray-800 hover:text-white"
              : "text-gray-700 hover:bg-gray-100 hover:text-gray-900"
        )}
        onClick={() => {
          // Only close mobile sidebar, let Next.js handle navigation naturally
          closeMobile();
        }}
      >
        <Icon className="w-4 h-4 mr-3" />
        <span className="flex-1">{item.name}</span>
        {item.badge && (
          <Badge variant="destructive" className="ml-auto">
            {item.badge}
          </Badge>
        )}
      </Link>
    );
  };

  return (
    <>
      {/* Desktop Sidebar */}
      <div className={cn(
        "hidden lg:flex lg:flex-col lg:bg-white lg:border-r lg:dark:bg-gray-900 transition-all duration-300",
        isCollapsed ? "lg:w-16" : "lg:w-64",
        className
      )}>
        <SidebarContent />
      </div>

      {/* Mobile Sidebar */}
      {isMobileOpen && (
        <div className="fixed inset-y-0 left-0 z-50 w-64 bg-white dark:bg-gray-900 shadow-lg lg:hidden">
          <MobileSidebarContent />
        </div>
      )}
    </>
  );
}
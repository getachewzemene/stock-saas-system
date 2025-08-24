"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuLabel, 
  DropdownMenuSeparator, 
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { 
  Search, 
  Plus,
  Sun,
  Moon,
  Monitor,
  Globe,
  Menu,
  Bell,
  Settings,
  MoreVertical,
  RefreshCw
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
import { usePathname, useRouter } from "next/navigation";

interface HeaderProps {
  title: string;
  subtitle?: string;
  showNewButton?: boolean;
  onNewClick?: () => void;
  onRefreshClick?: () => void;
  isRefreshing?: boolean;
}

export function Header({ title, subtitle, showNewButton = false, onNewClick, onRefreshClick, isRefreshing = false }: HeaderProps) {
  const { language, setLanguage, t } = useI18n();
  const { theme, setTheme, resolvedTheme } = useTheme();
  const { toggleMobile } = useSidebar();
  const router = useRouter();
  const pathname = usePathname();

  // Always show refresh button except on login and auth pages
  const showRefreshButton = !pathname.includes('/login') && !pathname.includes('/auth');

  const languages = [
    { code: 'en', name: 'English', flag: '🇺🇸' },
    { code: 'am', name: 'አማርኛ', flag: '🇪🇹' },
    { code: 'om', name: 'Afaan Oromoo', flag: '🇪🇹' },
  ];

  const themes = [
    { value: 'light' as const, label: 'Light', icon: Sun },
    { value: 'dark' as const, label: 'Dark', icon: Moon },
    { value: 'system' as const, label: 'System', icon: Monitor },
  ];

  const handleNotificationClick = () => {
    router.push("/alerts");
  };

  return (
    <TooltipProvider>
      <header className="flex items-center justify-between h-16 px-6 bg-white border-b dark:bg-gray-900 dark:border-gray-800">
        <div className="flex items-center">
          {/* Mobile menu trigger */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="lg:hidden mr-4"
                onClick={toggleMobile}
              >
                <Menu className="w-5 h-5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Toggle Menu</p>
            </TooltipContent>
          </Tooltip>
          <div>
            <h2 className="text-lg font-semibold">{title}</h2>
            {subtitle && (
              <p className="text-sm text-gray-600 dark:text-gray-400">{subtitle}</p>
            )}
          </div>
        </div>
        
        <div className="flex items-center space-x-2 sm:space-x-4">
          {/* Search - hidden on mobile, shown on tablet+ */}
          <div className="hidden sm:block relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              placeholder={t('common.search')}
              className="pl-10 w-32 sm:w-48 md:w-64"
            />
          </div>
          
          {/* Mobile search button */}
          <div className="sm:hidden">
            <Button variant="ghost" size="sm" onClick={() => {
              // Toggle mobile search or navigate to search page
              router.push("/search");
            }}>
              <Search className="w-4 h-4" />
            </Button>
          </div>
          
          {/* Refresh button */}
          {showRefreshButton && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={onRefreshClick || (() => window.location.reload())}
                  disabled={isRefreshing}
                >
                  <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>{t('common.refresh')}</p>
              </TooltipContent>
            </Tooltip>
          )}
          
          {showNewButton && (
            <Button onClick={onNewClick} className="hidden sm:flex">
              <Plus className="w-4 h-4 mr-2" />
              {t('common.new')}
            </Button>
          )}
          
          {/* Mobile New button */}
          {showNewButton && (
            <Button onClick={onNewClick} size="sm" className="sm:hidden">
              <Plus className="w-4 h-4" />
            </Button>
          )}
          
          {/* Language Switcher - hidden on mobile, shown on tablet+ */}
          <div className="hidden md:block">
            <Tooltip>
              <TooltipTrigger asChild>
                <Select value={language} onValueChange={(value: any) => setLanguage(value)}>
                  <SelectTrigger className="w-28 sm:w-32">
                    <Globe className="w-4 h-4 mr-2" />
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {languages.map((lang) => (
                      <SelectItem key={lang.code} value={lang.code}>
                        <span className="mr-2">{lang.flag}</span>
                        {lang.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </TooltipTrigger>
              <TooltipContent>
                <p>Change Language</p>
              </TooltipContent>
            </Tooltip>
          </div>

          {/* Mobile Menu - Language, Theme, Settings */}
          <div className="md:hidden">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm">
                  <MoreVertical className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuLabel>Mobile Options</DropdownMenuLabel>
                <DropdownMenuSeparator />
                
                {/* Language Selector */}
                <DropdownMenuSub>
                  <DropdownMenuSubTrigger>
                    <Globe className="w-4 h-4 mr-2" />
                    Language
                  </DropdownMenuSubTrigger>
                  <DropdownMenuSubContent>
                    {languages.map((lang) => (
                      <DropdownMenuItem
                        key={lang.code}
                        onClick={() => setLanguage(lang.code)}
                        className={language === lang.code ? "bg-gray-100 dark:bg-gray-800" : ""}
                      >
                        <span className="mr-2">{lang.flag}</span>
                        {lang.name}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuSubContent>
                </DropdownMenuSub>
                
                <DropdownMenuSeparator />
                
                {/* Theme Selector */}
                <DropdownMenuSub>
                  <DropdownMenuSubTrigger>
                    {resolvedTheme === 'light' ? (
                      <Sun className="w-4 h-4 mr-2" />
                    ) : (
                      <Moon className="w-4 h-4 mr-2" />
                    )}
                    Theme
                  </DropdownMenuSubTrigger>
                  <DropdownMenuSubContent>
                    {themes.map((themeOption) => {
                      const Icon = themeOption.icon;
                      return (
                        <DropdownMenuItem
                          key={themeOption.value}
                          onClick={() => setTheme(themeOption.value)}
                          className={theme === themeOption.value ? "bg-gray-100 dark:bg-gray-800" : ""}
                        >
                          <Icon className="w-4 h-4 mr-2" />
                          {themeOption.label}
                        </DropdownMenuItem>
                      );
                    })}
                  </DropdownMenuSubContent>
                </DropdownMenuSub>
                
                <DropdownMenuSeparator />
                
                {/* Settings */}
                <DropdownMenuItem onClick={() => router.push("/settings")}>
                  <Settings className="w-4 h-4 mr-2" />
                  Settings
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Notification Icon */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button 
                variant="ghost" 
                size="sm" 
                className="relative"
                onClick={handleNotificationClick}
              >
                <Bell className="w-4 h-4" />
                <span className="absolute -top-1 -right-1 h-3 w-3 rounded-full bg-red-500 text-[10px] text-white flex items-center justify-center">
                  3
                </span>
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Notifications</p>
            </TooltipContent>
          </Tooltip>

          {/* Theme Toggle - hidden on mobile, shown on tablet+ */}
          <div className="hidden md:block">
            <Tooltip>
              <TooltipTrigger asChild>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm">
                      {resolvedTheme === 'light' ? (
                        <Sun className="w-4 h-4" />
                      ) : (
                        <Moon className="w-4 h-4" />
                      )}
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    {themes.map((themeOption) => {
                      const Icon = themeOption.icon;
                      return (
                        <DropdownMenuItem
                          key={themeOption.value}
                          onClick={() => setTheme(themeOption.value)}
                          className={theme === themeOption.value ? "bg-gray-100 dark:bg-gray-800" : ""}
                        >
                          <Icon className="w-4 h-4 mr-2" />
                          {themeOption.label}
                        </DropdownMenuItem>
                      );
                    })}
                  </DropdownMenuContent>
                </DropdownMenu>
              </TooltipTrigger>
              <TooltipContent>
                <p>Change Theme</p>
              </TooltipContent>
            </Tooltip>
          </div>
          
          {/* User Menu */}
          <Tooltip>
            <TooltipTrigger asChild>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src="/avatars/01.png" alt="User" />
                      <AvatarFallback>JD</AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56" align="end" forceMount>
                  <DropdownMenuLabel className="font-normal">
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium leading-none">John Doe</p>
                      <p className="text-xs leading-none text-muted-foreground">
                        john.doe@example.com
                      </p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem>{t('nav.profile')}</DropdownMenuItem>
                  <DropdownMenuItem>{t('nav.settings')}</DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem>{t('nav.logout')}</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </TooltipTrigger>
            <TooltipContent>
              <p>User Menu</p>
            </TooltipContent>
          </Tooltip>
        </div>
      </header>
    </TooltipProvider>
  );
}
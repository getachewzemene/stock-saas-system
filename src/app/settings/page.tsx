"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  Tabs, 
  TabsContent, 
  TabsList, 
  TabsTrigger 
} from "@/components/ui/tabs";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { 
  Settings, 
  Store, 
  Bell, 
  Shield, 
  Database, 
  Palette,
  Globe,
  Mail,
  Phone,
  MapPin,
  Save,
  RefreshCw,
  Download,
  Upload,
  Users,
  Package,
  AlertTriangle,
  CheckCircle
} from "lucide-react";
import { toast } from "sonner";
import { LayoutWrapper } from "@/components/layout/layout-wrapper";
import { useI18n } from "@/lib/i18n/context";
import { useTheme } from "@/lib/theme/context";

interface SystemSettings {
  company: {
    name: string;
    email: string;
    phone: string;
    address: string;
    website: string;
    logo?: string;
  };
  inventory: {
    lowStockThreshold: number;
    expiryWarningDays: number;
    autoGenerateSku: boolean;
    trackBatchByDefault: boolean;
    allowNegativeStock: boolean;
  };
  notifications: {
    emailNotifications: boolean;
    smsNotifications: boolean;
    pushNotifications: boolean;
    lowStockAlerts: boolean;
    expiryAlerts: boolean;
    transferAlerts: boolean;
    dailyReports: boolean;
  };
  security: {
    sessionTimeout: number;
    passwordMinLength: number;
    requirePasswordChange: boolean;
    twoFactorAuth: boolean;
    loginAttempts: number;
  };
  appearance: {
    theme: string;
    language: string;
    dateFormat: string;
    currency: string;
    timezone: string;
  };
}

interface BackupInfo {
  lastBackup: string;
  nextBackup: string;
  backupSchedule: string;
  retentionDays: number;
  size: string;
}

export default function SettingsPage() {
  const { t, language: currentLanguage, setLanguage: setI18nLanguage } = useI18n();
  const { theme: currentTheme, setTheme: setThemeContext } = useTheme();
  const [settings, setSettings] = useState<SystemSettings>({
    company: {
      name: "",
      email: "",
      phone: "",
      address: "",
      website: "",
    },
    inventory: {
      lowStockThreshold: 10,
      expiryWarningDays: 30,
      autoGenerateSku: false,
      trackBatchByDefault: false,
      allowNegativeStock: false,
    },
    notifications: {
      emailNotifications: true,
      smsNotifications: false,
      pushNotifications: true,
      lowStockAlerts: true,
      expiryAlerts: true,
      transferAlerts: true,
      dailyReports: false,
    },
    security: {
      sessionTimeout: 30,
      passwordMinLength: 8,
      requirePasswordChange: true,
      twoFactorAuth: false,
      loginAttempts: 5,
    },
    appearance: {
      theme: currentTheme,
      language: currentLanguage,
      dateFormat: "MM/DD/YYYY",
      currency: "USD",
      timezone: "UTC",
    },
  });

  const [backupInfo, setBackupInfo] = useState<BackupInfo>({
    lastBackup: "",
    nextBackup: "",
    backupSchedule: "daily",
    retentionDays: 30,
    size: "0 MB",
  });

  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("general");

  useEffect(() => {
    fetchSettings();
    fetchBackupInfo();
  }, []);

  useEffect(() => {
    // Update settings when theme or language changes from context
    setSettings(prev => ({
      ...prev,
      appearance: {
        ...prev.appearance,
        theme: currentTheme,
        language: currentLanguage,
      },
    }));
  }, [currentTheme, currentLanguage]);

  const fetchSettings = async () => {
    try {
      const response = await fetch("/api/settings");
      if (response.ok) {
        const data = await response.json();
        setSettings(data);
        
        // Apply theme and language from settings
        if (data.appearance?.theme && data.appearance.theme !== currentTheme) {
          setThemeContext(data.appearance.theme as 'light' | 'dark' | 'system');
        }
        if (data.appearance?.language && data.appearance.language !== currentLanguage) {
          setI18nLanguage(data.appearance.language as 'en' | 'am' | 'om');
        }
      }
    } catch (error) {
      toast.error("Failed to fetch settings");
    }
  };

  const fetchBackupInfo = async () => {
    try {
      const response = await fetch("/api/settings/backup-info");
      if (response.ok) {
        const data = await response.json();
        setBackupInfo(data);
      }
    } catch (error) {
      toast.error("Failed to fetch backup information");
    }
  };

  const handleSaveSettings = async (section: keyof SystemSettings) => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/settings", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ [section]: settings[section] }),
      });

      if (response.ok) {
        toast.success(`${section.charAt(0).toUpperCase() + section.slice(1)} settings saved successfully`);
        
        // If appearance settings were saved, apply theme and language immediately
        if (section === "appearance") {
          const { theme, language } = settings.appearance;
          if (theme && theme !== currentTheme) {
            setThemeContext(theme as 'light' | 'dark' | 'system');
          }
          if (language && language !== currentLanguage) {
            setI18nLanguage(language as 'en' | 'am' | 'om');
          }
        }
      } else {
        toast.error("Failed to save settings");
      }
    } catch (error) {
      toast.error("An error occurred while saving settings");
    } finally {
      setIsLoading(false);
    }
  };

  const handleBackupNow = async () => {
    try {
      const response = await fetch("/api/settings/backup", {
        method: "POST",
      });

      if (response.ok) {
        toast.success("Backup started successfully");
        fetchBackupInfo();
      } else {
        toast.error("Failed to start backup");
      }
    } catch (error) {
      toast.error("An error occurred while starting backup");
    }
  };

  const handleRestoreBackup = () => {
    if (confirm("Are you sure you want to restore from backup? This will overwrite all current data.")) {
      toast.info("Backup restore functionality would be implemented here");
    }
  };

  const updateSettings = (section: keyof SystemSettings, field: string, value: any) => {
    setSettings(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [field]: value,
      },
    }));
  };

  // Handle theme change with immediate application
  const handleThemeChange = (value: string) => {
    updateSettings("appearance", "theme", value);
    setThemeContext(value as 'light' | 'dark' | 'system');
  };

  // Handle language change with immediate application
  const handleLanguageChange = (value: string) => {
    updateSettings("appearance", "language", value);
    setI18nLanguage(value as 'en' | 'am' | 'om');
  };

  return (
    <LayoutWrapper 
      title={t('settings.title') || 'Settings'} 
      subtitle={t('settings.subtitle') || 'Manage your system settings and preferences'}
    >
      <div className="space-y-6">
        <div className="flex justify-end">
          <Button variant="outline" onClick={fetchSettings}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="general" className="flex items-center space-x-2">
              <Store className="w-4 h-4" />
              <span>General</span>
            </TabsTrigger>
            <TabsTrigger value="inventory" className="flex items-center space-x-2">
              <Package className="w-4 h-4" />
              <span>Inventory</span>
            </TabsTrigger>
            <TabsTrigger value="notifications" className="flex items-center space-x-2">
              <Bell className="w-4 h-4" />
              <span>Notifications</span>
            </TabsTrigger>
            <TabsTrigger value="security" className="flex items-center space-x-2">
              <Shield className="w-4 h-4" />
              <span>Security</span>
            </TabsTrigger>
            <TabsTrigger value="backup" className="flex items-center space-x-2">
              <Database className="w-4 h-4" />
              <span>Backup</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="general" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Store className="w-5 h-5 mr-2" />
                    Company Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="companyName">Company Name *</Label>
                    <Input
                      id="companyName"
                      value={settings.company.name}
                      onChange={(e) => updateSettings("company", "name", e.target.value)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="companyEmail">Email Address *</Label>
                    <Input
                      id="companyEmail"
                      type="email"
                      value={settings.company.email}
                      onChange={(e) => updateSettings("company", "email", e.target.value)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="companyPhone">Phone Number</Label>
                    <Input
                      id="companyPhone"
                      type="tel"
                      value={settings.company.phone}
                      onChange={(e) => updateSettings("company", "phone", e.target.value)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="companyAddress">Address</Label>
                    <Textarea
                      id="companyAddress"
                      value={settings.company.address}
                      onChange={(e) => updateSettings("company", "address", e.target.value)}
                      rows={3}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="companyWebsite">Website</Label>
                    <Input
                      id="companyWebsite"
                      type="url"
                      value={settings.company.website}
                      onChange={(e) => updateSettings("company", "website", e.target.value)}
                    />
                  </div>

                  <Button 
                    onClick={() => handleSaveSettings("company")}
                    disabled={isLoading}
                    className="w-full"
                  >
                    <Save className="w-4 h-4 mr-2" />
                    Save Company Settings
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Palette className="w-5 h-5 mr-2" />
                    Appearance
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="theme">Theme</Label>
                    <Select 
                      value={settings.appearance.theme} 
                      onValueChange={handleThemeChange}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="light">Light</SelectItem>
                        <SelectItem value="dark">Dark</SelectItem>
                        <SelectItem value="system">System</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="language">Language</Label>
                    <Select 
                      value={settings.appearance.language} 
                      onValueChange={handleLanguageChange}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="en">English</SelectItem>
                        <SelectItem value="am">አማርኛ (Amharic)</SelectItem>
                        <SelectItem value="om">Afaan Oromoo (Oromo)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="dateFormat">Date Format</Label>
                    <Select 
                      value={settings.appearance.dateFormat} 
                      onValueChange={(value) => updateSettings("appearance", "dateFormat", value)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="MM/DD/YYYY">MM/DD/YYYY</SelectItem>
                        <SelectItem value="DD/MM/YYYY">DD/MM/YYYY</SelectItem>
                        <SelectItem value="YYYY-MM-DD">YYYY-MM-DD</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="currency">Currency</Label>
                    <Select 
                      value={settings.appearance.currency} 
                      onValueChange={(value) => updateSettings("appearance", "currency", value)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="USD">USD ($)</SelectItem>
                        <SelectItem value="EUR">EUR (€)</SelectItem>
                        <SelectItem value="GBP">GBP (£)</SelectItem>
                        <SelectItem value="ETB">ETB (ብር)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="timezone">Timezone</Label>
                    <Select 
                      value={settings.appearance.timezone} 
                      onValueChange={(value) => updateSettings("appearance", "timezone", value)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="UTC">UTC</SelectItem>
                        <SelectItem value="Africa/Addis_Ababa">East Africa Time (EAT)</SelectItem>
                        <SelectItem value="America/New_York">Eastern Time</SelectItem>
                        <SelectItem value="America/Chicago">Central Time</SelectItem>
                        <SelectItem value="America/Denver">Mountain Time</SelectItem>
                        <SelectItem value="America/Los_Angeles">Pacific Time</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <Button 
                    onClick={() => handleSaveSettings("appearance")}
                    disabled={isLoading}
                    className="w-full"
                  >
                    <Save className="w-4 h-4 mr-2" />
                    Save Appearance Settings
                  </Button>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="inventory" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Package className="w-5 h-5 mr-2" />
                  Inventory Settings
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="lowStockThreshold">Low Stock Threshold</Label>
                      <Input
                        id="lowStockThreshold"
                        type="number"
                        min="0"
                        value={settings.inventory.lowStockThreshold}
                        onChange={(e) => updateSettings("inventory", "lowStockThreshold", parseInt(e.target.value))}
                      />
                      <p className="text-sm text-gray-500">Minimum stock level before triggering low stock alerts</p>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="expiryWarningDays">Expiry Warning Days</Label>
                      <Input
                        id="expiryWarningDays"
                        type="number"
                        min="1"
                        value={settings.inventory.expiryWarningDays}
                        onChange={(e) => updateSettings("inventory", "expiryWarningDays", parseInt(e.target.value))}
                      />
                      <p className="text-sm text-gray-500">Number of days before expiry to send warnings</p>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label htmlFor="autoGenerateSku">Auto Generate SKU</Label>
                        <p className="text-sm text-gray-500">Automatically generate SKU codes for new products</p>
                      </div>
                      <Switch
                        id="autoGenerateSku"
                        checked={settings.inventory.autoGenerateSku}
                        onCheckedChange={(checked) => updateSettings("inventory", "autoGenerateSku", checked)}
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label htmlFor="trackBatchByDefault">Track Batch by Default</Label>
                        <p className="text-sm text-gray-500">Enable batch tracking for new products by default</p>
                      </div>
                      <Switch
                        id="trackBatchByDefault"
                        checked={settings.inventory.trackBatchByDefault}
                        onCheckedChange={(checked) => updateSettings("inventory", "trackBatchByDefault", checked)}
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label htmlFor="allowNegativeStock">Allow Negative Stock</Label>
                        <p className="text-sm text-gray-500">Allow stock levels to go below zero</p>
                      </div>
                      <Switch
                        id="allowNegativeStock"
                        checked={settings.inventory.allowNegativeStock}
                        onCheckedChange={(checked) => updateSettings("inventory", "allowNegativeStock", checked)}
                      />
                    </div>
                  </div>
                </div>

                <Button 
                  onClick={() => handleSaveSettings("inventory")}
                  disabled={isLoading}
                >
                  <Save className="w-4 h-4 mr-2" />
                  Save Inventory Settings
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="notifications" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Bell className="w-5 h-5 mr-2" />
                  Notification Settings
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold">Notification Methods</h3>
                    
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label htmlFor="emailNotifications">Email Notifications</Label>
                        <p className="text-sm text-gray-500">Receive notifications via email</p>
                      </div>
                      <Switch
                        id="emailNotifications"
                        checked={settings.notifications.emailNotifications}
                        onCheckedChange={(checked) => updateSettings("notifications", "emailNotifications", checked)}
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label htmlFor="smsNotifications">SMS Notifications</Label>
                        <p className="text-sm text-gray-500">Receive notifications via SMS</p>
                      </div>
                      <Switch
                        id="smsNotifications"
                        checked={settings.notifications.smsNotifications}
                        onCheckedChange={(checked) => updateSettings("notifications", "smsNotifications", checked)}
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label htmlFor="pushNotifications">Push Notifications</Label>
                        <p className="text-sm text-gray-500">Receive push notifications in the app</p>
                      </div>
                      <Switch
                        id="pushNotifications"
                        checked={settings.notifications.pushNotifications}
                        onCheckedChange={(checked) => updateSettings("notifications", "pushNotifications", checked)}
                      />
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold">Alert Types</h3>
                    
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label htmlFor="lowStockAlerts">Low Stock Alerts</Label>
                        <p className="text-sm text-gray-500">Get notified when stock is low</p>
                      </div>
                      <Switch
                        id="lowStockAlerts"
                        checked={settings.notifications.lowStockAlerts}
                        onCheckedChange={(checked) => updateSettings("notifications", "lowStockAlerts", checked)}
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label htmlFor="expiryAlerts">Expiry Alerts</Label>
                        <p className="text-sm text-gray-500">Get notified about expiring products</p>
                      </div>
                      <Switch
                        id="expiryAlerts"
                        checked={settings.notifications.expiryAlerts}
                        onCheckedChange={(checked) => updateSettings("notifications", "expiryAlerts", checked)}
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label htmlFor="transferAlerts">Transfer Alerts</Label>
                        <p className="text-sm text-gray-500">Get notified about transfer requests</p>
                      </div>
                      <Switch
                        id="transferAlerts"
                        checked={settings.notifications.transferAlerts}
                        onCheckedChange={(checked) => updateSettings("notifications", "transferAlerts", checked)}
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label htmlFor="dailyReports">Daily Reports</Label>
                        <p className="text-sm text-gray-500">Receive daily summary reports</p>
                      </div>
                      <Switch
                        id="dailyReports"
                        checked={settings.notifications.dailyReports}
                        onCheckedChange={(checked) => updateSettings("notifications", "dailyReports", checked)}
                      />
                    </div>
                  </div>
                </div>

                <Button 
                  onClick={() => handleSaveSettings("notifications")}
                  disabled={isLoading}
                >
                  <Save className="w-4 h-4 mr-2" />
                  Save Notification Settings
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="security" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Shield className="w-5 h-5 mr-2" />
                  Security Settings
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="sessionTimeout">Session Timeout (minutes)</Label>
                      <Input
                        id="sessionTimeout"
                        type="number"
                        min="5"
                        max="480"
                        value={settings.security.sessionTimeout}
                        onChange={(e) => updateSettings("security", "sessionTimeout", parseInt(e.target.value))}
                      />
                      <p className="text-sm text-gray-500">Automatic logout after inactivity</p>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="passwordMinLength">Minimum Password Length</Label>
                      <Input
                        id="passwordMinLength"
                        type="number"
                        min="6"
                        max="32"
                        value={settings.security.passwordMinLength}
                        onChange={(e) => updateSettings("security", "passwordMinLength", parseInt(e.target.value))}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="loginAttempts">Max Login Attempts</Label>
                      <Input
                        id="loginAttempts"
                        type="number"
                        min="3"
                        max="10"
                        value={settings.security.loginAttempts}
                        onChange={(e) => updateSettings("security", "loginAttempts", parseInt(e.target.value))}
                      />
                      <p className="text-sm text-gray-500">Account lockout after failed attempts</p>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label htmlFor="requirePasswordChange">Require Password Change</Label>
                        <p className="text-sm text-gray-500">Force password change on first login</p>
                      </div>
                      <Switch
                        id="requirePasswordChange"
                        checked={settings.security.requirePasswordChange}
                        onCheckedChange={(checked) => updateSettings("security", "requirePasswordChange", checked)}
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label htmlFor="twoFactorAuth">Two-Factor Authentication</Label>
                        <p className="text-sm text-gray-500">Enable 2FA for all users</p>
                      </div>
                      <Switch
                        id="twoFactorAuth"
                        checked={settings.security.twoFactorAuth}
                        onCheckedChange={(checked) => updateSettings("security", "twoFactorAuth", checked)}
                      />
                    </div>
                  </div>
                </div>

                <Button 
                  onClick={() => handleSaveSettings("security")}
                  disabled={isLoading}
                >
                  <Save className="w-4 h-4 mr-2" />
                  Save Security Settings
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="backup" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Database className="w-5 h-5 mr-2" />
                    Backup Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-sm font-medium text-gray-600">Last Backup</Label>
                      <p className="font-medium">
                        {backupInfo.lastBackup ? new Date(backupInfo.lastBackup).toLocaleString() : "Never"}
                      </p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-gray-600">Next Backup</Label>
                      <p className="font-medium">
                        {backupInfo.nextBackup ? new Date(backupInfo.nextBackup).toLocaleString() : "Not scheduled"}
                      </p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-gray-600">Backup Schedule</Label>
                      <p className="font-medium">{backupInfo.backupSchedule}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-gray-600">Backup Size</Label>
                      <p className="font-medium">{backupInfo.size}</p>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="retentionDays">Retention Period (days)</Label>
                    <Input
                      id="retentionDays"
                      type="number"
                      min="1"
                      max="365"
                      value={backupInfo.retentionDays}
                      onChange={(e) => setBackupInfo(prev => ({ ...prev, retentionDays: parseInt(e.target.value) }))}
                    />
                  </div>

                  <div className="flex space-x-2">
                    <Button onClick={handleBackupNow} className="flex-1">
                      <Download className="w-4 h-4 mr-2" />
                      Backup Now
                    </Button>
                    <Button variant="outline" onClick={handleRestoreBackup} className="flex-1">
                      <Upload className="w-4 h-4 mr-2" />
                      Restore
                    </Button>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <AlertTriangle className="w-5 h-5 mr-2" />
                    System Health
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span>Database Connection</span>
                      <Badge variant="default"><CheckCircle className="w-3 h-3 mr-1" />Healthy</Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Storage Space</span>
                      <Badge variant="default"><CheckCircle className="w-3 h-3 mr-1" />Good</Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Memory Usage</span>
                      <Badge variant="default"><CheckCircle className="w-3 h-3 mr-1" />Normal</Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>API Status</span>
                      <Badge variant="default"><CheckCircle className="w-3 h-3 mr-1" />Online</Badge>
                    </div>
                  </div>

                  <div className="pt-4 border-t">
                    <h4 className="font-medium mb-2">System Information</h4>
                    <div className="space-y-1 text-sm text-gray-600">
                      <p>Version: 1.0.0</p>
                      <p>Last Updated: {new Date().toLocaleDateString()}</p>
                      <p>Environment: Production</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </LayoutWrapper>
  );
}

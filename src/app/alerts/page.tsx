"use client";

import { useState, useEffect } from "react";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from "@/components/ui/dialog";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { Label } from "@/components/ui/label";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { 
  Bell, 
  Search, 
  MoreHorizontal, 
  CheckCircle, 
  XCircle, 
  AlertTriangle,
  Package,
  Calendar,
  RefreshCw,
  Eye,
  Filter,
  Clock,
  Settings,
  Mail,
  Smartphone,
  Bell as BellIcon,
  Plus
} from "lucide-react";
import { toast } from "sonner";
import { LayoutWrapper } from "@/components/layout/layout-wrapper";
import { useI18n } from "@/lib/i18n/context";
import { ModernTable } from "@/components/ui/modern-table";

interface Alert {
  id: string;
  type: string;
  severity: string;
  title: string;
  message: string;
  productId?: string;
  locationId?: string;
  batchId?: string;
  threshold?: number;
  currentValue?: number;
  isRead: boolean;
  isResolved: boolean;
  createdAt: string;
  resolvedAt?: string;
  product?: {
    id: string;
    name: string;
    sku?: string;
    category: {
      name: string;
    };
  };
  location?: {
    id: string;
    name: string;
  };
  batch?: {
    id: string;
    batchNumber: string;
    expiryDate?: string;
  };
}

interface AlertRule {
  id: string;
  name: string;
  type: string;
  condition: string;
  threshold: number;
  enabled: boolean;
  notificationMethods: string[];
  createdAt: string;
}

export default function AlertsPage() {
  const { t } = useI18n();
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [alertRules, setAlertRules] = useState<AlertRule[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [severityFilter, setSeverityFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [isLoading, setIsLoading] = useState(true);
  const [isRulesDialogOpen, setIsRulesDialogOpen] = useState(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [selectedAlert, setSelectedAlert] = useState<Alert | null>(null);
  
  // Pagination state
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
  });
  const [paginationInfo, setPaginationInfo] = useState({
    page: 1,
    totalPages: 1,
    total: 0,
    hasNext: false,
    hasPrev: false,
  });

  useEffect(() => {
    fetchAlerts();
    fetchAlertRules();
  }, [pagination.page, pagination.limit, searchTerm, typeFilter, severityFilter, statusFilter]);

  // Reset pagination when filters or items per page change
  useEffect(() => {
    setPagination(prev => ({ ...prev, page: 1 }));
  }, [searchTerm, typeFilter, severityFilter, statusFilter, pagination.limit]);

  const fetchAlerts = async () => {
    try {
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
        ...(searchTerm && { search: searchTerm }),
        ...(typeFilter !== "all" && { type: typeFilter }),
        ...(severityFilter !== "all" && { severity: severityFilter }),
        ...(statusFilter !== "all" && { 
          status: statusFilter === "resolved" ? "resolved" : "unresolved" 
        }),
      });
      
      const response = await fetch(`/api/alerts?${params}`);
      if (response.ok) {
        const data = await response.json();
        // Ensure alerts is always an array
        const alertsData = Array.isArray(data.alerts) ? data.alerts : 
                          Array.isArray(data) ? data : [];
        setAlerts(alertsData);
        
        // Set pagination info if available
        if (data.pagination) {
          setPaginationInfo(data.pagination);
        } else {
          setPaginationInfo({
            page: pagination.page,
            totalPages: Math.ceil(alertsData.length / pagination.limit),
            total: alertsData.length,
            hasNext: alertsData.length === pagination.limit,
            hasPrev: pagination.page > 1,
          });
        }
      }
    } catch (error) {
      toast.error("Failed to fetch alerts");
      // Set empty array on error to prevent filter issues
      setAlerts([]);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchAlertRules = async () => {
    try {
      const response = await fetch("/api/alerts/rules");
      if (response.ok) {
        const data = await response.json();
        // Ensure alertRules is always an array
        const rules = Array.isArray(data.rules) ? data.rules : 
                     Array.isArray(data) ? data : [];
        setAlertRules(rules);
      }
    } catch (error) {
      toast.error("Failed to fetch alert rules");
      // Set empty array on error to prevent map issues
      setAlertRules([]);
    }
  };

  const handleResolveAlert = async (alertId: string) => {
    try {
      const response = await fetch(`/api/alerts/${alertId}/resolve`, {
        method: "POST",
      });

      if (response.ok) {
        toast.success("Alert resolved successfully");
        fetchAlerts();
      } else {
        toast.error("Failed to resolve alert");
      }
    } catch (error) {
      toast.error("An error occurred while resolving the alert");
    }
  };

  const handleDismissAlert = async (alertId: string) => {
    try {
      const response = await fetch(`/api/alerts/${alertId}/dismiss`, {
        method: "POST",
      });

      if (response.ok) {
        toast.success("Alert dismissed successfully");
        fetchAlerts();
      } else {
        toast.error("Failed to dismiss alert");
      }
    } catch (error) {
      toast.error("An error occurred while dismissing the alert");
    }
  };

  const markAllAsRead = async () => {
    try {
      const response = await fetch("/api/alerts/mark-all-read", {
        method: "POST",
      });

      if (response.ok) {
        toast.success("All alerts marked as read");
        fetchAlerts();
      } else {
        toast.error("Failed to mark alerts as read");
      }
    } catch (error) {
      toast.error("An error occurred while marking alerts as read");
    }
  };

  const viewAlert = (alert: Alert) => {
    setSelectedAlert(alert);
    setIsViewDialogOpen(true);
  };

  const getAlertIcon = (type: string) => {
    switch (type) {
      case "LOW_STOCK":
        return <Package className="w-5 h-5 text-yellow-600" />;
      case "EXPIRY":
        return <Calendar className="w-5 h-5 text-yellow-600" />;
      case "OUT_OF_STOCK":
        return <AlertTriangle className="w-5 h-5 text-yellow-600" />;
      default:
        return <Bell className="w-5 h-5 text-yellow-600" />;
    }
  };

  const getSeverityBadge = (severity: string) => {
    switch (severity) {
      case "CRITICAL":
        return <Badge variant="destructive">Critical</Badge>;
      case "HIGH":
        return <Badge variant="destructive">High</Badge>;
      case "MEDIUM":
        return <Badge variant="secondary">Medium</Badge>;
      case "LOW":
        return <Badge variant="outline">Low</Badge>;
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };

  const getTypeBadge = (type: string) => {
    switch (type) {
      case "LOW_STOCK":
        return <Badge variant="secondary">Low Stock</Badge>;
      case "EXPIRY":
        return <Badge variant="outline">Expiry</Badge>;
      case "OUT_OF_STOCK":
        return <Badge variant="destructive">Out of Stock</Badge>;
      case "SYSTEM":
        return <Badge variant="default">System</Badge>;
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };

  const unreadCount = alerts.filter(a => !a.isRead).length;
  const unresolvedCount = alerts.filter(a => !a.isResolved).length;
  const criticalCount = alerts.filter(a => a.severity === "CRITICAL").length;
  const lowStockCount = alerts.filter(a => a.type === "LOW_STOCK").length;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  return (
    <LayoutWrapper 
      title={t('alerts.title')} 
      subtitle={t('alerts.subtitle')}
    >
      <div className="space-y-6">
        <div className="flex items-center space-x-2">
          <Button variant="outline" onClick={fetchAlerts}>
            <RefreshCw className="w-4 h-4 mr-2 text-yellow-600" />
            Refresh
          </Button>
          <Button variant="outline" onClick={markAllAsRead}>
            <CheckCircle className="w-4 h-4 mr-2 text-yellow-600" />
            Mark All Read
          </Button>
          <Dialog open={isRulesDialogOpen} onOpenChange={setIsRulesDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Settings className="w-4 h-4 mr-2 text-yellow-600" />
                Alert Rules
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[600px]">
              <DialogHeader>
                <DialogTitle>Alert Rules Configuration</DialogTitle>
                <DialogDescription>
                  Configure automated alert rules and notification settings
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Active Alert Rules</h3>
                  <div className="space-y-3">
                    {alertRules?.map((rule) => (
                      <div key={rule.id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div>
                          <p className="font-medium">{rule.name}</p>
                          <p className="text-sm text-gray-600">
                            {rule.type} - {rule.condition} {rule.threshold}
                          </p>
                          <div className="flex items-center space-x-2 mt-1">
                            {rule.notificationMethods.includes("email") && (
                              <Mail className="w-4 h-4 text-gray-400" />
                            )}
                            {rule.notificationMethods.includes("sms") && (
                              <Smartphone className="w-4 h-4 text-gray-400" />
                            )}
                            {rule.notificationMethods.includes("push") && (
                              <BellIcon className="w-4 h-4 text-gray-400" />
                            )}
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Badge variant={rule.enabled ? "default" : "secondary"}>
                            {rule.enabled ? "Enabled" : "Disabled"}
                          </Badge>
                          <Button variant="outline" size="sm">
                            Edit
                          </Button>
                        </div>
                      </div>
                    ))}
                    {(!alertRules || alertRules.length === 0) && (
                      <div className="text-center py-8 text-gray-500">
                        <p>No alert rules configured yet.</p>
                        <p className="text-sm">Click "Add New Rule" to create your first alert rule.</p>
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="pt-4 border-t">
                  <Button className="w-full">
                    <Plus className="w-4 h-4 mr-2 text-yellow-600" />
                    Add New Rule
                  </Button>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsRulesDialogOpen(false)}>
                  Close
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
        
      {/* Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Unread Alerts</p>
                <p className="text-2xl font-bold">{unreadCount}</p>
                <p className="text-sm text-blue-600">Requires attention</p>
              </div>
              <Bell className="w-8 h-8 text-yellow-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Unresolved</p>
                <p className="text-2xl font-bold">{unresolvedCount}</p>
                <p className="text-sm text-orange-600">Action needed</p>
              </div>
              <AlertTriangle className="w-8 h-8 text-yellow-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Critical</p>
                <p className="text-2xl font-bold">{criticalCount}</p>
                <p className="text-sm text-red-600">Immediate action</p>
              </div>
              <AlertTriangle className="w-8 h-8 text-yellow-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Low Stock</p>
                <p className="text-2xl font-bold">{lowStockCount}</p>
                <p className="text-sm text-yellow-600">Reorder needed</p>
              </div>
              <Package className="w-8 h-8 text-yellow-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Alerts List</CardTitle>
            <div className="flex flex-col space-y-2 sm:flex-row sm:space-y-0 sm:space-x-2">
              <div className="relative w-full sm:w-64">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4 text-yellow-600" />
                <Input
                  placeholder="Search alerts..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 w-full"
                />
              </div>
              
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger className="w-full sm:w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="LOW_STOCK">Low Stock</SelectItem>
                  <SelectItem value="EXPIRY">Expiry</SelectItem>
                  <SelectItem value="OUT_OF_STOCK">Out of Stock</SelectItem>
                  <SelectItem value="SYSTEM">System</SelectItem>
                </SelectContent>
              </Select>

              <Select value={severityFilter} onValueChange={setSeverityFilter}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Severity</SelectItem>
                  <SelectItem value="CRITICAL">Critical</SelectItem>
                  <SelectItem value="HIGH">High</SelectItem>
                  <SelectItem value="MEDIUM">Medium</SelectItem>
                  <SelectItem value="LOW">Low</SelectItem>
                </SelectContent>
              </Select>

              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="unresolved">Unresolved</SelectItem>
                  <SelectItem value="resolved">Resolved</SelectItem>
                </SelectContent>
              </Select>

              <Button variant="outline" size="sm">
                <Filter className="w-4 h-4 mr-2 text-yellow-600" />
                More Filters
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <ModernTable
            data={alerts}
            loading={isLoading}
            title="Alerts Management"
            description="Monitor and manage system alerts and notifications"
            pagination={{
              page: paginationInfo.page,
              totalPages: paginationInfo.totalPages,
              total: paginationInfo.total,
              limit: pagination.limit,
              onPageChange: (page) => setPagination(prev => ({ ...prev, page })),
              onItemsPerPageChange: (limit) => setPagination(prev => ({ ...prev, limit, page: 1 }))
            }}
            actions={(alert: Alert) => (
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => viewAlert(alert)}
                >
                  <Eye className="w-4 h-4" />
                </Button>
                {!alert.isResolved && (
                  <>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleResolveAlert(alert.id)}
                    >
                      <CheckCircle className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDismissAlert(alert.id)}
                    >
                      <XCircle className="w-4 h-4" />
                    </Button>
                  </>
                )}
              </div>
            )}
            columns={[
              {
                key: "type",
                header: "Type",
                render: (value: string, alert: Alert) => (
                  <div className="flex items-center space-x-2">
                    {getAlertIcon(alert.type)}
                    {getTypeBadge(alert.type)}
                  </div>
                )
              },
              {
                key: "severity",
                header: "Severity",
                align: "center",
                render: (value: string, alert: Alert) => getSeverityBadge(alert.severity)
              },
              {
                key: "title",
                header: "Title",
                render: (value: string, alert: Alert) => (
                  <div>
                    <p className="font-medium">{alert.title}</p>
                    <p className="text-sm text-muted-foreground truncate max-w-xs">{alert.message}</p>
                  </div>
                )
              },
              {
                key: "productLocation",
                header: "Product/Location",
                render: (value: string, alert: Alert) => (
                  <div>
                    {alert.product && (
                      <p className="text-sm font-medium">{alert.product.name}</p>
                    )}
                    {alert.location && (
                      <p className="text-sm text-muted-foreground">{alert.location.name}</p>
                    )}
                    {alert.currentValue !== undefined && alert.threshold !== undefined && (
                      <p className="text-xs text-muted-foreground">
                        {alert.currentValue} / {alert.threshold}
                      </p>
                    )}
                  </div>
                )
              },
              {
                key: "createdAt",
                header: "Created",
                align: "center",
                render: (value: string, alert: Alert) => (
                  <div className="flex items-center justify-center space-x-2">
                    <Clock className="w-4 h-4 text-muted-foreground" />
                    <span>{format(new Date(alert.createdAt), "MMM dd, yyyy")}</span>
                  </div>
                )
              },
              {
                key: "status",
                header: "Status",
                align: "center",
                render: (value: string, alert: Alert) => (
                  alert.isResolved ? (
                    <Badge variant="default">
                      <CheckCircle className="w-3 h-3 mr-1" />
                      Resolved
                    </Badge>
                  ) : (
                    <Badge variant="secondary">
                      <AlertTriangle className="w-3 h-3 mr-1" />
                      Unresolved
                    </Badge>
                  )
                )
              }
            ]}
          />
        </CardContent>
      </Card>

      {/* View Alert Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Alert Details</DialogTitle>
          </DialogHeader>
          {selectedAlert && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium text-gray-600">Type</Label>
                  <div className="flex items-center space-x-2 mt-1">
                    {getAlertIcon(selectedAlert.type)}
                    {getTypeBadge(selectedAlert.type)}
                  </div>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-600">Severity</Label>
                  <div className="mt-1">{getSeverityBadge(selectedAlert.severity)}</div>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-600">Title</Label>
                  <p className="font-medium mt-1">{selectedAlert.title}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-600">Status</Label>
                  <div className="mt-1">
                    {selectedAlert.isResolved ? (
                      <Badge variant="default">
                        <CheckCircle className="w-3 h-3 mr-1 text-yellow-600" />
                        Resolved
                      </Badge>
                    ) : (
                      <Badge variant="secondary">
                        <AlertTriangle className="w-3 h-3 mr-1" />
                        Unresolved
                      </Badge>
                    )}
                  </div>
                </div>
              </div>

              <div>
                <Label className="text-sm font-medium text-gray-600">Message</Label>
                <p className="gray-bg-dark-mode p-3 rounded-lg mt-1">{selectedAlert.message}</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                {selectedAlert.product && (
                  <div>
                    <Label className="text-sm font-medium text-gray-600">Product</Label>
                    <p className="font-medium mt-1">{selectedAlert.product.name}</p>
                    <p className="text-sm text-gray-500">{selectedAlert.product.category.name}</p>
                    {selectedAlert.product.sku && (
                      <p className="text-sm text-gray-500">SKU: {selectedAlert.product.sku}</p>
                    )}
                  </div>
                )}
                {selectedAlert.location && (
                  <div>
                    <Label className="text-sm font-medium text-gray-600">Location</Label>
                    <p className="font-medium mt-1">{selectedAlert.location.name}</p>
                  </div>
                )}
                {selectedAlert.batch && (
                  <div>
                    <Label className="text-sm font-medium text-gray-600">Batch</Label>
                    <p className="font-medium mt-1">{selectedAlert.batch.batchNumber}</p>
                    {selectedAlert.batch.expiryDate && (
                      <p className="text-sm text-gray-500">
                        Exp: {format(new Date(selectedAlert.batch.expiryDate), "MMM dd, yyyy")}
                      </p>
                    )}
                  </div>
                )}
                {selectedAlert.currentValue !== undefined && selectedAlert.threshold !== undefined && (
                  <div>
                    <Label className="text-sm font-medium text-gray-600">Threshold</Label>
                    <p className="font-medium mt-1">
                      {selectedAlert.currentValue} / {selectedAlert.threshold}
                    </p>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium text-gray-600">Created At</Label>
                  <p className="mt-1">{format(new Date(selectedAlert.createdAt), "MMM dd, yyyy HH:mm")}</p>
                </div>
                {selectedAlert.resolvedAt && (
                  <div>
                    <Label className="text-sm font-medium text-gray-600">Resolved At</Label>
                    <p className="mt-1">{format(new Date(selectedAlert.resolvedAt), "MMM dd, yyyy HH:mm")}</p>
                  </div>
                )}
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsViewDialogOpen(false)}>
              Close
            </Button>
            {selectedAlert && !selectedAlert.isResolved && (
              <Button onClick={() => handleResolveAlert(selectedAlert.id)}>
                Resolve Alert
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
      </div>
    </LayoutWrapper>
  );
}
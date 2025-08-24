"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { LayoutWrapper } from "@/components/layout/layout-wrapper";
import { useRefresh } from "@/lib/hooks/use-refresh";
import { ShimmerStats, ShimmerChart, ShimmerList } from "@/components/ui/shimmer";
import { toast } from "sonner";
import { 
  Package, 
  ShoppingCart, 
  BarChart3, 
  Users, 
  Settings, 
  Bell,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  CheckCircle,
  Clock,
  DollarSign,
  Activity,
  Plus,
  MoreHorizontal,
  Eye,
  Edit,
  Trash2,
  RefreshCw,
  Filter,
  Download,
  Search
} from "lucide-react";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { cn } from "@/lib/utils";

// Dashboard data interfaces
interface DashboardStats {
  totalProducts: number;
  totalSales: number;
  activeUsers: number;
  revenue: number;
  productChange: string;
  salesChange: string;
  usersChange: string;
  revenueChange: string;
}

interface SalesData {
  name: string;
  sales: number;
  revenue: number;
}

interface StockData {
  name: string;
  stock: number;
  min: number;
  max: number;
}

interface CategoryData {
  name: string;
  value: number;
  fill: string;
}

interface Activity {
  id: number;
  type: "sale" | "stock" | "transfer" | "alert";
  user: string;
  item: string;
  quantity: number;
  time: string;
}

interface LowStockItem {
  id: number;
  name: string;
  current: number;
  min: number;
  category: string;
}

interface Alert {
  id: number;
  type: string;
  message: string;
  severity: "high" | "medium" | "low";
  time: string;
}

// Mock data for dashboard (will be replaced with API calls)
const mockSalesData: SalesData[] = [
  { name: "Jan", sales: 4000, revenue: 2400 },
  { name: "Feb", sales: 3000, revenue: 1398 },
  { name: "Mar", sales: 2000, revenue: 9800 },
  { name: "Apr", sales: 2780, revenue: 3908 },
  { name: "May", sales: 1890, revenue: 4800 },
  { name: "Jun", sales: 2390, revenue: 3800 },
];

const mockStockData: StockData[] = [
  { name: "Product A", stock: 400, min: 100, max: 800 },
  { name: "Product B", stock: 300, min: 50, max: 600 },
  { name: "Product C", stock: 200, min: 75, max: 400 },
  { name: "Product D", stock: 278, min: 100, max: 500 },
  { name: "Product E", stock: 189, min: 50, max: 300 },
];

const mockCategoryData: CategoryData[] = [
  { name: "Electronics", value: 35, fill: "#8884d8" },
  { name: "Clothing", value: 25, fill: "#82ca9d" },
  { name: "Food", value: 20, fill: "#ffc658" },
  { name: "Books", value: 12, fill: "#ff7300" },
  { name: "Other", value: 8, fill: "#8dd1e1" },
];

const mockRecentActivities: Activity[] = [
  { id: 1, type: "sale", user: "John Doe", item: "Product A", quantity: 5, time: "2 min ago" },
  { id: 2, type: "stock", user: "Jane Smith", item: "Product B", quantity: 10, time: "5 min ago" },
  { id: 3, type: "transfer", user: "Bob Johnson", item: "Product C", quantity: 3, time: "10 min ago" },
  { id: 4, type: "alert", user: "System", item: "Product D", quantity: 0, time: "15 min ago" },
  { id: 5, type: "sale", user: "Alice Brown", item: "Product E", quantity: 2, time: "20 min ago" },
];

const mockLowStockItems: LowStockItem[] = [
  { id: 1, name: "Product A", current: 5, min: 10, category: "Electronics" },
  { id: 2, name: "Product B", current: 3, min: 15, category: "Clothing" },
  { id: 3, name: "Product C", current: 8, min: 20, category: "Food" },
];

const mockAlerts: Alert[] = [
  { id: 1, type: "low-stock", message: "Product A is running low on stock", severity: "high", time: "2 min ago" },
  { id: 2, type: "expiry", message: "Product B batch expires in 7 days", severity: "medium", time: "1 hour ago" },
  { id: 3, type: "system", message: "System backup completed successfully", severity: "low", time: "2 hours ago" },
];

export default function Dashboard() {
  const [timeRange, setTimeRange] = useState("week");
  const [searchQuery, setSearchQuery] = useState("");
  const [dashboardStats, setDashboardStats] = useState<DashboardStats | null>(null);
  const [salesData, setSalesData] = useState<SalesData[]>([]);
  const [stockData, setStockData] = useState<StockData[]>([]);
  const [categoryData, setCategoryData] = useState<CategoryData[]>([]);
  const [recentActivities, setRecentActivities] = useState<Activity[]>([]);
  const [lowStockItems, setLowStockItems] = useState<LowStockItem[]>([]);
  const [alerts, setAlerts] = useState<Alert[]>([]);

  const { refresh, isRefreshing, showShimmer } = useRefresh({
    onSuccess: () => {
      toast.success("Dashboard data refreshed successfully");
    },
    onError: (error) => {
      toast.error("Failed to refresh dashboard data");
    }
  });

  const fetchDashboardData = async () => {
    try {
      // Simulate API calls - in real implementation, these would be actual API calls
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Set mock data (replace with actual API calls)
      setDashboardStats({
        totalProducts: 1234,
        totalSales: 45678,
        activeUsers: 89,
        revenue: 12345,
        productChange: "+12%",
        salesChange: "+23%",
        usersChange: "+5%",
        revenueChange: "+18%"
      });
      
      setSalesData(mockSalesData);
      setStockData(mockStockData);
      setCategoryData(mockCategoryData);
      setRecentActivities(mockRecentActivities);
      setLowStockItems(mockLowStockItems);
      setAlerts(mockAlerts);
      
    } catch (error) {
      toast.error("Failed to load dashboard data");
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const handleRefresh = () => {
    refresh(fetchDashboardData);
  };

  const stats = dashboardStats ? [
    {
      title: "Total Products",
      value: dashboardStats.totalProducts.toLocaleString(),
      change: dashboardStats.productChange,
      icon: Package,
      color: "text-blue-600",
      bgColor: "bg-blue-50 dark:bg-blue-900/20",
    },
    {
      title: "Total Sales",
      value: `$${dashboardStats.totalSales.toLocaleString()}`,
      change: dashboardStats.salesChange,
      icon: ShoppingCart,
      color: "text-green-600",
      bgColor: "bg-green-50 dark:bg-green-900/20",
    },
    {
      title: "Active Users",
      value: dashboardStats.activeUsers.toString(),
      change: dashboardStats.usersChange,
      icon: Users,
      color: "text-purple-600",
      bgColor: "bg-purple-50 dark:bg-purple-900/20",
    },
    {
      title: "Revenue",
      value: `$${dashboardStats.revenue.toLocaleString()}`,
      change: dashboardStats.revenueChange,
      icon: DollarSign,
      color: "text-orange-600",
      bgColor: "bg-orange-50 dark:bg-orange-900/20",
    },
  ] : [];

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "high": return "bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300";
      case "medium": return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-300";
      case "low": return "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300";
      default: return "bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-300";
    }
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case "sale": return ShoppingCart;
      case "stock": return Package;
      case "transfer": return RefreshCw;
      case "alert": return AlertTriangle;
      default: return Activity;
    }
  };

  const getActivityColor = (type: string) => {
    switch (type) {
      case "sale": return "text-green-600";
      case "stock": return "text-blue-600";
      case "transfer": return "text-purple-600";
      case "alert": return "text-red-600";
      default: return "text-gray-600";
    }
  };

  return (
    <LayoutWrapper 
      title="Dashboard" 
      subtitle="Welcome back! Here's what's happening with your inventory today."
      onRefreshClick={handleRefresh}
      isRefreshing={isRefreshing}
      showShimmer={showShimmer}
      shimmerType="dashboard"
    >
      <div className="max-w-7xl mx-auto space-y-4 sm:space-y-6 px-4 sm:px-0">
        {/* Search and Filter Controls */}
        <div className="flex flex-col space-y-3 sm:space-y-0">
          <div className="flex flex-col space-y-2">
            <div className="relative w-full">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-600 dark:bg-gray-800 dark:border-gray-600 dark:text-white w-full text-sm"
              />
            </div>
            <div className="flex space-x-2 overflow-x-auto pb-1">
              <Button
                variant="outline"
                size="sm"
                className="flex items-center space-x-2 flex-shrink-0 text-xs py-2 px-3"
              >
                <Filter className="w-3 h-3" />
                <span>Filter</span>
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="flex items-center space-x-2 flex-shrink-0 text-xs py-2 px-3"
              >
                <Download className="w-3 h-3" />
                <span>Export</span>
              </Button>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6">
          {stats.map((stat, index) => (
            <Card key={index} className="hover:shadow-lg transition-shadow duration-300">
              <CardContent className="p-3 sm:p-4 lg:p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-300">
                      {stat.title}
                    </p>
                    <p className="text-lg sm:text-2xl font-bold text-gray-900 dark:text-white mt-1">
                      {stat.value}
                    </p>
                    <div className="flex items-center mt-2">
                      <TrendingUp className="w-4 h-4 text-green-600 mr-1" />
                      <span className="text-sm text-green-600">{stat.change}</span>
                    </div>
                  </div>
                  <div className={cn("p-2 sm:p-3 rounded-full", stat.bgColor)}>
                    <stat.icon className={cn("w-5 h-5 sm:w-6 sm:h-6", stat.color)} />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
          {/* Sales Chart */}
          <Card>
            <CardHeader className="pb-2 sm:pb-4 lg:pb-6">
              <CardTitle className="flex flex-col space-y-2 sm:space-y-0">
                <span className="flex items-center text-sm sm:text-base">
                  <BarChart3 className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
                  <span className="truncate">Sales Overview</span>
                </span>
                <div className="flex flex-wrap gap-1">
                  <Button
                    variant={timeRange === "week" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setTimeRange("week")}
                    className="text-xs px-2 py-1"
                  >
                    Week
                  </Button>
                  <Button
                    variant={timeRange === "month" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setTimeRange("month")}
                    className="text-xs px-2 py-1"
                  >
                    Month
                  </Button>
                  <Button
                    variant={timeRange === "year" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setTimeRange("year")}
                    className="text-xs px-2 py-1"
                  >
                    Year
                  </Button>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0 sm:pt-0">
              <div className="h-40 sm:h-48 lg:h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={salesData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <RechartsTooltip />
                    <Legend />
                    <Line type="monotone" dataKey="sales" stroke="#8884d8" strokeWidth={2} />
                    <Line type="monotone" dataKey="revenue" stroke="#82ca9d" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Stock Levels Chart */}
          <Card>
            <CardHeader className="pb-2 sm:pb-4 lg:pb-6">
              <CardTitle className="flex items-center text-sm sm:text-base">
                <Package className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
                <span className="truncate">Stock Levels</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0 sm:pt-0">
              <div className="h-40 sm:h-48 lg:h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={stockData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <RechartsTooltip />
                    <Legend />
                    <Bar dataKey="stock" fill="#8884d8" />
                    <Bar dataKey="min" fill="#82ca9d" />
                    <Bar dataKey="max" fill="#ffc658" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Bottom Row */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
          {/* Recent Activities */}
          <Card className="lg:col-span-2">
            <CardHeader className="pb-2 sm:pb-4 lg:pb-6">
              <CardTitle className="flex flex-col space-y-2 sm:space-y-0">
                <span className="flex items-center text-sm sm:text-base">
                  <Activity className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
                  <span className="truncate">Recent Activities</span>
                </span>
                <Button variant="outline" size="sm" className="text-xs px-2 py-1 w-fit">
                  View All
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0 sm:pt-0">
              <div className="space-y-2 sm:space-y-3 max-h-80 overflow-y-auto">
                {recentActivities.map((activity) => {
                  const Icon = getActivityIcon(activity.type);
                  return (
                    <div key={activity.id} className="flex items-start space-x-2 sm:space-x-3 p-2 sm:p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                      <div className={cn("p-1.5 sm:p-2 rounded-full bg-gray-100 dark:bg-gray-800 flex-shrink-0")}>
                        <Icon className={cn("w-3 h-3 sm:w-4 sm:h-4", getActivityColor(activity.type))} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs sm:text-sm font-medium text-gray-900 dark:text-white truncate">
                          {activity.user} {activity.type === "sale" ? "sold" : activity.type === "stock" ? "added stock to" : activity.type === "transfer" ? "transferred" : "alerted about"} {activity.item}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {activity.quantity} {activity.type === "sale" ? "units sold" : activity.type === "stock" ? "units added" : activity.type === "transfer" ? "units transferred" : "units remaining"} • {activity.time}
                        </p>
                      </div>
                      <Button variant="ghost" size="sm" className="flex-shrink-0 p-1">
                        <MoreHorizontal className="w-3 h-3 sm:w-4 sm:h-4" />
                      </Button>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Alerts */}
          <Card>
            <CardHeader className="pb-2 sm:pb-4 lg:pb-6">
              <CardTitle className="flex items-center justify-between text-sm sm:text-base">
                <span className="flex items-center">
                  <Bell className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
                  <span className="truncate">Alerts</span>
                </span>
                <Badge variant="destructive" className="text-xs px-2 py-1">{alerts.length}</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0 sm:pt-0">
              <div className="space-y-2 sm:space-y-3 max-h-80 overflow-y-auto">
                {alerts.map((alert) => (
                  <div key={alert.id} className="p-2 sm:p-3 rounded-lg border border-gray-200 dark:border-gray-700">
                    <div className="flex items-start space-x-2 sm:space-x-3">
                      <AlertTriangle className="w-3 h-3 sm:w-4 sm:h-4 text-yellow-600 mt-0.5 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs sm:text-sm font-medium text-gray-900 dark:text-white">
                          {alert.message}
                        </p>
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mt-1 sm:mt-2 space-y-1 sm:space-y-0">
                          <Badge className={getSeverityColor(alert.severity) + " text-xs"}>
                            {alert.severity}
                          </Badge>
                          <span className="text-xs text-gray-500 dark:text-gray-400">
                            {alert.time}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Additional Info Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
          {/* Low Stock Items */}
          <Card>
            <CardHeader className="pb-2 sm:pb-4 lg:pb-6">
              <CardTitle className="flex items-center text-sm sm:text-base">
                <AlertTriangle className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
                <span className="truncate">Low Stock Items</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0 sm:pt-0">
              <div className="space-y-2 sm:space-y-3 max-h-80 overflow-y-auto">
                {lowStockItems.map((item) => (
                  <div key={item.id} className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-2 sm:p-3 rounded-lg bg-red-50 dark:bg-red-900/20 space-y-1 sm:space-y-0">
                    <div className="flex-1 min-w-0">
                      <p className="text-xs sm:text-sm font-medium text-gray-900 dark:text-white truncate">
                        {item.name}
                      </p>
                      <p className="text-xs text-gray-600 dark:text-gray-300">
                        {item.category}
                      </p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="text-xs sm:text-sm font-medium text-red-600">
                        {item.current} left
                      </p>
                      <p className="text-xs text-gray-500">
                        Min: {item.min}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Category Distribution */}
          <Card>
            <CardHeader className="pb-2 sm:pb-4 lg:pb-6">
              <CardTitle className="flex items-center text-sm sm:text-base">
                <PieChart className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
                <span className="truncate">Category Distribution</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0 sm:pt-0">
              <div className="h-40 sm:h-48 lg:h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={categoryData}
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    >
                      {categoryData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.fill} />
                      ))}
                    </Pie>
                    <RechartsTooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </LayoutWrapper>
  );
}
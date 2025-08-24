"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { Label } from "@/components/ui/label";
import { Calendar } from "@/components/ui/calendar";
import { 
  Popover, 
  PopoverContent, 
  PopoverTrigger 
} from "@/components/ui/popover";
import { 
  BarChart3, 
  PieChart as PieChartIcon, 
  TrendingUp, 
  Package, 
  ShoppingCart, 
  AlertTriangle, 
  Download, 
  Filter,
  Calendar as CalendarIcon,
  FileText,
  DollarSign,
  Users,
  Activity
} from "lucide-react";
import { format, subDays, startOfDay, endOfDay } from "date-fns";
import { toast } from "sonner";
import { LayoutWrapper } from "@/components/layout/layout-wrapper";
import { useI18n } from "@/lib/i18n/context";
import { useRefresh } from "@/lib/hooks/use-refresh";
import { VirtualizedTable } from "@/components/ui/virtualized-table";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

interface ReportData {
  stockLevels: Array<{
    product: {
      id: string;
      name: string;
      sku?: string;
      category: {
        name: string;
      };
    };
    totalStock: number;
    totalValue: number;
    lowStock: boolean;
  }>;
  salesData: Array<{
    date: string;
    totalSales: number;
    totalRevenue: number;
    transactionCount: number;
  }>;
  lowStockItems: Array<{
    product: {
      id: string;
      name: string;
      sku?: string;
      category: {
        name: string;
      };
    };
    currentStock: number;
    minStock: number;
    location: {
      name: string;
    };
  }>;
  topProducts: Array<{
    product: {
      id: string;
      name: string;
      sku?: string;
    };
    totalSold: number;
    totalRevenue: number;
  }>;
  categoryPerformance: Array<{
    category: {
      id: string;
      name: string;
    };
    totalRevenue: number;
    totalSold: number;
  }>;
}

export default function ReportsPage() {
  const { t } = useI18n();
  const [reportData, setReportData] = useState<ReportData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [dateRange, setDateRange] = useState<{
    from: Date;
    to: Date;
  }>({
    from: subDays(new Date(), 30),
    to: new Date(),
  });
  const [reportType, setReportType] = useState("overview");
  const [selectedCategory, setSelectedCategory] = useState("all");

  // Refresh functionality
  const { refresh, isRefreshing } = useRefresh({
    onSuccess: () => {
      toast.success("Reports data refreshed successfully");
    },
    onError: (error) => {
      toast.error("Failed to refresh reports data");
    }
  });

  const handleRefresh = () => {
    refresh(fetchReportData);
  };
  
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
    fetchReportData();
  }, [dateRange, reportType, selectedCategory, pagination.page, pagination.limit]);

  // Reset pagination when filters or items per page change
  useEffect(() => {
    setPagination(prev => ({ ...prev, page: 1 }));
  }, [dateRange, reportType, selectedCategory, pagination.limit]);

  const fetchReportData = async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams({
        from: dateRange.from.toISOString(),
        to: dateRange.to.toISOString(),
        reportType,
        category: selectedCategory,
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
      });

      const response = await fetch(`/api/reports?${params}`);
      if (response.ok) {
        const data = await response.json();
        setReportData(data);
        
        // Set pagination info if available
        if (data.pagination) {
          setPaginationInfo(data.pagination);
        } else {
          // Calculate pagination info based on stock levels data
          const stockLevelsCount = data.stockLevels?.length || 0;
          setPaginationInfo({
            page: pagination.page,
            totalPages: Math.ceil(stockLevelsCount / pagination.limit),
            total: stockLevelsCount,
            hasNext: stockLevelsCount === pagination.limit,
            hasPrev: pagination.page > 1,
          });
        }
      } else {
        toast.error("Failed to fetch report data");
      }
    } catch (error) {
      toast.error("An error occurred while fetching report data");
    } finally {
      setIsLoading(false);
    }
  };

  const exportReport = async (format: 'csv' | 'pdf') => {
    try {
      const params = new URLSearchParams({
        from: dateRange.from.toISOString(),
        to: dateRange.to.toISOString(),
        reportType,
        category: selectedCategory,
        format,
      });

      const response = await fetch(`/api/reports/export?${params}`);
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `report-${reportType}-${format}.${format}`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        toast.success(`Report exported as ${format.toUpperCase()}`);
      } else {
        toast.error("Failed to export report");
      }
    } catch (error) {
      toast.error("An error occurred while exporting report");
    }
  };

  const totalStockValue = reportData?.stockLevels.reduce((sum, item) => sum + item.totalValue, 0) || 0;
  const totalRevenue = reportData?.salesData.reduce((sum, item) => sum + item.totalRevenue, 0) || 0;
  const totalTransactions = reportData?.salesData.reduce((sum, item) => sum + item.transactionCount, 0) || 0;
  const lowStockCount = reportData?.lowStockItems.length || 0;

  // Chart colors
  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D'];

  // Prepare data for charts
  const salesTrendData = reportData?.salesData.map(item => ({
    date: new Date(item.date).toLocaleDateString(),
    revenue: item.totalRevenue,
    transactions: item.transactionCount,
    sales: item.totalSales,
  })) || [];

  const categoryPerformanceData = reportData?.categoryPerformance.map(item => ({
    name: item.category.name,
    revenue: item.totalRevenue,
    sold: item.totalSold,
  })) || [];

  const stockStatusData = [
    { name: 'In Stock', value: reportData?.stockLevels.filter(item => !item.lowStock).length || 0 },
    { name: 'Low Stock', value: reportData?.stockLevels.filter(item => item.lowStock).length || 0 },
  ];

  // Ensure charts have data
  const hasChartData = salesTrendData.length > 0 || categoryPerformanceData.length > 0 || stockStatusData.some(item => item.value > 0);

  return (
    <LayoutWrapper
      title="Reports & Analytics"
      subtitle="Generate and view detailed reports on inventory, sales, and performance"
      showNewButton={false}
      onRefreshClick={handleRefresh}
      isRefreshing={isRefreshing}
    >
      <div className="space-y-6">
        {/* Filters */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Filter className="w-5 h-5 mr-2 text-yellow-600" />
              Report Filters
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6">
              <div className="space-y-2">
                <Label>Report Type</Label>
                <Select value={reportType} onValueChange={setReportType}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="overview">Overview</SelectItem>
                    <SelectItem value="sales">Sales Analysis</SelectItem>
                    <SelectItem value="stock">Stock Levels</SelectItem>
                    <SelectItem value="lowstock">Low Stock Items</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Category</Label>
                <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Categories</SelectItem>
                    <SelectItem value="electronics">Electronics</SelectItem>
                    <SelectItem value="clothing">Clothing</SelectItem>
                    <SelectItem value="food">Food & Beverages</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>From Date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-full">
                      <CalendarIcon className="w-4 h-4 mr-2" />
                      {format(dateRange.from, "MMM dd, yyyy")}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={dateRange.from}
                      onSelect={(date) => {
                        if (date) {
                          setDateRange(prev => ({ ...prev, from: startOfDay(date) }));
                        }
                      }}
                    />
                  </PopoverContent>
                </Popover>
              </div>

              <div className="space-y-2">
                <Label>To Date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-full">
                      <CalendarIcon className="w-4 h-4 mr-2" />
                      {format(dateRange.to, "MMM dd, yyyy")}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={dateRange.to}
                      onSelect={(date) => {
                        if (date) {
                          setDateRange(prev => ({ ...prev, to: endOfDay(date) }));
                        }
                      }}
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>
          </CardContent>
        </Card>
        
        {/* Summary Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Stock Value</p>
                  <p className="text-2xl font-bold">${totalStockValue.toLocaleString()}</p>
                  <p className="text-sm text-green-600">+5% from last month</p>
                </div>
                <Package className="w-8 h-8 text-yellow-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Revenue</p>
                  <p className="text-2xl font-bold">${totalRevenue.toLocaleString()}</p>
                  <p className="text-sm text-green-600">+12% from last period</p>
                </div>
                <DollarSign className="w-8 h-8 text-yellow-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Transactions</p>
                  <p className="text-2xl font-bold">{totalTransactions}</p>
                  <p className="text-sm text-blue-600">+8% from last period</p>
                </div>
                <Activity className="w-8 h-8 text-yellow-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Low Stock Items</p>
                  <p className="text-2xl font-bold">{lowStockCount}</p>
                  <p className="text-sm text-red-600">Requires attention</p>
                </div>
                <AlertTriangle className="w-8 h-8 text-yellow-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900"></div>
          </div>
        ) : (
          <>
            {/* Stock Levels Report */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Package className="w-5 h-5 mr-2 text-yellow-600" />
                  Stock Levels Report
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                    <div>
                      <h4 className="font-semibold mb-4">Stock by Category</h4>
                      <div className="space-y-3">
                        {reportData?.categoryPerformance.slice(0, 5).map((category, index) => (
                          <div key={category.category.id} className="flex items-center justify-between">
                            <div className="flex items-center space-x-2">
                              <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                              <span className="text-sm font-medium">{category.category.name}</span>
                            </div>
                            <span className="text-sm">${category.totalRevenue.toLocaleString()}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div>
                      <h4 className="font-semibold mb-4">Low Stock Items</h4>
                      <div className="space-y-3 max-h-48 overflow-y-auto">
                        {reportData?.lowStockItems.slice(0, 5).map((item, index) => (
                          <div key={item.product.id} className="flex items-center justify-between p-2 bg-red-50 rounded">
                            <div>
                              <p className="text-sm font-medium">{item.product.name}</p>
                              <p className="text-xs text-gray-600">{item.location.name}</p>
                            </div>
                            <div className="text-right">
                              <p className="text-sm font-medium text-red-600">
                                {item.currentStock} / {item.minStock}
                              </p>
                              <p className="text-xs text-gray-600">
                                {item.minStock - item.currentStock} needed
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-semibold mb-4">Complete Stock Inventory</h4>
                    <div className="overflow-x-auto">
                      <VirtualizedTable
                        data={reportData?.stockLevels || []}
                        loading={isLoading}
                        pagination={{
                          page: paginationInfo.page,
                          totalPages: paginationInfo.totalPages,
                          total: paginationInfo.total,
                          limit: pagination.limit,
                          onPageChange: (page) => setPagination(prev => ({ ...prev, page })),
                          onItemsPerPageChange: (limit) => setPagination(prev => ({ ...prev, limit, page: 1 }))
                        }}
                        columns={[
                          {
                            key: "product",
                            header: "Product",
                            render: (value: string, item: any) => (
                              <span className="font-medium">{item.product.name}</span>
                            )
                          },
                          {
                            key: "sku",
                            header: "SKU",
                            render: (value: string, item: any) => item.product.sku || '-'
                          },
                          {
                            key: "category",
                            header: "Category",
                            render: (value: string, item: any) => item.product.category.name
                          },
                          {
                            key: "totalStock",
                            header: "Total Stock",
                            render: (value: string, item: any) => item.totalStock
                          },
                          {
                            key: "stockValue",
                            header: "Stock Value",
                            render: (value: string, item: any) => `$${item.totalValue.toLocaleString()}`
                          },
                          {
                            key: "status",
                            header: "Status",
                            render: (value: string, item: any) => (
                              item.lowStock ? (
                                <Badge variant="destructive">Low Stock</Badge>
                              ) : (
                                <Badge variant="default">In Stock</Badge>
                              )
                            )
                          }
                        ]}
                      />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Sales Performance Report */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <TrendingUp className="w-5 h-5 mr-2 text-yellow-600" />
                  Sales Performance Report
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-8">
                  {/* Sales Trend Chart */}
                  <div>
                    <h4 className="font-semibold mb-4">Sales Trend</h4>
                    <div className="h-80 gray-bg-dark-mode rounded-lg border">
                      {salesTrendData.length > 0 ? (
                        <ResponsiveContainer width="100%" height="100%">
                          <LineChart data={salesTrendData}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="date" />
                            <YAxis yAxisId="left" />
                            <YAxis yAxisId="right" orientation="right" />
                            <Tooltip 
                              formatter={(value, name) => [
                                name === 'revenue' ? `$${Number(value).toLocaleString()}` : value,
                                name === 'revenue' ? 'Revenue' : name === 'transactions' ? 'Transactions' : 'Sales'
                              ]}
                            />
                            <Legend />
                            <Line 
                              yAxisId="left"
                              type="monotone" 
                              dataKey="revenue" 
                              stroke="#8884d8" 
                              strokeWidth={2}
                              name="Revenue"
                            />
                            <Line 
                              yAxisId="right"
                              type="monotone" 
                              dataKey="transactions" 
                              stroke="#82ca9d" 
                              strokeWidth={2}
                              name="Transactions"
                            />
                          </LineChart>
                        </ResponsiveContainer>
                      ) : (
                        <div className="flex items-center justify-center h-full text-gray-500">
                          <div className="text-center">
                            <TrendingUp className="w-12 h-12 mx-auto mb-2 text-yellow-600" />
                            <p>No sales data available</p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* Category Performance Chart */}
                    <div>
                      <h4 className="font-semibold mb-4">Category Performance</h4>
                      <div className="h-64 gray-bg-dark-mode rounded-lg border">
                        {categoryPerformanceData.length > 0 ? (
                          <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={categoryPerformanceData}>
                              <CartesianGrid strokeDasharray="3 3" />
                              <XAxis dataKey="name" />
                              <YAxis />
                              <Tooltip formatter={(value) => [`$${Number(value).toLocaleString()}`, 'Revenue']} />
                              <Legend />
                              <Bar dataKey="revenue" fill="#8884d8" name="Revenue" />
                            </BarChart>
                          </ResponsiveContainer>
                        ) : (
                          <div className="flex items-center justify-center h-full text-gray-500">
                            <div className="text-center">
                              <BarChart3 className="w-12 h-12 mx-auto mb-2 text-yellow-600" />
                              <p>No category data available</p>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Stock Status Pie Chart */}
                    <div>
                      <h4 className="font-semibold mb-4">Stock Status Distribution</h4>
                      <div className="h-64 gray-bg-dark-mode rounded-lg border">
                        {stockStatusData.some(item => item.value > 0) ? (
                          <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                              <Pie
                                data={stockStatusData}
                                cx="50%"
                                cy="50%"
                                labelLine={false}
                                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                                outerRadius={80}
                                fill="#8884d8"
                                dataKey="value"
                              >
                                {stockStatusData.map((entry, index) => (
                                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                ))}
                              </Pie>
                              <Tooltip formatter={(value) => [value, 'Products']} />
                              <Legend />
                            </PieChart>
                          </ResponsiveContainer>
                        ) : (
                          <div className="flex items-center justify-center h-full text-gray-500">
                            <div className="text-center">
                              <PieChartIcon className="w-12 h-12 mx-auto mb-2 text-yellow-600" />
                              <p>No stock data available</p>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Top Selling Products */}
                  <div>
                    <h4 className="font-semibold mb-4">Top Selling Products</h4>
                    <div className="space-y-3">
                      {reportData?.topProducts.slice(0, 5).map((product, index) => (
                        <div key={product.product.id} className="flex items-center justify-between p-3 bg-green-50 rounded">
                          <div className="flex items-center space-x-3">
                            <div className="w-8 h-8 rounded-full bg-green-200 flex items-center justify-center">
                              <span className="text-sm font-bold text-green-800">{index + 1}</span>
                            </div>
                            <div>
                              <p className="font-medium">{product.product.name}</p>
                              <p className="text-sm text-gray-600">{product.product.sku}</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="font-bold">${product.totalRevenue.toLocaleString()}</p>
                            <p className="text-sm text-gray-600">{product.totalSold} sold</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Export Options */}
                  <div>
                    <h4 className="font-semibold mb-4">Export Options</h4>
                    <div className="flex space-x-4">
                      <Button 
                        variant="outline" 
                        onClick={() => exportReport('csv')}
                      >
                        <Download className="w-4 h-4 mr-2 text-yellow-600" />
                        Export as CSV
                      </Button>
                      <Button 
                        variant="outline" 
                        onClick={() => exportReport('pdf')}
                      >
                        <Download className="w-4 h-4 mr-2 text-yellow-600" />
                        Export as PDF
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </LayoutWrapper>
  );
}


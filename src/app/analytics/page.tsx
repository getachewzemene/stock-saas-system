'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Calendar, Download, TrendingUp, TrendingDown, Package, DollarSign, BarChart3, Target, Activity, Settings } from 'lucide-react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart as RechartsPieChart, Pie, Cell, Legend, BarChart, Bar, AreaChart, Area, ScatterChart, Scatter } from 'recharts'
import { PieChart as PieChartIcon } from 'lucide-react'
import { LayoutWrapper } from '@/components/layout/layout-wrapper'
import { useI18n } from '@/lib/i18n/context'
import { useRefresh } from '@/lib/hooks/use-refresh'
import { useAnalytics, useApiMutation } from '@/lib/api/hooks'
import { LoadingCard } from '@/components/ui/loading'
import { toast } from 'sonner'

// Define interfaces
interface MetricCard {
  title: string
  value: string
  change: string
  changeType: 'increase' | 'decrease'
  icon: React.ReactNode
}

interface SalesData {
  date: string
  sales: number
}

interface CategoryData {
  name: string
  value: number
  color: string
}

interface ProfitabilityData {
  category: string
  revenue: number
  cost: number
  profit: number
  margin: number
}

interface ForecastingData {
  period: string
  actual: number | null
  forecast: number
  confidence: number
}

interface TrendsData {
  date: string
  sales: number
  inventory: number
  orders: number
}

interface CustomReport {
  id: string
  name: string
  type: string
  lastRun: string
  schedule: string
}

interface AnalyticsResponse {
  metrics: {
    totalRevenue: {
      value: number
      change: number
      changeType: 'increase' | 'decrease'
    }
    profitMargin: {
      value: number
      change: number
      changeType: 'increase' | 'decrease'
    }
    inventoryValue: {
      value: number
      change: number
      changeType: 'increase' | 'decrease'
    }
    productsSold: {
      value: number
      change: number
      changeType: 'increase' | 'decrease'
    }
  }
  salesData: SalesData[]
  categoryData: CategoryData[]
  profitabilityData: ProfitabilityData[]
  forecastingData: ForecastingData[]
  trendsData: TrendsData[]
  customReports: CustomReport[]
  period: {
    startDate: string
    endDate: string
  }
}

export default function AnalyticsPage() {
  const { t } = useI18n()
  const [dateRange, setDateRange] = useState<string>('Aug 01 - Aug 31')
  const [metrics, setMetrics] = useState<MetricCard[]>([])
  const [salesData, setSalesData] = useState<SalesData[]>([])
  const [categoryData, setCategoryData] = useState<CategoryData[]>([])
  const [profitabilityData, setProfitabilityData] = useState<ProfitabilityData[]>([])
  const [forecastingData, setForecastingData] = useState<ForecastingData[]>([])
  const [trendsData, setTrendsData] = useState<TrendsData[]>([])
  const [customReports, setCustomReports] = useState<CustomReport[]>([])
  const [activeTab, setActiveTab] = useState<string>('overview')
  const [isClient, setIsClient] = useState<boolean>(false)

  // Refresh functionality
  const { refresh, isRefreshing } = useRefresh({
    onSuccess: () => {
      toast.success("Analytics data refreshed successfully");
    },
    onError: (error) => {
      toast.error("Failed to refresh analytics data");
    }
  })

  const handleRefresh = () => {
    refresh();
  }

  // Use TanStack Query for analytics data
  const { data: analyticsData, isLoading: analyticsLoading } = useAnalytics({
    startDate: '2024-08-01',
    endDate: '2024-08-31',
    tab: activeTab
  })

  // Export mutation
  const exportMutation = useApiMutation(
    "/analytics/export",
    "POST"
  )

  // Fix hydration issue by only running client-side
  useEffect(() => {
    setIsClient(true)
  }, [])

  // Process analytics data when it changes
  useEffect(() => {
    if (analyticsData && isClient) {
      // Format metrics for display
      const formattedMetrics: MetricCard[] = [
        {
          title: 'Total Revenue',
          value: `$${analyticsData.metrics.totalRevenue.value.toLocaleString()}`,
          change: `${analyticsData.metrics.totalRevenue.change > 0 ? '+' : ''}${analyticsData.metrics.totalRevenue.change}%`,
          changeType: analyticsData.metrics.totalRevenue.changeType,
          icon: <DollarSign className="h-4 w-4 text-muted-foreground" />
        },
        {
          title: 'Profit Margin',
          value: `${analyticsData.metrics.profitMargin.value}%`,
          change: `${analyticsData.metrics.profitMargin.change > 0 ? '+' : ''}${analyticsData.metrics.profitMargin.change}%`,
          changeType: analyticsData.metrics.profitMargin.changeType,
          icon: <TrendingUp className="h-4 w-4 text-muted-foreground" />
        },
        {
          title: 'Inventory Value',
          value: `$${analyticsData.metrics.inventoryValue.value.toLocaleString()}`,
          change: `${analyticsData.metrics.inventoryValue.change > 0 ? '+' : ''}${analyticsData.metrics.inventoryValue.change}%`,
          changeType: analyticsData.metrics.inventoryValue.changeType,
          icon: <Package className="h-4 w-4 text-muted-foreground" />
        },
        {
          title: 'Products Sold',
          value: analyticsData.metrics.productsSold.value.toLocaleString(),
          change: `${analyticsData.metrics.productsSold.change > 0 ? '+' : ''}${analyticsData.metrics.productsSold.change}%`,
          changeType: analyticsData.metrics.productsSold.changeType,
          icon: <TrendingUp className="h-4 w-4 text-muted-foreground" />
        }
      ]

      setMetrics(formattedMetrics)
      
      // Only set data that exists in the response
      if (analyticsData.salesData) setSalesData(analyticsData.salesData)
      if (analyticsData.categoryData) setCategoryData(analyticsData.categoryData)
      if (analyticsData.profitabilityData) setProfitabilityData(analyticsData.profitabilityData)
      if (analyticsData.forecastingData) setForecastingData(analyticsData.forecastingData)
      if (analyticsData.trendsData) setTrendsData(analyticsData.trendsData)
      if (analyticsData.customReports) setCustomReports(analyticsData.customReports)
      
      // Update date range display - use consistent formatting
      const startDate = new Date(analyticsData.period.startDate)
      const endDate = new Date(analyticsData.period.endDate)
      const formattedRange = `${startDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${endDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`
      setDateRange(formattedRange)
    } else if (isClient && !analyticsLoading) {
      // Fallback to demo data
      const demoMetrics: MetricCard[] = [
        {
          title: 'Total Revenue',
          value: '$1,284,500',
          change: '+15.2%',
          changeType: 'increase',
          icon: <DollarSign className="h-4 w-4 text-muted-foreground" />
        },
        {
          title: 'Profit Margin',
          value: '23.8%',
          change: '+2.1%',
          changeType: 'increase',
          icon: <TrendingUp className="h-4 w-4 text-muted-foreground" />
        },
        {
          title: 'Inventory Value',
          value: '$456,890',
          change: '-5.3%',
          changeType: 'decrease',
          icon: <Package className="h-4 w-4 text-muted-foreground" />
        },
        {
          title: 'Products Sold',
          value: '12,543',
          change: '+8.7%',
          changeType: 'increase',
          icon: <TrendingUp className="h-4 w-4 text-muted-foreground" />
        }
      ]

      const demoSalesData: SalesData[] = [
        { date: 'Aug 01', sales: 42000 },
        { date: 'Aug 05', sales: 38000 },
        { date: 'Aug 10', sales: 45000 },
        { date: 'Aug 15', sales: 52000 },
        { date: 'Aug 20', sales: 48000 },
        { date: 'Aug 25', sales: 55000 },
        { date: 'Aug 31', sales: 58000 }
      ]

      const demoCategoryData: CategoryData[] = [
        { name: 'Electronics', value: 35, color: '#8884d8' },
        { name: 'Clothing', value: 25, color: '#82ca9d' },
        { name: 'Food & Beverage', value: 20, color: '#ffc658' },
        { name: 'Home & Garden', value: 12, color: '#ff7300' },
        { name: 'Sports', value: 8, color: '#00ff00' }
      ]

      const demoProfitabilityData: ProfitabilityData[] = [
        { category: 'Electronics', revenue: 450000, cost: 315000, profit: 135000, margin: 30 },
        { category: 'Clothing', revenue: 320000, cost: 224000, profit: 96000, margin: 30 },
        { category: 'Food & Beverage', revenue: 256000, cost: 179200, profit: 76800, margin: 30 },
        { category: 'Home & Garden', revenue: 154000, cost: 107800, profit: 46200, margin: 30 },
        { category: 'Sports', revenue: 104500, cost: 73150, profit: 31350, margin: 30 }
      ]

      const demoForecastingData: ForecastingData[] = [
        { period: 'Sep 1', actual: 58000, forecast: 59500, confidence: 85 },
        { period: 'Sep 8', actual: null, forecast: 61000, confidence: 82 },
        { period: 'Sep 15', actual: null, forecast: 62500, confidence: 80 },
        { period: 'Sep 22', actual: null, forecast: 64000, confidence: 78 },
        { period: 'Sep 29', actual: null, forecast: 65500, confidence: 75 }
      ]

      const demoTrendsData: TrendsData[] = [
        { date: 'Jul 1', sales: 35000, inventory: 520000, orders: 145 },
        { date: 'Jul 15', sales: 38000, inventory: 495000, orders: 158 },
        { date: 'Aug 1', sales: 42000, inventory: 468000, orders: 172 },
        { date: 'Aug 15', sales: 52000, inventory: 442000, orders: 195 },
        { date: 'Aug 31', sales: 58000, inventory: 415000, orders: 210 }
      ]

      const demoCustomReports: CustomReport[] = [
        { id: '1', name: 'Monthly Sales Summary', type: 'Sales', lastRun: '2024-08-31', schedule: 'Monthly' },
        { id: '2', name: 'Inventory Health Report', type: 'Inventory', lastRun: '2024-08-30', schedule: 'Weekly' },
        { id: '3', name: 'Profit Analysis', type: 'Financial', lastRun: '2024-08-29', schedule: 'Monthly' },
        { id: '4', name: 'Customer Behavior', type: 'Marketing', lastRun: '2024-08-28', schedule: 'Quarterly' }
      ]

      setMetrics(demoMetrics)
      setSalesData(demoSalesData)
      setCategoryData(demoCategoryData)
      setProfitabilityData(demoProfitabilityData)
      setForecastingData(demoForecastingData)
      setTrendsData(demoTrendsData)
      setCustomReports(demoCustomReports)
    }
  }, [analyticsData, isClient, analyticsLoading])

  const handleExport = () => {
    exportMutation.mutate({
      format: 'csv',
      startDate: '2024-08-01',
      endDate: '2024-08-31'
    })
  }

  // Show loading state during server rendering or while loading data
  if (!isClient || analyticsLoading) {
    return (
      <LayoutWrapper 
        title="Advanced Analytics" 
        subtitle="Real-time analysis and predictions"
        onRefreshClick={handleRefresh}
        isRefreshing={isRefreshing}
        shimmerType="chart"
      >
        <div className="space-y-6">
          {/* Header */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div></div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" disabled>
                <Calendar className="mr-2 h-4 w-4" />
                Loading...
              </Button>
              <Button size="sm" disabled>
                <Download className="mr-2 h-4 w-4" />
                Export
              </Button>
            </div>
          </div>

          {/* Loading skeleton for tabs */}
          <div className="space-y-4">
            <div className="grid grid-cols-5 gap-2">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-10 bg-gray-200 rounded-lg animate-pulse"></div>
              ))}
            </div>
            
            {/* Loading skeleton for metrics */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <LoadingCard count={4} />
            </div>

            {/* Loading skeleton for charts */}
            <div className="grid gap-6 md:grid-cols-2">
              {[...Array(2)].map((_, i) => (
                <Card key={i}>
                  <CardContent className="p-6">
                    <div className="h-64 bg-gray-200 rounded animate-pulse"></div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </LayoutWrapper>
    )
  }

  return (
    <LayoutWrapper 
      title="Advanced Analytics" 
      subtitle="Real-time analysis and predictions"
      onRefreshClick={handleRefresh}
      isRefreshing={isRefreshing}
      shimmerType="chart"
    >
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            {/* Title is now handled by LayoutWrapper */}
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm">
              <Calendar className="mr-2 h-4 w-4" />
              {dateRange}
            </Button>
            <Button onClick={handleExport} size="sm" disabled={exportMutation.isPending}>
              <Download className="mr-2 h-4 w-4" />
              {exportMutation.isPending ? "Exporting..." : "Export"}
            </Button>
          </div>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <div className="relative w-full overflow-x-auto">
            <TabsList className="flex w-max min-w-full bg-muted p-1 rounded-lg">
              <TabsTrigger value="overview" className="flex-shrink-0 px-3 py-2 text-xs data-[state=active]:bg-background data-[state=active]:shadow-sm min-w-[80px] sm:min-w-[100px] md:min-w-[120px]">
                <BarChart3 className="h-4 w-4 mr-1" />
                Overview
              </TabsTrigger>
              <TabsTrigger value="profitability" className="flex-shrink-0 px-3 py-2 text-xs data-[state=active]:bg-background data-[state=active]:shadow-sm min-w-[90px] sm:min-w-[110px] md:min-w-[140px]">
                <Target className="h-4 w-4 mr-1" />
                Profitability
              </TabsTrigger>
              <TabsTrigger value="forecasting" className="flex-shrink-0 px-3 py-2 text-xs data-[state=active]:bg-background data-[state=active]:shadow-sm min-w-[90px] sm:min-w-[110px] md:min-w-[120px]">
                <TrendingUp className="h-4 w-4 mr-1" />
                Forecasting
              </TabsTrigger>
              <TabsTrigger value="trends" className="flex-shrink-0 px-3 py-2 text-xs data-[state=active]:bg-background data-[state=active]:shadow-sm min-w-[70px] sm:min-w-[90px] md:min-w-[100px]">
                <Activity className="h-4 w-4 mr-1" />
                Trends
              </TabsTrigger>
              <TabsTrigger value="custom" className="flex-shrink-0 px-3 py-2 text-xs data-[state=active]:bg-background data-[state=active]:shadow-sm min-w-[60px] sm:min-w-[80px] md:min-w-[100px]">
                <Settings className="h-4 w-4 mr-1" />
                Custom
              </TabsTrigger>
            </TabsList>
          </div>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            {/* Metrics Cards */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              {metrics.map((metric, index) => (
                <Card key={index}>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">{metric.title}</CardTitle>
                    {metric.icon}
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{metric.value}</div>
                    <p className="text-xs text-muted-foreground flex items-center mt-1">
                      {metric.changeType === 'increase' ? (
                        <TrendingUp className="mr-1 h-3 w-3 text-green-500" />
                      ) : (
                        <TrendingDown className="mr-1 h-3 w-3 text-red-500" />
                      )}
                      <span className={metric.changeType === 'increase' ? 'text-green-500' : 'text-red-500'}>
                        {metric.change}
                      </span>
                      <span className="ml-1">from last month</span>
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Charts */}
            <div className="grid gap-6 md:grid-cols-2">
              {/* Sales Performance Chart */}
              <Card>
                <CardHeader>
                  <CardTitle>Sales Performance</CardTitle>
                  <CardDescription>Monthly sales trend</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={salesData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis />
                      <Tooltip />
                      <Line type="monotone" dataKey="sales" stroke="#8884d8" strokeWidth={2} />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Sales by Category Chart */}
              <Card>
                <CardHeader>
                  <CardTitle>Sales by Category</CardTitle>
                  <CardDescription>Distribution across product categories</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <RechartsPieChart>
                      <Pie
                        data={categoryData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {categoryData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip />
                      <Legend />
                    </RechartsPieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Profitability Tab */}
          <TabsContent value="profitability" className="space-y-6">
            {/* Profitability Metrics */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Gross Profit</CardTitle>
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">$385,350</div>
                  <p className="text-xs text-muted-foreground flex items-center mt-1">
                    <TrendingUp className="mr-1 h-3 w-3 text-green-500" />
                    <span className="text-green-500">+12.8%</span>
                    <span className="ml-1">from last month</span>
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Net Profit</CardTitle>
                  <Target className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">$285,712</div>
                  <p className="text-xs text-muted-foreground flex items-center mt-1">
                    <TrendingUp className="mr-1 h-3 w-3 text-green-500" />
                    <span className="text-green-500">+15.3%</span>
                    <span className="ml-1">from last month</span>
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">COGS</CardTitle>
                  <Package className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">$799,150</div>
                  <p className="text-xs text-muted-foreground flex items-center mt-1">
                    <TrendingDown className="mr-1 h-3 w-3 text-red-500" />
                    <span className="text-red-500">-3.2%</span>
                    <span className="ml-1">from last month</span>
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">ROI</CardTitle>
                  <TrendingUp className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">28.5%</div>
                  <p className="text-xs text-muted-foreground flex items-center mt-1">
                    <TrendingUp className="mr-1 h-3 w-3 text-green-500" />
                    <span className="text-green-500">+2.1%</span>
                    <span className="ml-1">from last month</span>
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Profitability by Category */}
            <Card>
              <CardHeader>
                <CardTitle>Profitability by Category</CardTitle>
                <CardDescription>Revenue, cost, and profit analysis by product category</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={400}>
                  <BarChart data={profitabilityData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="category" />
                    <YAxis />
                    <Tooltip formatter={(value) => [`$${value.toLocaleString()}`, '']} />
                    <Legend />
                    <Bar dataKey="revenue" fill="#8884d8" name="Revenue" />
                    <Bar dataKey="cost" fill="#82ca9d" name="Cost" />
                    <Bar dataKey="profit" fill="#ffc658" name="Profit" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Profit Margin Analysis */}
            <div className="grid gap-6 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>Profit Margin by Category</CardTitle>
                  <CardDescription>Percentage breakdown of profit margins</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <RechartsPieChart>
                      <Pie
                        data={profitabilityData.map(item => ({ name: item.category, value: item.margin, color: categoryData.find(c => c.name === item.category)?.color || '#8884d8' }))}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {profitabilityData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={categoryData.find(c => c.name === entry.category)?.color || '#8884d8'} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value) => [`${value}%`, 'Margin']} />
                      <Legend />
                    </RechartsPieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Top Performing Products</CardTitle>
                  <CardDescription>Products with highest profit margins</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="w-2 h-2 rounded-full bg-green-500"></div>
                        <span className="text-sm font-medium">Wireless Headphones</span>
                      </div>
                      <span className="text-sm font-bold">45.2%</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                        <span className="text-sm font-medium">Smart Watch</span>
                      </div>
                      <span className="text-sm font-bold">38.7%</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="w-2 h-2 rounded-full bg-purple-500"></div>
                        <span className="text-sm font-medium">Laptop Stand</span>
                      </div>
                      <span className="text-sm font-bold">35.1%</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="w-2 h-2 rounded-full bg-orange-500"></div>
                        <span className="text-sm font-medium">USB-C Cable</span>
                      </div>
                      <span className="text-sm font-bold">32.8%</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="w-2 h-2 rounded-full bg-red-500"></div>
                        <span className="text-sm font-medium">Phone Case</span>
                      </div>
                      <span className="text-sm font-bold">28.4%</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Forecasting Tab */}
          <TabsContent value="forecasting" className="space-y-6">
            {/* Forecasting Metrics */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Next Month Forecast</CardTitle>
                  <TrendingUp className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">$262,500</div>
                  <p className="text-xs text-muted-foreground flex items-center mt-1">
                    <TrendingUp className="mr-1 h-3 w-3 text-green-500" />
                    <span className="text-green-500">+18.2%</span>
                    <span className="ml-1">predicted growth</span>
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Forecast Accuracy</CardTitle>
                  <Target className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">94.2%</div>
                  <p className="text-xs text-muted-foreground flex items-center mt-1">
                    <TrendingUp className="mr-1 h-3 w-3 text-green-500" />
                    <span className="text-green-500">+2.1%</span>
                    <span className="ml-1">improvement</span>
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Seasonal Trend</CardTitle>
                  <Activity className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">Peak</div>
                  <p className="text-xs text-muted-foreground flex items-center mt-1">
                    <span className="text-orange-500">Holiday season</span>
                    <span className="ml-1">expected</span>
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Inventory Need</CardTitle>
                  <Package className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">+15%</div>
                  <p className="text-xs text-muted-foreground flex items-center mt-1">
                    <span className="text-blue-500">Recommended</span>
                    <span className="ml-1">stock increase</span>
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Sales Forecast Chart */}
            <Card>
              <CardHeader>
                <CardTitle>Sales Forecast</CardTitle>
                <CardDescription>Actual vs predicted sales with confidence intervals</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={400}>
                  <LineChart data={forecastingData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="period" />
                    <YAxis />
                    <Tooltip formatter={(value) => [`$${value.toLocaleString()}`, '']} />
                    <Legend />
                    <Line type="monotone" dataKey="actual" stroke="#8884d8" strokeWidth={2} name="Actual" dot={{ r: 4 }} />
                    <Line type="monotone" dataKey="forecast" stroke="#82ca9d" strokeWidth={2} name="Forecast" strokeDasharray="5 5" />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Forecast Analysis */}
            <div className="grid gap-6 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>Forecast Confidence</CardTitle>
                  <CardDescription>Confidence levels for predictions</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {forecastingData.map((item, index) => (
                      <div key={index} className="flex items-center justify-between">
                        <span className="text-sm font-medium">{item.period}</span>
                        <div className="flex items-center space-x-2">
                          <div className="w-20 bg-gray-200 rounded-full h-2">
                            <div 
                              className="bg-blue-600 h-2 rounded-full" 
                              style={{ width: `${item.confidence}%` }}
                            ></div>
                          </div>
                          <span className="text-sm text-gray-600">{item.confidence}%</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Forecast Insights</CardTitle>
                  <CardDescription>Key predictions and recommendations</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="p-3 bg-blue-50 rounded-lg">
                      <p className="text-sm font-medium text-blue-900">Strong Growth Expected</p>
                      <p className="text-xs text-blue-700">18% increase predicted for next quarter</p>
                    </div>
                    <div className="p-3 bg-green-50 rounded-lg">
                      <p className="text-sm font-medium text-green-900">Seasonal Peak</p>
                      <p className="text-xs text-green-700">Holiday season will drive 25% of annual sales</p>
                    </div>
                    <div className="p-3 bg-yellow-50 rounded-lg">
                      <p className="text-sm font-medium text-yellow-900">Inventory Alert</p>
                      <p className="text-xs text-yellow-700">Consider increasing stock by 15%</p>
                    </div>
                    <div className="p-3 bg-purple-50 rounded-lg">
                      <p className="text-sm font-medium text-purple-900">Category Focus</p>
                      <p className="text-xs text-purple-700">Electronics will lead growth at 22%</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Trends Tab */}
          <TabsContent value="trends" className="space-y-6">
            {/* Trend Metrics */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Growth Rate</CardTitle>
                  <TrendingUp className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">12.5%</div>
                  <p className="text-xs text-muted-foreground flex items-center mt-1">
                    <TrendingUp className="mr-1 h-3 w-3 text-green-500" />
                    <span className="text-green-500">+3.2%</span>
                    <span className="ml-1">vs last quarter</span>
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Avg Order Value</CardTitle>
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">$276</div>
                  <p className="text-xs text-muted-foreground flex items-center mt-1">
                    <TrendingUp className="mr-1 h-3 w-3 text-green-500" />
                    <span className="text-green-500">+8.4%</span>
                    <span className="ml-1">increase</span>
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Inventory Turnover</CardTitle>
                  <Package className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">8.2x</div>
                  <p className="text-xs text-muted-foreground flex items-center mt-1">
                    <TrendingUp className="mr-1 h-3 w-3 text-green-500" />
                    <span className="text-green-500">+0.8x</span>
                    <span className="ml-1">improvement</span>
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Customer Retention</CardTitle>
                  <Activity className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">78.5%</div>
                  <p className="text-xs text-muted-foreground flex items-center mt-1">
                    <TrendingUp className="mr-1 h-3 w-3 text-green-500" />
                    <span className="text-green-500">+5.2%</span>
                    <span className="ml-1">improvement</span>
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Multi-trend Analysis */}
            <Card>
              <CardHeader>
                <CardTitle>Business Trends Analysis</CardTitle>
                <CardDescription>Sales, inventory, and orders trends over time</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={400}>
                  <LineChart data={trendsData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis yAxisId="left" />
                    <YAxis yAxisId="right" orientation="right" />
                    <Tooltip />
                    <Legend />
                    <Line yAxisId="left" type="monotone" dataKey="sales" stroke="#8884d8" strokeWidth={2} name="Sales ($)" />
                    <Line yAxisId="right" type="monotone" dataKey="inventory" stroke="#82ca9d" strokeWidth={2} name="Inventory ($)" />
                    <Line yAxisId="left" type="monotone" dataKey="orders" stroke="#ffc658" strokeWidth={2} name="Orders" />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Trend Analysis Cards */}
            <div className="grid gap-6 md:grid-cols-3">
              <Card>
                <CardHeader>
                  <CardTitle>Sales Trend</CardTitle>
                  <CardDescription>Monthly sales performance</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Current Month</span>
                      <span className="font-bold">$58,000</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Previous Month</span>
                      <span>$52,000</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>3 Month Avg</span>
                      <span>$50,667</span>
                    </div>
                    <div className="pt-2 border-t">
                      <p className="text-xs text-green-600">↑ 11.5% growth</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Inventory Trend</CardTitle>
                  <CardDescription>Stock levels over time</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Current Level</span>
                      <span className="font-bold">$415,000</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Previous Month</span>
                      <span>$442,000</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Optimal Level</span>
                      <span>$450,000</span>
                    </div>
                    <div className="pt-2 border-t">
                      <p className="text-xs text-orange-600">↓ 6.1% decrease</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Order Trend</CardTitle>
                  <CardDescription>Order volume analysis</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Current Month</span>
                      <span className="font-bold">210</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Previous Month</span>
                      <span>195</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>3 Month Avg</span>
                      <span>185</span>
                    </div>
                    <div className="pt-2 border-t">
                      <p className="text-xs text-green-600">↑ 7.7% increase</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Custom Tab */}
          <TabsContent value="custom" className="space-y-6">
            {/* Custom Reports Overview */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Reports</CardTitle>
                  <Settings className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">24</div>
                  <p className="text-xs text-muted-foreground">Active custom reports</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Scheduled Runs</CardTitle>
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">18</div>
                  <p className="text-xs text-muted-foreground">Automated reports</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Last 24h</CardTitle>
                  <Activity className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">6</div>
                  <p className="text-xs text-muted-foreground">Reports generated</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
                  <Target className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">98.5%</div>
                  <p className="text-xs text-muted-foreground">Report generation</p>
                </CardContent>
              </Card>
            </div>

            {/* Custom Reports List */}
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <div>
                    <CardTitle>Custom Reports</CardTitle>
                    <CardDescription>Manage your custom analytics reports</CardDescription>
                  </div>
                  <Button size="sm">
                    <Settings className="mr-2 h-4 w-4" />
                    Create Report
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {customReports.map((report) => (
                    <div key={report.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center space-x-4">
                        <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                          <BarChart3 className="w-5 h-5 text-blue-600" />
                        </div>
                        <div>
                          <h3 className="font-medium">{report.name}</h3>
                          <p className="text-sm text-muted-foreground">{report.type} • {report.schedule}</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-4">
                        <div className="text-right">
                          <p className="text-sm text-muted-foreground">Last Run</p>
                          <p className="text-sm font-medium">{report.lastRun}</p>
                        </div>
                        <div className="flex space-x-2">
                          <Button variant="outline" size="sm">Run</Button>
                          <Button variant="outline" size="sm">Edit</Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Report Builder */}
            <Card>
              <CardHeader>
                <CardTitle>Quick Report Builder</CardTitle>
                <CardDescription>Create custom reports with drag-and-drop interface</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-6 md:grid-cols-2">
                  <div>
                    <h4 className="font-medium mb-3">Available Metrics</h4>
                    <div className="space-y-2">
                      {['Sales Revenue', 'Profit Margin', 'Inventory Value', 'Order Count', 'Customer Acquisition', 'Product Performance'].map((metric) => (
                        <div key={metric} className="flex items-center justify-between p-2 border rounded">
                          <span className="text-sm">{metric}</span>
                          <Button variant="ghost" size="sm">+</Button>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div>
                    <h4 className="font-medium mb-3">Report Preview</h4>
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                      <BarChart3 className="w-12 h-12 mx-auto text-gray-400 mb-2" />
                      <p className="text-sm text-gray-500">Drag metrics here to build your report</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </LayoutWrapper>
  )
}
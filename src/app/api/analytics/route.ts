import { NextRequest, NextResponse } from 'next/server'

// Mock analytics data
const mockMetrics = {
  totalRevenue: {
    value: 1284500,
    change: 15.2,
    changeType: 'increase'
  },
  profitMargin: {
    value: 23.8,
    change: 2.1,
    changeType: 'increase'
  },
  inventoryValue: {
    value: 456890,
    change: -5.3,
    changeType: 'decrease'
  },
  productsSold: {
    value: 12543,
    change: 8.7,
    changeType: 'increase'
  }
}

const mockSalesData = [
  { date: 'Aug 01', sales: 42000 },
  { date: 'Aug 05', sales: 38000 },
  { date: 'Aug 10', sales: 45000 },
  { date: 'Aug 15', sales: 52000 },
  { date: 'Aug 20', sales: 48000 },
  { date: 'Aug 25', sales: 55000 },
  { date: 'Aug 31', sales: 58000 }
]

const mockCategoryData = [
  { name: 'Electronics', value: 35, color: '#8884d8' },
  { name: 'Clothing', value: 25, color: '#82ca9d' },
  { name: 'Food & Beverage', value: 20, color: '#ffc658' },
  { name: 'Home & Garden', value: 12, color: '#ff7300' },
  { name: 'Sports', value: 8, color: '#00ff00' }
]

const mockProfitabilityData = [
  { category: 'Electronics', revenue: 450000, cost: 315000, profit: 135000, margin: 30 },
  { category: 'Clothing', revenue: 320000, cost: 224000, profit: 96000, margin: 30 },
  { category: 'Food & Beverage', revenue: 256000, cost: 179200, profit: 76800, margin: 30 },
  { category: 'Home & Garden', revenue: 154000, cost: 107800, profit: 46200, margin: 30 },
  { category: 'Sports', revenue: 104500, cost: 73150, profit: 31350, margin: 30 }
]

const mockForecastingData = [
  { period: 'Sep 1', actual: 58000, forecast: 59500, confidence: 85 },
  { period: 'Sep 8', actual: null, forecast: 61000, confidence: 82 },
  { period: 'Sep 15', actual: null, forecast: 62500, confidence: 80 },
  { period: 'Sep 22', actual: null, forecast: 64000, confidence: 78 },
  { period: 'Sep 29', actual: null, forecast: 65500, confidence: 75 }
]

const mockTrendsData = [
  { date: 'Jul 1', sales: 35000, inventory: 520000, orders: 145 },
  { date: 'Jul 15', sales: 38000, inventory: 495000, orders: 158 },
  { date: 'Aug 1', sales: 42000, inventory: 468000, orders: 172 },
  { date: 'Aug 15', sales: 52000, inventory: 442000, orders: 195 },
  { date: 'Aug 31', sales: 58000, inventory: 415000, orders: 210 }
]

const mockCustomReports = [
  { id: '1', name: 'Monthly Sales Summary', type: 'Sales', lastRun: '2024-08-31', schedule: 'Monthly' },
  { id: '2', name: 'Inventory Health Report', type: 'Inventory', lastRun: '2024-08-30', schedule: 'Weekly' },
  { id: '3', name: 'Profit Analysis', type: 'Financial', lastRun: '2024-08-29', schedule: 'Monthly' },
  { id: '4', name: 'Customer Behavior', type: 'Marketing', lastRun: '2024-08-28', schedule: 'Quarterly' }
]

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')
    const tab = searchParams.get('tab') || 'overview'

    // In a real application, you would filter data based on date range and tab
    // For now, we'll return the mock data
    console.log(`Analytics requested for period: ${startDate} to ${endDate}, tab: ${tab}`)

    let responseData: any = {
      metrics: mockMetrics,
      period: {
        startDate: startDate || '2024-08-01',
        endDate: endDate || '2024-08-31'
      }
    }

    // Add data based on the requested tab
    switch (tab) {
      case 'overview':
        responseData.salesData = mockSalesData
        responseData.categoryData = mockCategoryData
        break
      case 'profitability':
        responseData.profitabilityData = mockProfitabilityData
        responseData.categoryData = mockCategoryData
        break
      case 'forecasting':
        responseData.forecastingData = mockForecastingData
        responseData.salesData = mockSalesData
        break
      case 'trends':
        responseData.trendsData = mockTrendsData
        break
      case 'custom':
        responseData.customReports = mockCustomReports
        break
      default:
        // Return all data for no specific tab
        responseData.salesData = mockSalesData
        responseData.categoryData = mockCategoryData
        responseData.profitabilityData = mockProfitabilityData
        responseData.forecastingData = mockForecastingData
        responseData.trendsData = mockTrendsData
        responseData.customReports = mockCustomReports
    }

    return NextResponse.json(responseData)
  } catch (error) {
    console.error('Error fetching analytics data:', error)
    return NextResponse.json(
      { error: 'Failed to fetch analytics data' },
      { status: 500 }
    )
  }
}
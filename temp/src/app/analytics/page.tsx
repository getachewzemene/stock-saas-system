'use client'

import { useState } from 'react'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

export default function AnalyticsPage() {
  const [activeTab, setActiveTab] = useState('overview')

  return (
    <div className="container mx-auto p-4 space-y-6">
      <div className="flex flex-col space-y-2">
        <h1 className="text-2xl font-bold tracking-tight">Analytics</h1>
        <p className="text-muted-foreground">
          Monitor your business performance and insights
        </p>
      </div>

      {/* Responsive Tabs Container */}
      <div className="w-full">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          {/* Mobile-friendly TabsList with horizontal scroll */}
          <div className="relative w-full overflow-x-auto">
            <div className="flex w-max min-w-full space-x-1 bg-muted p-1 rounded-lg">
              <TabsTrigger 
                value="overview" 
                className="flex-shrink-0 px-3 py-2 text-xs data-[state=active]:bg-background data-[state=active]:shadow-sm min-w-[80px] sm:min-w-[100px] md:min-w-[120px]"
              >
                Overview
              </TabsTrigger>
              <TabsTrigger 
                value="profitability" 
                className="flex-shrink-0 px-3 py-2 text-xs data-[state=active]:bg-background data-[state=active]:shadow-sm min-w-[90px] sm:min-w-[110px] md:min-w-[140px]"
              >
                Profitability
              </TabsTrigger>
              <TabsTrigger 
                value="trends" 
                className="flex-shrink-0 px-3 py-2 text-xs data-[state=active]:bg-background data-[state=active]:shadow-sm min-w-[70px] sm:min-w-[90px] md:min-w-[100px]"
              >
                Trends@
              </TabsTrigger>
              <TabsTrigger 
                value="custom" 
                className="flex-shrink-0 px-3 py-2 text-xs data-[state=active]:bg-background data-[state=active]:shadow-sm min-w-[60px] sm:min-w-[80px] md:min-w-[100px]"
              >
                Custom
              </TabsTrigger>
            </div>
          </div>

          {/* Tab Contents */}
          <div className="mt-6">
            <TabsContent value="overview" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Overview Dashboard</CardTitle>
                  <CardDescription>
                    Key metrics and performance indicators
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="p-4 border rounded-lg">
                      <div className="text-2xl font-bold">$45,231</div>
                      <div className="text-sm text-muted-foreground">Total Revenue</div>
                      <Badge variant="secondary" className="mt-1">+12.5%</Badge>
                    </div>
                    <div className="p-4 border rounded-lg">
                      <div className="text-2xl font-bold">2,350</div>
                      <div className="text-sm text-muted-foreground">Active Users</div>
                      <Badge variant="secondary" className="mt-1">+8.2%</Badge>
                    </div>
                    <div className="p-4 border rounded-lg">
                      <div className="text-2xl font-bold">89.1%</div>
                      <div className="text-sm text-muted-foreground">Satisfaction Rate</div>
                      <Badge variant="secondary" className="mt-1">+2.4%</Badge>
                    </div>
                    <div className="p-4 border rounded-lg">
                      <div className="text-2xl font-bold">156</div>
                      <div className="text-sm text-muted-foreground">New Customers</div>
                      <Badge variant="secondary" className="mt-1">+15.3%</Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="profitability" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Profitability Forecasting</CardTitle>
                  <CardDescription>
                    Analyze profit trends and future projections
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="p-4 border rounded-lg">
                      <div className="text-lg font-semibold">Current Quarter</div>
                      <div className="text-3xl font-bold text-green-600">$125,430</div>
                      <div className="text-sm text-muted-foreground">18.7% increase from last quarter</div>
                    </div>
                    <div className="p-4 border rounded-lg">
                      <div className="text-lg font-semibold">Projected Annual</div>
                      <div className="text-3xl font-bold text-blue-600">$485,200</div>
                      <div className="text-sm text-muted-foreground">Based on current trends</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="trends" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Trends Analysis</CardTitle>
                  <CardDescription>
                    Market trends and performance patterns
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="p-4 border rounded-lg">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-semibold">User Engagement</div>
                          <div className="text-sm text-muted-foreground">Upward trend</div>
                        </div>
                        <Badge variant="default">Trending Up</Badge>
                      </div>
                    </div>
                    <div className="p-4 border rounded-lg">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-semibold">Market Share</div>
                          <div className="text-sm text-muted-foreground">Stable growth</div>
                        </div>
                        <Badge variant="secondary">Stable</Badge>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="custom" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Custom Reports</CardTitle>
                  <CardDescription>
                    Build and view custom analytics reports
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="text-center py-8">
                      <div className="text-lg font-semibold mb-2">No Custom Reports</div>
                      <div className="text-muted-foreground mb-4">
                        Create your first custom report to get started
                      </div>
                      <Button>Create Report</Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </div>
        </Tabs>
      </div>
    </div>
  )
}

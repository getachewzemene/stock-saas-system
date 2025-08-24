"use client";

import { useState, useEffect } from "react";
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
  Plus, 
  Search, 
  MoreHorizontal, 
  Edit, 
  Trash2, 
  Package,
  AlertTriangle,
  Filter,
  Calendar,
  MapPin,
  Box,
  Eye,
  Download,
  Minus
} from "lucide-react";
import { toast } from "sonner";
import { LayoutWrapper } from "@/components/layout/layout-wrapper";
import { useI18n } from "@/lib/i18n/context";
import { useStock, useProducts, useLocations, useBatches, useApiMutation, PaginationParams } from "@/lib/api/hooks";
import { VirtualizedTable } from "@/components/ui/virtualized-table";
import { LoadingTable } from "@/components/ui/loading";

interface StockItem {
  id: string;
  quantity: number;
  available: number;
  reserved: number;
  status: string;
  locationId: string;
  productId: string;
  batchId?: string;
  createdAt: string;
  updatedAt: string;
  product: {
    id: string;
    name: string;
    sku?: string;
    price: number;
    minStock: number;
    trackBatch: boolean;
    trackExpiry: boolean;
    category: {
      id: string;
      name: string;
    };
  };
  location: {
    id: string;
    name: string;
    address?: string;
  };
  batch?: {
    id: string;
    batchNumber: string;
    expiryDate?: string;
    manufacturingDate?: string;
    notes?: string;
  };
}

interface Product {
  id: string;
  name: string;
  sku?: string;
  price: number;
  minStock: number;
  trackBatch: boolean;
  trackExpiry: boolean;
  category: {
    id: string;
    name: string;
  };
}

interface Location {
  id: string;
  name: string;
  address?: string;
}

interface Batch {
  id: string;
  batchNumber: string;
  expiryDate?: string;
  manufacturingDate?: string;
  notes?: string;
}

export default function StockPage() {
  const { t } = useI18n();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [locationFilter, setLocationFilter] = useState("all");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [selectedStockItem, setSelectedStockItem] = useState<StockItem | null>(null);
  
  // Pagination state
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
  });
  
  const [formData, setFormData] = useState({
    productId: "",
    locationId: "",
    quantity: "",
    batchId: "",
  });

  // Use enhanced TanStack Query hooks with pagination
  const { 
    data: stockData, 
    isLoading: stockLoading, 
    isFetching: stockFetching,
    refetch: refetchStock
  } = useStock({
    page: pagination.page,
    limit: pagination.limit,
    search: searchTerm || undefined,
    filters: {
      ...(statusFilter !== "all" && { status: statusFilter }),
      ...(locationFilter !== "all" && { locationId: locationFilter }),
    },
    sortBy: "createdAt",
    sortOrder: "desc" as const,
  });

  const { data: products = [], isLoading: productsLoading } = useProducts();
  const { data: locations = [], isLoading: locationsLoading } = useLocations();
  const { data: batches = [], isLoading: batchesLoading } = useBatches();

  // Extract data from paginated response
  const stockItems = stockData?.data || [];
  const paginationInfo = stockData?.pagination || {
    page: 1,
    totalPages: 1,
    total: 0,
    hasNext: false,
    hasPrev: false,
  };

  // Reset pagination when filters or items per page change
  useEffect(() => {
    setPagination(prev => ({ ...prev, page: 1 }));
  }, [searchTerm, statusFilter, locationFilter, pagination.limit]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const response = await fetch("/api/stock", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...formData,
          quantity: parseInt(formData.quantity),
        }),
      });

      if (response.ok) {
        toast.success("Stock item created successfully");
        setIsDialogOpen(false);
        resetForm();
      } else {
        toast.error("Failed to create stock item");
      }
    } catch (error) {
      toast.error("An error occurred while creating the stock item");
    }
  };

  const handleUpdateStock = async (stockItemId: string, action: 'add' | 'remove', quantity: number) => {
    try {
      const response = await fetch(`/api/stock/${stockItemId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          action,
          quantity,
        }),
      });

      if (response.ok) {
        toast.success(`Stock ${action}ed successfully`);
      } else {
        toast.error(`Failed to ${action} stock`);
      }
    } catch (error) {
      toast.error(`An error occurred while ${action}ing stock`);
    }
  };

  const resetForm = () => {
    setFormData({
      productId: "",
      locationId: "",
      quantity: "",
      batchId: "",
    });
  };

  const viewStockItem = (stockItem: StockItem) => {
    setSelectedStockItem(stockItem);
    setIsViewDialogOpen(true);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "IN_STOCK":
        return <Badge variant="default">In Stock</Badge>;
      case "LOW_STOCK":
        return <Badge variant="secondary">Low Stock</Badge>;
      case "OUT_OF_STOCK":
        return <Badge variant="destructive">Out of Stock</Badge>;
      case "EXPIRED":
        return <Badge variant="destructive">Expired</Badge>;
      case "RESERVED":
        return <Badge variant="outline">Reserved</Badge>;
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };

  const isExpiringSoon = (expiryDate?: string) => {
    if (!expiryDate) return false;
    const expiry = new Date(expiryDate);
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
    return expiry <= thirtyDaysFromNow;
  };

  const getExpiryStatus = (expiryDate?: string) => {
    if (!expiryDate) return null;
    
    const expiry = new Date(expiryDate);
    const now = new Date();
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
    
    if (expiry < now) {
      return <Badge variant="destructive">Expired</Badge>;
    } else if (expiry <= thirtyDaysFromNow) {
      return <Badge variant="secondary">Expiring Soon</Badge>;
    }
    return null;
  };

  const totalStockValue = stockItems.reduce((sum, item) => sum + (item.quantity * item.product.price), 0);
  const lowStockCount = stockItems.filter(item => item.status === "LOW_STOCK").length;
  const outOfStockCount = stockItems.filter(item => item.status === "OUT_OF_STOCK").length;
  const expiringSoonCount = stockItems.filter(item => isExpiringSoon(item.batch?.expiryDate)).length;

  const isLoading = stockLoading || productsLoading || locationsLoading || batchesLoading;

  if (isLoading) {
    return (
      <LayoutWrapper
        title={t('stock.title')}
        subtitle={t('stock.subtitle')}
        showNewButton={true}
        onNewClick={() => setIsDialogOpen(true)}
        onRefreshClick={refetchStock}
        isRefreshing={stockFetching}
      >
        <Card>
          <CardHeader>
            <div className="flex flex-col space-y-3 sm:flex-row sm:space-y-0 sm:items-center sm:justify-between">
              <CardTitle>{t('stock.stockInventory')}</CardTitle>
              <div className="flex flex-col space-y-2 sm:flex-row sm:space-y-0 sm:space-x-2">
                <div className="relative w-full sm:w-64">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    placeholder={t('stock.searchStock')}
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 w-full"
                  />
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <LoadingTable rows={5} columns={7} />
          </CardContent>
        </Card>
      </LayoutWrapper>
    );
  }

  return (
    <LayoutWrapper
      title={t('stock.title')}
      subtitle={t('stock.subtitle')}
      showNewButton={true}
      onNewClick={() => setIsDialogOpen(true)}
      onRefreshClick={refetchStock}
      isRefreshing={stockFetching}
    >
      <div className="space-y-6">
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
              <Button onClick={resetForm} className="w-full sm:w-auto">
                <Plus className="w-4 h-4 mr-2" />
                Add Stock
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Add New Stock Item</DialogTitle>
                <DialogDescription>
                  Add inventory to a specific location
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="product">Product *</Label>
                  <Select 
                    value={formData.productId} 
                    onValueChange={(value) => setFormData({...formData, productId: value})}
                    required
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select product" />
                    </SelectTrigger>
                    <SelectContent>
                      {products.map((product) => (
                        <SelectItem key={product.id} value={product.id}>
                          {product.name} - {product.sku}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="location">Location *</Label>
                  <Select 
                    value={formData.locationId} 
                    onValueChange={(value) => setFormData({...formData, locationId: value})}
                    required
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select location" />
                    </SelectTrigger>
                    <SelectContent>
                      {locations.map((location) => (
                        <SelectItem key={location.id} value={location.id}>
                          {location.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="quantity">Quantity *</Label>
                  <Input
                    id="quantity"
                    type="number"
                    min="1"
                    value={formData.quantity}
                    onChange={(e) => setFormData({...formData, quantity: e.target.value})}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="batch">Batch (Optional)</Label>
                  <Select 
                    value={formData.batchId} 
                    onValueChange={(value) => setFormData({...formData, batchId: value})}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select batch" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">No batch</SelectItem>
                      {batches.map((batch) => (
                        <SelectItem key={batch.id} value={batch.id}>
                          {batch.batchNumber} {batch.expiryDate ? `(Exp: ${new Date(batch.expiryDate).toLocaleDateString()})` : ''}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit">
                    Add Stock
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
        
        {/* Summary Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6">
        <Card>
          <CardContent className="p-4 sm:p-6">
            <div className="flex flex-col space-y-2 sm:flex-row sm:space-y-0 sm:items-center sm:justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Stock Value</p>
                <p className="text-xl sm:text-2xl font-bold">${totalStockValue.toLocaleString()}</p>
                <p className="text-sm text-green-600">+5% from last month</p>
              </div>
              <Package className="w-6 h-6 sm:w-8 sm:h-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 sm:p-6">
            <div className="flex flex-col space-y-2 sm:flex-row sm:space-y-0 sm:items-center sm:justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Low Stock Items</p>
                <p className="text-xl sm:text-2xl font-bold">{lowStockCount}</p>
                <p className="text-sm text-orange-600">Requires attention</p>
              </div>
              <AlertTriangle className="w-6 h-6 sm:w-8 sm:h-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 sm:p-6">
            <div className="flex flex-col space-y-2 sm:flex-row sm:space-y-0 sm:items-center sm:justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Out of Stock</p>
                <p className="text-xl sm:text-2xl font-bold">{outOfStockCount}</p>
                <p className="text-sm text-red-600">Immediate action needed</p>
              </div>
              <Box className="w-6 h-6 sm:w-8 sm:h-8 text-red-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 sm:p-6">
            <div className="flex flex-col space-y-2 sm:flex-row sm:space-y-0 sm:items-center sm:justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Expiring Soon</p>
                <p className="text-xl sm:text-2xl font-bold">{expiringSoonCount}</p>
                <p className="text-sm text-yellow-600">Within 30 days</p>
              </div>
              <Calendar className="w-6 h-6 sm:w-8 sm:h-8 text-yellow-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col space-y-3 sm:flex-row sm:space-y-0 sm:items-center sm:justify-between">
            <CardTitle>Stock Inventory</CardTitle>
            <div className="flex flex-col space-y-2 sm:flex-row sm:space-y-0 sm:space-x-2">
              <div className="relative w-full sm:w-64">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Search stock..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 w-full"
                />
              </div>
              
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full sm:w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="IN_STOCK">In Stock</SelectItem>
                  <SelectItem value="LOW_STOCK">Low Stock</SelectItem>
                  <SelectItem value="OUT_OF_STOCK">Out of Stock</SelectItem>
                  <SelectItem value="EXPIRED">Expired</SelectItem>
                  <SelectItem value="RESERVED">Reserved</SelectItem>
                </SelectContent>
              </Select>

              <Select value={locationFilter} onValueChange={setLocationFilter}>
                <SelectTrigger className="w-full sm:w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Locations</SelectItem>
                  {locations.map((location) => (
                    <SelectItem key={location.id} value={location.id}>
                      {location.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Button variant="outline" size="sm" className="w-full sm:w-auto">
                <Filter className="w-4 h-4 mr-2" />
                More Filters
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <VirtualizedTable
            data={stockItems}
            loading={stockLoading || stockFetching}
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
                render: (value: string, stockItem: StockItem) => (
                  <div>
                    <p className="font-medium truncate">{stockItem.product.name}</p>
                    <p className="text-sm text-gray-500 truncate">{stockItem.product.category.name}</p>
                  </div>
                )
              },
              {
                key: "sku",
                header: "SKU",
                render: (value: string, stockItem: StockItem) => stockItem.product.sku || '-'
              },
              {
                key: "location",
                header: "Location",
                render: (value: string, stockItem: StockItem) => (
                  <div className="flex items-center space-x-2">
                    <MapPin className="w-4 h-4 text-gray-400" />
                    <span className="truncate">{stockItem.location.name}</span>
                  </div>
                )
              },
              {
                key: "batch",
                header: "Batch",
                render: (value: string, stockItem: StockItem) => (
                  stockItem.batch ? (
                    <div>
                      <p className="text-sm truncate">{stockItem.batch.batchNumber}</p>
                      {stockItem.batch.expiryDate && (
                        <p className="text-xs text-gray-500">
                          Exp: {new Date(stockItem.batch.expiryDate).toLocaleDateString()}
                        </p>
                      )}
                    </div>
                  ) : (
                    <span className="text-gray-400">-</span>
                  )
                )
              },
              {
                key: "quantity",
                header: "Quantity",
                render: (value: string, stockItem: StockItem) => (
                  <div className="flex flex-col space-y-1">
                    <span className="font-medium">{stockItem.quantity}</span>
                    {stockItem.reserved > 0 && (
                      <span className="text-xs text-gray-500">({stockItem.reserved} reserved)</span>
                    )}
                  </div>
                )
              },
              {
                key: "available",
                header: "Available",
                render: (value: string, stockItem: StockItem) => stockItem.available
              },
              {
                key: "status",
                header: "Status",
                render: (value: string, stockItem: StockItem) => getStatusBadge(stockItem.status)
              },
              {
                key: "expiry",
                header: "Expiry",
                render: (value: string, stockItem: StockItem) => getExpiryStatus(stockItem.batch?.expiryDate)
              },
              {
                key: "actions",
                header: "Actions",
                render: (value: string, stockItem: StockItem) => (
                  <div className="flex flex-col space-y-1 sm:flex-row sm:space-y-0 sm:space-x-1">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => viewStockItem(stockItem)}
                      className="w-full sm:w-auto"
                    >
                      <Eye className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleUpdateStock(stockItem.id, 'add', 1)}
                      className="w-full sm:w-auto"
                    >
                      <Plus className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleUpdateStock(stockItem.id, 'remove', 1)}
                      className="w-full sm:w-auto"
                    >
                      <Minus className="w-4 h-4" />
                    </Button>
                  </div>
                )
              }
            ]}
          />
        </CardContent>
      </Card>

      {/* View Stock Item Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Stock Item Details</DialogTitle>
          </DialogHeader>
          {selectedStockItem && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium text-gray-600">Product</Label>
                  <p className="font-medium">{selectedStockItem.product.name}</p>
                  <p className="text-sm text-gray-500">{selectedStockItem.product.category.name}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-600">SKU</Label>
                  <p>{selectedStockItem.product.sku || '-'}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-600">Location</Label>
                  <p>{selectedStockItem.location.name}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-600">Status</Label>
                  {getStatusBadge(selectedStockItem.status)}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <Label className="text-sm font-medium text-gray-600">Total Quantity</Label>
                  <p className="text-lg font-bold">{selectedStockItem.quantity}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-600">Available</Label>
                  <p className="text-lg font-bold text-green-600">{selectedStockItem.available}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-600">Reserved</Label>
                  <p className="text-lg font-bold text-orange-600">{selectedStockItem.reserved}</p>
                </div>
              </div>

              {selectedStockItem.batch && (
                <div>
                  <Label className="text-sm font-medium text-gray-600">Batch Information</Label>
                  <div className="gray-bg-dark-mode p-3 rounded-lg space-y-2">
                    <p><span className="font-medium">Batch Number:</span> {selectedStockItem.batch.batchNumber}</p>
                    {selectedStockItem.batch.expiryDate && (
                      <p><span className="font-medium">Expiry Date:</span> {new Date(selectedStockItem.batch.expiryDate).toLocaleDateString()}</p>
                    )}
                    {selectedStockItem.batch.manufacturingDate && (
                      <p><span className="font-medium">Manufacturing Date:</span> {new Date(selectedStockItem.batch.manufacturingDate).toLocaleDateString()}</p>
                    )}
                    {selectedStockItem.batch.notes && (
                      <p><span className="font-medium">Notes:</span> {selectedStockItem.batch.notes}</p>
                    )}
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium text-gray-600">Created At</Label>
                  <p>{new Date(selectedStockItem.createdAt).toLocaleString()}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-600">Last Updated</Label>
                  <p>{new Date(selectedStockItem.updatedAt).toLocaleString()}</p>
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsViewDialogOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </LayoutWrapper>
  );
}
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
  Calendar,
  DollarSign,
  Box,
  RefreshCw,
  Eye,
  AlertTriangle,
  CheckCircle
} from "lucide-react";
import { toast } from "sonner";
import { LayoutWrapper } from "@/components/layout/layout-wrapper";
import { useI18n } from "@/lib/i18n/context";
import { VirtualizedTable } from "@/components/ui/virtualized-table";

interface Batch {
  id: string;
  batchNumber: string;
  quantity: number;
  cost: number;
  expiryDate?: string;
  manufacturingDate?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  product: {
    id: string;
    name: string;
    sku?: string;
    price: number;
    category: {
      id: string;
      name: string;
    };
  };
  stockItems: Array<{
    id: string;
    quantity: number;
    location: {
      id: string;
      name: string;
    };
  }>;
}

interface Product {
  id: string;
  name: string;
  sku?: string;
  price: number;
  category: {
    id: string;
    name: string;
  };
}

export default function BatchesPage() {
  const { t } = useI18n();
  const [batches, setBatches] = useState<Batch[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [productFilter, setProductFilter] = useState("all");
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [selectedBatch, setSelectedBatch] = useState<Batch | null>(null);
  
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
  
  const [formData, setFormData] = useState({
    batchNumber: "",
    productId: "",
    quantity: "",
    cost: "",
    expiryDate: "",
    manufacturingDate: "",
    notes: "",
  });

  useEffect(() => {
    fetchBatches();
    fetchProducts();
  }, [pagination.page, pagination.limit, searchTerm, productFilter]);

  // Reset pagination when filters or items per page change
  useEffect(() => {
    setPagination(prev => ({ ...prev, page: 1 }));
  }, [searchTerm, productFilter, pagination.limit]);

  const fetchBatches = async () => {
    try {
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
        ...(searchTerm && { search: searchTerm }),
        ...(productFilter !== "all" && { productId: productFilter }),
      });
      
      const response = await fetch(`/api/batches?${params}`);
      if (response.ok) {
        const data = await response.json();
        setBatches(data.batches || data);
        
        // Set pagination info if available
        if (data.pagination) {
          setPaginationInfo(data.pagination);
        } else {
          const batchesData = data.batches || data;
          setPaginationInfo({
            page: pagination.page,
            totalPages: Math.ceil(batchesData.length / pagination.limit),
            total: batchesData.length,
            hasNext: batchesData.length === pagination.limit,
            hasPrev: pagination.page > 1,
          });
        }
      }
    } catch (error) {
      toast.error("Failed to fetch batches");
    } finally {
      setIsLoading(false);
    }
  };

  const fetchProducts = async () => {
    try {
      const response = await fetch("/api/products");
      if (response.ok) {
        const data = await response.json();
        setProducts(data.products || data);
      }
    } catch (error) {
      toast.error("Failed to fetch products");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const response = await fetch("/api/batches", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...formData,
          quantity: parseInt(formData.quantity),
          cost: parseFloat(formData.cost),
        }),
      });

      if (response.ok) {
        toast.success("Batch created successfully");
        setIsDialogOpen(false);
        resetForm();
        fetchBatches();
      } else {
        const error = await response.json();
        toast.error(error.error || "Failed to create batch");
      }
    } catch (error) {
      toast.error("An error occurred while creating the batch");
    }
  };

  const resetForm = () => {
    setFormData({
      batchNumber: "",
      productId: "",
      quantity: "",
      cost: "",
      expiryDate: "",
      manufacturingDate: "",
      notes: "",
    });
  };

  const viewBatch = (batch: Batch) => {
    setSelectedBatch(batch);
    setIsViewDialogOpen(true);
  };

  const deleteBatch = async (batchId: string) => {
    if (!confirm("Are you sure you want to delete this batch?")) {
      return;
    }

    try {
      const response = await fetch(`/api/batches/${batchId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        toast.success("Batch deleted successfully");
        fetchBatches();
      } else {
        toast.error("Failed to delete batch");
      }
    } catch (error) {
      toast.error("An error occurred while deleting the batch");
    }
  };

  const isExpired = (expiryDate?: string) => {
    if (!expiryDate) return false;
    return new Date(expiryDate) < new Date();
  };

  const isExpiringSoon = (expiryDate?: string) => {
    if (!expiryDate) return false;
    const expiry = new Date(expiryDate);
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
    return expiry <= thirtyDaysFromNow && expiry > new Date();
  };

  const getExpiryStatus = (expiryDate?: string) => {
    if (!expiryDate) return null;
    
    if (isExpired(expiryDate)) {
      return <Badge variant="destructive">Expired</Badge>;
    } else if (isExpiringSoon(expiryDate)) {
      return <Badge variant="secondary">Expiring Soon</Badge>;
    }
    return <Badge variant="default">Active</Badge>;
  };

  const getTotalStockInBatch = (batch: Batch) => {
    return batch.stockItems.reduce((sum, item) => sum + item.quantity, 0);
  };

  const getBatchValue = (batch: Batch) => {
    return getTotalStockInBatch(batch) * batch.cost;
  };

  const totalBatches = batches.length;
  const expiredBatches = batches.filter(batch => isExpired(batch.expiryDate)).length;
  const expiringSoonBatches = batches.filter(batch => isExpiringSoon(batch.expiryDate)).length;
  const totalBatchValue = batches.reduce((sum, batch) => sum + getBatchValue(batch), 0);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  return (
    <LayoutWrapper
      title="Batch Management"
      subtitle="Manage product batches, expiry dates, and inventory tracking"
      showNewButton={true}
      onNewClick={() => setIsDialogOpen(true)}
    >
      <div className="space-y-6">
        <div className="flex items-center space-x-2">
          <Button variant="outline" onClick={fetchBatches}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={resetForm}>
                <Plus className="w-4 h-4 mr-2" />
                Add Batch
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle>Add New Batch</DialogTitle>
                <DialogDescription>
                  Create a new batch for inventory tracking
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="batchNumber">Batch Number *</Label>
                  <Input
                    id="batchNumber"
                    value={formData.batchNumber}
                    onChange={(e) => setFormData({...formData, batchNumber: e.target.value})}
                    required
                  />
                </div>

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

                <div className="grid grid-cols-2 gap-4">
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
                    <Label htmlFor="cost">Cost per Unit *</Label>
                    <Input
                      id="cost"
                      type="number"
                      step="0.01"
                      min="0"
                      value={formData.cost}
                      onChange={(e) => setFormData({...formData, cost: e.target.value})}
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="expiryDate">Expiry Date</Label>
                    <Input
                      id="expiryDate"
                      type="date"
                      value={formData.expiryDate}
                      onChange={(e) => setFormData({...formData, expiryDate: e.target.value})}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="manufacturingDate">Manufacturing Date</Label>
                    <Input
                      id="manufacturingDate"
                      type="date"
                      value={formData.manufacturingDate}
                      onChange={(e) => setFormData({...formData, manufacturingDate: e.target.value})}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="notes">Notes</Label>
                  <Input
                    id="notes"
                    value={formData.notes}
                    onChange={(e) => setFormData({...formData, notes: e.target.value})}
                  />
                </div>

                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit">
                    Add Batch
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
        
        {/* Summary Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Batches</p>
                  <p className="text-2xl font-bold">{totalBatches}</p>
                  <p className="text-sm text-green-600">Active batches</p>
                </div>
                <Package className="w-8 h-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Expired Batches</p>
                  <p className="text-2xl font-bold">{expiredBatches}</p>
                  <p className="text-sm text-red-600">Requires attention</p>
                </div>
                <AlertTriangle className="w-8 h-8 text-red-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Expiring Soon</p>
                  <p className="text-2xl font-bold">{expiringSoonBatches}</p>
                  <p className="text-sm text-yellow-600">Within 30 days</p>
                </div>
                <Calendar className="w-8 h-8 text-yellow-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Batch Value</p>
                  <p className="text-2xl font-bold">${totalBatchValue.toLocaleString()}</p>
                  <p className="text-sm text-green-600">Inventory value</p>
                </div>
                <DollarSign className="w-8 h-8 text-green-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Batch Inventory</CardTitle>
              <div className="flex flex-col space-y-2 sm:flex-row sm:space-y-0 sm:space-x-2">
                <div className="relative w-full sm:w-64">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    placeholder="Search batches..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 w-full"
                  />
                </div>
                
                <Select value={productFilter} onValueChange={setProductFilter}>
                  <SelectTrigger className="w-full sm:w-40">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Products</SelectItem>
                    {products.map((product) => (
                      <SelectItem key={product.id} value={product.id}>
                        {product.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <VirtualizedTable
              data={batches}
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
                  key: "batchNumber",
                  header: "Batch Number",
                  render: (value: string, batch: Batch) => (
                    <div className="flex items-center space-x-2">
                      <Box className="w-4 h-4 text-gray-400" />
                      <span className="font-medium">{batch.batchNumber}</span>
                    </div>
                  )
                },
                {
                  key: "product",
                  header: "Product",
                  render: (value: string, batch: Batch) => (
                    <div>
                      <p className="font-medium">{batch.product.name}</p>
                      <p className="text-sm text-gray-500">{batch.product.category.name}</p>
                    </div>
                  )
                },
                {
                  key: "quantity",
                  header: "Quantity",
                  render: (value: string, batch: Batch) => (
                    <span className="font-medium">{batch.quantity}</span>
                  )
                },
                {
                  key: "inStock",
                  header: "In Stock",
                  render: (value: string, batch: Batch) => (
                    <div className="flex items-center space-x-2">
                      <span>{getTotalStockInBatch(batch)}</span>
                      {getTotalStockInBatch(batch) < batch.quantity && (
                        <Badge variant="secondary">
                          {batch.quantity - getTotalStockInBatch(batch)} remaining
                        </Badge>
                      )}
                    </div>
                  )
                },
                {
                  key: "cost",
                  header: "Cost",
                  render: (value: string, batch: Batch) => `$${batch.cost.toFixed(2)}`
                },
                {
                  key: "value",
                  header: "Value",
                  render: (value: string, batch: Batch) => `$${getBatchValue(batch).toFixed(2)}`
                },
                {
                  key: "expiryDate",
                  header: "Expiry Date",
                  render: (value: string, batch: Batch) => (
                    batch.expiryDate ? (
                      <div>
                        <p className="text-sm">{new Date(batch.expiryDate).toLocaleDateString()}</p>
                        {isExpired(batch.expiryDate) && (
                          <p className="text-xs text-red-600">Expired</p>
                        )}
                      </div>
                    ) : (
                      <span className="text-gray-400">No expiry</span>
                    )
                  )
                },
                {
                  key: "status",
                  header: "Status",
                  render: (value: string, batch: Batch) => getExpiryStatus(batch.expiryDate)
                },
                {
                  key: "actions",
                  header: "Actions",
                  render: (value: string, batch: Batch) => (
                    <div className="flex items-center space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => viewBatch(batch)}
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreHorizontal className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent>
                          <DropdownMenuItem onClick={() => viewBatch(batch)}>
                            <Eye className="w-4 h-4 mr-2" />
                            View Details
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => deleteBatch(batch.id)}>
                            <Trash2 className="w-4 h-4 mr-2" />
                            Delete Batch
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  )
                }
              ]}
            />
          </CardContent>
        </Card>

        {/* View Batch Dialog */}
        <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>Batch Details</DialogTitle>
            </DialogHeader>
            {selectedBatch && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium text-gray-600">Batch Number</Label>
                    <p className="font-medium">{selectedBatch.batchNumber}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-600">Product</Label>
                    <p className="font-medium">{selectedBatch.product.name}</p>
                    <p className="text-sm text-gray-500">{selectedBatch.product.category.name}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-600">Total Quantity</Label>
                    <p className="font-medium">{selectedBatch.quantity}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-600">In Stock</Label>
                    <p className="font-medium">{getTotalStockInBatch(selectedBatch)}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-600">Cost per Unit</Label>
                    <p className="font-medium">${selectedBatch.cost.toFixed(2)}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-600">Total Value</Label>
                    <p className="font-medium">${getBatchValue(selectedBatch).toFixed(2)}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-600">Expiry Date</Label>
                    <p>{selectedBatch.expiryDate ? new Date(selectedBatch.expiryDate).toLocaleDateString() : 'No expiry date'}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-600">Manufacturing Date</Label>
                    <p>{selectedBatch.manufacturingDate ? new Date(selectedBatch.manufacturingDate).toLocaleDateString() : 'Not specified'}</p>
                  </div>
                </div>
                
                {selectedBatch.notes && (
                  <div>
                    <Label className="text-sm font-medium text-gray-600">Notes</Label>
                    <p className="mt-1">{selectedBatch.notes}</p>
                  </div>
                )}

                {selectedBatch.stockItems.length > 0 && (
                  <div>
                    <Label className="text-sm font-medium text-gray-600">Stock Locations</Label>
                    <div className="mt-2 space-y-2">
                      {selectedBatch.stockItems.map((item) => (
                        <div key={item.id} className="flex justify-between items-center p-2 gray-bg-dark-mode rounded">
                          <span>{item.location.name}</span>
                          <span className="font-medium">{item.quantity} units</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div>
                  <Label className="text-sm font-medium text-gray-600">Status</Label>
                  <div className="mt-1">
                    {getExpiryStatus(selectedBatch.expiryDate)}
                  </div>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </LayoutWrapper>
  );
}
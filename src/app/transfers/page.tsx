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
import { Textarea } from "@/components/ui/textarea";
import { 
  Plus, 
  Search, 
  MoreHorizontal, 
  Edit, 
  Trash2, 
  Truck,
  Package,
  MapPin,
  Calendar,
  RefreshCw,
  Eye,
  CheckCircle,
  XCircle,
  Clock,
  FileText
} from "lucide-react";
import { toast } from "sonner";
import { LayoutWrapper } from "@/components/layout/layout-wrapper";
import { useI18n } from "@/lib/i18n/context";
import { useTransfers, useProducts, useLocations, useApiMutation, PaginationParams } from "@/lib/api/hooks";
import { VirtualizedTable } from "@/components/ui/virtualized-table";

interface Transfer {
  id: string;
  transferNo: string;
  fromLocationId: string;
  toLocationId: string;
  status: string;
  requestedBy: string;
  approvedBy?: string;
  requestedAt: string;
  approvedAt?: string;
  completedAt?: string;
  notes?: string;
  items: TransferItem[];
  fromLocation: {
    id: string;
    name: string;
    address?: string;
  };
  toLocation: {
    id: string;
    name: string;
    address?: string;
  };
  requestedByUser: {
    id: string;
    name: string;
    email: string;
  };
  approvedByUser?: {
    id: string;
    name: string;
    email: string;
  };
}

interface TransferItem {
  id: string;
  transferId: string;
  productId: string;
  quantity: number;
  batchId?: string;
  notes?: string;
  product: {
    id: string;
    name: string;
    sku?: string;
    category: {
      name: string;
    };
  };
  batch?: {
    id: string;
    batchNumber: string;
    expiryDate?: string;
  };
}

interface Product {
  id: string;
  name: string;
  sku?: string;
  category: {
    id: string;
    name: string;
  };
  stockItems: Array<{
    id: string;
    quantity: number;
    available: number;
    location: {
      id: string;
      name: string;
    };
    batch?: {
      id: string;
      batchNumber: string;
      expiryDate?: string;
    };
  }>;
}

interface Location {
  id: string;
  name: string;
  address?: string;
}

export default function TransfersPage() {
  const { t } = useI18n();
  const [transfers, setTransfers] = useState<Transfer[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [selectedTransfer, setSelectedTransfer] = useState<Transfer | null>(null);
  
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
    fromLocationId: "",
    toLocationId: "",
    notes: "",
    items: [] as Array<{
      productId: string;
      quantity: number;
      batchId?: string;
      notes?: string;
    }>,
  });

  useEffect(() => {
    fetchTransfers();
    fetchProducts();
    fetchLocations();
  }, [pagination.page, pagination.limit, searchTerm, statusFilter]);

  // Reset pagination when filters or items per page change
  useEffect(() => {
    setPagination(prev => ({ ...prev, page: 1 }));
  }, [searchTerm, statusFilter, pagination.limit]);

  const fetchTransfers = async () => {
    try {
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
        ...(searchTerm && { search: searchTerm }),
        ...(statusFilter !== "all" && { status: statusFilter }),
      });
      
      const response = await fetch(`/api/transfers?${params}`);
      if (response.ok) {
        const data = await response.json();
        setTransfers(data.transfers || data);
        
        // Set pagination info if available
        if (data.pagination) {
          setPaginationInfo(data.pagination);
        } else {
          const transfersData = data.transfers || data;
          setPaginationInfo({
            page: pagination.page,
            totalPages: Math.ceil(transfersData.length / pagination.limit),
            total: transfersData.length,
            hasNext: transfersData.length === pagination.limit,
            hasPrev: pagination.page > 1,
          });
        }
      }
    } catch (error) {
      toast.error("Failed to fetch transfers");
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

  const fetchLocations = async () => {
    try {
      const response = await fetch("/api/locations");
      if (response.ok) {
        const data = await response.json();
        setLocations(data);
      }
    } catch (error) {
      toast.error("Failed to fetch locations");
    }
  };

  const addTransferItem = () => {
    setFormData({
      ...formData,
      items: [
        ...formData.items,
        {
          productId: "",
          quantity: 1,
          batchId: "",
          notes: "",
        },
      ],
    });
  };

  const removeTransferItem = (index: number) => {
    const newItems = formData.items.filter((_, i) => i !== index);
    setFormData({ ...formData, items: newItems });
  };

  const updateTransferItem = (index: number, field: string, value: any) => {
    const newItems = [...formData.items];
    newItems[index] = { ...newItems[index], [field]: value };
    
    // If product is changed, get available batches
    if (field === "productId") {
      newItems[index].batchId = "";
    }
    
    setFormData({ ...formData, items: newItems });
  };

  const getAvailableStock = (productId: string, locationId: string) => {
    const product = products.find(p => p.id === productId);
    if (!product) return 0;
    
    const stockItem = product.stockItems.find(item => item.location.id === locationId);
    return stockItem?.available || 0;
  };

  const getAvailableBatches = (productId: string, locationId: string) => {
    const product = products.find(p => p.id === productId);
    if (!product) return [];
    
    return product.stockItems
      .filter(item => item.location.id === locationId && item.batch)
      .map(item => item.batch!);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (formData.items.length === 0) {
      toast.error("Please add at least one item");
      return;
    }

    if (formData.fromLocationId === formData.toLocationId) {
      toast.error("From and To locations must be different");
      return;
    }

    // Validate stock availability
    for (const item of formData.items) {
      const availableStock = getAvailableStock(item.productId, formData.fromLocationId);
      if (item.quantity > availableStock) {
        const product = products.find(p => p.id === item.productId);
        toast.error(`Insufficient stock for ${product?.name}. Available: ${availableStock}`);
        return;
      }
    }
    
    try {
      const response = await fetch("/api/transfers", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        toast.success("Transfer request created successfully");
        setIsDialogOpen(false);
        resetForm();
        fetchTransfers();
      } else {
        toast.error("Failed to create transfer");
      }
    } catch (error) {
      toast.error("An error occurred while creating the transfer");
    }
  };

  const handleApproveTransfer = async (transferId: string) => {
    try {
      const response = await fetch(`/api/transfers/${transferId}/approve`, {
        method: "POST",
      });

      if (response.ok) {
        toast.success("Transfer approved successfully");
        fetchTransfers();
      } else {
        toast.error("Failed to approve transfer");
      }
    } catch (error) {
      toast.error("An error occurred while approving the transfer");
    }
  };

  const handleCompleteTransfer = async (transferId: string) => {
    try {
      const response = await fetch(`/api/transfers/${transferId}/complete`, {
        method: "POST",
      });

      if (response.ok) {
        toast.success("Transfer completed successfully");
        fetchTransfers();
      } else {
        toast.error("Failed to complete transfer");
      }
    } catch (error) {
      toast.error("An error occurred while completing the transfer");
    }
  };

  const handleCancelTransfer = async (transferId: string) => {
    if (confirm("Are you sure you want to cancel this transfer?")) {
      try {
        const response = await fetch(`/api/transfers/${transferId}/cancel`, {
          method: "POST",
        });

        if (response.ok) {
          toast.success("Transfer cancelled successfully");
          fetchTransfers();
        } else {
          toast.error("Failed to cancel transfer");
        }
      } catch (error) {
        toast.error("An error occurred while cancelling the transfer");
      }
    }
  };

  const resetForm = () => {
    setFormData({
      fromLocationId: "",
      toLocationId: "",
      notes: "",
      items: [],
    });
  };

  const viewTransfer = (transfer: Transfer) => {
    setSelectedTransfer(transfer);
    setIsViewDialogOpen(true);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "PENDING":
        return <Badge variant="secondary"><Clock className="w-3 h-3 mr-1" />Pending</Badge>;
      case "APPROVED":
        return <Badge variant="default"><CheckCircle className="w-3 h-3 mr-1" />Approved</Badge>;
      case "IN_TRANSIT":
        return <Badge variant="outline"><Truck className="w-3 h-3 mr-1" />In Transit</Badge>;
      case "COMPLETED":
        return <Badge variant="default"><CheckCircle className="w-3 h-3 mr-1" />Completed</Badge>;
      case "CANCELLED":
        return <Badge variant="destructive"><XCircle className="w-3 h-3 mr-1" />Cancelled</Badge>;
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };

  const pendingCount = transfers.filter(t => t.status === "PENDING").length;
  const approvedCount = transfers.filter(t => t.status === "APPROVED").length;
  const inTransitCount = transfers.filter(t => t.status === "IN_TRANSIT").length;
  const completedCount = transfers.filter(t => t.status === "COMPLETED").length;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  return (
    <LayoutWrapper 
      title={t('transfers.title')} 
      subtitle={t('transfers.subtitle')}
      showNewButton={true}
      onNewClick={() => setIsDialogOpen(true)}
    >
      <div className="space-y-6">
        <div className="flex items-center space-x-2">
          <Button variant="outline" onClick={fetchTransfers}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={resetForm}>
                <Plus className="w-4 h-4 mr-2" />
                New Transfer
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[800px] max-h-[80vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>New Stock Transfer</DialogTitle>
                <DialogDescription>
                  Create a new stock transfer request between locations
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="fromLocation">From Location *</Label>
                    <Select 
                      value={formData.fromLocationId} 
                      onValueChange={(value) => setFormData({...formData, fromLocationId: value})}
                      required
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select source location" />
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
                    <Label htmlFor="toLocation">To Location *</Label>
                    <Select 
                      value={formData.toLocationId} 
                      onValueChange={(value) => setFormData({...formData, toLocationId: value})}
                      required
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select destination location" />
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
                </div>

                <div className="space-y-2">
                  <Label htmlFor="notes">Notes</Label>
                  <Textarea
                    id="notes"
                    value={formData.notes}
                    onChange={(e) => setFormData({...formData, notes: e.target.value})}
                    placeholder="Additional notes for this transfer"
                  />
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold">Transfer Items</h3>
                    <Button type="button" variant="outline" onClick={addTransferItem}>
                      <Plus className="w-4 h-4 mr-2" />
                      Add Item
                    </Button>
                  </div>

                  {formData.items.map((item, index) => (
                    <div key={index} className="border rounded-lg p-4 space-y-4">
                      <div className="flex items-center justify-between">
                        <h4 className="font-medium">Item {index + 1}</h4>
                        {formData.items.length > 1 && (
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => removeTransferItem(index)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        )}
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Product *</Label>
                          <Select 
                            value={item.productId} 
                            onValueChange={(value) => updateTransferItem(index, "productId", value)}
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
                          <Label>Quantity *</Label>
                          <Input
                            type="number"
                            min="1"
                            value={item.quantity}
                            onChange={(e) => updateTransferItem(index, "quantity", parseInt(e.target.value))}
                            required
                          />
                          {item.productId && formData.fromLocationId && (
                            <p className="text-xs text-gray-500">
                              Available: {getAvailableStock(item.productId, formData.fromLocationId)}
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Batch (Optional)</Label>
                          <Select 
                            value={item.batchId} 
                            onValueChange={(value) => updateTransferItem(index, "batchId", value)}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select batch" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="any">Any batch</SelectItem>
                              {getAvailableBatches(item.productId, formData.fromLocationId).map((batch) => (
                                <SelectItem key={batch.id} value={batch.id}>
                                  {batch.batchNumber} {batch.expiryDate ? `(Exp: ${new Date(batch.expiryDate).toLocaleDateString()})` : ''}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label>Item Notes</Label>
                          <Input
                            value={item.notes || ""}
                            onChange={(e) => updateTransferItem(index, "notes", e.target.value)}
                            placeholder="Optional notes for this item"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit">
                    Create Transfer
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
                <p className="text-sm font-medium text-gray-600">Pending</p>
                <p className="text-2xl font-bold">{pendingCount}</p>
                <p className="text-sm text-orange-600">Awaiting approval</p>
              </div>
              <Clock className="w-8 h-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Approved</p>
                <p className="text-2xl font-bold">{approvedCount}</p>
                <p className="text-sm text-blue-600">Ready for transfer</p>
              </div>
              <CheckCircle className="w-8 h-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">In Transit</p>
                <p className="text-2xl font-bold">{inTransitCount}</p>
                <p className="text-sm text-purple-600">On the move</p>
              </div>
              <Truck className="w-8 h-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Completed</p>
                <p className="text-2xl font-bold">{completedCount}</p>
                <p className="text-sm text-green-600">This month</p>
              </div>
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Transfer History</CardTitle>
            <div className="flex flex-col space-y-2 sm:flex-row sm:space-y-0 sm:space-x-2">
              <div className="relative w-full sm:w-64">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Search transfers..."
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
                  <SelectItem value="PENDING">Pending</SelectItem>
                  <SelectItem value="APPROVED">Approved</SelectItem>
                  <SelectItem value="IN_TRANSIT">In Transit</SelectItem>
                  <SelectItem value="COMPLETED">Completed</SelectItem>
                  <SelectItem value="CANCELLED">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <VirtualizedTable
            data={transfers}
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
                key: "transferNo",
                header: "Transfer #",
                render: (value: string, transfer: Transfer) => (
                  <span className="font-medium">{transfer.transferNo}</span>
                )
              },
              {
                key: "from",
                header: "From",
                render: (value: string, transfer: Transfer) => (
                  <div className="flex items-center space-x-2">
                    <MapPin className="w-4 h-4 text-gray-400" />
                    <span>{transfer.fromLocation.name}</span>
                  </div>
                )
              },
              {
                key: "to",
                header: "To",
                render: (value: string, transfer: Transfer) => (
                  <div className="flex items-center space-x-2">
                    <MapPin className="w-4 h-4 text-gray-400" />
                    <span>{transfer.toLocation.name}</span>
                  </div>
                )
              },
              {
                key: "status",
                header: "Status",
                render: (value: string, transfer: Transfer) => getStatusBadge(transfer.status)
              },
              {
                key: "items",
                header: "Items",
                render: (value: string, transfer: Transfer) => transfer.items.length
              },
              {
                key: "requestedBy",
                header: "Requested By",
                render: (value: string, transfer: Transfer) => transfer.requestedByUser.name
              },
              {
                key: "requestedAt",
                header: "Requested At",
                render: (value: string, transfer: Transfer) => new Date(transfer.requestedAt).toLocaleDateString()
              },
              {
                key: "actions",
                header: "Actions",
                render: (value: string, transfer: Transfer) => (
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => viewTransfer(transfer)}
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
                        <DropdownMenuItem onClick={() => viewTransfer(transfer)}>
                          <Eye className="w-4 h-4 mr-2" />
                          View Details
                        </DropdownMenuItem>
                        {transfer.status === "PENDING" && (
                          <DropdownMenuItem onClick={() => handleApproveTransfer(transfer.id)}>
                            <CheckCircle className="w-4 h-4 mr-2" />
                            Approve
                          </DropdownMenuItem>
                        )}
                        {transfer.status === "APPROVED" && (
                          <DropdownMenuItem onClick={() => handleCompleteTransfer(transfer.id)}>
                            <Truck className="w-4 h-4 mr-2" />
                            Mark Complete
                          </DropdownMenuItem>
                        )}
                        {["PENDING", "APPROVED"].includes(transfer.status) && (
                          <DropdownMenuItem onClick={() => handleCancelTransfer(transfer.id)}>
                            <XCircle className="w-4 h-4 mr-2" />
                            Cancel
                          </DropdownMenuItem>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                )
              }
            ]}
          />
        </CardContent>
      </Card>

      {/* View Transfer Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="sm:max-w-[700px] max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Transfer Details - {selectedTransfer?.transferNo}</DialogTitle>
          </DialogHeader>
          {selectedTransfer && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium text-gray-600">From Location</Label>
                  <p className="font-medium">{selectedTransfer.fromLocation.name}</p>
                  {selectedTransfer.fromLocation.address && (
                    <p className="text-sm text-gray-500">{selectedTransfer.fromLocation.address}</p>
                  )}
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-600">To Location</Label>
                  <p className="font-medium">{selectedTransfer.toLocation.name}</p>
                  {selectedTransfer.toLocation.address && (
                    <p className="text-sm text-gray-500">{selectedTransfer.toLocation.address}</p>
                  )}
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-600">Status</Label>
                  {getStatusBadge(selectedTransfer.status)}
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-600">Requested By</Label>
                  <p>{selectedTransfer.requestedByUser.name}</p>
                  <p className="text-sm text-gray-500">{selectedTransfer.requestedByUser.email}</p>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label className="text-sm font-medium text-gray-600">Requested At</Label>
                  <p>{new Date(selectedTransfer.requestedAt).toLocaleString()}</p>
                </div>
                {selectedTransfer.approvedAt && (
                  <div>
                    <Label className="text-sm font-medium text-gray-600">Approved At</Label>
                    <p>{new Date(selectedTransfer.approvedAt).toLocaleString()}</p>
                    {selectedTransfer.approvedByUser && (
                      <p className="text-sm text-gray-500">by {selectedTransfer.approvedByUser.name}</p>
                    )}
                  </div>
                )}
                {selectedTransfer.completedAt && (
                  <div>
                    <Label className="text-sm font-medium text-gray-600">Completed At</Label>
                    <p>{new Date(selectedTransfer.completedAt).toLocaleString()}</p>
                  </div>
                )}
              </div>

              {selectedTransfer.notes && (
                <div>
                  <Label className="text-sm font-medium text-gray-600">Notes</Label>
                  <p className="gray-bg-dark-mode p-3 rounded-lg">{selectedTransfer.notes}</p>
                </div>
              )}

              <div>
                <Label className="text-sm font-medium text-gray-600">Transfer Items</Label>
                <div className="border rounded-lg overflow-hidden">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">Product</th>
                        <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">SKU</th>
                        <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">Quantity</th>
                        <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">Batch</th>
                        <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">Notes</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {selectedTransfer.items.map((item) => (
                        <tr key={item.id}>
                          <td className="px-4 py-2 text-sm font-medium">{item.product.name}</td>
                          <td className="px-4 py-2 text-sm">{item.product.sku || '-'}</td>
                          <td className="px-4 py-2 text-sm">{item.quantity}</td>
                          <td className="px-4 py-2 text-sm">
                            {item.batch ? (
                              <div>
                                <p className="text-sm">{item.batch.batchNumber}</p>
                                {item.batch.expiryDate && (
                                  <p className="text-xs text-gray-500">
                                    Exp: {new Date(item.batch.expiryDate).toLocaleDateString()}
                                  </p>
                                )}
                              </div>
                            ) : (
                              <span className="text-gray-400">-</span>
                            )}
                          </td>
                          <td className="px-4 py-2 text-sm">{item.notes || '-'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsViewDialogOpen(false)}>
              Close
            </Button>
            {selectedTransfer && selectedTransfer.status === "PENDING" && (
              <Button onClick={() => handleApproveTransfer(selectedTransfer.id)}>
                Approve Transfer
              </Button>
            )}
            {selectedTransfer && selectedTransfer.status === "APPROVED" && (
              <Button onClick={() => handleCompleteTransfer(selectedTransfer.id)}>
                Complete Transfer
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
      </div>
    </LayoutWrapper>
  );
}
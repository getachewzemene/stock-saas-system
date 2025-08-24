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
  ShoppingCart,
  Package,
  User,
  FileText,
  Download,
  Eye,
  Calendar,
  DollarSign,
  Printer
} from "lucide-react";
import { toast } from "sonner";
import { LayoutWrapper } from "@/components/layout/layout-wrapper";
import { useI18n } from "@/lib/i18n/context";
import { useSales, useProducts, useLocations, useApiMutation, PaginationParams } from "@/lib/api/hooks";
import { VirtualizedTable } from "@/components/ui/virtualized-table";
import { InvoiceTemplate } from "@/components/invoice/invoice-template";

interface Sale {
  id: string;
  invoiceNo: string;
  customerId?: string;
  customerName?: string;
  totalAmount: number;
  discount: number;
  tax: number;
  finalAmount: number;
  status: string;
  userId: string;
  locationId: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  user?: {
    id: string;
    name: string;
    email: string;
  };
  location?: {
    id: string;
    name: string;
  };
  items: SaleItem[];
}

interface SaleItem {
  id: string;
  saleId: string;
  productId: string;
  quantity: number;
  price: number;
  discount: number;
  total: number;
  batchId?: string;
  createdAt: string;
  product?: {
    id: string;
    name: string;
    sku?: string;
    price: number;
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
  price: number;
  cost: number;
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
}

export default function SalesPage() {
  const { t } = useI18n();
  const [searchTerm, setSearchTerm] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [isInvoiceDialogOpen, setIsInvoiceDialogOpen] = useState(false);
  const [selectedSale, setSelectedSale] = useState<Sale | null>(null);
  
  // Pagination state
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
  });
  
  const [formData, setFormData] = useState({
    customerName: "",
    customerId: "",
    notes: "",
    locationId: "",
    items: [] as Array<{
      productId: string;
      quantity: number;
      price: number;
      discount: number;
      batchId?: string;
    }>,
  });

  // Use enhanced TanStack Query hooks with pagination
  const { 
    data: salesData, 
    isLoading: salesLoading, 
    isFetching: salesFetching 
  } = useSales({
    page: pagination.page,
    limit: pagination.limit,
    search: searchTerm || undefined,
    sortBy: "createdAt",
    sortOrder: "desc" as const,
  });

  const { data: products = [], isLoading: productsLoading } = useProducts();
  const { data: locations = [], isLoading: locationsLoading } = useLocations();

  // Extract data from paginated response
  const sales = salesData?.data || [];
  const paginationInfo = salesData?.pagination || {
    page: 1,
    totalPages: 1,
    total: 0,
    hasNext: false,
    hasPrev: false,
  };

  // Reset pagination when search or items per page changes
  useEffect(() => {
    setPagination(prev => ({ ...prev, page: 1 }));
  }, [searchTerm, pagination.limit]);

  const addSaleItem = () => {
    setFormData({
      ...formData,
      items: [
        ...formData.items,
        {
          productId: "",
          quantity: 1,
          price: 0,
          discount: 0,
          batchId: "",
        },
      ],
    });
  };

  const removeSaleItem = (index: number) => {
    const newItems = formData.items.filter((_, i) => i !== index);
    setFormData({ ...formData, items: newItems });
  };

  const updateSaleItem = (index: number, field: string, value: any) => {
    const newItems = [...formData.items];
    newItems[index] = { ...newItems[index], [field]: value };
    
    // If product is changed, update price and get available batches
    if (field === "productId") {
      const product = products.find(p => p.id === value);
      if (product) {
        newItems[index].price = product.price;
        newItems[index].batchId = "";
      }
    }
    
    setFormData({ ...formData, items: newItems });
  };

  const calculateTotals = () => {
    const subtotal = formData.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const discount = subtotal * 0.1; // 10% discount
    const tax = (subtotal - discount) * 0.08; // 8% tax
    const total = subtotal - discount + tax;
    
    return { subtotal, discount, tax, total };
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (formData.items.length === 0) {
      toast.error("Please add at least one item");
      return;
    }

    const { subtotal, discount, tax, total } = calculateTotals();
    
    try {
      const response = await fetch("/api/sales", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...formData,
          totalAmount: subtotal,
          discount,
          tax,
          finalAmount: total,
        }),
      });

      if (response.ok) {
        toast.success("Sale created successfully");
        setIsDialogOpen(false);
        resetForm();
      } else {
        toast.error("Failed to create sale");
      }
    } catch (error) {
      toast.error("An error occurred while creating the sale");
    }
  };

  const resetForm = () => {
    setFormData({
      customerName: "",
      customerId: "",
      notes: "",
      locationId: "",
      items: [],
    });
  };

  const viewSale = (sale: Sale) => {
    setSelectedSale(sale);
    setIsViewDialogOpen(true);
  };

  const generateInvoice = (sale: Sale) => {
    setSelectedSale(sale);
    setIsInvoiceDialogOpen(true);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "completed":
        return <Badge variant="default">Completed</Badge>;
      case "pending":
        return <Badge variant="secondary">Pending</Badge>;
      case "cancelled":
        return <Badge variant="destructive">Cancelled</Badge>;
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };

  const isLoading = salesLoading || productsLoading || locationsLoading;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  const { subtotal, discount, tax, total } = calculateTotals();

  return (
    <LayoutWrapper 
      title={t('sales.title')} 
      subtitle={t('sales.subtitle')}
      showNewButton={true}
      onNewClick={() => setIsDialogOpen(true)}
    >
      <div className="space-y-6">
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={resetForm}>
              <Plus className="w-4 h-4 mr-2 text-yellow-600" />
              New Sale
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[800px] max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>New Sale</DialogTitle>
              <DialogDescription>
                Create a new sale transaction
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="customerName">Customer Name</Label>
                  <Input
                    id="customerName"
                    value={formData.customerName}
                    onChange={(e) => setFormData({...formData, customerName: e.target.value})}
                    placeholder="Customer name"
                  />
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
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes">Notes</Label>
                <Textarea
                  id="notes"
                  value={formData.notes}
                  onChange={(e) => setFormData({...formData, notes: e.target.value})}
                  placeholder="Additional notes"
                />
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold">Sale Items</h3>
                  <Button type="button" variant="outline" onClick={addSaleItem}>
                    <Plus className="w-4 h-4 mr-2 text-yellow-600" />
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
                          onClick={() => removeSaleItem(index)}
                        >
                          <Trash2 className="w-4 h-4 text-yellow-600" />
                        </Button>
                      )}
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Product *</Label>
                        <Select 
                          value={item.productId} 
                          onValueChange={(value) => updateSaleItem(index, "productId", value)}
                          required
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select product" />
                          </SelectTrigger>
                          <SelectContent>
                            {products.map((product) => (
                              <SelectItem key={product.id} value={product.id}>
                                {product.name} - ${product.price}
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
                          onChange={(e) => updateSaleItem(index, "quantity", parseInt(e.target.value))}
                          required
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Price</Label>
                        <Input
                          type="number"
                          step="0.01"
                          value={item.price}
                          onChange={(e) => updateSaleItem(index, "price", parseFloat(e.target.value))}
                          readOnly
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Discount (%)</Label>
                        <Input
                          type="number"
                          step="0.01"
                          value={item.discount}
                          onChange={(e) => updateSaleItem(index, "discount", parseFloat(e.target.value))}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="border-t pt-4 space-y-2">
                <div className="flex justify-between">
                  <span>Subtotal:</span>
                  <span>${subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Discount:</span>
                  <span>-${discount.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Tax:</span>
                  <span>${tax.toFixed(2)}</span>
                </div>
                <div className="flex justify-between font-bold text-lg">
                  <span>Total:</span>
                  <span>${total.toFixed(2)}</span>
                </div>
              </div>

              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit">
                  Create Sale
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
        
        {/* Stats Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 lg:gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Today's Sales</p>
                <p className="text-2xl font-bold">$2,450</p>
                <p className="text-sm text-green-600">+12% from yesterday</p>
              </div>
              <DollarSign className="w-8 h-8 text-yellow-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Transactions</p>
                <p className="text-2xl font-bold">48</p>
                <p className="text-sm text-blue-600">+8% from yesterday</p>
              </div>
              <ShoppingCart className="w-8 h-8 text-yellow-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Average Sale</p>
                <p className="text-2xl font-bold">$51.04</p>
                <p className="text-sm text-orange-600">+3% from yesterday</p>
              </div>
              <Package className="w-8 h-8 text-yellow-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Sales History</CardTitle>
            <div className="flex flex-col space-y-2 sm:flex-row sm:space-y-0 sm:space-x-2">
              <div className="relative w-full sm:w-64">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Search sales..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 w-full"
                />
              </div>
              <Button variant="outline" size="sm" className="w-full sm:w-auto">
                <Download className="w-4 h-4 mr-2" />
                Export
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <VirtualizedTable
            data={sales}
            loading={salesLoading || salesFetching}
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
                key: "invoiceNo",
                header: "Invoice #",
                render: (value: string, sale: Sale) => (
                  <span className="font-medium">{sale.invoiceNo}</span>
                )
              },
              {
                key: "customer",
                header: "Customer",
                render: (value: string, sale: Sale) => (
                  <div className="flex items-center space-x-2">
                    <User className="w-4 h-4 text-gray-400" />
                    <span>{sale.customerName || "Walk-in"}</span>
                  </div>
                )
              },
              {
                key: "date",
                header: "Date",
                render: (value: string, sale: Sale) => (
                  <div className="flex items-center space-x-2">
                    <Calendar className="w-4 h-4 text-gray-400" />
                    <span>{new Date(sale.createdAt).toLocaleDateString()}</span>
                  </div>
                )
              },
              {
                key: "items",
                header: "Items",
                render: (value: string, sale: Sale) => (
                  <div className="flex items-center space-x-2">
                    <Package className="w-4 h-4 text-gray-400" />
                    <span>{sale.items.length} items</span>
                  </div>
                )
              },
              {
                key: "total",
                header: "Total",
                render: (value: string, sale: Sale) => (
                  <span className="font-medium">${sale.finalAmount.toFixed(2)}</span>
                )
              },
              {
                key: "status",
                header: "Status",
                render: (value: string, sale: Sale) => getStatusBadge(sale.status)
              },
              {
                key: "actions",
                header: "Actions",
                render: (value: string, sale: Sale) => (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" className="h-8 w-8 p-0">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => viewSale(sale)}>
                        <Eye className="mr-2 h-4 w-4" />
                        View
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => generateInvoice(sale)}>
                        <FileText className="mr-2 h-4 w-4" />
                        Generate Invoice
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                )
              }
            ]}
          />
        </CardContent>
      </Card>

      {/* View Sale Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Sale Details</DialogTitle>
            <DialogDescription>
              Invoice #{selectedSale?.invoiceNo}
            </DialogDescription>
          </DialogHeader>
          {selectedSale && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600">Customer</p>
                  <p className="font-medium">{selectedSale.customerName || "Walk-in"}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Date</p>
                  <p className="font-medium">{new Date(selectedSale.createdAt).toLocaleDateString()}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Location</p>
                  <p className="font-medium">{selectedSale.location?.name}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Sales Person</p>
                  <p className="font-medium">{selectedSale.user?.name}</p>
                </div>
              </div>

              <div>
                <h4 className="font-semibold mb-2">Items</h4>
                <div className="space-y-2">
                  {selectedSale.items.map((item, index) => (
                    <div key={index} className="flex justify-between items-center">
                      <div>
                        <p className="font-medium">{item.product?.name}</p>
                        <p className="text-sm text-gray-600">
                          {item.quantity} x ${item.price.toFixed(2)}
                        </p>
                      </div>
                      <p className="font-medium">${item.total.toFixed(2)}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="border-t pt-4 space-y-2">
                <div className="flex justify-between">
                  <span>Subtotal:</span>
                  <span>${selectedSale.totalAmount.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Discount:</span>
                  <span>-${selectedSale.discount.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Tax:</span>
                  <span>${selectedSale.tax.toFixed(2)}</span>
                </div>
                <div className="flex justify-between font-bold text-lg">
                  <span>Total:</span>
                  <span>${selectedSale.finalAmount.toFixed(2)}</span>
                </div>
              </div>

              {selectedSale.notes && (
                <div>
                  <p className="text-sm text-gray-600">Notes</p>
                  <p className="font-medium">{selectedSale.notes}</p>
                </div>
              )}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsViewDialogOpen(false)}>
              Close
            </Button>
            <Button onClick={() => generateInvoice(selectedSale!)}>
              <FileText className="w-4 h-4 mr-2 text-yellow-600" />
              Generate Invoice
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Invoice Dialog */}
      <Dialog open={isInvoiceDialogOpen} onOpenChange={setIsInvoiceDialogOpen}>
        <DialogContent className="sm:max-w-[900px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Invoice #{selectedSale?.invoiceNo}</DialogTitle>
            <DialogDescription>
              Paper-like invoice for customer
            </DialogDescription>
          </DialogHeader>
          {selectedSale && (
            <InvoiceTemplate 
              invoice={{
                ...selectedSale,
                customerEmail: "",
                customerPhone: "",
                customerAddress: "",
                user: selectedSale.user || { name: "System", email: "system@stockpro.com" },
                location: selectedSale.location || { name: "Main Store", address: "" }
              }}
            />
          )}
        </DialogContent>
      </Dialog>
      </div>
    </LayoutWrapper>
  );
}
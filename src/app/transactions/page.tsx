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
  Printer,
  Clock,
  CheckCircle,
  XCircle,
  Truck
} from "lucide-react";
import { toast } from "sonner";
import { LayoutWrapper } from "@/components/layout/layout-wrapper";
import { useI18n } from "@/lib/i18n/context";
import { useProducts, useLocations, useApiMutation, PaginationParams } from "@/lib/api/hooks";
import { VirtualizedTable } from "@/components/ui/virtualized-table";
import { InvoiceTemplate } from "@/components/invoice/invoice-template";

interface Transaction {
  id: string;
  invoiceNo: string;
  type: "sale" | "order";
  customerId?: string;
  customerName?: string;
  customerEmail?: string;
  customerPhone?: string;
  customerAddress?: string;
  totalAmount: number;
  discount: number;
  tax: number;
  finalAmount: number;
  status: string;
  paymentStatus: string;
  userId: string;
  locationId: string;
  notes?: string;
  estimatedDeliveryDate?: string;
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
    address?: string;
  };
  items: TransactionItem[];
}

interface TransactionItem {
  id: string;
  transactionId: string;
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
  address?: string;
}

export default function TransactionsPage() {
  const { t } = useI18n();
  const [searchTerm, setSearchTerm] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [isInvoiceDialogOpen, setIsInvoiceDialogOpen] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
  
  // Pagination state
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
  });
  
  const [formData, setFormData] = useState({
    type: "sale" as "sale" | "order",
    customerName: "",
    customerEmail: "",
    customerPhone: "",
    customerAddress: "",
    customerId: "",
    notes: "",
    locationId: "",
    estimatedDeliveryDate: "",
    items: [] as Array<{
      productId: string;
      quantity: number;
      price: number;
      discount: number;
      batchId?: string;
    }>,
  });

  // Mock data for transactions (in real app, this would come from API)
  const [transactions, setTransactions] = useState<Transaction[]>([
    {
      id: "1",
      invoiceNo: "INV-001",
      type: "sale",
      customerName: "John Doe",
      customerEmail: "john@example.com",
      totalAmount: 100,
      discount: 10,
      tax: 7.2,
      finalAmount: 97.2,
      status: "completed",
      paymentStatus: "paid",
      userId: "1",
      locationId: "1",
      notes: "Quick sale",
      createdAt: "2024-01-15T10:30:00Z",
      updatedAt: "2024-01-15T10:30:00Z",
      user: { id: "1", name: "Admin User", email: "admin@example.com" },
      location: { id: "1", name: "Main Store" },
      items: []
    },
    {
      id: "2",
      invoiceNo: "ORD-001",
      type: "order",
      customerName: "Jane Smith",
      customerEmail: "jane@example.com",
      customerPhone: "+1234567890",
      customerAddress: "123 Main St",
      totalAmount: 250,
      discount: 25,
      tax: 18,
      finalAmount: 243,
      status: "processing",
      paymentStatus: "partial",
      userId: "1",
      locationId: "1",
      notes: "Large order",
      estimatedDeliveryDate: "2024-01-20",
      createdAt: "2024-01-15T14:20:00Z",
      updatedAt: "2024-01-15T14:20:00Z",
      user: { id: "1", name: "Admin User", email: "admin@example.com" },
      location: { id: "1", name: "Main Store" },
      items: []
    }
  ]);

  const { data: products = [], isLoading: productsLoading } = useProducts();
  const { data: locations = [], isLoading: locationsLoading } = useLocations();

  // Mock pagination info
  const paginationInfo = {
    page: 1,
    totalPages: 1,
    total: 2,
    hasNext: false,
    hasPrev: false,
  };

  // Reset pagination when search or items per page changes
  useEffect(() => {
    setPagination(prev => ({ ...prev, page: 1 }));
  }, [searchTerm, pagination.limit]);

  const addTransactionItem = () => {
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

  const removeTransactionItem = (index: number) => {
    const newItems = formData.items.filter((_, i) => i !== index);
    setFormData({ ...formData, items: newItems });
  };

  const updateTransactionItem = (index: number, field: string, value: any) => {
    const newItems = [...formData.items];
    newItems[index] = { ...newItems[index], [field]: value };
    
    // If product is changed, update price and get available batches
    if (field === "productId") {
      const product = Array.isArray(products) ? products.find(p => p.id === value) : null;
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
      const response = await fetch("/api/transactions", {
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
          status: formData.type === "sale" ? "completed" : "pending",
          paymentStatus: "paid",
        }),
      });

      if (response.ok) {
        toast.success(`${formData.type === "sale" ? "Sale" : "Order"} created successfully`);
        setIsDialogOpen(false);
        resetForm();
      } else {
        toast.error(`Failed to create ${formData.type === "sale" ? "sale" : "order"}`);
      }
    } catch (error) {
      toast.error(`An error occurred while creating the ${formData.type === "sale" ? "sale" : "order"}`);
    }
  };

  const resetForm = () => {
    setFormData({
      type: "sale",
      customerName: "",
      customerEmail: "",
      customerPhone: "",
      customerAddress: "",
      customerId: "",
      notes: "",
      locationId: "",
      estimatedDeliveryDate: "",
      items: [],
    });
  };

  const viewTransaction = (transaction: Transaction) => {
    setSelectedTransaction(transaction);
    setIsViewDialogOpen(true);
  };

  const generateInvoice = (transaction: Transaction) => {
    setSelectedTransaction(transaction);
    setIsInvoiceDialogOpen(true);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "completed":
        return <Badge variant="default" className="bg-green-500">Completed</Badge>;
      case "pending":
        return <Badge variant="secondary">Pending</Badge>;
      case "processing":
        return <Badge variant="default" className="bg-blue-500">Processing</Badge>;
      case "confirmed":
        return <Badge variant="default" className="bg-purple-500">Confirmed</Badge>;
      case "shipped":
        return <Badge variant="default" className="bg-orange-500">Shipped</Badge>;
      case "delivered":
        return <Badge variant="default" className="bg-teal-500">Delivered</Badge>;
      case "cancelled":
        return <Badge variant="destructive">Cancelled</Badge>;
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };

  const getPaymentStatusBadge = (status: string) => {
    switch (status) {
      case "paid":
        return <Badge variant="default" className="bg-green-500">Paid</Badge>;
      case "unpaid":
        return <Badge variant="destructive">Unpaid</Badge>;
      case "partial":
        return <Badge variant="default" className="bg-yellow-500">Partial</Badge>;
      case "refunded":
        return <Badge variant="secondary">Refunded</Badge>;
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };

  const getTypeBadge = (type: string) => {
    switch (type) {
      case "sale":
        return <Badge variant="default" className="bg-green-600">Sale</Badge>;
      case "order":
        return <Badge variant="default" className="bg-blue-600">Order</Badge>;
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };

  const isLoading = productsLoading || locationsLoading;

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
      title={t('transactions.title')} 
      subtitle={t('transactions.subtitle')}
      showNewButton={true}
      onNewClick={() => setIsDialogOpen(true)}
    >
      <div className="space-y-6">
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={resetForm}>
              <Plus className="w-4 h-4 mr-2 text-yellow-600" />
              New Transaction
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[800px] max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>New Transaction</DialogTitle>
              <DialogDescription>
                Create a new sale or order transaction
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="type">Transaction Type *</Label>
                  <Select 
                    value={formData.type} 
                    onValueChange={(value: "sale" | "order") => setFormData({...formData, type: value})}
                    required
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="sale">Sale (Immediate Transaction)</SelectItem>
                      <SelectItem value="order">Order (Future Delivery)</SelectItem>
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
                      {Array.isArray(locations) && locations.map((location) => (
                        <SelectItem key={location.id} value={location.id}>
                          {location.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {formData.type === "order" && (
                <div className="space-y-2">
                  <Label htmlFor="estimatedDeliveryDate">Estimated Delivery Date</Label>
                  <Input
                    id="estimatedDeliveryDate"
                    type="date"
                    value={formData.estimatedDeliveryDate}
                    onChange={(e) => setFormData({...formData, estimatedDeliveryDate: e.target.value})}
                  />
                </div>
              )}

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
                  <Label htmlFor="customerEmail">Customer Email</Label>
                  <Input
                    id="customerEmail"
                    type="email"
                    value={formData.customerEmail}
                    onChange={(e) => setFormData({...formData, customerEmail: e.target.value})}
                    placeholder="Customer email"
                  />
                </div>
              </div>

              {formData.type === "order" && (
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="customerPhone">Customer Phone</Label>
                    <Input
                      id="customerPhone"
                      value={formData.customerPhone}
                      onChange={(e) => setFormData({...formData, customerPhone: e.target.value})}
                      placeholder="Customer phone"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="customerAddress">Customer Address</Label>
                    <Input
                      id="customerAddress"
                      value={formData.customerAddress}
                      onChange={(e) => setFormData({...formData, customerAddress: e.target.value})}
                      placeholder="Customer address"
                    />
                  </div>
                </div>
              )}

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
                  <h3 className="text-lg font-semibold">Transaction Items</h3>
                  <Button type="button" variant="outline" onClick={addTransactionItem}>
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
                          onClick={() => removeTransactionItem(index)}
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
                          onValueChange={(value) => updateTransactionItem(index, "productId", value)}
                          required
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select product" />
                          </SelectTrigger>
                          <SelectContent>
                            {Array.isArray(products) && products.map((product) => (
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
                          onChange={(e) => updateTransactionItem(index, "quantity", parseInt(e.target.value))}
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
                          onChange={(e) => updateTransactionItem(index, "price", parseFloat(e.target.value))}
                          readOnly
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Discount (%)</Label>
                        <Input
                          type="number"
                          step="0.01"
                          value={item.discount}
                          onChange={(e) => updateTransactionItem(index, "discount", parseFloat(e.target.value))}
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
                  Create {formData.type === "sale" ? "Sale" : "Order"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
        
        {/* Stats Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6">
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
                  <p className="text-sm font-medium text-gray-600">Pending Orders</p>
                  <p className="text-2xl font-bold">12</p>
                  <p className="text-sm text-blue-600">3 require attention</p>
                </div>
                <Clock className="w-8 h-8 text-yellow-600" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Transactions</p>
                  <p className="text-2xl font-bold">60</p>
                  <p className="text-sm text-purple-600">+8% from yesterday</p>
                </div>
                <ShoppingCart className="w-8 h-8 text-yellow-600" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Average Value</p>
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
              <CardTitle>Transactions History</CardTitle>
              <div className="flex flex-col space-y-2 sm:flex-row sm:space-y-0 sm:space-x-2">
                <div className="relative w-full sm:w-64">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    placeholder="Search transactions..."
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
              data={transactions}
              loading={false}
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
                  render: (value: string, transaction: Transaction) => (
                    <span className="font-medium">{transaction.invoiceNo}</span>
                  )
                },
                {
                  key: "type",
                  header: "Type",
                  render: (value: string, transaction: Transaction) => getTypeBadge(transaction.type)
                },
                {
                  key: "customer",
                  header: "Customer",
                  render: (value: string, transaction: Transaction) => (
                    <div className="flex items-center space-x-2">
                      <User className="w-4 h-4 text-gray-400" />
                      <span>{transaction.customerName || "Walk-in"}</span>
                    </div>
                  )
                },
                {
                  key: "date",
                  header: "Date",
                  render: (value: string, transaction: Transaction) => (
                    <div className="flex items-center space-x-2">
                      <Calendar className="w-4 h-4 text-gray-400" />
                      <span>{new Date(transaction.createdAt).toLocaleDateString()}</span>
                    </div>
                  )
                },
                {
                  key: "status",
                  header: "Status",
                  render: (value: string, transaction: Transaction) => getStatusBadge(transaction.status)
                },
                {
                  key: "paymentStatus",
                  header: "Payment",
                  render: (value: string, transaction: Transaction) => getPaymentStatusBadge(transaction.paymentStatus)
                },
                {
                  key: "total",
                  header: "Total",
                  render: (value: string, transaction: Transaction) => (
                    <span className="font-medium">${transaction.finalAmount.toFixed(2)}</span>
                  )
                },
                {
                  key: "actions",
                  header: "Actions",
                  render: (value: string, transaction: Transaction) => (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => viewTransaction(transaction)}>
                          <Eye className="mr-2 h-4 w-4" />
                          View
                        </DropdownMenuItem>
                        {transaction.type === "sale" && (
                          <DropdownMenuItem onClick={() => generateInvoice(transaction)}>
                            <FileText className="mr-2 h-4 w-4" />
                            Generate Invoice
                          </DropdownMenuItem>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  )
                }
              ]}
            />
          </CardContent>
        </Card>

        {/* View Transaction Dialog */}
        <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>Transaction Details</DialogTitle>
              <DialogDescription>
                {selectedTransaction?.type === "sale" ? "Sale" : "Order"} #{selectedTransaction?.invoiceNo}
              </DialogDescription>
            </DialogHeader>
            {selectedTransaction && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-600">Type</p>
                    <p className="font-medium">{getTypeBadge(selectedTransaction.type)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Customer</p>
                    <p className="font-medium">{selectedTransaction.customerName || "Walk-in"}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Date</p>
                    <p className="font-medium">{new Date(selectedTransaction.createdAt).toLocaleDateString()}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Location</p>
                    <p className="font-medium">{selectedTransaction.location?.name}</p>
                  </div>
                  {selectedTransaction.customerEmail && (
                    <div>
                      <p className="text-sm text-gray-600">Email</p>
                      <p className="font-medium">{selectedTransaction.customerEmail}</p>
                    </div>
                  )}
                  {selectedTransaction.customerPhone && (
                    <div>
                      <p className="text-sm text-gray-600">Phone</p>
                      <p className="font-medium">{selectedTransaction.customerPhone}</p>
                    </div>
                  )}
                  {selectedTransaction.estimatedDeliveryDate && (
                    <div>
                      <p className="text-sm text-gray-600">Est. Delivery</p>
                      <p className="font-medium">{new Date(selectedTransaction.estimatedDeliveryDate).toLocaleDateString()}</p>
                    </div>
                  )}
                  <div>
                    <p className="text-sm text-gray-600">Sales Person</p>
                    <p className="font-medium">{selectedTransaction.user?.name}</p>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-600">Status</p>
                    <p className="font-medium">{getStatusBadge(selectedTransaction.status)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Payment Status</p>
                    <p className="font-medium">{getPaymentStatusBadge(selectedTransaction.paymentStatus)}</p>
                  </div>
                </div>

                <div>
                  <h4 className="font-semibold mb-2">Items</h4>
                  <div className="space-y-2">
                    {selectedTransaction.items.map((item, index) => (
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
                    <span>${selectedTransaction.totalAmount.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Discount:</span>
                    <span>-${selectedTransaction.discount.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Tax:</span>
                    <span>${selectedTransaction.tax.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between font-bold text-lg">
                    <span>Total:</span>
                    <span>${selectedTransaction.finalAmount.toFixed(2)}</span>
                  </div>
                </div>

                {selectedTransaction.notes && (
                  <div>
                    <p className="text-sm text-gray-600">Notes</p>
                    <p className="font-medium">{selectedTransaction.notes}</p>
                  </div>
                )}
              </div>
            )}
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsViewDialogOpen(false)}>
                Close
              </Button>
              {selectedTransaction?.type === "sale" && (
                <Button onClick={() => generateInvoice(selectedTransaction)}>
                  <FileText className="w-4 h-4 mr-2 text-yellow-600" />
                  Generate Invoice
                </Button>
              )}
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Invoice Dialog */}
        <Dialog open={isInvoiceDialogOpen} onOpenChange={setIsInvoiceDialogOpen}>
          <DialogContent className="sm:max-w-[900px] max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Invoice #{selectedTransaction?.invoiceNo}</DialogTitle>
              <DialogDescription>
                Paper-like invoice for customer
              </DialogDescription>
            </DialogHeader>
            {selectedTransaction && (
              <InvoiceTemplate 
                invoice={{
                  ...selectedTransaction,
                  customerEmail: selectedTransaction.customerEmail || "",
                  customerPhone: selectedTransaction.customerPhone || "",
                  customerAddress: selectedTransaction.customerAddress || "",
                  user: selectedTransaction.user || { name: "System", email: "system@stockpro.com" },
                  location: selectedTransaction.location || { name: "Main Store", address: "" }
                }}
              />
            )}
          </DialogContent>
        </Dialog>
      </div>
    </LayoutWrapper>
  );
}
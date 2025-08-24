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
import { Switch } from "@/components/ui/switch";
import { 
  Plus, 
  Search, 
  MoreHorizontal, 
  Edit, 
  Trash2, 
  Package,
  Barcode,
  AlertTriangle,
  Filter
} from "lucide-react";
import { LayoutWrapper } from "@/components/layout/layout-wrapper";
import { useRefresh } from "@/lib/hooks/use-refresh";
import { ShimmerTable } from "@/components/ui/shimmer";
import { toast } from "sonner";
import { useI18n } from "@/lib/i18n/context";
import { useProducts, useCategories, useApiMutation, PaginationParams } from "@/lib/api/hooks";
import { VirtualizedTable } from "@/components/ui/virtualized-table";

interface Product {
  id: string;
  name: string;
  description?: string;
  sku?: string;
  barcode?: string;
  price: number;
  cost: number;
  categoryId: string;
  minStock: number;
  maxStock?: number;
  trackBatch: boolean;
  trackExpiry: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  category?: {
    id: string;
    name: string;
  };
  stockItems?: Array<{
    id: string;
    quantity: number;
    available: number;
    status: string;
    location: {
      id: string;
      name: string;
    };
  }>;
}

interface Category {
  id: string;
  name: string;
  description?: string;
}

export default function ProductsPage() {
  const { t } = useI18n();
  const [searchTerm, setSearchTerm] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  
  // Pagination state
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
  });

  // Refresh functionality
  const { refresh, isRefreshing, showShimmer } = useRefresh({
    onSuccess: () => {
      toast.success("Products data refreshed successfully");
    },
    onError: (error) => {
      toast.error("Failed to refresh products data");
    }
  });

  const handleRefresh = () => {
    // TanStack Query will automatically refetch the data
    refresh();
  };
  
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    sku: "",
    barcode: "",
    price: "",
    cost: "",
    categoryId: "",
    minStock: "0",
    maxStock: "",
    trackBatch: false,
    trackExpiry: false,
    isActive: true,
  });

  // Use enhanced TanStack Query hooks with pagination
  const { 
    data: productsData, 
    isLoading: productsLoading, 
    isFetching: productsFetching
  } = useProducts({
    page: pagination.page,
    limit: pagination.limit,
    search: searchTerm || undefined,
    sortBy: "createdAt",
    sortOrder: "desc" as const,
  });
  
  const { data: categories = [], isLoading: categoriesLoading } = useCategories();

  // Extract data from paginated response
  const products = productsData?.data || [];
  const paginationInfo = productsData?.pagination || {
    page: 1,
    totalPages: 1,
    total: 0,
    hasNext: false,
    hasPrev: false,
  };

  // Mutations
  const createProductMutation = useApiMutation(
    "/products",
    "POST",
    {
      onSuccess: () => {
        setIsDialogOpen(false);
        resetForm();
      },
      invalidateQueries: [["products"]]
    }
  );

  const updateProductMutation = useApiMutation(
    "/products",
    "PUT",
    {
      onSuccess: () => {
        setIsDialogOpen(false);
        resetForm();
      },
      invalidateQueries: [["products"]]
    }
  );

  const deleteProductMutation = useApiMutation(
    "/products",
    "DELETE",
    {
      invalidateQueries: [["products"]]
    }
  );

  // Reset pagination when search or items per page changes
  useEffect(() => {
    setPagination(prev => ({ ...prev, page: 1 }));
  }, [searchTerm, pagination.limit]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const productData = {
      ...formData,
      price: parseFloat(formData.price),
      cost: parseFloat(formData.cost),
      minStock: parseInt(formData.minStock),
      maxStock: formData.maxStock ? parseInt(formData.maxStock) : null,
    };

    if (editingProduct) {
      updateProductMutation.mutate({
        ...productData,
        id: editingProduct.id
      });
    } else {
      createProductMutation.mutate(productData);
    }
  };

  const handleEdit = (product: Product) => {
    setEditingProduct(product);
    setFormData({
      name: product.name,
      description: product.description || "",
      sku: product.sku || "",
      barcode: product.barcode || "",
      price: product.price.toString(),
      cost: product.cost.toString(),
      categoryId: product.categoryId,
      minStock: product.minStock.toString(),
      maxStock: product.maxStock?.toString() || "",
      trackBatch: product.trackBatch,
      trackExpiry: product.trackExpiry,
      isActive: product.isActive,
    });
    setIsDialogOpen(true);
  };

  const handleDelete = (productId: string) => {
    if (confirm("Are you sure you want to delete this product?")) {
      deleteProductMutation.mutate(productId);
    }
  };

  const resetForm = () => {
    setFormData({
      name: "",
      description: "",
      sku: "",
      barcode: "",
      price: "",
      cost: "",
      categoryId: "",
      minStock: "0",
      maxStock: "",
      trackBatch: false,
      trackExpiry: false,
      isActive: true,
    });
    setEditingProduct(null);
  };

  const getTotalStock = (product: Product) => {
    return product.stockItems?.reduce((total, item) => total + item.quantity, 0) || 0;
  };

  const getStockStatus = (product: Product) => {
    const totalStock = getTotalStock(product);
    if (totalStock === 0) return "OUT_OF_STOCK";
    if (totalStock <= product.minStock) return "LOW_STOCK";
    return "IN_STOCK";
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "IN_STOCK":
        return <Badge variant="default">In Stock</Badge>;
      case "LOW_STOCK":
        return <Badge variant="secondary">Low Stock</Badge>;
      case "OUT_OF_STOCK":
        return <Badge variant="destructive">Out of Stock</Badge>;
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };

  return (
    <LayoutWrapper 
      title={t('products.title')} 
      subtitle={t('products.subtitle')}
      showNewButton={true}
      onNewClick={() => setIsDialogOpen(true)}
      onRefreshClick={handleRefresh}
      isRefreshing={isRefreshing}
      showShimmer={showShimmer}
      shimmerType="table"
    >
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <div className="flex flex-col space-y-3 sm:flex-row sm:space-y-0 sm:items-center sm:justify-between">
              <CardTitle>{t('products.productInventory')}</CardTitle>
              <div className="flex flex-col space-y-2 sm:flex-row sm:space-y-0 sm:space-x-2">
                <div className="relative w-full sm:w-64">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    placeholder={t('products.searchProducts')}
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 w-full"
                  />
                </div>
                <Button variant="gold" size="sm" className="w-full sm:w-auto">
                  <Filter className="w-4 h-4 mr-2" />
                  {t('common.filter')}
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {(productsLoading || categoriesLoading) ? (
              <ShimmerTable rows={5} columns={7} />
            ) : (
              <VirtualizedTable
                data={products}
                loading={productsLoading || productsFetching}
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
                  key: "name",
                  header: "Product",
                  render: (value: string, product: Product) => (
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
                        <Package className="w-4 h-4 text-gray-600" />
                      </div>
                      <div>
                        <div className="font-medium truncate">{product.name}</div>
                        {product.description && (
                          <div className="text-sm text-gray-500 truncate">{product.description}</div>
                        )}
                      </div>
                    </div>
                  )
                },
                {
                  key: "sku",
                  header: "SKU",
                  render: (value: string, product: Product) => (
                    <div className="flex items-center space-x-2">
                      {product.sku && (
                        <>
                          <Barcode className="w-4 h-4 text-gray-400" />
                          <span className="text-sm truncate">{product.sku}</span>
                        </>
                      )}
                    </div>
                  )
                },
                {
                  key: "category",
                  header: "Category",
                  render: (value: string, product: Product) => product.category?.name || 'N/A'
                },
                {
                  key: "price",
                  header: "Price",
                  render: (value: number, product: Product) => `$${product.price.toFixed(2)}`
                },
                {
                  key: "stock",
                  header: "Stock",
                  render: (value: string, product: Product) => (
                    <div className="flex flex-col space-y-1 sm:flex-row sm:space-y-0 sm:space-x-2 sm:items-center">
                      <span className="font-medium">{getTotalStock(product)}</span>
                      <div className="flex space-x-1">
                        {product.trackBatch && (
                          <Badge variant="outline" className="text-xs">Batch</Badge>
                        )}
                        {product.trackExpiry && (
                          <Badge variant="outline" className="text-xs">Expiry</Badge>
                        )}
                      </div>
                    </div>
                  )
                },
                {
                  key: "status",
                  header: "Status",
                  render: (value: string, product: Product) => getStatusBadge(getStockStatus(product))
                },
                {
                  key: "actions",
                  header: "Actions",
                  render: (value: string, product: Product) => (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <MoreHorizontal className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleEdit(product)}>
                          <Edit className="w-4 h-4 mr-2" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          onClick={() => handleDelete(product.id)}
                          className="text-red-600"
                        >
                          <Trash2 className="w-4 h-4 mr-2" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  )
                }
              ]}
            />
            )}
          </CardContent>
        </Card>

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="max-w-2xl sm:max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingProduct ? "Edit Product" : "Add New Product"}
              </DialogTitle>
              <DialogDescription>
                {editingProduct 
                  ? "Update the product information below."
                  : "Create a new product by filling out the form below."
                }
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Product Name *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="sku">SKU</Label>
                  <Input
                    id="sku"
                    value={formData.sku}
                    onChange={(e) => setFormData({...formData, sku: e.target.value})}
                    placeholder="Unique SKU"
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  placeholder="Product description"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="barcode">Barcode</Label>
                  <Input
                    id="barcode"
                    value={formData.barcode}
                    onChange={(e) => setFormData({...formData, barcode: e.target.value})}
                    placeholder="Barcode number"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="category">Category *</Label>
                  <Select 
                    value={formData.categoryId} 
                    onValueChange={(value) => setFormData({...formData, categoryId: value})}
                    required
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select a category" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((category) => (
                        <SelectItem key={category.id} value={category.id}>
                          {category.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="price">Price *</Label>
                  <Input
                    id="price"
                    type="number"
                    step="0.01"
                    value={formData.price}
                    onChange={(e) => setFormData({...formData, price: e.target.value})}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="cost">Cost *</Label>
                  <Input
                    id="cost"
                    type="number"
                    step="0.01"
                    value={formData.cost}
                    onChange={(e) => setFormData({...formData, cost: e.target.value})}
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="minStock">Min Stock *</Label>
                  <Input
                    id="minStock"
                    type="number"
                    value={formData.minStock}
                    onChange={(e) => setFormData({...formData, minStock: e.target.value})}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="maxStock">Max Stock</Label>
                  <Input
                    id="maxStock"
                    type="number"
                    value={formData.maxStock}
                    onChange={(e) => setFormData({...formData, maxStock: e.target.value})}
                    placeholder="Optional"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex items-center space-x-2">
                  <Switch
                    id="trackBatch"
                    checked={formData.trackBatch}
                    onCheckedChange={(checked) => setFormData({...formData, trackBatch: checked})}
                  />
                  <Label htmlFor="trackBatch">Track Batch Numbers</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Switch
                    id="trackExpiry"
                    checked={formData.trackExpiry}
                    onCheckedChange={(checked) => setFormData({...formData, trackExpiry: checked})}
                  />
                  <Label htmlFor="trackExpiry">Track Expiry Dates</Label>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="isActive"
                  checked={formData.isActive}
                  onCheckedChange={(checked) => setFormData({...formData, isActive: checked})}
                />
                <Label htmlFor="isActive">Active Product</Label>
              </div>

              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  variant="gold"
                  disabled={createProductMutation.isPending || updateProductMutation.isPending}
                >
                  {createProductMutation.isPending || updateProductMutation.isPending ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      {editingProduct ? "Updating..." : "Creating..."}
                    </>
                  ) : (
                    editingProduct ? "Update Product" : "Create Product"
                  )}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </LayoutWrapper>
  );
}
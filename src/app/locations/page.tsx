"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useUserRoleAndLocation } from "@/lib/hooks/use-user-role-location";
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
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { 
  Plus, 
  Search, 
  MoreHorizontal, 
  Edit, 
  Trash2, 
  MapPin,
  Package,
  Truck,
  Building,
  FileText,
  Filter
} from "lucide-react";
import { toast } from "sonner";
import { LayoutWrapper } from "@/components/layout/layout-wrapper";
import { useI18n } from "@/lib/i18n/context";
import { useRefresh } from "@/lib/hooks/use-refresh";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";

interface Location {
  id: string;
  name: string;
  description?: string;
  address?: string;
  createdAt: string;
  updatedAt: string;
  _count?: {
    stockItems?: number;
    transfersFrom?: number;
    transfersTo?: number;
    stockLogs?: number;
  };
}

export default function LocationsPage() {
  const { t } = useI18n();
  const [searchTerm, setSearchTerm] = useState("");
  const [stockFilter, setStockFilter] = useState("all");
  const [locations, setLocations] = useState<Location[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingLocation, setEditingLocation] = useState<Location | null>(null);

  // Refresh functionality
  const { refresh, isRefreshing } = useRefresh({
    onSuccess: () => {
      toast.success("Locations data refreshed successfully");
    },
    onError: (error) => {
      toast.error("Failed to refresh locations data");
    }
  });

  const handleRefresh = () => {
    refresh(fetchLocations);
  };
  
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    address: "",
  });

  useEffect(() => {
    fetchLocations();
  }, []);

  const fetchLocations = async () => {
    setIsLoading(true);
    try {
      const { role } = useUserRoleAndLocation();
      const url = role === "ADMIN"
        ? "/api/locations"
        : `/api/locations?userId=${user?.locationId}`;
        
      const response = await fetch(url);
      if (response.ok) {
        const data = await response.json();
        setLocations(data);
      } else {
        toast.error("Failed to fetch locations");
      }
    } catch (error) {
      toast.error("An error occurred while fetching locations");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const url = editingLocation ? `/api/locations/${editingLocation.id}` : "/api/locations";
      const method = editingLocation ? "PUT" : "POST";
      
      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        toast.success(`Location ${editingLocation ? 'updated' : 'created'} successfully`);
        setIsDialogOpen(false);
        resetForm();
        fetchLocations();
      } else {
        const error = await response.json();
        toast.error(error.error || `Failed to ${editingLocation ? 'update' : 'create'} location`);
      }
    } catch (error) {
      toast.error(`An error occurred while ${editingLocation ? 'updating' : 'creating'} the location`);
    }
  };

  const handleEdit = (location: Location) => {
    setEditingLocation(location);
    setFormData({
      name: location.name,
      description: location.description || "",
      address: location.address || "",
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (locationId: string) => {
    if (confirm("Are you sure you want to delete this location? This action cannot be undone.")) {
      try {
        const response = await fetch(`/api/locations/${locationId}`, {
          method: "DELETE",
        });

        if (response.ok) {
          toast.success("Location deleted successfully");
          fetchLocations();
        } else {
          const error = await response.json();
          toast.error(error.error || "Failed to delete location");
        }
      } catch (error) {
        toast.error("An error occurred while deleting the location");
      }
    }
  };

  const resetForm = () => {
    setFormData({
      name: "",
      description: "",
      address: "",
    });
    setEditingLocation(null);
  };

  // Helper functions to safely access count values
  const getStockItemsCount = (location?: Location) => location?._count?.stockItems || 0;
  const getTransfersFromCount = (location?: Location) => location?._count?.transfersFrom || 0;
  const getTransfersToCount = (location?: Location) => location?._count?.transfersTo || 0;
  const getTotalTransfersCount = (location?: Location) => 
    getTransfersFromCount(location) + getTransfersToCount(location);

  const filteredLocations = locations.filter(location => {
    const matchesSearch = location.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      location.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      location.address?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const stockCount = getStockItemsCount(location);
    const matchesStockFilter = stockFilter === "all" || 
      (stockFilter === "withStock" && stockCount > 0) ||
      (stockFilter === "noStock" && stockCount === 0);
    
    return matchesSearch && matchesStockFilter;
  });

  const totalLocations = locations.length;
  const totalStockItems = locations.reduce((sum, loc) => sum + getStockItemsCount(loc), 0);
  const totalTransfers = locations.reduce((sum, loc) => sum + getTotalTransfersCount(loc), 0);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  return (
    <LayoutWrapper
      title="Locations Management"
      subtitle="Manage your inventory locations and warehouses"
      showNewButton={true}
      onNewClick={() => {
        resetForm();
        setIsDialogOpen(true);
      }}
      onRefreshClick={handleRefresh}
      isRefreshing={isRefreshing}
    >
      <div className="space-y-6">
        <div className="flex flex-col space-y-2 sm:flex-row sm:space-y-0 sm:space-x-2">
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={resetForm} className="w-full sm:w-auto">
                <Plus className="w-4 h-4 mr-2" />
                Add Location
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>
                  {editingLocation ? "Edit Location" : "Add New Location"}
                </DialogTitle>
                <DialogDescription>
                  {editingLocation 
                    ? "Update the location information below"
                    : "Create a new inventory location or warehouse"
                  }
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Location Name *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    placeholder="e.g., Main Warehouse, Store A, Office"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({...formData, description: e.target.value})}
                    placeholder="Brief description of the location..."
                    rows={3}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="address">Address</Label>
                  <Textarea
                    id="address"
                    value={formData.address}
                    onChange={(e) => setFormData({...formData, address: e.target.value})}
                    placeholder="Full address of the location..."
                    rows={3}
                  />
                </div>

                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit">
                    {editingLocation ? "Update Location" : "Add Location"}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
        
        {/* Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 lg:gap-6">
          <Card>
            <CardContent className="p-4 sm:p-6">
              <div className="flex flex-col space-y-2 sm:flex-row sm:space-y-0 sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Locations</p>
                  <p className="text-xl sm:text-2xl font-bold">{totalLocations}</p>
                  <p className="text-sm text-green-600">Active locations</p>
                </div>
                <Building className="w-6 h-6 sm:w-8 sm:h-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4 sm:p-6">
              <div className="flex flex-col space-y-2 sm:flex-row sm:space-y-0 sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Stock Items</p>
                  <p className="text-xl sm:text-2xl font-bold">{totalStockItems}</p>
                  <p className="text-sm text-blue-600">Across all locations</p>
                </div>
                <Package className="w-6 h-6 sm:w-8 sm:h-8 text-green-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4 sm:p-6">
              <div className="flex flex-col space-y-2 sm:flex-row sm:space-y-0 sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Transfers</p>
                  <p className="text-xl sm:text-2xl font-bold">{totalTransfers}</p>
                  <p className="text-sm text-purple-600">Transfer activities</p>
                </div>
                <Truck className="w-6 h-6 sm:w-8 sm:h-8 text-purple-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <div className="flex flex-col space-y-3 sm:flex-row sm:space-y-0 sm:items-center sm:justify-between">
              <CardTitle>Inventory Locations</CardTitle>
              <div className="flex flex-col space-y-2 sm:flex-row sm:space-y-0 sm:space-x-2">
                <div className="relative w-full sm:w-64">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    placeholder="Search locations..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 w-full"
                  />
                </div>
                <Select value={stockFilter} onValueChange={setStockFilter}>
                  <SelectTrigger className="w-full sm:w-48">
                    <Filter className="w-4 h-4 mr-2" />
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Locations</SelectItem>
                    <SelectItem value="withStock">With Stock Items</SelectItem>
                    <SelectItem value="noStock">No Stock Items</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border overflow-hidden custom-scrollbar table-container-mobile">
              <Table className="structured-table table-mobile-min-width">
                <TableHeader>
                  <TableRow>
                    <TableHead className="table-header-location table-cell-name">Location Name</TableHead>
                    <TableHead className="table-header-address table-cell-address">Address</TableHead>
                    <TableHead className="table-header-number table-cell-number">Stock Items</TableHead>
                    <TableHead className="table-header-number table-cell-number">Transfers</TableHead>
                    <TableHead className="table-header-actions table-cell-actions">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredLocations.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="h-24 text-center">
                        <div className="text-muted-foreground">
                          No locations found
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredLocations.map((location) => (
                      <TableRow key={location.id} className="hover:bg-muted/50">
                        <TableCell className="table-cell-name">
                          <div className="flex items-center space-x-3">
                            <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                              <MapPin className="w-4 h-4 text-blue-600" />
                            </div>
                            <div className="min-w-0">
                              <div className="font-medium truncate">{location.name}</div>
                              {location.description && (
                                <div className="text-sm text-gray-500 truncate">
                                  {location.description}
                                </div>
                              )}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="table-cell-address">
                          <div className="text-sm text-gray-900 truncate">
                            {location.address || (
                              <span className="text-gray-400">No address provided</span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="table-cell-number">
                          <div className="flex items-center justify-center space-x-2">
                            <Package className="w-4 h-4 text-green-600 flex-shrink-0" />
                            <span className="font-medium">{getStockItemsCount(location)}</span>
                          </div>
                        </TableCell>
                        <TableCell className="table-cell-number">
                          <div className="flex items-center justify-center space-x-2">
                            <Truck className="w-4 h-4 text-purple-600 flex-shrink-0" />
                            <span className="font-medium">
                              {getTotalTransfersCount(location)}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="table-cell-actions">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm">
                                <MoreHorizontal className="w-4 h-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => handleEdit(location)}>
                                <Edit className="w-4 h-4 mr-2" />
                                Edit
                              </DropdownMenuItem>
                              <DropdownMenuItem 
                                onClick={() => handleDelete(location.id)}
                                className="text-red-600"
                              >
                                <Trash2 className="w-4 h-4 mr-2" />
                                Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
    </LayoutWrapper>
  );
}
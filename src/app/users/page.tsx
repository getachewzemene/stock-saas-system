"use client";

import { useState, useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardWhite } from "@/components/ui/card";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow,
  TableWhite
} from "@/components/ui/table";
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
  Users,
  Shield,
  Mail,
  Phone,
  Calendar,
  RefreshCw,
  Eye,
  Key,
  UserPlus,
  UserCheck,
  UserX
} from "lucide-react";
import { LayoutWrapper } from "@/components/layout/layout-wrapper";
import { useI18n } from "@/lib/i18n/context";
import { useUsers, useApiMutation, PaginationParams } from "@/lib/api/hooks";
import { VirtualizedTable } from "@/components/ui/virtualized-table";
import { LoadingTable } from "@/components/ui/loading";

interface User {
  id: string;
  name: string;
  email: string;
  phone?: string;
  role: string;
  isActive: boolean;
  lastLogin?: string;
  createdAt: string;
  updatedAt: string;
  locations?: Array<{
    id: string;
    name: string;
  }>;
}

interface Location {
  id: string;
  name: string;
}

export default function UsersPage() {
  const { t } = useI18n();
  const [locations, setLocations] = useState<Location[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  
  // Pagination state
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
  });
  
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    role: "STAFF",
    isActive: true,
    locationIds: [] as string[],
  });

  // Use enhanced TanStack Query for users with pagination
  const { 
    data: usersData, 
    isLoading: usersLoading, 
    isFetching: usersFetching 
  } = useUsers({
    page: pagination.page,
    limit: pagination.limit,
    search: searchTerm || undefined,
    filters: {
      ...(roleFilter !== "all" && { role: roleFilter }),
      ...(statusFilter !== "all" && { 
        isActive: statusFilter === "active" 
      }),
    },
    sortBy: "createdAt",
    sortOrder: "desc" as const,
  });

  // Extract data from paginated response
  const users = usersData?.data || [];
  const paginationInfo = usersData?.pagination || {
    page: 1,
    totalPages: 1,
    total: 0,
    hasNext: false,
    hasPrev: false,
  };

  // Mutations
  const createUserMutation = useApiMutation(
    "/users",
    "POST",
    {
      onSuccess: () => {
        setIsDialogOpen(false);
        resetForm();
      },
      invalidateQueries: [["users"]]
    }
  );

  const toggleUserStatusMutation = useApiMutation(
    "/users",
    "PATCH",
    {
      invalidateQueries: [["users"]]
    }
  );

  const resetPasswordMutation = useApiMutation(
    "/users",
    "POST"
  );

  // Fetch locations (not yet in hooks)
  useEffect(() => {
    const fetchLocations = async () => {
      try {
        const response = await fetch("/api/locations");
        if (response.ok) {
          const data = await response.json();
          const locationsData = Array.isArray(data) ? data : [];
          setLocations(locationsData);
        } else {
          setLocations([]);
        }
      } catch (error) {
        console.error("Failed to fetch locations");
        setLocations([]);
      }
    };
    fetchLocations();
  }, []);

  // Reset pagination when filters or items per page change
  useEffect(() => {
    setPagination(prev => ({ ...prev, page: 1 }));
  }, [searchTerm, roleFilter, statusFilter, pagination.limit]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createUserMutation.mutate(formData);
  };

  const handleToggleUserStatus = (userId: string, isActive: boolean) => {
    toggleUserStatusMutation.mutate({
      userId,
      isActive,
      endpoint: `${userId}/toggle-status`
    });
  };

  const handleResetPassword = (userId: string) => {
    if (confirm("Are you sure you want to reset this user's password?")) {
      resetPasswordMutation.mutate({
        userId,
        endpoint: `${userId}/reset-password`
      });
    }
  };

  const resetForm = () => {
    setFormData({
      name: "",
      email: "",
      phone: "",
      role: "STAFF",
      isActive: true,
      locationIds: [],
    });
  };

  const viewUser = (user: User) => {
    setSelectedUser(user);
    setIsViewDialogOpen(true);
  };

  const getRoleBadge = (role: string) => {
    switch (role) {
      case "ADMIN":
        return <Badge variant="destructive">Admin</Badge>;
      case "MANAGER":
        return <Badge variant="default">Manager</Badge>;
      case "STAFF":
        return <Badge variant="secondary">Staff</Badge>;
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };

  const getStatusBadge = (isActive: boolean) => {
    if (isActive) {
      return <Badge variant="default"><UserCheck className="w-3 h-3 mr-1" />Active</Badge>;
    } else {
      return <Badge variant="secondary"><UserX className="w-3 h-3 mr-1" />Inactive</Badge>;
    }
  };

  // Use separate query for summary counts (non-paginated)
  const { data: allUsersData } = useUsers(); // This gets all users for counts
  
  const allUsers = allUsersData?.data || [];
  const adminCount = allUsers.filter(u => u.role === "ADMIN").length;
  const managerCount = allUsers.filter(u => u.role === "MANAGER").length;
  const staffCount = allUsers.filter(u => u.role === "STAFF").length;
  const activeCount = allUsers.filter(u => u.isActive).length;

  if (usersLoading) {
    return (
      <LayoutWrapper 
        title={t('users.title')} 
        subtitle={t('users.subtitle')}
        showNewButton={true}
        onNewClick={() => setIsDialogOpen(true)}
      >
        <div className="space-y-6">
          <div className="flex flex-col space-y-2 sm:flex-row sm:space-y-0 sm:space-x-2">
            <Button variant="outline" disabled className="w-full sm:w-auto">
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh
            </Button>
            <Button disabled className="w-full sm:w-auto">
              <UserPlus className="w-4 h-4 mr-2" />
              Add User
            </Button>
          </div>
          
          {/* Loading skeleton for summary cards */}
          <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6">
            {[...Array(4)].map((_, i) => (
              <Card key={i}>
                <CardContent className="p-4 sm:p-6">
                  <div className="space-y-3">
                    <div className="h-4 bg-gray-200 rounded w-3/4 animate-pulse"></div>
                    <div className="h-8 bg-gray-200 rounded w-1/2 animate-pulse"></div>
                    <div className="h-3 bg-gray-200 rounded w-full animate-pulse"></div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Loading skeleton for table */}
          <Card>
            <CardHeader>
              <div className="flex flex-col space-y-3 sm:flex-row sm:space-y-0 sm:items-center sm:justify-between">
                <CardTitle>User Directory</CardTitle>
                <div className="flex flex-col space-y-2 sm:flex-row sm:space-y-0 sm:space-x-2">
                  <div className="relative w-full sm:w-64">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <Input
                      placeholder="Search users..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10 w-full"
                      disabled
                    />
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <LoadingTable rows={5} columns={6} />
            </CardContent>
          </Card>
        </div>
      </LayoutWrapper>
    );
  }

  return (
    <LayoutWrapper 
      title={t('users.title')} 
      subtitle={t('users.subtitle')}
      showNewButton={true}
      onNewClick={() => setIsDialogOpen(true)}
    >
      <div className="space-y-6">
        <div className="flex flex-col space-y-2 sm:flex-row sm:space-y-0 sm:space-x-2">
          <Button variant="gold" className="w-full sm:w-auto">
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="gold" onClick={resetForm} className="w-full sm:w-auto">
                <UserPlus className="w-4 h-4 mr-2" />
                Add User
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Add New User</DialogTitle>
                <DialogDescription>
                  Create a new user account with specific role and permissions
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Full Name *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email Address *</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone">Phone Number</Label>
                  <Input
                    id="phone"
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({...formData, phone: e.target.value})}
                    placeholder="Optional phone number"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="role">Role *</Label>
                  <Select 
                    value={formData.role} 
                    onValueChange={(value) => setFormData({...formData, role: value})}
                    required
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ADMIN">Administrator</SelectItem>
                      <SelectItem value="MANAGER">Manager</SelectItem>
                      <SelectItem value="STAFF">Staff</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="locations">Assigned Locations</Label>
                  <Select 
                    value={formData.locationIds.join(",")} 
                    onValueChange={(value) => setFormData({...formData, locationIds: value ? value.split(",") : []})}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select locations (optional)" />
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

                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="isActive"
                    checked={formData.isActive}
                    onChange={(e) => setFormData({...formData, isActive: e.target.checked})}
                    className="rounded"
                  />
                  <Label htmlFor="isActive">Active User</Label>
                </div>

                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" variant="gold" disabled={createUserMutation.isPending}>
                    {createUserMutation.isPending ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Creating...
                      </>
                    ) : (
                      "Create User"
                    )}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
        
      {/* Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6">
        <Card className="dashboard-card-blue">
          <CardContent className="p-4 sm:p-6">
            <div className="flex flex-col space-y-2 sm:flex-row sm:space-y-0 sm:items-center sm:justify-between">
              <div>
                <p className="text-sm font-medium text-white/80">Total Users</p>
                <p className="text-xl sm:text-2xl font-bold text-white">{Array.isArray(users) ? users.length : 0}</p>
                <p className="text-sm text-green-200">Registered users</p>
              </div>
              <Users className="w-6 h-6 sm:w-8 sm:h-8 text-white" />
            </div>
          </CardContent>
        </Card>

        <Card className="dashboard-card-green">
          <CardContent className="p-4 sm:p-6">
            <div className="flex flex-col space-y-2 sm:flex-row sm:space-y-0 sm:items-center sm:justify-between">
              <div>
                <p className="text-sm font-medium text-white/80">Active Users</p>
                <p className="text-xl sm:text-2xl font-bold text-white">{activeCount}</p>
                <p className="text-sm text-green-200">Currently active</p>
              </div>
              <UserCheck className="w-6 h-6 sm:w-8 sm:h-8 text-white" />
            </div>
          </CardContent>
        </Card>

        <Card className="dashboard-card-orange">
          <CardContent className="p-4 sm:p-6">
            <div className="flex flex-col space-y-2 sm:flex-row sm:space-y-0 sm:items-center sm:justify-between">
              <div>
                <p className="text-sm font-medium text-white/80">Administrators</p>
                <p className="text-xl sm:text-2xl font-bold text-white">{adminCount}</p>
                <p className="text-sm text-green-200">Full access</p>
              </div>
              <Shield className="w-6 h-6 sm:w-8 sm:h-8 text-white" />
            </div>
          </CardContent>
        </Card>

        <Card className="dashboard-card-purple">
          <CardContent className="p-4 sm:p-6">
            <div className="flex flex-col space-y-2 sm:flex-row sm:space-y-0 sm:items-center sm:justify-between">
              <div>
                <p className="text-sm font-medium text-white/80">Managers</p>
                <p className="text-xl sm:text-2xl font-bold text-white">{managerCount}</p>
                <p className="text-sm text-green-200">Department heads</p>
              </div>
              <Shield className="w-6 h-6 sm:w-8 sm:h-8 text-white" />
            </div>
          </CardContent>
        </Card>
      </div>

      <CardWhite>
        <CardHeader>
          <div className="flex flex-col space-y-3 sm:flex-row sm:space-y-0 sm:items-center sm:justify-between">
            <CardTitle>User Directory</CardTitle>
            <div className="flex flex-col space-y-2 sm:flex-row sm:space-y-0 sm:space-x-2">
              <div className="relative w-full sm:w-64">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Search users..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 w-full"
                />
              </div>
              
              <Select value={roleFilter} onValueChange={setRoleFilter}>
                <SelectTrigger className="w-full sm:w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Roles</SelectItem>
                  <SelectItem value="ADMIN">Admin</SelectItem>
                  <SelectItem value="MANAGER">Manager</SelectItem>
                  <SelectItem value="STAFF">Staff</SelectItem>
                </SelectContent>
              </Select>

              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full sm:w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <VirtualizedTable
            data={users}
            loading={usersLoading}
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
                header: "User",
                render: (value: string, user: User) => (
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center">
                      <span className="text-sm font-medium">
                        {user.name.split(' ').map(n => n[0]).join('')}
                      </span>
                    </div>
                    <div>
                      <p className="font-medium truncate">{user.name}</p>
                      <p className="text-sm text-gray-500">
                        Joined {new Date(user.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                )
              },
              {
                key: "email",
                header: "Email",
                render: (value: string) => (
                  <div className="flex items-center space-x-2">
                    <Mail className="w-4 h-4 text-gray-400" />
                    <span className="truncate">{value}</span>
                  </div>
                )
              },
              {
                key: "phone",
                header: "Phone",
                render: (value: string) => value ? (
                  <div className="flex items-center space-x-2">
                    <Phone className="w-4 h-4 text-gray-400" />
                    <span className="truncate">{value}</span>
                  </div>
                ) : (
                  <span className="text-gray-400">-</span>
                )
              },
              {
                key: "role",
                header: "Role",
                render: (value: string) => getRoleBadge(value)
              },
              {
                key: "isActive",
                header: "Status",
                render: (value: boolean) => getStatusBadge(value)
              },
              {
                key: "lastLogin",
                header: "Last Login",
                render: (value: string) => value ? (
                  <div className="flex items-center space-x-2">
                    <Calendar className="w-4 h-4 text-gray-400" />
                    <span>{new Date(value).toLocaleDateString()}</span>
                  </div>
                ) : (
                  <span className="text-gray-400">Never</span>
                )
              },
              {
                key: "actions",
                header: "Actions",
                render: (value: any, user: User) => (
                  <div className="flex flex-col space-y-1 sm:flex-row sm:space-y-0 sm:space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => viewUser(user)}
                      className="w-full sm:w-auto"
                    >
                      <Eye className="w-4 h-4" />
                    </Button>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm" className="w-full sm:w-auto">
                          <MoreHorizontal className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent>
                        <DropdownMenuItem onClick={() => viewUser(user)}>
                          <Eye className="w-4 h-4 mr-2" />
                          View Details
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleResetPassword(user.id)}>
                          <Key className="w-4 h-4 mr-2" />
                          Reset Password
                        </DropdownMenuItem>
                        {user.isActive ? (
                          <DropdownMenuItem onClick={() => handleToggleUserStatus(user.id, false)}>
                            <UserX className="w-4 h-4 mr-2" />
                            Deactivate User
                          </DropdownMenuItem>
                        ) : (
                          <DropdownMenuItem onClick={() => handleToggleUserStatus(user.id, true)}>
                            <UserCheck className="w-4 h-4 mr-2" />
                            Activate User
                          </DropdownMenuItem>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                )
              }
            ]}
            onRowClick={(user) => viewUser(user)}
          />
        </CardContent>
      </CardWhite>

      {/* View User Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>User Details</DialogTitle>
          </DialogHeader>
          {selectedUser && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium text-gray-600">Full Name</Label>
                  <p className="font-medium">{selectedUser.name}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-600">Email</Label>
                  <p>{selectedUser.email}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-600">Phone</Label>
                  <p>{selectedUser.phone || 'Not provided'}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-600">Role</Label>
                  {getRoleBadge(selectedUser.role)}
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-600">Status</Label>
                  {getStatusBadge(selectedUser.isActive)}
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-600">User ID</Label>
                  <p className="font-mono text-sm">{selectedUser.id}</p>
                </div>
              </div>

              {selectedUser.locations && selectedUser.locations.length > 0 && (
                <div>
                  <Label className="text-sm font-medium text-gray-600">Assigned Locations</Label>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {selectedUser.locations.map((location) => (
                      <Badge key={location.id} variant="outline">
                        {location.name}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium text-gray-600">Created At</Label>
                  <p>{new Date(selectedUser.createdAt).toLocaleString()}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-600">Last Updated</Label>
                  <p>{new Date(selectedUser.updatedAt).toLocaleString()}</p>
                </div>
              </div>

              {selectedUser.lastLogin && (
                <div>
                  <Label className="text-sm font-medium text-gray-600">Last Login</Label>
                  <p>{new Date(selectedUser.lastLogin).toLocaleString()}</p>
                </div>
              )}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsViewDialogOpen(false)}>
              Close
            </Button>
            {selectedUser && (
              <>
                <Button variant="outline" onClick={() => handleResetPassword(selectedUser.id)}>
                  <Key className="w-4 h-4 mr-2" />
                  Reset Password
                </Button>
                {selectedUser.isActive ? (
                  <Button variant="destructive" onClick={() => handleToggleUserStatus(selectedUser.id, false)}>
                    <UserX className="w-4 h-4 mr-2" />
                    Deactivate User
                  </Button>
                ) : (
                  <Button onClick={() => handleToggleUserStatus(selectedUser.id, true)}>
                    <UserCheck className="w-4 h-4 mr-2" />
                    Activate User
                  </Button>
                )}
              </>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
      </div>
    </LayoutWrapper>
  );
}
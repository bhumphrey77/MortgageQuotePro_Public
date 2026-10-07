import { useEffect, useState } from 'react';
import { Navigation } from '@/components/Navigation';
import { Footer } from '@/components/Footer';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { Shield, Users, CreditCard, UserPlus, Trash2 } from 'lucide-react';
import { Helmet } from 'react-helmet';

interface UserWithSubscription {
  id: string;
  email: string;
  full_name: string;
  created_at: string;
  subscription?: {
    tier: 'free' | 'professional' | 'business';
    status: string;
    stripe_subscription_id: string | null;
  };
  roles: Array<'owner' | 'admin' | 'user'>;
}

export default function AdminPanel() {
  const [users, setUsers] = useState<UserWithSubscription[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingUser, setUpdatingUser] = useState<string | null>(null);
  const [userToDelete, setUserToDelete] = useState<UserWithSubscription | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const { toast } = useToast();
  const { user: currentUser } = useAuth();

  // Log admin access via SECURITY DEFINER RPC (clients cannot insert directly)
  const logAdminAccess = async (action: string, targetUserId?: string, details?: Record<string, unknown>) => {
    if (!currentUser) return;

    try {
      await (supabase.rpc as any)('log_admin_action', {
        p_action: action,
        p_target_table: 'profiles',
        p_target_user_id: targetUserId || null,
        p_details: details || null,
        p_user_agent: navigator.userAgent,
      });
    } catch (error) {
      console.error('Failed to log admin access:', error);
    }
  };


  const fetchUsers = async () => {
    setLoading(true);
    try {
      // Fetch all profiles
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('id, email, full_name, created_at')
        .order('created_at', { ascending: false });

      if (profilesError) throw profilesError;

      // Log admin access to all profiles
      await logAdminAccess('view_all_profiles', undefined, { 
        profile_count: profiles?.length || 0 
      });

      // Fetch all subscriptions
      const { data: subscriptions, error: subscriptionsError } = await supabase
        .from('subscriptions')
        .select('user_id, tier, status, stripe_subscription_id');

      if (subscriptionsError) throw subscriptionsError;

      // Fetch all user roles
      const { data: userRoles, error: rolesError } = await supabase
        .from('user_roles')
        .select('user_id, role');

      if (rolesError) throw rolesError;

      // Combine data
      const combinedUsers: UserWithSubscription[] = (profiles || []).map((profile) => {
        const subscription = subscriptions?.find((s) => s.user_id === profile.id);
        const roles = userRoles
          ?.filter((r) => r.user_id === profile.id)
          .map((r) => r.role as 'owner' | 'admin' | 'user') || [];

        return {
          id: profile.id,
          email: profile.email,
          full_name: profile.full_name,
          created_at: profile.created_at,
          subscription: subscription
            ? {
                tier: subscription.tier as 'free' | 'professional' | 'business',
                status: subscription.status,
                stripe_subscription_id: subscription.stripe_subscription_id,
              }
            : undefined,
          roles,
        };
      });

      setUsers(combinedUsers);
    } catch (error) {
      console.error('Error fetching users:', error);
      toast({
        title: 'Error',
        description: 'Failed to load users',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleAddRole = async (userId: string, role: 'admin' | 'user') => {
    setUpdatingUser(userId);
    try {
      const { error } = await supabase.from('user_roles').insert({
        user_id: userId,
        role,
      });

      if (error) throw error;

      toast({
        title: 'Role Added',
        description: `Successfully added ${role} role`,
      });
      fetchUsers();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to add role',
        variant: 'destructive',
      });
    } finally {
      setUpdatingUser(null);
    }
  };

  const handleRemoveRole = async (userId: string, role: 'owner' | 'admin' | 'user') => {
    setUpdatingUser(userId);
    try {
      const { error } = await supabase
        .from('user_roles')
        .delete()
        .eq('user_id', userId)
        .eq('role', role);

      if (error) throw error;

      toast({
        title: 'Role Removed',
        description: `Successfully removed ${role} role`,
      });
      fetchUsers();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to remove role',
        variant: 'destructive',
      });
    } finally {
      setUpdatingUser(null);
    }
  };

  const handleUpdateTier = async (userId: string, tier: 'free' | 'professional') => {
    setUpdatingUser(userId);
    try {
      const { error } = await supabase
        .from('subscriptions')
        .update({ tier, updated_at: new Date().toISOString() })
        .eq('user_id', userId);

      if (error) throw error;

      toast({
        title: 'Tier Updated',
        description: `Successfully updated to ${tier} tier`,
      });
      fetchUsers();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to update tier',
        variant: 'destructive',
      });
    } finally {
      setUpdatingUser(null);
    }
  };

  const getTierBadgeVariant = (tier: string) => {
    switch (tier) {
      case 'professional':
        return 'default';
      case 'business':
        return 'secondary';
      default:
        return 'outline';
    }
  };

  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case 'owner':
        return 'destructive';
      case 'admin':
        return 'default';
      default:
        return 'secondary';
    }
  };

  const handleDeleteUser = async () => {
    if (!userToDelete) return;

    setIsDeleting(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      const response = await supabase.functions.invoke('delete-user', {
        body: { userId: userToDelete.id },
      });

      if (response.error) {
        throw new Error(response.error.message);
      }

      if (response.data?.error) {
        throw new Error(response.data.error);
      }

      toast({
        title: 'User Deleted',
        description: `Successfully deleted ${userToDelete.full_name}`,
      });
      
      setUserToDelete(null);
      fetchUsers();
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to delete user';
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setIsDeleting(false);
    }
  };

  const canDeleteUser = (user: UserWithSubscription) => {
    // Cannot delete yourself
    if (user.id === currentUser?.id) return false;
    // Cannot delete owners
    if (user.roles.includes('owner')) return false;
    return true;
  };

  return (
    <>
      <Helmet>
        <title>Admin Panel | Mortgage Quote Pro</title>
        <meta name="robots" content="noindex, nofollow" />
      </Helmet>
      <div className="min-h-screen flex flex-col bg-background">
        <Navigation />

        <main className="flex-1 container mx-auto px-4 py-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <Shield className="h-8 w-8 text-primary" />
              Admin Panel
            </h1>
            <p className="text-muted-foreground mt-2">
              Manage user roles and subscriptions
            </p>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Total Users
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2">
                  <Users className="h-5 w-5 text-primary" />
                  <span className="text-2xl font-bold">{users.length}</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Professional Users
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2">
                  <CreditCard className="h-5 w-5 text-primary" />
                  <span className="text-2xl font-bold">
                    {users.filter((u) => u.subscription?.tier === 'professional').length}
                  </span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Admins
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2">
                  <Shield className="h-5 w-5 text-primary" />
                  <span className="text-2xl font-bold">
                    {users.filter((u) => u.roles.includes('owner') || u.roles.includes('admin')).length}
                  </span>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Users Table */}
          <Card>
            <CardHeader>
              <CardTitle>All Users</CardTitle>
              <CardDescription>
                View and manage user accounts, roles, and subscription tiers
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>User</TableHead>
                        <TableHead>Roles</TableHead>
                        <TableHead>Subscription</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Joined</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {users.map((user) => (
                        <TableRow key={user.id}>
                          <TableCell>
                            <div>
                              <p className="font-medium">{user.full_name}</p>
                              <p className="text-sm text-muted-foreground">{user.email}</p>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex flex-wrap gap-1">
                              {user.roles.length > 0 ? (
                                user.roles.map((role) => (
                                  <Badge
                                    key={role}
                                    variant={getRoleBadgeVariant(role)}
                                    className="text-xs"
                                  >
                                    {role}
                                    {role !== 'owner' && (
                                      <button
                                        onClick={() => handleRemoveRole(user.id, role)}
                                        className="ml-1 hover:text-destructive"
                                        disabled={updatingUser === user.id}
                                      >
                                        <Trash2 className="h-3 w-3" />
                                      </button>
                                    )}
                                  </Badge>
                                ))
                              ) : (
                                <span className="text-sm text-muted-foreground">No roles</span>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant={getTierBadgeVariant(user.subscription?.tier || 'free')}>
                              {user.subscription?.tier || 'free'}
                            </Badge>
                            {user.subscription?.stripe_subscription_id && (
                              <span className="ml-1 text-xs text-muted-foreground">(Stripe)</span>
                            )}
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant={user.subscription?.status === 'active' ? 'default' : 'secondary'}
                            >
                              {user.subscription?.status || 'none'}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <span className="text-sm text-muted-foreground">
                              {new Date(user.created_at).toLocaleDateString()}
                            </span>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              {/* Add Role */}
                              {!user.roles.includes('admin') && !user.roles.includes('owner') && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleAddRole(user.id, 'admin')}
                                  disabled={updatingUser === user.id}
                                >
                                  <UserPlus className="h-4 w-4 mr-1" />
                                  Make Admin
                                </Button>
                              )}

                              {/* Update Tier */}
                              {!user.subscription?.stripe_subscription_id && (
                                <Select
                                  value={user.subscription?.tier || 'free'}
                                  onValueChange={(value) =>
                                    handleUpdateTier(user.id, value as 'free' | 'professional')
                                  }
                                  disabled={updatingUser === user.id}
                                >
                                  <SelectTrigger className="w-32">
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="free">Free</SelectItem>
                                    <SelectItem value="professional">Professional</SelectItem>
                                  </SelectContent>
                                </Select>
                              )}

                              {/* Delete User */}
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setUserToDelete(user)}
                                disabled={!canDeleteUser(user) || updatingUser === user.id}
                                className="text-destructive hover:text-destructive hover:bg-destructive/10"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </main>

        <Footer />
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!userToDelete} onOpenChange={(open) => !open && setUserToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete User</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete <strong>{userToDelete?.full_name}</strong> ({userToDelete?.email})?
              <br /><br />
              This action cannot be undone. All user data including saved quotes, profile, and subscription will be permanently deleted.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteUser}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? 'Deleting...' : 'Delete User'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

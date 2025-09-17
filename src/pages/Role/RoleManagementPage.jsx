import React, { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import Layout from '@/components/Layout'
import { getRolesByOrganization, deleteRole } from '@/api/roleApi'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Plus, Edit, Trash2, Loader2, ArrowLeft } from 'lucide-react'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { useToast } from '@/hooks/use-toast'
import RoleCreateModal from './RoleCreateModal'

const Pagination = ({ currentPage, totalPages, onPageChange }) => {
  const safeTotalPages = Math.max(totalPages || 0, 1)
  
  // Don't render pagination if no pages
  if (totalPages <= 0) {
    return null
  }
  
  const pageNumbers = Array.from({ length: safeTotalPages }, (_, i) => i + 1)

  return (
    <div className="flex justify-center items-center space-x-2 mt-4">
      <Button
        variant="outline"
        onClick={() => onPageChange(Math.max(1, currentPage - 1))}
        disabled={currentPage <= 1}
      >
        Previous
      </Button>
      {pageNumbers.map(number => (
        <Button
          key={number}
          variant={currentPage === number ? 'default' : 'outline'}
          onClick={() => onPageChange(number)}>
          {number}
        </Button>
      ))}
      <Button
        variant="outline"
        onClick={() => onPageChange(Math.min(safeTotalPages, currentPage + 1))}
        disabled={currentPage >= safeTotalPages}
      >
        Next
      </Button>
    </div>
  )
}

const RoleManagementPage = () => {
  const { organizationId } = useParams()
  const navigate = useNavigate()
  const [roles, setRoles] = useState([])
  const [searchTerm, setSearchTerm] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [rowsPerPage, setRowsPerPage] = useState(10)
  const [loading, setLoading] = useState(true)
  const [createModalOpen, setCreateModalOpen] = useState(false)
  const [editModalOpen, setEditModalOpen] = useState(false)
  const [selectedRole, setSelectedRole] = useState(null)
  const [totalCount, setTotalCount] = useState(0)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [roleToDelete, setRoleToDelete] = useState(null)
  const [deleting, setDeleting] = useState(false)
  const { toast } = useToast()

  const fetchRoles = async () => {
    setLoading(true)
    try {
      const data = await getRolesByOrganization({ 
        organizationId, 
        page: currentPage, 
        limit: rowsPerPage 
      })
            
      // Based on the curl response, the API returns roles directly as an array
      // Handle different response structures
      let rolesList = []
      let total = 0
      
      if (Array.isArray(data)) {
        rolesList = data
        // If API returns array directly, we need to fetch all to get total count
        // For now, assume the array length represents current page data
        total = data.length
      } else if (data?.result?.data && Array.isArray(data.result.data)) {
        rolesList = data.result.data
        total = data.result.total || data.result.count || rolesList.length
      } else if (data?.result && Array.isArray(data.result)) {
        rolesList = data.result
        total = data.total || data.count || rolesList.length
      } else if (data?.data && Array.isArray(data.data)) {
        rolesList = data.data
        total = data.total || data.count || rolesList.length
      }
      
      setRoles(rolesList)
      setTotalCount(total)
    } catch (error) {
      console.error('❌ Failed to fetch roles:', error)
      setRoles([])
      setTotalCount(0)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (organizationId) {
      fetchRoles()
    }
  }, [organizationId, currentPage, rowsPerPage])

  // For server-side pagination, we use the roles directly from API
  // Client-side search is applied only to the current page data
  const filteredRoles = roles.filter(
    role =>
      role.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      role.label?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  // Calculate total pages based on server-side total count
  // If we have a search term, use filtered results for pagination
  const totalPages = searchTerm 
    ? Math.ceil(filteredRoles.length / rowsPerPage)
    : Math.ceil(totalCount / rowsPerPage)
  
  // For display, use filtered roles if searching, otherwise use all roles from current page
  const displayRoles = searchTerm ? filteredRoles : roles

  const handleAddRole = (newRole) => {
    // Instead of trying to merge the response, just refresh the data
    fetchRoles()
    setCreateModalOpen(false)
  }

  const handleEditRole = (role) => {
    setSelectedRole(role)
    setEditModalOpen(true)
  }

  const handleUpdateRole = (updatedRole) => {
    // Instead of trying to merge the response, just refresh the data
    fetchRoles()
    setEditModalOpen(false)
    setSelectedRole(null)
  }

  const handleDeleteClick = (role) => {
    setRoleToDelete(role)
    setDeleteDialogOpen(true)
  }

  const handleDeleteConfirm = async () => {
    if (!roleToDelete) return
    
    setDeleting(true)
    try {
      await deleteRole(roleToDelete.id)
      
      toast({
        title: 'Role deleted',
        description: `Role "${roleToDelete.title}" has been deleted successfully`,
        variant: 'success',
      })
      
      // Refresh the roles list
      fetchRoles()
      setDeleteDialogOpen(false)
      setRoleToDelete(null)
    } catch (error) {
      console.error('❌ Failed to delete role:', error)
      const errorMessage = error?.response?.data?.message || error.message || 'Failed to delete role'
      
      toast({
        title: 'Failed to delete role',
        description: errorMessage,
        variant: 'destructive',
      })
    } finally {
      setDeleting(false)
    }
  }

  const handleDeleteCancel = () => {
    setDeleteDialogOpen(false)
    setRoleToDelete(null)
  }

  const getStatusBadge = (status) => {
    return (
      <span
        className={`text-sm px-2 py-0.5 rounded-full font-medium ${
          status === 'ACTIVE'
            ? 'bg-green-100 text-green-800'
            : 'bg-red-100 text-red-800'
        }`}
      >
        {status}
      </span>
    )
  }

  const getVisibilityBadge = (visibility) => {
    return (
      <span
        className={`text-sm px-2 py-0.5 rounded-full font-medium ${
          visibility === 'PUBLIC'
            ? 'bg-blue-100 text-blue-800'
            : 'bg-gray-100 text-gray-800'
        }`}
      >
        {visibility}
      </span>
    )
  }

  if (loading) {
    return (
      <Layout>
        <div className="flex justify-center items-center mt-20">
          <Loader2 className="animate-spin h-8 w-8 text-gray-400" />
        </div>
      </Layout>
    )
  }

  return (
    <Layout>
      <div className="p-6 w-full">
        <div className="bg-white shadow-md rounded-lg p-6 max-w-6xl mx-auto">
          {/* Header with back button */}
          <div className="flex items-center gap-4 mb-4">
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => navigate(`/organizations/${organizationId}`)}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Organization
            </Button>
            <div className="text-sm text-gray-500">
              Organization ID: {organizationId}
            </div>
          </div>

          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold">Role Management</h2>
            <Button onClick={() => setCreateModalOpen(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Add Role
            </Button>
          </div>

          <div className="flex items-center justify-between mb-4">
            <Input
              placeholder="Search roles..."
              value={searchTerm}
              onChange={e => {
                setSearchTerm(e.target.value)
                setCurrentPage(1)
              }}
              className="w-64"
            />
            <Select
              value={rowsPerPage.toString()}
              onValueChange={val => {
                setRowsPerPage(Number(val))
                setCurrentPage(1)
              }}
            >
              <SelectTrigger className="w-24">
                <SelectValue placeholder="Rows" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="5">5</SelectItem>
                <SelectItem value="10">10</SelectItem>
                <SelectItem value="25">25</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Title</TableHead>
                <TableHead>Label</TableHead>
                <TableHead>User Type</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Visibility</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {displayRoles.length > 0 ? (
                displayRoles.map((role) => (
                  <TableRow key={role.id}>
                    <TableCell className="font-medium">{role.title}</TableCell>
                    <TableCell>{role.label || 'N/A'}</TableCell>
                    <TableCell>{role.user_type}</TableCell>
                    <TableCell>{getStatusBadge(role.status)}</TableCell>
                    <TableCell>{getVisibilityBadge(role.visibility)}</TableCell>
                    <TableCell className="space-x-2">
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        onClick={() => handleEditRole(role)}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="icon"
                        onClick={() => handleDeleteClick(role)}
                        className="hover:bg-red-50"
                      >
                        <Trash2 className="w-4 h-4 text-red-500" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={6} className="text-center">
                    No roles found.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>

          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
          />
        </div>
      </div>

      {/* Create Role Modal */}
      <RoleCreateModal
        open={createModalOpen}
        setOpen={setCreateModalOpen}
        mode="create"
        organizationId={organizationId}
        onAdd={handleAddRole}
      />

      {/* Edit Role Modal */}
      <RoleCreateModal
        open={editModalOpen}
        setOpen={setEditModalOpen}
        mode="edit"
        organizationId={organizationId}
        initialData={selectedRole}
        onAdd={handleUpdateRole}
      />

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Role</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete the role "{roleToDelete?.title}"? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={handleDeleteCancel} disabled={deleting}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDeleteConfirm}
              disabled={deleting}
              className="bg-red-600 hover:bg-red-700"
            >
              {deleting ? (
                <div className="flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Deleting...
                </div>
              ) : (
                'Delete Role'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Layout>
  )
}

export default RoleManagementPage
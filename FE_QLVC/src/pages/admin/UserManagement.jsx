import React, { useState, useEffect, useCallback } from 'react';
import './UserManagement.css';
import { authService } from '../../services/authService';
import UserEditModal from '../../components/modals/UserEditModal';
import UserAddModal from '../../components/modals/UserAddModal';
import { toast } from 'react-toastify';
import ConfirmDialog from '../../components/dialogs/ConfirmDialog';

export const UserManagement = () => {
  const [users, setUsers] = useState([]);
  const [allUsers, setAllUsers] = useState([]); // Store all users for filtering
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [nameFilter, setNameFilter] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [sortField, setSortField] = useState('HoTen');
  const [sortDirection, setSortDirection] = useState('asc');
    // Modal and dialog state
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [actionInProgress, setActionInProgress] = useState(false);
    // Fetch users function (reusable)
  const fetchUsers = useCallback(async () => {
    try {
      setLoading(true);
      const userData = await authService.getUsers();
      console.log('API response:', userData);
      
      setAllUsers(userData); // Store all users for filtering
      
      if (applyFiltersAndPagination) {
        applyFiltersAndPagination(userData);
      }
      setError(null);
    } catch (err) {
      console.error('Failed to fetch users:', err);
      setError('Không thể tải dữ liệu người dùng. Vui lòng thử lại sau.');
      setUsers([]);
    } finally {
      setLoading(false);
    }
  }, []);
  
  // Apply filters, sorting and pagination
  const applyFiltersAndPagination = useCallback((data = allUsers) => {
    // Apply filters
    let filteredData = [...data];
    
    // Filter by name
    if (nameFilter) {
      filteredData = filteredData.filter(user =>
        (user.HoTen || user.name || '').toLowerCase().includes(nameFilter.toLowerCase())
      );
    }
    
    // Filter by role
    if (roleFilter) {
      filteredData = filteredData.filter(user =>
        (user.Role || user.role || '').toLowerCase() === roleFilter.toLowerCase()
      );
    }
    
    // Apply sorting
    filteredData.sort((a, b) => {
      const fieldA = (a[sortField] || a[sortField.toLowerCase()] || '').toString().toLowerCase();
      const fieldB = (b[sortField] || b[sortField.toLowerCase()] || '').toString().toLowerCase();
      
      if (fieldA < fieldB) return sortDirection === 'asc' ? -1 : 1;
      if (fieldA > fieldB) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });
    
    // Calculate total pages
    const total = Math.ceil(filteredData.length / rowsPerPage) || 1;
    setTotalPages(total);
    
    // Adjust current page if needed
    const adjustedCurrentPage = currentPage > total ? 1 : currentPage;
    if (currentPage !== adjustedCurrentPage) setCurrentPage(adjustedCurrentPage);
    
    // Apply pagination
    const paginatedData = filteredData.slice(
      (adjustedCurrentPage - 1) * rowsPerPage,
      adjustedCurrentPage * rowsPerPage
    );
    
    setUsers(paginatedData);
  }, [allUsers, nameFilter, roleFilter, sortField, sortDirection, currentPage, rowsPerPage]);

  // Apply filters when dependencies change
  useEffect(() => {
    if (allUsers.length > 0) {
      applyFiltersAndPagination();
    }
  }, [applyFiltersAndPagination, nameFilter, roleFilter, sortField, sortDirection, currentPage, rowsPerPage, allUsers.length]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  // Handle delete confirmation
  const handleDeleteClick = (user) => {
    setCurrentUser(user);
    setIsDeleteDialogOpen(true);
  };
  
  const handleDeleteConfirm = async () => {
    if (!currentUser) return;
    
    try {
      setActionInProgress(true);
      await authService.deleteUser(currentUser.ID_TK);
      await fetchUsers(); // Refresh user list
      toast.success('Xóa tài khoản thành công!');
    } catch (err) {
      console.error('Failed to delete user:', err);
      toast.error('Không thể xóa tài khoản. Vui lòng thử lại sau.');
    } finally {
      setIsDeleteDialogOpen(false);
      setCurrentUser(null);
      setActionInProgress(false);
    }
  };

  // Handle edit - open edit modal
  const handleEdit = (user) => {
    try {
      setCurrentUser(user);
      setIsEditModalOpen(true);
    } catch (err) {
      console.error('Error opening edit modal:', err);
      toast.error('Không thể mở form chỉnh sửa. Vui lòng thử lại sau.');
    }
  };
  
  // Handle form submission for editing user
  const handleEditSubmit = async (userData) => {
    try {
      if (!currentUser || !currentUser.ID_TK) {
        throw new Error('Không tìm thấy thông tin người dùng');
      }
      
      setActionInProgress(true);
      await authService.updateUser(currentUser.ID_TK, userData);
      await fetchUsers(); // Refresh the user list
      toast.success('Cập nhật tài khoản thành công!');
      setIsEditModalOpen(false);
      return true;
    } catch (err) {
      console.error('Error updating user:', err);
      throw new Error('Không thể cập nhật thông tin người dùng. Vui lòng thử lại sau.');
    } finally {
      setActionInProgress(false);
    }
  };
  
  // Handle adding a new user - open add modal
  const handleAdd = () => {
    setCurrentUser(null); // Reset current user for a new user form
    setIsAddModalOpen(true);
  };
  
  // Handle form submission for adding user
  const handleAddSubmit = async (userData) => {
    try {
      setActionInProgress(true);
      await authService.createUser(userData);
      await fetchUsers(); // Refresh the user list
      toast.success('Tạo tài khoản mới thành công!');
      setIsAddModalOpen(false);
      return true;
    } catch (err) {
      console.error('Error creating user:', err);
      throw new Error('Không thể tạo người dùng mới. Vui lòng thử lại sau.');
    } finally {
      setActionInProgress(false);
    }
  };
  
  // Handle searching and filtering
  const handleSearchChange = (e) => {
    setNameFilter(e.target.value);
    setCurrentPage(1); // Reset to first page
  };
  
  const handleRoleFilterChange = (e) => {
    setRoleFilter(e.target.value);
    setCurrentPage(1); // Reset to first page
  };
  
  // Handle sorting
  const handleSort = (field) => {
    const newDirection = field === sortField && sortDirection === 'asc' ? 'desc' : 'asc';
    setSortField(field);
    setSortDirection(newDirection);
  };
  
  // Handle pagination
  const handleNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };
  
  const handlePrevPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };
  
  const handleGoToPage = (page) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };
  
  // Handle rows per page change
  const handleRowsPerPageChange = (e) => {
    setRowsPerPage(Number(e.target.value));
    setCurrentPage(1); // Reset to first page
  };

  // Get user account status
  const getUserStatus = (user) => {
    return user.Status === 1 || user.status === 'active' ? 'active' : 'inactive';
  };

  // Get role display name
  const getRoleDisplayName = (role) => {
    const roleMap = {
      'admin': 'Quản trị viên',
      'user': 'Người dùng',
      'staff': 'Nhân viên',
      'manager': 'Quản lý'
    };
    return roleMap[role?.toLowerCase()] || role;
  };

  // Generate page numbers for pagination
  const getPageNumbers = () => {
    const pageNumbers = [];
    const maxVisiblePages = 5;
    
    if (totalPages <= maxVisiblePages) {
      // Show all pages
      for (let i = 1; i <= totalPages; i++) {
        pageNumbers.push(i);
      }
    } else {
      // Show first page, current page and surrounding pages, and last page
      if (currentPage <= 3) {
        for (let i = 1; i <= 4; i++) {
          pageNumbers.push(i);
        }
        pageNumbers.push('...');
        pageNumbers.push(totalPages);
      } else if (currentPage >= totalPages - 2) {
        pageNumbers.push(1);
        pageNumbers.push('...');
        for (let i = totalPages - 3; i <= totalPages; i++) {
          pageNumbers.push(i);
        }
      } else {
        pageNumbers.push(1);
        pageNumbers.push('...');
        pageNumbers.push(currentPage - 1);
        pageNumbers.push(currentPage);
        pageNumbers.push(currentPage + 1);
        pageNumbers.push('...');
        pageNumbers.push(totalPages);
      }
    }
    
    return pageNumbers;
  };

  // Render sort indicator
  const renderSortIndicator = (field) => {
    if (sortField !== field) return null;
    
    return sortDirection === 'asc' ? (
      <span className="sort-indicator">▲</span>
    ) : (
      <span className="sort-indicator">▼</span>
    );
  };

  return (
    <div className="user-management-container">
      <div className="user-management-header">
        <h1 className="user-management-title">Quản lý tài khoản</h1>
        <p className="user-management-subtitle">Quản lý tất cả tài khoản người dùng trong hệ thống</p>
      </div>
      
      <div className="user-management-card">
        <div className="user-management-toolbar">
          <div className="toolbar-filters">
            <div className="search-wrapper">
              <svg className="search-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8"></circle>
                <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
              </svg>
              <input
                type="text"
                placeholder="Tìm kiếm theo tên..."
                className="search-input"
                value={nameFilter}
                onChange={handleSearchChange}
              />
            </div>
            
            <div className="filter-wrapper">
              <select 
                value={roleFilter} 
                onChange={handleRoleFilterChange}
                className="role-filter-select"
              >
                <option value="">Tất cả vai trò</option>
                <option value="admin">Quản trị viên</option>
                <option value="user">Người dùng</option>
                <option value="staff">Nhân viên</option>
                <option value="manager">Quản lý</option>
              </select>
            </div>
          </div>
          
          <div className="toolbar-actions">
            <button className="refresh-button" onClick={fetchUsers} disabled={loading}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M23 4v6h-6"></path>
                <path d="M1 20v-6h6"></path>
                <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10"></path>
                <path d="M20.49 15a9 9 0 0 1-14.85 3.36L1 14"></path>
              </svg>
              <span>Làm mới</span>
            </button>
            
            <button className="add-user-button" onClick={handleAdd}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                <circle cx="8.5" cy="7" r="4"></circle>
                <line x1="20" y1="8" x2="20" y2="14"></line>
                <line x1="23" y1="11" x2="17" y2="11"></line>
              </svg>
              <span>Thêm mới</span>
            </button>
          </div>
        </div>
        
        {/* Error message */}
        {error && (
          <div className="error-message">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10"></circle>
              <line x1="12" y1="8" x2="12" y2="12"></line>
              <line x1="12" y1="16" x2="12.01" y2="16"></line>
            </svg>
            {error}
          </div>
        )}
        
        {/* Users table */}
        <div className="users-table-container">
          {loading ? (
            <div className="loading-spinner-container">
              <div className="loading-spinner"></div>
              <p>Đang tải dữ liệu...</p>
            </div>
          ) : (
            <>
              <table className="users-table">
                <thead>
                  <tr>
                    <th className="sortable" onClick={() => handleSort('HoTen')}>
                      Họ và tên {renderSortIndicator('HoTen')}
                    </th>
                    <th className="sortable" onClick={() => handleSort('Email')}>
                      Email {renderSortIndicator('Email')}
                    </th>
                    <th>Số điện thoại</th>
                    <th>Địa chỉ</th>
                    <th className="sortable" onClick={() => handleSort('Role')}>
                      Vai trò {renderSortIndicator('Role')}
                    </th>
                    <th>Trạng thái</th>
                    <th>Thao tác</th>
                  </tr>
                </thead>
                <tbody>
                  {users.length === 0 ? (
                    <tr>
                      <td colSpan="7" className="no-data-message">
                        <div className="no-data-content">
                          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                            <circle cx="8.5" cy="7" r="4"></circle>
                            <line x1="18" y1="8" x2="23" y2="13"></line>
                            <line x1="23" y1="8" x2="18" y2="13"></line>
                          </svg>
                          <span>{nameFilter || roleFilter ? 'Không tìm thấy người dùng phù hợp' : 'Chưa có người dùng nào'}</span>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    users.map((user, index) => (
                      <tr key={user.ID_TK || user.id || index} className={index % 2 === 0 ? 'row-highlighted' : ''}>
                        <td>
                          <div className="user-name-cell">
                            <div className="user-avatar">{(user.HoTen || user.name || 'U')[0]}</div>
                            <span>{user.HoTen || user.name || 'N/A'}</span>
                          </div>
                        </td>
                        <td>{user.Email || user.email || 'N/A'}</td>
                        <td>{user.Phone || user.SDT || user.phone || 'N/A'}</td>
                        <td className="address-cell">{user.DiaChi || user.address || 'N/A'}</td>
                        <td>
                          <span className={`role-badge role-${(user.Role || user.role || 'user').toLowerCase()}`}>
                            {getRoleDisplayName(user.Role || user.role || 'user')}
                          </span>
                        </td>
                        <td>
                          <span className={`status-badge status-${getUserStatus(user)}`}>
                            {getUserStatus(user) === 'active' ? 'Hoạt động' : 'Vô hiệu hóa'}
                          </span>
                        </td>
                        <td className="action-cell">
                          <button 
                            className="edit-button"
                            onClick={() => handleEdit(user)}
                            title="Chỉnh sửa"
                          >
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                            </svg>
                          </button>
                          <button 
                            className="view-button"
                            onClick={() => handleEdit(user)}
                            title="Xem chi tiết"
                          >
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                              <circle cx="12" cy="12" r="3"></circle>
                            </svg>
                          </button>
                          <button 
                            className="delete-button"
                            onClick={() => handleDeleteClick(user)}
                            title="Xóa"
                          >
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <polyline points="3 6 5 6 21 6"></polyline>
                              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                              <line x1="10" y1="11" x2="10" y2="17"></line>
                              <line x1="14" y1="11" x2="14" y2="17"></line>
                            </svg>
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>

              {/* Pagination */}
              <div className="pagination-container">
                <div className="rows-per-page">
                  <span>Hiển thị</span>
                  <select 
                    value={rowsPerPage} 
                    onChange={handleRowsPerPageChange}
                    className="rows-select"
                  >
                    <option value="5">5</option>
                    <option value="10">10</option>
                    <option value="20">20</option>
                    <option value="50">50</option>
                  </select>
                  <span>dòng mỗi trang</span>
                </div>
                
                <div className="pagination-controls">
                  <button 
                    className="pagination-button"
                    onClick={handlePrevPage}
                    disabled={currentPage === 1}
                  >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="15 18 9 12 15 6"></polyline>
                    </svg>
                  </button>
                  
                  <div className="page-numbers">
                    {getPageNumbers().map((pageNum, idx) => (
                      pageNum === '...' ? (
                        <span key={`ellipsis-${idx}`} className="ellipsis">...</span>
                      ) : (
                        <button
                          key={pageNum}
                          className={`page-number ${currentPage === pageNum ? 'active' : ''}`}
                          onClick={() => handleGoToPage(pageNum)}
                        >
                          {pageNum}
                        </button>
                      )
                    ))}
                  </div>
                  
                  <button 
                    className="pagination-button"
                    onClick={handleNextPage}
                    disabled={currentPage >= totalPages}
                  >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="9 18 15 12 9 6"></polyline>
                    </svg>
                  </button>
                </div>
                
                <div className="page-info">
                  {`Trang ${currentPage} / ${totalPages} (${allUsers.length} bản ghi)`}
                </div>
              </div>
            </>
          )}
        </div>
      </div>
      
      {/* User Edit Modal */}
      <UserEditModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        user={currentUser}
        onSubmit={handleEditSubmit}
        isLoading={actionInProgress}
      />

      {/* User Add Modal */}
      <UserAddModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSubmit={handleAddSubmit}
        isLoading={actionInProgress}
      />
      
      {/* Confirm Delete Dialog */}
      <ConfirmDialog
        isOpen={isDeleteDialogOpen}
        title="Xác nhận xóa"
        message={`Bạn có chắc chắn muốn xóa tài khoản của "${currentUser?.HoTen || currentUser?.name || ''}"? Hành động này không thể hoàn tác.`}
        confirmText="Xóa"
        cancelText="Hủy"
        onConfirm={handleDeleteConfirm}
        onCancel={() => setIsDeleteDialogOpen(false)}
        isLoading={actionInProgress}
      />
    </div>
  );
};

import React, { useState, useEffect,useCallback } from 'react';
import './UserManagement.css';
import { authService } from '../../services/authService';
import UserEditModal from '../../components/modals/UserEditModal';
import UserAddModal from '../../components/modals/UserAddModal';

export const UserManagement = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [nameFilter, setNameFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
    // Modal state variables
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);

  // Fetch users function (reusable)
  const fetchUsers = useCallback(async () => {
  try {
    setLoading(true);
    const userData = await authService.getUsers();
    console.log('API response:', userData);

    const filteredData = nameFilter 
      ? userData.filter(user =>
          (user.HoTen || user.name || '').toLowerCase().includes(nameFilter.toLowerCase())
        )
      : userData;

    const paginatedData = filteredData.slice(
      (currentPage - 1) * rowsPerPage,
      currentPage * rowsPerPage
    );

    setUsers(paginatedData);

    const total = Math.ceil(filteredData.length / rowsPerPage) || 1;
    setTotalPages(total);

    setError(null);
  } catch (err) {
    console.error('Failed to fetch users:', err);
    setError('Không thể tải dữ liệu người dùng. Vui lòng thử lại sau.');
    setUsers([]);
  } finally {
    setLoading(false);
  }
}, [currentPage, rowsPerPage, nameFilter]); // 👈 thêm dependencies

useEffect(() => {
  fetchUsers();
}, [fetchUsers]); // 👈 không còn cảnh báo nữa


  // Handle delete confirmation
  const handleDelete = async (userId) => {
    if (window.confirm('Bạn có chắc chắn muốn xóa tài khoản này?')) {
      try {
        await authService.deleteUser(userId);
        // Refresh the user list
        fetchUsers();
        alert('Xóa tài khoản thành công!');
      } catch (err) {
        console.error('Failed to delete user:', err);
        alert('Không thể xóa tài khoản. Vui lòng thử lại sau.');
      }
    }
  };  // Handle edit - open edit modal
  const handleEdit = (userId) => {
    try {
      // Find user by ID
      const userToEdit = users.find(user => user.ID_TK === userId);
      if (!userToEdit) {
        throw new Error('Không tìm thấy thông tin người dùng');
      }
      
      // Set current user and open edit modal
      setCurrentUser(userToEdit);
      setIsEditModalOpen(true);
    } catch (err) {
      console.error('Error opening edit modal:', err);
      alert('Không thể mở form chỉnh sửa. Vui lòng thử lại sau.');
    }
  };
  
  // Handle form submission for editing user
  const handleEditSubmit = async (userData) => {
    try {
      if (!currentUser || !currentUser.ID_TK) {
        throw new Error('Không tìm thấy thông tin người dùng');
      }
      
      await authService.updateUser(currentUser.ID_TK, userData);
      fetchUsers(); // Refresh the user list
      return true;
    } catch (err) {
      console.error('Error updating user:', err);
      throw new Error('Không thể cập nhật thông tin người dùng. Vui lòng thử lại sau.');
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
      await authService.createUser(userData);
      fetchUsers(); // Refresh the user list
      return true;
    } catch (err) {
      console.error('Error creating user:', err);
      throw new Error('Không thể tạo người dùng mới. Vui lòng thử lại sau.');
    }
  };
  
  // Handle search with debounce
  const handleSearchChange = (e) => {
    setNameFilter(e.target.value);
    setCurrentPage(1); // Reset to first page when searching
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
  
  // Handle rows per page change
  const handleRowsPerPageChange = (newRowsPerPage) => {
    setRowsPerPage(newRowsPerPage);
    setCurrentPage(1); // Reset to first page when changing rows per page
  };

  return (
    <div className="user-management-container">
      <div className="user-management-header">
        <h1 className="user-management-title">Quản lý tài khoản</h1>
      </div>
        {/* Search and Add button row */}      <div className="user-management-actions">
        <div className="search-wrapper">
          <svg className="search-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8"></circle>
            <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
          </svg>
          <input
            type="text"
            placeholder="Họ và tên"
            className="search-input"
            value={nameFilter}
            onChange={handleSearchChange}
          />
        </div>
        
        <button className="add-user-button" onClick={handleAdd}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
            <circle cx="8.5" cy="7" r="4"></circle>
            <line x1="20" y1="8" x2="20" y2="14"></line>
            <line x1="23" y1="11" x2="17" y2="11"></line>
          </svg>
          <span>Thêm</span>
        </button>
      </div>
      
      {/* Error message */}
      {error && (
        <div className="error-message">
          {error}
        </div>
      )}
        {/* Users table */}
      <div className="users-table-container">
        {loading ? (
          <div className="loading-spinner">Loading...</div>
        ) : (
          <table className="users-table">
            <thead>
              <tr>
                <th>Họ và tên</th>
                <th>Email</th>
                <th>Số điện thoại</th>
                <th>Địa chỉ</th>
                <th>Vai trò</th>
                <th>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {users.length === 0 ? (
                <tr>
                  <td colSpan="6" className="no-data-message">
                    {error || 'Không có dữ liệu người dùng'}
                  </td>
                </tr>
              ) : (                users.map((user, index) => (
                  <tr key={user.ID_TK || user.id || index} className={index % 2 === 0 ? 'row-highlighted' : ''}>
                    <td>{user.HoTen || user.name || 'N/A'}</td>
                    <td>{user.Email || user.email || 'N/A'}</td>
                    <td>{user.Phone || user.SDT || user.phone || 'N/A'}</td>
                    <td>{user.DiaChi || user.address || 'N/A'}</td>
                    <td>{user.Role || user.role || 'N/A'}</td>                    
                    <td className="action-cell">
                      <button 
                        className="edit-button"
                        onClick={() => handleEdit(user.ID_TK)}
                      >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                          <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                        </svg>
                        <span>Sửa</span>
                      </button>
                      <button 
                        className="delete-button"
                        onClick={() => handleDelete(user.ID_TK)}
                      >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <circle cx="12" cy="12" r="10"></circle>
                          <line x1="15" y1="9" x2="9" y2="15"></line>
                          <line x1="9" y1="9" x2="15" y2="15"></line>
                        </svg>
                        <span>Xoá</span>
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
            <tfoot>
              <tr>
                <td colSpan="6">
                  <div className="pagination-controls">
                    <div className="rows-per-page">
                      <span>Bảng ghi mỗi trang:</span>
                      <div className="select-wrapper">
                        <select 
                          value={rowsPerPage} 
                          onChange={(e) => handleRowsPerPageChange(Number(e.target.value))}
                        >
                          <option value="5">5</option>
                          <option value="10">10</option>
                          <option value="20">20</option>
                          <option value="50">50</option>
                        </select>
                      </div>
                    </div>
                    <div className="page-info">
                      {users.length > 0 
                        ? `${(currentPage - 1) * rowsPerPage + 1}-${Math.min(currentPage * rowsPerPage, users.length)} of ${users.length}` 
                        : '0-0 of 0'}
                    </div>
                    <div className="pagination-buttons">
                      <button 
                        className="pagination-button" 
                        onClick={handlePrevPage}
                        disabled={currentPage === 1}
                      >
                        <svg width="24" height="24" viewBox="0 0 24 24">
                          <path fill="currentColor" d="M15.41 7.41L14 6l-6 6 6 6 1.41-1.41L10.83 12l4.58-4.59z" />
                        </svg>
                      </button>
                      <button 
                        className="pagination-button"
                        onClick={handleNextPage}
                        disabled={currentPage >= totalPages}
                      >
                        <svg width="24" height="24" viewBox="0 0 24 24">
                          <path fill="currentColor" d="M10 6L8.59 7.41 13.17 12l-4.58 4.59L10 18l6-6-6-6z" />
                        </svg>
                      </button>
                    </div>
                  </div>
                </td>
              </tr>
            </tfoot>
          </table>
        )}      </div>
        {/* User Edit Modal */}
      <UserEditModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        user={currentUser}
        onSubmit={handleEditSubmit}
      />

      {/* User Add Modal */}
      <UserAddModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSubmit={handleAddSubmit}
      />
    </div>
  );
};

import React, { useState, useEffect } from 'react';
import { Table, Button, Modal, Form, Input, DatePicker, Select, Space, Card, message, Popconfirm, Tooltip } from 'antd';
import { DeleteOutlined, EditOutlined, EyeOutlined, PlusOutlined, FileAddOutlined } from '@ant-design/icons';
import axios from '../../utils/axios';
import moment from 'moment';
import { useAuth } from '../../hooks/useAuth';
import './StaffReportManagement.css';
import {
  getAllStaffReports,
  getStaffReportsByDateRange,
  createStaffReport,
  updateStaffReport,
  deleteStaffReport,
  generateAutomaticStaffReport
} from '../../services/report';

const { RangePicker } = DatePicker;
const { Option } = Select;

const StaffReportManagement = () => {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [currentReport, setCurrentReport] = useState(null);
  const [form] = Form.useForm();
  const [autoReportModalVisible, setAutoReportModalVisible] = useState(false);
  const [autoReportForm] = Form.useForm();
  const [staffList, setStaffList] = useState([]);
  const [filterDates, setFilterDates] = useState(null);

  const { user } = useAuth();

  // Fetch all staff reports
  const fetchReports = async (dateRange = null) => {
    setLoading(true);
    try {
      let response;
      
      if (dateRange) {
        try {
          response = await getStaffReportsByDateRange(
            dateRange[0].format('YYYY-MM-DD'), 
            dateRange[1].format('YYYY-MM-DD')
          );
        } catch (rangeError) {
          console.error('Error fetching reports by date range:', rangeError);
          // Fallback to getting all reports if date range query fails
          response = await getAllStaffReports();
          message.warning('Không thể lọc theo ngày, hiển thị tất cả báo cáo');
        }
      } else {
        response = await getAllStaffReports();
      }
      
      if (response && response.data) {
        if (response.message && response.message.includes('Mock data')) {
          message.warning('Dữ liệu hiển thị là dữ liệu mẫu do API không khả dụng');
        }
        
        setReports(response.data.map(report => ({
          ...report,
          key: report.ID_BCNV || Math.random().toString(36).substring(7),
          // Ensure numeric values are properly formatted
          SoDonGiao: Number(report.SoDonGiao || 0),
          SoDonTre: Number(report.SoDonTre || 0)
        })));
      } else {
        console.warn('Response has unexpected format:', response);
        setReports([]);
        message.warning('Dữ liệu báo cáo không đúng định dạng');
      }
    } catch (error) {
      console.error('Error fetching staff reports:', error);
      message.error(`Không thể tải danh sách báo cáo nhân viên: ${error.message}`);
      setReports([]);
    } finally {
      setLoading(false);
    }
  };

  // Fetch staff list for creating reports
  const fetchStaffList = async () => {
    try {
      const response = await axios.get('/staff');
      setStaffList(response.data.data || []);
    } catch (error) {
      console.error('Error fetching staff list:', error);
      message.error('Không thể tải danh sách nhân viên');
    }
  };

  useEffect(() => {
    fetchReports();
    fetchStaffList();
  }, []);

  const handleDateRangeChange = (dates) => {
    setFilterDates(dates);
    if (dates) {
      fetchReports(dates);
    } else {
      fetchReports();
    }
  };

  const showModal = (record = null) => {
    setCurrentReport(record);
    if (record) {
      form.setFieldsValue({
        ID_NV: record.ID_NV,
        NgayBaoCao: moment(record.NgayBaoCao),
        SoDonGiao: record.SoDonGiao,
        SoDonTre: record.SoDonTre,
        DanhGiaHieuSuat: record.DanhGiaHieuSuat
      });
    } else {
      form.resetFields();
      form.setFieldsValue({
        NgayBaoCao: moment(),
      });
    }
    setModalVisible(true);
  };

  const showDetailModal = (record) => {
    setCurrentReport(record);
    setDetailModalVisible(true);
  };

  const showAutoReportModal = () => {
    autoReportForm.resetFields();
    setAutoReportModalVisible(true);
  };

  const handleModalCancel = () => {
    setModalVisible(false);
    setCurrentReport(null);
    form.resetFields();
  };

  const handleDetailModalCancel = () => {
    setDetailModalVisible(false);
    setCurrentReport(null);
  };

  const handleAutoReportModalCancel = () => {
    setAutoReportModalVisible(false);
    autoReportForm.resetFields();
  };
  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      
      // Format date
      values.NgayBaoCao = values.NgayBaoCao.format('YYYY-MM-DD HH:mm:ss');
      
      if (currentReport) {
        // Update existing report
        await updateStaffReport(currentReport.ID_BCNV, values);
        message.success('Cập nhật báo cáo nhân viên thành công');
      } else {
        // Create new report - cần lấy ID_QL
        // Get admin ID using the same approach as in handleAutoReportSubmit
        let adminId;
        try {
          // First try to get ID from user context if available
          if (user && (user.ID_QL || user.id)) {
            adminId = user.ID_QL || user.id;
          } else {
            // Fallback to localStorage
            const userInfo = localStorage.getItem('userInfo');
            if (userInfo) {
              const parsedUserInfo = JSON.parse(userInfo);
              adminId = parsedUserInfo.ID_QL || parsedUserInfo.id;
            }
          }
        } catch (error) {
          console.error('Error getting admin ID:', error);
        }
        
        if (!adminId) {
          message.error('Không thể xác định ID quản lý. Vui lòng đăng nhập lại!');
          return;
        }
        
        // Add ID_QL to values
        values.ID_QL = adminId;
        
        await createStaffReport(values);
        message.success('Tạo báo cáo nhân viên thành công');
      }
      
      // Close modal and refresh data
      setModalVisible(false);
      form.resetFields();
      fetchReports(filterDates);
    } catch (error) {
      console.error('Error saving staff report:', error);
      message.error('Có lỗi xảy ra khi lưu báo cáo');
    }
  };
  const handleAutoReportSubmit = async () => {
    try {
      const values = await autoReportForm.validateFields();
      
      // Get admin ID from user context or localStorage with better error handling
      let adminId;
      try {
        // First try to get ID from user context if available
        if (user && (user.ID_QL || user.id)) {
          adminId = user.ID_QL || user.id;
        } else {
          // Fallback to localStorage
          const userInfo = localStorage.getItem('userInfo');
          if (userInfo) {
            const parsedUserInfo = JSON.parse(userInfo);
            adminId = parsedUserInfo.ID_QL || parsedUserInfo.id;
          }
        }
      } catch (error) {
        console.error('Error getting admin ID:', error);
      }
      
      if (!adminId) {
        // If no adminId is found, show error and return early
        message.error('Không thể xác định ID quản lý. Vui lòng đăng nhập lại!');
        return;
      }
      
      const payload = {
        ID_QL: adminId,
        ID_NV: values.ID_NV
      };
      
      await generateAutomaticStaffReport(payload);
      message.success('Tạo báo cáo nhân viên tự động thành công');
      
      // Close modal and refresh data
      setAutoReportModalVisible(false);
      autoReportForm.resetFields();
      fetchReports(filterDates);
    } catch (error) {
      console.error('Error generating automatic staff report:', error);
      message.error('Có lỗi xảy ra khi tạo báo cáo tự động');
    }
  };

  const handleDelete = async (id) => {
    try {
      await deleteStaffReport(id);
      message.success('Xóa báo cáo nhân viên thành công');
      fetchReports(filterDates);
    } catch (error) {
      console.error('Error deleting staff report:', error);
      message.error('Có lỗi xảy ra khi xóa báo cáo');
    }
  };

  const columns = [
    {
      title: 'ID',
      dataIndex: 'ID_BCNV',
      key: 'ID_BCNV',
      width: 70,
    },
    {
      title: 'Tên nhân viên',
      dataIndex: 'Ten_NV',
      key: 'Ten_NV',
    },
    {
      title: 'Ngày báo cáo',
      dataIndex: 'NgayBaoCao',
      key: 'NgayBaoCao',
      render: (text) => moment(text).format('DD/MM/YYYY'),
      sorter: (a, b) => moment(a.NgayBaoCao).unix() - moment(b.NgayBaoCao).unix(),
    },
    {
      title: 'Số đơn giao',
      dataIndex: 'SoDonGiao',
      key: 'SoDonGiao',
      sorter: (a, b) => a.SoDonGiao - b.SoDonGiao,
    },
    {
      title: 'Số đơn trễ',
      dataIndex: 'SoDonTre',
      key: 'SoDonTre',
      sorter: (a, b) => a.SoDonTre - b.SoDonTre,
    },
    {
      title: 'Đánh giá',
      dataIndex: 'DanhGiaHieuSuat',
      key: 'DanhGiaHieuSuat',
      render: (text) => {
        let color = 'green';
        if (text === 'Trung bình') color = 'orange';
        if (text === 'Kém') color = 'red';
        if (text === 'Không đánh giá') color = 'gray';
        
        return <span style={{ color }}>{text}</span>;
      },
      filters: [
        { text: 'Tốt', value: 'Tốt' },
        { text: 'Trung bình', value: 'Trung bình' },
        { text: 'Kém', value: 'Kém' },
        { text: 'Không đánh giá', value: 'Không đánh giá' },
      ],
      onFilter: (value, record) => record.DanhGiaHieuSuat.includes(value),
    },
    {
      title: 'Thao tác',
      key: 'action',
      width: 150,
      render: (_, record) => (
        <Space size="small">
          <Tooltip title="Xem chi tiết">
            <Button 
              icon={<EyeOutlined />} 
              onClick={() => showDetailModal(record)}
              type="primary"
              size="small"
              ghost
            />
          </Tooltip>
          <Tooltip title="Chỉnh sửa">
            <Button 
              icon={<EditOutlined />} 
              onClick={() => showModal(record)}
              type="primary"
              size="small"
            />
          </Tooltip>
          <Tooltip title="Xóa">
            <Popconfirm
              title="Bạn có chắc chắn muốn xóa báo cáo này?"
              onConfirm={() => handleDelete(record.ID_BCNV)}
              okText="Có"
              cancelText="Không"
            >
              <Button icon={<DeleteOutlined />} type="primary" danger size="small" />
            </Popconfirm>
          </Tooltip>
        </Space>
      ),
    },
  ];

  return (
    <div className="staff-report-management">
      <Card
        title="Quản lý báo cáo nhân viên"
        extra={
          <Space>
            <RangePicker
              onChange={handleDateRangeChange}
              format="DD/MM/YYYY"
              placeholder={['Từ ngày', 'Đến ngày']}
            />
            <Tooltip title="Tạo báo cáo tự động">
              <Button 
                type="primary" 
                icon={<FileAddOutlined />} 
                onClick={showAutoReportModal}
              >
                Báo cáo tự động
              </Button>
            </Tooltip>
            <Tooltip title="Thêm báo cáo mới">
              <Button 
                type="primary" 
                icon={<PlusOutlined />} 
                onClick={() => showModal()}
              >
                Thêm báo cáo
              </Button>
            </Tooltip>
          </Space>
        }
      >
        <Table 
          columns={columns} 
          dataSource={reports} 
          loading={loading}
          rowKey="ID_BCNV"
          pagination={{ pageSize: 10 }}
        />
      </Card>

      {/* Modal thêm/sửa báo cáo */}
      <Modal
        title={currentReport ? 'Chỉnh sửa báo cáo nhân viên' : 'Thêm báo cáo nhân viên'}
        open={modalVisible}
        onCancel={handleModalCancel}
        onOk={handleSubmit}
        okText={currentReport ? 'Cập nhật' : 'Tạo mới'}
        cancelText="Hủy"
        width={600}
      >
        <Form
          form={form}
          layout="vertical"
        >
          <Form.Item
            name="ID_NV"
            label="Nhân viên"
            rules={[{ required: true, message: 'Vui lòng chọn nhân viên' }]}
          >
            <Select placeholder="Chọn nhân viên">
              {staffList.map(staff => (
                <Option key={staff.ID_NV} value={staff.ID_NV}>{staff.Ten_NV}</Option>
              ))}
            </Select>
          </Form.Item>
          
          <Form.Item
            name="NgayBaoCao"
            label="Ngày báo cáo"
            rules={[{ required: true, message: 'Vui lòng chọn ngày báo cáo' }]}
          >
            <DatePicker 
              style={{ width: '100%' }} 
              format="DD/MM/YYYY"
            />
          </Form.Item>
          
          <Form.Item
            name="SoDonGiao"
            label="Số đơn đã giao"
            rules={[{ 
              required: true, 
              message: 'Vui lòng nhập số đơn giao' 
            }]}
          >
            <Input type="number" min={0} />
          </Form.Item>
          
          <Form.Item
            name="SoDonTre"
            label="Số đơn giao trễ"
            rules={[{ 
              required: true, 
              message: 'Vui lòng nhập số đơn trễ' 
            }]}
          >
            <Input type="number" min={0} />
          </Form.Item>
          
          <Form.Item
            name="DanhGiaHieuSuat"
            label="Đánh giá hiệu suất"
            rules={[{ required: true, message: 'Vui lòng chọn đánh giá hiệu suất' }]}
          >
            <Select placeholder="Chọn đánh giá hiệu suất">
              <Option value="Tốt">Tốt</Option>
              <Option value="Trung bình">Trung bình</Option>
              <Option value="Kém">Kém</Option>
              <Option value="Không đánh giá">Không đánh giá</Option>
            </Select>
          </Form.Item>
        </Form>
      </Modal>
      
      {/* Modal chi tiết báo cáo */}
      <Modal
        title="Chi tiết báo cáo nhân viên"
        open={detailModalVisible}
        onCancel={handleDetailModalCancel}
        footer={[
          <Button key="back" onClick={handleDetailModalCancel}>
            Đóng
          </Button>
        ]}
        width={600}
      >
        {currentReport && (
          <div className="report-detail">
            <p><strong>ID báo cáo:</strong> {currentReport.ID_BCNV}</p>
            <p><strong>Loại báo cáo:</strong> {currentReport.Loai_BC}</p>
            <p><strong>Nhân viên:</strong> {currentReport.Ten_NV}</p>
            <p><strong>Ngày báo cáo:</strong> {moment(currentReport.NgayBaoCao).format('DD/MM/YYYY')}</p>
            <p><strong>Số đơn đã giao:</strong> {currentReport.SoDonGiao}</p>
            <p><strong>Số đơn giao trễ:</strong> {currentReport.SoDonTre}</p>
            <p><strong>Tỷ lệ đơn trễ:</strong> {currentReport.SoDonGiao > 0 
              ? ((currentReport.SoDonTre / currentReport.SoDonGiao) * 100).toFixed(2) + '%' 
              : '0%'}
            </p>
            <p>
              <strong>Đánh giá hiệu suất:</strong> 
              <span className={`status-${currentReport.DanhGiaHieuSuat === 'Tốt' ? 'success' : 
                currentReport.DanhGiaHieuSuat === 'Trung bình' ? 'warning' : 'danger'}`}> 
                {currentReport.DanhGiaHieuSuat}
              </span>
            </p>
          </div>
        )}
      </Modal>

      {/* Modal tạo báo cáo tự động */}
      <Modal
        title="Tạo báo cáo nhân viên tự động"
        open={autoReportModalVisible}
        onCancel={handleAutoReportModalCancel}
        onOk={handleAutoReportSubmit}
        okText="Tạo báo cáo"
        cancelText="Hủy"
        width={600}
      >
        <Form
          form={autoReportForm}
          layout="vertical"
        >          <Form.Item
            name="ID_NV"
            label="Nhân viên"
            rules={[{ required: true, message: 'Vui lòng chọn nhân viên' }]}
          >
            <Select placeholder="Chọn nhân viên">
              {staffList.map(staff => (
                <Option key={staff.ID_NV} value={staff.ID_NV}>{staff.Ten_NV}</Option>
              ))}
            </Select>
          </Form.Item>
            <p>
            Hệ thống sẽ tự động tạo báo cáo hiệu suất cho nhân viên dựa trên tất cả đơn hàng 
            đã hoàn thành và trễ hạn.
          </p>
        </Form>
      </Modal>
    </div>
  );
};

export default StaffReportManagement;

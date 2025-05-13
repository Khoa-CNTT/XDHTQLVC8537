import React, { useState, useEffect } from 'react';
import { Table, Button, Modal, Form, Input, DatePicker, Card, message, Popconfirm, Tooltip, Space, Select, Statistic, Row, Col } from 'antd';
import { DeleteOutlined, EditOutlined, EyeOutlined, PlusOutlined, FileAddOutlined, LineChartOutlined } from '@ant-design/icons';
import moment from 'moment';
import { useAuth } from '../../hooks/useAuth';
import './FinancialReportManagement.css';
import { 
  getAllFinancialReports, 
  getFinancialReportsByDateRange,
  getRevenueStatistics,
  createFinancialReport,
  generateAutomaticFinancialReport,
  updateFinancialReport,
  deleteFinancialReport
} from '../../services/report';

const { RangePicker } = DatePicker;
const { Option } = Select;

const FinancialReportManagement = () => {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [statsModalVisible, setStatsModalVisible] = useState(false);
  const [currentReport, setCurrentReport] = useState(null);
  const [form] = Form.useForm();
  const [autoReportForm] = Form.useForm();
  const [autoReportModalVisible, setAutoReportModalVisible] = useState(false);
  const [filterDates, setFilterDates] = useState(null);
  const [revenueStats, setRevenueStats] = useState({});
  const [statsPeriod, setStatsPeriod] = useState('month');

  const { user } = useAuth();
  // Fetch all financial reports
  const fetchReports = async (dateRange = null) => {
    setLoading(true);
    try {
      let response;
      
      if (dateRange) {
        try {
          response = await getFinancialReportsByDateRange(
            dateRange[0].format('YYYY-MM-DD'), 
            dateRange[1].format('YYYY-MM-DD')
          );
        } catch (rangeError) {
          console.error('Error fetching reports by date range:', rangeError);
          // Fallback to getting all reports if date range query fails
          response = await getAllFinancialReports();
          message.warning('Không thể lọc theo ngày, hiển thị tất cả báo cáo');
        }
      } else {
        response = await getAllFinancialReports();
      }
      
      if (response && response.data) {
        if (response.message && response.message.includes('Mock data')) {
          message.warning('Dữ liệu hiển thị là dữ liệu mẫu do API không khả dụng');
        }
        
        setReports(response.data.map(report => ({
          ...report,
          key: report.ID_BCTC || Math.random().toString(36).substring(7),
          // Ensure numeric values are properly formatted
          TienShip: Number(report.TienShip || 0),
          TienThuHo: Number(report.TienThuHo || 0),
          DoanhThu: Number(report.DoanhThu || 0)
        })));
      } else {
        console.warn('Response has unexpected format:', response);
        setReports([]);
        message.warning('Dữ liệu báo cáo không đúng định dạng');
      }
    } catch (error) {
      console.error('Error fetching financial reports:', error);
      message.error(`Không thể tải danh sách báo cáo tài chính: ${error.message}`);
      setReports([]);
    } finally {
      setLoading(false);
    }
  };
  // Fetch revenue statistics
  const fetchRevenueStats = async (period = 'month', dateRange = null) => {
    try {
      let startDate = moment().subtract(12, 'months').format('YYYY-MM-DD');
      let endDate = moment().format('YYYY-MM-DD');
      
      if (dateRange) {
        startDate = dateRange[0].format('YYYY-MM-DD');
        endDate = dateRange[1].format('YYYY-MM-DD');
      }
      
      const response = await getRevenueStatistics(period, startDate, endDate);
      setRevenueStats(response.data || []);
    } catch (error) {
      console.error('Error fetching revenue statistics:', error);
      message.error('Không thể tải dữ liệu thống kê doanh thu');
    }
  };

  useEffect(() => {
    fetchReports();
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
        NgayBatDau: moment(record.NgayBatDau),
        NgayKetThuc: moment(record.NgayKetThuc),
        TienShip: record.TienShip,
        TienThuHo: record.TienThuHo,
        DoanhThu: record.DoanhThu
      });
    } else {
      form.resetFields();
      form.setFieldsValue({
        NgayBatDau: moment(),
        NgayKetThuc: moment(),
      });
    }
    setModalVisible(true);
  };

  const showDetailModal = (record) => {
    setCurrentReport(record);
    setDetailModalVisible(true);
  };

  const showStatsModal = () => {
    fetchRevenueStats(statsPeriod, filterDates);
    setStatsModalVisible(true);
  };

  const showAutoReportModal = () => {
    autoReportForm.resetFields();
    autoReportForm.setFieldsValue({
      dateRange: [moment().subtract(30, 'days'), moment()]
    });
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

  const handleStatsModalCancel = () => {
    setStatsModalVisible(false);
  };

  const handleAutoReportModalCancel = () => {
    setAutoReportModalVisible(false);
    autoReportForm.resetFields();
  };
  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      
      // Format dates
      values.NgayBatDau = values.NgayBatDau.format('YYYY-MM-DD HH:mm:ss');
      values.NgayKetThuc = values.NgayKetThuc.format('YYYY-MM-DD HH:mm:ss');
      
      if (currentReport) {
        // Update existing report
        await updateFinancialReport(currentReport.ID_BCTC, values);
        message.success('Cập nhật báo cáo tài chính thành công');
      } else {
        // Create new report
        values.ID_QL = user.ID_QL || user.id;
        values.ID_TT = values.ID_TT || 1; // Default value or from form
        
        await createFinancialReport(values);
        message.success('Tạo báo cáo tài chính thành công');
      }
      
      // Close modal and refresh data
      setModalVisible(false);
      form.resetFields();
      fetchReports(filterDates);
    } catch (error) {
      console.error('Error saving financial report:', error);
      message.error('Có lỗi xảy ra khi lưu báo cáo');
    }
  };
  const handleAutoReportSubmit = async () => {
    try {
      const values = await autoReportForm.validateFields();
      
      // Format dates
      const dateRange = values.dateRange;
      const payload = {
        ID_QL: user.ID_QL || user.id,
        startDate: dateRange[0].format('YYYY-MM-DD'),
        endDate: dateRange[1].format('YYYY-MM-DD')
      };
      
      await generateAutomaticFinancialReport(payload);
      message.success('Tạo báo cáo tài chính tự động thành công');
      
      // Close modal and refresh data
      setAutoReportModalVisible(false);
      autoReportForm.resetFields();
      fetchReports(filterDates);
    } catch (error) {
      console.error('Error generating automatic financial report:', error);
      message.error('Có lỗi xảy ra khi tạo báo cáo tự động');
    }
  };
  const handleDelete = async (id) => {
    try {
      await deleteFinancialReport(id);
      message.success('Xóa báo cáo tài chính thành công');
      fetchReports(filterDates);
    } catch (error) {
      console.error('Error deleting financial report:', error);
      message.error('Có lỗi xảy ra khi xóa báo cáo');
    }
  };

  const handleStatsPeriodChange = (value) => {
    setStatsPeriod(value);
    fetchRevenueStats(value, filterDates);
  };

  const columns = [
    {
      title: 'ID',
      dataIndex: 'ID_BCTC',
      key: 'ID_BCTC',
      width: 60,
    },
    {
      title: 'Người tạo',
      dataIndex: 'TenQL',
      key: 'TenQL',
    },
    {
      title: 'Từ ngày',
      dataIndex: 'NgayBatDau',
      key: 'NgayBatDau',
      render: (text) => moment(text).format('DD/MM/YYYY'),
      sorter: (a, b) => moment(a.NgayBatDau).unix() - moment(b.NgayBatDau).unix(),
    },
    {
      title: 'Đến ngày',
      dataIndex: 'NgayKetThuc',
      key: 'NgayKetThuc',
      render: (text) => moment(text).format('DD/MM/YYYY'),
    },
    {
      title: 'Phí vận chuyển',
      dataIndex: 'TienShip',
      key: 'TienShip',
      render: (text) => `${text.toLocaleString('vi-VN')} đ`,
      sorter: (a, b) => a.TienShip - b.TienShip,
    },
    {
      title: 'Tiền thu hộ',
      dataIndex: 'TienThuHo',
      key: 'TienThuHo',
      render: (text) => `${text.toLocaleString('vi-VN')} đ`,
      sorter: (a, b) => a.TienThuHo - b.TienThuHo,
    },
    {
      title: 'Doanh thu',
      dataIndex: 'DoanhThu',
      key: 'DoanhThu',
      render: (text) => `${text.toLocaleString('vi-VN')} đ`,
      sorter: (a, b) => a.DoanhThu - b.DoanhThu,
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
              onConfirm={() => handleDelete(record.ID_BCTC)}
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

  // Calculate total revenue
  const totalRevenue = reports.reduce((sum, report) => sum + report.DoanhThu, 0);
  const totalShipping = reports.reduce((sum, report) => sum + report.TienShip, 0);
  const totalCOD = reports.reduce((sum, report) => sum + report.TienThuHo, 0);

  return (
    <div className="financial-report-management">
      <Row gutter={16} className="stats-cards">
        <Col span={8}>
          <Card>
            <Statistic
              title="Tổng doanh thu"
              value={totalRevenue}
              precision={0}
              valueStyle={{ color: '#3f8600' }}
              suffix="đ"
              formatter={(value) => `${value.toLocaleString('vi-VN')}`}
            />
          </Card>
        </Col>
        <Col span={8}>
          <Card>
            <Statistic
              title="Tổng phí vận chuyển"
              value={totalShipping}
              precision={0}
              valueStyle={{ color: '#1890ff' }}
              suffix="đ"
              formatter={(value) => `${value.toLocaleString('vi-VN')}`}
            />
          </Card>
        </Col>
        <Col span={8}>
          <Card>
            <Statistic
              title="Tổng tiền thu hộ"
              value={totalCOD}
              precision={0}
              valueStyle={{ color: '#722ed1' }}
              suffix="đ"
              formatter={(value) => `${value.toLocaleString('vi-VN')}`}
            />
          </Card>
        </Col>
      </Row>

      <Card
        title="Quản lý báo cáo tài chính"
        extra={
          <Space>
            <RangePicker
              onChange={handleDateRangeChange}
              format="DD/MM/YYYY"
              placeholder={['Từ ngày', 'Đến ngày']}
            />
            <Tooltip title="Xem thống kê doanh thu">
              <Button 
                type="primary" 
                icon={<LineChartOutlined />} 
                onClick={showStatsModal}
              >
                Thống kê
              </Button>
            </Tooltip>
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
          rowKey="ID_BCTC"
          pagination={{ pageSize: 10 }}
        />
      </Card>

      {/* Modal thêm/sửa báo cáo */}
      <Modal
        title={currentReport ? 'Chỉnh sửa báo cáo tài chính' : 'Thêm báo cáo tài chính'}
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
            name="NgayBatDau"
            label="Từ ngày"
            rules={[{ required: true, message: 'Vui lòng chọn ngày bắt đầu' }]}
          >
            <DatePicker 
              style={{ width: '100%' }} 
              format="DD/MM/YYYY"
            />
          </Form.Item>
          
          <Form.Item
            name="NgayKetThuc"
            label="Đến ngày"
            rules={[{ required: true, message: 'Vui lòng chọn ngày kết thúc' }]}
          >
            <DatePicker 
              style={{ width: '100%' }} 
              format="DD/MM/YYYY"
            />
          </Form.Item>
          
          <Form.Item
            name="TienShip"
            label="Phí vận chuyển"
            rules={[{ 
              required: true, 
              message: 'Vui lòng nhập phí vận chuyển' 
            }]}
          >
            <Input type="number" min={0} addonAfter="đ" />
          </Form.Item>
          
          <Form.Item
            name="TienThuHo"
            label="Tiền thu hộ"
            rules={[{ 
              required: true, 
              message: 'Vui lòng nhập tiền thu hộ' 
            }]}
          >
            <Input type="number" min={0} addonAfter="đ" />
          </Form.Item>
          
          <Form.Item
            name="DoanhThu"
            label="Doanh thu"
            rules={[{ 
              required: true, 
              message: 'Vui lòng nhập doanh thu' 
            }]}
          >
            <Input type="number" min={0} addonAfter="đ" />
          </Form.Item>
        </Form>
      </Modal>
      
      {/* Modal chi tiết báo cáo */}
      <Modal
        title="Chi tiết báo cáo tài chính"
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
            <p><strong>ID báo cáo:</strong> {currentReport.ID_BCTC}</p>
            <p><strong>Loại báo cáo:</strong> {currentReport.Loai_BC}</p>
            <p><strong>Người tạo:</strong> {currentReport.TenQL}</p>
            <p><strong>Khoảng thời gian:</strong> {moment(currentReport.NgayBatDau).format('DD/MM/YYYY')} - {moment(currentReport.NgayKetThuc).format('DD/MM/YYYY')}</p>
            <p><strong>Phí vận chuyển:</strong> {currentReport.TienShip.toLocaleString('vi-VN')} đ</p>
            <p><strong>Tiền thu hộ:</strong> {currentReport.TienThuHo.toLocaleString('vi-VN')} đ</p>
            <p><strong>Doanh thu:</strong> {currentReport.DoanhThu.toLocaleString('vi-VN')} đ</p>
            <p><strong>Lợi nhuận từ tiền thu hộ (5%):</strong> {(currentReport.TienThuHo * 0.05).toLocaleString('vi-VN')} đ</p>
            <p><strong>Tỷ lệ doanh thu/phí vận chuyển:</strong> {currentReport.TienShip > 0 
              ? ((currentReport.DoanhThu / currentReport.TienShip) * 100).toFixed(2) + '%' 
              : '0%'}
            </p>
          </div>
        )}
      </Modal>

      {/* Modal tạo báo cáo tự động */}
      <Modal
        title="Tạo báo cáo tài chính tự động"
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
        >
          <Form.Item
            name="dateRange"
            label="Khoảng thời gian"
            rules={[{ required: true, message: 'Vui lòng chọn khoảng thời gian' }]}
          >
            <RangePicker 
              style={{ width: '100%' }} 
              format="DD/MM/YYYY"
            />
          </Form.Item>
          
          <p>
            Hệ thống sẽ tự động tạo báo cáo tài chính dựa trên dữ liệu đơn hàng trong khoảng thời gian 
            được chọn. Doanh thu sẽ được tính từ phí vận chuyển và 5% phí dịch vụ trên giá trị tiền thu hộ.
          </p>
        </Form>
      </Modal>

      {/* Modal thống kê doanh thu */}
      <Modal
        title="Thống kê doanh thu"
        open={statsModalVisible}
        onCancel={handleStatsModalCancel}
        footer={[
          <Button key="back" onClick={handleStatsModalCancel}>
            Đóng
          </Button>
        ]}
        width={800}
      >
        <div className="stats-header">
          <Space>
            <span>Phân kỳ:</span>
            <Select value={statsPeriod} onChange={handleStatsPeriodChange}>
              <Option value="day">Theo ngày</Option>
              <Option value="month">Theo tháng</Option>
              <Option value="year">Theo năm</Option>
            </Select>
          </Space>
        </div>
        
        <Table
          dataSource={revenueStats}
          rowKey={(record) => record.Date || record.Month || record.Year}
          pagination={false}
          columns={[
            {
              title: 'Thời gian',
              dataIndex: statsPeriod === 'day' ? 'Date' : (statsPeriod === 'month' ? 'Month' : 'Year'),
              key: 'time',
              render: (text) => {
                if (statsPeriod === 'day') return moment(text).format('DD/MM/YYYY');
                if (statsPeriod === 'month') {
                  const [year, month] = text.split('-');
                  return `Tháng ${month}/${year}`;
                }
                return `Năm ${text}`;
              }
            },
            {
              title: 'Phí vận chuyển',
              dataIndex: 'TienShip',
              key: 'shipping',
              render: (text) => `${Number(text).toLocaleString('vi-VN')} đ`
            },
            {
              title: 'Tiền thu hộ',
              dataIndex: 'TienThuHo',
              key: 'cod',
              render: (text) => `${Number(text).toLocaleString('vi-VN')} đ`
            },
            {
              title: 'Doanh thu',
              dataIndex: 'DoanhThu',
              key: 'revenue',
              render: (text) => `${Number(text).toLocaleString('vi-VN')} đ`
            }
          ]}
        />
      </Modal>
    </div>
  );
};

export default FinancialReportManagement;

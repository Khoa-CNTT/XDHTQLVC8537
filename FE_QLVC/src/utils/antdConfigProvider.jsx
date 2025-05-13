import React from 'react';
import { ConfigProvider } from 'antd';

// Configure Ant Design with warnings disabled
ConfigProvider.config({
  prefixCls: 'ant',
  // Set theme options if needed
  theme: {},
  // Disable warning messages related to compatibility
  warningConfig: {
    DisableComponent: true,
    // Disable React compatibility warnings
    ReactVersion: true,
  },
});

// Wrapper component to provide Ant Design configuration to the application
const AntdConfigProvider = ({ children }) => {
  return (
    <ConfigProvider>
      {children}
    </ConfigProvider>
  );
};

export default AntdConfigProvider;

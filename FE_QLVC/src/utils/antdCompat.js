import { ConfigProvider } from 'antd';

// Configure Ant Design to suppress React compatibility warnings
ConfigProvider.config({
  theme: {},
  // Disable warning messages related to compatibility
  warningConfig: {
    // Disable React compatibility warnings
    ReactVersion: false,
  },
});

const setupAntdCompat = () => {
  // This function is called to set up compatibility mode
  console.log('Ant Design compatibility mode initialized');
};

export default setupAntdCompat;

/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Define colors based on Figma
        'figma-appbar': '#FFFFFF',        // Header background
        'figma-sidebar': '#FFFFFF',       // Sidebar background
        'figma-content-bg': '#F9FAFB',   // Main content background
        'figma-text-primary': '#111827', // Dark text (Gray-900)
        'figma-text-secondary': '#6B7280',// Lighter text (Gray-500)
        'figma-icon': '#6B7280',          // Icon color (Gray-500)
        'figma-icon-inactive': '#9CA3AF', // Slightly lighter icon (Gray-400)
        'figma-active-item': '#EFF6FF',   // Sidebar active bg (Blue-50)
        'figma-active-text': '#2563EB',   // Sidebar active text (Blue-600)
        'figma-logout-btn': '#2563EB',   // Primary button bg (Blue-600)
        'figma-search-border': '#E5E7EB', // Search input border (Gray-200)
        'figma-table-header': '#F9FAFB', // Table header bg (Gray-50)
        'figma-border': '#E5E7EB',       // General border color (Gray-200)
      },
    },
  },
  plugins: [],
}
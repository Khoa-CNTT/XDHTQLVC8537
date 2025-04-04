export default {
    content: ["./index.html", "./src/**/*.{js,jsx,ts,tsx}"],
    theme: {
        extend: {
            borderColor: theme => ({
                DEFAULT: theme('colors.gray.300', 'currentColor'),
            }),
        },
    },
    plugins: [],
};
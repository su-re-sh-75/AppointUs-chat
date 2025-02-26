 /** @type {import('tailwindcss').Config} */
 export default {
    content: [
        "./translation/templates/**/*.html",
        "./node_modules/flyonui/dist/js/*.js",
    ],
    theme: {
      extend: {},
    },
    plugins: [
        require("flyonui"),
        require("flyonui/plugin"),
    ],
  }
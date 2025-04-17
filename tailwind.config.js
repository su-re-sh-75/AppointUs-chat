 /** @type {import('tailwindcss').Config} */
 export default {
    content: [
        "./translation/templates/translation/*.html",
        "./users/templates/**/*.html",
        "./node_modules/flyonui/dist/js/*.js",
        "./*.html",
    ],
    theme: {
      extend: {},
    },
    plugins: [
        require("flyonui"),
        require("flyonui/plugin"),
    ],
    flyonui: {
      themes: true,
      darkTheme: "dark",
      base: true,
      styled: true,
      utils: true, 
    }
  }
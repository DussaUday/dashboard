const fs = require('fs');
const { execSync } = require('child_process');

console.log('🔧 Fixing Tailwind CSS configuration...');

// Create correct PostCSS config
const postcssConfig = `export default {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
}`;

fs.writeFileSync('postcss.config.js', postcssConfig);
console.log('✅ Created postcss.config.js');

// Create correct Tailwind config
const tailwindConfig = `/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}`;

fs.writeFileSync('tailwind.config.js', tailwindConfig);
console.log('✅ Updated tailwind.config.js');

console.log('🎉 Configuration fixed! Run: npm run dev');
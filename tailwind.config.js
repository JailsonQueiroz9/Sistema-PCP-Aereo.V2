/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        logistica: {
          blue: '#3b82f6', // Azul padrão profissional
          accent: '#55aaff', // Azul vibrante da marca
          dark: '#020617', // Fundo principal
          surface: '#0f172a', // Superfície de cards
          border: '#1e293b', // Bordas de inputs
          text: '#94a3b8', // Texto secundário
          input: '#1a1a1a', // Cor de fundo de inputs da imagem
          button: '#444444'  // Cor de botões padrão da imagem
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ["class"],
  content: [
    './pages/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './app/**/*.{ts,tsx}',
    './src/**/*.{ts,tsx}',
  ],
  prefix: "",
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        // Wine-specific colors (existing)
        wine: {
          50: '#fdf2f2',
          100: '#fce7e7',
          200: '#f9d5d5',
          300: '#f4b3b3',
          400: '#ed8888',
          500: '#e35d5d',
          600: '#D4434C',
          700: '#B73E3E',
          800: '#963838',
          900: '#7C3535',
          950: '#421A1A',
          burgundy: '#722F37',
          gold: '#D4AF37',
          cream: '#F5F5DC',
          sage: '#87A96B',
          earth: '#8B4513',
        },
        // Heritage color palette - Domaine Vallot design brief
        heritage: {
          // Primary colors
          limestone: {
            DEFAULT: '#EAE3D6', // Limestone Clay - warm off-white
            50: '#F8F6F2',
            100: '#F2EDE5',
            200: '#EAE3D6',
            300: '#DDD3C2',
            400: '#CFC2AA',
            500: '#C0B192',
            600: '#A69980',
            700: '#8B7F6B',
            800: '#6B6253',
            900: '#4A443B',
          },
          rouge: {
            DEFAULT: '#7B2423', // Vinsobres Rouge - deep, earthy red
            50: '#FDF2F2',
            100: '#FCE7E7',
            200: '#F8CCCC',
            300: '#F1A1A1',
            400: '#E56868',
            500: '#D23838',
            600: '#B82F2F',
            700: '#7B2423',
            800: '#631E1D',
            900: '#4A1717',
            950: '#2A0D0D',
          },
          // Supporting colors
          olive: {
            DEFAULT: '#626E5A', // Olive Leaf - muted, dusty green
            50: '#F6F7F5',
            100: '#EAECEA',
            200: '#D6DAD2',
            300: '#BBC3B5',
            400: '#9BA690',
            500: '#7E8A73',
            600: '#626E5A',
            700: '#525A4A',
            800: '#434A3D',
            900: '#363B31',
          },
          slate: {
            DEFAULT: '#414141', // Wet Slate - dark charcoal-grey
            50: '#F8F8F8',
            100: '#F1F1F1',
            200: '#E4E4E4',
            300: '#D1D1D1',
            400: '#B4B4B4',
            500: '#9A9A9A',
            600: '#818181',
            700: '#6A6A6A',
            800: '#545454',
            900: '#414141',
            950: '#262626',
          },
          // Accent color
          golden: {
            DEFAULT: '#C89F5E', // Golden Hour - muted ochre
            50: '#FDF9F3',
            100: '#FAF2E6',
            200: '#F4E3CC',
            300: '#EBCFA3',
            400: '#DFB675',
            500: '#C89F5E',
            600: '#B5894A',
            700: '#96713C',
            800: '#795A2F',
            900: '#5C4423',
          },
        },
        // Semantic heritage tokens for easier usage
        'heritage-primary': 'var(--heritage-primary)',
        'heritage-secondary': 'var(--heritage-secondary)',
        'heritage-accent': 'var(--heritage-accent)',
        'heritage-background': 'var(--heritage-background)',
        'heritage-foreground': 'var(--heritage-foreground)',
        'heritage-muted': 'var(--heritage-muted)',
        'heritage-border': 'var(--heritage-border)',
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        serif: ['Playfair Display', 'serif'],
      },
      fontSize: {
        'xs': '0.75rem',
        'sm': '0.875rem',
        'base': '1rem',
        'lg': '1.125rem',
        'xl': '1.25rem',
        '2xl': '1.5rem',
        '3xl': '1.875rem',
        '4xl': '2.25rem',
        '5xl': '3rem',
        '6xl': '3.75rem',
      },
      spacing: {
        '18': '4.5rem',
        '88': '22rem',
      },
      maxWidth: {
        '8xl': '88rem',
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
        "fade-in": {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        "slide-in-from-bottom": {
          "0%": { transform: "translateY(100%)" },
          "100%": { transform: "translateY(0)" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        "fade-in": "fade-in 0.5s ease-out",
        "slide-in": "slide-in-from-bottom 0.3s ease-out",
      },
    },
  },
  plugins: [
    require("@tailwindcss/forms"),
    require("@tailwindcss/typography"),
  ],
}

import type { Config } from "tailwindcss";

export default {
	darkMode: ["class"],
	content: [
		"./pages/**/*.{ts,tsx}",
		"./components/**/*.{ts,tsx}",
		"./app/**/*.{ts,tsx}",
		"./src/**/*.{ts,tsx}",
	],
	prefix: "",
	theme: {
		fontFamily: {
			'century': ['Century Gothic', 'CenturyGothic', 'AppleGothic', 'sans-serif'],
			'inter': ['Inter', 'sans-serif'],
			'outfit': ['Outfit', 'sans-serif'],
			'playfair': ['Playfair Display', 'serif'],
			'poppins': ['Poppins', 'sans-serif'],
			'roboto': ['Roboto', 'sans-serif'],
			'open-sans': ['Open Sans', 'sans-serif'],
			'lato': ['Lato', 'sans-serif'],
			'montserrat': ['Montserrat', 'sans-serif'],
			'source-sans': ['Source Sans Pro', 'sans-serif'],
		},
		container: {
			center: true,
			padding: '2rem',
			screens: {
				'2xl': '1400px'
			}
		},
		extend: {
			colors: {
				border: 'hsl(var(--border))',
				input: 'hsl(var(--input))',
				ring: 'hsl(var(--ring))',
				background: 'hsl(var(--background))',
				foreground: 'hsl(var(--foreground))',
				cream: '#FFF8E1',
				textPrimary: '#212121',
				accentRed: '#D32F2F',
				navyBlue: '#1E3A5F',
				lightGray: '#BDBDBD',
				// Professional Finance theme colors
				'theme-primary': 'hsl(var(--theme-primary))',
				'theme-secondary': 'hsl(var(--theme-secondary))',
				'theme-accent': 'hsl(var(--theme-accent))',
				'theme-bg': 'hsl(var(--theme-bg))',
				'theme-text': 'hsl(var(--theme-text))',
				primary: {
					DEFAULT: 'hsl(var(--primary))',
					foreground: 'hsl(var(--primary-foreground))'
				},
				secondary: {
					DEFAULT: 'hsl(var(--secondary))',
					foreground: 'hsl(var(--secondary-foreground))'
				},
				destructive: {
					DEFAULT: 'hsl(var(--destructive))',
					foreground: 'hsl(var(--destructive-foreground))'
				},
				muted: {
					DEFAULT: 'hsl(var(--muted))',
					foreground: 'hsl(var(--muted-foreground))'
				},
				accent: {
					DEFAULT: 'hsl(var(--accent))',
					foreground: 'hsl(var(--accent-foreground))'
				},
				popover: {
					DEFAULT: 'hsl(var(--popover))',
					foreground: 'hsl(var(--popover-foreground))'
				},
				card: {
					DEFAULT: 'hsl(var(--card))',
					foreground: 'hsl(var(--card-foreground))'
				},
				sidebar: {
					DEFAULT: 'hsl(var(--sidebar-background))',
					foreground: 'hsl(var(--sidebar-foreground))',
					primary: 'hsl(var(--sidebar-primary))',
					'primary-foreground': 'hsl(var(--sidebar-primary-foreground))',
					accent: 'hsl(var(--sidebar-accent))',
					'accent-foreground': 'hsl(var(--sidebar-accent-foreground))',
					border: 'hsl(var(--sidebar-border))',
					ring: 'hsl(var(--sidebar-ring))'
				}
			},
			borderRadius: {
				lg: 'var(--radius)',
				md: 'calc(var(--radius) - 2px)',
				sm: 'calc(var(--radius) - 4px)'
			},
			keyframes: {
				'accordion-down': {
					from: {
						height: '0'
					},
					to: {
						height: 'var(--radix-accordion-content-height)'
					}
				},
				'accordion-up': {
					from: {
						height: 'var(--radix-accordion-content-height)'
					},
					to: {
						height: '0'
					}
				},
				'pulse-button': {
					'0%, 100%': {
						transform: 'scale(1)'
					},
					'50%': {
						transform: 'scale(1.05)'
					}
				},
				'cursor-move': {
					'0%': { top: '30%', left: '20%', opacity: '1' },
					'15%': { top: '30%', left: '20%', opacity: '1' },
					'25%': { top: '45%', left: '35%', opacity: '1' },
					'40%': { top: '45%', left: '35%', opacity: '1' },
					'50%': { top: '70%', left: '25%', opacity: '1' },
					'65%': { top: '70%', left: '25%', opacity: '1' },
					'75%': { top: '50%', left: '70%', opacity: '1' },
					'90%': { top: '50%', left: '70%', opacity: '1' },
					'100%': { top: '30%', left: '20%', opacity: '1' }
				},
				'type-text': {
					'0%': { width: '0%' },
					'100%': { width: '100%' }
				},
				'click-pulse': {
					'0%, 100%': { transform: 'scale(1)', opacity: '1' },
					'50%': { transform: 'scale(0.95)', opacity: '0.8' }
				},
				'card-slide': {
					'0%': { transform: 'translateY(20px)', opacity: '0' },
					'100%': { transform: 'translateY(0)', opacity: '1' }
				},
				'count-up': {
					'0%': { opacity: '0.5' },
					'50%': { opacity: '1' },
					'100%': { opacity: '0.5' }
				},
				'pdf-bounce': {
					'0%, 100%': { transform: 'translateY(0)' },
					'50%': { transform: 'translateY(-4px)' }
				},
				'fill-bar': {
					'0%': { width: '0%' },
					'100%': { width: '100%' }
				},
				'bar-grow': {
					'0%': { height: '0%', opacity: '0' },
					'100%': { height: 'var(--bar-height, 100%)', opacity: '1' }
				},
				'stagger-slide': {
					'0%': { transform: 'translateX(-20px)', opacity: '0' },
					'100%': { transform: 'translateX(0)', opacity: '1' }
				},
				'cursor-move-compare': {
					'0%': { top: '20%', left: '15%', opacity: '1' },
					'20%': { top: '45%', left: '20%', opacity: '1' },
					'40%': { top: '70%', left: '20%', opacity: '1' },
					'60%': { top: '30%', left: '65%', opacity: '1' },
					'80%': { top: '45%', left: '75%', opacity: '1' },
					'100%': { top: '20%', left: '15%', opacity: '1' }
				}
			},
			animation: {
				'accordion-down': 'accordion-down 0.2s ease-out',
				'accordion-up': 'accordion-up 0.2s ease-out',
				'pulse-button': 'pulse-button 0.75s infinite',
				'cursor-move': 'cursor-move 10s ease-in-out infinite',
				'type-text': 'type-text 2s ease-out forwards',
				'click-pulse': 'click-pulse 0.3s ease-in-out',
				'card-slide': 'card-slide 0.5s ease-out forwards',
				'count-up': 'count-up 2s ease-in-out infinite',
				'pdf-bounce': 'pdf-bounce 1s ease-in-out infinite',
				'fill-bar': 'fill-bar 3s ease-out infinite',
				'bar-grow': 'bar-grow 1s ease-out forwards',
				'stagger-slide': 'stagger-slide 0.5s ease-out forwards',
				'cursor-move-compare': 'cursor-move-compare 12s ease-in-out infinite'
			}
		}
	},
	plugins: [require("tailwindcss-animate")],
} satisfies Config;

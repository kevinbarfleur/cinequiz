import { defineConfig } from 'unocss'
import { presetUno } from 'unocss'
import presetTypography from '@unocss/preset-typography'
import presetIcons from '@unocss/preset-icons'

export default defineConfig({
  presets: [
    presetUno(),
    presetTypography(),
    presetIcons({
      collections: {
        carbon: () => import('@iconify-json/carbon/icons.json'),
        ph: () => import('@iconify-json/ph/icons.json'),
        logos: () => import('@iconify-json/logos/icons.json'),
      },
      extraProperties: {
        'display': 'inline-block',
        'vertical-align': 'middle',
        'color': 'currentColor', // Optimize for theme support
      },
      warn: true, // Warn about missing icons
    }),
  ],
  theme: {
    colors: {
      // Couleurs de marque basées sur les variables CSS
      'brand-1': 'var(--vp-c-brand-1)',
      'brand-2': 'var(--vp-c-brand-2)',
      'brand-3': 'var(--vp-c-brand-3)',
      'brand-next': 'var(--vp-c-brand-next)',
      
      // Arrière-plans
      'bg': 'var(--vp-c-bg)',
      'bg-alt': 'var(--vp-c-bg-alt)',
      'bg-soft': 'var(--vp-c-bg-soft)',
      'surface': 'var(--vp-c-bg-soft)', // Alias for surface
      
      // Texte
      'text-1': 'var(--vp-c-text-1)',
      'text-2': 'var(--vp-c-text-2)',
      'text-3': 'var(--vp-c-text-3)',
      
      // Bordures
      'divider': 'var(--vp-c-divider)',
      'border': 'var(--vp-c-border)',
      
      // Couleurs sémantiques
      'green-1': 'var(--vp-c-green-1)',
      'green-soft': 'var(--vp-c-green-soft)',
      'red-1': 'var(--vp-c-red-1)',
      'red-soft': 'var(--vp-c-red-soft)',
      'yellow-1': 'var(--vp-c-yellow-1)',
      'yellow-soft': 'var(--vp-c-yellow-soft)',
      'purple-1': 'var(--vp-c-purple-1)',
      'purple-soft': 'var(--vp-c-purple-soft)',
    },
    fontFamily: {
      sans: ['Inter', 'ui-sans-serif', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'sans-serif'],
      mono: ['ui-monospace', 'SFMono-Regular', 'Menlo', 'Monaco', 'Consolas', 'Liberation Mono', 'Courier New', 'monospace'],
    },
    fontSize: {
      'xs': ['0.75rem', { lineHeight: '1rem' }],      // 12px
      'sm': ['0.875rem', { lineHeight: '1.25rem' }],  // 14px
      'base': ['1rem', { lineHeight: '1.5rem' }],     // 16px
      'lg': ['1.125rem', { lineHeight: '1.75rem' }],  // 18px
      'xl': ['1.25rem', { lineHeight: '1.75rem' }],   // 20px
      '2xl': ['1.5rem', { lineHeight: '2rem' }],      // 24px
      '3xl': ['1.875rem', { lineHeight: '2.25rem' }], // 30px
      '4xl': ['2.25rem', { lineHeight: '2.5rem' }],   // 36px
      '5xl': ['3rem', { lineHeight: '1' }],           // 48px
      '6xl': ['3.75rem', { lineHeight: '1' }],        // 60px
    },
    spacing: {
      1: '0.5rem',   // 8px
      2: '1rem',     // 16px
      3: '1.5rem',   // 24px
      4: '2rem',     // 32px
      6: '3rem',     // 48px
      8: '4rem',     // 64px
      // Large sizes for glow effects
      80: '20rem',   // 320px
      96: '24rem',   // 384px
      120: '30rem',  // 480px
    },
    borderRadius: {
      sm: '0.5rem',   // 8px
      md: '0.75rem',  // 12px
      lg: '1rem',     // 16px
      xl: '1.5rem',   // 24px
    },
    boxShadow: {
      sm: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
      md: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
      lg: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
    },
    transitionDuration: {
      fast: '150ms',
      normal: '200ms',
      slow: '300ms',
      slower: '500ms',
    },
    transitionTimingFunction: {
      'ease-smooth': 'cubic-bezier(0.4, 0, 0.2, 1)',
      'ease-bounce': 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
      'ease-elastic': 'cubic-bezier(0.175, 0.885, 0.32, 1.275)',
    },
    // Utiliser les breakpoints standards UnoCSS
    screens: {
      'sm': '640px',
      'md': '768px', 
      'lg': '1024px',
      'xl': '1280px',
      '2xl': '1536px',
    },
    // Containers avec max-width responsive
    maxWidth: {
      'container-sm': '640px',
      'container-md': '768px',
      'container-lg': '1024px',
      'container-xl': '1280px',
      'container-2xl': '1536px',
    },
    // Z-index using CSS variables from theme.css
    zIndex: {
      'nav': 'var(--vp-z-index-nav, 20)',
      'sidebar': 'var(--vp-z-index-sidebar, 50)',
      'backdrop': 'var(--vp-z-index-backdrop, 40)',
      'layout-top': 'var(--vp-z-index-layout-top, 30)',
    },
  },
  shortcuts: {
    // Boutons harmonisés - Primary et Secondary avec transitions fluides
    'btn-base': 'font-semibold transition-all duration-300 ease inline-flex items-center justify-center cursor-pointer border-1 text-center select-none motion-reduce:transition-none',
    
    // Primary button - Uses rainbow animation for colors, no static background
    'btn-primary': 'btn-base text-white border-transparent hover:brightness-110 active:brightness-90 focus:ring-2 focus:ring-white/30 focus:ring-offset-2 shadow-sm hover:shadow-md',
    
    // Secondary buttons - Smooth transitions with brand integration
    'btn-secondary': 'btn-base bg-bg-soft text-text-1 border-transparent hover:bg-text-3 hover:text-white active:bg-text-2 focus:ring-2 focus:ring-text-3 focus:ring-offset-2 shadow-sm hover:shadow-md',
    
    // Map unused variants to secondary for compatibility
    'btn-ghost': 'btn-secondary',
    'btn-outline': 'btn-secondary',
    
    // Legacy aliases for compatibility
    'btn-brand': 'btn-primary',
    'btn-alt': 'btn-secondary',
    
    // Tailles de boutons responsive avec breakpoints standards
    'btn-sm': 'rounded-20px px-12 h-32px text-sm sm:px-16 sm:h-36px',
    'btn-md': 'rounded-20px px-20 h-38px text-sm sm:px-24 sm:h-42px md:text-base',
    'btn-lg': 'rounded-24px px-24 h-48px text-base sm:px-28 sm:h-52px md:text-lg',
    
    // Containers responsive avec max-width
    'container-responsive': 'w-full mx-auto px-4 sm:px-6 md:px-8',
    'container-sm': 'container-responsive max-w-container-sm',
    'container-md': 'container-responsive max-w-container-md',
    'container-lg': 'container-responsive max-w-container-lg',
    'container-xl': 'container-responsive max-w-container-xl',
    'container-2xl': 'container-responsive max-w-container-2xl',
    
    // Layout responsive amélioré
    'container-app': 'container-xl py-4 sm:py-6 md:py-8',
    'flex-center': 'flex items-center justify-center',
    'flex-between': 'flex items-center justify-between',
    'flex-col-mobile': 'flex flex-col sm:flex-row',
    'flex-row-mobile': 'flex flex-row sm:flex-col',
    
    // Grilles responsive avec breakpoints standards
    'grid-responsive': 'grid gap-4 sm:gap-6 md:gap-8',
    'grid-auto': 'grid-responsive grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4',
    'grid-cards': 'grid-responsive grid-cols-1 md:grid-cols-2 lg:grid-cols-3',
    'grid-sidebar': 'grid-responsive grid-cols-1 lg:grid-cols-4',
    
    // Espacement cohérent responsive
    'space-responsive': 'space-y-4 sm:space-y-6 md:space-y-8',
    'gap-responsive': 'gap-3 sm:gap-4 md:gap-6',
    'p-responsive': 'p-4 sm:p-6 md:p-8',
    'm-responsive': 'm-4 sm:m-6 md:m-8',
    
    // Cards avec nouvelles couleurs
    'card': 'bg-bg-soft rounded-lg shadow-md p-4 border border-divider',
    'card-hover': 'card hover:shadow-lg hover:border-brand-1 transition-all duration-200',
    'card-responsive': 'card p-responsive',
    
    // Button Groups - Simple Overflow Prevention
    'btn-group': 'flex flex-wrap gap-2 sm:gap-3',
    'btn-group-end': 'btn-group justify-end',
    'btn-group-center': 'btn-group justify-center',
    
    // Simple Modal Button - Always full width, no overflow
    'btn-modal': 'w-full max-w-full',
    
    // Typography avec nouvelles couleurs
    'text-heading': 'text-text-1 font-semibold',
    'text-body': 'text-text-1',
    'text-muted': 'text-text-2',
    'text-subtle': 'text-text-3',
    
    // Typography responsive améliorée avec breakpoints standards
    'heading-1': 'text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-text-1 leading-tight',
    'heading-2': 'text-2xl sm:text-3xl md:text-4xl font-semibold text-text-1 leading-tight',
    'heading-3': 'text-xl sm:text-2xl font-medium text-text-1 leading-snug',
    'heading-4': 'text-lg sm:text-xl font-medium text-text-1 leading-snug',
    'body-text': 'text-base sm:text-lg text-text-2 leading-relaxed',
    'body-sm': 'text-sm sm:text-base text-text-2 leading-normal',
    'small-text': 'text-xs sm:text-sm text-text-3 leading-normal',
    
    // Links avec underline-offset et transitions
    'link-base': 'font-medium text-brand-1 underline underline-offset-2 transition-colors duration-200',
    'link-hover': 'link-base hover:text-brand-2 hover:underline-offset-4',
    'link-subtle': 'text-text-2 hover:text-brand-1 transition-colors duration-200',
    
    // Code styling
    'code-inline': 'text-sm font-mono bg-bg-soft px-1 py-0.5 rounded-sm text-text-1 border border-divider',
    'code-block': 'font-mono bg-bg-soft p-4 rounded-lg border border-divider text-text-1 overflow-x-auto',
    
    // Rainbow animations - Blue dominant
    'rainbow-text': 'text-gradient-rainbow',
    'rainbow-bg': 'bg-gradient-rainbow',
    'rainbow-border': 'border-gradient-rainbow',
    
    // Feature cards avec transitions hover responsive
    'feature-card': 'block border-1 border-bg-soft rounded-xl h-full bg-bg-soft transition-colors duration-250 hover:border-brand-1',
    'feature-card-content': 'p-4 sm:p-6',
    'feature-card-header': 'flex items-center gap-2 sm:gap-3 mb-3 sm:mb-4',
    'feature-card-icon': 'text-xl sm:text-2xl text-brand-1',
    'feature-card-title': 'text-base sm:text-lg font-semibold text-text-1',
    'feature-card-description': 'text-sm sm:text-base text-text-2 leading-relaxed',

    // Global transition utilities with reduced motion support
    'transition-interactive': 'transition-all duration-200 ease-smooth motion-reduce:transition-none',
    'transition-smooth': 'transition-all duration-300 ease-smooth motion-reduce:transition-none',
    'transition-bounce': 'transition-all duration-300 ease-bounce motion-reduce:transition-none',
    'transition-elastic': 'transition-all duration-500 ease-elastic motion-reduce:transition-none',
    
    // Hover states avec élévation et couleur
    'hover-lift': 'hover:-translate-y-1 hover:shadow-lg transition-all duration-200 motion-reduce:transform-none',
    'hover-scale': 'hover:scale-105 transition-transform duration-200 motion-reduce:transform-none',
    'hover-glow': 'hover:shadow-lg hover:shadow-brand-1/25 transition-shadow duration-300',
    
    // Focus states avec ring et offset
    'focus-ring': 'focus:outline-none focus:ring-2 focus:ring-brand-1 focus:ring-offset-2 transition-all duration-150',
    'focus-ring-inset': 'focus:outline-none focus:ring-2 focus:ring-inset focus:ring-brand-1 transition-all duration-150',
    
    // Animation d'apparition pour les éléments
    'animate-fade-in': 'animate-fade-in-keyframes',
    'animate-slide-up': 'animate-slide-up-keyframes',
    'animate-slide-down': 'animate-slide-down-keyframes',
    'animate-scale-in': 'animate-scale-in-keyframes',
  },
  rules: [
    // Règles personnalisées pour les dégradés rainbow - Blue dominant
    [/^bg-gradient-rainbow$/, () => ({
      'background': 'linear-gradient(135deg, var(--vp-c-brand-1) 0%, var(--vp-c-brand-2) 40%, var(--vp-c-brand-3) 70%, var(--vp-c-brand-next) 100%)',
    })],
    [/^text-gradient-rainbow$/, () => ({
      'background': 'linear-gradient(90deg, var(--vp-c-brand-1) 0%, var(--vp-c-brand-2) 40%, var(--vp-c-brand-3) 70%, var(--vp-c-brand-next) 100%)',
      'background-clip': 'text',
      '-webkit-background-clip': 'text',
      '-webkit-text-fill-color': 'transparent',
    })],
    [/^border-gradient-rainbow$/, () => ({
      'border-image': 'linear-gradient(90deg, var(--vp-c-brand-1) 0%, var(--vp-c-brand-2) 40%, var(--vp-c-brand-3) 70%, var(--vp-c-brand-next) 100%) 1',
    })],
    
    // Blocs personnalisés (custom-block-info, tip, warning, danger)
    [/^custom-block-(.+)$/, ([, type]) => {
      const styles = {
        info: { 
          border: 'var(--vp-c-brand-1)', 
          bg: 'var(--vp-c-brand-soft, rgba(52, 81, 178, 0.14))', 
          text: 'var(--vp-c-text-1)' 
        },
        tip: { 
          border: 'var(--vp-c-green-1)', 
          bg: 'var(--vp-c-green-soft)', 
          text: 'var(--vp-c-green-1)' 
        },
        warning: { 
          border: 'var(--vp-c-yellow-1)', 
          bg: 'var(--vp-c-yellow-soft)', 
          text: 'var(--vp-c-yellow-1)' 
        },
        danger: { 
          border: 'var(--vp-c-red-1)', 
          bg: 'var(--vp-c-red-soft)', 
          text: 'var(--vp-c-red-1)' 
        }
      }
      const style = styles[type as keyof typeof styles]
      return style ? {
        'border-left': `4px solid ${style.border}`,
        'background-color': style.bg,
        'color': style.text,
        'padding': '16px',
        'border-radius': '8px',
        'margin': '16px 0'
      } : {}
    }],
  ],
})
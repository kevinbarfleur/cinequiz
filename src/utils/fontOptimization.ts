/**
 * Web Font Optimization Utilities
 * Optimizes font loading performance with preloading, font-display strategies,
 * and progressive enhancement
 */

export interface FontConfig {
  family: string
  variants: Array<{
    weight: string | number
    style?: string
    url?: string
  }>
  display?: 'auto' | 'block' | 'swap' | 'fallback' | 'optional'
  preload?: boolean
}

export class FontOptimizer {
  private fontsLoaded = new Set<string>()
  private fontLoadPromises = new Map<string, Promise<void>>()

  /**
   * Preload critical fonts for better performance
   */
  preloadFonts(fonts: FontConfig[]) {
    fonts.forEach(font => {
      if (font.preload) {
        font.variants.forEach(variant => {
          this.preloadFont(font.family, variant.weight, variant.style)
        })
      }
    })
  }

  /**
   * Preload a specific font variant
   */
  private preloadFont(family: string, weight: string | number, style: string = 'normal') {
    const fontId = `${family}-${weight}-${style}`
    
    if (this.fontsLoaded.has(fontId)) return

    // Create preload link
    const link = document.createElement('link')
    link.rel = 'preload'
    link.as = 'font'
    link.crossOrigin = 'anonymous'
    link.type = 'font/woff2'
    
    // Generate font URL for Inter from Google Fonts
    if (family.toLowerCase() === 'inter') {
      const weights = Array.isArray(weight) ? weight.join(',') : weight
      link.href = `https://fonts.gstatic.com/s/inter/v13/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuLyeMZhrib2Bg-4.woff2`
    }
    
    document.head.appendChild(link)
    this.fontsLoaded.add(fontId)
  }

  /**
   * Load fonts with optimal display strategy
   */
  async loadFonts(fonts: FontConfig[]): Promise<void[]> {
    const loadPromises = fonts.map(font => this.loadFont(font))
    return Promise.all(loadPromises)
  }

  /**
   * Load a specific font family
   */
  private async loadFont(font: FontConfig): Promise<void> {
    const fontId = font.family
    
    if (this.fontLoadPromises.has(fontId)) {
      return this.fontLoadPromises.get(fontId)!
    }

    const loadPromise = this.createFontLoadPromise(font)
    this.fontLoadPromises.set(fontId, loadPromise)
    
    return loadPromise
  }

  /**
   * Create a promise for font loading
   */
  private async createFontLoadPromise(font: FontConfig): Promise<void> {
    // Use CSS Font Loading API if available
    if ('fonts' in document) {
      const loadPromises = font.variants.map(variant => {
        const fontFace = new FontFace(
          font.family,
          `url(${this.getFontUrl(font.family, variant.weight, variant.style)})`,
          {
            weight: variant.weight.toString(),
            style: variant.style || 'normal',
            display: font.display || 'swap'
          }
        )

        document.fonts.add(fontFace)
        return fontFace.load()
      })

      await Promise.all(loadPromises)
    } else {
      // Fallback for older browsers
      await this.fallbackFontLoad(font)
    }
  }

  /**
   * Fallback font loading for older browsers
   */
  private async fallbackFontLoad(font: FontConfig): Promise<void> {
    return new Promise((resolve) => {
      const testString = 'abcdefghijklmnopqrstuvwxyz0123456789'
      const testSize = '48px'
      const fallbackFont = 'monospace'
      
      const canvas = document.createElement('canvas')
      const context = canvas.getContext('2d')!
      
      // Measure fallback font
      context.font = `${testSize} ${fallbackFont}`
      const fallbackWidth = context.measureText(testString).width
      
      // Function to check if font is loaded
      const checkFont = () => {
        context.font = `${testSize} ${font.family}, ${fallbackFont}`
        const currentWidth = context.measureText(testString).width
        
        if (currentWidth !== fallbackWidth) {
          resolve()
        } else {
          setTimeout(checkFont, 100)
        }
      }
      
      // Start checking
      setTimeout(checkFont, 100)
      
      // Timeout after 3 seconds
      setTimeout(() => resolve(), 3000)
    })
  }

  /**
   * Get optimized font URL
   */
  private getFontUrl(family: string, weight: string | number, style: string = 'normal'): string {
    if (family.toLowerCase() === 'inter') {
      // Use Google Fonts API with optimal parameters
      const weights = Array.isArray(weight) ? weight.join(',') : weight
      return `https://fonts.googleapis.com/css2?family=Inter:wght@${weights}&display=swap`
    }
    
    return ''
  }

  /**
   * Add font-display: swap to existing font faces
   */
  optimizeExistingFonts() {
    // Add CSS to optimize font loading
    const style = document.createElement('style')
    style.textContent = `
      @font-face {
        font-family: 'Inter';
        font-style: normal;
        font-weight: 400;
        font-display: swap;
        src: url(https://fonts.gstatic.com/s/inter/v13/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuLyeMZhrib2Bg-4.woff2) format('woff2');
        unicode-range: U+0000-00FF, U+0131, U+0152-0153, U+02BB-02BC, U+02C6, U+02DA, U+02DC, U+2000-206F, U+2074, U+20AC, U+2122, U+2191, U+2193, U+2212, U+2215, U+FEFF, U+FFFD;
      }
      
      @font-face {
        font-family: 'Inter';
        font-style: normal;
        font-weight: 500;
        font-display: swap;
        src: url(https://fonts.gstatic.com/s/inter/v13/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuI6fMZhrib2Bg-4.woff2) format('woff2');
        unicode-range: U+0000-00FF, U+0131, U+0152-0153, U+02BB-02BC, U+02C6, U+02DA, U+02DC, U+2000-206F, U+2074, U+20AC, U+2122, U+2191, U+2193, U+2212, U+2215, U+FEFF, U+FFFD;
      }
      
      @font-face {
        font-family: 'Inter';
        font-style: normal;
        font-weight: 600;
        font-display: swap;
        src: url(https://fonts.gstatic.com/s/inter/v13/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuGKYMZhrib2Bg-4.woff2) format('woff2');
        unicode-range: U+0000-00FF, U+0131, U+0152-0153, U+02BB-02BC, U+02C6, U+02DA, U+02DC, U+2000-206F, U+2074, U+20AC, U+2122, U+2191, U+2193, U+2212, U+2215, U+FEFF, U+FFFD;
      }
      
      @font-face {
        font-family: 'Inter';
        font-style: normal;
        font-weight: 700;
        font-display: swap;
        src: url(https://fonts.gstatic.com/s/inter/v13/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuFuYMZhrib2Bg-4.woff2) format('woff2');
        unicode-range: U+0000-00FF, U+0131, U+0152-0153, U+02BB-02BC, U+02C6, U+02DA, U+02DC, U+2000-206F, U+2074, U+20AC, U+2122, U+2191, U+2193, U+2212, U+2215, U+FEFF, U+FFFD;
      }
    `
    
    document.head.appendChild(style)
  }

  /**
   * Get font loading status
   */
  getFontLoadingStatus(): { loaded: number; total: number; fonts: string[] } {
    return {
      loaded: this.fontsLoaded.size,
      total: this.fontLoadPromises.size,
      fonts: Array.from(this.fontsLoaded)
    }
  }

  /**
   * Clear font loading cache
   */
  clearCache() {
    this.fontsLoaded.clear()
    this.fontLoadPromises.clear()
  }
}

// Default font configuration for the Quiz Cinema app
export const defaultFontConfig: FontConfig[] = [
  {
    family: 'Inter',
    variants: [
      { weight: 400 },
      { weight: 500 },
      { weight: 600 },
      { weight: 700 }
    ],
    display: 'swap',
    preload: true
  }
]

// Singleton instance
export const fontOptimizer = new FontOptimizer()

/**
 * Initialize font optimization
 */
export function initializeFontOptimization() {
  // Preload critical fonts immediately
  fontOptimizer.preloadFonts(defaultFontConfig)
  
  // Optimize existing fonts
  fontOptimizer.optimizeExistingFonts()
  
  // Load fonts asynchronously
  fontOptimizer.loadFonts(defaultFontConfig).catch(error => {
    console.warn('Font loading failed:', error)
  })
}

/**
 * Wait for fonts to be ready
 */
export async function waitForFontsReady(): Promise<void> {
  if ('fonts' in document) {
    await document.fonts.ready
  }
  
  return fontOptimizer.loadFonts(defaultFontConfig).then(() => {
    console.log('Fonts loaded successfully')
  })
} 
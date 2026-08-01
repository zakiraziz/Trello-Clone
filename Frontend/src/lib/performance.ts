// Performance utilities for the application

// Lazy load images
export function lazyLoadImage(img: HTMLImageElement, src: string) {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        img.src = src
        observer.unobserve(img)
      }
    })
  })
  observer.observe(img)
  return observer
}

// Debounce function for search and input handlers
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: number | null = null

  return (...args: Parameters<T>) => {
    if (timeout) clearTimeout(timeout)
    timeout = window.setTimeout(() => func(...args), wait)
  }
}

// Throttle function for scroll and resize handlers
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean = false

  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args)
      inThrottle = true
      window.setTimeout(() => inThrottle = false, limit)
    }
  }
}

// Preload critical resources
export function preloadResource(href: string, as: 'script' | 'style' | 'image' | 'font') {
  const link = document.createElement('link')
  link.rel = 'preload'
  link.href = href
  link.as = as
  document.head.appendChild(link)
}

// Prefetch resources for next likely navigation
export function prefetchResource(href: string) {
  const link = document.createElement('link')
  link.rel = 'prefetch'
  link.href = href
  document.head.appendChild(link)
}

// Measure performance
export function measurePerformance(name: string, fn: () => void) {
  if (process.env.NODE_ENV === 'development') {
    console.time(name)
    fn()
    console.timeEnd(name)
  } else {
    fn()
  }
}

// Cache API responses
const apiCache = new Map()

export function getCachedData(key: string) {
  const item = apiCache.get(key)
  if (item && Date.now() < item.expiry) {
    return item.data
  }
  apiCache.delete(key)
  return null
}

export function setCachedData(key: string, data: any, ttl: number = 60000) {
  apiCache.set(key, {
    data,
    expiry: Date.now() + ttl
  })
}

// Clear cache
export function clearCache() {
  apiCache.clear()
}

// Optimize images
export function optimizeImage(src: string, width: number, quality: number = 80): string {
  // For external images, you might use a CDN
  // For now, just return the original
  void width
  void quality
  return src
}

// Batch API requests
export async function batchRequests<T>(
  requests: (() => Promise<T>)[],
  batchSize: number = 5
): Promise<T[]> {
  const results: T[] = []
  
  for (let i = 0; i < requests.length; i += batchSize) {
    const batch = requests.slice(i, i + batchSize)
    const batchResults = await Promise.all(batch.map(req => req()))
    results.push(...batchResults)
  }
  
  return results
}

// Memory leak detection
export function detectMemoryLeaks() {
  if (process.env.NODE_ENV === 'development') {
    setInterval(() => {
      const usage = process.memoryUsage()
      console.log('Memory usage:', {
        heapUsed: `${Math.round(usage.heapUsed / 1024 / 1024)}MB`,
        heapTotal: `${Math.round(usage.heapTotal / 1024 / 1024)}MB`,
        rss: `${Math.round(usage.rss / 1024 / 1024)}MB`
      })
    }, 30000)
  }
}
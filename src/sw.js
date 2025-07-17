const CACHE_NAME = 'ctc-wallet-v2.0.0';
const API_CACHE = 'ctc-api-cache-v1';
const IMAGE_CACHE = 'ctc-image-cache-v1';

// Assets to cache immediately
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/styles.css',
  '/app.js',
  '/manifest.json',
  '/logo.png',
  'https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap'
];

// Cache strategies
const CACHE_STRATEGIES = {
  networkFirst: [
    /^https:\/\/api\.coingecko\.com/,
    /^https:\/\/rpc\.ctc\.network/
  ],
  cacheFirst: [
    /\.png$/,
    /\.jpg$/,
    /\.jpeg$/,
    /\.svg$/,
    /\.ico$/,
    /^https:\/\/fonts\.(googleapis|gstatic)\.com/
  ],
  staleWhileRevalidate: [
    /\.css$/,
    /\.js$/,
    /^https:\/\/cdnjs\.cloudflare\.com/
  ]
};

// Install Service Worker
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('[ServiceWorker] Pre-caching static assets');
        return cache.addAll(STATIC_ASSETS);
      })
      .then(() => self.skipWaiting())
      .catch(err => console.error('[ServiceWorker] Pre-cache failed:', err))
  );
});

// Activate Service Worker
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME && 
              cacheName !== API_CACHE && 
              cacheName !== IMAGE_CACHE &&
              cacheName.startsWith('ctc-')) {
            console.log('[ServiceWorker] Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
      console.log('[ServiceWorker] Claiming clients');
      return self.clients.claim();
    })
  );
});

// Fetch Event Handler
self.addEventListener('fetch', event => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== 'GET') return;

  // Handle different caching strategies
  if (isNetworkFirst(url)) {
    event.respondWith(networkFirst(request));
  } else if (isCacheFirst(url)) {
    event.respondWith(cacheFirst(request));
  } else if (isStaleWhileRevalidate(url)) {
    event.respondWith(staleWhileRevalidate(request));
  } else {
    // Default: Network first, fallback to cache
    event.respondWith(networkFirst(request));
  }
});

// Cache Strategy Functions
async function networkFirst(request) {
  const cache = await caches.open(getCacheName(request));
  
  try {
    const networkResponse = await fetch(request);
    
    if (networkResponse && networkResponse.ok) {
      // Clone the response before caching
      cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
  } catch (error) {
    console.log('[ServiceWorker] Network request failed, falling back to cache:', error);
    
    const cachedResponse = await cache.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }
    
    // If it's a navigation request, return the offline page
    if (request.mode === 'navigate') {
      return cache.match('/index.html');
    }
    
    // Return a custom offline response for API requests
    if (request.url.includes('api.coingecko.com')) {
      return new Response(
        JSON.stringify({ error: 'Offline', message: 'No cached data available' }),
        { headers: { 'Content-Type': 'application/json' } }
      );
    }
    
    throw error;
  }
}

async function cacheFirst(request) {
  const cache = await caches.open(getCacheName(request));
  const cachedResponse = await cache.match(request);
  
  if (cachedResponse) {
    // Refresh the cache in the background
    fetch(request).then(networkResponse => {
      if (networkResponse && networkResponse.ok) {
        cache.put(request, networkResponse);
      }
    });
    
    return cachedResponse;
  }
  
  const networkResponse = await fetch(request);
  
  if (networkResponse && networkResponse.ok) {
    cache.put(request, networkResponse.clone());
  }
  
  return networkResponse;
}

async function staleWhileRevalidate(request) {
  const cache = await caches.open(getCacheName(request));
  const cachedResponse = await cache.match(request);
  
  const fetchPromise = fetch(request).then(networkResponse => {
    if (networkResponse && networkResponse.ok) {
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  });
  
  return cachedResponse || fetchPromise;
}

// Helper Functions
function getCacheName(request) {
  const url = new URL(request.url);
  
  if (url.hostname.includes('coingecko.com') || url.hostname.includes('ctc.network')) {
    return API_CACHE;
  }
  
  if (/\.(png|jpg|jpeg|svg|ico|webp)$/.test(url.pathname)) {
    return IMAGE_CACHE;
  }
  
  return CACHE_NAME;
}

function isNetworkFirst(url) {
  return CACHE_STRATEGIES.networkFirst.some(pattern => pattern.test(url.href));
}

function isCacheFirst(url) {
  return CACHE_STRATEGIES.cacheFirst.some(pattern => pattern.test(url.href));
}

function isStaleWhileRevalidate(url) {
  return CACHE_STRATEGIES.staleWhileRevalidate.some(pattern => pattern.test(url.href));
}

// Background Sync for Transactions
self.addEventListener('sync', event => {
  if (event.tag === 'sync-transactions') {
    event.waitUntil(syncPendingTransactions());
  } else if (event.tag === 'sync-market-data') {
    event.waitUntil(syncMarketData());
  }
});

async function syncPendingTransactions() {
  console.log('[ServiceWorker] Syncing pending transactions');
  
  try {
    // Get all clients
    const clients = await self.clients.matchAll();
    
    // Request pending transactions from each client
    for (const client of clients) {
      client.postMessage({
        type: 'SYNC_TRANSACTIONS'
      });
    }
  } catch (error) {
    console.error('[ServiceWorker] Transaction sync failed:', error);
  }
}

async function syncMarketData() {
  console.log('[ServiceWorker] Syncing market data');
  
  try {
    // Fetch latest market data
    const response = await fetch(
      'https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=20&page=1&sparkline=true&price_change_percentage=24h'
    );
    
    if (response.ok) {
      const data = await response.json();
      
      // Cache the response
      const cache = await caches.open(API_CACHE);
      await cache.put(
        new Request('https://api.coingecko.com/api/v3/coins/markets'),
        new Response(JSON.stringify(data), {
          headers: { 'Content-Type': 'application/json' }
        })
      );
      
      // Notify all clients
      const clients = await self.clients.matchAll();
      clients.forEach(client => {
        client.postMessage({
          type: 'MARKET_DATA_UPDATED',
          data: data
        });
      });
    }
  } catch (error) {
    console.error('[ServiceWorker] Market data sync failed:', error);
  }
}

// Push Notifications
self.addEventListener('push', event => {
  const options = {
    body: event.data ? event.data.text() : 'New notification from CTC Wallet',
    icon: '/icon-192.png',
    badge: '/icon-192.png',
    vibrate: [200, 100, 200],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: 1
    },
    actions: [
      {
        action: 'view',
        title: 'View',
        icon: '/icons/view.png'
      },
      {
        action: 'close',
        title: 'Close',
        icon: '/icons/close.png'
      }
    ],
    tag: 'ctc-wallet-notification',
    renotify: true
  };

  event.waitUntil(
    self.registration.showNotification('CTC Wallet', options)
  );
});

// Notification Click Handler
self.addEventListener('notificationclick', event => {
  event.notification.close();

  if (event.action === 'view') {
    event.waitUntil(
      clients.openWindow('/transactions')
    );
  } else {
    event.waitUntil(
      clients.openWindow('/')
    );
  }
});

// Periodic Background Sync for Price Updates
self.addEventListener('periodicsync', event => {
  if (event.tag === 'update-prices') {
    event.waitUntil(updatePrices());
  }
});

async function updatePrices() {
  console.log('[ServiceWorker] Periodic price update');
  
  try {
    const response = await fetch(
      'https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,ethereum,tether&vs_currencies=usd&include_24hr_change=true'
    );
    
    if (response.ok) {
      const prices = await response.json();
      
      // Update cache
      const cache = await caches.open(API_CACHE);
      await cache.put(
        new Request('https://api.coingecko.com/api/v3/simple/price'),
        new Response(JSON.stringify(prices), {
          headers: { 'Content-Type': 'application/json' }
        })
      );
      
      // Send message to all clients
      const clients = await self.clients.matchAll();
      clients.forEach(client => {
        client.postMessage({
          type: 'PRICE_UPDATE',
          data: prices
        });
      });
    }
  } catch (error) {
    console.error('[ServiceWorker] Failed to update prices:', error);
  }
}

// Message handler for client communication
self.addEventListener('message', event => {
  console.log('[ServiceWorker] Message received:', event.data);
  
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  } else if (event.data && event.data.type === 'CACHE_URLS') {
    event.waitUntil(
      cacheUrls(event.data.urls)
    );
  } else if (event.data && event.data.type === 'CLEAR_CACHE') {
    event.waitUntil(
      clearCache(event.data.cacheName)
    );
  }
});

async function cacheUrls(urls) {
  const cache = await caches.open(CACHE_NAME);
  return cache.addAll(urls);
}

async function clearCache(cacheName) {
  if (cacheName) {
    return caches.delete(cacheName);
  } else {
    // Clear all caches
    const cacheNames = await caches.keys();
    return Promise.all(
      cacheNames.map(name => caches.delete(name))
    );
  }
}

// Error tracking
self.addEventListener('error', event => {
  console.error('[ServiceWorker] Error:', event.error);
});

self.addEventListener('unhandledrejection', event => {
  console.error('[ServiceWorker] Unhandled rejection:', event.reason);
});

// Log service worker version
console.log('[ServiceWorker] Version:', CACHE_NAME);

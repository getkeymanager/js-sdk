/**
 * Cache Manager
 * 
 * Handles caching of API responses to reduce redundant requests.
 * 
 * @module Cache/CacheManager
 */

/**
 * Cache Manager class
 */
class CacheManager {
    /**
     * Initialize cache manager
     * 
     * @param {boolean} [enabled=true] - Whether caching is enabled
     * @param {number} [ttl=300] - Cache TTL in seconds
     */
    constructor(enabled = true, ttl = 300) {
        this._cache = new Map();
        this._enabled = enabled;
        this._ttl = ttl;
    }

    /**
     * Get cached value
     * 
     * @param {string} key - Cache key
     * @returns {Object|null} Cached data or null if not found/expired
     */
    get(key) {
        if (!this._enabled || !this._cache.has(key)) {
            return null;
        }

        const cached = this._cache.get(key);
        if (cached.expiresAt < Date.now()) {
            this._cache.delete(key);
            return null;
        }

        return cached.data;
    }

    /**
     * Set cache value
     * 
     * @param {string} key - Cache key
     * @param {Object} data - Data to cache
     * @param {number|null} [ttl=null] - Optional custom TTL in seconds
     */
    set(key, data, ttl = null) {
        if (!this._enabled) {
            return;
        }

        const ttlMs = (ttl !== null ? ttl : this._ttl) * 1000;
        this._cache.set(key, {
            data: data,
            expiresAt: Date.now() + ttlMs
        });
    }

    /**
     * Clear specific cache key
     * 
     * @param {string} key - Cache key
     */
    delete(key) {
        this._cache.delete(key);
    }

    /**
     * Clear all cache matching a pattern
     * 
     * @param {string} pattern - Pattern to match (supports wildcards with *)
     */
    clearPattern(pattern) {
        const regex = new RegExp('^' + pattern.replace(/\*/g, '.*') + '$');
        for (const key of this._cache.keys()) {
            if (regex.test(key)) {
                this._cache.delete(key);
            }
        }
    }

    /**
     * Clear all cached data
     */
    clear() {
        this._cache.clear();
    }

    /**
     * Get cache statistics
     * 
     * @returns {Object} Cache statistics
     */
    getStats() {
        let valid = 0;
        let expired = 0;
        const now = Date.now();

        for (const cached of this._cache.values()) {
            if (cached.expiresAt < now) {
                expired++;
            } else {
                valid++;
            }
        }

        return {
            total: this._cache.size,
            valid,
            expired,
            enabled: this._enabled
        };
    }

    /**
     * Generate cache key
     * 
     * @param {...string} parts - Key parts to concatenate
     * @returns {string} Cache key
     */
    static generateKey(...parts) {
        return parts.filter(p => p !== null && p !== undefined).join(':');
    }
}

module.exports = CacheManager;

const DEFAULT_LOCATION = {
  country: 'PH',
  currency: 'PHP',
  source: 'default',
}

async function fetchGeoIpFallback(timeoutMs = 3000) {
  const controller = new AbortController()
  const timeoutId = window.setTimeout(() => controller.abort(), timeoutMs)

  try {
    const response = await fetch('https://ipapi.co/json/', {
      method: 'GET',
      headers: { Accept: 'application/json' },
      signal: controller.signal,
    })

    if (!response.ok) throw new Error(`GeoIP response status: ${response.status}`)
    const data = await response.json()

    if (data && data.country_code) {
      return {
        country: data.country_code,
        currency: data.currency || 'PHP',
        city: data.city || null,
        source: 'geoip',
      }
    }
    throw new Error('Invalid GeoIP payload')
  } catch (error) {
    console.warn('GeoIP fallback fetch failed or blocked by CORS:', error?.message || error)
    return null
  } finally {
    window.clearTimeout(timeoutId)
  }
}

function getBrowserGeolocation(timeoutMs = 4000) {
  return new Promise((resolve) => {
    if (!navigator.geolocation) {
      resolve(null)
      return
    }

    let resolved = false
    const timer = window.setTimeout(() => {
      if (!resolved) {
        resolved = true
        resolve(null)
      }
    }, timeoutMs)

    navigator.geolocation.getCurrentPosition(
      (position) => {
        if (!resolved) {
          resolved = true
          window.clearTimeout(timer)
          resolve({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            source: 'browser',
          })
        }
      },
      (error) => {
        if (!resolved) {
          resolved = true
          window.clearTimeout(timer)
          console.warn('Browser geolocation denied or unavailable:', error?.message || error)
          resolve(null)
        }
      },
      { timeout: timeoutMs, maximumAge: 60000, enableHighAccuracy: false }
    )
  })
}

export async function detectLocationAndSync(syncCallback) {
  let location = { ...DEFAULT_LOCATION }

  try {
    const browserLoc = await getBrowserGeolocation(3000)
    if (browserLoc) {
      location = { ...location, ...browserLoc }
    } else {
      const geoIpLoc = await fetchGeoIpFallback(3000)
      if (geoIpLoc) {
        location = { ...location, ...geoIpLoc }
      }
    }
  } catch (error) {
    console.warn('Location detection error caught safely:', error)
    location = { ...DEFAULT_LOCATION }
  } finally {
    if (typeof syncCallback === 'function') {
      try {
        await syncCallback(location)
      } catch (syncError) {
        console.error('Sync function error:', syncError)
      }
    }
  }

  return location
}

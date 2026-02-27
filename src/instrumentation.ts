export async function register() {
  // Only run on the server
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    await loadConfigFromOSC()
  }
}

async function loadConfigFromOSC() {
  // Skip if DATABASE_URL is already set
  if (process.env.DATABASE_URL) {
    console.log('[instrumentation] DATABASE_URL already set, skipping config fetch')
    return
  }

  // Prefer explicit config service URL injected by the platform.
  const explicitConfigServiceUrl =
    process.env.APP_CONFIG_URL ||
    process.env.CONFIG_SERVICE_URL ||
    process.env.CONFIG_SERVICE ||
    process.env.ConfigService

  // Derive tenant prefix from APP_URL when available, e.g.
  // https://ebba-openevents.eyevinn-web-runner... -> "ebba"
  const tenantPrefix = (() => {
    const appUrl = process.env.APP_URL
    if (!appUrl) return null
    try {
      const hostname = new URL(appUrl).hostname
      const firstLabel = hostname.split('.')[0] || ''
      const dashIndex = firstLabel.indexOf('-')
      if (dashIndex <= 0) return null
      return firstLabel.slice(0, dashIndex)
    } catch {
      return null
    }
  })()

  // Backward-compatible fallback when explicit URL is not provided.
  const configServiceName = process.env.CONFIG_SERVICE_NAME || 'openeventsconfig'
  const configServiceUrl = explicitConfigServiceUrl
    ? explicitConfigServiceUrl.replace(/\/$/, '')
    : tenantPrefix
      ? `https://${tenantPrefix}-${configServiceName}.eyevinn-app-config-svc.auto.prod.osaas.io`
      : `https://team2-${configServiceName}.eyevinn-app-config-svc.auto.prod.osaas.io`

  console.log(`[instrumentation] Fetching config from ${configServiceUrl}`)

  try {
    const response = await fetch(`${configServiceUrl}/api/v1/config`, {
      headers: {
        'Content-Type': 'application/json',
      },
    })

    if (!response.ok) {
      console.error(`[instrumentation] Failed to fetch config: ${response.status}`)
      return
    }

    const data = await response.json()

    if (data.items && Array.isArray(data.items)) {
      for (const item of data.items) {
        if (item.key && item.value && !process.env[item.key]) {
          process.env[item.key] = item.value
          console.log(`[instrumentation] Set ${item.key}`)
        }
      }
    }

    console.log('[instrumentation] Config loaded successfully')
  } catch (error) {
    console.error('[instrumentation] Error loading config:', error)
  }
}

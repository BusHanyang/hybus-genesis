module.exports = {
  ci: {
    collect: {
      staticDistDir: './dist',
      url: 'http://localhost/index.html',
      numberOfRuns: 5,
      settings: {
        throttling: {
          // South Korea average rtt: 32.66ms (2022)
          // Average Download: 151.92Mbps (2022)
          rttMs: 70, // Slow down x2
          throughputKbps: 50 * 1024, // Slow down x3
          cpuSlowdownMultiplier: 1,
        },
        skipAudits: [
          'redirects-http',
          'is-on-https',
          'works-offline',
          'bf-cache',
          'csp-xss',
          'uses-rel-preconnect',
          'color-contrast',
          'unused-css-rules',
          'unused-javascript',
          'third-party-cookies',
          'dobetterweb/inspector-issues',
        ],
      },
    },
    upload: {
      target: 'lhci',
      serverBaseUrl: 'https://lighthouse.hybus.app',
      token: process.env.LHCI_TOKEN,
      githubAppToken: process.env.LHCI_GITHUB_APP_TOKEN,
      basicAuth: {
        username: process.env.LHCI_USERNAME,
        password: process.env.LHCI_PASSWORD,
      },
    },
    assert: {
      assertions: {
        'categories:performance': ['warn', { minScore: 0.9 }],
        'categories:accessibility': ['warn', { minScore: 0.9 }],
        'categories:best-practices': ['error', { minScore: 0.9 }],
        'categories:seo': ['error', { minScore: 0.9 }],
      },
    },
  },
}

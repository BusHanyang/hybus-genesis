module.exports = {
  ci: {
    collect: {
      staticDistDir: './dist',
      numberOfRuns: 5,
      settings: {
        skipAudits: [
          'redirects-http',
          'is-on-https',
          'works-offline',
          'bf-cache',
        ],
      },
    },
    upload: {
      target: 'lhci',
      serverBaseUrl: 'https://lighthouse.hybus.app',
      token: process.env.LHCI_TOKEN,
      basicAuth: {
        username: process.env.LHCI_USERNAME,
        password: process.env.LHCI_PASSWORD,
      },
    },
    assert: {
      preset: 'lighthouse:no-pwa',
      assertions: {
        'categories:performance': ['warn', { minScore: 0.9 }],
        'categories:accessibility': ['error', { minScore: 0.9 }],
        'categories:best-practices': ['error', { minScore: 0.95 }],
        'categories:seo': ['error', { minScore: 0.9 }],
      },
    },
  },
}

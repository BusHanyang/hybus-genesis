import assert from 'node:assert/strict'
import test from 'node:test'

import {
  CROWDING_PREVIEW_ORIGIN as origin,
  getCrowdingApiBase,
  isCrowdingFieldTestOrigin,
} from './crowdingEndpoints.ts'
import { proxyCrowdingRequest } from './crowdingProxy.ts'

const request = (path, options = {}) =>
  new Request(`${origin}/v1/crowding/${path}`, options)

test('production defaults stay unchanged and Preview requests stay same-origin', () => {
  const production = 'https://api.hybus.app/v1/crowding'
  assert.equal(getCrowdingApiBase(), production)
  assert.equal(getCrowdingApiBase('https://hybus.app'), production)
  assert.equal(
    getCrowdingApiBase('https://hybus-genesis.pages.dev'),
    production,
  )
  assert.equal(getCrowdingApiBase(origin), `${origin}/v1/crowding`)
  const hashOrigin = 'https://6726116a.hybus-genesis.pages.dev'
  assert.equal(getCrowdingApiBase(hashOrigin), `${hashOrigin}/v1/crowding`)
  assert.equal(
    getCrowdingApiBase('https://fake-hybus-genesis.pages.dev'),
    production,
  )
})

test('field diagnostics allow only canonical development Preview and loopback', () => {
  assert.equal(isCrowdingFieldTestOrigin(origin), true)
  for (const local of [
    'http://localhost:5173',
    'http://127.0.0.1:4173',
    'http://[::1]:5173',
  ]) {
    assert.equal(isCrowdingFieldTestOrigin(local), true)
    assert.equal(getCrowdingApiBase(local), `${local}/v1/crowding`)
  }
  for (const excluded of [
    'https://hybus.app',
    'https://hybus-genesis.pages.dev',
    'https://other.hybus-genesis.pages.dev',
    `${origin}.example.com`,
    'https://localhost.example.com',
    'file://localhost',
    'invalid',
  ]) {
    assert.equal(isCrowdingFieldTestOrigin(excluded), false)
  }
})

test('proxy preserves POST body, Cookie and response Set-Cookie', async () => {
  const body = JSON.stringify({ schemaVersion: 1, stopId: 'shuttlecoke_o' })
  const cookie = 'crowding_session=existing-signed-session'
  const upstream = new Response('{"accepted":true}', {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
      'Set-Cookie':
        'crowding_session=new-session; Path=/v1/crowding; Secure; HttpOnly; SameSite=Lax',
      'Cache-Control': 'no-store',
    },
  })
  let forwarded
  const response = await proxyCrowdingRequest(
    request('presence', {
      method: 'POST',
      headers: {
        Origin: origin,
        Cookie: cookie,
        'Content-Type': 'application/json',
      },
      body,
    }),
    {
      fetch: async (value) => {
        forwarded = value
        return upstream
      },
    },
  )
  assert.equal(response, upstream)
  assert.equal(forwarded.url, `${origin}/v1/crowding/presence`)
  assert.equal(forwarded.headers.get('Cookie'), cookie)
  assert.equal(forwarded.headers.get('Origin'), origin)
  assert.equal(forwarded.redirect, 'manual')
  assert.equal(await forwarded.text(), body)
  assert.equal(
    response.headers.get('Set-Cookie'),
    upstream.headers.get('Set-Cookie'),
  )
})

test('same-origin GET gains an Origin without changing repeated query values', async () => {
  const path =
    'aggregates?stopId=shuttlecoke_o&scheduledTripId=first%7Ctrip&scheduledTripId=second%7Ctrip'
  let forwarded
  await proxyCrowdingRequest(request(path), {
    fetch: async (value) => {
      forwarded = value
      return Response.json({ aggregates: [] })
    },
  })
  assert.equal(forwarded.url, `${origin}/v1/crowding/${path}`)
  assert.equal(forwarded.headers.get('Origin'), origin)
  assert.deepEqual(
    new URL(forwarded.url).searchParams.getAll('scheduledTripId'),
    ['first|trip', 'second|trip'],
  )
})

test('rate-limit status, Retry-After and response body pass through intact', async () => {
  const response = await proxyCrowdingRequest(
    request('presence', {
      method: 'POST',
      headers: { Origin: origin },
      body: '{}',
    }),
    {
      fetch: async () =>
        new Response('rate limited', {
          status: 429,
          headers: {
            'Retry-After': '15',
            'Access-Control-Expose-Headers': 'Retry-After',
          },
        }),
    },
  )
  assert.equal(response.status, 429)
  assert.equal(response.headers.get('Retry-After'), '15')
  assert.equal(
    response.headers.get('Access-Control-Expose-Headers'),
    'Retry-After',
  )
  assert.equal(await response.text(), 'rate limited')
})

test('unsupported origins, paths and methods cannot invoke the binding', async () => {
  let calls = 0
  const service = {
    fetch: async () => {
      calls++
      return new Response()
    },
  }
  const denied = [
    [
      new Request('https://hybus.app/v1/crowding/presence', {
        method: 'POST',
        body: '{}',
      }),
      403,
    ],
    [
      new Request(
        'https://6726116a.hybus-genesis.pages.dev/v1/crowding/aggregates',
      ),
      403,
    ],
    [
      new Request(
        'https://other-branch.hybus-genesis.pages.dev/v1/crowding/aggregates',
      ),
      403,
    ],
    [request('presence', { method: 'POST', body: '{}' }), 403],
    [
      request('presence', {
        method: 'POST',
        headers: { Origin: 'null' },
        body: '{}',
      }),
      403,
    ],
    [
      request('presence', {
        method: 'POST',
        headers: { Origin: 'https://outside.example' },
        body: '{}',
      }),
      403,
    ],
    [
      request('aggregates', { headers: { Origin: 'https://outside.example' } }),
      403,
    ],
    [request('presence', { method: 'OPTIONS' }), 403],
    [request('unknown'), 404],
    [
      request('presence/extra', {
        method: 'POST',
        headers: { Origin: origin },
        body: '{}',
      }),
      404,
    ],
    [
      request('aggregates', { method: 'DELETE', headers: { Origin: origin } }),
      405,
    ],
  ]
  for (const [input, status] of denied) {
    const response = await proxyCrowdingRequest(input, service)
    assert.equal(response.status, status)
    assert.equal(response.headers.get('Cache-Control'), 'no-store')
  }
  assert.equal(calls, 0)
})

test('missing service, thrown fetch and redirects fail closed', async () => {
  const missing = await proxyCrowdingRequest(request('health'))
  assert.equal(missing.status, 503)
  assert.equal(
    (await missing.json()).error.code,
    'development_api_not_configured',
  )
  const unavailable = await proxyCrowdingRequest(request('health'), {
    fetch: async () => {
      throw new Error('not available')
    },
  })
  assert.equal(unavailable.status, 502)
  const redirect = await proxyCrowdingRequest(request('health'), {
    fetch: async () =>
      Response.redirect('https://api.hybus.app/v1/crowding/health'),
  })
  assert.equal(redirect.status, 502)
  assert.equal(redirect.headers.get('Location'), null)
})

import {
  type CrowdingService,
  proxyCrowdingRequest,
} from '../../../src/app/network/crowdingProxy'

type CrowdingContext = {
  request: Request
  env: { CROWDING_API?: CrowdingService }
}

export const onRequest = ({ request, env }: CrowdingContext) =>
  proxyCrowdingRequest(request, env.CROWDING_API)

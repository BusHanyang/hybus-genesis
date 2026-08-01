export const OPTICAL_LENS_FLARE_VERTEX_SHADER = `#version 300 es
precision highp float;

void main() {
  vec2 position = vec2(
    float((gl_VertexID << 1) & 2),
    float(gl_VertexID & 2)
  );
  gl_Position = vec4(position * 2.0 - 1.0, 0.0, 1.0);
}
`

export const OPTICAL_LENS_FLARE_FRAGMENT_SHADER = `#version 300 es
precision highp float;

out vec4 outputColor;

uniform vec2 uResolution;
uniform float uTime;
uniform float uIntensity;
uniform vec2 uSource;
uniform vec2 uOpticalCenter;
uniform vec3 uCoreColor;
uniform vec3 uHaloColor;
uniform vec3 uRayColor;
uniform vec3 uStreakColor;
uniform vec3 uGhostColorA;
uniform vec3 uGhostColorB;
uniform vec4 uSourceStyle;
uniform vec4 uRayStyle;
uniform float uRayAngle;
uniform vec4 uStreakStyle;
uniform vec4 uGhostStyle;
uniform vec4 uGhostAppearance;
uniform float uGhostRingIntensity;

const float TAU = 6.283185307179586;
const int MAX_GHOSTS = 10;
uniform vec4 uGhostData[MAX_GHOSTS];

float gaussian(float distanceValue, float radius) {
  float safeRadius = max(radius, 0.0001);
  float normalized = distanceValue / safeRadius;
  return exp(-0.5 * normalized * normalized);
}

vec2 rotate2d(vec2 point, float angle) {
  float cosine = cos(angle);
  float sine = sin(angle);
  return mat2(cosine, -sine, sine, cosine) * point;
}

float polygonField(vec2 point, float sides, float rotation) {
  float safeSides = max(sides, 3.0);
  float sector = TAU / safeSides;
  float angle = atan(point.y, point.x) + rotation;
  return cos(floor(0.5 + angle / sector) * sector - angle) * length(point);
}

float apertureField(
  vec2 point,
  float sides,
  float roundness,
  float rotation
) {
  float polygon = polygonField(point, sides, rotation);
  return mix(polygon, length(point), clamp(roundness, 0.0, 1.0));
}

float softFill(float field, float radius, float softness) {
  return 1.0 - smoothstep(
    radius - softness,
    radius + softness,
    field
  );
}

float axisBeam(
  vec2 point,
  vec2 direction,
  float lengthValue,
  float widthValue
) {
  vec2 normal = vec2(-direction.y, direction.x);
  float forward = dot(point, direction);
  float sideways = abs(dot(point, normal));
  float forwardMask = smoothstep(-0.02, 0.04, forward);
  float endFade = exp(-max(forward, 0.0) / max(lengthValue, 0.001));
  float sideFade = exp(-pow(sideways / max(widthValue, 0.001), 1.35));
  return forwardMask * endFade * sideFade;
}

void main() {
  vec2 screenUv = vec2(
    gl_FragCoord.x / uResolution.x,
    1.0 - gl_FragCoord.y / uResolution.y
  );
  float minimumDimension = max(min(uResolution.x, uResolution.y), 1.0);
  vec2 aspectScale = uResolution / minimumDimension;
  vec2 point = (screenUv - uSource) * aspectScale;
  vec2 axis = (uOpticalCenter - uSource) * aspectScale;
  float axisLength = max(length(axis), 0.0001);
  vec2 axisDirection = axis / axisLength;
  float sourceDistance = length(point);

  float coreRadius = uSourceStyle.x;
  float coreIntensity = uSourceStyle.y;
  float haloRadius = uSourceStyle.z;
  float haloIntensity = uSourceStyle.w;

  float hotCore = gaussian(sourceDistance, coreRadius * 0.17);
  float brightCore = gaussian(sourceDistance, coreRadius * 0.56);
  float coreBloom = gaussian(sourceDistance, coreRadius * 1.8);
  float wideHalo = gaussian(sourceDistance, haloRadius);
  float haloRing = gaussian(abs(sourceDistance - haloRadius * 0.74), haloRadius * 0.11);

  vec3 color = vec3(0.0);
  color += vec3(1.0) * hotCore * coreIntensity * 1.72;
  color += uCoreColor * brightCore * coreIntensity * 1.08;
  color += mix(uCoreColor, uHaloColor, 0.58) * coreBloom * coreIntensity * 0.22;
  color += uHaloColor * wideHalo * haloIntensity;
  color += uHaloColor * haloRing * haloIntensity * 0.12;

  float rayLength = uRayStyle.x;
  float rayIntensity = uRayStyle.y;
  float rayCount = max(uRayStyle.z, 2.0);
  float raySoftness = clamp(uRayStyle.w, 0.0, 1.0);
  float rayAngle = atan(point.y, point.x) + uRayAngle;
  float sharpness = mix(76.0, 18.0, raySoftness);
  float sharpLobes = pow(abs(cos(rayAngle * rayCount * 0.5)), sharpness);
  float softLobes = pow(abs(cos(rayAngle * rayCount * 0.5)), 6.0);
  float rayFalloff = exp(-sourceDistance / max(rayLength, 0.001));
  rayFalloff /= 1.0 + sourceDistance * 4.8;
  float starRays = (sharpLobes + softLobes * 0.13) * rayFalloff;
  float directedRayAbove = axisBeam(
    point,
    rotate2d(axisDirection, 0.058),
    rayLength * 1.18,
    mix(0.042, 0.086, raySoftness)
  );
  float directedRayBelow = axisBeam(
    point,
    rotate2d(axisDirection, -0.046),
    rayLength * 1.26,
    mix(0.038, 0.078, raySoftness)
  );
  float directedRay = directedRayAbove * 0.64 + directedRayBelow * 0.36;
  color += uRayColor * starRays * rayIntensity;
  color += mix(uRayColor, uHaloColor, 0.38) * directedRay * rayIntensity * 0.18;

  vec2 streakPoint = rotate2d(point, uStreakStyle.w);
  float streakLength = max(uStreakStyle.x, 0.001);
  float streakWidth = max(uStreakStyle.y, 0.0005);
  float streakIntensity = uStreakStyle.z;
  float streakHorizontal = exp(
    -pow(abs(streakPoint.x) / streakLength, 0.72) * 1.42
  );
  float streakCore = exp(-pow(abs(streakPoint.y) / streakWidth, 1.35));
  float streakBloom = exp(
    -pow(abs(streakPoint.y) / (streakWidth * 5.8), 1.65)
  );
  float streak = streakHorizontal * (streakCore + streakBloom * 0.22);
  color += uStreakColor * streak * streakIntensity;

  float ghostCount = clamp(uGhostStyle.x, 0.0, float(MAX_GHOSTS));
  float ghostSpread = uGhostStyle.y;
  float ghostScale = uGhostStyle.z;
  float ghostIntensity = uGhostStyle.w;
  float apertureSides = uGhostAppearance.x;
  float chromaAmount = uGhostAppearance.y;
  float edgeSoftness = uGhostAppearance.z;
  float breatheAmount = uGhostAppearance.w;

  for (int index = 0; index < MAX_GHOSTS; index += 1) {
    if (float(index) >= ghostCount) {
      break;
    }

    vec4 descriptor = uGhostData[index];
    float axisPosition = descriptor.x * ghostSpread;
    float pulse = 1.0 + breatheAmount * sin(uTime * 0.71 + float(index) * 1.19);
    float radius = descriptor.y * ghostScale * pulse;
    float localIntensity = descriptor.z * ghostIntensity;
    float roundness = descriptor.w;
    vec2 ghostCenter = axis * axisPosition;
    vec2 ghostPoint = point - ghostCenter;
    float opticalSeed = fract(
      sin(descriptor.x * 91.73 + float(index) * 17.17) * 43758.5453
    );
    float rotation =
      0.23 + sin(float(index) * 2.13 + descriptor.x * 1.7) * 0.052;
    float softnessVariation = mix(0.72, 1.46, opticalSeed);
    float softness = max(
      edgeSoftness * radius * softnessVariation,
      0.00055
    );
    vec2 chromaOffset = axisDirection * radius * chromaAmount;

    float field = apertureField(
      ghostPoint,
      apertureSides,
      roundness,
      rotation
    );
    float outer = softFill(field, radius, softness);
    float inner = softFill(field, radius * 0.72, softness * 1.25);
    float rim = max(outer - inner, 0.0);
    float apertureBand = gaussian(
      abs(field - radius * 0.88),
      radius * 0.055
    ) * outer;
    float veil = outer * 0.025;
    float outside = max(field - radius, 0.0);
    float ghostGlow = gaussian(outside, radius * 0.28) * (1.0 - inner * 0.78);
    float reflectionRingSelector = smoothstep(0.72, 0.94, roundness);
    float reflectionRingRadius = radius * mix(0.46, 0.62, opticalSeed);
    float reflectionRing = gaussian(
      abs(length(ghostPoint) - reflectionRingRadius),
      max(radius * mix(0.022, 0.041, opticalSeed), softness * 0.72)
    ) * outer;
    float reflectionEcho = gaussian(
      abs(length(ghostPoint) - radius * 0.82),
      max(radius * 0.027, softness * 0.82)
    ) * outer;
    float outerReflection = gaussian(
      abs(length(ghostPoint) - radius * 1.12),
      max(radius * 0.035, softness)
    );

    float redField = apertureField(
      ghostPoint + chromaOffset,
      apertureSides,
      roundness,
      rotation
    );
    float blueField = apertureField(
      ghostPoint - chromaOffset,
      apertureSides,
      roundness,
      rotation
    );
    float redRim = max(
      softFill(redField, radius, softness) -
        softFill(redField, radius * 0.72, softness * 1.25),
      0.0
    );
    float blueRim = max(
      softFill(blueField, radius, softness) -
        softFill(blueField, radius * 0.72, softness * 1.25),
      0.0
    );

    float colorPhase = fract(opticalSeed * 1.73 + descriptor.x * 0.61);
    vec3 ghostTint = mix(uGhostColorA, uGhostColorB, colorPhase);
    vec3 spectralRim = vec3(redRim, rim * 0.82, blueRim);
    float reflectionEnergy =
      (reflectionRing * 0.34 +
        reflectionEcho * 0.2 +
        outerReflection * 0.085) *
      reflectionRingSelector *
      uGhostRingIntensity;
    color += ghostTint * (
      veil +
      rim * 0.68 +
      apertureBand * 0.44 +
      ghostGlow * mix(0.052, 0.092, opticalSeed) +
      reflectionEnergy
    ) * localIntensity;
    color += spectralRim * localIntensity * chromaAmount * 1.05;

    float glintAngle = opticalSeed * TAU;
    vec2 glintOffset =
      vec2(cos(glintAngle), sin(glintAngle)) *
      radius *
      mix(0.045, 0.15, opticalSeed);
    float glint = gaussian(
      length(ghostPoint - glintOffset),
      radius * mix(0.075, 0.11, opticalSeed)
    );
    float glintSelector = max(
      reflectionRingSelector,
      smoothstep(0.7, 0.82, descriptor.z)
    );
    color +=
      mix(uGhostColorB, vec3(1.0), 0.72) *
      glint *
      localIntensity *
      mix(0.34, 0.64, opticalSeed) *
      glintSelector;
  }

  color *= uIntensity;
  color = vec3(1.0) - exp(-max(color, vec3(0.0)));

  float alpha = clamp(max(max(color.r, color.g), color.b), 0.0, 0.94);
  vec3 straightColor = alpha > 0.0001 ? clamp(color / alpha, 0.0, 1.0) : vec3(0.0);
  outputColor = vec4(straightColor, alpha);
}
`

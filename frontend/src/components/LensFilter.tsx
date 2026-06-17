/**
 * Hidden SVG that defines the #lensFilter used by the Liquid-Glass surfaces in
 * index.css. It blurs the alpha and uses it as a displacement map so the frosted
 * edges subtly refract whatever is behind them. Mounted once in <App>.
 *
 * Note: the displacement-on-backdrop refraction renders in Chromium browsers
 * (Brave/Chrome/Edge). Elsewhere it degrades gracefully to plain frosted blur.
 */
export default function LensFilter() {
  return (
    <svg
      aria-hidden="true"
      style={{ position: "absolute", width: 0, height: 0, pointerEvents: "none" }}
    >
      <filter
        id="lensFilter"
        x="0%"
        y="0%"
        width="100%"
        height="100%"
        filterUnits="objectBoundingBox"
      >
        <feGaussianBlur in="SourceAlpha" stdDeviation="40" result="blur" />
        {/* subtle scale (~20) keeps it tasteful, not the demo's heavy warp */}
        <feDisplacementMap
          in="SourceGraphic"
          in2="blur"
          scale="20"
          xChannelSelector="A"
          yChannelSelector="A"
        />
      </filter>
    </svg>
  );
}

import type { CSSProperties } from "react";
import { ART } from "@/lib/art";
import { ParticleField } from "./ParticleField";
import { SeamCut } from "./SeamCut";

/** small warm pools of light — day lanterns and the night street */
const LANTERNS = [
  { lx: "12%", ly: "72%", lw: "11vmin", fd: "4.6s", night: 0 },
  { lx: "24%", ly: "63%", lw: "7vmin", fd: "6.1s", night: 0 },
  { lx: "88%", ly: "68%", lw: "9vmin", fd: "5.2s", night: 0 },
  { lx: "70%", ly: "80%", lw: "6vmin", fd: "7.4s", night: 0 },
  { lx: "18%", ly: "84%", lw: "8vmin", fd: "5.8s", night: 1 },
  { lx: "38%", ly: "88%", lw: "6vmin", fd: "4.2s", night: 1 },
  { lx: "62%", ly: "86%", lw: "9vmin", fd: "6.6s", night: 1 },
  { lx: "82%", ly: "79%", lw: "7vmin", fd: "5.5s", night: 1 },
];

/**
 * The scenery. Only the plates are duplicated into the two halves that can be
 * pulled apart — the haze, water and light ride above them and thin out as the
 * cut opens, which keeps the layer count (and the GPU) sane on a phone.
 */
export function Stage() {
  const daylight = (
    <>
      <div className="db-img db-plate-sunset" style={{ backgroundImage: `url(${ART.sunset})` }} />
      {/*
        The work scene, in two depth slices that hand off from the arrival plate
        exactly as the single dusk plate did. They live inside the halves so the
        cut tears them with the rest of the daylight; the near branch plane is
        mounted above the page instead (see Work), so it can pass in front of
        the cards rather than behind them.
      */}
      <div className="db-img db-work-bg" style={{ backgroundImage: `url(${ART.workBg})` }} />
      <div className="db-img db-work-mid" style={{ backgroundImage: `url(${ART.workMid})` }} />
      {/* the paper itself cools as the light goes out of it */}
      <div className="db-img db-day-tint" />
    </>
  );

  return (
    <div className="db-stage" aria-hidden="true">
      <div className="db-layer db-sky-day" />
      <div className="db-layer db-sky-night" />

      {/* what is underneath the daylight */}
      <div className="db-layer db-night">
        <div className="db-img db-plate-night" style={{ backgroundImage: `url(${ART.night})` }} />
        <div className="db-night-mist" />
      </div>

      {/* the daylight, in two halves that can be pulled apart */}
      <div className="db-daylight" data-half="a">
        {daylight}
      </div>
      <div className="db-daylight" data-half="b">
        {daylight}
      </div>

      {/* the sun and the weather of the world */}
      <div className="db-orb">
        <div className="db-sun-track">
          <div className="db-sun-glow" />
          <div className="db-sun" />
        </div>
      </div>

      <div className="db-haze">
        <div className="db-img db-clouds" style={{ backgroundImage: `url(${ART.clouds})` }} />
        <div className="db-mist" />
        <div className="db-water" />
      </div>

      {/*
        The intro bloom. Two transparent foreground-only plates — buds at t=0,
        full blossom at full bloom — cross-faded once on load over the frozen
        arrival plate, which itself never changes. They sit above the daylight
        halves and below every page layer, and the driver closes --bloom-op
        before the near branch plane's window opens, so the two fixed foreground
        layers never stack.
      */}
      <div className="db-bloom db-bloom-buds" aria-hidden="true">
        <div
          className="db-bloom-plate db-bloom-plate-buds"
          style={{ backgroundImage: `url(${ART.bloomBuds})` }}
        />
      </div>
      <div className="db-bloom db-bloom-full" aria-hidden="true">
        <div
          className="db-bloom-plate db-bloom-plate-full"
          style={{ backgroundImage: `url(${ART.bloomFull})` }}
        />
      </div>

      <div className="db-bleed" />
      <SeamCut />

      <div className="db-img db-eyes" style={{ backgroundImage: `url(${ART.eyes})` }} />

      {/* near-camera silhouette: one band, warmed by day and cooled by night */}
      <div
        className="db-img db-band"
        style={{ backgroundImage: `url(${ART.band})` }}
      />

      <div className="db-lanterns">
        {LANTERNS.map((l, i) => (
          <span
            key={i}
            className="db-lantern"
            style={
              {
                "--lx": l.lx,
                "--ly": l.ly,
                "--lw": l.lw,
                "--fd": l.fd,
                "--lo": l.night ? "var(--fg-night, 0)" : "var(--fg-day, 1)",
              } as CSSProperties
            }
          />
        ))}
      </div>

      <ParticleField />

      <div className="db-veil" />
      <div className="db-vignette" />
      <div className="db-grain" />
    </div>
  );
}

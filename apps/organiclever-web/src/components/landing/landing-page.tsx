"use client";

import { useEffect } from "react";

import { LandingNav } from "./landing-nav";
import { LandingHero } from "./landing-hero";
import { LandingFeatures } from "./landing-features";
import { LandingRhythmDemo } from "./landing-rhythm-demo";
import { LandingPrinciples } from "./landing-principles";
import { LandingFooter } from "./landing-footer";

function AlphaBanner() {
  return (
    <div
      style={{
        maxWidth: 1200,
        margin: "0 auto 60px",
      }}
      className="px-10 max-sm:px-5"
    >
      <div
        style={{
          background: "oklch(78% 0.13 80 / 0.08)",
          border: "1px solid oklch(52% 0.13 80 / 0.25)",
          borderRadius: 16,
          padding: "24px 28px",
          display: "flex",
          gap: 18,
          alignItems: "flex-start",
        }}
      >
        <div style={{ fontSize: 24, flexShrink: 0, marginTop: 2 }}>⚗️</div>
        <div>
          <div
            style={{
              fontSize: 16,
              fontWeight: 800,
              color: "#6b4a00",
              marginBottom: 6,
            }}
          >
            Pre-Alpha — expect breaking changes
          </div>
          <div
            style={{
              fontFamily: "var(--font-sans)",
              fontSize: 15,
              lineHeight: 1.6,
              color: "oklch(42% 0.10 80)",
            }}
          >
            OrganicLever is in active early development. It currently tracks{" "}
            <strong style={{ color: "#6b4a00", fontWeight: 700 }}>five event types</strong> — workouts, reading,
            learning, meals, and focus sessions — plus your own custom types. Data is stored locally —
            <strong style={{ color: "#6b4a00", fontWeight: 700 }}>
              {" "}
              clearing browser storage will erase your history.
            </strong>{" "}
            The data model may change between versions without migration.
          </div>
        </div>
      </div>
    </div>
  );
}

export function LandingPage() {
  const goApp = () => {
    window.location.href = "/app";
  };

  useEffect(() => {
    if (typeof IntersectionObserver === "undefined") return;
    const els = document.querySelectorAll("[data-reveal]");
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add("visible");
            io.unobserve(e.target);
          }
        });
      },
      { threshold: 0.1 },
    );
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, []);

  return (
    <div
      style={{
        fontFamily: "var(--font-sans)",
        background: "oklch(99% 0.005 80)",
        color: "oklch(18% 0.018 60)",
        minHeight: "100vh",
        overflowX: "hidden",
        position: "relative",
      }}
    >
      {/* Ambient background orbs */}
      <div
        className="animate-ol-drift"
        style={{
          position: "fixed",
          width: 600,
          height: 600,
          top: -200,
          left: -150,
          borderRadius: "50%",
          filter: "blur(80px)",
          pointerEvents: "none",
          zIndex: 0,
          background: "oklch(68% 0.10 195 / 0.08)",
        }}
      />
      <div
        className="animate-ol-drift"
        style={{
          position: "fixed",
          width: 400,
          height: 400,
          bottom: -100,
          right: -100,
          borderRadius: "50%",
          filter: "blur(80px)",
          pointerEvents: "none",
          zIndex: 0,
          background: "oklch(72% 0.10 145 / 0.07)",
          animationDelay: "-6s",
        }}
      />
      <div
        className="animate-ol-drift"
        style={{
          position: "fixed",
          width: 300,
          height: 300,
          top: "40%",
          left: "60%",
          borderRadius: "50%",
          filter: "blur(80px)",
          pointerEvents: "none",
          zIndex: 0,
          background: "oklch(78% 0.13 80 / 0.06)",
          animationDelay: "-12s",
        }}
      />

      <main style={{ position: "relative", zIndex: 1 }}>
        <LandingNav onGoApp={goApp} />
        <LandingHero onGoApp={goApp} />
        <AlphaBanner />
        <LandingFeatures />
        <LandingRhythmDemo />
        <LandingPrinciples />
        <LandingFooter onGoApp={goApp} />
      </main>
    </div>
  );
}

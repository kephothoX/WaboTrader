"use client";

import { useState, useEffect } from "react";
import Image from "next/image";

export default function SplashScreen() {
  const [isVisible, setIsVisible] = useState(true);
  const [isFading, setIsFading] = useState(false);

  useEffect(() => {
    // Show splash for 2.5 seconds total
    const fadeTimer = setTimeout(() => {
      setIsFading(true);
    }, 2000);

    const removeTimer = setTimeout(() => {
      setIsVisible(false);
    }, 3000);

    return () => {
      clearTimeout(fadeTimer);
      clearTimeout(removeTimer);
    };
  }, []);

  if (!isVisible) return null;

  return (
    <div className={`splash-container ${isFading ? "fade-out" : ""}`}>
      <div className="splash-logo-wrap">
        <Image 
          src="/images/logo.png" 
          alt="WaboTrader Logo" 
          fill
          style={{ objectFit: 'contain' }}
          priority
        />
      </div>
      
      <div className="splash-tagline">
        The Sentient Vanguard
      </div>

      <div className="splash-loading-bar">
        <div className="splash-loading-progress" />
      </div>

      <div style={{ 
        position: 'absolute', 
        bottom: '40px', 
        fontSize: '11px', 
        color: 'rgba(255,255,255,0.2)',
        letterSpacing: '0.1em'
      }}>
        POWERED BY NOSANA GPU NETWORK
      </div>
    </div>
  );
}

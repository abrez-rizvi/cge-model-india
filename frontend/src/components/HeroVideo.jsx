import React, { useRef, useEffect } from 'react';
import { useScroll, useTransform, motion } from 'framer-motion';

export default function HeroVideo() {
  const containerRef = useRef(null);
  const videoRef = useRef(null);

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end start"]
  });

  // Autoplay the video as ambient background
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    video.playbackRate = 0.6; // Slow cinematic pace
    video.play().catch(() => {
      // Autoplay blocked — that's fine, the poster/first frame will show
    });
  }, []);

  // As user scrolls, the video gently fades out and parallax-drifts up
  const opacity = useTransform(scrollYProgress, [0, 0.5, 1], [0.22, 0.10, 0]);
  const y = useTransform(scrollYProgress, [0, 1], ['0%', '-15%']);
  const scale = useTransform(scrollYProgress, [0, 1], [1, 1.08]);

  return (
    <div ref={containerRef} className="hero-video-container">
      <div className="hero-video-sticky">
        <motion.div
          className="hero-video-wrapper"
          style={{ opacity, y, scale }}
        >
          <video
            ref={videoRef}
            src="/cge-model-gem.mp4"
            muted
            loop
            playsInline
            preload="auto"
          />
          <div className="hero-video-vignette" />
        </motion.div>
      </div>
    </div>
  );
}

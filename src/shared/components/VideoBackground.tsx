import { useEffect, useRef, useState } from 'react';
import { Pause, Play } from 'lucide-react';

export default function VideoBackground() {
  const video = useRef<HTMLVideoElement>(null);
  const [paused, setPaused] = useState(true);
  const [failed, setFailed] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const element = video.current;
    if (!element) return;
    setReady(true);
    setPaused(element.paused);
    const preference = window.matchMedia('(prefers-reduced-motion: reduce)');
    let manuallyPaused = false;
    const sync = () => {
      if (preference.matches || document.hidden || manuallyPaused) element.pause();
      else void element.play().then(() => setPaused(element.paused)).catch(() => setPaused(true));
    };
    const pauseAll = () => {
      manuallyPaused = document.documentElement.classList.contains('motion-paused');
      sync();
    };
    sync();
    preference.addEventListener('change', sync);
    document.addEventListener('visibilitychange', sync);
    window.addEventListener('camm:motionchange', pauseAll);
    return () => {
      preference.removeEventListener('change', sync);
      document.removeEventListener('visibilitychange', sync);
      window.removeEventListener('camm:motionchange', pauseAll);
    };
  }, []);

  function toggleMotion() {
    const next = !paused;
    document.documentElement.classList.toggle('motion-paused', next);
    const sceneToggle = document.querySelector<HTMLButtonElement>('.motion-toggle');
    if (sceneToggle) {
      sceneToggle.setAttribute('aria-pressed', String(next));
      sceneToggle.textContent = next ? 'Resume motion' : 'Pause motion';
    }
    window.dispatchEvent(new Event('camm:motionchange'));
    if (next) video.current?.pause();
    else void video.current?.play().catch(() => setPaused(true));
  }

  return (
    <>
      <div className="video-backdrop" aria-hidden="true">
        <video ref={video} className="fixed inset-0 w-full h-full object-cover z-[0]" autoPlay loop muted playsInline preload="metadata"
          src="https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260723_145606_ab143199-b593-4941-bb1b-9afca215416b.mp4"
          onPlay={() => setPaused(false)} onPause={() => setPaused(true)} onError={() => setFailed(true)} />
        <div className="video-scrim" />
      </div>
      {ready && !failed && <button type="button" className="video-control liquid-glass" onClick={toggleMotion} aria-label={paused ? 'Play background video' : 'Pause background video'} aria-pressed={paused}>
        {paused ? <Play size={14} aria-hidden="true" /> : <Pause size={14} aria-hidden="true" />}
      </button>}
    </>
  );
}

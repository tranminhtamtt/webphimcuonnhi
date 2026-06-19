import React, { useEffect, useRef, useState } from 'react';
import Hls from 'hls.js';
import Plyr from 'plyr';
import 'plyr/dist/plyr.css';

const CustomPlayer = ({ src, poster, onTimeUpdate, initialTime }) => {
    const videoRef = useRef(null);
    const initialTimeRef = useRef(initialTime);
    
    // Progressive seek state
    const seekPressCount = useRef(0);
    const seekTimeout = useRef(null);
    const lastDirection = useRef(null);
    const [seekIndicator, setSeekIndicator] = useState({ show: false, text: '' });
    const indicatorTimeout = useRef(null);

    useEffect(() => {
        initialTimeRef.current = initialTime;
        if (initialTime > 0 && videoRef.current && videoRef.current.readyState >= 1) {
            // Nếu video đã load xong metadata nhưng API trả về delay, ta tua ngay lập tức
            if (videoRef.current.currentTime < initialTime) {
                videoRef.current.currentTime = initialTime;
            }
        }
    }, [initialTime]);

    useEffect(() => {
        const video = videoRef.current;
        if (!video) return;

        let hls;
        let player;

        const defaultOptions = {
            controls: [
                'play-large', 'play', 'progress', 'current-time', 'duration', 'mute', 'volume', 'settings', 'pip', 'airplay', 'fullscreen'
            ],
            settings: ['quality', 'speed'],
            keyboard: { focused: true, global: true },
        };

        if (Hls.isSupported() && src) {
            hls = new Hls();
            hls.loadSource(src);
            hls.attachMedia(video);
            
            hls.on(Hls.Events.MANIFEST_PARSED, function (event, data) {
                // Get strictly true resolutions from API stream
                let availableQualities = hls.levels.map((l) => l.height).filter(h => h && h > 0);
                
                // Remove duplicates and sort descending
                availableQualities = [...new Set(availableQualities)].sort((a, b) => b - a);

                player = new Plyr(video, {
                    ...defaultOptions,
                    quality: {
                        default: availableQualities.length > 0 ? availableQualities[0] : undefined,
                        options: availableQualities,
                        forced: true,
                        onChange: (e) => {
                            window.hls = hls;
                            hls.levels.forEach((level, levelIndex) => {
                                if (level.height === e) {
                                    hls.currentLevel = levelIndex;
                                }
                            });
                        }
                    }
                });
            });
        } else if (video.canPlayType('application/vnd.apple.mpegurl') && src) {
            // Safari support
            video.src = src;
            player = new Plyr(video, defaultOptions);
        }

        // Set initial time if provided
        const handleLoadedMetadata = () => {
            if (initialTimeRef.current > 0) {
                video.currentTime = initialTimeRef.current;
            }
        };

        const handleTimeUpdate = () => {
            if (onTimeUpdate) {
                onTimeUpdate(video.currentTime, video.duration);
            }
        };

        video.addEventListener('loadedmetadata', handleLoadedMetadata);
        video.addEventListener('timeupdate', handleTimeUpdate);

        return () => {
            video.removeEventListener('loadedmetadata', handleLoadedMetadata);
            video.removeEventListener('timeupdate', handleTimeUpdate);
            if (hls) hls.destroy();
            if (player) player.destroy();
        };
    }, [src, onTimeUpdate]); // added onTimeUpdate to dependencies just in case

    // Intercept keyboard events for progressive seeking
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
                e.preventDefault();
                e.stopPropagation();

                const direction = e.key === 'ArrowRight' ? 'forward' : 'rewind';
                
                if (lastDirection.current !== direction) {
                    seekPressCount.current = 0;
                    lastDirection.current = direction;
                }

                seekPressCount.current += 1;
                
                // Calculate step size based on press count
                const level = Math.floor((seekPressCount.current - 1) / 6);
                let seekStep = 5;
                if (level === 1) seekStep = 10;
                else if (level >= 2) seekStep = level * 10;

                const video = videoRef.current;
                if (video) {
                    const stepValue = direction === 'forward' ? seekStep : -seekStep;
                    video.currentTime = Math.max(0, Math.min(video.duration || 0, video.currentTime + stepValue));
                }

                // Show visual indicator
                setSeekIndicator({ show: true, text: `${direction === 'forward' ? '+' : '-'}${seekStep}s` });
                
                if (indicatorTimeout.current) clearTimeout(indicatorTimeout.current);
                indicatorTimeout.current = setTimeout(() => {
                    setSeekIndicator(prev => ({ ...prev, show: false }));
                }, 1000);

                // Reset progressive count after 2 seconds of inactivity
                if (seekTimeout.current) clearTimeout(seekTimeout.current);
                seekTimeout.current = setTimeout(() => {
                    seekPressCount.current = 0;
                }, 2000);
            }
        };

        // Use capture phase to intercept before Plyr handles it
        window.addEventListener('keydown', handleKeyDown, true);
        return () => {
            window.removeEventListener('keydown', handleKeyDown, true);
            if (indicatorTimeout.current) clearTimeout(indicatorTimeout.current);
            if (seekTimeout.current) clearTimeout(seekTimeout.current);
        };
    }, []);

    return (
        <div style={{ width: '100%', height: '100%', position: 'relative' }}>
            <video 
                ref={videoRef} 
                crossOrigin="anonymous" 
                playsInline 
                poster={poster}
                style={{ width: '100%', height: '100%' }}
            ></video>
            
            {/* Visual Indicator for Seek Step */}
            <div style={{
                position: 'absolute',
                top: '40px',
                left: '50%',
                transform: 'translateX(-50%)',
                backgroundColor: 'rgba(0, 0, 0, 0.7)',
                color: '#fff',
                padding: '10px 24px',
                borderRadius: '20px',
                fontSize: '20px',
                fontWeight: 'bold',
                pointerEvents: 'none',
                zIndex: 9999,
                transition: 'opacity 0.2s ease-in-out',
                opacity: seekIndicator.show ? 1 : 0,
                textShadow: '0 2px 4px rgba(0,0,0,0.5)',
                boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
            }}>
                {seekIndicator.text}
            </div>
        </div>
    );
};

export default CustomPlayer;

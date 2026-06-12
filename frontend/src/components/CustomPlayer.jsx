import React, { useEffect, useRef } from 'react';
import Hls from 'hls.js';
import Plyr from 'plyr';
import 'plyr/dist/plyr.css';

const CustomPlayer = ({ src, poster, onTimeUpdate, initialTime }) => {
    const videoRef = useRef(null);
    const initialTimeRef = useRef(initialTime);

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
    }, [src]);

    return (
        <div style={{ width: '100%', height: '100%' }}>
            <video 
                ref={videoRef} 
                crossOrigin="anonymous" 
                playsInline 
                poster={poster}
                style={{ width: '100%', height: '100%' }}
            ></video>
        </div>
    );
};

export default CustomPlayer;

import React, { useState, useRef, useEffect } from 'react';
import { Play, Pause, Volume2, Mic } from 'lucide-react';
import { cn } from '@/src/lib/utils';

interface AudioPlayerProps {
  src: string;
  duration?: number;
  isFromAdminOrDono?: boolean;
  className?: string;
}

export const AudioPlayer: React.FC<AudioPlayerProps> = ({
  src,
  duration: initialDuration,
  isFromAdminOrDono = false,
  className
}) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(initialDuration || 0);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleTimeUpdate = () => {
      setCurrentTime(audio.currentTime);
    };

    const handleLoadedMetadata = () => {
      if (audio.duration && !isNaN(audio.duration) && isFinite(audio.duration)) {
        setDuration(audio.duration);
      }
    };

    const handleEnded = () => {
      setIsPlaying(false);
      setCurrentTime(0);
    };

    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('loadedmetadata', handleLoadedMetadata);
    audio.addEventListener('ended', handleEnded);

    return () => {
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audio.removeEventListener('ended', handleEnded);
    };
  }, [src]);

  const togglePlayPause = () => {
    const audio = audioRef.current;
    if (!audio) return;

    if (isPlaying) {
      audio.pause();
      setIsPlaying(false);
    } else {
      audio.play().then(() => {
        setIsPlaying(true);
      }).catch((err) => {
        console.warn('Playback error:', err);
        setIsPlaying(false);
      });
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const seekTime = parseFloat(e.target.value);
    setCurrentTime(seekTime);
    if (audioRef.current) {
      audioRef.current.currentTime = seekTime;
    }
  };

  const formatTime = (seconds: number) => {
    if (isNaN(seconds) || !isFinite(seconds)) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  const progressPercent = duration > 0 ? Math.min(100, (currentTime / duration) * 100) : 0;

  return (
    <div
      className={cn(
        "p-3 rounded-xl border flex items-center gap-3 select-none w-full max-w-xs sm:max-w-sm transition-all",
        isFromAdminOrDono
          ? "bg-black/40 border-[#d4af37]/40 text-white"
          : "bg-black/30 border-white/15 text-white",
        className
      )}
    >
      <audio ref={audioRef} src={src} preload="metadata" />

      {/* Play/Pause Button */}
      <button
        type="button"
        onClick={togglePlayPause}
        className={cn(
          "w-9 h-9 rounded-full flex items-center justify-center shrink-0 transition-transform active:scale-95 shadow-md",
          isFromAdminOrDono
            ? "bg-[#d4af37] text-black hover:bg-[#e5c158]"
            : "bg-emerald-500 text-white hover:bg-emerald-400"
        )}
        title={isPlaying ? "Pausar áudio" : "Reproduzir áudio"}
      >
        {isPlaying ? <Pause size={18} className="fill-current" /> : <Play size={18} className="fill-current ml-0.5" />}
      </button>

      {/* Audio Details & Seek Bar */}
      <div className="flex-1 min-w-0 space-y-1">
        <div className="flex items-center justify-between text-[11px]">
          <span className="font-semibold flex items-center gap-1 opacity-90">
            <Mic size={12} className={isFromAdminOrDono ? "text-[#d4af37]" : "text-emerald-400"} />
            Áudio de voz
          </span>
          <span className="font-mono text-[10px] opacity-75">
            {formatTime(currentTime)} / {formatTime(duration)}
          </span>
        </div>

        {/* Progress bar track */}
        <div className="relative w-full h-1.5 bg-white/15 rounded-full overflow-hidden flex items-center">
          <div
            className={cn(
              "h-full rounded-full transition-all duration-100",
              isFromAdminOrDono ? "bg-[#d4af37]" : "bg-emerald-400"
            )}
            style={{ width: `${progressPercent}%` }}
          />
          <input
            type="range"
            min={0}
            max={duration || 100}
            step={0.1}
            value={currentTime}
            onChange={handleSeek}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          />
        </div>
      </div>
    </div>
  );
};

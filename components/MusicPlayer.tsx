import React, { useEffect, useRef, useState } from 'react';
import { Song } from '../types';

interface MusicPlayerProps {
  playlist: Song[];
  setPlaylist: (songs: Song[]) => void;
  currentIndex: number;
  setCurrentIndex: (index: number) => void;
  onSongEnd: () => void;
  autoPlayUnlocked: boolean;
}

export const MusicPlayer: React.FC<MusicPlayerProps> = ({ playlist, setPlaylist, currentIndex, setCurrentIndex, onSongEnd, autoPlayUnlocked }) => {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);

  useEffect(() => {
    if (playlist.length > 0 && audioRef.current) {
        audioRef.current.src = playlist[currentIndex].url;
        audioRef.current.play()
            .then(() => setIsPlaying(true))
            .catch(e => console.log("Autoplay prevented:", e));
    }
  }, [currentIndex, playlist.length]); // Re-run if index changes or first song added

  const handleEnded = () => {
    // Notify parent to increment counter
    onSongEnd();
    
    if (autoPlayUnlocked) {
        // Continuous Play Logic
        const nextIndex = (currentIndex + 1) % playlist.length;
        setCurrentIndex(nextIndex);
        // isPlaying remains true effectively, effect will trigger play
    } else {
        // Stop and lock logic (existing behavior for Locked mode)
        setIsPlaying(false);
    }
  };

  const handleSelectSong = (index: number) => {
      if (isPlaying) return; // Locked while playing
      setCurrentIndex(index);
  };

  const deleteSong = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (isPlaying) return; // Locked while playing
    
    const newPlaylist = playlist.filter(s => s.id !== id);
    setPlaylist(newPlaylist);
    if (currentIndex >= newPlaylist.length) {
        setCurrentIndex(0);
    }
  };

  return (
    <div className="absolute bottom-6 right-6 z-50 flex flex-col items-end gap-2">
        {/* The Audio Element */}
        <audio ref={audioRef} onEnded={handleEnded} controls={false} />

        {/* Compact Pill Player */}
        <div className={`bg-black/60 backdrop-blur-md border border-white/10 rounded-full px-4 py-2 flex items-center gap-3 shadow-lg ${isPlaying ? 'border-green-500/30' : ''}`}>
            <div className={`w-2 h-2 rounded-full ${isPlaying ? 'bg-green-400 animate-pulse' : 'bg-red-500'}`} />
            <span className="text-white/80 text-xs font-mono uppercase tracking-widest">
                {playlist.length > 0 ? playlist[currentIndex].name.substring(0, 15) : "No Music"}
            </span>
            
            {/* Playlist Count */}
            <div className="text-xs text-blue-300 font-bold ml-2">
                {playlist.length}
            </div>
            
            {isPlaying && !autoPlayUnlocked && (
                <span className="text-[8px] text-slate-400 uppercase ml-2">Locked</span>
            )}
            
            {autoPlayUnlocked && (
                 <span className="text-[8px] text-green-400 uppercase ml-2">∞ Loop</span>
            )}
        </div>

        {/* Playlist Manager */}
        {playlist.length > 0 && (
            <div className="bg-black/80 backdrop-blur-xl rounded-xl p-3 border border-white/5 w-64 text-right space-y-2 mt-2">
                 {playlist.map((song, idx) => (
                     <div 
                        key={song.id} 
                        onClick={() => handleSelectSong(idx)}
                        className={`flex justify-between items-center text-xs p-2 rounded transition-colors 
                            ${idx === currentIndex ? 'bg-white/10 text-blue-300' : 'text-gray-400 hover:bg-white/5'} 
                            ${isPlaying ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}
                        `}
                     >
                        <span className="truncate max-w-[150px]">{song.name}</span>
                        {!isPlaying && (
                            <button onClick={(e) => deleteSong(song.id, e)} className="text-red-400 hover:text-red-300 ml-2 px-2">×</button>
                        )}
                     </div>
                 ))}
            </div>
        )}
    </div>
  );
};
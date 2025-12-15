import React, { useState, Suspense, useMemo } from 'react';
import { Experience } from './components/Experience';
import { MusicPlayer } from './components/MusicPlayer';
import { StarData, Song } from './types';

// Initial Positions for 20 stars
const INITIAL_STARS: StarData[] = Array.from({ length: 20 }, (_, i) => {
    // Random position surrounding the pearl
    const theta = Math.random() * Math.PI * 2;
    
    // Radius: Significantly increased range to scatter them
    // Pearl radius is 2.5. We start further out.
    // Range from 8 to 20
    const radius = 8 + Math.random() * 12; 
    
    // Height: Distributed more broadly
    const y = -1.5 + Math.random() * 6; // Range -1.5 to 4.5

    return {
        id: i,
        position: [
            radius * Math.cos(theta),
            y,
            radius * Math.sin(theta)
        ],
        isActive: false,
        images: [],
        viewCount: 0
    };
});

const generateId = () => Math.random().toString(36).substring(2, 9);

const App: React.FC = () => {
  const [stars, setStars] = useState<StarData[]>(INITIAL_STARS);
  const [playlist, setPlaylist] = useState<Song[]>([]);
  const [currentSongIndex, setCurrentSongIndex] = useState(0);
  
  // Progression State
  const [playbackCount, setPlaybackCount] = useState(0);

  // Derived Progression Stats
  // Base Limit 5. Adds 1 for every 10 plays. Max 10.
  const maxPlaylistSize = useMemo(() => {
      const bonus = Math.floor(playbackCount / 10);
      return Math.min(10, 5 + bonus);
  }, [playbackCount]);

  // Unlock continuous playback after reaching max limit (50 plays) + 10 more plays = 60 plays
  const isContinuousPlayUnlocked = playbackCount >= 60;

  // Modal State
  const [isUploadModalOpen, setUploadModalOpen] = useState(false);
  const [editingStarId, setEditingStarId] = useState<number | null>(null);
  const [tempImages, setTempImages] = useState<string[]>([]);
  const [tempText, setTempText] = useState("");
  const [dragActive, setDragActive] = useState(false);

  // --- Handlers ---

  const handleMusicUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
        const file = e.target.files[0];
        
        if (playlist.length >= maxPlaylistSize) {
            alert(`Playlist full (Max ${maxPlaylistSize}). Keep listening to unlock more space!`);
            return;
        }

        const newSong: Song = {
            id: generateId(),
            name: file.name,
            url: URL.createObjectURL(file)
        };

        const newPlaylist = [...playlist, newSong];
        setPlaylist(newPlaylist);
        
        // Auto-play the new song immediately by setting index to the end
        setCurrentSongIndex(newPlaylist.length - 1);
    }
  };

  const handleSongEnd = () => {
      // Increment playback count
      setPlaybackCount(prev => prev + 1);
  };

  const handleStarClick = (id: number) => {
      // Called when clicking an INACTIVE star or an ACTIVE star's "Edit" button
      const star = stars.find(s => s.id === id);
      if (star) {
          setEditingStarId(id);
          // Pre-fill data if it exists (for editing mode)
          setTempImages(star.images);
          setTempText(star.text || "");
          setUploadModalOpen(true);
      }
  };

  const handleStarView = (id: number) => {
      // Called when an ACTIVE star is opened to view memories
      setStars(prev => prev.map(star => {
          if (star.id === id) {
              return { ...star, viewCount: star.viewCount + 1 };
          }
          return star;
      }));
  };

  const handleLaunchStar = () => {
      if (editingStarId === null) return;

      setStars(prev => prev.map(star => {
          if (star.id === editingStarId) {
              return {
                  ...star,
                  isActive: true,
                  images: tempImages,
                  text: tempText,
                  viewCount: 0 // Reset count on new launch/edit
              };
          }
          return star;
      }));

      // Reset Form
      setTempImages([]);
      setTempText("");
      setEditingStarId(null);
      setUploadModalOpen(false);
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files) {
          processFiles(e.target.files);
      }
  }

  const processFiles = (files: FileList) => {
      const remainingSlots = 4 - tempImages.length;
      if (remainingSlots <= 0) return;

      const newImages: string[] = [];
      const count = Math.min(files.length, remainingSlots);

      for (let i = 0; i < count; i++) {
          newImages.push(URL.createObjectURL(files[i]));
      }
      setTempImages(prev => [...prev, ...newImages]);
  };

  // Drag and Drop Handlers
  const handleDrag = (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      if (e.type === "dragenter" || e.type === "dragover") {
          setDragActive(true);
      } else if (e.type === "dragleave") {
          setDragActive(false);
      }
  };

  const handleDrop = (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setDragActive(false);
      if (e.dataTransfer.files && e.dataTransfer.files[0]) {
          processFiles(e.dataTransfer.files);
      }
  };

  const removeTempImage = (index: number) => {
      setTempImages(prev => prev.filter((_, i) => i !== index));
  };

  const triggerFileInput = () => {
      document.getElementById('img-upload')?.click();
  };

  return (
    <div className="relative w-full h-full bg-black overflow-hidden font-sans">
      
      <Suspense fallback={<div className="text-white absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 font-serif text-xl tracking-widest">Loading Ocean...</div>}>
        <Experience stars={stars} onStarClick={handleStarClick} onStarView={handleStarView} />
      </Suspense>

      {/* --- UI LAYER --- */}

      {/* Top Left: HEART Button (Lavender/Purple) */}
      <div className="absolute top-6 left-6 z-10 flex flex-col gap-4">
          <div className="flex gap-2">
            <label className="cursor-pointer bg-purple-400/20 hover:bg-purple-400/40 text-purple-100 border border-purple-400/50 px-4 py-2 rounded-lg backdrop-blur-md transition-all text-xs uppercase tracking-widest font-bold shadow-[0_0_10px_rgba(192,132,252,0.3)]">
                <span>HEART</span>
                <input type="file" accept="audio/*" onChange={handleMusicUpload} className="hidden" />
            </label>
            <div className="px-4 py-2 text-blue-200/50 text-xs uppercase tracking-widest font-bold border border-white/5 rounded-lg bg-black/20 backdrop-blur-md">
                 {20 - stars.filter(s => s.isActive).length} Stars Empty
            </div>
          </div>
          {/* Debug/Progress Info (Optional visual for user to know capacity) */}
          {playbackCount > 0 && (
             <div className="px-2 py-1 text-[10px] text-slate-400 text-left">
                 XP: {playbackCount} | Cap: {maxPlaylistSize} {isContinuousPlayUnlocked ? "| ∞ Play Active" : ""}
             </div>
          )}
      </div>

      {/* Star Creation Modal */}
      {isUploadModalOpen && (
          <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
              <div className="bg-slate-900 border border-slate-700 p-6 rounded-2xl w-full max-w-lg shadow-2xl relative animate-fade-in-up">
                  <button onClick={() => setUploadModalOpen(false)} className="absolute top-2 right-4 text-slate-400 hover:text-white text-xl">×</button>
                  <h3 className="text-xl text-white mb-4 font-serif">Light a new Star.玉</h3>
                  
                  <div className="space-y-4">
                      {/* Image 2x2 Grid Area (Moderate Size) */}
                      <div>
                          <label className="block text-slate-400 text-xs uppercase mb-1">Images ({tempImages.length}/4)</label>
                          
                          <input 
                              type="file" 
                              multiple 
                              accept="image/*" 
                              onChange={handleImageSelect} 
                              className="hidden" 
                              id="img-upload"
                              disabled={tempImages.length >= 4}
                          />

                          <div 
                              className={`grid grid-cols-2 grid-rows-2 gap-2 w-full h-48 transition-all rounded-lg p-1 ${dragActive ? "bg-cyan-900/20 border-2 border-dashed border-cyan-400" : ""}`}
                              onDragEnter={handleDrag}
                              onDragLeave={handleDrag}
                              onDragOver={handleDrag}
                              onDrop={handleDrop}
                          >
                               {/* Render 4 slots (Filled or Empty) */}
                               {[0, 1, 2, 3].map((index) => {
                                  const img = tempImages[index];
                                  if (img) {
                                      // Filled Slot
                                      return (
                                          <div key={index} className="relative w-full h-full group">
                                              <img src={img} className="w-full h-full object-cover rounded border border-white/20" />
                                              <button 
                                                onClick={(e) => { e.stopPropagation(); removeTempImage(index); }}
                                                className="absolute top-1 right-1 bg-black/60 hover:bg-red-500/80 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs transition-colors backdrop-blur-sm border border-white/10"
                                              >
                                                  ×
                                              </button>
                                          </div>
                                      );
                                  } else if (index === tempImages.length) {
                                      // Add/Upload Button Slot (Next available)
                                      return (
                                          <div 
                                            key={index}
                                            onClick={triggerFileInput}
                                            className="w-full h-full border border-dashed border-slate-600 rounded bg-white/5 hover:bg-white/10 flex flex-col items-center justify-center cursor-pointer transition-colors group"
                                          >
                                             <span className="text-2xl text-slate-500 group-hover:text-cyan-200 transition-colors">+</span>
                                             <span className="text-[10px] text-slate-500 uppercase tracking-widest mt-1 group-hover:text-cyan-200 transition-colors">Add Image</span>
                                          </div>
                                      );
                                  } else {
                                      // Locked/Empty Placeholder Slot
                                      return (
                                          <div key={index} className="w-full h-full border border-white/5 rounded bg-black/20" />
                                      );
                                  }
                               })}
                          </div>
                      </div>
                      
                      {/* Text Area - Matches Image Grid Height (h-48) */}
                      <div>
                          <label className="block text-slate-400 text-xs uppercase mb-1">
                             Message <span className="text-slate-600">({tempText.length}/4000)</span>
                          </label>
                          <textarea 
                            className="w-full h-48 bg-black/30 border border-slate-600 rounded p-2 text-white text-sm focus:border-violet-500 outline-none resize-none scrollbar-thin scrollbar-thumb-violet-500 scrollbar-track-transparent" 
                            placeholder="Write your story here..."
                            value={tempText}
                            maxLength={4000}
                            onChange={(e) => setTempText(e.target.value)}
                          />
                      </div>

                      <button onClick={handleLaunchStar} className="w-full bg-cyan-600 hover:bg-cyan-500 text-white py-2 rounded-lg font-bold transition-colors shadow-[0_0_15px_rgba(0,200,255,0.4)]">
                          Launch Star
                      </button>
                  </div>
              </div>
          </div>
      )}

      {/* Bottom Right: Music Player */}
      <MusicPlayer 
        playlist={playlist} 
        setPlaylist={setPlaylist} 
        currentIndex={currentSongIndex} 
        setCurrentIndex={setCurrentSongIndex} 
        onSongEnd={handleSongEnd}
        autoPlayUnlocked={isContinuousPlayUnlocked}
      />

    </div>
  );
};

export default App;
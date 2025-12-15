import React, { useState, Suspense, useMemo, useEffect } from 'react';
import { Experience } from './components/Experience';
import { MusicPlayer } from './components/MusicPlayer';
import { StarData, Song } from './types';
import * as DB from './utils/db';
import { STATIC_STARS, STATIC_PLAYLIST, INITIAL_PLAYBACK_COUNT } from './data/initialData';

const generateId = () => Math.random().toString(36).substring(2, 9);

interface TempImage {
    url: string;
    file?: File;
    assetId?: string;
}

// Helper to convert Blob/URL to Base64
const urlToBase64 = async (url: string): Promise<string> => {
    try {
        if (url.startsWith('data:')) return url; // Already base64
        
        const response = await fetch(url);
        const blob = await response.blob();
        
        return await new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result as string);
            reader.onerror = reject;
            reader.readAsDataURL(blob);
        });
    } catch (e) {
        console.warn("Failed to convert to base64:", url, e);
        return url; // Fallback to original url
    }
};

const App: React.FC = () => {
  // --- Initialization Logic ---
  // 1. Try to use STATIC_STARS if they exist.
  // 2. Fallback to random generation if static data is empty.
  const [stars, setStars] = useState<StarData[]>(() => {
      if (STATIC_STARS.length > 0) {
          return STATIC_STARS;
      }
      // Fallback Generator
      return Array.from({ length: 20 }, (_, i) => {
          const theta = Math.random() * Math.PI * 2;
          const radius = 8 + Math.random() * 12; 
          const y = -1.5 + Math.random() * 6;
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
  });

  const [playlist, setPlaylist] = useState<Song[]>(STATIC_PLAYLIST);
  const [currentSongIndex, setCurrentSongIndex] = useState(0);
  const [playbackCount, setPlaybackCount] = useState(INITIAL_PLAYBACK_COUNT);
  const [isDataLoaded, setIsDataLoaded] = useState(false);

  // --- Persistence: Load on Mount ---
  // Checks IndexedDB. If user has local changes, they override the static defaults.
  useEffect(() => {
      const init = async () => {
          try {
              const savedState = await DB.loadGameState();
              if (savedState) {
                  // Reconstruct Stars (Convert AssetIDs to Blob URLs)
                  const restoredStars = await Promise.all(savedState.stars.map(async (s) => {
                      let imageUrls: string[] = s.images || [];
                      
                      // Try to load from DB Blobs if available
                      if (s.imageAssetIds && s.imageAssetIds.length > 0) {
                          const blobs = await Promise.all(s.imageAssetIds.map(id => DB.getAsset(id)));
                          const blobUrls = blobs.map(b => b ? URL.createObjectURL(b) : '');
                          // If blob load worked, use it. Otherwise keep original URL (in case it was static)
                          imageUrls = imageUrls.map((original, i) => blobUrls[i] || original).filter(Boolean);
                      }
                      return { ...s, images: imageUrls };
                  }));

                  // Reconstruct Playlist
                  const restoredPlaylist = await Promise.all(savedState.playlist.map(async (s) => {
                      if (s.assetId) {
                          const blob = await DB.getAsset(s.assetId);
                          if (blob) {
                              return { ...s, url: URL.createObjectURL(blob) };
                          }
                      }
                      return s; 
                  }));

                  setStars(restoredStars);
                  setPlaylist(restoredPlaylist.filter(s => s.url)); 
                  setPlaybackCount(savedState.playbackCount);
              }
          } catch (e) {
              console.error("Failed to load game state", e);
          } finally {
              setIsDataLoaded(true);
          }
      };
      init();
  }, []);

  // --- Persistence: Save Helper ---
  const saveGame = async (newStars: StarData[], newPlaylist: Song[], newPlaybackCount: number) => {
      await DB.saveGameState({
          stars: newStars,
          playlist: newPlaylist,
          playbackCount: newPlaybackCount
      });
  };

  // --- Dev Tool: Export Data ---
  const handleExportData = async () => {
      // Show loading state implicitly by console log or let user wait
      console.log("Starting Export... Converting assets to Base64...");
      
      try {
        // Convert Star Images to Base64
        const cleanStars = await Promise.all(stars.map(async (s) => {
            const base64Images = await Promise.all(s.images.map(img => urlToBase64(img)));
            return {
                ...s,
                images: base64Images,
                imageAssetIds: undefined // Don't export DB IDs
            };
        }));

        // Convert Playlist Audio to Base64 (Warning: This can be huge)
        // Ideally we only export metadata for audio if it's too big, but let's try.
        // If it's a static path, urlToBase64 fetches it.
        const cleanPlaylist = await Promise.all(playlist.map(async (s) => {
             // Optional: Limit audio export if needed. For now, try to export everything.
             // If url is blob, convert. If url is /assets/..., fetch and convert.
             let b64Url = s.url;
             // Only convert if it's not already a long data string (optimization)
             if (!s.url.startsWith('data:')) {
                 b64Url = await urlToBase64(s.url);
             }

             return {
                id: s.id,
                name: s.name,
                url: b64Url,
                assetId: undefined
             };
        }));

        const exportString = `
// --- COPY BELOW THIS LINE into data/initialData.ts ---

export const STATIC_STARS = ${JSON.stringify(cleanStars, null, 2)};

export const STATIC_PLAYLIST = ${JSON.stringify(cleanPlaylist, null, 2)};

export const INITIAL_PLAYBACK_COUNT = ${playbackCount};
        `;

        await navigator.clipboard.writeText(exportString);
        alert("DATA COPIED! (Embedded Images/Audio)\n\n1. Go to the chat.\n2. Paste (Ctrl+V) the code.\n3. I will save it to the file for you.");
      } catch (err) {
        console.error("Export failed", err);
        alert("Export failed. See console for details.");
      }
  };

  // Derived Progression Stats
  const maxPlaylistSize = useMemo(() => {
      const bonus = Math.floor(playbackCount / 10);
      return Math.min(10, 5 + bonus);
  }, [playbackCount]);

  const isContinuousPlayUnlocked = playbackCount >= 60;

  // Modal State
  const [isUploadModalOpen, setUploadModalOpen] = useState(false);
  const [editingStarId, setEditingStarId] = useState<number | null>(null);
  
  // Temp state now tracks metadata + file to allow saving
  const [tempImages, setTempImages] = useState<TempImage[]>([]);
  const [tempText, setTempText] = useState("");
  const [dragActive, setDragActive] = useState(false);

  // --- Handlers ---

  const handleMusicUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
        const file = e.target.files[0];
        
        if (playlist.length >= maxPlaylistSize) {
            alert(`Playlist full (Max ${maxPlaylistSize}). Keep listening to unlock more space!`);
            return;
        }

        try {
            // Save to DB immediately
            const assetId = await DB.saveAsset(file);
            
            const newSong: Song = {
                id: generateId(),
                name: file.name,
                url: URL.createObjectURL(file),
                assetId: assetId
            };

            const newPlaylist = [...playlist, newSong];
            setPlaylist(newPlaylist);
            setCurrentSongIndex(newPlaylist.length - 1);
            
            // Persist State
            saveGame(stars, newPlaylist, playbackCount);
        } catch (err) {
            console.error("Failed to save music", err);
        }
    }
  };

  const handleSongEnd = () => {
      const newCount = playbackCount + 1;
      setPlaybackCount(newCount);
      saveGame(stars, playlist, newCount);
  };

  const handleStarClick = (id: number) => {
      const star = stars.find(s => s.id === id);
      if (star) {
          setEditingStarId(id);
          // Pre-fill data. Map existing URLs and AssetIDs to TempImage structure
          const existingImages: TempImage[] = star.images.map((url, index) => ({
              url,
              assetId: star.imageAssetIds ? star.imageAssetIds[index] : undefined
          }));
          
          setTempImages(existingImages);
          setTempText(star.text || "");
          setUploadModalOpen(true);
      }
  };

  const handleStarView = (id: number) => {
      const newStars = stars.map(star => {
          if (star.id === id) {
              return { ...star, viewCount: star.viewCount + 1 };
          }
          return star;
      });
      setStars(newStars);
      saveGame(newStars, playlist, playbackCount);
  };

  const handleLaunchStar = async () => {
      if (editingStarId === null) return;

      try {
          // Process images: If it has a File, save it to DB and get AssetID. 
          // If it already has AssetID, keep it.
          const processedImages = await Promise.all(tempImages.map(async (img) => {
              if (img.file) {
                  const id = await DB.saveAsset(img.file);
                  return { url: img.url, assetId: id }; // New persisted image
              }
              return { url: img.url, assetId: img.assetId }; // Existing persisted image
          }));

          const finalImageUrls = processedImages.map(p => p.url);
          const finalAssetIds = processedImages.map(p => p.assetId || ''); // Should ideally always have ID

          const newStars = stars.map(star => {
              if (star.id === editingStarId) {
                  return {
                      ...star,
                      isActive: true,
                      images: finalImageUrls,
                      imageAssetIds: finalAssetIds,
                      text: tempText,
                      viewCount: 0 // Reset count on new launch/edit
                  };
              }
              return star;
          });

          setStars(newStars);
          saveGame(newStars, playlist, playbackCount);

          // Reset Form
          setTempImages([]);
          setTempText("");
          setEditingStarId(null);
          setUploadModalOpen(false);
      } catch (err) {
          console.error("Failed to save star data", err);
          alert("Error saving star data. Check console.");
      }
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files) {
          processFiles(e.target.files);
      }
  }

  const processFiles = (files: FileList) => {
      const remainingSlots = 4 - tempImages.length;
      if (remainingSlots <= 0) return;

      const newTempImages: TempImage[] = [];
      const count = Math.min(files.length, remainingSlots);

      for (let i = 0; i < count; i++) {
          const file = files[i];
          newTempImages.push({
              url: URL.createObjectURL(file),
              file: file // Store file for saving later
          });
      }
      setTempImages(prev => [...prev, ...newTempImages]);
  };

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

  // Deletion logic passed to MusicPlayer needs to persist too
  const handlePlaylistUpdate = (newPlaylist: Song[]) => {
      setPlaylist(newPlaylist);
      saveGame(stars, newPlaylist, playbackCount);
  };

  if (!isDataLoaded) {
      return <div className="w-full h-full bg-black flex items-center justify-center text-cyan-200 font-serif animate-pulse">Recovering Memories...</div>;
  }

  return (
    <div className="relative w-full h-full bg-black overflow-hidden font-sans">
      
      <Suspense fallback={<div className="text-white absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 font-serif text-xl tracking-widest">Loading Ocean...</div>}>
        <Experience stars={stars} onStarClick={handleStarClick} onStarView={handleStarView} />
      </Suspense>

      {/* --- UI LAYER --- */}

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
          {playbackCount > 0 && (
             <div className="px-2 py-1 text-[10px] text-slate-400 text-left">
                 XP: {playbackCount} | Cap: {maxPlaylistSize} {isContinuousPlayUnlocked ? "| ∞ Play Active" : ""}
             </div>
          )}
      </div>

      {/* Deployment Helper Button */}
      <div className="absolute bottom-6 left-6 z-10">
          <button 
            onClick={handleExportData}
            className="text-[10px] bg-slate-800/50 hover:bg-slate-700/80 text-slate-300 px-3 py-1 rounded border border-slate-600/50 uppercase tracking-widest transition-colors"
          >
              ⚡ Export Data (Base64)
          </button>
      </div>

      {/* Star Creation Modal */}
      {isUploadModalOpen && (
          <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
              <div className="bg-slate-900 border border-slate-700 p-6 rounded-2xl w-full max-w-lg shadow-2xl relative animate-fade-in-up">
                  <button onClick={() => setUploadModalOpen(false)} className="absolute top-2 right-4 text-slate-400 hover:text-white text-xl">×</button>
                  <h3 className="text-xl text-white mb-4 font-serif">Light a new Star.玉</h3>
                  
                  <div className="space-y-4">
                      {/* Image 2x2 Grid Area */}
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
                               {[0, 1, 2, 3].map((index) => {
                                  const img = tempImages[index];
                                  if (img) {
                                      return (
                                          <div key={index} className="relative w-full h-full group">
                                              <img src={img.url} className="w-full h-full object-cover rounded border border-white/20" />
                                              <button 
                                                onClick={(e) => { e.stopPropagation(); removeTempImage(index); }}
                                                className="absolute top-1 right-1 bg-black/60 hover:bg-red-500/80 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs transition-colors backdrop-blur-sm border border-white/10"
                                              >
                                                  ×
                                              </button>
                                          </div>
                                      );
                                  } else if (index === tempImages.length) {
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
                                      return (
                                          <div key={index} className="w-full h-full border border-white/5 rounded bg-black/20" />
                                      );
                                  }
                               })}
                          </div>
                      </div>
                      
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

      <MusicPlayer 
        playlist={playlist} 
        setPlaylist={handlePlaylistUpdate} 
        currentIndex={currentSongIndex} 
        setCurrentIndex={setCurrentSongIndex} 
        onSongEnd={handleSongEnd}
        autoPlayUnlocked={isContinuousPlayUnlocked}
      />

    </div>
  );
};

export default App;
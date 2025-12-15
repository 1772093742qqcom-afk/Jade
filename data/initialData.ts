import { StarData, Song } from '../types';

// Step 1: Put your images and music in a 'public/assets' folder.
// Step 2: Run the app, add your content via the UI.
// Step 3: Click the "EXPORT DATA" button in the bottom left.
// Step 4: Paste the console output BELOW this comment to replace these default variables.

export const STATIC_STARS: StarData[] = [
  // Example of what it will look like after you paste:
  /*
  {
    id: 0,
    position: [5, 2, 5],
    images: ["/assets/my-photo.jpg"], // Note: You must manually ensure file paths match your public folder
    text: "This is a permanent memory.",
    isActive: true,
    viewCount: 0
  }
  */
];

export const STATIC_PLAYLIST: Song[] = [
  /*
  {
    id: "song-1",
    name: "My Favorite Song",
    url: "/assets/music/my-song.mp3"
  }
  */
];

export const INITIAL_PLAYBACK_COUNT = 0;

/* Dateventure settings. This is the ONE file you edit after deploying the API.

   API_BASE:  the address of your API on Render, with no slash at the end.
              Example: "https://dateventure-api.onrender.com"
              Leave it empty ("") and the site runs in TEST MODE: everything works,
              but invitation links only open on the same device, and venue search is off.

   PHOTOS: decorative "mood" pictures (the dark banner at the top, and the small pictures on each step of the plan).
              They are NOT photos of the venue and are labelled that way. To turn them off, set each to ""
              and the app draws its own illustrations instead.

   MAPS_EMBED_KEY: optional. A Google "Maps Embed API" key (free to use) to show a small map
              on each venue page. Leave empty to skip the map. */
window.DV_CONFIG = {
  API_BASE: "https://dateventure-api.onrender.com",
  MAPS_EMBED_KEY: "",
  PHOTOS: {
    hero: "https://images.unsplash.com/photo-1513279922550-250c2129b13a?auto=format&fit=crop&w=1400&q=75",
    steps: {
      meet: "https://images.unsplash.com/photo-1555172375-56a199d6164d?auto=format&fit=crop&w=800&q=70",
      activity: "https://images.unsplash.com/photo-1513279922550-250c2129b13a?auto=format&fit=crop&w=800&q=70",
      food: "https://images.unsplash.com/photo-1569929233287-f0565228c4d4?auto=format&fit=crop&w=800&q=70",
      finale: "https://images.unsplash.com/photo-1575390130709-7b5fee2919e4?auto=format&fit=crop&w=800&q=70"
    }
  },
  SHOW_SAMPLE_VENUES: false,   // only the preview build turns this on
  FORCE_LOCAL: false,          // only the preview build turns this on
  DEBUG: false                 // add ?debug=1 to any address to turn on extra logging
};

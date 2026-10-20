/* Dateventure data: SAMPLE venues and ideas.

   - "ideas" work anywhere in the world and are always offered (free dates, picnics, food crawls...).
   - "venues" below are a small SAMPLE for Abuja. They are only shown in the preview build, so you can
     see what a venue card looks like without a server. On the live site, venues are NOT read from this
     file: they come from real map data near whatever place the person picks, anywhere in the world.
   - Sample venues were gathered from public Abuja guides (listedBy) and are all verified: false.
     Don't treat them as confirmed facts. Prices are rough levels (free, low, moderate, premium);
     the actual money ranges come from web/data/regions.js.
   - Photos: leave photos empty unless you have permission. Then add { src: "https://...", credit: "Photo: ..." }. */
(function (g) {
  var DV = (g.DV = g.DV || {});
  DV.data = DV.data || {};

  DV.data.venues = [
    {
      id: 'millennium-park', kind: 'venue', city: 'abuja', name: 'Millennium Park', area: 'Central Abuja', address: null,
      category: 'outdoors', tags: ['nature', 'picnics', 'photography', 'hiking', 'sunsets', 'quiet', 'outdoor-games'],
      band: 'free', vibe: ['Green', 'Relaxed', 'Open-air'], bestTime: 'afternoon', art: 'garden',
      hook: 'wander the paths, spread a blanket and take your time',
      placeQuery: 'Millennium Park Abuja', placeId: null, photos: [], verified: false,
      notes: 'Public guides list entry as free. Confirm on the day, as this can change.',
      listedBy: ['primebusiness.africa', 'wakaabuja.com']
    },
    {
      id: 'jabi-lake', kind: 'venue', city: 'abuja', name: 'Jabi Lake and Jabi Park', area: 'Jabi', address: 'Jabi District, lakefront',
      category: 'outdoors', tags: ['water', 'sunsets', 'nature', 'photography', 'picnics', 'quiet'],
      band: 'low', vibe: ['Breezy', 'Scenic', 'Golden hour'], bestTime: 'evening', art: 'lake',
      hook: 'walk the lakefront while the light turns golden',
      placeQuery: 'Jabi Lake Park Abuja', placeId: null, photos: [], verified: false,
      notes: 'Guides mention boat rides and kayaking at the lake. Prices depend on the operator.',
      listedBy: ['guardian.ng', 'wakaabuja.com']
    },
    {
      id: 'jabi-lake-mall', kind: 'venue', city: 'abuja', name: 'Jabi Lake Mall', area: 'Jabi', address: 'Bala Sokoto Way, Jabi',
      category: 'play', tags: ['movies', 'bowling', 'restaurants', 'cafes'],
      band: 'moderate', vibe: ['Easy', 'Indoors', 'Lakeside'], bestTime: 'evening', art: 'cinema',
      hook: 'pair a film or a game with dinner under one roof',
      placeQuery: 'Jabi Lake Mall Abuja', placeId: null, photos: [], verified: false,
      notes: 'Guides list a cinema, dining and leisure options. Check what is open right now.',
      listedBy: ['intercity.ng', 'guardian.ng']
    },
    {
      id: 'arts-crafts-village', kind: 'venue', city: 'abuja', name: 'Abuja Arts and Crafts Village', area: 'Jabi',
      address: 'Jabi District, Bala Sokoto Way',
      category: 'culture', tags: ['art', 'markets', 'local-culture', 'photography', 'workshops'],
      band: 'low', vibe: ['Colourful', 'Handmade', 'Browsing'], bestTime: 'afternoon', art: 'market',
      hook: 'browse handmade pieces and see what catches both your eyes',
      placeQuery: 'Arts and Crafts Village Jabi Abuja', placeId: null, photos: [], verified: false,
      notes: 'Listed by guides as a place to browse crafts. Opening hours not confirmed.',
      listedBy: ['primebusiness.africa', 'intercity.ng']
    },
    {
      id: 'magicland', kind: 'venue', city: 'abuja', name: 'Magicland Amusement Park', area: 'Abuja', address: null,
      category: 'play', tags: ['arcade', 'outdoor-games', 'photography'],
      band: 'low', vibe: ['Playful', 'Bright', 'Lively'], bestTime: 'afternoon', art: 'arcade',
      hook: 'ride, play and laugh like kids for an afternoon',
      placeQuery: 'Magicland Amusement Park Abuja', placeId: null, photos: [], verified: false,
      notes: 'Guides disagree about its exact location, so confirm the address first.',
      listedBy: ['intercity.ng', 'wakaabuja.com']
    },
    {
      id: 'trukadero', kind: 'venue', city: 'abuja', name: 'Trukadero Place', area: 'Abuja', address: null,
      category: 'play', tags: ['bowling', 'arcade'],
      band: 'moderate', vibe: ['Competitive', 'Playful', 'Social'], bestTime: 'evening', art: 'arcade',
      hook: 'trade friendly trash talk over a few games of bowling',
      placeQuery: 'Trukadero Place Abuja bowling', placeId: null, photos: [], verified: false,
      notes: 'Guides mention bowling lanes and arcade games. Confirm the address and prices.',
      listedBy: ['wakaabuja.com']
    },
    {
      id: 'the-dome', kind: 'venue', city: 'abuja', name: 'The Dome', area: 'Central Business District', address: null,
      category: 'play', tags: ['bowling', 'restaurants', 'cafes'],
      band: 'moderate', vibe: ['Grand', 'Social', 'Lively'], bestTime: 'evening', art: 'arcade',
      hook: 'bowl a few frames, then settle in for something to eat',
      placeQuery: 'The Dome Abuja', placeId: null, photos: [], verified: false,
      notes: 'Listed for bowling by a date-ideas guide. Confirm what is on.',
      listedBy: ['wakaabuja.com']
    },
    {
      id: 'the-pasha', kind: 'venue', city: 'abuja', name: 'The Pasha', area: 'Abuja', address: null,
      category: 'food', tags: ['restaurants', 'movies', 'quiet'],
      band: 'premium', vibe: ['Intimate', 'Stylish', 'Private'], bestTime: 'evening', art: 'cinema',
      hook: 'make an evening of it, with dinner and a private screening',
      placeQuery: 'The Pasha Abuja', placeId: null, photos: [], verified: false,
      notes: 'Guides list both a restaurant and private cinema bookings. Confirm what is available and how booking works.',
      listedBy: ['sabiabuja.com', 'wakaabuja.com']
    },
    {
      id: 'citypot', kind: 'venue', city: 'abuja', name: 'Citypot Restaurant', area: 'Wuse 2',
      address: 'Ademola Adetokunbo, Wuse 2 (opposite H-Medix)',
      category: 'food', tags: ['restaurants'],
      band: 'moderate', vibe: ['Cosy', 'Relaxed'], bestTime: 'evening', art: 'table',
      hook: 'settle in for a relaxed dinner for two',
      placeQuery: 'Citypot Restaurant Wuse 2 Abuja', placeId: null, photos: [], verified: false,
      notes: '', listedBy: ['wakaabuja.com', 'sabiabuja.com']
    },
    {
      id: 'carneval', kind: 'venue', city: 'abuja', name: 'Carneval Restaurant', area: 'Wuse 2',
      address: '2nd Floor, Mall 55, Kumasi Crescent, Wuse 2',
      category: 'food', tags: ['restaurants', 'cocktails'],
      band: 'moderate', vibe: ['Lively', 'Social'], bestTime: 'evening', art: 'table',
      hook: 'share a lively dinner with good energy around you',
      placeQuery: 'Carneval Restaurant Mall 55 Wuse 2 Abuja', placeId: null, photos: [], verified: false,
      notes: '', listedBy: ['wakaabuja.com']
    },
    {
      id: 'citro', kind: 'venue', city: 'abuja', name: 'Citro Abuja', area: 'Wuse 2', address: '4 Durban St, Wuse 2',
      category: 'food', tags: ['restaurants'],
      band: 'moderate', vibe: ['Easy-going', 'Stylish'], bestTime: 'evening', art: 'table',
      hook: 'order a few things to share and take it slow',
      placeQuery: 'Citro Abuja 4 Durban St Wuse 2', placeId: null, photos: [], verified: false,
      notes: '', listedBy: ['wakaabuja.com']
    },
    {
      id: 'ciao-italia', kind: 'venue', city: 'abuja', name: 'Ciao Italia', area: 'Wuse 2',
      address: '9 Ademola Adetokunbo Crescent, Wuse II',
      category: 'food', tags: ['restaurants', 'dancing'],
      band: 'moderate', vibe: ['Warm', 'Social', 'Danceable'], bestTime: 'evening', art: 'table',
      hook: 'dine first, then see whether it is a dance night',
      placeQuery: 'Ciao Italia Wuse 2 Abuja', placeId: null, photos: [], verified: false,
      notes: 'A nightlife guide lists a salsa night here. Confirm the days and times.',
      listedBy: ['wakaabuja.com']
    },
    {
      id: 'cafe-flour', kind: 'venue', city: 'abuja', name: 'Café Flour', area: 'Maitama',
      address: 'Capador Mall, Aguiyi Ironsi St, Maitama',
      category: 'cafe', tags: ['cafes', 'desserts', 'quiet'],
      band: 'low', vibe: ['Sweet', 'Calm'], bestTime: 'afternoon', art: 'dessert',
      hook: 'linger over something sweet and a proper catch-up',
      placeQuery: 'Cafe Flour Capador Mall Maitama Abuja', placeId: null, photos: [], verified: false,
      notes: '', listedBy: ['connectciti.com']
    },
    {
      id: 'salamander-cafe', kind: 'venue', city: 'abuja', name: 'Salamander Café', area: 'Wuse', address: '15b Parakou St, Wuse',
      category: 'cafe', tags: ['cafes', 'restaurants', 'quiet'],
      band: 'low', vibe: ['Cosy', 'Unhurried'], bestTime: 'afternoon', art: 'dessert',
      hook: 'grab a table, order something good and let the afternoon go slow',
      placeQuery: 'Salamander Cafe Parakou St Wuse Abuja', placeId: null, photos: [], verified: false,
      notes: '', listedBy: ['connectciti.com']
    },
    {
      id: 'mars-cafe', kind: 'venue', city: 'abuja', name: "Mar's Café", area: 'Wuse 2',
      address: '29 Kampala St, off Adetokunbo Ademola Cres, Wuse 2',
      category: 'cafe', tags: ['cafes', 'desserts', 'quiet'],
      band: 'low', vibe: ['Casual', 'Cosy'], bestTime: 'afternoon', art: 'dessert',
      hook: 'split a dessert and swap stories over coffee',
      placeQuery: "Mar's Cafe Kampala St Wuse 2 Abuja", placeId: null, photos: [], verified: false,
      notes: '', listedBy: ['connectciti.com']
    },
    {
      id: 'crush-cafe', kind: 'venue', city: 'abuja', name: 'Crush Café Abuja', area: 'Wuse', address: 'Sani Abacha Way, Wuse',
      category: 'cafe', tags: ['cafes', 'desserts'],
      band: 'low', vibe: ['Trendy', 'Light'], bestTime: 'afternoon', art: 'dessert',
      hook: 'try something new from the menu and compare notes',
      placeQuery: 'Crush Cafe Abuja', placeId: null, photos: [], verified: false,
      notes: 'The address in the guide may be approximate. Confirm it.', listedBy: ['sabiabuja.com']
    },
    {
      id: 'truck-central', kind: 'venue', city: 'abuja', name: 'Truck Central', area: 'Wuse', address: null,
      category: 'music', tags: ['live-music', 'cocktails', 'dancing'],
      band: 'moderate', vibe: ['Live', 'Buzzy', 'Late'], bestTime: 'evening', art: 'music',
      hook: 'catch a live band and let the night unfold',
      placeQuery: 'Truck Central Wuse Abuja', placeId: null, photos: [], verified: false,
      notes: 'A nightlife guide says live bands play most weekend evenings. Confirm the line-up and address.',
      listedBy: ['wakaabuja.com']
    },
    {
      id: 'blake-resort', kind: 'venue', city: 'abuja', name: 'Blake Resort', area: 'Garki', address: '1346 Ahmadu Bello Way, Garki',
      category: 'music', tags: ['live-music', 'dancing'],
      band: 'moderate', vibe: ['Lively', 'Social', 'Evening'], bestTime: 'evening', art: 'music',
      hook: 'go for a night of live music and a lively crowd',
      placeQuery: 'Blake Resort Garki Abuja', placeId: null, photos: [], verified: false,
      notes: 'Event listings place nights here. Confirm what is on before you go.', listedBy: ['pulsepicks']
    },
    {
      id: 'beer-barn', kind: 'venue', city: 'abuja', name: 'Beer Barn', area: 'Wuse 2', address: 'Plot 72, Aminu Kano Crescent, Wuse 2',
      category: 'music', tags: ['live-music', 'cocktails'],
      band: 'low', vibe: ['Casual', 'Chill', 'Music-friendly'], bestTime: 'evening', art: 'music',
      hook: 'sip something cold while a live act plays',
      placeQuery: 'Beer Barn Aminu Kano Crescent Wuse 2 Abuja', placeId: null, photos: [], verified: false,
      notes: 'Guides say live bands and acoustic sets happen on weekends. Confirm.', listedBy: ['wakaabuja.com', 'sabiabuja.com']
    },
    {
      id: 'piano-lounge', kind: 'venue', city: 'abuja', name: 'Piano Lounge', area: 'Maitama', address: '1 Aguiyi Ironsi St, Maitama',
      category: 'music', tags: ['live-music', 'cocktails', 'quiet'],
      band: 'moderate', vibe: ['Calm', 'Smart-casual', 'Late'], bestTime: 'evening', art: 'music',
      hook: 'unwind with soft live piano and a quiet drink',
      placeQuery: 'Piano Lounge Maitama Abuja', placeId: null, photos: [], verified: false,
      notes: 'The listing has few details. Confirm before you go.', listedBy: ['joinpearl.co']
    },
    {
      id: 'lupita-rooftop', kind: 'venue', city: 'abuja', name: 'Lupita Rooftop', area: 'Maitama',
      address: 'Lualaba Close, behind Belanova Hotel, Maitama',
      category: 'music', tags: ['sunsets', 'cocktails', 'live-music'],
      band: 'moderate', vibe: ['High up', 'Skyline', 'Evening'], bestTime: 'evening', art: 'skyline',
      hook: 'take in the skyline with a drink in hand',
      placeQuery: 'Lupita Rooftop Maitama Abuja', placeId: null, photos: [], verified: false,
      notes: 'A nightlife guide mentions skyline views and occasional live acts. Confirm.', listedBy: ['sabiabuja.com', 'wakaabuja.com']
    },
    {
      id: 'institut-francais', kind: 'venue', city: 'abuja', name: 'Institut Français du Nigéria', area: 'Maitama',
      address: 'Villa 7, Usuma Street, Maitama',
      category: 'culture', tags: ['art', 'local-culture'],
      band: 'low', vibe: ['Thoughtful', 'Cultural', 'Evening'], bestTime: 'evening', art: 'studio',
      hook: 'see a performance or exhibition together and talk it over after',
      placeQuery: 'Institut Francais du Nigeria Maitama Abuja', placeId: null, photos: [], verified: false,
      notes: 'Listed for theatre performances. Check the current programme.', listedBy: ['wakaabuja.com']
    }
  ];

  // Things that work in any city. They are suggestions, not businesses.
  DV.data.ideas = [
    { id: 'idea-sunset-picnic', kind: 'idea', name: 'Sunset picnic', category: 'idea', band: 'low',
      tags: ['picnics', 'sunsets', 'nature', 'photography', 'quiet'], vibe: ['Golden', 'Simple'], bestTime: 'evening', art: 'garden',
      hook: 'pack snacks, find a spot with a view and watch the sky change' },
    { id: 'idea-street-food-crawl', kind: 'idea', name: 'Street food crawl on foot', category: 'idea', band: 'low',
      tags: ['street-food', 'markets', 'local-culture'], vibe: ['Tasty', 'Wandering'], bestTime: 'evening', art: 'market',
      hook: 'share small plates from three different stalls' },
    { id: 'idea-dessert-crawl', kind: 'idea', name: 'Dessert tasting crawl', category: 'idea', band: 'low',
      tags: ['desserts', 'cafes'], vibe: ['Sweet', 'Playful'], bestTime: 'afternoon', art: 'dessert',
      hook: 'try one sweet thing at each of three spots and score them' },
    { id: 'idea-bookstore-coffee', kind: 'idea', name: 'Bookstore browse and coffee', category: 'idea', band: 'low',
      tags: ['bookstores', 'cafes', 'quiet'], vibe: ['Quiet', 'Curious'], bestTime: 'afternoon', art: 'studio',
      hook: 'pick a book for each other, then talk about why over coffee' },
    { id: 'idea-cook-together', kind: 'idea', name: 'Cook a new recipe together', category: 'idea', band: 'low',
      tags: ['cooking', 'quiet'], vibe: ['Cosy', 'Hands-on'], bestTime: 'evening', art: 'table',
      hook: 'choose something neither of you has made and share the chaos' },
    { id: 'idea-board-games', kind: 'idea', name: 'Board game night', category: 'idea', band: 'free',
      tags: ['board-games', 'quiet'], vibe: ['Playful', 'Competitive'], bestTime: 'evening', art: 'table',
      hook: 'play two rounds of something, loser picks the snack' },
    { id: 'idea-photo-walk', kind: 'idea', name: 'Photo walk', category: 'idea', band: 'free',
      tags: ['photography', 'hiking', 'nature', 'sunsets'], vibe: ['Creative', 'Outdoors'], bestTime: 'afternoon', art: 'lake',
      hook: 'wander somewhere new and take turns photographing each other' },
    { id: 'idea-craft-class', kind: 'idea', name: 'Pottery or craft class', category: 'idea', band: 'moderate',
      tags: ['pottery', 'workshops', 'art'], vibe: ['Hands-on', 'Creative'], bestTime: 'afternoon', art: 'studio',
      hook: 'make something with your hands and keep it' },
    { id: 'idea-karaoke', kind: 'idea', name: 'Karaoke night', category: 'idea', band: 'free',
      tags: ['karaoke', 'live-music', 'dancing'], vibe: ['Loud', 'Silly'], bestTime: 'evening', art: 'music',
      hook: 'trade songs, no judging, duets mandatory' },
    { id: 'idea-museum', kind: 'idea', name: 'Museum or gallery afternoon', category: 'idea', band: 'low',
      tags: ['museums', 'art', 'local-culture'], vibe: ['Curious', 'Unhurried'], bestTime: 'afternoon', art: 'studio',
      hook: 'each pick a favourite piece and explain your choice' },
    { id: 'idea-market-morning', kind: 'idea', name: 'Market morning', category: 'idea', band: 'low',
      tags: ['markets', 'street-food', 'local-culture', 'photography'], vibe: ['Busy', 'Colourful'], bestTime: 'morning', art: 'market',
      hook: 'wander the stalls and buy one surprise for each other' },
    { id: 'idea-stargazing', kind: 'idea', name: 'Stargazing', category: 'idea', band: 'free',
      tags: ['sunsets', 'quiet', 'nature', 'photography'], vibe: ['Calm', 'Wide-open'], bestTime: 'evening', art: 'skyline',
      hook: 'find somewhere dark, lie back and make up constellations' },
    { id: 'idea-movie-night', kind: 'idea', name: 'Movie night in', category: 'idea', band: 'free',
      tags: ['movies', 'quiet', 'desserts'], vibe: ['Cosy', 'Easy'], bestTime: 'evening', art: 'cinema',
      hook: 'take turns choosing, and make a dessert to go with it' },
    { id: 'idea-outdoor-games', kind: 'idea', name: 'Outdoor games afternoon', category: 'idea', band: 'free',
      tags: ['outdoor-games', 'nature', 'picnics'], vibe: ['Active', 'Playful'], bestTime: 'afternoon', art: 'garden',
      hook: 'bring a ball or a frisbee and keep score' },
    { id: 'idea-spa-evening', kind: 'idea', name: 'At-home spa evening', category: 'idea', band: 'low',
      tags: ['spa', 'quiet'], vibe: ['Gentle', 'Pampering'], bestTime: 'evening', art: 'table',
      hook: 'face masks, soft music and nowhere to be' },
    { id: 'idea-dance-night', kind: 'idea', name: 'Dance in the living room', category: 'idea', band: 'free',
      tags: ['dancing', 'live-music', 'karaoke'], vibe: ['Silly', 'Warm'], bestTime: 'evening', art: 'music',
      hook: 'build a playlist together and dance like nobody is watching' }
  ];

  if (typeof module !== 'undefined' && module.exports) module.exports = DV.data;
})(typeof window !== 'undefined' ? window : globalThis);

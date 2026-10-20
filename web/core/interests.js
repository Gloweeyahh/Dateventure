/* Dateventure core: the list of interests people can pick, plus a tiny "add your own" matcher. */
(function (g) {
  var DV = (g.DV = g.DV || {});

  var GROUPS = [
    { id: 'food', label: 'Food and drinks', tint: 'blush' },
    { id: 'outdoors', label: 'Outdoors and adventure', tint: 'butter' },
    { id: 'creative', label: 'Creative things', tint: 'lav' },
    { id: 'play', label: 'Play and nights out', tint: 'blush' },
    { id: 'relax', label: 'Slow and relaxing', tint: 'butter' },
    { id: 'culture', label: 'Culture and discovery', tint: 'lav' }
  ];

  var LIST = [
    ['restaurants', 'Trying new restaurants', 'food'], ['street-food', 'Street food', 'food'],
    ['cafes', 'Cafés and coffee', 'food'], ['desserts', 'Desserts', 'food'],
    ['cocktails', 'Cocktails and lounges', 'food'], ['cooking', 'Cooking or baking together', 'food'],
    ['nature', 'Parks and nature', 'outdoors'], ['picnics', 'Picnics', 'outdoors'],
    ['sunsets', 'Sunsets and views', 'outdoors'], ['water', 'Lakes, beaches and boats', 'outdoors'],
    ['hiking', 'Hiking and walks', 'outdoors'], ['outdoor-games', 'Outdoor games', 'outdoors'],
    ['art', 'Art and galleries', 'creative'], ['pottery', 'Pottery and crafts', 'creative'],
    ['photography', 'Photography', 'creative'], ['workshops', 'DIY workshops', 'creative'],
    ['arcade', 'Arcades and games', 'play'], ['bowling', 'Bowling', 'play'], ['movies', 'Movies', 'play'],
    ['live-music', 'Live music', 'play'], ['comedy', 'Comedy', 'play'], ['karaoke', 'Karaoke', 'play'],
    ['dancing', 'Dancing', 'play'], ['board-games', 'Board games', 'play'],
    ['spa', 'Spa and pampering', 'relax'], ['quiet', 'Quiet, low-key time', 'relax'],
    ['museums', 'Museums', 'culture'], ['markets', 'Markets', 'culture'],
    ['bookstores', 'Bookstores', 'culture'], ['local-culture', 'Local culture and history', 'culture']
  ].map(function (r) { return { id: r[0], label: r[1], group: r[2] }; });

  var BY_ID = {};
  LIST.forEach(function (i) { BY_ID[i.id] = i; });

  // Words people might type -> interest id.
  var SYNONYMS = {
    sushi: 'restaurants', pizza: 'restaurants', 'fine dining': 'restaurants', dinner: 'restaurants', brunch: 'restaurants',
    coffee: 'cafes', tea: 'cafes', cake: 'desserts', 'ice cream': 'desserts', pastry: 'desserts',
    jazz: 'live-music', concert: 'live-music', band: 'live-music', music: 'live-music', bar: 'cocktails', wine: 'cocktails',
    drinks: 'cocktails', baking: 'cooking', beach: 'water', lake: 'water', boat: 'water', kayak: 'water', swim: 'water',
    sunset: 'sunsets', view: 'sunsets', rooftop: 'sunsets', park: 'nature', garden: 'nature', walk: 'hiking', hike: 'hiking',
    gallery: 'art', painting: 'art', craft: 'pottery', photo: 'photography', camera: 'photography',
    gaming: 'arcade', 'video games': 'arcade', cinema: 'movies', film: 'movies', standup: 'comedy',
    'stand up': 'comedy', sing: 'karaoke', dance: 'dancing', salsa: 'dancing', chess: 'board-games', cards: 'board-games',
    massage: 'spa', relax: 'quiet', calm: 'quiet', museum: 'museums', market: 'markets', shopping: 'markets', books: 'bookstores',
    reading: 'bookstores', history: 'local-culture', culture: 'local-culture', theatre: 'local-culture', theater: 'local-culture'
  };

  // Turn something a person typed into a known interest id (or null).
  function matchCustom(text) {
    var t = DV.util.norm(text);
    var i;
    if (!t) return null;
    if (BY_ID[t]) return t;
    for (i = 0; i < LIST.length; i++) if (DV.util.norm(LIST[i].label) === t) return LIST[i].id;
    if (SYNONYMS[t]) return SYNONYMS[t];
    var keys = Object.keys(SYNONYMS);
    for (i = 0; i < keys.length; i++) {
      var re = new RegExp('(^|[^a-z])' + keys[i] + '([^a-z]|$)');
      if (re.test(t)) return SYNONYMS[keys[i]];
    }
    for (i = 0; i < LIST.length; i++) {
      if (t.length >= 4 && DV.util.norm(LIST[i].label).indexOf(t) !== -1) return LIST[i].id;
    }
    return null;
  }

  function label(id) { return BY_ID[id] ? BY_ID[id].label : id; }

  DV.interests = { groups: GROUPS, list: LIST, byId: BY_ID, matchCustom: matchCustom, label: label };
  if (typeof module !== 'undefined' && module.exports) module.exports = DV.interests;
})(typeof window !== 'undefined' ? window : globalThis);

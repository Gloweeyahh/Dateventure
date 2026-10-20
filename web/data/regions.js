/* Dateventure data: price levels, and a built-in city list.

   REGIONS (optional): a place where you want your own price levels, in that place's own currency.
     bands = what a date for TWO people usually costs. These are ESTIMATES. Change them any time.
     Anywhere without a region uses genericBandsUSD below, scaled for how pricey that country is.
     (The sample venues in web/data/venues.js belong to the Abuja region and are only used in the preview.)

   CITIES: a small built-in list so the location box works instantly, even offline.
     When the API is connected, the location box can also search any place in the world. */
(function (g) {
  var DV = (g.DV = g.DV || {});
  DV.data = DV.data || {};

  DV.data.regions = [
    {
      id: 'abuja',
      name: 'Abuja',
      country: 'NG',
      currency: 'NGN',
      lat: 9.0765,
      lon: 7.3986,
      radiusKm: 45,
      aliases: ['abuja', 'fct', 'federal capital territory', 'wuse', 'maitama', 'garki', 'jabi', 'gwarinpa',
        'asokoro', 'utako', 'lugbe', 'kubwa', 'apo', 'katampe', 'life camp', 'guzape', 'mabushi', 'central area'],
      bandsAreEstimates: true,
      bands: {
        free: [0, 0],
        low: [3000, 15000],
        moderate: [15000, 45000],
        premium: [45000, 150000]
      }
    }
  ];

  // Used when a place has no region of its own: converted from these USD ranges.
  DV.data.genericBandsUSD = {
    free: [0, 0],
    low: [8, 25],
    moderate: [25, 70],
    premium: [70, 200]
  };

  DV.data.cities = [
    ['Abuja', 'Nigeria', 'NG', 9.0765, 7.3986], ['Lagos', 'Nigeria', 'NG', 6.5244, 3.3792],
    ['Port Harcourt', 'Nigeria', 'NG', 4.8156, 7.0498], ['Ibadan', 'Nigeria', 'NG', 7.3775, 3.947],
    ['Kano', 'Nigeria', 'NG', 12.0022, 8.592], ['Enugu', 'Nigeria', 'NG', 6.4584, 7.5464],
    ['Accra', 'Ghana', 'GH', 5.6037, -0.187], ['Kumasi', 'Ghana', 'GH', 6.6885, -1.6244],
    ['Nairobi', 'Kenya', 'KE', -1.2921, 36.8219], ['Kampala', 'Uganda', 'UG', 0.3476, 32.5825],
    ['Kigali', 'Rwanda', 'RW', -1.9441, 30.0619], ['Dar es Salaam', 'Tanzania', 'TZ', -6.7924, 39.2083],
    ['Johannesburg', 'South Africa', 'ZA', -26.2041, 28.0473], ['Cape Town', 'South Africa', 'ZA', -33.9249, 18.4241],
    ['Cairo', 'Egypt', 'EG', 30.0444, 31.2357], ['Dakar', 'Senegal', 'SN', 14.7167, -17.4677],
    ['Abidjan', "Côte d'Ivoire", 'CI', 5.36, -4.0083], ['London', 'United Kingdom', 'GB', 51.5074, -0.1278],
    ['Manchester', 'United Kingdom', 'GB', 53.4808, -2.2426], ['New York', 'United States', 'US', 40.7128, -74.006],
    ['Los Angeles', 'United States', 'US', 34.0522, -118.2437], ['Houston', 'United States', 'US', 29.7604, -95.3698],
    ['Atlanta', 'United States', 'US', 33.749, -84.388], ['Toronto', 'Canada', 'CA', 43.6532, -79.3832],
    ['Dubai', 'United Arab Emirates', 'AE', 25.2048, 55.2708], ['Mumbai', 'India', 'IN', 19.076, 72.8777],
    ['Delhi', 'India', 'IN', 28.6139, 77.209], ['Paris', 'France', 'FR', 48.8566, 2.3522],
    ['Berlin', 'Germany', 'DE', 52.52, 13.405], ['Sydney', 'Australia', 'AU', -33.8688, 151.2093],
    ['Singapore', 'Singapore', 'SG', 1.3521, 103.8198]
  ].map(function (c) {
    return { name: c[0], country: c[1], cc: c[2], lat: c[3], lon: c[4], label: c[0] + ', ' + c[1] };
  });
})(typeof window !== 'undefined' ? window : globalThis);

/* Dateventure core: currencies, country -> currency, budget sliders.
   NOTE: perUSD rates are rough guides used only to size the budget slider and to convert
   price levels in places where we have no price data. Update them whenever you like. */
(function (g) {
  var DV = (g.DV = g.DV || {});

  // code: [symbol, name, perUSD (approx)]
  var T = {
    USD: ['$', 'US dollar', 1], NGN: ['₦', 'Nigerian naira', 1550], GHS: ['GH₵', 'Ghanaian cedi', 12],
    KES: ['KSh ', 'Kenyan shilling', 129], ZAR: ['R', 'South African rand', 18], GBP: ['£', 'British pound', 0.78],
    EUR: ['€', 'Euro', 0.92], CAD: ['CA$', 'Canadian dollar', 1.37], AUD: ['A$', 'Australian dollar', 1.52],
    NZD: ['NZ$', 'New Zealand dollar', 1.65], INR: ['₹', 'Indian rupee', 85], AED: ['AED ', 'UAE dirham', 3.67],
    SAR: ['SAR ', 'Saudi riyal', 3.75], QAR: ['QAR ', 'Qatari riyal', 3.64], EGP: ['E£', 'Egyptian pound', 50],
    MAD: ['MAD ', 'Moroccan dirham', 9.8], TZS: ['TSh ', 'Tanzanian shilling', 2600], UGX: ['USh ', 'Ugandan shilling', 3600],
    RWF: ['RF ', 'Rwandan franc', 1400], XOF: ['CFA ', 'West African CFA franc', 600], XAF: ['FCFA ', 'Central African CFA franc', 600],
    ETB: ['Br ', 'Ethiopian birr', 130], ZMW: ['ZK', 'Zambian kwacha', 26], BWP: ['P', 'Botswana pula', 13.6],
    BRL: ['R$', 'Brazilian real', 5.6], MXN: ['MX$', 'Mexican peso', 19], ARS: ['AR$', 'Argentine peso', 1000],
    COP: ['COL$', 'Colombian peso', 4100], CLP: ['CLP ', 'Chilean peso', 950], JPY: ['¥', 'Japanese yen', 150],
    CNY: ['CN¥', 'Chinese yuan', 7.2], KRW: ['₩', 'South Korean won', 1380], SGD: ['S$', 'Singapore dollar', 1.3],
    MYR: ['RM', 'Malaysian ringgit', 4.3], PHP: ['₱', 'Philippine peso', 57], IDR: ['Rp', 'Indonesian rupiah', 16000],
    THB: ['฿', 'Thai baht', 34], VND: ['₫', 'Vietnamese dong', 25000], PKR: ['Rs ', 'Pakistani rupee', 280],
    BDT: ['৳', 'Bangladeshi taka', 120], LKR: ['Rs ', 'Sri Lankan rupee', 300], TRY: ['₺', 'Turkish lira', 40],
    CHF: ['CHF ', 'Swiss franc', 0.85], SEK: ['kr ', 'Swedish krona', 10], NOK: ['kr ', 'Norwegian krone', 10.5],
    DKK: ['kr ', 'Danish krone', 6.9], PLN: ['zł', 'Polish złoty', 3.9], CZK: ['Kč', 'Czech koruna', 22],
    HUF: ['Ft', 'Hungarian forint', 360], ILS: ['₪', 'Israeli shekel', 3.6], JMD: ['J$', 'Jamaican dollar', 157],
    TTD: ['TT$', 'Trinidad & Tobago dollar', 6.8]
  };

  // ISO country code -> currency
  var C = {
    NG: 'NGN', GH: 'GHS', KE: 'KES', ZA: 'ZAR', GB: 'GBP', US: 'USD', CA: 'CAD', AU: 'AUD', NZ: 'NZD', IN: 'INR',
    AE: 'AED', SA: 'SAR', QA: 'QAR', EG: 'EGP', MA: 'MAD', TZ: 'TZS', UG: 'UGX', RW: 'RWF', ET: 'ETB', ZM: 'ZMW',
    BW: 'BWP', BR: 'BRL', MX: 'MXN', AR: 'ARS', CO: 'COP', CL: 'CLP', JP: 'JPY', CN: 'CNY', KR: 'KRW', SG: 'SGD',
    MY: 'MYR', PH: 'PHP', ID: 'IDR', TH: 'THB', VN: 'VND', PK: 'PKR', BD: 'BDT', LK: 'LKR', TR: 'TRY', CH: 'CHF',
    SE: 'SEK', NO: 'NOK', DK: 'DKK', PL: 'PLN', CZ: 'CZK', HU: 'HUF', IL: 'ILS', JM: 'JMD', TT: 'TTD',
    SN: 'XOF', CI: 'XOF', BJ: 'XOF', BF: 'XOF', ML: 'XOF', TG: 'XOF', NE: 'XOF', GW: 'XOF',
    CM: 'XAF', GA: 'XAF', CG: 'XAF', TD: 'XAF', CF: 'XAF', GQ: 'XAF',
    DE: 'EUR', FR: 'EUR', ES: 'EUR', IT: 'EUR', NL: 'EUR', BE: 'EUR', PT: 'EUR', IE: 'EUR', AT: 'EUR', FI: 'EUR',
    GR: 'EUR', LU: 'EUR', SK: 'EUR', SI: 'EUR', EE: 'EUR', LV: 'EUR', LT: 'EUR', MT: 'EUR', CY: 'EUR', HR: 'EUR'
  };

  // Rough "how pricey is a night out here compared with the US" (1 = same as the US).
  // Used only to size price ESTIMATES for places we have no price data for. Adjust freely.
  var PPP = {
    NG: 0.55, GH: 0.6, KE: 0.6, ZA: 0.65, EG: 0.4, MA: 0.55, TZ: 0.5, UG: 0.5, RW: 0.55, ET: 0.4, SN: 0.6, CI: 0.6,
    ZM: 0.5, BW: 0.6, IN: 0.4, PK: 0.35, BD: 0.4, LK: 0.45, ID: 0.45, PH: 0.5, TH: 0.55, VN: 0.4, MY: 0.55, CN: 0.6,
    JP: 0.85, KR: 0.85, SG: 1.0, BR: 0.6, MX: 0.6, AR: 0.5, CO: 0.5, CL: 0.65, TR: 0.5, PL: 0.65, CZ: 0.7, HU: 0.65,
    GB: 1.0, US: 1.0, CA: 0.95, AU: 1.0, NZ: 0.95, DE: 0.95, FR: 0.95, ES: 0.85, IT: 0.9, NL: 0.95, AE: 0.85,
    SA: 0.75, QA: 0.85, IL: 1.0, CH: 1.4, SE: 1.0, NO: 1.3, DK: 1.2, IE: 1.0, PT: 0.8, GR: 0.8, JM: 0.7, TT: 0.7
  };

  function ppp(cc) { return PPP[String(cc || '').toUpperCase()] || 0.8; }

  // Sensible slider ranges where plain maths from the USD rate would feel wrong.
  var SCALE_OVERRIDES = {
    NGN: { min: 2000, max: 200000, step: 1000, def: 30000 },
    GHS: { min: 50, max: 3000, step: 10, def: 400 },
    KES: { min: 500, max: 30000, step: 100, def: 5000 }
  };

  function info(code) {
    var row = T[code];
    if (!row) return null;
    return { code: code, symbol: row[0], name: row[1], perUSD: row[2] };
  }

  function forCountry(cc) {
    return C[String(cc || '').toUpperCase()] || 'USD';
  }

  function list() {
    return Object.keys(T).map(info).sort(function (a, b) { return a.name.localeCompare(b.name); });
  }

  function format(amount, code) {
    var i = info(code) || { symbol: '' };
    var n = Math.round(Number(amount) || 0);
    return i.symbol + DV.util.groupThousands(n);
  }

  function convert(amount, from, to) {
    if (from === to) return amount;
    var a = info(from), b = info(to);
    if (!a || !b) return amount;
    return (amount / a.perUSD) * b.perUSD;
  }

  function budgetScale(code) {
    if (SCALE_OVERRIDES[code]) return Object.assign({}, SCALE_OVERRIDES[code]);
    var i = info(code) || info('USD');
    var u = DV.util;
    return {
      min: u.niceRound(i.perUSD * 5),
      max: u.niceRound(i.perUSD * 400),
      step: Math.max(1, u.niceRound(i.perUSD * 1)),
      def: u.niceRound(i.perUSD * 60)
    };
  }

  DV.currencies = {
    info: info, forCountry: forCountry, list: list, format: format, convert: convert,
    budgetScale: budgetScale, table: T, ppp: ppp
  };
  if (typeof module !== 'undefined' && module.exports) module.exports = DV.currencies;
})(typeof window !== 'undefined' ? window : globalThis);

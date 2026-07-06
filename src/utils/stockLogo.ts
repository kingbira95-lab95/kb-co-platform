// Maps NGX stock symbols to company domains for Clearbit logo API
const LOGO_DOMAINS: Record<string, string> = {
  // Banking
  ABBEYBANK:   'abbeymortgagebank.com.ng',
  ACCESSCORP:  'accessbankplc.com',
  ETI:         'ecobank.com',
  FCMB:        'fcmb.com',
  FIDELITYBK:  'fidelitybank.ng',
  FIRSTHOLDCO: 'firstbankng.com',
  GTCO:        'gtcoplc.com',
  JAIZBANK:    'jaizbank.com',
  STANBIC:     'stanbicibtcbank.com',
  STERLINGNG:  'sterling.ng',
  UBA:         'ubagroup.com',
  WEMABANK:    'wemabank.com',
  ZENITHBANK:  'zenithbank.com',

  // Telecoms
  AIRTELAFRI:  'airtelafrica.com',
  MTNN:        'mtnonline.com',

  // Oil & Gas / Energy
  ARADEL:      'aradelholdings.com',
  CONOIL:      'conoil.com.ng',
  ETERNA:      'eternaplc.com',
  SEPLAT:      'seplatpetroleum.com',
  UPL:         'unipetrolng.com',

  // Cement / Construction
  BUACEMENT:   'buacement.com',
  DANGCEM:     'dangotecement.com',
  JBERGER:     'julius-berger.com',
  WAPCO:       'lafargeafrica.com',

  // Consumer Goods / FMCG
  BUAFOODS:    'buafoods.com.ng',
  CADBURY:     'cadbury.com',
  CHAMPION:    'championbreweries.com',
  DANGSUGAR:   'dangotesugar.com.ng',
  GUINNESS:    'guinness-nigeria.com',
  HONYFLOUR:   'honeywellflour.com',
  INTBREW:     'intbreweriesplc.com',
  NASCON:      'nasconallied.com',
  NB:          'nbplc.com',
  NESTLE:      'nestle.com.ng',
  NNFM:        'flourmills.com.ng',
  PZ:          'pzcussons.com',
  UNILEVER:    'unilever.com.ng',
  UACN:        'uacnigeria.com',

  // Agriculture
  FTNCOCOA:    'ftncocoa.com',
  OKOMUOIL:    'okomuoil.com',
  PRESCO:      'prescoplc.com',

  // Insurance
  AIICO:       'aiicoplc.com',
  CONHALLPLC:  'consolidatedhallmark.com',
  CORNERST:    'cornerstoneinsuranceplc.com',
  CUSTODIAN:   'custodianinvestmentplc.com',
  MANSARD:     'mansardinsurance.com',
  NEM:         'neminsurance.com',
  WAPIC:       'wapicinsurance.com',

  // Technology / Fintech
  CWG:         'cwgplc.com',
  ETRANZACT:   'etranzact.com',
  NGXGROUP:    'ngxgroup.com',

  // Healthcare / Pharma
  FIDSON:      'fidsonhealthcare.com',
  MAYBAKER:    'maybaker-nigeria.com',
  NEIMETH:     'neimethpharma.com',

  // Industrial / Manufacturing
  BETAGLAS:    'betaglas.com',
  BERGER:      'bergerpaints.com.ng',
  CAP:         'capaints.com.ng',
  VITAFOAM:    'vitafoamng.com',

  // Transport / Logistics
  ABCTRANS:    'abctrans.com.ng',
  NAHCO:       'nahcoaviance.com',
  REDSTAREX:   'redstarexpress.com',

  // Hospitality / Hotels
  IKEJAHOTEL:  'transcorphotels.com',
  TRANSCOHOT:  'transcorphotels.com',

  // Real Estate / Property
  UPDC:        'updcplc.com',

  // Financial Services
  AFRIPRUD:    'africaprudential.com',
};

/**
 * Returns a Clearbit logo URL for a given NGX stock symbol.
 * Falls back to deriving the domain from the stock's website field.
 * Returns null if no domain is known.
 */
export function getStockLogoUrl(symbol: string, website?: string): string | null {
  const domain = LOGO_DOMAINS[symbol];
  if (domain) return `https://logo.clearbit.com/${domain}`;

  if (website) {
    const clean = website
      .replace(/^https?:\/\//, '')
      .replace(/^www\./, '')
      .split('/')[0];
    if (clean) return `https://logo.clearbit.com/${clean}`;
  }

  return null;
}
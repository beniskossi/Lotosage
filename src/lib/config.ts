
export interface DrawTimeDetails {
  name: string;
  slug: string;
}

export interface DrawDayDetails {
  [time: string]: DrawTimeDetails;
}

export interface DrawSchedule {
  [day: string]: DrawDayDetails;
}

export const DRAW_SCHEDULE: DrawSchedule = {
  Lundi: {
    '10H': { name: 'Réveil', slug: 'reveil' },
    '13H': { name: 'Étoile', slug: 'etoile' },
    '16H': { name: 'Akwaba', slug: 'akwaba' },
    '18H15': { name: 'Monday Special', slug: 'monday-special' },
  },
  Mardi: {
    '10H': { name: 'La Matinale', slug: 'la-matinale' },
    '13H': { name: 'Émergence', slug: 'emergence' },
    '16H': { name: 'Sika', slug: 'sika' },
    '18H15': { name: 'Lucky Tuesday', slug: 'lucky-tuesday' },
  },
  Mercredi: {
    '10H': { name: 'Première Heure', slug: 'premiere-heure' },
    '13H': { name: 'Fortune', slug: 'fortune' },
    '16H': { name: 'Baraka', slug: 'baraka' },
    '18H15': { name: 'Midweek', slug: 'midweek' },
  },
  Jeudi: {
    '10H': { name: 'Kado', slug: 'kado' },
    '13H': { name: 'Privilège', slug: 'privilege' },
    '16H': { name: 'Monni', slug: 'monni' },
    '18H15': { name: 'Fortune Thursday', slug: 'fortune-thursday' },
  },
  Vendredi: {
    '10H': { name: 'Espèces', slug: 'especes' },
    '13H': { name: 'Solution', slug: 'solution' },
    '16H': { name: 'Wari', slug: 'wari' },
    '18H15': { name: 'Friday Bonanza', slug: 'friday-bonanza' },
  },
  Samedi: {
    '10H': { name: 'Soutra', slug: 'soutra' },
    '13H': { name: 'Diamant', slug: 'diamant' },
    '16H': { name: 'Moaye', slug: 'moaye' },
    '18H15': { name: 'National', slug: 'national' },
  },
  Dimanche: {
    '10H': { name: 'Bénédiction', slug: 'benediction' },
    '13H': { name: 'Prestige', slug: 'prestige' },
    '16H': { name: 'Awalé', slug: 'awale' },
    '18H15': { name: 'Espoir', slug: 'espoir' },
  },
};

// This is the DRAW_SCHEDULE used by the API fetching logic.
// It's important to map this to the display names if they differ.
export const API_DRAW_SCHEDULE = {
  Lundi: {
    '10H': 'Reveil',
    '13H': 'Etoile',
    '16H': 'Akwaba',
    '18H15': 'Monday Special',
  },
  Mardi: {
    '10H': 'La Matinale',
    '13H': 'Emergence',
    '16H': 'Sika',
    '18H15': 'Lucky Tuesday',
  },
  Mercredi: {
    '10H': 'Premiere Heure',
    '13H': 'Fortune',
    '16H': 'Baraka',
    '18H15': 'Midweek',
  },
  Jeudi: {
    '10H': 'Kado',
    '13H': 'Privilege',
    '16H': 'Monni',
    '18H15': 'Fortune Thursday',
  },
  Vendredi: {
    '10H': 'Cash', // Display name is "Espèces", API name is "Cash"
    '13H': 'Solution',
    '16H': 'Wari',
    '18H15': 'Friday Bonanza',
  },
  Samedi: {
    '10H': 'Soutra',
    '13H': 'Diamant',
    '16H': 'Moaye',
    '18H15': 'National',
  },
  Dimanche: {
    '10H': 'Benediction',
    '13H': 'Prestige',
    '16H': 'Awale',
    '18H15': 'Espoir',
  },
};


export interface FlatDrawCategory {
  day: string;
  time: string;
  name: string;
  slug: string;
  apiName: string;
}

export const ALL_DRAW_CATEGORIES: FlatDrawCategory[] = Object.entries(DRAW_SCHEDULE).flatMap(([day, times]) =>
  Object.entries(times).map(([time, details]) => {
    // Find the corresponding API name
    const apiDaySchedule = API_DRAW_SCHEDULE[day as keyof typeof API_DRAW_SCHEDULE];
    const apiName = apiDaySchedule ? apiDaySchedule[time as keyof typeof apiDaySchedule] : details.name;
    return {
        day,
        time,
        name: details.name,
        slug: details.slug,
        apiName: apiName,
    };
  })
);

export function getDrawCategoryBySlug(slug: string): FlatDrawCategory | undefined {
  return ALL_DRAW_CATEGORIES.find(category => category.slug === slug);
}

export function getDrawCategoryByApiName(apiName: string): FlatDrawCategory | undefined {
  return ALL_DRAW_CATEGORIES.find(category => category.apiName === apiName);
}

export const MONTH_NAMES_FR_TO_EN: { [key: string]: string } = {
  janvier: 'january',
  février: 'february',
  mars: 'march',
  avril: 'april',
  mai: 'may',
  juin: 'june',
  juillet: 'july',
  août: 'august',
  septembre: 'september',
  octobre: 'october',
  novembre: 'november',
  décembre: 'december',
};

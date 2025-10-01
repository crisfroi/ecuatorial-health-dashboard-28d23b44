export const ENABLE_INTERACTIVE_TOURS = true;

export const TOURS_STORAGE_KEYS = {
  home: 'tour_home_completed',
  publicSearch: 'tour_public_search_completed',
  dashboard: 'tour_dashboard_completed',
} as const;

type TourKeys = keyof typeof TOURS_STORAGE_KEYS;
export const isTourCompleted = (key: TourKeys): boolean => {
  try {
    return localStorage.getItem(TOURS_STORAGE_KEYS[key]) === 'true';
  } catch {
    return false;
  }
};

export const setTourCompleted = (key: TourKeys): void => {
  try {
    localStorage.setItem(TOURS_STORAGE_KEYS[key], 'true');
  } catch {}
};

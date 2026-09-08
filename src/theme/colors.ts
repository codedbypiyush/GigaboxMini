export const colors = {
  // Brand Core & Splash
  splashBackground: '#FFC107',
  headerBackground: '#000000',
  primaryButton: '#000000',
  primaryButtonText: '#FFFFFF',

  // Action / Quick Commerce
  actionGreen: '#16A34A',
  actionGreenLight: '#DCFCE7',
  actionGreenBorder: '#22C55E',
  discountBadgeText: '#15803D',

  // Accents & Category Highlights
  navyStore: '#0A3641',
  warmBanner: '#FEF6E4',
  accentToys: '#E11D48',
  accentElectronics: '#4F46E5',
  accentHome: '#D97706',

  // Neutrals & Surfaces
  background: '#FFFFFF',
  surfaceSecondary: '#F8F9FA',
  inputBackground: '#F3F4F6',
  border: '#E5E7EB',

  // Typography
  textPrimary: '#111827',
  textSecondary: '#6B7280',
  textMuted: '#9CA3AF',
  textOnDark: '#FFFFFF',
} as const;

export type ColorName = keyof typeof colors;

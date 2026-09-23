export interface ArticleItem {
  id: string;
  ref: string;
  name: string;
  imageUrl: string;
  imageFit?: 'cover' | 'contain';
  folder?: string; // e.g. "Antiquités", "Halloween"
  category?: string;
  material: string;
  periodOrStyle: string;
  condition: string;
  dimensions?: string;
  quantity: string; // e.g. "1 unit.", "Lot de 4", "Paire (2 unit.)"
  price?: string; // e.g. "450 €"
  notes?: string;
}

export type LayoutMode = '2-per-page' | '1-per-page' | '4-per-page' | '3-horizontal';

export type ThemeId = 'clair' | 'fonce' | 'sepia' | 'bordeaux' | 'sauge' | 'monochrome' | 'lin';

export interface ColorTheme {
  id: ThemeId;
  name: string;
  bgColor: string;
  cardBg: string;
  textColor: string;
  mutedTextColor: string;
  accentColor: string;
  borderColor: string;
  headerAccent: string;
  badgeBg: string;
  badgeText: string;
}

export interface CatalogConfig {
  mainTitle: string;
  subtitle: string;
  collection?: string; // e.g. "Halloween"
  activeFolder?: string; // e.g. "Halloween" or "Antiquités" or "all"
  folders?: string[]; // list of existing folders e.g. ["Antiquités", "Halloween"]
  contactInfo: string;
  dateStr: string;
  catalogRef: string;
  layoutMode: LayoutMode;
  themeId: ThemeId;
  showPrices: boolean;
  showDimensions: boolean;
  showReference: boolean;
  headerEveryPage: boolean;
  notesFooter: string;
  cleanScanEffect?: boolean;
  uiDarkMode?: boolean;
}

export type UserRole = 'admin' | 'approved' | 'pending' | 'rejected';

export interface UserProfile {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  role?: UserRole;
}

export interface UserApprovalRequest {
  uid: string;
  email: string;
  displayName: string;
  photoURL?: string;
  status: UserRole;
  requestedAt: string;
  reviewedAt?: string;
  reviewedBy?: string;
  lastLoginAt?: string;
  loginCount?: number;
}

export interface AccessLogEntry {
  id: string;
  uid: string;
  email: string;
  displayName: string;
  role: UserRole;
  action: 'login' | 'approval_change' | 'pin_unlock' | 'pin_change' | 'logout' | 'demo_access';
  details?: string;
  timestamp: string;
}

export interface SecurityConfig {
  pinCode: string;
  updatedAt?: string;
  updatedBy?: string;
}


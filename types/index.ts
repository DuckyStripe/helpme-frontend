export type Role = 'ADMIN' | 'VENDEDOR';
export type TagStatus = 'VIRGIN' | 'INCOMPLETE' | 'ACTIVE' | 'SUSPENDED';

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
}

export interface Tag {
  id: string;
  uuid: string;
  status: TagStatus;
  viewCount: number;
  scanCount: number;
  seller: {
    id: string;
    name: string;
    email: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface TagsListResponse {
  tags: Tag[];
  counts: Record<string, number>;
}

export interface MedicalData {
  userName: string;
  dob: string;
  bloodType: string;
  emergencyPhone: string;
  allergies?: string;
  conditions?: string;
  medications?: string;
  curp?: string;
  nss?: string;
  pob?: string;
  gender?: string;
  religion?: string;
  organDonor?: string;
  umf?: string;
  pacemakerICD?: string;
  implantContraceptive?: string;
  implantMammary?: string;
  orthopedicImplants?: string;
  cochlearImplant?: string;
  ocularProsthesis?: string;
}

export interface EmergencyContact {
  name: string;
  relationship: string;
  phone: string;
}

export interface ViewerData {
  uuid: string;
  status: TagStatus;
  viewCount: number;
  medicalData: MedicalData | null;
  contacts: EmergencyContact[];
}

export interface Seller {
  id: string;
  name: string;
  email: string;
  tagCount: number;
  createdAt: string;
}

export interface AdminUser {
  id: string;
  name: string;
  email: string;
  role: 'ADMIN';
  createdAt: string;
}

export interface AdminsListResponse {
  admins: AdminUser[];
}

export interface SellersListResponse {
  sellers: Seller[];
}

export interface MetricsResponse {
  totalTags: number;
  statusCounts: Record<string, number>;
  totalSellers: number;
  totalScans: number;
  recentScans: Array<{
    id: string;
    scannedAt: string;
    city?: string;
    country?: string;
    tagUuid: string;
    sellerName: string;
  }>;
}

export interface AuthResponse {
  user: User;
  token: string;
  refresh_token: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    message: string;
    code: string;
  };
}

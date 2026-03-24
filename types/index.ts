export interface Subscription {
  id: string;
  planId: string;
  status: 'active' | 'inactive' | 'past_due' | 'canceled';
  linksLimit: number;
  linksUsed: number;
  currentPeriodEnd: string | null;
  cancelAtPeriodEnd: boolean;
}

export interface LinkMedicalData {
  userName: string;
  dob: string;
  curp?: string;
  nss?: string;
  pob?: string;
  gender?: string;
  religion?: string;
  organDonor?: string;
  umf?: string;
  bloodType: string;
  allergies?: string;
  conditions?: string;
  medications?: string;
  emergencyPhone: string;
  hereditaryBackground?: Record<string, string>;
}

export interface EmergencyContact {
  id?: string;
  name: string;
  relationship: string;
  phone: string;
}

export interface MedicalLink {
  id: string;
  name: string;
  token: string;
  url: string;
  viewCount: number;
  createdAt: string;
  updatedAt?: string;
  medicalData?: LinkMedicalData;
  contacts?: EmergencyContact[];
}

export interface User {
  id: string;
  name: string;
  email: string;
}

export interface Plan {
  id: string;
  name: string;
  price: number;
  linksLimit: number;
  features: string[];
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    message: string;
    code: string;
  };
}

export interface AuthResponse {
  user: User;
  token: string;
  refresh_token: string;
  subscription?: Subscription;
}

export interface LinksResponse {
  links: MedicalLink[];
  usage: {
    total: number;
    limit: number;
    remaining: number;
    used: number;
  };
}

export interface ViewerResponse {
  name: string;
  viewCount: number;
  medicalData: LinkMedicalData;
  contacts: EmergencyContact[];
}

export type PlanType = 'PRINCIPAL' | 'PRO' | 'ULTRA';

export interface PlanLimits {
  maxContacts: number;
  maxVehicles: number;
  hasPrivateMode: boolean;
  hasRescuerAlert: boolean;
  hasAlertHistory: boolean;
  hasScanHistory: boolean;
  hasDownloads: boolean;
  hasVehicles: boolean;
  hasRouteMode: boolean;
  hasScanNotify: boolean;
  hasReminders: boolean;
  hasMonthlyReport: boolean;
  hardwareCount: number;
}

export function getPlanLimits(plan: PlanType): PlanLimits {
  switch (plan) {
    case 'PRINCIPAL':
      return {
        maxContacts: 1,
        maxVehicles: 0,
        hasPrivateMode: false,
        hasRescuerAlert: false,
        hasAlertHistory: false,
        hasScanHistory: false,
        hasDownloads: false,
        hasVehicles: false,
        hasRouteMode: false,
        hasScanNotify: false,
        hasReminders: false,
        hasMonthlyReport: false,
        hardwareCount: 0,
      };
    case 'PRO':
      return {
        maxContacts: 3,
        maxVehicles: 0,
        hasPrivateMode: true,
        hasRescuerAlert: true,
        hasAlertHistory: true,
        hasScanHistory: true,
        hasDownloads: true,
        hasVehicles: false,
        hasRouteMode: false,
        hasScanNotify: true,
        hasReminders: false,
        hasMonthlyReport: false,
        hardwareCount: 1,
      };
    case 'ULTRA':
      return {
        maxContacts: 5,
        maxVehicles: 3,
        hasPrivateMode: true,
        hasRescuerAlert: true,
        hasAlertHistory: true,
        hasScanHistory: true,
        hasDownloads: true,
        hasVehicles: true,
        hasRouteMode: true,
        hasScanNotify: true,
        hasReminders: true,
        hasMonthlyReport: true,
        hardwareCount: 4,
      };
  }
}

export const PLAN_LABELS: Record<PlanType, string> = {
  PRINCIPAL: 'Principal',
  PRO: 'Pro',
  ULTRA: 'Ultra',
};

export const PLAN_COLORS: Record<PlanType, { bg: string; text: string; border: string }> = {
  PRINCIPAL: { bg: 'bg-gray-100 dark:bg-gray-500/10', text: 'text-gray-700 dark:text-gray-400', border: 'border-gray-300 dark:border-gray-500/30' },
  PRO: { bg: 'bg-amber-100 dark:bg-amber-500/10', text: 'text-amber-800 dark:text-amber-400', border: 'border-amber-300 dark:border-amber-500/30' },
  ULTRA: { bg: 'bg-red-100 dark:bg-red-500/10', text: 'text-red-800 dark:text-red-400', border: 'border-red-300 dark:border-red-500/30' },
};

export const SubscriptionPlan = {
  FREE: 'FREE',
  STANDARD: 'STANDARD',
  PREMIUM: 'PREMIUM',
  ENTERPRISE: 'ENTERPRISE',
  CUSTOM: 'CUSTOM',
} as const;

export type SubscriptionPlan =
  typeof SubscriptionPlan[keyof typeof SubscriptionPlan];

export const SubscriptionStatus = {
  ACTIVE: 'ACTIVE',
  SUSPENDED: 'SUSPENDED',
  CANCELED: 'CANCELED',
  EXPIRED: 'EXPIRED',
} as const;

export type SubscriptionStatus =
  typeof SubscriptionStatus[keyof typeof SubscriptionStatus];

export interface Subscription {
  id: string;
  planName: SubscriptionPlan;
  status: SubscriptionStatus;
  currentPeriodEnd: string;
  owner: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
  } | null;
}

export interface OwnerQuota {
  plan: string;
  status: string;
  startDate: string | null;
  endDate: string | null;
  agencies: {
    current: number;
    max: number;
    remaining: number;
  };
  vehicles: {
    current: number;
    max: number;
    remaining: number;
  };
}

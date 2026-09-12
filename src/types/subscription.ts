export const SubscriptionPlan = {
  FREE: 'FREE',
  STANDARD: 'STANDARD',
  PREMIUM: 'PREMIUM',
  ENTERPRISE: 'ENTERPRISE',
} as const;

export type SubscriptionPlan = typeof SubscriptionPlan[keyof typeof SubscriptionPlan];

export const SubscriptionStatus = {
  ACTIVE: 'ACTIVE',
  SUSPENDED: 'SUSPENDED',
  CANCELED: 'CANCELED',
  EXPIRED: 'EXPIRED',
} as const;

export type SubscriptionStatus = typeof SubscriptionStatus[keyof typeof SubscriptionStatus];

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
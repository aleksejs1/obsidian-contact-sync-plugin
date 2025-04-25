export interface GoogleContact {
  resourceName: string;
  names?: { displayName: string }[];
  emailAddresses?: { value: string }[];
  phoneNumbers?: { value: string }[];
  birthdays?: Birthday[];
  memberships?: Membership[];
}

export interface Birthday {
  date?: {
    year?: number;
    month?: number;
    day?: number;
  };
  text?: string;
  metadata?: Record<string, unknown>;
}

export interface ContactGroupMembership {
  contactGroupId: string;
  contactGroupResourceName?: string;
}

export interface Membership {
  contactGroupMembership?: ContactGroupMembership;
  domainMembership?: Record<string, unknown>;
  metadata?: Record<string, unknown>;
}

export interface GoogleContactGroup {
  name: string;
  resourceName: string;
}

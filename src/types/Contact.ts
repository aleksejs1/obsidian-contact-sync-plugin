/**
 * Represents a single contact retrieved from Google contacts API.
 */
export interface GoogleContact {
  /** Unique resource identifier for the contact (e.g., "people/c123...") */
  resourceName: string;

  /** Array of name objects (usually contains a displayName) */
  names?: { displayName: string }[];

  /** Array of email address objects */
  emailAddresses?: { value: string }[];

  /** Array of phone number objects */
  phoneNumbers?: { value: string }[];

  /** Array of birthday objects associated with the contact */
  birthdays?: Birthday[];

  /** Array of group/domain memberships associated with the contact */
  memberships?: Membership[];

  /** Array of biographies objects associated with the contact */
  biographies?: { value: string }[];

  /** Array of address objects associated with the contact */
  addresses?: {
    city: string;
    country: string;
    countryCode: string;
    extendedAddress: string;
    formattedType: string;
    formattedValue: string;
    postalCode: string;
    streetAddress: string;
    type: string;
  }[];

  organizations?: {
    name: string;
    title: string;
    department: string;
  }[];
}

/**
 * Represents a contact's birthday, including optional structured date and metadata.
 */
export interface Birthday {
  /** Structured date object (year, month, day) */
  date?: {
    year?: number;
    month?: number;
    day?: number;
  };

  /** Free-form birthday string if structured date is unavailable */
  text?: string;

  /** Additional metadata about the birthday */
  metadata?: Record<string, unknown>;
}

/**
 * Represents a membership in a Google contact Group.
 */
export interface ContactGroupMembership {
  /** Identifier of the contact group (e.g., "abc123") */
  contactGroupId: string;

  /** Optional full resource name of the contact group (e.g., "contactGroups/family") */
  contactGroupResourceName?: string;
}

/**
 * Represents a contact's membership in various domains or groups.
 */
export interface Membership {
  /** Membership in a specific contact group */
  contactGroupMembership?: ContactGroupMembership;

  /** Optional domain membership data */
  domainMembership?: Record<string, unknown>;

  /** Optional metadata associated with the membership */
  metadata?: Record<string, unknown>;
}

/**
 * Represents a contact group fetched from Google contacts API.
 */
export interface GoogleContactGroup {
  /** Human-readable name of the group (e.g., "Friends") */
  name: string;

  /** Full resource name of the group (e.g., "contactGroups/friends") */
  resourceName: string;
}

export interface Organization {
  _id: string;
  name: string;
  description?: string;
  owner?: string;
  businesses?: string[];
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateOrganizationPayload {
  name: string;
  description?: string;
}

export interface OrganizationResponse {
  success: boolean;
  message?: string;
  data: {
    organization: Organization;
  };
}

export interface OrganizationsResponse {
  success: boolean;
  data: {
    organizations: Organization[];
  };
}

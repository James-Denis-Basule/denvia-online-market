import api from './api';

export interface StaffMember {
  _id: string;
  businessId: string;
  userId: { _id: string; firstName: string; lastName: string; email: string } | string;
  role: 'manager' | 'staff';
  status: 'active' | 'invited' | 'removed';
  canReceiveOrderNotifications: boolean;
  createdAt?: string;
}

export async function listStaff(businessId: string): Promise<StaffMember[]> {
  const response = await api.get(`/businesses/${businessId}/staff`);
  return response.data.data.staff;
}

export async function inviteStaff(
  businessId: string,
  email: string,
  role: 'manager' | 'staff' = 'staff',
) {
  const response = await api.post(`/businesses/${businessId}/staff`, {
    email,
    role,
  });
  return response.data.data.membership;
}

export async function removeStaff(businessId: string, membershipId: string) {
  await api.delete(`/businesses/${businessId}/staff/${membershipId}`);
}

export async function updateStaffNotifications(
  businessId: string,
  membershipId: string,
  canReceiveOrderNotifications: boolean,
) {
  const response = await api.patch(
    `/businesses/${businessId}/staff/${membershipId}/notifications`,
    { canReceiveOrderNotifications },
  );
  return response.data.data.membership;
}

import api from "./api";
export interface ActiveBusiness {
  id: string;
  name: string;
  slug: string;
  logo?: string;
}

export type AccountType = 'customer' | 'business';

export interface AuthUser {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  accountTypes: AccountType[];
  activeAccountType: AccountType;
  role: string;
  isEmailVerified: boolean;
  isActive?: boolean;
  activeBusiness?: ActiveBusiness | null;
  createdAt?: string;
  updatedAt?: string;
}

interface LoginResponse {
  success: boolean;
  message: string;
  data: {
    accessToken: string;
    user: AuthUser;
  };
}

interface RegisterResponse {
  success: boolean;
  message: string;
  data: {
    user: AuthUser;
  };
}

export async function loginUser(email: string, password: string) {
  const response = await api.post<LoginResponse>("/auth/login", {
    email,
    password,
  });

  const { accessToken, user } = response.data.data;

  localStorage.setItem("accessToken", accessToken);
  localStorage.setItem("authUser", JSON.stringify(user));

  return response.data;
}

export async function registerUser(payload: {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  phone?: string;
  accountType?: AccountType;
}) {
  const response = await api.post<RegisterResponse>("/auth/register", payload);

  return response.data;
}

export async function verifyEmail(token: string) {
  const response = await api.post("/auth/verify-email", {
    token,
  });

  return response.data;
}

export async function getCurrentUser() {
  const token = localStorage.getItem("accessToken");

  const response = await api.get("/auth/me", {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  return response.data;
}

export async function logoutUser() {
  try {
    await api.post("/auth/logout");
  } finally {
    localStorage.removeItem("accessToken");
    localStorage.removeItem("authUser");
  }
}

export async function switchAccountType(
  accountType: AccountType,
) {
  const token = localStorage.getItem("accessToken");

  const response = await api.post(
    "/auth/switch-account",
    { accountType },
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
  );

  return response.data;
}

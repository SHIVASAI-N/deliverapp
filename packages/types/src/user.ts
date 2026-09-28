export type UserRole = 'CUSTOMER' | 'RESTAURANT_STAFF' | 'RIDER' | 'ADMIN';

export interface IAddress {
  id: string;
  userId: string;
  tag: 'HOME' | 'WORK' | 'OTHER';
  label: string;
  street: string;
  area: string;
  city: string;
  postalCode: string;
  latitude: number;
  longitude: number;
  isDefault: boolean;
}

export interface IUser {
  id: string;
  phone: string;
  name?: string;
  email?: string;
  role: UserRole;
  isGoldMember: boolean;
  addresses: IAddress[];
  createdAt: string;
}

export interface IAuthTokenPayload {
  userId: string;
  phone: string;
  role: UserRole;
  isGoldMember: boolean;
}

export interface ILoginResponse {
  accessToken: string;
  user: IUser;
}

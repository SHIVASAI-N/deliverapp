import React, { createContext, useContext, useState, useEffect } from 'react';
import { IUser, IAddress } from '@deliverapp/types';
import { sendOtp, verifyOtp, fetchUserAddresses, addUserAddress } from '../services/api';

interface AuthContextType {
  user: IUser | null;
  addresses: IAddress[];
  selectedAddress: IAddress | null;
  isAuthenticated: boolean;
  loginWithPhoneOtp: (phone: string, code: string) => Promise<void>;
  requestOtp: (phone: string) => Promise<{ success: boolean; testOtp?: string }>;
  selectAddress: (address: IAddress) => void;
  addNewAddress: (address: Partial<IAddress>) => Promise<IAddress>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Pre-seeded default customer for seamless exploration
  const [user, setUser] = useState<IUser | null>({
    id: 'usr_aarav',
    phone: '+919847088990',
    name: 'Aarav Mehta',
    email: 'aarav.mehta@epicurean.internal',
    role: 'CUSTOMER',
    isGoldMember: true,
    addresses: [],
    createdAt: new Date().toISOString(),
  });

  const [addresses, setAddresses] = useState<IAddress[]>([
    {
      id: 'addr_1',
      userId: 'usr_aarav',
      tag: 'HOME',
      label: '42 Artisan Row, Apt 4B',
      street: 'Napier Street, Heritage Quarters',
      area: 'Fort Kochi',
      city: 'Kochi, Kerala',
      postalCode: '682001',
      latitude: 9.9275,
      longitude: 76.2600,
      isDefault: true,
    },
    {
      id: 'addr_2',
      userId: 'usr_aarav',
      tag: 'WORK',
      label: 'Studio Atelier 9',
      street: 'Tower 2, InfoPark Phase 1',
      area: 'Kakkanad',
      city: 'Kochi, Kerala',
      postalCode: '682042',
      latitude: 10.0159,
      longitude: 76.3639,
      isDefault: false,
    }
  ]);

  const [selectedAddress, setSelectedAddress] = useState<IAddress | null>(addresses[0]);

  const requestOtp = async (phone: string) => {
    return sendOtp(phone);
  };

  const loginWithPhoneOtp = async (phone: string, code: string) => {
    const res = await verifyOtp(phone, code);
    setUser(res.user);
    if (res.user.addresses && res.user.addresses.length > 0) {
      setAddresses(res.user.addresses);
      setSelectedAddress(res.user.addresses.find(a => a.isDefault) || res.user.addresses[0]);
    }
  };

  const selectAddress = (address: IAddress) => {
    setSelectedAddress(address);
  };

  const addNewAddress = async (addrData: Partial<IAddress>) => {
    if (!user) throw new Error('Must be logged in to add address');
    const created = await addUserAddress(user.id, addrData);
    setAddresses(prev => [created, ...prev]);
    setSelectedAddress(created);
    return created;
  };

  const logout = () => {
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        addresses,
        selectedAddress,
        isAuthenticated: !!user,
        loginWithPhoneOtp,
        requestOtp,
        selectAddress,
        addNewAddress,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};

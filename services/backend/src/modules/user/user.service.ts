import { DatabaseService } from '../db/in-memory-db.service';
import { IUser, IAddress } from '@deliverapp/types';

export class UserService {
  private db = DatabaseService.getInstance();

  getProfile(userId: string): IUser {
    const user = this.db.users.get(userId);
    if (!user) throw new Error('User not found.');
    return user;
  }

  getAddresses(userId: string): IAddress[] {
    const user = this.getProfile(userId);
    return user.addresses;
  }

  addAddress(userId: string, dto: Omit<IAddress, 'id' | 'userId'>): IAddress {
    const user = this.getProfile(userId);
    const newAddress: IAddress = {
      ...dto,
      id: 'addr_' + Math.random().toString(36).substring(2, 9),
      userId
    };

    if (newAddress.isDefault || user.addresses.length === 0) {
      user.addresses.forEach(a => { a.isDefault = false; });
      newAddress.isDefault = true;
    }

    user.addresses.push(newAddress);
    this.db.addresses.set(newAddress.id, newAddress);
    return newAddress;
  }

  setDefaultAddress(userId: string, addressId: string): IAddress[] {
    const user = this.getProfile(userId);
    user.addresses.forEach(a => {
      a.isDefault = (a.id === addressId);
    });
    return user.addresses;
  }
}

import { DatabaseService } from '../db/in-memory-db.service';
import { IUser, ILoginResponse } from '@deliverapp/types';

export class AuthService {
  private db = DatabaseService.getInstance();
  private otpCache = new Map<string, string>(); // phone -> otp

  sendOtp(phone: string): { success: boolean; message: string; testOtp: string } {
    const cleanPhone = phone.trim();
    const otp = '123456'; // Standard test OTP for development/testing
    this.otpCache.set(cleanPhone, otp);
    return {
      success: true,
      message: 'OTP dispatched successfully via SMS gateway',
      testOtp: otp
    };
  }

  verifyOtp(phone: string, code: string): ILoginResponse {
    const cleanPhone = phone.trim();
    const storedOtp = this.otpCache.get(cleanPhone) || '123456';

    if (code !== storedOtp && code !== '123456') {
      throw new Error('Invalid verification code entered.');
    }

    let user = this.db.users.get(cleanPhone);
    if (!user) {
      // Auto-register new customer
      user = {
        id: 'usr_' + Math.random().toString(36).substring(2, 9),
        phone: cleanPhone,
        name: 'Patron ' + cleanPhone.slice(-4),
        role: 'CUSTOMER',
        isGoldMember: false,
        addresses: [],
        createdAt: new Date().toISOString()
      };
      this.db.users.set(user.id, user);
      this.db.users.set(user.phone, user);
    }

    // Mock token generation
    const accessToken = 'jwt_mock_' + Buffer.from(JSON.stringify({ userId: user.id, phone: user.phone, role: user.role })).toString('base64');

    return {
      accessToken,
      user
    };
  }
}

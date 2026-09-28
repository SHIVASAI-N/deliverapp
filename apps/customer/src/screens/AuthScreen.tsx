import React, { useState } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  StyleSheet, 
  ActivityIndicator, 
  Alert 
} from 'react-native';
import { useAuth } from '../context/AuthContext';

interface AuthScreenProps {
  onDone: () => void;
}

export const AuthScreen: React.FC<AuthScreenProps> = ({ onDone }) => {
  const { user, loginWithPhoneOtp, requestOtp, addresses, selectedAddress, selectAddress, addNewAddress } = useAuth();
  
  const [phone, setPhone] = useState('+919847088990');
  const [otpCode, setOtpCode] = useState('123456');
  const [step, setStep] = useState<'PHONE' | 'OTP' | 'ADDRESSES'>(user ? 'ADDRESSES' : 'PHONE');
  const [loading, setLoading] = useState(false);

  // New Address Form
  const [newLabel, setNewLabel] = useState('');
  const [newStreet, setNewStreet] = useState('');

  const handleSendOtp = async () => {
    try {
      setLoading(true);
      const res = await requestOtp(phone);
      if (res.testOtp) {
        setOtpCode(res.testOtp);
      }
      setStep('OTP');
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to dispatch OTP');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    try {
      setLoading(true);
      await loginWithPhoneOtp(phone, otpCode);
      setStep('ADDRESSES');
    } catch (err: any) {
      Alert.alert('Verification Failed', err.message || 'Invalid passcode');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateAddress = async () => {
    if (!newLabel || !newStreet) {
      Alert.alert('Required', 'Please enter address name and street details.');
      return;
    }
    try {
      setLoading(true);
      const geocoded = await geocodeAddress(newStreet);
      await addNewAddress({
        label: newLabel,
        street: newStreet,
        area: 'Fort Kochi',
        city: 'Kochi',
        latitude: geocoded?.latitude || 9.9275,
        longitude: geocoded?.longitude || 76.2600,
        isDefault: false
      });
      setNewLabel('');
      setNewStreet('');
    } catch (err: any) {
      Alert.alert('Error', err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.topBar}>
        <TouchableOpacity onPress={onDone}>
          <Text style={styles.closeBtn}>✕ Close</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Account &amp; Addresses</Text>
        <View style={{ width: 40 }} />
      </View>

      <View style={styles.content}>
        {step === 'PHONE' && (
          <View style={styles.card}>
            <Text style={styles.title}>Phone Authentication</Text>
            <Text style={styles.sub}>Enter your mobile number to receive a secure login code via SMS gateway.</Text>

            <TextInput
              style={styles.input}
              value={phone}
              onChangeText={setPhone}
              placeholder="+91..."
              placeholderTextColor="#78716c"
              keyboardType="phone-pad"
            />

            <TouchableOpacity 
              disabled={loading} 
              style={styles.primaryBtn} 
              onPress={handleSendOtp}
            >
              {loading ? <ActivityIndicator color="#0c0a09" /> : <Text style={styles.primaryBtnText}>Send Passcode →</Text>}
            </TouchableOpacity>
          </View>
        )}

        {step === 'OTP' && (
          <View style={styles.card}>
            <Text style={styles.title}>Verify One-Time Code</Text>
            <Text style={styles.sub}>Enter the 6-digit code dispatched to {phone} (Test OTP: 123456).</Text>

            <TextInput
              style={styles.input}
              value={otpCode}
              onChangeText={setOtpCode}
              placeholder="123456"
              placeholderTextColor="#78716c"
              keyboardType="number-pad"
            />

            <TouchableOpacity 
              disabled={loading} 
              style={styles.primaryBtn} 
              onPress={handleVerifyOtp}
            >
              {loading ? <ActivityIndicator color="#0c0a09" /> : <Text style={styles.primaryBtnText}>Verify &amp; Continue</Text>}
            </TouchableOpacity>

            <TouchableOpacity onPress={() => setStep('PHONE')} style={{ marginTop: 14, alignItems: 'center' }}>
              <Text style={{ color: '#a8a29e', fontSize: 12 }}>Change Phone Number</Text>
            </TouchableOpacity>
          </View>
        )}

        {step === 'ADDRESSES' && (
          <View style={{ flex: 1 }}>
            <View style={styles.userProfileBanner}>
              <View>
                <Text style={styles.userName}>{user?.name}</Text>
                <Text style={styles.userPhone}>{user?.phone} • {user?.isGoldMember ? '✨ Gold Member' : 'Standard'}</Text>
              </View>
              <TouchableOpacity onPress={() => setStep('PHONE')}>
                <Text style={{ color: '#f59e0b', fontSize: 12, fontWeight: '700' }}>Switch</Text>
              </TouchableOpacity>
            </View>

            <Text style={styles.sectionHeader}>SAVED DELIVERY LOCATIONS</Text>
            {addresses.map(addr => {
              const isSelected = selectedAddress?.id === addr.id;
              return (
                <TouchableOpacity
                  key={addr.id}
                  style={[styles.addressItem, isSelected && styles.addressItemSelected]}
                  onPress={() => {
                    selectAddress(addr);
                    onDone();
                  }}
                >
                  <View style={{ flex: 1 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                      <Text style={styles.addressItemTitle}>{addr.label}</Text>
                      {addr.isDefault && <Text style={styles.defaultPill}>Default</Text>}
                    </View>
                    <Text style={styles.addressItemSub}>{addr.street}, {addr.area}</Text>
                  </View>
                  {isSelected && <Text style={{ color: '#f59e0b', fontWeight: '800' }}>✓ Selected</Text>}
                </TouchableOpacity>
              );
            })}

            {/* Add Address Form */}
            <View style={[styles.card, { marginTop: 16 }]}>
              <Text style={styles.sectionHeader}>ADD NEW ADDRESS</Text>
              <TextInput
                style={[styles.input, { marginBottom: 8 }]}
                placeholder="Label (e.g. Studio Loft, Beach Villa)"
                placeholderTextColor="#78716c"
                value={newLabel}
                onChangeText={setNewLabel}
              />
              <TextInput
                style={[styles.input, { marginBottom: 12 }]}
                placeholder="Street address &amp; apartment details"
                placeholderTextColor="#78716c"
                value={newStreet}
                onChangeText={setNewStreet}
              />
              <TouchableOpacity
                disabled={loading}
                style={[styles.primaryBtn, { paddingVertical: 10 }]}
                onPress={handleCreateAddress}
              >
                <Text style={styles.primaryBtnText}>+ Save Address</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0c0a09' },
  topBar: {
    paddingTop: 48,
    paddingHorizontal: 20,
    paddingBottom: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: '#1c1917',
  },
  closeBtn: { color: '#a8a29e', fontSize: 13, fontWeight: '700' },
  headerTitle: { color: '#fafaf9', fontSize: 16, fontWeight: '700' },
  content: { padding: 20, flex: 1 },
  card: { backgroundColor: '#1c1917', borderRadius: 14, padding: 18, borderWidth: 1, borderColor: '#292524' },
  title: { color: '#fafaf9', fontSize: 18, fontWeight: '700' },
  sub: { color: '#a8a29e', fontSize: 12, marginTop: 4, marginBottom: 16 },
  input: {
    backgroundColor: '#0c0a09',
    borderWidth: 1,
    borderColor: '#292524',
    borderRadius: 8,
    padding: 12,
    color: '#fafaf9',
    fontSize: 14,
    marginBottom: 14,
  },
  primaryBtn: {
    backgroundColor: '#f59e0b',
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
  },
  primaryBtnText: { color: '#0c0a09', fontSize: 13, fontWeight: '800' },
  userProfileBanner: {
    backgroundColor: '#1c1917',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#292524',
  },
  userName: { color: '#fafaf9', fontSize: 16, fontWeight: '700' },
  userPhone: { color: '#a8a29e', fontSize: 12, marginTop: 2 },
  sectionHeader: { color: '#78716c', fontSize: 10, fontWeight: '800', letterSpacing: 1, marginBottom: 10 },
  addressItem: {
    backgroundColor: '#1c1917',
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#292524',
    flexDirection: 'row',
    alignItems: 'center',
  },
  addressItemSelected: { borderColor: '#f59e0b', backgroundColor: 'rgba(245, 158, 11, 0.06)' },
  addressItemTitle: { color: '#fafaf9', fontSize: 14, fontWeight: '700' },
  addressItemSub: { color: '#a8a29e', fontSize: 12, marginTop: 2 },
  defaultPill: { color: '#10b981', fontSize: 10, fontWeight: '700', backgroundColor: 'rgba(16, 185, 129, 0.1)', paddingHorizontal: 6, paddingVertical: 1, borderRadius: 4 },
});

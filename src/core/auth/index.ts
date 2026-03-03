export {
  checkBiometricCapability,
  authenticateWithBiometric,
  enrollBiometric,
  unenrollBiometric,
  isBiometricEnrolled,
  getBiometricLabel,
  saveSessionToken,
  getSessionToken,
  clearSessionToken,
} from './biometric';
export type { BiometricCapability } from './biometric';
export { getAuthService, setAuthService, MockAuthService, FirebaseAuthService } from './auth-service';
export type { AuthService, AuthResult } from './auth-service';

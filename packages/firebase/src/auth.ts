/**
 * Authentication Helpers
 *
 * Phone OTP auth flow utilities.
 */

import {
    RecaptchaVerifier,
    signInWithPhoneNumber,
    ConfirmationResult,
    signOut as firebaseSignOut,
    onAuthStateChanged,
    User as FirebaseUser,
} from "firebase/auth";
import { auth } from "./config";

/**
 * Set up invisible reCAPTCHA for phone auth.
 * Must be called before signInWithPhone.
 * @param buttonId - The DOM element ID for the reCAPTCHA container
 */
export function setupRecaptcha(buttonId: string): RecaptchaVerifier {
    const verifier = new RecaptchaVerifier(auth, buttonId, {
        size: "invisible",
        callback: () => {
            // reCAPTCHA solved
        },
    });
    return verifier;
}

/**
 * Send OTP to phone number.
 * @returns ConfirmationResult to verify the code
 */
export async function sendOTP(
    phoneNumber: string,
    recaptchaVerifier: RecaptchaVerifier
): Promise<ConfirmationResult> {
    return signInWithPhoneNumber(auth, phoneNumber, recaptchaVerifier);
}

/**
 * Verify OTP code.
 * @returns The authenticated Firebase user
 */
export async function verifyOTP(
    confirmationResult: ConfirmationResult,
    code: string
): Promise<FirebaseUser> {
    const result = await confirmationResult.confirm(code);
    return result.user;
}

/**
 * Sign out the current user.
 */
export async function signOut(): Promise<void> {
    return firebaseSignOut(auth);
}

/**
 * Subscribe to auth state changes.
 */
export function onAuthChange(
    callback: (user: FirebaseUser | null) => void
): () => void {
    return onAuthStateChanged(auth, callback);
}

export { auth };

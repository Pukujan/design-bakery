/** True when the Functions emulator is running (skip slow production Firestore calls). */
export function isFunctionsEmulator(): boolean {
  return Boolean(process.env.FIREBASE_EMULATOR_HUB);
}

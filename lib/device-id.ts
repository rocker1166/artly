const DEVICE_ID_KEY = "creative-studio-device-id"

export function getOrCreateDeviceId(): string {
  if (typeof window === "undefined") return ""

  let deviceId = localStorage.getItem(DEVICE_ID_KEY)

  if (!deviceId) {
    // Generate a unique device ID using crypto
    deviceId = generateUUID()
    localStorage.setItem(DEVICE_ID_KEY, deviceId)
  }

  return deviceId
}

function generateUUID(): string {
  // Use crypto.randomUUID if available, otherwise fallback
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID()
  }

  // Fallback for older browsers
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0
    const v = c === "x" ? r : (r & 0x3) | 0x8
    return v.toString(16)
  })
}

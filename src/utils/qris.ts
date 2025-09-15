// Simple QRIS generator for demo purposes
// In production, you should use a proper payment gateway API

export function generateQRIS(_amount: number): string {
  // This is a simplified QRIS format for demonstration
  // In real implementation, you would integrate with a payment provider
  
  const merchantId = "ID1234567890123"; // Your merchant ID
  const terminalId = "T001"; // Terminal ID
  const _timestamp = Date.now().toString();
  
  // Convert to QRIS string format (simplified)
  const qrisString = `00020101021226${merchantId}${terminalId}5204000053033605802ID5925DONASI JUMAT BERKAH6007JAKARTA61051234562070703A0163044B7A`;
  
  return qrisString;
}
// Generate a random short code
export function generateCode(length: number = 6): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let code = '';
  
  for (let i = 0; i < length; i++) {
    const randomIndex = Math.floor(Math.random() * chars.length);
    code += chars[randomIndex];
  }
  
  return code;
}

// Generate multiple unique codes
export function generateCodes(count: number, length: number = 6): string[] {
  const codes = new Set<string>();
  
  while (codes.size < count) {
    codes.add(generateCode(length));
  }
  
  return Array.from(codes);
}
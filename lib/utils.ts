export function calculateAge(dob: string): number {
  const parts = dob.split('/');
  if (parts.length !== 3) return 0;
  
  const day = parseInt(parts[0], 10);
  const month = parseInt(parts[1], 10) - 1;
  const year = parseInt(parts[2], 10);
  
  const birthDate = new Date(year, month, day);
  const today = new Date();
  
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  
  return age;
}

export function formatDate(dateString: string): string {
  return dateString;
}

export function isNegados(value?: string): boolean {
  if (!value) return false;
  return value.toLowerCase() === 'negados' || value.toLowerCase() === 'negadas';
}

export function cn(...classes: (string | undefined | false)[]): string {
  return classes.filter(Boolean).join(' ');
}

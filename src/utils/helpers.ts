import { differenceInDays, format, parseISO } from 'date-fns';

export function formatCurrency(amount: number): string {
  return `₹${amount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export function formatDate(dateStr: string): string {
  try {
    return format(parseISO(dateStr), 'dd MMM yyyy');
  } catch {
    return dateStr;
  }
}

export function formatDateTime(dateStr: string): string {
  try {
    return format(parseISO(dateStr), 'dd MMM yyyy, hh:mm:ss a');
  } catch {
    return dateStr;
  }
}

export function getExpiryStatus(expiryDate: string): 'expired' | 'critical' | 'warning' | 'soon' | 'safe' {
  const days = differenceInDays(parseISO(expiryDate), new Date());
  if (days < 0) return 'expired';
  if (days <= 30) return 'critical';
  if (days <= 60) return 'warning';
  if (days <= 90) return 'soon';
  return 'safe';
}

export function getExpiryColor(status: string): string {
  switch (status) {
    case 'expired': return 'text-red-600 bg-red-100 dark:bg-red-900/30 dark:text-red-400';
    case 'critical': return 'text-orange-600 bg-orange-100 dark:bg-orange-900/30 dark:text-orange-400';
    case 'warning': return 'text-yellow-600 bg-yellow-100 dark:bg-yellow-900/30 dark:text-yellow-400';
    case 'soon': return 'text-blue-600 bg-blue-100 dark:bg-blue-900/30 dark:text-blue-400';
    default: return 'text-green-600 bg-green-100 dark:bg-green-900/30 dark:text-green-400';
  }
}

export function getDaysUntilExpiry(expiryDate: string): number {
  return differenceInDays(parseISO(expiryDate), new Date());
}

export function calculateGST(price: number, gstPct: number): number {
  return (price * gstPct) / 100;
}

export function calculateSellingPriceWithGST(basePrice: number, gstPct: number): number {
  return basePrice + calculateGST(basePrice, gstPct);
}

export function cn(...classes: (string | undefined | null | false)[]): string {
  return classes.filter(Boolean).join(' ');
}

export function getRoleBadgeColor(role: string): string {
  switch (role) {
    case 'super_admin': return 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400';
    case 'admin': return 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400';
    case 'store_manager': return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400';
    case 'staff': return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400';
    default: return 'bg-gray-100 text-gray-700';
  }
}

export function getRoleLabel(role: string): string {
  switch (role) {
    case 'super_admin': return 'Super Admin';
    case 'admin': return 'Admin';
    case 'store_manager': return 'Store Manager';
    case 'staff': return 'Staff';
    default: return role;
  }
}

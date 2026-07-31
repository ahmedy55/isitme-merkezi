'use client';

export function getDisplayName(currentUser: any, usersList?: any[]): string {
  if (!currentUser) return 'Dr. Elif Arslan';

  // 1. Check user_metadata first_name / last_name
  const metaFirst = currentUser.user_metadata?.first_name || currentUser.user_metadata?.firstName;
  const metaLast = currentUser.user_metadata?.last_name || currentUser.user_metadata?.lastName;
  if (metaFirst || metaLast) {
    const fullName = `${metaFirst || ''} ${metaLast || ''}`.trim();
    if (fullName) return fullName;
  }

  // 2. Check user_metadata full_name / name
  const metaName = currentUser.user_metadata?.full_name || currentUser.user_metadata?.name;
  if (metaName && metaName !== currentUser.email) {
    return metaName;
  }

  // 3. Match from usersList (memberships)
  if (usersList && Array.isArray(usersList)) {
    const matchedUser = usersList.find((u: any) => 
      (u.email && currentUser.email && u.email.toLowerCase() === currentUser.email.toLowerCase()) || 
      u.id === currentUser.id
    );
    if (matchedUser && (matchedUser.firstName || matchedUser.lastName)) {
      const fullName = `${matchedUser.firstName || ''} ${matchedUser.lastName || ''}`.trim();
      if (fullName) return fullName;
    }
  }

  // 4. Fallback from email prefix (never return email address with @)
  if (currentUser.email) {
    const prefix = currentUser.email.split('@')[0];
    if (prefix.toLowerCase().includes('ahmt') || prefix.toLowerCase().includes('ahmet')) {
      return 'Ahmet';
    }
    const parts = prefix.split(/[\._\-]/).filter(Boolean);
    if (parts.length > 0) {
      return parts.map((p: string) => p.charAt(0).toUpperCase() + p.slice(1)).join(' ');
    }
  }

  return 'Ahmet';
}

export function getUserRole(currentUser: any, usersList?: any[]): string {
  if (!currentUser) return 'Odyolog · Kadıköy';

  // 1. Check user_metadata
  const metaRole = currentUser.user_metadata?.role || (Array.isArray(currentUser.user_metadata?.roles) ? currentUser.user_metadata?.roles[0] : null);
  if (metaRole) return metaRole;

  // 2. Match from usersList
  if (usersList && Array.isArray(usersList)) {
    const matchedUser = usersList.find((u: any) => 
      (u.email && currentUser.email && u.email.toLowerCase() === currentUser.email.toLowerCase()) || 
      u.id === currentUser.id
    );
    if (matchedUser && matchedUser.roles && matchedUser.roles.length > 0) {
      return matchedUser.roles[0];
    }
  }

  // 3. Uniform default fallback for both Header and Sidebar
  return 'Firma Yöneticisi';
}

export function getUserInitials(name: string): string {
  if (!name) return 'U';
  const parts = name.split(' ').filter(Boolean);
  if (parts.length >= 2) {
    return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
  }
  if (parts.length === 1) {
    return parts[0].slice(0, 2).toUpperCase();
  }
  return 'U';
}

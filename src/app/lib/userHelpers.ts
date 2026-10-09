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
  if (!currentUser) return 'Yetkisiz';

  // 1. Check membership roles
  if (currentUser.membership?.roles && Array.isArray(currentUser.membership.roles) && currentUser.membership.roles.length > 0) {
    return currentUser.membership.roles[0];
  }
  if (currentUser.membership?.role) {
    return currentUser.membership.role;
  }

  // 2. Check direct roles on currentUser
  if (Array.isArray(currentUser.roles) && currentUser.roles.length > 0) {
    return currentUser.roles[0];
  }
  if (currentUser.role && currentUser.role !== 'authenticated') {
    return currentUser.role;
  }

  // 3. Check app_metadata
  if (Array.isArray(currentUser.app_metadata?.roles) && currentUser.app_metadata.roles.length > 0) {
    return currentUser.app_metadata.roles[0];
  }
  if (currentUser.app_metadata?.role) {
    return currentUser.app_metadata.role;
  }

  // 4. Check user_metadata
  if (Array.isArray(currentUser.user_metadata?.roles) && currentUser.user_metadata.roles.length > 0) {
    return currentUser.user_metadata.roles[0];
  }
  if (currentUser.user_metadata?.role) {
    return currentUser.user_metadata.role;
  }

  // 5. Match from usersList
  if (usersList && Array.isArray(usersList)) {
    const matchedUser = usersList.find((u: any) =>
      (u.id && (u.id === currentUser.id || u.userId === currentUser.id)) ||
      (u.email && currentUser.email && u.email.toLowerCase() === currentUser.email.toLowerCase())
    );
    if (matchedUser) {
      if (Array.isArray(matchedUser.roles) && matchedUser.roles.length > 0) return matchedUser.roles[0];
      if (matchedUser.role) return matchedUser.role;
    }
  }

  // 6. If user is authenticated, default to Firma Yöneticisi so they are authorized clinic staff
  if (currentUser.id || currentUser.email) {
    return 'Firma Yöneticisi';
  }

  return 'Yetkisiz';
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

import React from 'react';

interface StatCardProps {
  title: string;
  value: string | number;
  icon?: React.ReactNode;
  subtitle?: string;
  badgeText?: string;
  badgeType?: 'success' | 'warning' | 'info' | 'danger';
}

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  icon,
  subtitle,
  badgeText,
  badgeType = 'info'
}) => {
  return (
    <div className="card" style={{ display: 'flex', alignItems: 'center' }}>
      <div className="card-body" style={{ display: 'flex', alignItems: 'center', gap: 16, width: '100%' }}>
        {icon && (
          <div style={{
            width: 48,
            height: 48,
            borderRadius: 'var(--radius-md)',
            background: 'var(--primary-50)',
            color: 'var(--primary-600)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '1.4rem'
          }}>
            {icon}
          </div>
        )}
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: '0.78rem', color: 'var(--gray-500)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            {title}
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: 700, color: 'var(--gray-900)', fontFamily: 'var(--font-display)', lineHeight: 1.2 }}>
            {value}
          </div>
          {subtitle && <div style={{ fontSize: '0.78rem', color: 'var(--gray-500)', marginTop: 2 }}>{subtitle}</div>}
        </div>
        {badgeText && (
          <span className="badge" style={{
            background: badgeType === 'success' ? 'var(--success-50)' : badgeType === 'danger' ? 'var(--danger-50)' : 'var(--primary-50)',
            color: badgeType === 'success' ? 'var(--success-600)' : badgeType === 'danger' ? 'var(--danger-600)' : 'var(--primary-600)',
            padding: '4px 8px',
            borderRadius: 4,
            fontSize: '0.78rem',
            fontWeight: 600
          }}>
            {badgeText}
          </span>
        )}
      </div>
    </div>
  );
};

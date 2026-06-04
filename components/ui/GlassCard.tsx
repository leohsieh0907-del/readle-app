import { forwardRef, type HTMLAttributes } from 'react';

type Variant = 'card' | 'strong' | 'subtle';

interface GlassCardProps extends HTMLAttributes<HTMLDivElement> {
  variant?: Variant;
  as?: 'div' | 'section' | 'article';
}

const variantClass: Record<Variant, string> = {
  card: 'glass-card',
  strong: 'glass-strong',
  subtle: 'glass-subtle',
};

const GlassCard = forwardRef<HTMLDivElement, GlassCardProps>(
  ({ variant = 'card', className = '', children, ...rest }, ref) => {
    return (
      <div
        ref={ref}
        className={`${variantClass[variant]} rounded-[20px] ${className}`}
        {...rest}
      >
        {children}
      </div>
    );
  },
);
GlassCard.displayName = 'GlassCard';

export default GlassCard;

import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from 'react';

type Variant = 'primary' | 'secondary' | 'ghost';
type Size = 'sm' | 'md' | 'lg' | 'icon';

interface SoftButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
  pill?: boolean;
}

const variantClass: Record<Variant, string> = {
  primary: 'btn-primary',
  secondary: 'btn-secondary',
  ghost: 'btn-ghost',
};

const sizeClass: Record<Size, string> = {
  sm: 'h-9 px-3 text-sm gap-1.5',
  md: 'h-11 px-5 text-[15px] gap-2',
  lg: 'h-14 px-7 text-base gap-2.5 font-semibold',
  icon: 'h-10 w-10 p-0',
};

const SoftButton = forwardRef<HTMLButtonElement, SoftButtonProps>(
  (
    {
      variant = 'primary',
      size = 'md',
      pill = false,
      leftIcon,
      rightIcon,
      className = '',
      children,
      ...rest
    },
    ref,
  ) => {
    const radius = pill || size === 'icon' ? 'rounded-full' : 'rounded-xl';
    return (
      <button
        ref={ref}
        className={`inline-flex items-center justify-center font-medium ${variantClass[variant]} ${sizeClass[size]} ${radius} ${className}`}
        {...rest}
      >
        {leftIcon}
        {children}
        {rightIcon}
      </button>
    );
  },
);
SoftButton.displayName = 'SoftButton';

export default SoftButton;

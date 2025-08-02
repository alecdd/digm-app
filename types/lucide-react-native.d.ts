declare module 'lucide-react-native' {
  import { FC } from 'react';
  import { ViewProps } from 'react-native';

  export interface LucideIconProps extends ViewProps {
    color?: string;
    size?: number | string;
    strokeWidth?: number | string;
    fill?: string;
  }

  export const X: FC<LucideIconProps>;
  export const Check: FC<LucideIconProps>;
  export const CheckCircle: FC<LucideIconProps>;
  export const Calendar: FC<LucideIconProps>;
  export const Target: FC<LucideIconProps>;
  export const Edit: FC<LucideIconProps>;
  export const Pin: FC<LucideIconProps>;
  export const PinOff: FC<LucideIconProps>;
  export const Eye: FC<LucideIconProps>;
  export const HelpCircle: FC<LucideIconProps>;
}

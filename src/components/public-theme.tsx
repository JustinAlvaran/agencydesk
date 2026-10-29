import type {ReactNode} from 'react';
import {cn} from './ui/primitives';
import styles from './public-theme.module.css';
export function PublicTheme({children,className}:{children:ReactNode;className?:string}) {
  return <div className={cn('marketing',styles.surface,className)}>{children}</div>;
}

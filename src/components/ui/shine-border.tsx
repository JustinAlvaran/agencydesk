import type {CSSProperties} from 'react';
import {cn} from './primitives';
import styles from '../launch-home.module.css';
// Adapted from Magic UI ShineBorder (MIT); see THIRD_PARTY_NOTICES.md.
export function ShineBorder({className}:{className?:string}) {
  const maskStyle:CSSProperties={backgroundImage:'radial-gradient(transparent,transparent,#66e6b1,transparent,transparent)',backgroundSize:'300% 300%',mask:'linear-gradient(#fff 0 0) content-box,linear-gradient(#fff 0 0)',WebkitMask:'linear-gradient(#fff 0 0) content-box,linear-gradient(#fff 0 0)',WebkitMaskComposite:'xor',maskComposite:'exclude',padding:1};
  return <div aria-hidden='true' className={cn(styles.shine,className)} style={maskStyle}/>;
}

import { LaunchHome } from '@/components/launch-home';
import styles from './home.module.css';

export const metadata = { alternates: { canonical: '/' } };

export default function Home() {
  return <div className={styles.page}><LaunchHome /></div>;
}

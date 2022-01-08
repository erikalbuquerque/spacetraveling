import Link from 'next/link';
import { HTMLAttributes } from 'react';
import styles from './header.module.scss';

type HeaderProps = HTMLAttributes<HTMLHeadingElement>;

export default function Header(props: HeaderProps) {
  return (
    <header className={styles.container} {...props}>
      <div className={styles.content}>
        <Link href="/">
          <img src="/logo.svg" alt="logo" />
        </Link>
      </div>
    </header>
  );
}

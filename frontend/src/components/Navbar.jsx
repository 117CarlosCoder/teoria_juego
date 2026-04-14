import { NavLink } from 'react-router-dom';
import styles from './Navbar.module.css';

const links = [
  { to: '/', label: 'El Dilema' },
  { to: '/strategies', label: 'Estrategias' },
  { to: '/tournament', label: 'Torneo' },
  { to: '/game', label: 'Jugar' },
];

function Navbar() {
  return (
    <header className={styles.header}>
      <div className={styles.brand}>Dilema del prisionero</div>
      <nav className={styles.nav}>
        {links.map((link) => (
          <NavLink
            key={link.to}
            to={link.to}
            className={({ isActive }) =>
              `${styles.link} ${isActive ? styles.active : ''}`
            }
          >
            {link.label}
          </NavLink>
        ))}
      </nav>
    </header>
  );
}

export default Navbar;

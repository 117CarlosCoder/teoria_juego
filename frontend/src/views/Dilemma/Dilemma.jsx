import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import PayoffMatrix from '../../components/PayoffMatrix';
import styles from './Dilemma.module.css';

const axelrodProperties = [
  {
    title: 'Bondad',
    text: 'No traiciona primero. Evita guerras tempranas y abre puerta a cooperacion.',
  },
  {
    title: 'Indulgencia',
    text: 'Puede perdonar y volver a cooperar despues de un conflicto.',
  },
  {
    title: 'Reactividad',
    text: 'Responde rapidamente al comportamiento del rival.',
  },
  {
    title: 'Claridad',
    text: 'Su patron es comprensible y facilita aprendizaje mutuo.',
  },
];

function Dilemma() {
  const [zeroSum, setZeroSum] = useState(false);
  const navigate = useNavigate();

  return (
    <section className={styles.page}>
      <h1>El Dilema del Prisionero</h1>
      <p className={styles.story}>
        Dos prisioneros son interrogados por separado. Cada uno decide entre cooperar
        con su companero (guardar silencio) o traicionarlo (declarar en su contra).
        Deciden al mismo tiempo y sin comunicarse.
      </p>

      <PayoffMatrix />

      <div className={styles.toggleBox}>
        <label htmlFor="sum-toggle">Suma cero vs Suma no cero</label>
        <button
          id="sum-toggle"
          className={styles.toggle}
          onClick={() => setZeroSum((value) => !value)}
          type="button"
        >
          {zeroSum ? 'Modo suma cero' : 'Modo suma no cero'}
        </button>
        <p>
          {zeroSum
            ? 'En suma cero, lo que gana uno lo pierde exactamente el otro.'
            : 'En suma no cero, ambos pueden mejorar si coordinan cooperacion.'}
        </p>
      </div>

      <div className={styles.cards}>
        {axelrodProperties.map((item) => (
          <article key={item.title} className={styles.card}>
            <h3>{item.title}</h3>
            <p>{item.text}</p>
          </article>
        ))}
      </div>

      <button className={styles.nextButton} onClick={() => navigate('/strategies')} type="button">
        Ver las estrategias →
      </button>
    </section>
  );
}

export default Dilemma;

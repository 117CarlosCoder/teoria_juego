import styles from './PayoffMatrix.module.css';

const matrix = [
  {
    player: 'Cooperar',
    agent: 'Cooperar',
    code: 'R',
    payoff: '3 / 3',
    title: 'R - Recompensa mutua por cooperar',
  },
  {
    player: 'Cooperar',
    agent: 'Traicionar',
    code: 'S',
    payoff: '0 / 5',
    title: 'S - El ingenuo pierde mientras el oportunista gana',
  },
  {
    player: 'Traicionar',
    agent: 'Cooperar',
    code: 'T',
    payoff: '5 / 0',
    title: 'T - Tentacion de traicionar para ganar mas',
  },
  {
    player: 'Traicionar',
    agent: 'Traicionar',
    code: 'P',
    payoff: '1 / 1',
    title: 'P - Castigo mutuo por no cooperar',
  },
];

function PayoffMatrix() {
  return (
    <div className={styles.wrap}>
      <h3>Matriz de pagos (Tu / Agente)</h3>
      <table className={styles.table}>
        <thead>
          <tr>
            <th>Tu accion</th>
            <th>Accion agente</th>
            <th>Tipo</th>
            <th>Pago</th>
          </tr>
        </thead>
        <tbody>
          {matrix.map((row) => (
            <tr key={`${row.player}-${row.agent}`} title={row.title}>
              <td>{row.player}</td>
              <td>{row.agent}</td>
              <td>
                <span className={styles.code}>{row.code}</span>
              </td>
              <td>{row.payoff}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default PayoffMatrix;

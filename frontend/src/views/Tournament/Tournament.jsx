import { useEffect, useState } from 'react';
import {
  ResponsiveContainer,
  BarChart,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  Bar,
} from 'recharts';
import api from '../../api';
import styles from './Tournament.module.css';

function Tournament() {
  const [results, setResults] = useState([]);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [running, setRunning] = useState(false);
  const [error, setError] = useState('');

  const fetchData = async () => {
    try {
      setLoading(true);
      const [resultsResponse, historyResponse] = await Promise.all([
        api.get('/api/tournament/results'),
        api.get('/api/tournament/history'),
      ]);
      setResults(resultsResponse.data);
      setHistory(historyResponse.data);
    } catch (err) {
      setError('No fue posible cargar resultados del torneo.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const runNewTournament = async () => {
    try {
      setRunning(true);
      await api.post('/api/tournament/run');
      await fetchData();
    } catch (err) {
      setError('No se pudo ejecutar el torneo.');
    } finally {
      setRunning(false);
    }
  };

  return (
    <section className={styles.page}>
      <h1>Torneo Axelrod</h1>
      {loading && <p>Cargando ranking...</p>}
      {error && <p className={styles.error}>{error}</p>}

      <div className={styles.chartWrap}>
        <ResponsiveContainer width="100%" height={330}>
          <BarChart data={results} layout="vertical" margin={{ top: 10, right: 20, left: 20, bottom: 10 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis type="number" />
            <YAxis dataKey="strategy_name" type="category" width={130} />
            <Tooltip />
            <Bar dataKey="total_score" fill="#0d9488" radius={[0, 8, 8, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <table className={styles.table}>
        <thead>
          <tr>
            <th>Posicion</th>
            <th>Estrategia</th>
            <th>Puntaje total</th>
            <th>Promedio por ronda</th>
          </tr>
        </thead>
        <tbody>
          {results.map((row) => (
            <tr key={row.id}>
              <td>{row.rank_position}</td>
              <td>{row.strategy_name}</td>
              <td>{row.total_score}</td>
              <td>{row.avg_score_per_round}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <button onClick={runNewTournament} className={styles.runButton} disabled={running} type="button">
        {running ? 'Ejecutando torneo...' : 'Ejecutar nuevo torneo'}
      </button>

      <article className={styles.explain}>
        <h3>Por que Tit for Tat suele ganar</h3>
        <p>
          Tit for Tat combina cuatro propiedades robustas: no provoca, castiga rapido,
          perdona y es transparente. En poblaciones mixtas, evita espirales largas de
          castigo y captura muchos puntos cuando encuentra cooperadores.
        </p>
      </article>

      <section>
        <h3>Historial de simulaciones</h3>
        <ul className={styles.history}>
          {history.map((item) => (
            <li key={item.simulated_at}>
              <span>{new Date(item.simulated_at).toLocaleString()}</span>
              <strong>Puntaje ganador: {item.winning_score}</strong>
            </li>
          ))}
        </ul>
      </section>
    </section>
  );
}

export default Tournament;

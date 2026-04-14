import { BrowserRouter, Route, Routes } from 'react-router-dom';
import Navbar from './components/Navbar';
import About from './views/About/About';
import Dilemma from './views/Dilemma/Dilemma';
import StrategyExplained from './views/StrategyExplained/StrategyExplained';
import Strategies from './views/Strategies/Strategies';
import GameHistory from './views/GameHistory/GameHistory';
import Tournament from './views/Tournament/Tournament';
import Game from './views/Game/Game';
import styles from './App.module.css';

function App() {
  return (
    <BrowserRouter>
      <div className={styles.layout}>
        <Navbar />
        <main className={styles.main}>
          <Routes>
            <Route path="/" element={<About />} />
            <Route path="/dilemma" element={<Dilemma />} />
            <Route path="/strategies-explained" element={<StrategyExplained />} />
            <Route path="/strategies" element={<Strategies />} />
            <Route path="/history" element={<GameHistory />} />
            <Route path="/tournament" element={<Tournament />} />
            <Route path="/game" element={<Game />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
}

export default App;

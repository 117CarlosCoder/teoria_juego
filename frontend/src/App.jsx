import { BrowserRouter, Route, Routes } from 'react-router-dom';
import Navbar from './components/Navbar';
import Dilemma from './views/Dilemma/Dilemma';
import Strategies from './views/Strategies/Strategies';
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
            <Route path="/" element={<Dilemma />} />
            <Route path="/strategies" element={<Strategies />} />
            <Route path="/tournament" element={<Tournament />} />
            <Route path="/game" element={<Game />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
}

export default App;

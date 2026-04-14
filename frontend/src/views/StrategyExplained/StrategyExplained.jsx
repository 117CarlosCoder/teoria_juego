import { useState } from 'react';
import styles from './StrategyExplained.module.css';

const strategies = [
  {
    id: 'tit_for_tat',
    name: 'Ojo por Ojo',
    shortName: 'Tit for Tat',
    color: '#3b82f6',
    description: 'La estrategia más famosa en teoría de juegos. Comienza cooperando y luego replica exactamente lo que el oponente hizo en la ronda anterior.',
    rules: [
      'Ronda 1: COOPERA',
      'Rondas siguientes: Haz lo que hizo el oponente la ronda anterior'
    ],
    pros: ['Simple y lógica', 'Amable (empieza cooperando)', 'Vengativa (castiga traiciones)'],
    cons: ['Puede quedar atrapada en ciclos de traición', 'No perdona fácilmente'],
    example: 'Si el oponente cooperó, cooperas. Si traicionó, traicionas.',
    diagram: 'TitForTat'
  },
  {
    id: 'tit_for_two_tats',
    name: 'Ojo por Dos Ojos',
    shortName: 'Tit for Two Tats',
    color: '#8b5cf6',
    description: 'Una variación más tolerante de Tit for Tat. Permite dos traiciones antes de responder con una traición.',
    rules: [
      'Ronda 1: COOPERA',
      'Rondas siguientes: Solo traiciona si el oponente traicionó las últimas 2 rondas',
      'Si el oponente coopera nuevamente, regresa a cooperar'
    ],
    pros: ['Más tolerante que Tit for Tat', 'Menos vengativa', 'Permite reconciliación'],
    cons: ['Puede ser explotada por estrategias agresivas', 'Requiere más rondas para reaccionar'],
    example: 'El oponente traiciona una vez → sigues cooperando. Traiciona dos veces → traicionas.',
    diagram: 'TitForTwoTats'
  },
  {
    id: 'grim',
    name: 'Estrategia Grim (La Parca)',
    shortName: 'Grim Trigger',
    color: '#ef4444',
    description: 'Una estrategia muy vengativa. Coopera hasta que el oponente traiciona una sola vez, después traiciona siempre.',
    rules: [
      'Coopera mientras el oponente coopere',
      'Si el oponente traiciona UNA sola vez, traiciona por siempre'
    ],
    pros: ['Máximo castigo a la traición', 'Desalienta a los aprovechados'],
    cons: ['Muy vengativa', 'Nunca perdona', 'Lleva a mutua destrucción'],
    example: 'Si el oponente traiciona, ambos traicionan para siempre en el juego.',
    diagram: 'Grim'
  },
  {
    id: 'random',
    name: 'Estrategia Aleatoria',
    shortName: 'Random',
    color: '#f59e0b',
    description: 'Toma decisiones completamente al azar. 50% probabilidad de cooperar y 50% de traicionar.',
    rules: [
      'Cada ronda: elige aleatoriamente cooperar o traicionar con 50-50 de probabilidad'
    ],
    pros: ['Impredecible'],
    cons: ['Sin estrategia real', 'Generalmente obtiene resultados pobres', 'No aprende del oponente'],
    example: 'Cada ronda es como lanzar una moneda.',
    diagram: 'Random'
  },
  {
    id: 'joss',
    name: 'Joss (Tit for Tat Ruidosa)',
    shortName: 'Joss',
    color: '#06b6d4',
    description: 'Una versión de Tit for Tat que ocasionalmente traiciona incluso cuando debería cooperar (10% de probabilidad).',
    rules: [
      'Ronda 1: COOPERA',
      'Rondas siguientes: Replica al oponente, pero con 10% de probabilidad traiciona aleatoriamente'
    ],
    pros: ['Rompe ciclos de mutua traición', 'Introduce oportunidad de recuperación'],
    cons: ['Menos confiable que Tit for Tat', 'Puede ser explotada'],
    example: 'Generalmente haces lo que el oponente hizo, pero ocasionalmente lo sorprendes.',
    diagram: 'Joss'
  }
];

function StrategyDiagram({ type }) {
  if (type === 'TitForTat') {
    return (
      <svg viewBox="0 0 600 300" className={styles.diagram}>
        <defs>
          <marker id="arrowhead" markerWidth="10" markerHeight="10" refX="9" refY="3" orient="auto">
            <polygon points="0 0, 10 3, 0 6" fill="#1f2937" />
          </marker>
        </defs>
        {/* Iniciar */}
        <circle cx="100" cy="150" r="35" fill="#3b82f6" stroke="#000" strokeWidth="2"/>
        <text x="100" y="155" textAnchor="middle" fill="white" fontSize="14" fontWeight="bold">Inicio</text>
        
        {/* Cooperar */}
        <circle cx="250" cy="80" r="35" fill="#4ade80" stroke="#000" strokeWidth="2"/>
        <text x="250" y="85" textAnchor="middle" fill="white" fontSize="12" fontWeight="bold">Coopera</text>
        
        {/* Traicionar */}
        <circle cx="250" cy="220" r="35" fill="#ef4444" stroke="#000" strokeWidth="2"/>
        <text x="250" y="225" textAnchor="middle" fill="white" fontSize="12" fontWeight="bold">Traiciona</text>
        
        {/* Flechas */}
        <path d="M 130 135 L 220 100" stroke="#000" strokeWidth="2" fill="none" markerEnd="url(#arrowhead)"/>
        <text x="170" y="105" fontSize="11" fill="#1f2937">Ronda 1</text>
        
        <path d="M 130 165 L 220 200" stroke="#000" strokeWidth="2" fill="none" markerEnd="url(#arrowhead)"/>
        <text x="170" y="195" fontSize="11" fill="#1f2937">Si oponente traicionó</text>
        
        <path d="M 280 80 Q 350 50 420 80" stroke="#000" strokeWidth="2" fill="none" markerEnd="url(#arrowhead)"/>
        <text x="350" y="40" fontSize="11" fill="#1f2937">Si oponente cooperó</text>
        
        <path d="M 280 220 Q 350 250 420 220" stroke="#000" strokeWidth="2" fill="none" markerEnd="url(#arrowhead)"/>
        <text x="350" y="260" fontSize="11" fill="#1f2937">Si oponente traicionó</text>
        
        {/* Bucles */}
        <path d="M 430 50 Q 480 80 430 110" stroke="#4ade80" strokeWidth="2" fill="none" markerEnd="url(#arrowhead)"/>
        <circle cx="460" cy="70" r="2" fill="#4ade80"/>
        
        <path d="M 430 190 Q 480 220 430 250" stroke="#ef4444" strokeWidth="2" fill="none" markerEnd="url(#arrowhead)"/>
        <circle cx="460" cy="230" r="2" fill="#ef4444"/>
      </svg>
    );
  }

  if (type === 'TitForTwoTats') {
    return (
      <svg viewBox="0 0 600 350" className={styles.diagram}>
        <defs>
          <marker id="arrowhead2" markerWidth="10" markerHeight="10" refX="9" refY="3" orient="auto">
            <polygon points="0 0, 10 3, 0 6" fill="#1f2937" />
          </marker>
        </defs>
        {/* Título */}
        <text x="300" y="25" textAnchor="middle" fontSize="14" fontWeight="bold" fill="#1f2937">Tolerancia: Acepta 1 traición antes de responder</text>
        
        {/* Estados */}
        <circle cx="100" cy="150" r="30" fill="#8b5cf6" stroke="#000" strokeWidth="2"/>
        <text x="100" y="155" textAnchor="middle" fill="white" fontSize="12" fontWeight="bold">Inicio</text>
        
        <circle cx="280" cy="80" r="35" fill="#4ade80" stroke="#000" strokeWidth="2"/>
        <text x="280" y="85" textAnchor="middle" fill="white" fontSize="11" fontWeight="bold">Coopera</text>
        
        <circle cx="280" cy="220" r="35" fill="#fbbf24" stroke="#000" strokeWidth="2"/>
        <text x="280" y="225" textAnchor="middle" fill="white" fontSize="10" fontWeight="bold">1 Traición visto</text>
        
        <circle cx="450" cy="150" r="35" fill="#ef4444" stroke="#000" strokeWidth="2"/>
        <text x="450" y="155" textAnchor="middle" fill="white" fontSize="12" fontWeight="bold">Traiciona</text>
        
        {/* Flechas */}
        <path d="M 130 140 L 250 95" stroke="#000" strokeWidth="2" fill="none" markerEnd="url(#arrowhead2)"/>
        <text x="180" y="105" fontSize="10" fill="#1f2937">Ronda 1</text>
        
        <path d="M 130 170 L 250 210" stroke="#000" strokeWidth="2" fill="none" markerEnd="url(#arrowhead2)"/>
        <text x="170" y="180" fontSize="10" fill="#1f2937">1 traición</text>
        
        <path d="M 310 215 L 420 180" stroke="#000" strokeWidth="2" fill="none" markerEnd="url(#arrowhead2)"/>
        <text x="350" y="210" fontSize="10" fill="#1f2937">2da traición</text>
        
        {/* Bucles */}
        <path d="M 310 80 Q 350 40 390 80" stroke="#4ade80" strokeWidth="2" fill="none" markerEnd="url(#arrowhead2)"/>
        <text x="340" y="35" fontSize="9" fill="#1f2937">Oponente coopera</text>
        
        <path d="M 310 220 Q 350 260 390 220" stroke="#fbbf24" strokeWidth="2" fill="none" markerEnd="url(#arrowhead2)"/>
        <text x="340" y="285" fontSize="9" fill="#1f2937">Sigues cooperando</text>
      </svg>
    );
  }

  if (type === 'Grim') {
    return (
      <svg viewBox="0 0 600 250" className={styles.diagram}>
        <defs>
          <marker id="arrowhead3" markerWidth="10" markerHeight="10" refX="9" refY="3" orient="auto">
            <polygon points="0 0, 10 3, 0 6" fill="#1f2937" />
          </marker>
        </defs>
        {/* Punto importante */}
        <text x="300" y="25" textAnchor="middle" fontSize="14" fontWeight="bold" fill="#ef4444">UNA SOLA TRAICIÓN = TRAICIÓN ETERNA</text>
        
        {/* Estados */}
        <circle cx="100" cy="130" r="30" fill="#ef4444" stroke="#000" strokeWidth="2"/>
        <text x="100" y="135" textAnchor="middle" fill="white" fontSize="12" fontWeight="bold">Inicio</text>
        
        <circle cx="280" cy="80" r="35" fill="#4ade80" stroke="#000" strokeWidth="2"/>
        <text x="280" y="85" textAnchor="middle" fill="white" fontSize="11" fontWeight="bold">Coopera</text>
        
        <circle cx="450" cy="130" r="35" fill="#991b1b" stroke="#000" strokeWidth="3"/>
        <text x="450" y="135" textAnchor="middle" fill="white" fontSize="12" fontWeight="bold">CASTIGO</text>
        
        {/* Flechas */}
        <path d="M 130 120 L 250 95" stroke="#000" strokeWidth="2" fill="none" markerEnd="url(#arrowhead3)"/>
        <text x="180" y="100" fontSize="10" fill="#1f2937">Mientras coopera</text>
        
        <path d="M 310 85 L 420 130" stroke="#000" strokeWidth="2" fill="none" markerEnd="url(#arrowhead3)"/>
        <text x="345" y="95" fontSize="11" fill="#ef4444" fontWeight="bold">Traiciona</text>
        
        {/* Bucle infinito */}
        <path d="M 480 130 Q 500 200 450 200 Q 420 200 415 165" stroke="#991b1b" strokeWidth="3" fill="none" markerEnd="url(#arrowhead3)"/>
        <text x="480" y="210" fontSize="11" fill="#991b1b" fontWeight="bold">PARA SIEMPRE</text>
      </svg>
    );
  }

  if (type === 'Random') {
    return (
      <svg viewBox="0 0 600 250" className={styles.diagram}>
        <defs>
          <marker id="arrowhead4" markerWidth="10" markerHeight="10" refX="9" refY="3" orient="auto">
            <polygon points="0 0, 10 3, 0 6" fill="#1f2937" />
          </marker>
        </defs>
        {/* Inicio */}
        <circle cx="100" cy="130" r="30" fill="#f59e0b" stroke="#000" strokeWidth="2"/>
        <text x="100" y="135" textAnchor="middle" fill="white" fontSize="12" fontWeight="bold">Inicio</text>
        
        {/* 50/50 */}
        <circle cx="280" cy="70" r="30" fill="#4ade80" stroke="#000" strokeWidth="2"/>
        <text x="280" y="75" textAnchor="middle" fill="white" fontSize="12" fontWeight="bold">Coopera</text>
        
        <circle cx="280" cy="190" r="30" fill="#ef4444" stroke="#000" strokeWidth="2"/>
        <text x="280" y="195" textAnchor="middle" fill="white" fontSize="12" fontWeight="bold">Traiciona</text>
        
        {/* Flechas */}
        <path d="M 130 115 L 250 85" stroke="#000" strokeWidth="2" fill="none" markerEnd="url(#arrowhead4)"/>
        <text x="175" y="95" fontSize="12" fontWeight="bold" fill="#1f2937">50%</text>
        
        <path d="M 130 145 L 250 175" stroke="#000" strokeWidth="2" fill="none" markerEnd="url(#arrowhead4)"/>
        <text x="175" y="165" fontSize="12" fontWeight="bold" fill="#1f2937">50%</text>
        
        {/* Bucles de regreso */}
        <path d="M 310 70 Q 350 40 350 110" stroke="#f59e0b" strokeWidth="2" fill="none" markerEnd="url(#arrowhead4)"/>
        <path d="M 310 190 Q 350 220 350 150" stroke="#f59e0b" strokeWidth="2" fill="none" markerEnd="url(#arrowhead4)"/>
        
        <text x="380" y="130" fontSize="11" fill="#1f2937">Cada ronda</text>
        <text x="380" y="145" fontSize="11" fill="#1f2937">es aleatoria</text>
      </svg>
    );
  }

  if (type === 'Joss') {
    return (
      <svg viewBox="0 0 600 300" className={styles.diagram}>
        <defs>
          <marker id="arrowhead5" markerWidth="10" markerHeight="10" refX="9" refY="3" orient="auto">
            <polygon points="0 0, 10 3, 0 6" fill="#1f2937" />
          </marker>
        </defs>
        <text x="300" y="25" textAnchor="middle" fontSize="13" fontWeight="bold" fill="#1f2937">Tit for Tat + 10% de Traición Aleatoria</text>
        
        {/* Estados */}
        <circle cx="100" cy="150" r="30" fill="#06b6d4" stroke="#000" strokeWidth="2"/>
        <text x="100" y="155" textAnchor="middle" fill="white" fontSize="12" fontWeight="bold">Inicio</text>
        
        <circle cx="260" cy="80" r="35" fill="#4ade80" stroke="#000" strokeWidth="2"/>
        <text x="260" y="85" textAnchor="middle" fill="white" fontSize="11" fontWeight="bold">Coopera</text>
        
        <circle cx="260" cy="220" r="35" fill="#ef4444" stroke="#000" strokeWidth="2"/>
        <text x="260" y="225" textAnchor="middle" fill="white" fontSize="11" fontWeight="bold">Traiciona</text>
        
        <circle cx="420" cy="150" r="35" fill="#fbbf24" stroke="#000" strokeWidth="2"/>
        <text x="420" y="155" textAnchor="middle" fill="white" fontSize="10" fontWeight="bold">Traición</text>
        <text x="420" y="168" textAnchor="middle" fill="white" fontSize="9" fontWeight="bold">10%</text>
        
        {/* Flechas */}
        <path d="M 130 140 L 230 90" stroke="#000" strokeWidth="2" fill="none" markerEnd="url(#arrowhead5)"/>
        <text x="170" y="105" fontSize="10" fill="#1f2937">Ronda 1</text>
        
        <path d="M 130 160 L 230 210" stroke="#000" strokeWidth="2" fill="none" markerEnd="url(#arrowhead5)"/>
        <text x="155" y="175" fontSize="10" fill="#1f2937">Si oponente traicionó</text>
        
        <path d="M 295 85 L 390 155" stroke="#000" strokeWidth="2" fill="none" markerEnd="url(#arrowhead5)"/>
        <text x="330" y="110" fontSize="9" fill="#1f2937">Sorpresa!</text>
        
        {/* Bucles */}
        <path d="M 290 80 Q 340 40 380 80" stroke="#4ade80" strokeWidth="2" fill="none" markerEnd="url(#arrowhead5)"/>
        <text x="330" y="35" fontSize="9" fill="#1f2937">90% Coopera</text>
        
        <path d="M 455 150 Q 480 200 290 220" stroke="#06b6d4" strokeWidth="2" fill="none" markerEnd="url(#arrowhead5)"/>
        <text x="420" y="250" fontSize="9" fill="#1f2937">Regresa a réplica</text>
      </svg>
    );
  }

  return null;
}

function StrategyExplained() {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const strategy = strategies[selectedIndex];

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h1>Estrategias Explicadas</h1>
        <p>Aprende cómo funcionan las diferentes estrategias en el Dilema del Prisionero</p>
      </header>

      <div className={styles.content}>
        {/* Selector de estrategias */}
        <nav className={styles.strategyNav}>
          {strategies.map((s, index) => (
            <button
              key={s.id}
              className={`${styles.strategyButton} ${index === selectedIndex ? styles.active : ''}`}
              onClick={() => setSelectedIndex(index)}
              style={{
                borderColor: s.color,
                backgroundColor: index === selectedIndex ? s.color : 'transparent'
              }}
            >
              {s.shortName}
            </button>
          ))}
        </nav>

        {/* Contenido de la estrategia */}
        <div className={styles.strategyContent}>
          <div className={styles.strategyHeader}>
            <h2 style={{ color: strategy.color }}>{strategy.name}</h2>
            <p className={styles.description}>{strategy.description}</p>
          </div>

          <div className={styles.strategyGrid}>
            {/* Diagrama */}
            <div className={styles.diagramSection}>
              <h3>Flujo de Decisión</h3>
              <StrategyDiagram type={strategy.diagram} />
            </div>

            {/* Reglas */}
            <div className={styles.infoSection}>
              <h3>Reglas</h3>
              <ul className={styles.rulesList}>
                {strategy.rules.map((rule, i) => (
                  <li key={i}>{rule}</li>
                ))}
              </ul>
            </div>
          </div>

          <div className={styles.strategyGrid}>
            {/* Ventajas */}
            <div className={styles.infoSection}>
              <h3 style={{ color: '#4ade80' }}>Ventajas ✓</h3>
              <ul className={styles.prosList}>
                {strategy.pros.map((pro, i) => (
                  <li key={i}>{pro}</li>
                ))}
              </ul>
            </div>

            {/* Desventajas */}
            <div className={styles.infoSection}>
              <h3 style={{ color: '#ef4444' }}>Desventajas ✗</h3>
              <ul className={styles.consList}>
                {strategy.cons.map((con, i) => (
                  <li key={i}>{con}</li>
                ))}
              </ul>
            </div>
          </div>

          {/* Ejemplo */}
          <div className={styles.exampleSection}>
            <h3>Ejemplo en Acción</h3>
            <p className={styles.exampleText}>{strategy.example}</p>
          </div>
        </div>
      </div>

      {/* Comparador rápido */}
      <div className={styles.comparison}>
        <h3>Comparación Rápida</h3>
        <table className={styles.comparisonTable}>
          <tbody>
            <tr>
              <th>Estrategia</th>
              <th>Amabilidad</th>
              <th>Represalia</th>
              <th>Perdón</th>
              <th>Complejidad</th>
            </tr>
            {strategies.map((s) => (
              <tr key={s.id}>
                <td style={{ fontWeight: 'bold', color: s.color }}>{s.shortName}</td>
                <td>{s.id === 'tit_for_tat' ? '✓✓' : s.id === 'tit_for_two_tats' ? '✓✓' : s.id === 'grim' ? '✓' : s.id === 'joss' ? '✓' : '✗'}</td>
                <td>{s.id === 'grim' ? '✓✓✓' : s.id === 'tit_for_tat' ? '✓✓' : s.id === 'joss' ? '✓' : s.id === 'random' ? '✓' : '✓'}</td>
                <td>{s.id === 'tit_for_two_tats' ? '✓✓' : s.id === 'joss' ? '✓' : s.id === 'tit_for_tat' ? '✓' : '✗'}</td>
                <td>{s.id === 'random' ? 'Muy Baja' : s.id === 'tit_for_tat' ? 'Muy Baja' : s.id === 'grim' ? 'Baja' : s.id === 'tit_for_two_tats' ? 'Media' : 'Media'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default StrategyExplained;

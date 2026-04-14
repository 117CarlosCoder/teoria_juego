import { useState } from 'react';
import styles from './About.module.css';

const slides = [
  {
    title: 'El Dilema del Prisionero',
    subtitle: 'Teoría de Juegos',
    content: 'Un modelo clásico que estudia cómo los individuos racionales pueden no cooperar, incluso cuando la cooperación mutua sería beneficiosa para todos.',
    icon: '🎮'
  },
  {
    title: 'Enseñanza mediante Simulación',
    subtitle: 'Aprendizaje Interactivo',
    content: 'A través de simulaciones interactivas, experimentamos cómo diferentes estrategias generan distintos resultados. La práctica directa nos ayuda a entender conceptos abstractos de forma tangible.',
    icon: '🔄'
  },
  {
    title: 'Almacenamiento en Base de Datos',
    subtitle: 'Análisis y Persistencia',
    content: 'Cada partida se registra en una base de datos. Esto nos permite analizar patrones, comparar estrategias y estudiar el comportamiento a largo plazo de diferentes enfoques.',
    icon: '💾'
  },
  {
    title: 'Estrategias Variadas',
    subtitle: 'Desde lo Simple a lo Complejo',
    content: 'Desde "Cooperar Siempre" hasta "Ojo por Ojo", cada estrategia tiene patrones únicos. Descubre cuál es más efectiva bajo diferentes condiciones.',
    icon: '⚡'
  },
  {
    title: 'Torneo de Estrategias',
    subtitle: 'Competencia Libre',
    content: 'Enfrenta múltiples estrategias en un torneo round-robin. Observa cómo diferentes enfoques interactúan y compiten en el mismo ecosistema.',
    icon: '🏆'
  },
  {
    title: 'Conclusiones',
    subtitle: 'Lo que Aprendemos',
    content: 'La cooperación no siempre es irracional. La historia, el contexto y la predictibilidad son cruciales. La simulación nos muestra que la realidad es más compleja que nuestras intuiciones.',
    icon: '💡'
  }
];

function About() {
  const [currentSlide, setCurrentSlide] = useState(0);

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % slides.length);
  };

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length);
  };

  const slide = slides[currentSlide];

  return (
    <section className={styles.aboutContainer}>
      <div className={styles.slideshow}>
        <div className={styles.slide}>
          <div className={styles.slideIcon}>{slide.icon}</div>
          <h1 className={styles.slideTitle}>{slide.title}</h1>
          <h2 className={styles.slideSubtitle}>{slide.subtitle}</h2>
          <p className={styles.slideContent}>{slide.content}</p>
        </div>

        <div className={styles.controls}>
          <button 
            className={styles.buttonPrev}
            onClick={prevSlide}
            aria-label="Diapositiva anterior"
          >
            ← ATRÁS
          </button>

          <div className={styles.slideIndicator}>
            {currentSlide + 1} / {slides.length}
          </div>

          <button 
            className={styles.buttonNext}
            onClick={nextSlide}
            aria-label="Siguiente diapositiva"
          >
            SIGUIENTE →
          </button>
        </div>

        <div className={styles.dots}>
          {slides.map((_, index) => (
            <button
              key={index}
              className={`${styles.dot} ${index === currentSlide ? styles.dotActive : ''}`}
              onClick={() => setCurrentSlide(index)}
              aria-label={`Ir a diapositiva ${index + 1}`}
            />
          ))}
        </div>
      </div>

      <div className={styles.features}>
        <div className={styles.featureCard}>
          <div className={styles.featureIcon}>📊</div>
          <h3>Análisis Real</h3>
          <p>Datos almacenados y consultables en tiempo real</p>
        </div>
        <div className={styles.featureCard}>
          <div className={styles.featureIcon}>🎯</div>
          <h3>Múltiples Estrategias</h3>
          <p>Experimenta con distintos enfoques y resultados</p>
        </div>
        <div className={styles.featureCard}>
          <div className={styles.featureIcon}>🌐</div>
          <h3>Competencia Global</h3>
          <p>Torneos donde todas las estrategias interactúan</p>
        </div>
      </div>
    </section>
  );
}

export default About;

import { SERVICES } from '@/config/services';
import styles from './ServicesSection.module.css';

export function ServicesSection() {
  return (
    <section id="services" className={styles.section}>
      <div className="container">
        <h2 className="section-title">Des séances sur-mesure pour vous éclairer</h2>
        <p className="section-subtitle">
          Chaque rendez-vous est préparé en amont pour vous apporter des réponses concrètes et des pistes d’évolution
          adaptées à votre situation.
        </p>
        <div className="card-grid">
          {SERVICES.map((service) => (
            <article key={service.id} className="card">
              <header className={styles.header}>
                <h3>{service.title}</h3>
                <span className={styles.price}>{service.priceEUR} €</span>
              </header>
              <p>{service.description}</p>
              <ul className={styles.focusList}>
                {service.focus.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
              <footer className={styles.footer}>
                <span>Durée : {service.durationMinutes} minutes</span>
                <a className={styles.link} href="#reservation">
                  Réserver ce format →
                </a>
              </footer>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

'use client';

import Image from 'next/image';
import styles from './HeroSection.module.css';

export function HeroSection() {
  return (
    <header className={`hero ${styles.wrapper}`}>
      <div className={`${styles.grid} hero-grid container`}>
        <div className={styles.content}>
          <span className="badge">Numérologie intuitive &amp; humaniste</span>
          <h1>
            Mettez les chiffres à votre service
            <br />
            pour éclairer vos décisions
          </h1>
          <p>
            Depuis plus de 20 ans, Daniel accompagne des centaines de personnes à mieux se comprendre grâce à une
            approche chaleureuse et personnalisée de la numérologie. Réservez une séance en ligne en quelques clics.
          </p>
          <div className={styles.actions}>
            <a className="gradient-button" href="#reservation">
              Réserver une consultation
            </a>
            <a className={styles.secondary} href="#services">
              Découvrir les accompagnements
            </a>
          </div>
          <ul className={styles.trustList}>
            <li>✅ Paiement sécurisé</li>
            <li>✅ Rendez-vous en visio ou téléphone</li>
            <li>✅ Agenda synchronisé automatiquement</li>
          </ul>
        </div>
        <div className={styles.visual}>
          <div className={styles.portraitCard}>
            <Image src="/portrait-daniel.svg" alt="Portrait de Daniel, numérologue" width={480} height={520} />
            <div className={styles.portraitCaption}>
              <strong>Daniel Marchand</strong>
              <span>Numérologue &amp; formateur</span>
            </div>
          </div>
          <div className={styles.statsCard}>
            <div>
              <strong>+20 ans</strong>
              <span>d’expérience</span>
            </div>
            <div>
              <strong>98%</strong>
              <span>de clients satisfaits</span>
            </div>
            <div>
              <strong>3 formules</strong>
              <span>adaptées à vos besoins</span>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}

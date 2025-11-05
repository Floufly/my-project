import styles from './Footer.module.css';

export function Footer() {
  return (
    <footer className={styles.footer}>
      <div className="container">
        <div className={styles.grid}>
          <div>
            <h4>À propos de Daniel</h4>
            <p>
              Numérologue depuis 2003, Daniel accompagne les particuliers et les entrepreneurs à révéler leur potentiel en
              s’appuyant sur une approche humaniste et pragmatique de la numérologie.
            </p>
          </div>
          <div>
            <h4>Contact direct</h4>
            <ul>
              <li>
                <a href="mailto:contact@numerologie-daniel.fr">contact@numerologie-daniel.fr</a>
              </li>
              <li>
                <a href="https://t.me/danielnumerologie" target="_blank" rel="noreferrer">
                  Telegram : @danielnumerologie
                </a>
              </li>
              <li>Téléphone : +33 6 12 34 56 78</li>
            </ul>
          </div>
          <div>
            <h4>Suivi et ressources</h4>
            <p>
              Après chaque séance, vous recevez un compte-rendu détaillé et des pistes d’intégration concrètes pour avancer en
              confiance.
            </p>
          </div>
        </div>
        <p className={styles.bottom}>© {new Date().getFullYear()} Daniel Marchand — Numérologie intuitive.</p>
      </div>
    </footer>
  );
}

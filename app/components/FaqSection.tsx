import styles from './FaqSection.module.css';

const FAQ = [
  {
    question: 'Comment se déroule la consultation ? ',
    answer:
      'Une fois le paiement confirmé, vous recevez un e-mail avec le lien de connexion visio (ou le numéro d’appel) ainsi qu’un questionnaire préparatoire. Le rendez-vous est enregistré dans l’agenda de Daniel automatiquement.'
  },
  {
    question: 'Puis-je reprogrammer mon rendez-vous ?',
    answer:
      'Oui, vous pouvez modifier ou annuler votre créneau jusqu’à 48h avant la séance en répondant simplement au mail de confirmation. Nous vous proposerons rapidement une nouvelle disponibilité.'
  },
  {
    question: 'Quels moyens de paiement sont acceptés ?',
    answer:
      'Vous pouvez régler par carte bancaire (via Stripe), par cryptomonnaie (Coinbase Commerce) ou via Telegram. Si l’un des canaux est indisponible, vous recevrez automatiquement une alternative simple par e-mail.'
  }
];

export function FaqSection() {
  return (
    <section className={styles.section}>
      <div className="container">
        <h2 className="section-title">Questions fréquentes</h2>
        <div className={styles.list}>
          {FAQ.map((item) => (
            <details key={item.question} className={styles.item}>
              <summary>{item.question}</summary>
              <p>{item.answer}</p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}

import styles from './TestimonialsSection.module.css';

const TESTIMONIALS = [
  {
    name: 'Claire, 38 ans',
    quote:
      'La séance m’a permis de comprendre les cycles que je traversais et d’oser un changement professionnel. Daniel est très à l’écoute et bienveillant.'
  },
  {
    name: 'Olivier, 45 ans',
    quote:
      'Un accompagnement précis, sans jugement. J’ai été bluffé par la justesse de l’analyse. Les recommandations étaient concrètes et faciles à mettre en place.'
  },
  {
    name: 'Sonia, 52 ans',
    quote:
      'Enfin un regard clair sur mes schémas relationnels ! La consultation m’a donné des clés pour apaiser mes interactions familiales. Merci pour cette guidance.'
  }
];

export function TestimonialsSection() {
  return (
    <section className={styles.section}>
      <div className="container">
        <h2 className="section-title">Ils témoignent de leur transformation</h2>
        <p className="section-subtitle">
          Des personnes accompagnées partout dans la francophonie, avec un suivi simple par visio-conférence ou par
          téléphone.
        </p>
        <div className={styles.grid}>
          {TESTIMONIALS.map((testimonial) => (
            <figure key={testimonial.name} className={styles.card}>
              <blockquote>“{testimonial.quote}”</blockquote>
              <figcaption>{testimonial.name}</figcaption>
            </figure>
          ))}
        </div>
      </div>
    </section>
  );
}

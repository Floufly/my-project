import { notFound } from 'next/navigation';
import { getSiteBySlug } from '@/lib/sites-db';
import { PLANS } from '@/lib/subscription-plans';
import SubscribeButton from './SubscribeButton';

export default async function SitePage({ params }: { params: { slug: string } }) {
  const site = getSiteBySlug(params.slug);
  if (!site) notFound();

  const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(site.address)}`;
  const stars = site.rating ? Math.round(site.rating) : 0;

  return (
    <html lang="fr">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>{site.businessName}</title>
        <meta name="description" content={site.tagline} />
        <style>{`
          * { box-sizing: border-box; margin: 0; padding: 0; }
          body { font-family: 'Segoe UI', Arial, sans-serif; color: #1e293b; }
          a { color: inherit; text-decoration: none; }
          .hero { background: linear-gradient(135deg, ${site.primaryColor} 0%, ${site.primaryColor}cc 100%); color: white; padding: 4rem 1.5rem 5rem; text-align: center; }
          .hero h1 { font-size: clamp(2rem, 5vw, 3rem); font-weight: 800; margin-bottom: 1rem; }
          .hero p { font-size: 1.2rem; opacity: 0.9; max-width: 600px; margin: 0 auto 1.5rem; }
          .badge { display: inline-block; background: rgba(255,255,255,0.2); border: 1px solid rgba(255,255,255,0.4); padding: 4px 14px; border-radius: 20px; font-size: 0.85rem; margin-bottom: 1.5rem; }
          .cta-btn { display: inline-block; background: white; color: ${site.primaryColor}; font-weight: 700; padding: 0.8rem 2rem; border-radius: 50px; font-size: 1rem; margin-top: 0.5rem; box-shadow: 0 4px 15px rgba(0,0,0,0.15); transition: transform 0.2s; }
          .cta-btn:hover { transform: translateY(-2px); }
          .section { padding: 3rem 1.5rem; max-width: 800px; margin: 0 auto; }
          .section-title { font-size: 1.5rem; font-weight: 700; margin-bottom: 1.5rem; color: ${site.primaryColor}; }
          .services-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 1rem; }
          .service-card { background: ${site.secondaryColor}; border-left: 4px solid ${site.primaryColor}; padding: 1rem 1.2rem; border-radius: 8px; font-weight: 600; font-size: 0.95rem; }
          .contact-box { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 2rem; }
          .contact-row { display: flex; align-items: flex-start; gap: 1rem; margin-bottom: 1.2rem; font-size: 1rem; }
          .contact-icon { font-size: 1.4rem; min-width: 32px; }
          .rating-row { display: flex; align-items: center; gap: 8px; margin-bottom: 1.5rem; }
          .stars { color: #f59e0b; font-size: 1.2rem; letter-spacing: 2px; }
          .divider { border: none; border-top: 1px solid #e2e8f0; margin: 0; }
          .footer { background: #1e293b; color: #94a3b8; text-align: center; padding: 1.5rem; font-size: 0.85rem; }
          .demo-banner { background: #fef3c7; border-bottom: 2px solid #f59e0b; padding: 0.8rem 1.5rem; text-align: center; font-size: 0.9rem; color: #92400e; font-weight: 600; }
          .map-btn { display: inline-flex; align-items: center; gap: 8px; background: ${site.primaryColor}; color: white; padding: 0.6rem 1.4rem; border-radius: 8px; font-weight: 600; margin-top: 0.5rem; font-size: 0.9rem; }
          .pricing-section { background: #0f172a; padding: 3rem 1.5rem; text-align: center; }
          .pricing-title { color: white; font-size: 1.6rem; font-weight: 800; margin-bottom: 0.5rem; }
          .pricing-sub { color: #94a3b8; margin-bottom: 2rem; font-size: 1rem; }
          .plans-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 1.2rem; max-width: 800px; margin: 0 auto 1.5rem; }
          .plan-card { background: #1e293b; border-radius: 12px; padding: 1.5rem; border: 2px solid #334155; position: relative; text-align: left; }
          .plan-card.highlighted { border-color: ${site.primaryColor}; }
          .plan-badge { position: absolute; top: -12px; left: 50%; transform: translateX(-50%); background: ${site.primaryColor}; color: white; font-size: 0.75rem; font-weight: 700; padding: 3px 12px; border-radius: 20px; white-space: nowrap; }
          .plan-name { color: white; font-weight: 700; font-size: 1.1rem; margin-bottom: 4px; }
          .plan-price { color: white; font-size: 2rem; font-weight: 800; margin-bottom: 4px; }
          .plan-price span { font-size: 1rem; font-weight: 400; color: #94a3b8; }
          .plan-desc { color: #94a3b8; font-size: 0.85rem; margin-bottom: 1rem; }
          .plan-features { list-style: none; margin-bottom: 1.2rem; }
          .plan-features li { color: #cbd5e1; font-size: 0.85rem; padding: 3px 0; }
          .plan-features li::before { content: "✓ "; color: ${site.primaryColor}; font-weight: 700; }
          .plan-btn { display: block; width: 100%; padding: 0.7rem; border-radius: 8px; font-weight: 700; font-size: 0.95rem; cursor: pointer; border: none; text-align: center; }
          .plan-btn.primary { background: ${site.primaryColor}; color: white; }
          .plan-btn.secondary { background: transparent; color: #cbd5e1; border: 1px solid #475569; }
          .trial-note { color: #64748b; font-size: 0.82rem; margin-top: 0.5rem; }
          @media(max-width:500px){ .hero { padding: 3rem 1rem 4rem; } .section { padding: 2rem 1rem; } .plans-grid { grid-template-columns: 1fr; } }
        `}</style>
      </head>
      <body>
        <div className="demo-banner">
          🌐 Site de démonstration — Votre site web professionnel, gratuit pendant 30 jours
        </div>

        {/* Hero */}
        <section className="hero">
          <div className="badge">{site.category.charAt(0).toUpperCase() + site.category.slice(1)} · {site.city}</div>
          <h1>{site.businessName}</h1>
          <p>{site.tagline}</p>
          {site.phone && (
            <a href={`tel:${site.phone}`} className="cta-btn">
              📞 Nous appeler
            </a>
          )}
        </section>

        {/* Rating */}
        {site.rating && (
          <div style={{ background: site.secondaryColor, padding: '1.5rem', textAlign: 'center' }}>
            <div className="rating-row" style={{ justifyContent: 'center' }}>
              <span className="stars">{'★'.repeat(stars)}{'☆'.repeat(5 - stars)}</span>
              <span style={{ fontWeight: 700, fontSize: '1.1rem' }}>{site.rating}/5</span>
              <span style={{ color: '#64748b' }}>· {site.reviewCount} avis Google</span>
            </div>
          </div>
        )}

        <hr className="divider" />

        {/* Services */}
        <section className="section">
          <h2 className="section-title">Nos services</h2>
          <div className="services-grid">
            {site.services.map((s) => (
              <div key={s} className="service-card">✓ {s}</div>
            ))}
          </div>
        </section>

        <hr className="divider" />

        {/* Contact */}
        <section className="section">
          <h2 className="section-title">Nous trouver</h2>
          <div className="contact-box">
            <div className="contact-row">
              <span className="contact-icon">📍</span>
              <div>
                <div style={{ fontWeight: 600 }}>Adresse</div>
                <div style={{ color: '#475569', marginTop: 2 }}>{site.address}</div>
                <a href={mapsUrl} target="_blank" rel="noopener" className="map-btn" style={{ marginTop: '0.7rem' }}>
                  🗺️ Voir sur Google Maps
                </a>
              </div>
            </div>
            {site.phone && (
              <div className="contact-row">
                <span className="contact-icon">📞</span>
                <div>
                  <div style={{ fontWeight: 600 }}>Téléphone</div>
                  <a href={`tel:${site.phone}`} style={{ color: site.primaryColor, fontWeight: 600, fontSize: '1.1rem' }}>{site.phone}</a>
                </div>
              </div>
            )}
          </div>
        </section>

        {/* Pricing */}
        <section className="pricing-section">
          <h2 className="pricing-title">Gardez votre site en ligne</h2>
          <p className="pricing-sub">Essai gratuit 30 jours · Sans engagement · Résiliable à tout moment</p>
          <div className="plans-grid">
            {PLANS.map((plan) => (
              <div key={plan.id} className={`plan-card${plan.highlighted ? ' highlighted' : ''}`}>
                {plan.highlighted && <span className="plan-badge">⭐ Le plus populaire</span>}
                <div className="plan-name">{plan.name}</div>
                <div className="plan-price">{plan.priceEur}€<span>/mois</span></div>
                <div className="plan-desc">{plan.description}</div>
                <ul className="plan-features">
                  {plan.features.map((f) => <li key={f}>{f}</li>)}
                </ul>
                <SubscribeButton planId={plan.id} slug={site.slug} highlighted={plan.highlighted} primaryColor={site.primaryColor} />
                <p className="trial-note">30 jours gratuits, puis {plan.priceEur}€/mois</p>
              </div>
            ))}
          </div>
          <p style={{ color: '#475569', fontSize: '0.85rem' }}>
            Des questions ? Appelez-nous au {site.phone ?? 'votre numéro'}
          </p>
        </section>

        <footer className="footer">
          <p>© {new Date().getFullYear()} {site.businessName} · Tous droits réservés</p>
          <p style={{ marginTop: 4 }}>Site créé avec ❤️ — <span style={{ color: '#f59e0b' }}>Votre site professionnel en 24h</span></p>
        </footer>
      </body>
    </html>
  );
}

import { notFound } from 'next/navigation';
import { getSiteBySlug } from '@/lib/sites-db';

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
          @media(max-width:500px){ .hero { padding: 3rem 1rem 4rem; } .section { padding: 2rem 1rem; } }
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

        <footer className="footer">
          <p>© {new Date().getFullYear()} {site.businessName} · Tous droits réservés</p>
          <p style={{ marginTop: 4 }}>Site créé avec ❤️ — <span style={{ color: '#f59e0b' }}>Votre site professionnel en 24h</span></p>
        </footer>
      </body>
    </html>
  );
}

import type { ScannedBusiness } from './scanner-db';
import type { GeneratedSite } from './sites-db';

type TemplateConfig = {
  template: GeneratedSite['template'];
  primaryColor: string;
  secondaryColor: string;
  tagline: (name: string) => string;
  services: string[];
};

const CATEGORY_CONFIG: Record<string, TemplateConfig> = {
  restaurant: {
    template: 'food',
    primaryColor: '#c2410c',
    secondaryColor: '#fff7ed',
    tagline: (n) => `Savourez l'authenticité chez ${n}`,
    services: ['Déjeuner', 'Dîner', 'Plats à emporter', 'Réservation de groupe', 'Menu du jour'],
  },
  boulangerie: {
    template: 'food',
    primaryColor: '#92400e',
    secondaryColor: '#fffbeb',
    tagline: (n) => `Pains et viennoiseries artisanaux — ${n}`,
    services: ['Pains frais', 'Viennoiseries', 'Pâtisseries', 'Sandwichs', 'Commandes spéciales'],
  },
  pizzeria: {
    template: 'food',
    primaryColor: '#b91c1c',
    secondaryColor: '#fff1f2',
    tagline: (n) => `La vraie pizza italienne chez ${n}`,
    services: ['Pizzas sur place', 'Livraison', 'À emporter', 'Pizzas personnalisées', 'Menu famille'],
  },
  café: {
    template: 'food',
    primaryColor: '#78350f',
    secondaryColor: '#fffbeb',
    tagline: (n) => `Votre pause café au ${n}`,
    services: ['Cafés & boissons', 'Petits-déjeuners', 'Snacking', 'Wi-Fi gratuit', 'Espace coworking'],
  },
  bar: {
    template: 'food',
    primaryColor: '#1e3a5f',
    secondaryColor: '#eff6ff',
    tagline: (n) => `Bonne ambiance garantie au ${n}`,
    services: ['Cocktails', 'Bières artisanales', 'Happy hour', 'Soirées thématiques', 'Privatisation'],
  },
  boucherie: {
    template: 'food',
    primaryColor: '#9f1239',
    secondaryColor: '#fff1f2',
    tagline: (n) => `Viandes de qualité chez ${n}`,
    services: ['Viandes fraîches', 'Charcuterie', 'Volailles', 'Plats cuisinés', 'Commandes sur mesure'],
  },
  coiffeur: {
    template: 'beauty',
    primaryColor: '#7c3aed',
    secondaryColor: '#f5f3ff',
    tagline: (n) => `Votre style, notre passion — Salon ${n}`,
    services: ['Coupe homme/femme', 'Coloration', 'Balayage', 'Lissage', 'Soin capillaire'],
  },
  pharmacie: {
    template: 'health',
    primaryColor: '#059669',
    secondaryColor: '#ecfdf5',
    tagline: (n) => `Votre santé, notre priorité — ${n}`,
    services: ['Médicaments', 'Conseils santé', 'Vaccinations', 'Tests rapides', 'Livraison à domicile'],
  },
  médecin: {
    template: 'health',
    primaryColor: '#0369a1',
    secondaryColor: '#f0f9ff',
    tagline: (n) => `Dr. ${n} — À votre écoute`,
    services: ['Consultations', 'Suivi patient', 'Téléconsultation', 'Certificats médicaux', 'Urgences'],
  },
  dentiste: {
    template: 'health',
    primaryColor: '#0284c7',
    secondaryColor: '#f0f9ff',
    tagline: (n) => `Sourire sain et éclatant — Cabinet ${n}`,
    services: ['Détartrage', 'Soins dentaires', 'Orthodontie', 'Implants', 'Blanchiment'],
  },
  kinésithérapeute: {
    template: 'health',
    primaryColor: '#0f766e',
    secondaryColor: '#f0fdfa',
    tagline: (n) => `Retrouvez votre mobilité avec ${n}`,
    services: ['Rééducation', 'Massage thérapeutique', 'Ostéopathie', 'Sport', 'Domicile'],
  },
  vétérinaire: {
    template: 'health',
    primaryColor: '#16a34a',
    secondaryColor: '#f0fdf4',
    tagline: (n) => `Le bien-être de vos animaux — ${n}`,
    services: ['Consultations', 'Vaccinations', 'Chirurgie', 'Urgences 24h', 'Toilettage'],
  },
  plombier: {
    template: 'services',
    primaryColor: '#0369a1',
    secondaryColor: '#f0f9ff',
    tagline: (n) => `Dépannage rapide et fiable — ${n}`,
    services: ['Dépannage urgent', 'Installation sanitaire', 'Détection de fuites', 'Chaudière', 'Devis gratuit'],
  },
  électricien: {
    template: 'services',
    primaryColor: '#ca8a04',
    secondaryColor: '#fefce8',
    tagline: (n) => `Installations électriques certifiées — ${n}`,
    services: ['Dépannage électrique', 'Tableau électrique', 'Domotique', 'Éclairage', 'Devis gratuit'],
  },
  garage: {
    template: 'services',
    primaryColor: '#374151',
    secondaryColor: '#f9fafb',
    tagline: (n) => `Votre voiture entre de bonnes mains — Garage ${n}`,
    services: ['Révision complète', 'Réparation', 'Contrôle technique', 'Pneumatiques', 'Diagnostic'],
  },
  avocat: {
    template: 'services',
    primaryColor: '#1e3a5f',
    secondaryColor: '#eff6ff',
    tagline: (n) => `Me ${n} — Votre défense, notre engagement`,
    services: ['Droit civil', 'Droit pénal', 'Droit du travail', 'Consultations', 'Médiation'],
  },
  comptable: {
    template: 'services',
    primaryColor: '#1e40af',
    secondaryColor: '#eff6ff',
    tagline: (n) => `Votre comptabilité simplifiée — Cabinet ${n}`,
    services: ['Comptabilité', 'Déclarations fiscales', 'Paie', 'Création d\'entreprise', 'Audit'],
  },
  hotel: {
    template: 'retail',
    primaryColor: '#92400e',
    secondaryColor: '#fffbeb',
    tagline: (n) => `Bienvenue à l'Hôtel ${n}`,
    services: ['Chambres confortables', 'Petit-déjeuner', 'Wi-Fi gratuit', 'Parking', 'Salle de réunion'],
  },
  épicerie: {
    template: 'retail',
    primaryColor: '#15803d',
    secondaryColor: '#f0fdf4',
    tagline: (n) => `Produits frais et locaux — ${n}`,
    services: ['Fruits & légumes', 'Épicerie fine', 'Produits locaux', 'Bio', 'Livraison'],
  },
  fleuriste: {
    template: 'retail',
    primaryColor: '#be185d',
    secondaryColor: '#fdf2f8',
    tagline: (n) => `Fleurs fraîches pour tous vos moments — ${n}`,
    services: ['Bouquets', 'Compositions florales', 'Mariage', 'Deuil', 'Abonnement fleurs'],
  },
};

const DEFAULT_CONFIG: TemplateConfig = {
  template: 'services',
  primaryColor: '#2563eb',
  secondaryColor: '#eff6ff',
  tagline: (n) => `Bienvenue chez ${n}`,
  services: ['Service professionnel', 'Devis gratuit', 'Intervention rapide', 'Sur rendez-vous'],
};

function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .slice(0, 60);
}

export function generateSiteData(business: ScannedBusiness): Omit<GeneratedSite, 'id'> {
  const config = CATEGORY_CONFIG[business.category] ?? DEFAULT_CONFIG;

  const baseSlug = slugify(business.name);
  const citySlug = slugify(business.city);
  const slug = `${baseSlug}-${citySlug}`;

  return {
    slug,
    placeId: business.placeId,
    businessName: business.name,
    category: business.category,
    city: business.city,
    address: business.address,
    phone: business.phone,
    tagline: config.tagline(business.name),
    services: config.services,
    primaryColor: config.primaryColor,
    secondaryColor: config.secondaryColor,
    template: config.template,
    rating: business.rating,
    reviewCount: business.reviewCount,
    createdAt: new Date().toISOString(),
  };
}

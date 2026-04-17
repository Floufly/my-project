export type Plan = {
  id: string;
  name: string;
  priceEur: number;
  description: string;
  features: string[];
  highlighted: boolean;
};

export const PLANS: Plan[] = [
  {
    id: 'essentiel',
    name: 'Essentiel',
    priceEur: 29,
    description: 'Parfait pour démarrer en ligne',
    highlighted: false,
    features: [
      'Site vitrine professionnel',
      'Nom, adresse & téléphone',
      'Lien Google Maps intégré',
      'Compatible mobile',
      'Hébergement inclus',
      'Mise à jour 1x/an',
    ],
  },
  {
    id: 'pro',
    name: 'Pro',
    priceEur: 49,
    description: 'Pour développer votre clientèle',
    highlighted: true,
    features: [
      'Tout Essentiel +',
      'Formulaire de contact',
      'Google Analytics',
      'Photos personnalisées',
      'Nom de domaine offert',
      'Mises à jour illimitées',
      'Support par email',
    ],
  },
  {
    id: 'premium',
    name: 'Premium',
    priceEur: 79,
    description: 'La solution complète',
    highlighted: false,
    features: [
      'Tout Pro +',
      'Réservation en ligne',
      'Avis clients intégrés',
      'Galerie photos',
      'Référencement Google (SEO)',
      'Support prioritaire 7j/7',
      'Rapport mensuel de visites',
    ],
  },
];

export function getPlanById(id: string): Plan | undefined {
  return PLANS.find((p) => p.id === id);
}

export type NumerologyService = {
  id: string;
  title: string;
  description: string;
  durationMinutes: number;
  priceEUR: number;
  focus: string[];
};

export const SERVICES: NumerologyService[] = [
  {
    id: 'portrait-personnel',
    title: 'Portrait de naissance',
    description:
      'Explorez votre chemin de vie, vos dons et vos défis à partir de votre date de naissance et de vos prénoms.',
    durationMinutes: 75,
    priceEUR: 120,
    focus: ['Chemin de vie', 'Talents innés', 'Cycles personnels']
  },
  {
    id: 'prevision-annee',
    title: 'Prévisions annuelles',
    description:
      'Une lecture dynamique de vos influences numérologiques sur les 12 prochains mois pour anticiper les périodes clés.',
    durationMinutes: 60,
    priceEUR: 95,
    focus: ['Transitions', 'Décisions professionnelles', 'Vie personnelle']
  },
  {
    id: 'compatibilite',
    title: 'Compatibilité relationnelle',
    description:
      'Comprenez vos liens avec un proche ou un partenaire et identifiez les points d’harmonie à cultiver.',
    durationMinutes: 60,
    priceEUR: 105,
    focus: ['Communication', 'Gestion des conflits', 'Évolution commune']
  }
];

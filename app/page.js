import { redirect } from 'next/navigation';

// La plateforme héberge désormais plusieurs événements Synelia, chacun sur son propre
// chemin (/nom-evenement). La racine redirige vers l'événement historique Bénin pour
// que les liens déjà partagés (rsvp.synelia.tech) continuent de fonctionner.
export default function RootPage() {
  redirect('/benin');
}

/** @type {import('next').NextConfig} */
const nextConfig = {
  // La racine du domaine sert directement l'événement Bénin (historique), sans afficher
  // "/benin" dans la barre d'adresse — les autres événements restent sur leur propre chemin.
  async rewrites() {
    return [{ source: '/', destination: '/benin' }];
  },
};
module.exports = nextConfig;

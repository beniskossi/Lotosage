import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Ticket, BarChart3, Brain, Search } from "lucide-react";
import Link from "next/link";
import { ALL_DRAW_CATEGORIES } from "@/lib/config";

export default function HomePage() {
  const firstDrawSlug = ALL_DRAW_CATEGORIES.length > 0 ? ALL_DRAW_CATEGORIES[0].slug : "";

  return (
    <div className="container mx-auto py-8">
      <Card className="shadow-xl">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <Ticket className="w-16 h-16 text-primary" />
          </div>
          <CardTitle className="text-4xl font-bold">Bienvenue à Loto Stats Predictor</CardTitle>
          <CardDescription className="text-lg text-muted-foreground mt-2">
            Votre partenaire expert pour l'analyse des résultats de loterie, statistiques avancées et prédictions intelligentes.
          </CardDescription>
        </CardHeader>
        <CardContent className="mt-6">
          <p className="text-center text-lg mb-8">
            Explorez les données de tirage, découvrez des tendances, consultez les fréquences des numéros et obtenez des prédictions pour maximiser vos chances.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            <FeatureCard
              icon={<BarChart3 className="w-10 h-10 text-primary" />}
              title="Données & Statistiques"
              description="Accédez aux résultats historiques et analysez les fréquences des numéros."
            />
            <FeatureCard
              icon={<Search className="w-10 h-10 text-primary" />}
              title="Consultation Détaillée"
              description="Examinez la régularité d'un numéro spécifique et ses combinaisons."
            />
            <FeatureCard
              icon={<Brain className="w-10 h-10 text-primary" />}
              title="Prédictions Intelligentes"
              description="Utilisez notre IA pour générer des prédictions basées sur l'analyse des données."
            />
          </div>
          <div className="text-center">
            {firstDrawSlug && (
               <Button size="lg" asChild className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-md">
                <Link href={`/draws/${firstDrawSlug}`}>Commencer l'exploration</Link>
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      <section className="mt-12 py-8 bg-secondary rounded-lg shadow-md">
        <div className="container mx-auto text-center">
            <h2 className="text-3xl font-semibold mb-4">Comment ça marche ?</h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
                Notre application collecte les résultats officiels, les stocke localement pour un accès rapide même hors ligne, et utilise des algorithmes avancés pour vous fournir des analyses pertinentes et des prédictions affinées.
            </p>
        </div>
      </section>
    </div>
  );
}

interface FeatureCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
}

function FeatureCard({ icon, title, description }: FeatureCardProps) {
  return (
    <Card className="text-center hover:shadow-lg transition-shadow duration-300">
      <CardHeader>
        <div className="flex justify-center mb-3">{icon}</div>
        <CardTitle className="text-xl">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-muted-foreground text-sm">{description}</p>
      </CardContent>
    </Card>
  );
}

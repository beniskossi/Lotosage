import type { DrawResult } from '@/lib/types';
import NumberBall from './NumberBall';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { CalendarDays } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { fr } from 'date-fns/locale';

interface DrawResultCardProps {
  result: DrawResult;
}

export default function DrawResultCard({ result }: DrawResultCardProps) {
  const formattedDate = result.date ? format(parseISO(result.date), 'EEEE dd MMMM yyyy', { locale: fr }) : 'Date inconnue';

  return (
    <Card className="mb-4 shadow-lg hover:shadow-xl transition-shadow duration-300">
      <CardHeader>
        <CardTitle className="flex items-center text-xl">
          <CalendarDays className="mr-2 h-5 w-5 text-primary" />
          Tirage du {formattedDate}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-700 mb-2">Numéros Gagnants:</h3>
          <div className="flex flex-wrap gap-2">
            {result.gagnants.map((num) => (
              <NumberBall key={`g-${num}`} number={num} />
            ))}
          </div>
        </div>
        <div>
          <h3 className="text-lg font-semibold text-gray-700 mb-2">Numéros Machine:</h3>
          <div className="flex flex-wrap gap-2">
            {result.machine.map((num) => (
              <NumberBall key={`m-${num}`} number={num} />
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

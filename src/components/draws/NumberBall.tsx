import type { BallColor } from '@/lib/types';
import { cn } from '@/lib/utils';

interface NumberBallProps {
  number: number;
  size?: 'sm' | 'md' | 'lg';
}

export function getBallColor(number: number): { bgColor: string, textColor: string, borderColor?: string } {
  if (number >= 1 && number <= 9) return { bgColor: 'bg-white', textColor: 'text-slate-800', borderColor: 'border-slate-300' };
  if (number >= 10 && number <= 19) return { bgColor: 'bg-blue-500', textColor: 'text-white' };
  if (number >= 20 && number <= 29) return { bgColor: 'bg-orange-500', textColor: 'text-white' };
  if (number >= 30 && number <= 39) return { bgColor: 'bg-green-500', textColor: 'text-white' };
  if (number >= 40 && number <= 49) return { bgColor: 'bg-yellow-400', textColor: 'text-slate-800' };
  if (number >= 50 && number <= 59) return { bgColor: 'bg-pink-400', textColor: 'text-white' };
  if (number >= 60 && number <= 69) return { bgColor: 'bg-indigo-500', textColor: 'text-white' };
  if (number >= 70 && number <= 79) return { bgColor: 'bg-amber-700', textColor: 'text-white' }; // Brown changed to amber-700
  if (number >= 80 && number <= 90) return { bgColor: 'bg-red-500', textColor: 'text-white' };
  return { bgColor: 'bg-gray-300', textColor: 'text-gray-800' }; // Default
}


export default function NumberBall({ number, size = 'md' }: NumberBallProps) {
  const { bgColor, textColor, borderColor } = getBallColor(number);

  const sizeClasses = {
    sm: 'w-8 h-8 text-sm',
    md: 'w-10 h-10 text-base',
    lg: 'w-12 h-12 text-lg',
  };

  return (
    <div
      className={cn(
        'rounded-full flex items-center justify-center font-semibold shadow-md border',
        bgColor,
        textColor,
        borderColor ? borderColor : 'border-transparent',
        sizeClasses[size]
      )}
      aria-label={`Numéro ${number}`}
    >
      {number}
    </div>
  );
}

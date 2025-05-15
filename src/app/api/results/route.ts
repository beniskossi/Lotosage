import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';
import { parse, format, getYear } from 'date-fns';
import { fr } from 'date-fns/locale';
import { API_DRAW_SCHEDULE, MONTH_NAMES_FR_TO_EN } from '@/lib/config';

// Helper to convert French month name to English for date parsing, if needed for API
function getYearFromMonthQuery(monthQuery: string | null): number {
  if (monthQuery) {
    const parts = monthQuery.split('-');
    if (parts.length === 2 && !isNaN(parseInt(parts[1]))) {
      return parseInt(parts[1]);
    }
  }
  return getYear(new Date()); // Default to current year if not specified or malformed
}

function parseMonthYear(monthYearStr: string | null): { monthIndex: number, year: number } {
  if (!monthYearStr) {
    const now = new Date();
    return { monthIndex: now.getMonth(), year: now.getFullYear() };
  }
  const [monthNameFr, yearStr] = monthYearStr.split('-');
  const year = parseInt(yearStr);
  const monthNameEn = MONTH_NAMES_FR_TO_EN[monthNameFr.toLowerCase()];
  
  if (!monthNameEn || isNaN(year)) {
    const now = new Date();
    return { monthIndex: now.getMonth(), year: now.getFullYear() };
  }

  // Create a date like "1 January 2024" to get month index
  const tempDate = parse(`1 ${monthNameEn} ${year}`, 'd MMMM yyyy', new Date());
  return { monthIndex: tempDate.getMonth(), year };
}


export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const monthQuery = searchParams.get('month'); // e.g., "mai-2025"
  
  const baseUrl = 'https://lotobonheur.ci/api/results';
  const url = monthQuery ? `${baseUrl}?month=${monthQuery}` : baseUrl;
  
  const currentYear = getYearFromMonthQuery(monthQuery);

  try {
    const response = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': 'application/json',
        'Referer': 'https://lotobonheur.ci/resultats',
      },
      timeout: 20000, // Increased timeout
    });

    const resultsData = response.data;
    if (!resultsData.success || !resultsData.drawsResultsWeekly) {
      console.error('API returned unsuccessful or malformed response:', resultsData);
      return NextResponse.json({ error: 'API returned unsuccessful or malformed response' }, { status: 500 });
    }

    const drawsResultsWeekly = resultsData.drawsResultsWeekly;

    const validApiDrawNames = new Set<string>();
    Object.values(API_DRAW_SCHEDULE).forEach((day) => {
      Object.values(day).forEach((drawName) => validApiDrawNames.add(drawName));
    });

    const results: any[] = [];

    for (const week of drawsResultsWeekly) {
      for (const dailyResult of week.drawResultsDaily) {
        const dateStr = dailyResult.date; // e.g., "dimanche 04/05"
        let drawDate: string;

        try {
          // Parse date (e.g., "dimanche 04/05" using currentYear)
          const dayMonthPart = dateStr.split(' ')[1]; // "04/05"
          if (!dayMonthPart) throw new Error('Invalid date string format');
          
          // Using currentYear derived from monthQuery or current system year
          const parsedDate = parse(dayMonthPart, 'dd/MM', new Date(currentYear, 0, 1)); // Use Jan 1 of currentYear as base
          // Ensure the parsed month matches the month from monthQuery if provided
          if (monthQuery) {
            const { monthIndex: queryMonthIndex, year: queryYear } = parseMonthYear(monthQuery);
            if (parsedDate.getMonth() !== queryMonthIndex || parsedDate.getFullYear() !== queryYear) {
               // If month is different, it might be a date from previous/next month shown in current month's calendar view
               // For now, we rely on the year from monthQuery.
               // This part may need more robust handling if API shows dates from adjacent months.
            }
          }
          drawDate = format(parsedDate, 'yyyy-MM-dd');
        } catch (e) {
          console.warn(`Invalid date format: ${dateStr}, error: ${e}`);
          continue;
        }

        for (const draw of dailyResult.drawResults.standardDraws) {
          const apiDrawName = draw.drawName; // This is the name from the API
          if (!validApiDrawNames.has(apiDrawName) || (draw.winningNumbers && draw.winningNumbers.startsWith('.'))) {
            continue; 
          }
          
          const winningNumbers = (draw.winningNumbers?.match(/\d+/g) || []).map(Number).slice(0, 5);
          const machineNumbers = (draw.machineNumbers?.match(/\d+/g) || []).map(Number).slice(0, 5);

          if (winningNumbers.length === 5 && machineNumbers.length === 5) {
            results.push({
              drawName: apiDrawName, // Store the API name
              date: drawDate,
              gagnants: winningNumbers,
              machine: machineNumbers,
            });
          } else {
            // console.warn(`Incomplete data for draw ${apiDrawName} on ${drawDate}: W:${winningNumbers.join(',')} M:${machineNumbers.join(',')}`);
          }
        }
      }
    }

    if (results.length === 0 && drawsResultsWeekly.length > 0) {
       // This might mean data was present but didn't match criteria or was incomplete
       // console.warn('No valid draw results parsed, though API returned data. Check parsing logic and filters.');
    }
    
    // No need to return 404 if results are empty, an empty array is a valid response.
    // Client can handle empty results.

    return NextResponse.json(results, { status: 200 });

  } catch (error: any) {
    console.error(`Error fetching ${url}:`, error.message);
    if (axios.isAxiosError(error) && error.response) {
      console.error('Axios error response data:', error.response.data);
      console.error('Axios error response status:', error.response.status);
    }
    return NextResponse.json({ error: 'Failed to fetch results', details: error.message }, { status: 500 });
  }
}

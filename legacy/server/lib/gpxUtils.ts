import gpxParser from 'gpxparser';
import fs from 'fs';

/**
 * Analizuje plik GPX i wyciąga z niego kluczowe statystyki: dystans oraz przewyższenia.
 * @param filePath Ścieżka do pliku GPX na serwerze.
 */
export async function analyzeGpxFile(filePath: string) {
  try {
    const gpx = new gpxParser();
    const xml = fs.readFileSync(filePath, 'utf8');
    gpx.parse(xml);

    let distance = 0;
    let elevationGain = 0;
    let duration = 0; // minutes

    // Obsługa śladów (Tracks)
    if (gpx.tracks && gpx.tracks.length > 0) {
      const track = gpx.tracks[0];
      distance = track.distance.total;
      elevationGain = track.elevation.pos || 0;

      // Obliczanie czasu trwania na podstawie punktów
      if (track.points && track.points.length > 1) {
        const firstPoint = track.points[0];
        const lastPoint = track.points[track.points.length - 1];
        if (firstPoint.time && lastPoint.time) {
          const diffMs = lastPoint.time.getTime() - firstPoint.time.getTime();
          duration = Math.max(0, diffMs / 1000 / 60);
        }
      }
    } 
    // Jeśli brak śladów, sprawdź trasy (Routes)
    else if (gpx.routes && gpx.routes.length > 0) {
      distance = gpx.routes[0].distance.total;
      elevationGain = gpx.routes[0].elevation.pos || 0;
    }
    // Jeśli brak obu, spróbuj zsumować punkty (Waypoints/Points) - rzadszy przypadek
    else {
      throw new Error('Nie znaleziono śladów ani tras w pliku GPX');
    }

    return {
      distance: parseFloat((distance / 1000).toFixed(2)), // km
      elevationGain: Math.round(elevationGain),           // m
      duration: Math.round(duration)                      // min
    };
  } catch (error: any) {
    console.error('[GPX Analysis Error]:', error.message);
    throw error;
  }
}

import gpxParser from 'gpxparser';
import fs from 'fs';

export async function analyzeGpxFile(filePath: string) {
  const xml = fs.readFileSync(filePath, 'utf8');
  const gpx = new gpxParser();
  gpx.parse(xml);

  let distance = 0;
  let elevationGain = 0;
  let duration = 0;

  if (gpx.tracks?.length > 0) {
    const track = gpx.tracks[0];
    distance = track.distance.total;
    elevationGain = track.elevation.pos ?? 0;

    if (track.points?.length > 1) {
      const first = track.points[0];
      const last = track.points[track.points.length - 1];
      if (first.time && last.time) {
        duration = Math.max(0, (last.time.getTime() - first.time.getTime()) / 1000 / 60);
      }
    }
  } else if (gpx.routes?.length > 0) {
    distance = gpx.routes[0].distance.total;
    elevationGain = gpx.routes[0].elevation.pos ?? 0;
  } else {
    throw new Error('No tracks or routes found in GPX file');
  }

  return {
    distance: parseFloat((distance / 1000).toFixed(2)), // km
    elevationGain: Math.round(elevationGain),            // m
    duration: Math.round(duration),                      // min
  };
}

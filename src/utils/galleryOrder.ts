/** Spread each orientation through the sequence rather than exhausting it early. */
export function mixOrientations<T>(items: T[], aspectRatio: (item: T) => number): T[] {
 const buckets = ['landscape', 'portrait', 'square'].map(shape => ({
  photos: items.filter(item => {
   const ratio = aspectRatio(item);
   return shape === 'landscape' ? ratio > 1.1 : shape === 'portrait' ? ratio < .9 : ratio >= .9 && ratio <= 1.1;
  }),
  used: 0,
 }));
 const ordered: T[] = [];
 for (let position = 0; position < items.length; position++) {
  const available = buckets.filter(bucket => bucket.used < bucket.photos.length);
  available.sort((a, b) => ((position + 1) * b.photos.length / items.length - b.used) - ((position + 1) * a.photos.length / items.length - a.used));
  const chosen = available[0];
  ordered.push(chosen.photos[chosen.used++]);
 }
 return ordered;
}

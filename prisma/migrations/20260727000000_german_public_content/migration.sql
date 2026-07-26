-- Translate only untouched bundled seed content. Curated dashboard edits remain
-- unchanged because every update matches the original English value exactly.

UPDATE "GalleryPost"
SET
  "excerpt" = 'Eine Studie über Licht, das sich am Rand eines Durchgangs sammelt.',
  "description" = 'Threshold I erforscht den Moment, in dem ein Innenraum in eine unbekannte Landschaft übergeht.',
  "imageAlt" = 'Abstrakte Arbeit mit dem Titel Threshold I',
  "medium" = 'Mixed Media auf Leinwand'
WHERE
  "slug" = 'threshold-i'
  AND "excerpt" = 'A study of light gathering at the edge of a passage.'
  AND "description" = 'Threshold I explores the moment where an interior gives way to an unknown landscape.'
  AND "imageAlt" = 'Abstract artwork titled Threshold I'
  AND "medium" = 'Mixed media on canvas';

UPDATE "GalleryPost"
SET
  "excerpt" = 'Ein imaginäres Gefäß, das Spuren von Erinnerung in Blau bewahrt.',
  "description" = 'Blue Reliquary schichtet leuchtende Pigmente und verwitterte Formen zu einem stillen Andachtsobjekt.',
  "imageAlt" = 'Blaue abstrakte Arbeit mit dem Titel Blue Reliquary',
  "medium" = 'Öl und Kaltwachs auf Holz'
WHERE
  "slug" = 'blue-reliquary'
  AND "excerpt" = 'An imagined vessel holding traces of memory in blue.'
  AND "description" = 'Blue Reliquary layers luminous pigment and weathered forms into a quiet, devotional object.'
  AND "imageAlt" = 'Blue abstract artwork titled Blue Reliquary'
  AND "medium" = 'Oil and cold wax on panel';

UPDATE "GalleryPost"
SET
  "excerpt" = 'Ein strahlendes Signal, das organische Form annimmt.',
  "description" = 'Signal Bloom verbindet elektronischen Rhythmus und botanisches Wachstum in einem Feld gesättigter Farbe.',
  "imageAlt" = 'Farbige abstrakte Arbeit mit dem Titel Signal Bloom',
  "medium" = 'Acryl und Pigment auf Leinwand'
WHERE
  "slug" = 'signal-bloom'
  AND "excerpt" = 'A radiant signal taking organic form.'
  AND "description" = 'Signal Bloom brings electronic rhythm and botanical growth together in a field of saturated color.'
  AND "imageAlt" = 'Colorful abstract artwork titled Signal Bloom'
  AND "medium" = 'Acrylic and pigment on canvas';

UPDATE "Product"
SET
  "name" = 'Threshold I — Archivdruck',
  "description" = 'Signierter Giclée-Druck in Museumsqualität auf schwerem Baumwollpapier.'
WHERE
  "slug" = 'threshold-i-archival-print'
  AND "name" = 'Threshold I — Archival Print'
  AND "description" = 'Signed, museum-quality giclée print on heavyweight cotton paper.';

UPDATE "Product"
SET
  "name" = 'Blue Reliquary — Archivdruck',
  "description" = 'Signierter Giclée-Druck in Museumsqualität auf schwerem Baumwollpapier.'
WHERE
  "slug" = 'blue-reliquary-archival-print'
  AND "name" = 'Blue Reliquary — Archival Print'
  AND "description" = 'Signed, museum-quality giclée print on heavyweight cotton paper.';

UPDATE "Product"
SET
  "name" = 'Signal Bloom — Archivdruck',
  "description" = 'Signierter, limitierter Giclée-Druck auf schwerem Baumwollpapier.'
WHERE
  "slug" = 'signal-bloom-archival-print'
  AND "name" = 'Signal Bloom — Archival Print'
  AND "description" = 'Signed, limited-edition giclée print on heavyweight cotton paper.';

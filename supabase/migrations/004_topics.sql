-- Run in Supabase SQL Editor. Assumes subject names match exactly. Clear existing topics first if needed: DELETE FROM topics WHERE subject_id IN (SELECT id FROM subjects WHERE name IN ('Biology','Chemistry','Physics','Geography','History','English Language','English Literature','Mathematics'));

-- Biology
INSERT INTO topics (subject_id, name, status, difficulty, priority)
SELECT s.id, t.name, 'Not Started', 3, 'Normal'
FROM subjects s
CROSS JOIN (VALUES
  ('Cell structure (animal vs plant cells)'),
  ('Cell differentiation'),
  ('Microscopy (light & electron microscopes)'),
  ('Cell division (mitosis)'),
  ('Stem cells'),
  ('Diffusion'),
  ('Osmosis'),
  ('Active transport'),
  ('Levels of organisation'),
  ('The digestive system'),
  ('Enzymes'),
  ('The heart and blood vessels'),
  ('Blood components'),
  ('Coronary heart disease'),
  ('Plant tissues and organs'),
  ('Transpiration and translocation'),
  ('Communicable diseases'),
  ('Pathogens (bacteria, viruses, fungi, protists)'),
  ('Body defences'),
  ('Vaccination'),
  ('Antibiotics and painkillers'),
  ('Drug discovery and testing'),
  ('Photosynthesis'),
  ('Limiting factors of photosynthesis'),
  ('Uses of glucose'),
  ('Aerobic respiration'),
  ('Anaerobic respiration'),
  ('Metabolism')
) AS t(name)
WHERE s.name = 'Biology';

-- Chemistry
INSERT INTO topics (subject_id, name, status, difficulty, priority)
SELECT s.id, t.name, 'Not Started', 3, 'Normal'
FROM subjects s
CROSS JOIN (VALUES
  ('Atoms, elements and compounds'),
  ('Development of the periodic table'),
  ('Electronic structure'),
  ('Groups and periods'),
  ('Group 1 elements'),
  ('Group 7 elements'),
  ('Noble gases'),
  ('Ionic bonding'),
  ('Covalent bonding'),
  ('Metallic bonding'),
  ('States of matter'),
  ('Structure of giant ionic lattices'),
  ('Giant covalent structures (diamond and graphite)'),
  ('Polymers and nanoparticles'),
  ('Relative formula mass'),
  ('Moles'),
  ('Concentration of solutions'),
  ('Percentage yield'),
  ('Atom economy'),
  ('Reactivity series'),
  ('Extraction of metals'),
  ('Oxidation and reduction'),
  ('Acids, bases and salts'),
  ('Electrolysis'),
  ('Exothermic reactions'),
  ('Endothermic reactions'),
  ('Reaction profiles'),
  ('Bond energy calculations')
) AS t(name)
WHERE s.name = 'Chemistry';

-- Physics
INSERT INTO topics (subject_id, name, status, difficulty, priority)
SELECT s.id, t.name, 'Not Started', 3, 'Normal'
FROM subjects s
CROSS JOIN (VALUES
  ('Energy stores and transfers'),
  ('Conservation of energy'),
  ('Efficiency'),
  ('Energy resources (renewable and non-renewable)'),
  ('Electrical circuits'),
  ('Current, potential difference and resistance'),
  ('Series and parallel circuits'),
  ('Domestic electricity'),
  ('Power and energy transfers'),
  ('Density'),
  ('Changes of state'),
  ('Internal energy'),
  ('Gas pressure and temperature'),
  ('Structure of the atom'),
  ('Isotopes'),
  ('Radioactive decay'),
  ('Half-life'),
  ('Nuclear radiation'),
  ('Nuclear fission and fusion')
) AS t(name)
WHERE s.name = 'Physics';

-- Geography
INSERT INTO topics (subject_id, name, status, difficulty, priority)
SELECT s.id, t.name, 'Not Started', 3, 'Normal'
FROM subjects s
CROSS JOIN (VALUES
  ('Tectonic hazards'),
  ('Tropical storms'),
  ('Climate change'),
  ('Global development'),
  ('Causes of uneven development'),
  ('India case study'),
  ('Urbanisation'),
  ('Megacities'),
  ('Urban change in developing countries'),
  ('Coastal landscapes'),
  ('River landscapes'),
  ('Flooding and management'),
  ('Economic change'),
  ('Rural change'),
  ('Urban issues'),
  ('Fieldwork'),
  ('Data collection and analysis')
) AS t(name)
WHERE s.name = 'Geography';

-- History
INSERT INTO topics (subject_id, name, status, difficulty, priority)
SELECT s.id, t.name, 'Not Started', 3, 'Normal'
FROM subjects s
CROSS JOIN (VALUES
  ('Kaiser Wilhelm II and the German Empire'),
  ('WW1 and the Weimar Republic'),
  ('The rise of the Nazis'),
  ('Nazi control and dictatorship'),
  ('Life in Nazi Germany'),
  ('Treaty of Versailles'),
  ('League of Nations'),
  ('International peacekeeping'),
  ('Hitler''s foreign policy'),
  ('Causes of World War II'),
  ('Elizabeth''s government'),
  ('Challenges to Elizabeth (Mary Queen of Scots plots)'),
  ('Religious problems'),
  ('Society and exploration'),
  ('The Spanish Armada'),
  ('Culture and theatre')
) AS t(name)
WHERE s.name = 'History';

-- English Language
INSERT INTO topics (subject_id, name, status, difficulty, priority)
SELECT s.id, t.name, 'Not Started', 3, 'Normal'
FROM subjects s
CROSS JOIN (VALUES
  ('Reading fiction'),
  ('Describing and analysing language'),
  ('Structural analysis'),
  ('Narrative and descriptive writing'),
  ('Comparing non-fiction texts'),
  ('Analysing writers'' viewpoints'),
  ('Writing to argue, persuade and explain')
) AS t(name)
WHERE s.name = 'English Language';

-- English Literature
INSERT INTO topics (subject_id, name, status, difficulty, priority)
SELECT s.id, t.name, 'Not Started', 3, 'Normal'
FROM subjects s
CROSS JOIN (VALUES
  ('Romeo and Juliet'),
  ('A Christmas Carol')
) AS t(name)
WHERE s.name = 'English Literature';

-- Mathematics
INSERT INTO topics (subject_id, name, status, difficulty, priority)
SELECT s.id, t.name, 'Not Started', 3, 'Normal'
FROM subjects s
CROSS JOIN (VALUES
  ('Place value'),
  ('Order of operations (BIDMAS)'),
  ('Factors multiples and primes'),
  ('HCF and LCM'),
  ('Fractions (add subtract multiply divide)'),
  ('Decimals'),
  ('Percentages'),
  ('Ratio and proportion'),
  ('Standard form'),
  ('Surds'),
  ('Bounds and estimation'),
  ('Recurring decimals'),
  ('Simplifying expressions'),
  ('Expanding brackets'),
  ('Factorising'),
  ('Solving linear equations'),
  ('Solving simultaneous equations'),
  ('Quadratic equations'),
  ('Inequalities'),
  ('Sequences (arithmetic and quadratic)'),
  ('Algebraic fractions'),
  ('Rearranging formulae'),
  ('Graphs (linear and quadratic)'),
  ('Direct proportion'),
  ('Inverse proportion'),
  ('Compound measures'),
  ('Speed distance and time'),
  ('Density and pressure'),
  ('Growth and decay'),
  ('Compound interest'),
  ('Angle rules'),
  ('Polygons'),
  ('Pythagoras'' theorem'),
  ('Trigonometry (SOHCAHTOA)'),
  ('Circles (area and circumference)'),
  ('Surface area and volume'),
  ('Constructions and loci'),
  ('Bearings'),
  ('Transformations (reflection rotation translation enlargement)'),
  ('Similar shapes and congruence'),
  ('Vectors'),
  ('Basic probability'),
  ('Probability scales'),
  ('Relative frequency'),
  ('Tree diagrams'),
  ('Venn diagrams'),
  ('Independent and dependent events'),
  ('Averages (mean median mode)'),
  ('Range and interquartile range'),
  ('Pie charts'),
  ('Histograms'),
  ('Cumulative frequency graphs'),
  ('Box plots'),
  ('Scatter graphs'),
  ('Time series'),
  ('Sampling methods')
) AS t(name)
WHERE s.name = 'Mathematics';

require("dotenv").config();

const { PrismaClient } = require("@prisma/client");
const { PrismaPg } = require("@prisma/adapter-pg");
const { Pool } = require("pg");

const prisma = new PrismaClient({
  adapter: new PrismaPg(new Pool({ connectionString: process.env.DATABASE_URL })),
});

function slugify(value) {
  return value
    .trim()
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 120);
}

function getDegreeType(programmeName) {
  if (programmeName.includes("MA/MSc")) return "MA/MSc";
  if (programmeName.endsWith("MRes")) return "MRes";
  if (programmeName.endsWith("MPhil")) return "MPhil";
  if (programmeName.endsWith("MSt")) return "MSt";
  return "MSc";
}

function signature(value) {
  return value
    .toLowerCase()
    .replace(/ma\/msc|msc|mres|mphil|mst|pgdip|pgcert/g, "")
    .replace(/\(online\)/g, "")
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

const sourceUrls = {
  "University of Manchester": "https://www.se.manchester.ac.uk/study/masters/courses/",
  "University of Cambridge": "https://www.eng.cam.ac.uk/postgraduates/postgraduate-courses/taught-courses-mphil-and-mres",
  "Imperial College London": "https://www.imperial.ac.uk/study/pg/",
  "University of Bristol": "https://www.bristol.ac.uk/study/postgraduate/search/",
  "University of Southampton": "https://www.southampton.ac.uk/engineering/postgraduate.page",
};

const taughtProgrammesBySchool = {
  "University of Manchester": [
    "Aerospace Engineering MSc",
    "Advanced Chemical Engineering MSc",
    "Advanced Process Integration and Design MSc",
    "Commercial Project Management MSc",
    "Construction Project Management MSc",
    "Engineering Project Management MSc",
    "Advanced Computer Science MSc",
    "Artificial Intelligence MSc",
    "Cyber Security MSc",
    "Machine Learning MSc",
    "Robotics MSc",
    "Robotics with Extended Research MSc",
    "Data Science (Earth and Environmental Analytics) MSc",
    "Data Science (Mathematics) MSc",
    "Advanced Control and Systems Engineering MSc",
    "Advanced Control and Systems Engineering with Extended Research MSc",
    "Advanced Electrical Power Systems Engineering MSc",
    "Communications and Signal Processing MSc",
    "Communications and Signal Processing with Extended Research MSc",
    "Electrical Power Systems Engineering MSc",
    "Sustainable Electrical Power Systems Engineering MSc/PGDip/PGCert (online)",
    "Advanced Manufacturing Technology & Systems Management MSc",
    "Mechanical Engineering Design MSc",
    "Nuclear Science and Technology MSc",
    "Renewable Energy and Clean Technology MSc",
    "Renewable Energy and Clean Technology with Extended Research MSc",
    "Subsurface Energy Engineering MSc",
    "Advanced Engineering Materials MSc",
    "Biomaterials MSc",
    "Materials Engineering for Sustainability in Demanding Environments MSc",
    "Nanomaterials MSc",
    "Polymer Materials Science and Engineering MSc",
    "Geoscience for Sustainable Energy MSc",
    "Petroleum Geoscience MSc",
    "Pollution and Environmental Control MSc",
    "Pollution and Environmental Control MSc/PGDip/PGCert (online)",
  ],
  "University of Cambridge": [
    "MPhil in Electrical and Electronic Engineering",
    "MPhil in Energy Technologies",
    "MPhil in Engineering for Sustainable Development",
    "MPhil in Industrial Systems, Manufacture and Management",
    "MPhil in Machine Learning and Machine Intelligence",
    "MPhil in Nuclear Energy",
    "MSt in Construction Engineering",
    "MRes in Connected Electronic and Photonic Systems",
    "MPhil in Advanced Chemical Engineering",
    "MPhil in Biotechnology",
    "MPhil in Advanced Computer Science",
  ],
  "Imperial College London": [
    "Advanced Aeronautical Engineering MSc",
    "Advanced Computational Methods for Aeronautics, Flow Management and Fluid-Structure Interaction MSc",
    "Composites: The Science, Technology and Engineering Application of Advanced Composites MSc",
    "Biomedical Engineering MSc",
    "Engineering for Biomedicine MSc",
    "Human and Biological Robotics MSc",
    "Medical Device Design and Entrepreneurship MSc",
    "Advanced Chemical Engineering MSc",
    "Advanced Chemical Engineering with Biotechnology MSc",
    "Machine Learning and Process Systems Engineering MSc",
    "Advanced Materials for Sustainable Infrastructure MSc",
    "Concrete Structures MSc",
    "Earthquake Engineering MSc",
    "Engineering Fluid Mechanics for Offshore, Coastal and Built Environments MSc",
    "Environmental Engineering MSc",
    "Environmental Engineering with Data Science MSc",
    "General Structural Engineering MSc",
    "General Structural Engineering with Data Science MSc",
    "Geotechnical Engineering MSc",
    "Geotechnical Engineering with Data Science MSc",
    "Geotechnical Engineering with Offshore Renewables MSc",
    "Geotechnical and Earthquake Engineering MSc",
    "Geotechnical and Geoenvironmental Engineering MSc",
    "Hydrology and Water Resources Management MSc",
    "Structural Steel Design MSc",
    "Transport MSc",
    "Transport with Data Science MSc",
    "Advanced Computing MSc",
    "Artificial Intelligence MSc",
    "Artificial Intelligence Applications and Innovation MSc",
    "Applied Computational Science and Engineering MSc",
    "Computing (Artificial Intelligence and Machine Learning) MSc",
    "Computing (Security and Reliability) MSc",
    "Computing (Software Engineering) MSc",
    "Computing (Visual Computing and Robotics) MSc",
    "Analogue and Digital Integrated Circuit Design MSc",
    "Applied Machine Learning MSc",
    "Communications and Signal Processing MSc",
    "Control and Optimisation MSc",
    "Future Power Networks MSc",
    "Sensor Systems Engineering MSc",
    "Cleantech Innovation MSc",
    "Design Engineering MSc",
    "Design with Behaviour Science MSc",
    "Innovation Design Engineering MA/MSc",
    "Environmental Data Science and Machine Learning MSc",
    "Geo-Energy with Machine Learning and Data Science MSc",
    "Metals and Energy Finance MSc",
    "Petroleum Engineering MSc",
    "Petroleum Geoscience MSc",
    "Remote Sensing MSc",
    "Renewable Energy with AI and Data Science: Geology and Geophysics MSc",
    "Advanced Materials Science and Engineering MSc",
    "Advanced Mechanical Engineering MSc",
  ],
  "University of Bristol": [
    "Aerospace Engineering MSc",
    "Earthquake Engineering and Infrastructure Resilience MSc",
    "Structural Engineering MSc",
    "Sustainable Engineering MSc",
    "Systems Design Management MSc",
    "Water and Environmental Data Science MSc",
    "Water and Environmental Management MSc",
    "Aerial Robotics MSc",
    "Bionics MSc",
    "Communication Networks and Signal Processing MSc",
    "Optical Communications and Signal Processing MSc",
    "Optoelectronic and Quantum Technologies MSc",
    "Robotics MSc",
    "Wireless Communications and Signal Processing MSc",
    "Artificial Intelligence MSc",
    "Cyber Security (Infrastructure Security) MSc",
    "Cyber Security (Software Security) MSc",
    "Data Science MSc",
    "Human-Computer Interaction (online) MSc",
    "Immersive Technologies (Virtual and Augmented Reality) MSc",
    "Internet of Things with AI MSc",
    "Engineering Mathematics MSc",
    "Scientific Computing with Data Science MSc",
  ],
  "University of Southampton": [
    "Advanced Tribology (Advanced Mechanical Engineering Science) MSc",
    "Biomedical Engineering (Advanced Mechanical Engineering Science) MSc",
    "Computational Engineering Design (Advanced Mechanical Engineering Science) MSc",
    "Engineering Materials (Advanced Mechanical Engineering Science) MSc",
    "Mechatronics (Advanced Mechanical Engineering Science) MSc",
    "Propulsion and Engine Systems Engineering (Advanced Mechanical Engineering Science) MSc",
    "Aerodynamics and Computation MSc",
    "Race Car Aerodynamics MSc",
    "Space Systems Engineering MSc",
    "Unmanned Vehicle Systems Design / Airvehicle MSc",
    "Civil Engineering MSc",
    "Coastal and Marine Engineering and Management MSc",
    "Engineering in the Coastal Environment MSc",
    "Transportation Planning & Engineering MSc",
    "Artificial Intelligence MSc",
    "Computer Science MSc",
    "Cyber Security MSc",
    "Software Engineering MSc",
    "Systems, Control and Signal Processing MSc",
    "Web Science MSc",
    "Web Technology MSc",
    "Biodevices MSc",
    "Energy and Sustainability with Electrical Power Engineering MSc",
    "Micro Electro Mechanical Systems (MEMS) MSc",
    "Microelectronics System Design MSc",
    "Nanoelectronics and Nanotechnology MSc",
    "System on Chip MSc",
    "Systems Control and Signal Processing MSc",
    "Wireless Communications MSc",
    "Energy and Sustainability (Energy Resources and Climate Change) MSc",
    "Energy and Sustainability (Energy, Environment and Buildings) MSc",
    "Sustainable Energy Technologies MSc",
    "Maritime Engineering Science / Advanced Materials MSc",
    "Maritime Engineering Science / Marine Engineering MSc",
    "Maritime Engineering Science / Maritime Computational Fluid Dynamics MSc",
    "Maritime Engineering Science / Naval Architecture MSc",
    "Maritime Engineering Sciences / Offshore Engineering MSc",
    "Maritime Engineering Science / Yacht and Small Craft MSc",
    "Photonic Technologies MSc",
    "Sound and Vibration Studies MSc",
  ],
};

async function main() {
  const summary = [];

  for (const [schoolName, candidates] of Object.entries(taughtProgrammesBySchool)) {
    const university = await prisma.university.findFirst({ where: { name: schoolName } });
    if (!university) {
      summary.push({ schoolName, created: 0, skipped: candidates.length, missingUniversity: true });
      continue;
    }

    const existing = await prisma.programme.findMany({
      where: { university_id: university.id },
      select: { programme_name: true, slug: true },
    });

    const existingSignatures = new Set(existing.map((item) => signature(item.programme_name)));
    const existingSlugs = new Set(existing.map((item) => item.slug));

    let created = 0;
    let skipped = 0;

    for (const programmeName of candidates) {
      const programmeSignature = signature(programmeName);
      const slug = slugify(programmeName);

      if (existingSignatures.has(programmeSignature) || existingSlugs.has(slug)) {
        skipped += 1;
        continue;
      }

      await prisma.programme.create({
        data: {
          university_id: university.id,
          programme_name: programmeName,
          slug,
          degree_type: getDegreeType(programmeName),
          official_url: sourceUrls[schoolName],
          study_mode: "full_time",
          source_page_title: `${schoolName} postgraduate taught programmes`,
          raw_requirement_text: `Imported from user-provided PDF list: 英校工程类硕士专业汇总_Manchester_Cambridge_Imperial_Bristol_Southampton.pdf`,
          parser_version: "pdf-five-schools-taught-import-2026-04-26",
          human_verified: true,
          confidence_score: 82,
        },
      });

      existingSignatures.add(programmeSignature);
      existingSlugs.add(slug);
      created += 1;
    }

    summary.push({ schoolName, created, skipped, missingUniversity: false });
  }

  console.table(summary);
}

main()
  .catch(async (error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

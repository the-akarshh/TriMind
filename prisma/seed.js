const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

const DEMO_COLLEGE = {
  id: "college-apex-1",
  name: "Apex Institute of Technology",
  shortName: "AIT",
  logo: "https://images.unsplash.com/photo-1562774053-701939374585?w=100&q=80",
  location: "Bangalore, India",
};

const DEMO_PASSWORD_HASH = "$2a$10$lracWu49cbENBKYuc.WFy.4C4T5MMnXCpAvpm26/EwOXJ3Xvvkbua";

const USERS = [
  { id: "usr-admin-1", name: "System Admin", email: "admin@arena.edu", role: "SUPER_ADMIN" },
  { id: "usr-faculty-1", name: "Dr. Evelyn Reed", email: "faculty@apex.edu", role: "FACULTY" },
  { id: "usr-host-1", name: "Prof. Alan Vance", email: "host@apex.edu", role: "HOST" },
  { id: "usr-player-1", name: "Arjun Sharma", email: "arjun@apex.edu", role: "PLAYER" },
  { id: "usr-player-2", name: "Sneha Patel", email: "sneha@apex.edu", role: "PLAYER" },
  { id: "usr-player-3", name: "Rohan Mehta", email: "rohan@apex.edu", role: "PLAYER" },
  { id: "usr-player-4", name: "Priya Nair", email: "priya@apex.edu", role: "PLAYER" },
];

async function main() {
  console.log("Starting Aptitude Arena database seed...");

  // 1. Upsert College
  const college = await prisma.college.upsert({
    where: { shortName: DEMO_COLLEGE.shortName },
    update: {},
    create: DEMO_COLLEGE,
  });
  console.log(`✓ College created: ${college.name} (${college.shortName})`);

  // 2. Upsert Users
  for (const u of USERS) {
    await prisma.user.upsert({
      where: { email: u.email },
      update: {},
      create: {
        id: u.id,
        name: u.name,
        email: u.email,
        passwordHash: DEMO_PASSWORD_HASH,
        role: u.role,
        collegeId: college.id,
      },
    });
  }
  console.log(`✓ ${USERS.length} Demo users created.`);

  // 3. Upsert Question Set & Questions
  const qs = await prisma.questionSet.upsert({
    where: { id: "qs-quant-101" },
    update: {},
    create: {
      id: "qs-quant-101",
      title: "Quantitative Aptitude: High-Frequency Placement Core",
      description: "Time & work, speed-distance-time, percentages, profit & loss, and numbers theory.",
      ownerId: "usr-host-1",
      collegeId: college.id,
      visibility: "PUBLIC",
    },
  });

  const question1 = await prisma.question.upsert({
    where: { id: "q-quant-1" },
    update: {},
    create: {
      id: "q-quant-1",
      questionSetId: qs.id,
      text: "A train running at 54 km/h takes 20 seconds to pass an electric pole. What is the length of the train in meters?",
      explanation: "Speed in m/s = 54 * (5/18) = 15 m/s. Distance = Speed * Time = 15 * 20 = 300 meters.",
      topic: "QUANTITATIVE",
      difficulty: "EASY",
      timeLimit: 30,
      points: 100,
      order: 1,
      options: {
        create: [
          { id: "opt-q1-1", text: "250 meters", isCorrect: false },
          { id: "opt-q1-2", text: "300 meters", isCorrect: true },
          { id: "opt-q1-3", text: "320 meters", isCorrect: false },
          { id: "opt-q1-4", text: "360 meters", isCorrect: false },
        ],
      },
    },
  });
  console.log(`✓ Seeded Question: ${question1.text.substring(0, 40)}...`);

  // 4. Upsert League
  const league = await prisma.league.upsert({
    where: { id: "league-season-1" },
    update: {},
    create: {
      id: "league-season-1",
      name: "National Collegiate Placement League - Season 1",
      season: "Fall 2026",
      startDate: new Date("2026-09-01T00:00:00Z"),
      endDate: new Date("2026-11-30T23:59:59Z"),
      collegeId: college.id,
    },
  });
  console.log(`✓ League created: ${league.name}`);

  console.log("Database seed completed successfully! 🚀");
}

main()
  .catch((e) => {
    console.error("Seed error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

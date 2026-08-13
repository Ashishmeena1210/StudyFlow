import { PrismaClient, SubjectStatus, GoalStatus, TaskPriority, TaskStatus, SessionType, SessionStatus, ResourceType } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Starting StudyFlow PostgreSQL Seeding...");

  // 1. Create Demo User
  const passwordHash = await bcrypt.hash("Password123!", 10);
  const user = await prisma.user.upsert({
    where: { email: "demo@studyflow.app" },
    update: {},
    create: {
      email: "demo@studyflow.app",
      name: "Demo Student",
      passwordHash,
      avatarUrl: "https://api.dicebear.com/7.x/avataaars/svg?seed=DemoStudent",
    },
  });

  console.log(`👤 Created Demo User: ${user.name} (${user.email})`);

  // Clean existing data for demo user
  await prisma.resource.deleteMany({ where: { userId: user.id } });
  await prisma.studySession.deleteMany({ where: { userId: user.id } });
  await prisma.task.deleteMany({ where: { userId: user.id } });
  await prisma.goal.deleteMany({ where: { userId: user.id } });
  await prisma.subject.deleteMany({ where: { userId: user.id } });

  // 2. Create Subjects
  const subNetworks = await prisma.subject.create({
    data: {
      userId: user.id,
      name: "Computer Networks",
      description: "OSI & TCP/IP Reference Models, Subnetting, Routing Protocols & Network Security",
      color: "#06B6D4",
      status: SubjectStatus.ACTIVE,
      targetDate: "2026-11-15",
    },
  });

  const subDBMS = await prisma.subject.create({
    data: {
      userId: user.id,
      name: "Database Management Systems",
      description: "Relational Algebra, SQL Indexing, Transactions, Normalization & ACID Properties",
      color: "#10B981",
      status: SubjectStatus.ACTIVE,
      targetDate: "2026-12-01",
    },
  });

  const subMath = await prisma.subject.create({
    data: {
      userId: user.id,
      name: "Mathematics",
      description: "Calculus, Differential Equations, Linear Algebra & Discrete Mathematics",
      color: "#8B5CF6",
      status: SubjectStatus.ACTIVE,
      targetDate: "2026-10-20",
    },
  });

  console.log(`📚 Created 3 Subjects: ${subNetworks.name}, ${subDBMS.name}, ${subMath.name}`);

  // 3. Create Goals
  const goalNetworks = await prisma.goal.create({
    data: {
      userId: user.id,
      subjectId: subNetworks.id,
      title: "Master Computer Network Architecture",
      description: "Understand packet switching, IP addressing, and transport layer protocols in depth.",
      targetDate: "2026-10-30",
      status: GoalStatus.ON_TRACK,
      progress: 60,
    },
  });

  const goalDBMS = await prisma.goal.create({
    data: {
      userId: user.id,
      subjectId: subDBMS.id,
      title: "Learn DBMS Fundamentals & Normalization",
      description: "Master 1NF, 2NF, 3NF, BCNF, and query optimization strategies.",
      targetDate: "2026-11-20",
      status: GoalStatus.ACTIVE,
      progress: 40,
    },
  });

  console.log(`🎯 Created 2 Goals`);

  // 4. Create Tasks
  const task1 = await prisma.task.create({
    data: {
      userId: user.id,
      subjectId: subNetworks.id,
      goalId: goalNetworks.id,
      title: "Revise Network Layer Protocols & IP Subnetting",
      description: "Practice CIDR notation, subnet calculations, and ICMP messaging.",
      dueDate: new Date().toISOString().split("T")[0],
      priority: TaskPriority.HIGH,
      status: TaskStatus.TODO,
    },
  });

  const task2 = await prisma.task.create({
    data: {
      userId: user.id,
      subjectId: subDBMS.id,
      goalId: goalDBMS.id,
      title: "Practice SQL Indexing & Query Execution Plans",
      description: "Study B-Tree vs Hash indexes and analyze EXPLAIN query logs.",
      dueDate: new Date(Date.now() + 86400000 * 2).toISOString().split("T")[0],
      priority: TaskPriority.HIGH,
      status: TaskStatus.IN_PROGRESS,
    },
  });

  const task3 = await prisma.task.create({
    data: {
      userId: user.id,
      subjectId: subMath.id,
      title: "Complete Integration by Parts Exercise Set",
      description: "Solve problems 1 through 25 from Chapter 7.",
      dueDate: new Date(Date.now() + 86400000 * 5).toISOString().split("T")[0],
      priority: TaskPriority.MEDIUM,
      status: TaskStatus.COMPLETED,
      completedAt: new Date(),
    },
  });

  console.log(`✅ Created 3 Tasks`);

  // 5. Create Study Sessions
  await prisma.studySession.create({
    data: {
      userId: user.id,
      subjectId: subNetworks.id,
      goalId: goalNetworks.id,
      taskId: task1.id,
      sessionType: SessionType.FOCUS,
      plannedDuration: 45,
      actualDuration: 45,
      startedAt: new Date(Date.now() - 3600000 * 3),
      endedAt: new Date(Date.now() - 3600000 * 2.25),
      sessionIntent: "Focus on IP Subnetting calculations",
      completionResult: "Completed 12 practice subnetting problems",
      reflection: "Felt productive, mastered variable length subnet masking.",
      qualityRating: 5,
      status: SessionStatus.COMPLETED,
    },
  });

  await prisma.studySession.create({
    data: {
      userId: user.id,
      subjectId: subDBMS.id,
      goalId: goalDBMS.id,
      taskId: task2.id,
      sessionType: SessionType.REVISION,
      plannedDuration: 30,
      actualDuration: 28,
      startedAt: new Date(Date.now() - 86400000 * 1),
      endedAt: new Date(Date.now() - 86400000 * 1 + 1680000),
      sessionIntent: "Review B-Tree index structures",
      completionResult: "Finished reading textbook chapter 6",
      reflection: "Good session, clear understanding of leaf node pointers.",
      qualityRating: 4,
      status: SessionStatus.COMPLETED,
    },
  });

  console.log(`⏱️ Created 2 Study Sessions`);

  // 6. Create Resources (Subject-Organized)
  await prisma.resource.create({
    data: {
      userId: user.id,
      subjectId: subNetworks.id,
      goalId: goalNetworks.id,
      taskId: task1.id,
      title: "Computer Networking Course - IP Subnetting Guide",
      description: "Comprehensive tutorial on IPv4 CIDR subnetting and host range calculation.",
      url: "https://developer.mozilla.org/en-US/docs/Learn/Server-side/First_steps/Web_servers",
      type: ResourceType.DOCUMENTATION,
      source: "MDN Web Docs",
      isSaved: true,
      isFavorite: true,
      isAISuggested: false,
    },
  });

  await prisma.resource.create({
    data: {
      userId: user.id,
      subjectId: subDBMS.id,
      goalId: goalDBMS.id,
      taskId: task2.id,
      title: "Database Indexing & Query Optimization Tutorial",
      description: "In-depth guide on SQL indexing, B-Trees, and execution plan analysis.",
      url: "https://www.postgresql.org/docs/current/indexes.html",
      type: ResourceType.DOCUMENTATION,
      source: "PostgreSQL Official Documentation",
      isSaved: true,
      isFavorite: false,
      isAISuggested: true,
      aiRelevanceReason: "Matches your current goal in DBMS: Learn DBMS Fundamentals & Normalization.",
    },
  });

  console.log(`📌 Created 2 Resources`);
  console.log("🚀 StudyFlow Seeding Complete!");
}

main()
  .catch((e) => {
    console.error("❌ Error during seeding:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

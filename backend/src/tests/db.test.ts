import prisma from "../db/prisma.js";
import OwnershipService from "../services/ownershipService.js";
import { SubjectStatus, GoalStatus, TaskPriority, TaskStatus, SessionType, SessionStatus, ResourceType } from "@prisma/client";
import bcrypt from "bcryptjs";

async function runDatabaseTests() {
  console.log("🧪 Running StudyFlow PostgreSQL Verification Tests...\n");

  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, testName: string) {
    if (condition) {
      console.log(`  ✅ PASSED: ${testName}`);
      passed++;
    } else {
      console.error(`  ❌ FAILED: ${testName}`);
      failed++;
    }
  }

  try {
    const passwordHash = await bcrypt.hash("Password123!", 10);

    // Create Test User A & User B
    const userA = await prisma.user.create({
      data: {
        email: `usera-${Date.now()}@test.com`,
        name: "User A",
        passwordHash,
      },
    });

    const userB = await prisma.user.create({
      data: {
        email: `userb-${Date.now()}@test.com`,
        name: "User B",
        passwordHash,
      },
    });

    // 1. User can have multiple Subjects
    const subA1 = await prisma.subject.create({
      data: { userId: userA.id, name: "Algorithms", status: SubjectStatus.ACTIVE },
    });
    const subA2 = await prisma.subject.create({
      data: { userId: userA.id, name: "Operating Systems", status: SubjectStatus.ACTIVE },
    });

    const userASubjects = await prisma.subject.findMany({ where: { userId: userA.id } });
    assert(userASubjects.length === 2, "Test 1: User A can have multiple Subjects");

    // 2. Subject belongs to User
    assert(subA1.userId === userA.id, "Test 2: Subject belongs to User");

    // 3. Goal belongs to Subject/User
    const goalA = await prisma.goal.create({
      data: {
        userId: userA.id,
        subjectId: subA1.id,
        title: "Master Sorting Algorithms",
        progress: 50,
        status: GoalStatus.ON_TRACK,
      },
    });
    assert(goalA.userId === userA.id && goalA.subjectId === subA1.id, "Test 3: Goal belongs to Subject/User");

    // 4. Task belongs to Subject/User
    const taskA = await prisma.task.create({
      data: {
        userId: userA.id,
        subjectId: subA1.id,
        goalId: goalA.id,
        title: "Implement QuickSort in C++",
        priority: TaskPriority.HIGH,
        status: TaskStatus.TODO,
      },
    });
    assert(taskA.userId === userA.id && taskA.subjectId === subA1.id, "Test 4: Task belongs to Subject/User");

    // 5. StudySession belongs to Subject/User
    const sessionA = await prisma.studySession.create({
      data: {
        userId: userA.id,
        subjectId: subA1.id,
        taskId: taskA.id,
        sessionType: SessionType.FOCUS,
        plannedDuration: 30,
        actualDuration: 30,
        status: SessionStatus.COMPLETED,
      },
    });
    assert(sessionA.userId === userA.id && sessionA.subjectId === subA1.id, "Test 5: StudySession belongs to Subject/User");

    // 6. Resource belongs to Subject/User
    const resourceA = await prisma.resource.create({
      data: {
        userId: userA.id,
        subjectId: subA1.id,
        title: "Sorting Visualizer",
        url: "https://example.com/sorting",
        type: ResourceType.WEBSITE,
      },
    });
    assert(resourceA.userId === userA.id && resourceA.subjectId === subA1.id, "Test 6: Resource belongs to Subject/User");

    // 7. User A cannot access User B's Subject (Ownership check)
    let userBAccessSubjectAErrored = false;
    try {
      await OwnershipService.validateSubject(userB.id, subA1.id);
    } catch {
      userBAccessSubjectAErrored = true;
    }
    assert(userBAccessSubjectAErrored, "Test 7: User B cannot access User A's Subject");

    // 8. User B cannot create a Task using User A's Subject
    let userBCreateTaskWithSubAErrored = false;
    try {
      await OwnershipService.validateSubject(userB.id, subA1.id);
      await prisma.task.create({
        data: {
          userId: userB.id,
          subjectId: subA1.id,
          title: "Malicious Task",
        },
      });
    } catch {
      userBCreateTaskWithSubAErrored = true;
    }
    assert(userBCreateTaskWithSubAErrored, "Test 8: User B cannot create a Task using User A's Subject");

    // 9. User B cannot create a Resource using User A's Subject
    let userBCreateResourceWithSubAErrored = false;
    try {
      await OwnershipService.validateSubject(userB.id, subA1.id);
      await prisma.resource.create({
        data: {
          userId: userB.id,
          subjectId: subA1.id,
          title: "Malicious Resource",
          url: "https://malicious.com",
        },
      });
    } catch {
      userBCreateResourceWithSubAErrored = true;
    }
    assert(userBCreateResourceWithSubAErrored, "Test 9: User B cannot create a Resource using User A's Subject");

    // 10. Goal progress is within 0-100
    assert(goalA.progress >= 0 && goalA.progress <= 100, "Test 10: Goal progress is between 0 and 100");

    // 11. StudySession status values are valid
    assert(Object.values(SessionStatus).includes(sessionA.status), "Test 11: StudySession status is a valid Enum value");

    // 12. Resource type values are valid
    assert(Object.values(ResourceType).includes(resourceA.type), "Test 12: Resource type is a valid Enum value");

    // Cleanup test data
    await prisma.user.deleteMany({
      where: { id: { in: [userA.id, userB.id] } },
    });

  } catch (err) {
    console.error("❌ Test Execution Error:", err);
    failed++;
  } finally {
    await prisma.$disconnect();
  }

  console.log(`\n📊 Test Results: ${passed} Passed, ${failed} Failed`);
  if (failed > 0) {
    process.exit(1);
  }
}

runDatabaseTests();

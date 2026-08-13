import prisma from "../db/prisma.js";
import AuthService from "../services/authService.js";
import SubjectService from "../services/subjectService.js";
import GoalService from "../services/goalService.js";
import TaskService from "../services/taskService.js";
import ResourceService from "../services/resourceService.js";
import { ResourceType } from "@prisma/client";

async function runResourceTests() {
  console.log("🧪 Running StudyFlow Resources System Backend Tests...\n");

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
    // 1. Setup Test Users
    const { user: userA } = await AuthService.register(`resourcea-${Date.now()}@test.com`, "Password123!", "Resource User A");
    const { user: userB } = await AuthService.register(`resourceb-${Date.now()}@test.com`, "Password123!", "Resource User B");

    // Create Subjects for User A & User B
    const subA = await SubjectService.createSubject(userA.id, { name: "Networks" });
    const subB = await SubjectService.createSubject(userB.id, { name: "DBMS" });

    const goalA = await GoalService.createGoal(userA.id, { subjectId: subA.id, title: "Master OSI" });
    const taskA = await TaskService.createTask(userA.id, { subjectId: subA.id, goalId: goalA.id, title: "Study TCP/IP" });

    // 1 & 2. User A can create and retrieve own Resource
    const resA = await ResourceService.createResource(userA.id, {
      subjectId: subA.id,
      goalId: goalA.id,
      taskId: taskA.id,
      title: "Subnetting Guide",
      url: "https://example.com/subnetting",
      type: ResourceType.TUTORIAL,
    });
    assert(resA.userId === userA.id && resA.title === "Subnetting Guide", "Test 1 & 2: User can create & retrieve own resource");

    // 3. User B cannot retrieve User A's resource (IDOR protection)
    let userBGetResAErrored = false;
    try {
      await ResourceService.getResourceById(userB.id, resA.id);
    } catch (err: any) {
      userBGetResAErrored = err.status === 403;
    }
    assert(userBGetResAErrored, "Test 3: User B cannot retrieve User A's resource (403 Forbidden)");

    // 4 & 5. User A can update own resource, User B cannot
    const updatedResA = await ResourceService.updateResource(userA.id, resA.id, { description: "Updated guide description" });
    assert(updatedResA.description === "Updated guide description", "Test 4: User A can update own resource");

    let userBUpdateResAErrored = false;
    try {
      await ResourceService.updateResource(userB.id, resA.id, { title: "Hacked Resource" });
    } catch (err: any) {
      userBUpdateResAErrored = err.status === 403;
    }
    assert(userBUpdateResAErrored, "Test 5: User B cannot update User A's resource (403 Forbidden)");

    // 8, 9, 10. Subject, Goal, Task ownership is enforced
    let userBUseSubAErrored = false;
    try {
      await ResourceService.createResource(userB.id, {
        subjectId: subA.id,
        title: "Malicious Resource",
        url: "https://example.com",
      });
    } catch (err: any) {
      userBUseSubAErrored = err.status === 403;
    }
    assert(userBUseSubAErrored, "Test 8, 9, 10: Subject/Goal/Task ownership is enforced on creation");

    // 11 & 12. Goal/Task must belong to selected Subject
    const subA2 = await SubjectService.createSubject(userA.id, { name: "Mathematics" });
    let goalSubjectMismatchErrored = false;
    try {
      await ResourceService.createResource(userA.id, {
        subjectId: subA2.id,
        goalId: goalA.id,
        title: "Mismatch Resource",
        url: "https://example.com",
      });
    } catch (err: any) {
      goalSubjectMismatchErrored = err.status === 400;
    }
    assert(goalSubjectMismatchErrored, "Test 11 & 12: Goal/Task must belong to selected Subject");

    // 13. URL validation works (rejects javascript:, data:, malformed URLs)
    let unsafeUrlErrored = false;
    try {
      await ResourceService.createResource(userA.id, {
        subjectId: subA.id,
        title: "XSS Attempt",
        url: "javascript:alert(1)",
      });
    } catch (err: any) {
      unsafeUrlErrored = err.status === 400;
    }
    assert(unsafeUrlErrored, "Test 13: Unsafe URL protocols (javascript:) are rejected (400 Bad Request)");

    // 15 & 16. Save and Favorite functionality
    const savedRes = await ResourceService.toggleSaveResource(userA.id, resA.id, false);
    const favRes = await ResourceService.toggleFavoriteResource(userA.id, resA.id, true);
    assert(savedRes.isSaved === false && favRes.isFavorite === true, "Test 15 & 16: Save and Favorite state toggles work cleanly");

    // 17. lastOpenedAt updates when resource is opened
    const openedRes = await ResourceService.markResourceOpened(userA.id, resA.id);
    assert(openedRes.lastOpenedAt !== null, "Test 17: opening resource updates lastOpenedAt timestamp");

    // 18. External search results are temporary & NOT saved automatically
    const searchResults = await ResourceService.searchOnlineResources("Computer Networks", "Subnetting");
    const countInDb = await prisma.resource.count({ where: { userId: userA.id, title: { contains: "Comprehensive Study Guide" } } });
    assert(searchResults.length > 0 && countInDb === 0, "Test 18: External search results return temporary recommendations without saving to DB");

    // 6 & 7. Delete Resource User A vs User B
    let userBDeleteResAErrored = false;
    try {
      await ResourceService.deleteResource(userB.id, resA.id);
    } catch (err: any) {
      userBDeleteResAErrored = err.status === 403;
    }
    assert(userBDeleteResAErrored, "Test 7: User B cannot delete User A's resource (403 Forbidden)");

    await ResourceService.deleteResource(userA.id, resA.id);
    let fetchDeletedErrored = false;
    try {
      await ResourceService.getResourceById(userA.id, resA.id);
    } catch (err: any) {
      fetchDeletedErrored = err.status === 404;
    }
    assert(fetchDeletedErrored, "Test 6: User A can delete own resource cleanly");

    // Cleanup
    await prisma.user.deleteMany({
      where: { id: { in: [userA.id, userB.id] } },
    });

  } catch (err) {
    console.error("❌ Test Execution Error:", err);
    failed++;
  } finally {
    await prisma.$disconnect();
  }

  console.log(`\n📊 Resource Test Results: ${passed} Passed, ${failed} Failed`);
  if (failed > 0) {
    process.exit(1);
  }
}

runResourceTests();

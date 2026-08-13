import prisma from "../db/prisma.js";
import AuthService from "../services/authService.js";
import SubjectService from "../services/subjectService.js";

async function runSubjectApiTests() {
  console.log("🧪 Running StudyFlow Subject & Auth Backend Verification Tests...\n");

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
    // 1. Create Test User 1 & Test User 2
    const { user: user1 } = await AuthService.register(`testuser1-${Date.now()}@test.com`, "Password123!", "Test User 1");
    const { user: user2 } = await AuthService.register(`testuser2-${Date.now()}@test.com`, "Password123!", "Test User 2");

    // 2. Authenticated User 1 creates a Subject
    const sub1 = await SubjectService.createSubject(user1.id, {
      name: "Computer Networks",
      description: "Networking fundamentals",
      color: "#06B6D4",
    });
    assert(sub1.userId === user1.id && sub1.name === "Computer Networks", "Test 3 & 4: Authenticated user can create & retrieve subject");

    // 3. Retrieve single subject by ID
    const fetchedSub1 = await SubjectService.getSubjectById(user1.id, sub1.id);
    assert(fetchedSub1.id === sub1.id, "Test 5: Authenticated user can retrieve their own subject");

    // 4. User 2 cannot retrieve User 1's subject (IDOR Protection)
    let user2GetSub1Errored = false;
    try {
      await SubjectService.getSubjectById(user2.id, sub1.id);
    } catch (err: any) {
      user2GetSub1Errored = err.status === 403;
    }
    assert(user2GetSub1Errored, "Test 6: User 2 cannot retrieve User 1's subject (403 Forbidden)");

    // 5. User 2 cannot update User 1's subject
    let user2UpdateSub1Errored = false;
    try {
      await SubjectService.updateSubject(user2.id, sub1.id, { name: "Hacked Name" });
    } catch (err: any) {
      user2UpdateSub1Errored = err.status === 403;
    }
    assert(user2UpdateSub1Errored, "Test 7: User 2 cannot update User 1's subject (403 Forbidden)");

    // 6. User 2 cannot delete User 1's subject
    let user2DeleteSub1Errored = false;
    try {
      await SubjectService.deleteSubject(user2.id, sub1.id);
    } catch (err: any) {
      user2DeleteSub1Errored = err.status === 403;
    }
    assert(user2DeleteSub1Errored, "Test 8: User 2 cannot delete User 1's subject (403 Forbidden)");

    // 7. Duplicate subject names for the same user are rejected (409 Conflict)
    let duplicateSubjectErrored = false;
    try {
      await SubjectService.createSubject(user1.id, { name: "Computer Networks" });
    } catch (err: any) {
      duplicateSubjectErrored = err.status === 409;
    }
    assert(duplicateSubjectErrored, "Test 9: Duplicate subject name for same user is rejected (409 Conflict)");

    // 8. Same subject name for different users is allowed
    const sub2User2 = await SubjectService.createSubject(user2.id, {
      name: "Computer Networks",
      description: "User 2's networking class",
    });
    assert(sub2User2.userId === user2.id && sub2User2.name === "Computer Networks", "Test 10: Same subject name for different users is allowed");

    // 9. Invalid subject input (empty name) is rejected (400 Bad Request)
    let invalidInputErrored = false;
    try {
      await SubjectService.createSubject(user1.id, { name: "   " });
    } catch (err: any) {
      invalidInputErrored = err.status === 400;
    }
    assert(invalidInputErrored, "Test 11: Invalid subject input (empty name) is rejected (400 Bad Request)");

    // 10. User 1 updates their own subject
    const updatedSub1 = await SubjectService.updateSubject(user1.id, sub1.id, {
      description: "Updated description",
    });
    assert(updatedSub1.description === "Updated description", "Test 12: Authenticated user can update their subject");

    // 11. User 1 deletes their own subject
    await SubjectService.deleteSubject(user1.id, sub1.id);
    let deletedSub1FetchErrored = false;
    try {
      await SubjectService.getSubjectById(user1.id, sub1.id);
    } catch (err: any) {
      deletedSub1FetchErrored = err.status === 404;
    }
    assert(deletedSub1FetchErrored, "Test 13: DELETE subject removes subject cleanly (404 Not Found after delete)");

    // Cleanup test users
    await prisma.user.deleteMany({
      where: { id: { in: [user1.id, user2.id] } },
    });

  } catch (err) {
    console.error("❌ Test Execution Error:", err);
    failed++;
  } finally {
    await prisma.$disconnect();
  }

  console.log(`\n📊 Subject & Auth Test Results: ${passed} Passed, ${failed} Failed`);
  if (failed > 0) {
    process.exit(1);
  }
}

runSubjectApiTests();

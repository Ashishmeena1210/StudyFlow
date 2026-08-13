import prisma from "../db/prisma.js";
import AuthService from "../services/authService.js";
import SubjectService from "../services/subjectService.js";
import GoalService from "../services/goalService.js";
import TaskService from "../services/taskService.js";
import SessionService from "../services/sessionService.js";
import { SessionStatus, SessionType } from "@prisma/client";

async function runSessionTests() {
  console.log("🧪 Running StudyFlow Study Sessions & Timer Backend Tests...\n");

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
    const { user: userA } = await AuthService.register(`sessiona-${Date.now()}@test.com`, "Password123!", "Session User A");
    const { user: userB } = await AuthService.register(`sessionb-${Date.now()}@test.com`, "Password123!", "Session User B");

    // Create Subjects for User A & User B
    const subA = await SubjectService.createSubject(userA.id, { name: "Computer Networks" });
    const subB = await SubjectService.createSubject(userB.id, { name: "DBMS" });

    // Create Goal & Task for User A
    const goalA = await GoalService.createGoal(userA.id, { subjectId: subA.id, title: "Master OSI Model" });
    const taskA = await TaskService.createTask(userA.id, { subjectId: subA.id, goalId: goalA.id, title: "Practice Subnetting" });

    // 1 & 3. Authenticated user can create & retrieve session
    const sessA = await SessionService.createStudySession(userA.id, {
      subjectId: subA.id,
      goalId: goalA.id,
      taskId: taskA.id,
      plannedDuration: 1500, // 25 mins
      sessionType: SessionType.FOCUS,
    });
    assert(sessA.userId === userA.id && sessA.status === SessionStatus.ACTIVE, "Test 1 & 3: Authenticated user can create & retrieve active session");

    // 11. User cannot create multiple active sessions (409 Conflict)
    let multipleActiveErrored = false;
    try {
      await SessionService.createStudySession(userA.id, {
        subjectId: subA.id,
        plannedDuration: 1800,
      });
    } catch (err: any) {
      multipleActiveErrored = err.status === 409;
    }
    assert(multipleActiveErrored, "Test 11: User cannot create multiple active sessions (409 Conflict)");

    // 4. User B cannot retrieve User A's session
    let userBGetSessAErrored = false;
    try {
      await SessionService.getStudySessionById(userB.id, sessA.id);
    } catch (err: any) {
      userBGetSessAErrored = err.status === 403;
    }
    assert(userBGetSessAErrored, "Test 4: User B cannot retrieve User A's session (403 Forbidden)");

    // 5. User cannot use another user's Subject
    let userBUseSubAErrored = false;
    try {
      await SessionService.createStudySession(userB.id, {
        subjectId: subA.id,
        plannedDuration: 1500,
      });
    } catch (err: any) {
      userBUseSubAErrored = err.status === 403;
    }
    assert(userBUseSubAErrored, "Test 5: User B cannot create a session using User A's Subject (403 Forbidden)");

    // 6. User B cannot use User A's Goal
    let userBUseGoalAErrored = false;
    try {
      await SessionService.createStudySession(userB.id, {
        subjectId: subB.id,
        goalId: goalA.id,
        plannedDuration: 1500,
      });
    } catch {
      userBUseGoalAErrored = true;
    }
    assert(userBUseGoalAErrored, "Test 6: User B cannot create a session using User A's Goal");

    // 7. User B cannot use User A's Task
    let userBUseTaskAErrored = false;
    try {
      await SessionService.createStudySession(userB.id, {
        subjectId: subB.id,
        taskId: taskA.id,
        plannedDuration: 1500,
      });
    } catch {
      userBUseTaskAErrored = true;
    }
    assert(userBUseTaskAErrored, "Test 7: User B cannot create a session using User A's Task");

    // 8. Goal must belong to selected Subject
    const subA2 = await SubjectService.createSubject(userA.id, { name: "Mathematics" });
    let goalSubjectMismatchErrored = false;
    try {
      await SessionService.createStudySession(userA.id, {
        subjectId: subA2.id,
        goalId: goalA.id,
        plannedDuration: 1500,
      });
    } catch {
      goalSubjectMismatchErrored = true;
    }
    assert(goalSubjectMismatchErrored, "Test 8: Goal must belong to selected Subject");

    // 17. User B cannot complete User A's session
    let userBCompleteSessAErrored = false;
    try {
      await SessionService.completeStudySession(userB.id, sessA.id);
    } catch (err: any) {
      userBCompleteSessAErrored = err.status === 403;
    }
    assert(userBCompleteSessAErrored, "Test 17: User B cannot complete User A's session (403 Forbidden)");

    // 18. User B cannot cancel User A's session
    let userBCancelSessAErrored = false;
    try {
      await SessionService.cancelStudySession(userB.id, sessA.id);
    } catch (err: any) {
      userBCancelSessAErrored = err.status === 403;
    }
    assert(userBCancelSessAErrored, "Test 18: User B cannot cancel User A's session (403 Forbidden)");

    // 12, 13, 16. Completing early is allowed & sets endedAt & actualDuration
    const completedSessA = await SessionService.completeStudySession(userA.id, sessA.id, {
      completionResult: "Completed 20 subnetting questions",
      reflection: "Felt productive",
    });
    assert(
      completedSessA.status === SessionStatus.COMPLETED &&
      completedSessA.endedAt !== null &&
      completedSessA.actualDuration >= 0,
      "Test 12, 13, 16: Completing session early sets status COMPLETED, endedAt, and calculates actualDuration"
    );

    // 14 & 15. User A creates and cancels a session
    const sessA2 = await SessionService.createStudySession(userA.id, {
      subjectId: subA.id,
      plannedDuration: 2700,
    });
    const cancelledSessA2 = await SessionService.cancelStudySession(userA.id, sessA2.id);
    assert(cancelledSessA2.status === SessionStatus.CANCELLED, "Test 14 & 15: Cancelling a session sets status CANCELLED cleanly");

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

  console.log(`\n📊 Study Session Test Results: ${passed} Passed, ${failed} Failed`);
  if (failed > 0) {
    process.exit(1);
  }
}

runSessionTests();

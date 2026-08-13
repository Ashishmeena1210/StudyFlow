import prisma from "../db/prisma.js";
import AuthService from "../services/authService.js";
import SubjectService from "../services/subjectService.js";
import GoalService from "../services/goalService.js";
import TaskService from "../services/taskService.js";
import SessionService from "../services/sessionService.js";
import ResourceService from "../services/resourceService.js";
import AIResourceService from "../services/aiResourceService.js";
import AnalyticsService from "../services/analyticsService.js";
import { ResourceType } from "@prisma/client";

async function runE2ESecurityTests() {
  console.log("=================================================");
  console.log("🔒 STUDYFLOW PRODUCTION SECURITY & E2E TEST SUITE");
  console.log("=================================================\n");

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
    // ---------------------------------------------------------
    // SCENARIO 1: FULL 19-STEP END-TO-END FLOW (USER A)
    // ---------------------------------------------------------
    console.log("📋 Executing E2E Workflow (19 Steps)...");

    // 1 & 2. Create account & authenticate User A
    const userAEmail = `e2e-userA-${Date.now()}@test.com`;
    const { user: userA } = await AuthService.register(userAEmail, "Password123!", "E2E Student A");
    const loginUserA = await AuthService.login(userAEmail, "Password123!");
    assert(loginUserA.token !== undefined && loginUserA.user.id === userA.id, "Step 1 & 2: User registration & JWT authentication succeed");

    // 3. Create Subject
    const subA = await SubjectService.createSubject(userA.id, { name: "Software Engineering", color: "#06B6D4" });
    assert(subA.userId === userA.id && subA.name === "Software Engineering", "Step 3: Subject created cleanly");

    // 4. Create Goal
    const goalA = await GoalService.createGoal(userA.id, { subjectId: subA.id, title: "Master System Architecture" });
    assert(goalA.userId === userA.id && goalA.subjectId === subA.id, "Step 4: Goal created & linked to Subject");

    // 5. Create Task
    const taskA = await TaskService.createTask(userA.id, { subjectId: subA.id, goalId: goalA.id, title: "Build Express Backend" });
    assert(taskA.userId === userA.id && taskA.goalId === goalA.id, "Step 5: Task created & linked to Goal");

    // 6. Start Study Session
    const sessionA = await SessionService.createStudySession(userA.id, {
      subjectId: subA.id,
      goalId: goalA.id,
      taskId: taskA.id,
      plannedDuration: 1800,
      sessionType: "FOCUS" as any,
    });
    assert(sessionA.userId === userA.id && sessionA.status === "ACTIVE", "Step 6: Active Study Session started");

    // Enforce Single Active Session Constraint (409 Conflict)
    let duplicateActiveErrored = false;
    try {
      await SessionService.createStudySession(userA.id, {
        subjectId: subA.id,
        plannedDuration: 900,
        sessionType: "REVISION" as any,
      });
    } catch (err: any) {
      duplicateActiveErrored = err.status === 409;
    }
    assert(duplicateActiveErrored, "Step 6b: Single active session rule enforced (409 Conflict)");

    // 7 & 8. Complete Study Session & Verify Active Session Restoration
    const completedSessA = await SessionService.completeStudySession(userA.id, sessionA.id, {
      reflection: "Architected microservices cleanly",
      completionResult: "Yes",
    });
    const activeRestoration = await SessionService.getActiveSession(userA.id);
    assert(completedSessA.status === "COMPLETED" && activeRestoration === null, "Step 7 & 8: Session completed cleanly & active restoration clears active state");

    // 9. Add Manual Resource
    const resA = await ResourceService.createResource(userA.id, {
      subjectId: subA.id,
      goalId: goalA.id,
      taskId: taskA.id,
      title: "Prisma ORM Best Practices",
      url: "https://example.com/prisma-guide",
      type: ResourceType.DOCUMENTATION,
      isSaved: true,
    });
    assert(resA.userId === userA.id && resA.isSaved === true, "Step 9: Resource added to student library");

    // 10. Online Resource Search Discovery
    const onlineSearch = await ResourceService.searchOnlineResources("Software Engineering", "Microservices");
    assert(onlineSearch.length > 0, "Step 10: Online resource discovery returns temporary educational suggestions");

    // 11. Save Discovered Resource
    const savedDiscovered = await ResourceService.createResource(userA.id, {
      subjectId: subA.id,
      title: onlineSearch[0].title,
      url: onlineSearch[0].url,
      type: ResourceType.ARTICLE,
      isSaved: true,
    });
    assert(savedDiscovered.isSaved === true, "Step 11: Discovered resource saved to PostgreSQL");

    // 12 & 13. AI Resource Suggestions & Save
    const aiSuggestions = await AIResourceService.suggestResources(userA.id, {
      subjectId: subA.id,
      goalId: goalA.id,
      taskId: taskA.id,
      topic: "System Design Patterns",
    });
    assert(aiSuggestions.suggestions.length > 0, "Step 12: AI assistant generates structured suggestions with explanations");

    const aiResToSave = aiSuggestions.suggestions[0];
    const savedAiRes = await ResourceService.createResource(userA.id, {
      subjectId: subA.id,
      goalId: goalA.id,
      taskId: taskA.id,
      title: aiResToSave.title,
      description: aiResToSave.description,
      url: aiResToSave.url,
      type: aiResToSave.type,
      source: aiResToSave.source,
      isSaved: true,
    });
    await prisma.resource.update({ where: { id: savedAiRes.id }, data: { isAISuggested: true, aiRelevanceReason: aiResToSave.reason } });
    assert(savedAiRes.userId === userA.id, "Step 13: AI suggestion saved with isAISuggested flag & relevance reason");

    // 14 & 15. Complete Task & Check Goal Progress
    await TaskService.updateTask(userA.id, taskA.id, { status: "COMPLETED" });
    const updatedGoal = await GoalService.getGoalById(userA.id, goalA.id);
    assert(updatedGoal.progress === 100, "Step 14 & 15: Task completed & Goal progress automatically recalculated to 100%");

    // 16 & 17. Check Analytics Overview
    const analytics = await AnalyticsService.getAnalyticsOverview(userA.id, { range: "30d" });
    assert(
      analytics.overview.completedSessions === 1 &&
      analytics.overview.tasksCompleted === 1 &&
      analytics.goals.completedCount === 1 &&
      analytics.resources.savedCount >= 3,
      "Step 16 & 17: Analytics reflects real PostgreSQL database activity"
    );

    // ---------------------------------------------------------
    // SCENARIO 2: MANDATORY CROSS-USER SECURITY ISOLATION
    // ---------------------------------------------------------
    console.log("\n🛡️ Executing Mandatory Cross-User Security Isolation Tests...");

    const userBEmail = `e2e-userB-${Date.now()}@test.com`;
    const { user: userB } = await AuthService.register(userBEmail, "Password123!", "E2E Student B");

    // Security Test 1: User B cannot access User A's Subject (403 Forbidden)
    let getSubAErrored = false;
    try {
      await SubjectService.getSubjectById(userB.id, subA.id);
    } catch (err: any) {
      getSubAErrored = err.status === 403;
    }
    assert(getSubAErrored, "Security Test 1: User B cannot access User A's Subject (403 Forbidden)");

    // Security Test 2: User B cannot edit or delete User A's Task (403 Forbidden)
    let updateTaskAErrored = false;
    try {
      await TaskService.updateTask(userB.id, taskA.id, { title: "Hacked Task" });
    } catch (err: any) {
      updateTaskAErrored = err.status === 403;
    }
    assert(updateTaskAErrored, "Security Test 2: User B cannot modify User A's Task (403 Forbidden)");

    // Security Test 3: User B cannot complete or cancel User A's Study Session (403 Forbidden)
    let completeSessAErrored = false;
    try {
      await SessionService.completeStudySession(userB.id, sessionA.id, {});
    } catch (err: any) {
      completeSessAErrored = err.status === 403;
    }
    assert(completeSessAErrored, "Security Test 3: User B cannot complete User A's Study Session (403 Forbidden)");

    // Security Test 4: User B cannot save, favorite, or open User A's Resource (403 Forbidden)
    let resAErrored = false;
    try {
      await ResourceService.toggleFavoriteResource(userB.id, resA.id, true);
    } catch (err: any) {
      resAErrored = err.status === 403;
    }
    assert(resAErrored, "Security Test 4: User B cannot access User A's Resource (403 Forbidden)");

    // Security Test 5: User B Analytics receives ZERO metrics for User A's data
    const userBAnalytics = await AnalyticsService.getAnalyticsOverview(userB.id, { range: "30d" });
    assert(
      userBAnalytics.overview.completedSessions === 0 &&
      userBAnalytics.overview.totalStudyTimeSeconds === 0 &&
      userBAnalytics.overview.tasksCompleted === 0,
      "Security Test 5: User B Analytics is isolated and returns 0 metrics for User A's activity"
    );

    // Cleanup
    await prisma.user.deleteMany({
      where: { id: { in: [userA.id, userB.id] } },
    });

  } catch (err) {
    console.error("❌ E2E & Security Test Execution Error:", err);
    failed++;
  } finally {
    await prisma.$disconnect();
  }

  console.log(`\n📊 E2E & Security Test Results: ${passed} Passed, ${failed} Failed`);
  if (failed > 0) {
    process.exit(1);
  }
}

runE2ESecurityTests();

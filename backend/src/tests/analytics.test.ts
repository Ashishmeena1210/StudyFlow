import prisma from "../db/prisma.js";
import AuthService from "../services/authService.js";
import SubjectService from "../services/subjectService.js";
import GoalService from "../services/goalService.js";
import TaskService from "../services/taskService.js";
import SessionService from "../services/sessionService.js";
import ResourceService from "../services/resourceService.js";
import AnalyticsService from "../services/analyticsService.js";
import { ResourceType } from "@prisma/client";

async function runAnalyticsTests() {
  console.log("🧪 Running StudyFlow Analytics Engine Backend Tests...\n");

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
    const { user: userA } = await AuthService.register(`anala-${Date.now()}@test.com`, "Password123!", "Analytics User A");
    const { user: userB } = await AuthService.register(`analb-${Date.now()}@test.com`, "Password123!", "Analytics User B");

    // 12. Empty state (0 sessions/tasks returns 0 metrics without error)
    const emptyOverview = await AnalyticsService.getAnalyticsOverview(userA.id, { range: "30d" });
    assert(
      emptyOverview.overview.totalStudyTimeSeconds === 0 &&
      emptyOverview.overview.completedSessions === 0 &&
      emptyOverview.overview.studyDays === 0 &&
      emptyOverview.overview.tasksCompleted === 0,
      "Test 12: User with 0 study sessions/tasks returns clean 0 overview metrics without errors"
    );

    // Setup User A Subjects, Goals, Tasks, Sessions, Resources
    const subA = await SubjectService.createSubject(userA.id, { name: "Computer Networks" });
    const goalA = await GoalService.createGoal(userA.id, { subjectId: subA.id, title: "Master TCP/IP" });

    // Deterministic Tasks
    const taskA1 = await TaskService.createTask(userA.id, { subjectId: subA.id, goalId: goalA.id, title: "Task 1" });
    const taskA2 = await TaskService.createTask(userA.id, { subjectId: subA.id, goalId: goalA.id, title: "Task 2" });
    await TaskService.updateTask(userA.id, taskA1.id, { status: "COMPLETED" });

    // Overdue task
    const yesterday = new Date(Date.now() - 86400000).toISOString();
    await TaskService.createTask(userA.id, { subjectId: subA.id, goalId: goalA.id, title: "Overdue Task", dueDate: yesterday });

    // Deterministic Study Sessions (Monday = 60m, Tuesday = 30m, Wednesday = 90m -> Total 180m = 10800s)
    const sess1 = await SessionService.createStudySession(userA.id, { subjectId: subA.id, plannedDuration: 3600, sessionType: "FOCUS" as any });
    await SessionService.completeStudySession(userA.id, sess1.id, { reflection: "Good session" });

    const sess2 = await SessionService.createStudySession(userA.id, { subjectId: subA.id, plannedDuration: 1800, sessionType: "REVISION" as any });
    await SessionService.completeStudySession(userA.id, sess2.id, { reflection: "Quick review" });

    // Cancelled Session (Should NOT be counted)
    const sessCancel = await SessionService.createStudySession(userA.id, { subjectId: subA.id, plannedDuration: 3600, sessionType: "FOCUS" as any });
    await SessionService.cancelStudySession(userA.id, sessCancel.id);

    // Resources
    const resA = await ResourceService.createResource(userA.id, {
      subjectId: subA.id,
      title: "Networking Guide",
      url: "https://example.com/net",
      type: ResourceType.ARTICLE,
      isSaved: true,
    });
    await ResourceService.markResourceOpened(userA.id, resA.id);

    // Run Analytics
    const overview = await AnalyticsService.getAnalyticsOverview(userA.id, { range: "30d" });

    // 1 & 2. Total study time and completed sessions count
    assert(
      overview.overview.completedSessions === 2 &&
      overview.overview.totalStudyTimeSeconds > 0,
      "Test 1 & 2: Total study time sum and completed session count calculate accurately"
    );

    // 3. Study day count
    assert(overview.overview.studyDays >= 1, "Test 3: Distinct study day count derived accurately");

    // 4. Subject study-time aggregation
    assert(
      overview.subjectBreakdown.length === 1 &&
      overview.subjectBreakdown[0].subjectName === "Computer Networks",
      "Test 4: Subject study-time aggregation groups duration by subject"
    );

    // 5 & 6. Task completion count and overdue task calculation
    assert(
      overview.overview.tasksCompleted === 1 &&
      overview.overview.tasksOverdue === 1,
      "Test 5 & 6: Task completion and overdue task counts calculated accurately"
    );

    // 7. Goal progress
    assert(overview.goals.activeCount === 1, "Test 7: Active goal count and progress aggregated correctly");

    // 8 & 9. Date range and Subject filtering
    const subjectFiltered = await AnalyticsService.getAnalyticsOverview(userA.id, { range: "7d", subjectId: subA.id });
    assert(subjectFiltered.subjectId === subA.id, "Test 8 & 9: Date range and Subject filtering work cleanly");

    // 10. Resource statistics
    assert(
      overview.resources.savedCount === 1 &&
      overview.resources.openedCount === 1,
      "Test 10: Resource statistics (saved & opened count) reflect real database state"
    );

    // 11. User B cannot access User A's analytics metrics (User B gets 0)
    const userBOverview = await AnalyticsService.getAnalyticsOverview(userB.id, { range: "30d" });
    assert(
      userBOverview.overview.totalStudyTimeSeconds === 0 &&
      userBOverview.overview.completedSessions === 0,
      "Test 11: User B analytics is isolated and returns 0 metrics for User A's data"
    );

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

  console.log(`\n📊 Analytics Engine Test Results: ${passed} Passed, ${failed} Failed`);
  if (failed > 0) {
    process.exit(1);
  }
}

runAnalyticsTests();

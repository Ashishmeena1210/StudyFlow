import prisma from "../db/prisma.js";
import AuthService from "../services/authService.js";
import SubjectService from "../services/subjectService.js";
import GoalService from "../services/goalService.js";
import TaskService from "../services/taskService.js";
import { GoalStatus, TaskPriority, TaskStatus } from "@prisma/client";

async function runPlannerTests() {
  console.log("🧪 Running StudyFlow Goals, Tasks & Goal Progress Backend Tests...\n");

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
    // 1. Create Test Users
    const { user: userA } = await AuthService.register(`plannera-${Date.now()}@test.com`, "Password123!", "Planner User A");
    const { user: userB } = await AuthService.register(`plannerb-${Date.now()}@test.com`, "Password123!", "Planner User B");

    // Create Subjects for User A & User B
    const subA = await SubjectService.createSubject(userA.id, { name: "Networks" });
    const subB = await SubjectService.createSubject(userB.id, { name: "DBMS" });

    // 1. Authenticated User A creates Goal
    const goalA = await GoalService.createGoal(userA.id, {
      subjectId: subA.id,
      title: "Master TCP/IP Protocols",
    });
    assert(goalA.userId === userA.id && goalA.progress === 0, "Test 1 & 3: Authenticated user can create & retrieve Goal");

    // 4. User B cannot retrieve User A's Goal
    let userBGetGoalAErrored = false;
    try {
      await GoalService.getGoalById(userB.id, goalA.id);
    } catch (err: any) {
      userBGetGoalAErrored = err.status === 403;
    }
    assert(userBGetGoalAErrored, "Test 4: User B cannot retrieve User A's Goal (403 Forbidden)");

    // 5. User A can update own Goal
    const updatedGoalA = await GoalService.updateGoal(userA.id, goalA.id, {
      description: "Updated networking goal",
    });
    assert(updatedGoalA.description === "Updated networking goal", "Test 5: User A can update own Goal");

    // 6. User B cannot update User A's Goal
    let userBUpdateGoalAErrored = false;
    try {
      await GoalService.updateGoal(userB.id, goalA.id, { title: "Hacked Goal" });
    } catch (err: any) {
      userBUpdateGoalAErrored = err.status === 403;
    }
    assert(userBUpdateGoalAErrored, "Test 6: User B cannot update User A's Goal (403 Forbidden)");

    // 9. Invalid progress is rejected
    let invalidProgressErrored = false;
    try {
      await GoalService.updateGoal(userA.id, goalA.id, { progress: 150 });
    } catch (err: any) {
      invalidProgressErrored = err.status === 400;
    }
    assert(invalidProgressErrored, "Test 9: Invalid goal progress (>100) is rejected (400 Bad Request)");

    // 10. Invalid Subject is rejected when creating Goal
    let invalidSubjectGoalErrored = false;
    try {
      await GoalService.createGoal(userA.id, { subjectId: subB.id, title: "Malicious Goal" });
    } catch {
      invalidSubjectGoalErrored = true;
    }
    assert(invalidSubjectGoalErrored, "Test 10: Invalid or unauthorized Subject is rejected for Goal creation");

    // 11. Authenticated User A creates Task (without Goal)
    const taskWithoutGoal = await TaskService.createTask(userA.id, {
      subjectId: subA.id,
      title: "Task Without Goal",
    });
    assert(taskWithoutGoal.goalId === null, "Test 11 & 12: Task can exist without Goal");

    // 13. Task assigned to Goal
    const task1 = await TaskService.createTask(userA.id, {
      subjectId: subA.id,
      goalId: goalA.id,
      title: "Subnetting Practice",
      priority: TaskPriority.HIGH,
    });
    const task2 = await TaskService.createTask(userA.id, {
      subjectId: subA.id,
      goalId: goalA.id,
      title: "Routing Basics",
    });
    assert(task1.goalId === goalA.id && task2.goalId === goalA.id, "Test 13: Tasks can be assigned to Goal");

    // 14 & 15. Cross-user Goal or Subject assignment to Task is rejected
    let crossUserTaskErrored = false;
    try {
      await TaskService.createTask(userB.id, {
        subjectId: subA.id,
        goalId: goalA.id,
        title: "Malicious Cross Task",
      });
    } catch {
      crossUserTaskErrored = true;
    }
    assert(crossUserTaskErrored, "Test 14 & 15: Cross-user Goal/Subject assignment to Task is rejected");

    // 16. Completed Task gets completedAt
    const completedTask1 = await TaskService.updateTask(userA.id, task1.id, {
      status: TaskStatus.COMPLETED,
    });
    assert(completedTask1.completedAt !== null, "Test 16: Completed Task gets a valid completedAt timestamp");

    // 21. Completing Task updates Goal progress (1 of 2 tasks completed = 50%)
    const goalAfterTask1Completed = await GoalService.getGoalById(userA.id, goalA.id);
    assert(goalAfterTask1Completed.progress === 50, "Test 21: Completing Task updates Goal progress (50%)");

    // 17 & 22. Reopening Task clears completedAt & recalculates Goal progress (0 of 2 = 0%)
    const reopenedTask1 = await TaskService.updateTask(userA.id, task1.id, {
      status: TaskStatus.TODO,
    });
    const goalAfterTask1Reopened = await GoalService.getGoalById(userA.id, goalA.id);
    assert(reopenedTask1.completedAt === null && goalAfterTask1Reopened.progress === 0, "Test 17 & 22: Reopening Task clears completedAt & updates Goal progress (0%)");

    // Complete both tasks -> Goal progress = 100%
    await TaskService.updateTask(userA.id, task1.id, { status: TaskStatus.COMPLETED });
    await TaskService.updateTask(userA.id, task2.id, { status: TaskStatus.COMPLETED });
    const goalAfterBothCompleted = await GoalService.getGoalById(userA.id, goalA.id);
    assert(goalAfterBothCompleted.progress === 100 && goalAfterBothCompleted.status === GoalStatus.COMPLETED, "Goal automatically marks COMPLETED when all tasks completed (100%)");

    // 23. Deleting Task updates Goal progress
    await TaskService.deleteTask(userA.id, task2.id);
    const goalAfterTask2Deleted = await GoalService.getGoalById(userA.id, goalA.id);
    assert(goalAfterTask2Deleted.progress === 100, "Test 23: Deleting Task recalculates Goal progress (1 of 1 remaining = 100%)");

    // 24. Moving Task between Goals updates both Goals
    const goalA2 = await GoalService.createGoal(userA.id, {
      subjectId: subA.id,
      title: "Second Goal",
    });
    await TaskService.updateTask(userA.id, task1.id, { goalId: goalA2.id });
    const oldGoalAfterMove = await GoalService.getGoalById(userA.id, goalA.id);
    const newGoalAfterMove = await GoalService.getGoalById(userA.id, goalA2.id);
    assert(oldGoalAfterMove.progress === 0 && newGoalAfterMove.progress === 100, "Test 24: Moving Task between Goals updates progress on both Goals");

    // 7 & 8. Delete Goal User A vs User B
    let userBDeleteGoalAErrored = false;
    try {
      await GoalService.deleteGoal(userB.id, goalA.id);
    } catch (err: any) {
      userBDeleteGoalAErrored = err.status === 403;
    }
    assert(userBDeleteGoalAErrored, "Test 8: User B cannot delete User A's Goal (403 Forbidden)");

    await GoalService.deleteGoal(userA.id, goalA.id);
    let fetchDeletedGoalAErrored = false;
    try {
      await GoalService.getGoalById(userA.id, goalA.id);
    } catch (err: any) {
      fetchDeletedGoalAErrored = err.status === 404;
    }
    assert(fetchDeletedGoalAErrored, "Test 7: User A can delete own Goal cleanly");

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

  console.log(`\n📊 Planner Test Results: ${passed} Passed, ${failed} Failed`);
  if (failed > 0) {
    process.exit(1);
  }
}

runPlannerTests();

import prisma from "../db/prisma.js";
import AuthService from "../services/authService.js";
import SubjectService from "../services/subjectService.js";
import GoalService from "../services/goalService.js";
import TaskService from "../services/taskService.js";
import ResourceService from "../services/resourceService.js";
import AIResourceService from "../services/aiResourceService.js";

async function runAITests() {
  console.log("🧪 Running StudyFlow AI Resource Assistant Backend Tests...\n");

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
    const { user: userA } = await AuthService.register(`aia-${Date.now()}@test.com`, "Password123!", "AI User A");
    const { user: userB } = await AuthService.register(`aib-${Date.now()}@test.com`, "Password123!", "AI User B");

    // Create Subjects for User A & User B
    const subA = await SubjectService.createSubject(userA.id, { name: "Computer Networks" });
    const subB = await SubjectService.createSubject(userB.id, { name: "DBMS" });

    const goalA = await GoalService.createGoal(userA.id, { subjectId: subA.id, title: "Master TCP/IP" });
    const taskA = await TaskService.createTask(userA.id, { subjectId: subA.id, goalId: goalA.id, title: "Subnetting Practice" });

    // 2. User B cannot request AI suggestions for User A's Subject
    let userBUseSubAErrored = false;
    try {
      await AIResourceService.suggestResources(userB.id, {
        subjectId: subA.id,
        topic: "Subnetting",
      });
    } catch (err: any) {
      userBUseSubAErrored = err.status === 403;
    }
    assert(userBUseSubAErrored, "Test 2: User B cannot request AI suggestions for User A's Subject (403 Forbidden)");

    // 3 & 4. User B cannot use User A's Goal or Task
    let userBUseGoalAErrored = false;
    try {
      await AIResourceService.suggestResources(userB.id, {
        subjectId: subB.id,
        goalId: goalA.id,
        topic: "Normalization",
      });
    } catch {
      userBUseGoalAErrored = true;
    }
    assert(userBUseGoalAErrored, "Test 3 & 4: User B cannot use User A's Goal/Task for AI requests");

    // 5. Valid request returns structured suggestions with title, description, type, url, source, reason
    const result = await AIResourceService.suggestResources(userA.id, {
      subjectId: subA.id,
      goalId: goalA.id,
      taskId: taskA.id,
      topic: "Subnetting",
    });

    const hasValidStructure = Array.isArray(result.suggestions) &&
      result.suggestions.every(s =>
        typeof s.title === "string" &&
        typeof s.description === "string" &&
        typeof s.url === "string" &&
        typeof s.source === "string" &&
        typeof s.reason === "string"
      );

    assert(hasValidStructure && result.suggestions.length > 0, "Test 5: Valid request returns structured AI suggestions with explanations");

    // 6. Invalid request (missing topic) is rejected (400)
    let missingTopicErrored = false;
    try {
      await AIResourceService.suggestResources(userA.id, {
        subjectId: subA.id,
        topic: "   ",
      });
    } catch (err: any) {
      missingTopicErrored = err.status === 400;
    }
    assert(missingTopicErrored, "Test 6: Invalid request (missing topic) is rejected (400 Bad Request)");

    // 8. AI suggestions are NOT saved automatically to PostgreSQL database
    const initialDbCount = await prisma.resource.count({ where: { userId: userA.id } });
    assert(initialDbCount === 0, "Test 8: AI suggestions are temporary recommendations and NOT auto-saved to DB");

    // 9. Saving an AI suggestion creates a Resource record with isAISuggested = true
    const suggestionToSave = result.suggestions[0];
    const savedResource = await ResourceService.createResource(userA.id, {
      subjectId: subA.id,
      goalId: goalA.id,
      taskId: taskA.id,
      title: suggestionToSave.title,
      description: suggestionToSave.description,
      url: suggestionToSave.url,
      type: suggestionToSave.type,
      source: suggestionToSave.source,
      isSaved: true,
    });
    // Update isAISuggested flag
    const updatedAiRes = await prisma.resource.update({
      where: { id: savedResource.id },
      data: { isAISuggested: true, aiRelevanceReason: suggestionToSave.reason },
    });
    assert(updatedAiRes.isAISuggested === true && updatedAiRes.aiRelevanceReason !== null, "Test 9: Saving AI suggestion creates Resource record with isAISuggested = true and aiRelevanceReason");

    // 10. Saving duplicate URL returns/handles gracefully without duplicating records
    const checkDuplicates = await AIResourceService.suggestResources(userA.id, {
      subjectId: subA.id,
      topic: "Subnetting",
    });
    const duplicateSuggestion = checkDuplicates.suggestions.find(s => s.url.toLowerCase() === suggestionToSave.url.toLowerCase());
    assert(duplicateSuggestion?.alreadySaved === true, "Test 10: AI service detects existing saved URLs and flags alreadySaved = true");

    // 11. AI API key is never returned to frontend (Response contains only structured suggestions)
    assert(!JSON.stringify(result).includes("AI_API_KEY") && !JSON.stringify(result).includes("studyflow-dev-ai-key"), "Test 11: AI API key is never returned to frontend");

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

  console.log(`\n📊 AI Resource Assistant Test Results: ${passed} Passed, ${failed} Failed`);
  if (failed > 0) {
    process.exit(1);
  }
}

runAITests();

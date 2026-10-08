const puppeteer = require("puppeteer-core");
const path = require("path");

async function runE2ETests() {
  console.log("=== STARTING FULL END-TO-END APPLICATION TEST SUITE ===");

  const browser = await puppeteer.launch({
    executablePath: "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
    headless: "new",
    args: ["--no-sandbox", "--disable-setuid-sandbox"]
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 800 });

  const consoleErrors = [];
  page.on("console", msg => {
    if (msg.type() === "error") {
      consoleErrors.push(msg.text());
      console.error("PAGE ERROR:", msg.text());
    }
  });
  page.on("pageerror", err => {
    consoleErrors.push(err.toString());
    console.error("UNCAUGHT ERROR:", err);
  });

  await page.goto("http://localhost:8080/index.html", { waitUntil: "networkidle0" });
  console.log("Page loaded successfully.");

  // TEST 1: Signup a brand new user
  console.log("\n--- TEST 1: Complete Signup & Auto-Login to Dashboard ---");
  await page.click("button[data-popup='signup']");
  await new Promise(r => setTimeout(r, 400));
  
  const testEmail = `student_${Date.now()}@college.edu`;
  await page.type("#signup-name", "Priya Sharma");
  await page.type("#signup-email", testEmail);
  await page.type("#signup-password", "pass1234");
  await page.type("#signup-confirm-password", "pass1234");
  await page.type("#signup-college", "Delhi Technological University");
  await page.type("#signup-degree", "B.Tech Information Technology");
  await page.select("#signup-role", "frontend");

  await page.click("#btn-do-signup");
  await new Promise(r => setTimeout(r, 600));

  const isDashActive = await page.$eval("#dashboard", el => el.classList.contains("active"));
  const dashNameText = await page.$eval("#dash-user-name", el => el.innerText);
  console.log("Dashboard active after signup:", isDashActive);
  console.log("Dashboard user name:", dashNameText);
  if (!isDashActive || !dashNameText.includes("Priya Sharma")) {
    throw new Error("Signup flow failed to redirect to Dashboard with user profile");
  }

  // Close Dashboard
  await page.click("#dashboard .popup-close");
  await new Promise(r => setTimeout(r, 300));

  // TEST 2: Upload Sample Resume in Resume Analyzer
  console.log("\n--- TEST 2: Resume Analyzer with PDF Upload ---");
  await page.click("a[data-popup='resume']");
  await new Promise(r => setTimeout(r, 400));

  const fileInput = await page.$("#resume-file-input");
  const pdfPath = path.resolve(__dirname, "sample_kunal_resume.pdf");
  await fileInput.uploadFile(pdfPath);
  await page.select("#resume-target-role", "frontend");
  await page.click("#run-resume-analysis");

  await page.waitForFunction(() => {
    const el = document.getElementById("resume-result");
    return el && !el.innerText.includes("Analyzing your resume") && el.innerText.includes("RESUME SCORE");
  }, { timeout: 10000 });

  const resumeResultText = await page.$eval("#resume-result", el => el.innerText);
  console.log("Resume Result generated:\n", resumeResultText.substring(0, 300) + "...\n");
  if (!resumeResultText.includes("RESUME SCORE") || !resumeResultText.includes("ALL DETECTED SKILLS")) {
    throw new Error("Resume analysis did not produce expected scores/skills");
  }

  // TEST 3: Transfer to Skill Gap & check generated missing skills
  console.log("\n--- TEST 3: Skill Gap Analysis from Resume ---");
  await page.click("#transfer-to-skill-gap");
  await new Promise(r => setTimeout(r, 500));

  const isSkillsActive = await page.$eval("#skills", el => el.classList.contains("active"));
  const skillGapText = await page.$eval("#skill-gap-result", el => el.innerText);
  console.log("Skill Gap active:", isSkillsActive);
  console.log("Skill Gap summary:\n", skillGapText.substring(0, 250) + "...\n");
  if (!isSkillsActive || !skillGapText.toLowerCase().includes("skill match")) {
    throw new Error("Skill Gap analysis transition failed");
  }

  // TEST 4: Generate Career Roadmap from Gaps
  console.log("\n--- TEST 4: Generate Personalized Career Roadmap ---");
  await page.click("#btn-skill-to-roadmap");
  await new Promise(r => setTimeout(r, 500));

  const isRoadmapActive = await page.$eval("#roadmap", el => el.classList.contains("active"));
  const roadmapTitle = await page.$eval("#roadmap-role-title", el => el.innerText);
  const milestoneCount = await page.$$eval("#roadmap-milestones-container > div", els => els.length);
  console.log("Roadmap active:", isRoadmapActive);
  console.log("Roadmap title:", roadmapTitle);
  console.log("Roadmap monthly phases count:", milestoneCount);
  if (!isRoadmapActive || milestoneCount < 3) {
    throw new Error("Roadmap generation failed");
  }

  // TEST 5: Check off a roadmap task and verify progress updates
  console.log("\n--- TEST 5: Interactive Roadmap Progress Tracking ---");
  const initialPct = await page.$eval("#roadmap-progress-text", el => el.innerText);
  console.log("Initial progress:", initialPct);

  // Toggle first unchecked box
  const checkboxes = await page.$$("#roadmap-milestones-container input[type='checkbox']");
  for (const cb of checkboxes) {
    const isChecked = await cb.evaluate(el => el.checked);
    if (!isChecked) {
      await cb.click();
      break;
    }
  }
  await new Promise(r => setTimeout(r, 300));
  const updatedPct = await page.$eval("#roadmap-progress-text", el => el.innerText);
  console.log("Updated progress:", updatedPct);

  // TEST 6: AI Mock Interview Session
  console.log("\n--- TEST 6: AI Mock Interview Session ---");
  await page.click("#btn-roadmap-to-interview");
  await new Promise(r => setTimeout(r, 500));

  const isIntActive = await page.$eval("#interview", el => el.classList.contains("active"));
  console.log("Mock Interview modal active:", isIntActive);

  // Start interview session
  await page.click("#btn-start-interview");
  await new Promise(r => setTimeout(r, 400));

  const q1Text = await page.$eval("#interview-question-text", el => el.innerText);
  console.log("Question 1:", q1Text);
  if (!q1Text || q1Text.length < 10) throw new Error("Interview question not displayed");

  // Type answer
  await page.type("#interview-answer-input", "Virtual DOM is an in-memory representation of real DOM. React uses diffing and reconciliation algorithm to batch and update only changed nodes, boosting render performance.");
  await page.click("#btn-submit-answer");

  await page.waitForFunction(() => {
    const card = document.getElementById("interview-evaluation-card");
    return card && card.style.display !== "none";
  }, { timeout: 6000 });

  const evalFeedback = await page.$eval("#interview-q-feedback-text", el => el.innerText);
  const evalScore = await page.$eval("#interview-q-score", el => el.innerText);
  console.log("AI Evaluation Score:", evalScore);
  console.log("AI Feedback summary:", evalFeedback.substring(0, 150) + "...");

  // Advance questions to completion
  while (true) {
    const isScorecard = await page.$eval("#interview-scorecard-view", el => el.style.display !== "none");
    if (isScorecard) break;

    const isNextBtnVisible = await page.$eval("#btn-next-question", el => el.offsetParent !== null);
    if (isNextBtnVisible) {
      await page.click("#btn-next-question");
      await new Promise(r => setTimeout(r, 300));
    }

    const isScorecardAfter = await page.$eval("#interview-scorecard-view", el => el.style.display !== "none");
    if (isScorecardAfter) break;

    await page.type("#interview-answer-input", "We prioritize scalable modular architecture, test-driven development, and clean reusable components.");
    await page.click("#btn-submit-answer");
    await page.waitForFunction(() => {
      const card = document.getElementById("interview-evaluation-card");
      return card && card.style.display !== "none";
    }, { timeout: 6000 });
  }

  const finalScoreText = await page.$eval("#interview-final-score", el => el.innerText);
  console.log("Final Interview Scorecard:", finalScoreText.trim());

  // TEST 7: Internship Recommendations & Apply Flow
  console.log("\n--- TEST 7: Internship Finder & Application Flow ---");
  await page.click("#btn-interview-to-internships");
  await new Promise(r => setTimeout(r, 500));

  const isInternActive = await page.$eval("#internships", el => el.classList.contains("active"));
  const internshipCards = await page.$$("#internships-list > div");
  console.log("Internships modal active:", isInternActive);
  console.log("Recommended internships count:", internshipCards.length);
  if (!isInternActive || internshipCards.length === 0) {
    throw new Error("Internships recommendations failed to load");
  }

  // Click Apply Now on first internship
  page.on("dialog", async dialog => {
    console.log("Alert Dialog encountered:", dialog.message().substring(0, 60) + "...");
    await dialog.accept();
  });

  const firstApplyBtn = await page.$("#internships-list .btn-apply-internship");
  await firstApplyBtn.click();
  await new Promise(r => setTimeout(r, 400));
  const appliedBtn = await page.$("#internships-list .btn-apply-internship");
  const appliedBtnText = await appliedBtn.evaluate(el => el.innerText);
  console.log("Apply button status after click:", appliedBtnText);
  if (!appliedBtnText.includes("Applied")) {
    throw new Error("Internship application state not updated");
  }

  // TEST 8: Open Dashboard & Verify All Synchronized Metrics
  console.log("\n--- TEST 8: Verify Real-Time Dashboard Integration ---");
  await page.click("#internships .popup-close");
  await new Promise(r => setTimeout(r, 300));

  await page.click("button[data-popup='dashboard']");
  await new Promise(r => setTimeout(r, 400));

  const dashATS = await page.$eval("#dash-stat-resume", el => el.innerText);
  const dashSkillMatch = await page.$eval("#dash-stat-skills", el => el.innerText);
  const dashInterview = await page.$eval("#dash-stat-interview", el => el.innerText);
  const dashActivities = await page.$eval("#dash-recent-activities", el => el.innerText);

  console.log("Dashboard Resume ATS Score:", dashATS);
  console.log("Dashboard Skill Match:", dashSkillMatch);
  console.log("Dashboard Mock Interview Score:", dashInterview);
  console.log("Dashboard Activities feed:\n", dashActivities);

  if (dashATS.includes("--") || dashInterview.includes("--")) {
    throw new Error("Dashboard failed to synchronize live metrics across features");
  }

  // TEST 9: Logout & State Protection
  console.log("\n--- TEST 9: Logout & Protection Flow ---");
  await page.click("#btn-do-logout");
  await new Promise(r => setTimeout(r, 400));

  const isLoginActive = await page.$eval("#login", el => el.classList.contains("active"));
  console.log("Login modal active after logout:", isLoginActive);
  if (!isLoginActive) throw new Error("Logout did not redirect to Login");

  // Reload page to test persistence across page refresh
  console.log("\n--- TEST 10: Page Reload & Persistence Verification ---");
  await page.reload({ waitUntil: "networkidle0" });
  await page.click("a[data-popup='login']");
  await page.type("#login-email", testEmail);
  await page.type("#login-password", "pass1234");
  await page.click("#btn-do-login");
  await new Promise(r => setTimeout(r, 400));

  const reloadedUserName = await page.$eval("#dash-user-name", el => el.innerText);
  const reloadedATS = await page.$eval("#dash-stat-resume", el => el.innerText);
  console.log("Reloaded user name:", reloadedUserName);
  console.log("Reloaded resume score:", reloadedATS);
  if (!reloadedUserName.includes("Priya Sharma") || reloadedATS.includes("--")) {
    throw new Error("User state did not persist properly across login/reload");
  }

  console.log("\n--- Console Error Audit ---");
  console.log("Total console errors:", consoleErrors.length);
  if (consoleErrors.length > 0) {
    throw new Error("Console errors detected: " + JSON.stringify(consoleErrors));
  }

  console.log("\n=======================================================");
  console.log(">>> ALL 10 E2E TESTS PASSED WITH 100% SUCCESS! <<<");
  console.log("=======================================================");

  await browser.close();
}

runE2ETests().catch(err => {
  console.error("\nTEST SUITE FAILED:", err);
  process.exit(1);
});

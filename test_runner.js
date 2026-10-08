const puppeteer = require("puppeteer-core");
const path = require("path");

async function runTests() {
  console.log("=== STARTING COMPREHENSIVE AUTOMATED TESTS ===");
  
  const browser = await puppeteer.launch({
    executablePath: "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
    headless: "new",
    args: ["--no-sandbox", "--disable-setuid-sandbox"]
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 800 });
  const consoleErrors = [];

  page.on("requestfailed", req => {
    console.log("REQUEST FAILED:", req.url(), req.failure() && req.failure().errorText);
  });

  page.on("console", msg => {
    if (msg.type() === "error") {
      consoleErrors.push(msg.text());
      console.error("PAGE ERROR:", msg.text());
    } else {
      console.log("PAGE LOG:", msg.text());
    }
  });

  page.on("pageerror", err => {
    consoleErrors.push(err.toString());
    console.error("UNCAUGHT ERROR:", err);
  });

  await page.goto("http://localhost:8080/index.html", { waitUntil: "networkidle0" });
  console.log("Page loaded successfully.");

  // TEST 1: Open Resume Analyzer via navbar
  console.log("\n--- TEST 1: Open Resume Analyzer ---");
  await page.click("a[data-popup='resume']");
  await new Promise(r => setTimeout(r, 400));
  const isResumeActive = await page.$eval("#resume", el => el.classList.contains("active"));
  console.log("Resume popup active:", isResumeActive);
  if (!isResumeActive) throw new Error("Resume popup failed to open");

  // TEST 7: Validation when no file is uploaded
  console.log("\n--- TEST 7: Analyze with No Resume Uploaded ---");
  await page.click("#run-resume-analysis");
  await new Promise(r => setTimeout(r, 300));
  const noFileError = await page.$eval("#resume-result", el => el.innerText);
  console.log("Validation output:", noFileError.trim());
  if (!noFileError.includes("Please upload your resume first")) {
    throw new Error("Expected validation error not found");
  }

  // TEST 2: Upload PDF resume and check filename display
  console.log("\n--- TEST 2: Upload PDF Resume ---");
  const fileInput = await page.$("#resume-file-input");
  const pdfPath = path.resolve(__dirname, "sample_kunal_resume.pdf");
  await fileInput.uploadFile(pdfPath);
  await new Promise(r => setTimeout(r, 300));
  const fileNameDisplay = await page.$eval("#resume-file-name", el => el.innerText);
  console.log("File name display:", fileNameDisplay.trim());
  if (!fileNameDisplay.includes("sample_kunal_resume.pdf")) {
    throw new Error("Filename display failed");
  }

  // TEST 3 & 4: Select Software Developer and Analyze
  console.log("\n--- TEST 3 & 4: Analyze for Software Developer ---");
  await page.select("#resume-target-role", "software");
  await page.click("#run-resume-analysis");
  // Wait for loading to finish and results to appear
  await page.waitForFunction(() => {
    const el = document.getElementById("resume-result");
    return el && el.innerText.includes("RESUME SCORE");
  }, { timeout: 10000 });

  const softwareResultText = await page.$eval("#resume-result", el => el.innerText);
  console.log("Software Dev Analysis Summary:\n", softwareResultText.substring(0, 400) + "...\n");

  if (!softwareResultText.includes("RESUME SCORE") || !softwareResultText.includes("ATS SCORE")) {
    throw new Error("Missing score sections in results");
  }
  if (!softwareResultText.includes("ALL DETECTED SKILLS")) {
    throw new Error("Missing detected skills");
  }

  // TEST 5: Select AI/ML Engineer and re-analyze to verify role-specific difference
  console.log("\n--- TEST 5: Change Role to AI/ML Engineer and Re-Analyze ---");
  await page.select("#resume-target-role", "aiml");
  await page.click("#run-resume-analysis");
  await page.waitForFunction(() => {
    const el = document.getElementById("resume-result");
    return el && !el.innerText.includes("Analyzing your resume") && el.innerText.includes("ROLE-SPECIFIC SKILL GAPS (AI/ML ENGINEER)");
  }, { timeout: 10000 });

  const aimlResultText = await page.$eval("#resume-result", el => el.innerText);
  console.log("AI/ML Engineer Analysis Summary:\n", aimlResultText.substring(0, 400) + "...\n");
  if (!aimlResultText.includes("AI/ML Engineer")) {
    throw new Error("AI/ML role gap analysis not displayed");
  }

  // TEST 6: Upload a different resume (Plain text frontend resume)
  console.log("\n--- TEST 6: Upload Different Resume (Frontend Text) ---");
  const frontendResumePath = path.resolve(__dirname, "sample_frontend_resume.txt");
  // create frontend test file
  require("fs").writeFileSync(frontendResumePath, `
Alex Morgan
alex.morgan@email.com | 123-456-7890
LinkedIn: linkedin.com/in/alexmorgan | GitHub: github.com/alexmorgan

EDUCATION
BS Computer Science, State College (2021-2025)

SKILLS
HTML5, CSS3, JavaScript, React, Redux, Tailwind CSS, Git, Responsive Design

PROJECTS
E-Commerce Frontend: Built React store using Tailwind and Redux. Increased mobile engagement by 40%.
Portfolio Website: Built responsive web design using HTML, CSS, JavaScript.

EXPERIENCE
Frontend Developer Intern at WebTech (2024)
- Built interactive UI components in React and JavaScript.
  `);

  await fileInput.uploadFile(frontendResumePath);
  await page.select("#resume-target-role", "frontend");
  await page.click("#run-resume-analysis");
  await page.waitForFunction(() => {
    const el = document.getElementById("resume-result");
    return el && !el.innerText.includes("Analyzing your resume") && el.innerText.includes("ROLE-SPECIFIC SKILL GAPS (FRONTEND DEVELOPER)");
  }, { timeout: 10000 });

  const frontendResultText = await page.$eval("#resume-result", el => el.innerText);
  console.log("Frontend Resume Results:\n", frontendResultText.substring(0, 400) + "...\n");
  if (!frontendResultText.includes("Frontend Developer") || !frontendResultText.includes("React")) {
    throw new Error("Frontend resume analysis failed");
  }

  // TEST 9 & 16: Click Transfer to Skill Gap Analysis
  console.log("\n--- TEST 9 & 16: Transfer to Skill Gap & Verify Integration ---");
  await page.click("#transfer-to-skill-gap");
  await new Promise(r => setTimeout(r, 500));

  const isSkillPopupActive = await page.$eval("#skills", el => el.classList.contains("active"));
  const isResumePopupClosed = await page.$eval("#resume", el => !el.classList.contains("active"));
  const selectedSkillRole = await page.$eval("#skill-target-role", el => el.value);
  const transferredSkillsText = await page.$eval("#skill-current-skills", el => el.value);
  const skillGapResultVisible = await page.$eval("#skill-gap-result", el => el.style.display !== "none");
  const skillGapResultText = await page.$eval("#skill-gap-result", el => el.innerText);

  console.log("Skill Gap popup active:", isSkillPopupActive);
  console.log("Resume popup closed:", isResumePopupClosed);
  console.log("Selected role in Skill Gap:", selectedSkillRole);
  console.log("Transferred skills:", transferredSkillsText);
  console.log("Skill Gap automatically analyzed:", skillGapResultVisible);
  console.log("Skill Gap results:\n", skillGapResultText.trim());

  if (!isSkillPopupActive || !isResumePopupClosed) {
    throw new Error("Popup transition failed");
  }
  if (selectedSkillRole !== "frontend") {
    throw new Error("Target role was not synced to Skill Gap");
  }
  if (!transferredSkillsText.includes("React") || !transferredSkillsText.includes("HTML")) {
    throw new Error("Detected skills were not transferred to Skill Gap");
  }
  if (!skillGapResultText.toLowerCase().includes("skill match")) {
    throw new Error("Skill Gap analysis did not execute");
  }

  // TEST: Close popup and click Resume Analyzer feature card directly
  console.log("\n--- TEST: Click Resume Analyzer Feature Card ---");
  await page.click("#skills .popup-close");
  await new Promise(r => setTimeout(r, 300));
  
  // Find feature card with AI Resume Analyzer
  const cards = await page.$$(".feature-card");
  let resumeCard = null;
  for (const card of cards) {
    const text = await card.evaluate(el => el.innerText);
    if (text.includes("AI Resume Analyzer")) {
      resumeCard = card;
      break;
    }
  }
  if (!resumeCard) throw new Error("Could not find Resume Analyzer feature card");
  await resumeCard.click();
  await new Promise(r => setTimeout(r, 400));
  const isResumeActiveAfterCardClick = await page.$eval("#resume", el => el.classList.contains("active"));
  console.log("Resume popup active after clicking feature card:", isResumeActiveAfterCardClick);
  if (!isResumeActiveAfterCardClick) throw new Error("Feature card click failed to open resume popup");

  // TEST 8: Console Error Check
  console.log("\n--- TEST 8: Browser Console Errors Check ---");
  console.log("Total console errors encountered:", consoleErrors.length);
  if (consoleErrors.length > 0) {
    console.error("Console Errors:", consoleErrors);
    throw new Error("Encountered console errors during test execution!");
  }

  console.log("\n>>> ALL TESTS PASSED WITH 100% SUCCESS! <<<");
  await browser.close();
}

runTests().catch(err => {
  console.error("TEST SUITE FAILED:", err);
  process.exit(1);
});

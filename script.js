document.addEventListener("DOMContentLoaded", () => {

  // Configure PDF.js worker if available
  if (typeof pdfjsLib !== "undefined") {
    pdfjsLib.GlobalWorkerOptions.workerSrc =
      "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js";
  }

  // ==========================================
  // STORAGE & CENTRAL USER PROFILE MANAGEMENT
  // ==========================================

  const STORAGE_KEY_USERS = "nextstepai_users_v2";
  const STORAGE_KEY_CURRENT = "nextstepai_current_user_v2";

  const DEFAULT_DEMO_USER = {
    name: "Kunal Katiyar",
    email: "demo@nextstepai.com",
    password: "demo123",
    education: "Undergraduate",
    college: "XYZ Institute of Technology",
    degree: "B.Tech Computer Science",
    graduationYear: "2026",
    preferredRole: "aiml",
    resumeData: {
      fileName: "sample_kunal_resume.pdf",
      resumeScore: 88,
      atsScore: 92,
      categoryScores: {
        skills: 82,
        projects: 85,
        experience: 80,
        education: 95,
        formatting: 92
      },
      detectedSkills: ["Python", "Machine Learning", "SQL", "Pandas", "NumPy", "Git", "React", "JavaScript"],
      strengths: [
        "Strong technical skill coverage with 8 identified core technologies.",
        "Hands-on project experience with predictive modeling and web platforms.",
        "Solid academic qualifications with Computer Science degree."
      ],
      weaknesses: [
        "Project descriptions could include more quantifiable outcome metrics.",
        "Missing specialized mathematics & deep learning frameworks."
      ],
      recommendations: [
        "Add quantifiable metrics to projects (e.g. 'Improved speed by 30%').",
        "Incorporate deep learning tools like PyTorch or TensorFlow."
      ],
      feedback: "Your profile demonstrates strong alignment with AI/ML engineering roles with verified competencies in Python, Machine Learning, and SQL."
    },
    skills: ["Python", "Machine Learning", "SQL", "Pandas", "NumPy", "Git", "React", "JavaScript"],
    skillGaps: {
      targetRole: "aiml",
      matched: ["Python", "NumPy", "Pandas", "Machine Learning", "SQL", "Git"],
      missing: ["Scikit-learn", "Mathematics"],
      percentage: 75,
      recommendation: "Your biggest skill gaps are Scikit-learn and Mathematics. Focus on these skills first."
    },
    roadmap: null,
    roadmapProgress: 35,
    interviewResults: [
      {
        date: "2026-10-08",
        role: "AI/ML Engineer",
        difficulty: "Intermediate",
        type: "Technical",
        overallScore: 84,
        technicalScore: 88,
        communicationScore: 80,
        feedback: "Solid foundation in ML model evaluation and Python data pipelines."
      }
    ],
    latestInterviewScore: 84,
    appliedInternships: [1],
    recentActivities: [
      { text: "Account initialized with Kunal K. profile", time: "Today" },
      { text: "Analyzed sample AI/ML resume (Score: 88/100)", time: "Today" },
      { text: "Calculated Skill Gap for AI/ML Engineer (75% match)", time: "Today" }
    ]
  };

  function getAllUsers() {
    try {
      const data = localStorage.getItem(STORAGE_KEY_USERS);
      if (data) return JSON.parse(data);
    } catch (e) {
      console.error("Storage read error:", e);
    }
    return [DEFAULT_DEMO_USER];
  }

  function saveAllUsers(users) {
    try {
      localStorage.setItem(STORAGE_KEY_USERS, JSON.stringify(users));
    } catch (e) {
      console.error("Storage write error:", e);
    }
  }

  function getCurrentUser() {
    try {
      const data = localStorage.getItem(STORAGE_KEY_CURRENT);
      if (data) return JSON.parse(data);
    } catch (e) {
      console.error("Storage read error:", e);
    }
    return null;
  }

  function saveCurrentUser(user) {
    try {
      if (user) {
        localStorage.setItem(STORAGE_KEY_CURRENT, JSON.stringify(user));
        // Also update in all users array
        const users = getAllUsers();
        const index = users.findIndex(u => u.email.toLowerCase() === user.email.toLowerCase());
        if (index >= 0) {
          users[index] = user;
        } else {
          users.push(user);
        }
        saveAllUsers(users);
      } else {
        localStorage.removeItem(STORAGE_KEY_CURRENT);
      }
    } catch (e) {
      console.error("Save current user error:", e);
    }
  }

  function addRecentActivity(text) {
    const user = getCurrentUser();
    if (!user) return;
    if (!user.recentActivities) user.recentActivities = [];
    user.recentActivities.unshift({
      text: text,
      time: "Just now"
    });
    if (user.recentActivities.length > 8) {
      user.recentActivities = user.recentActivities.slice(0, 8);
    }
    saveCurrentUser(user);
    renderDashboard();
  }

  // ==========================================
  // ROLE & SKILL TAXONOMY
  // ==========================================

  const ROLE_DATA = {
    aiml: {
      name: "AI/ML Engineer",
      skills: ["Python", "NumPy", "Pandas", "Machine Learning", "SQL", "Scikit-learn", "Mathematics", "Git"]
    },
    software: {
      name: "Software Developer",
      skills: ["C++", "Java", "Python", "Data Structures", "Algorithms", "SQL", "Git"]
    },
    frontend: {
      name: "Frontend Developer",
      skills: ["HTML", "CSS", "JavaScript", "React", "Git", "Responsive Design", "APIs"]
    },
    backend: {
      name: "Backend Developer",
      skills: ["Python", "Java", "Node.js", "SQL", "APIs", "Git", "Databases"]
    },
    fullstack: {
      name: "Full Stack Developer",
      skills: ["HTML", "CSS", "JavaScript", "React", "Node.js", "Python", "SQL", "Git", "APIs"]
    },
    data: {
      name: "Data Scientist",
      skills: ["Python", "Pandas", "NumPy", "SQL", "Statistics", "Machine Learning", "Data Visualization"]
    },
    android: {
      name: "Android Developer",
      skills: ["Java", "Kotlin", "Android Studio", "XML", "APIs", "Git", "SQLite"]
    }
  };

  const SKILL_ALIASES = {
    "html": ["html", "html5"],
    "css": ["css", "css3"],
    "javascript": ["javascript", "js", "ecmascript", "es6", "vanillajs", "vanilla js"],
    "react": ["react", "reactjs", "react.js", "react js"],
    "git": ["git", "github", "gitlab", "version control"],
    "responsive design": ["responsive design", "responsive web design", "responsive", "mobile responsive", "media queries", "rwd"],
    "apis": ["apis", "api", "rest api", "rest apis", "restful api", "restful apis", "rest", "web api", "web apis", "fastapi", "graphql"],
    "python": ["python", "python3", "py"],
    "java": ["java", "core java", "java 8", "java 11", "java 17", "java 21"],
    "node.js": ["node.js", "nodejs", "node", "node js"],
    "sql": ["sql", "mysql", "postgresql", "postgres", "sqlite", "oracle sql", "ms sql", "sql server", "rdbms", "plsql", "pl/sql", "mariadb"],
    "databases": ["databases", "database", "db", "rdbms", "mongodb", "nosql", "sql", "postgresql", "mysql", "oracle", "database management"],
    "numpy": ["numpy", "np"],
    "pandas": ["pandas", "pd"],
    "machine learning": ["machine learning", "ml", "ai/ml", "ai & ml", "deep learning", "dl", "artificial intelligence", "ai"],
    "scikit-learn": ["scikit-learn", "scikit learn", "sklearn", "sci-kit learn"],
    "mathematics": ["mathematics", "math", "maths", "linear algebra", "calculus"],
    "statistics": ["statistics", "stats", "probability", "statistical analysis"],
    "data visualization": ["data visualization", "dataviz", "data viz", "visualization", "matplotlib", "seaborn", "tableau", "power bi", "powerbi", "plotly"],
    "kotlin": ["kotlin"],
    "android studio": ["android studio", "android", "android dev", "android development", "android sdk"],
    "xml": ["xml"],
    "sqlite": ["sqlite", "sqlite3"],
    "c++": ["c++", "cpp", "c plus plus"],
    "data structures": ["data structures", "data structure", "ds", "dsa", "data structures and algorithms"],
    "algorithms": ["algorithms", "algorithm", "algo", "algos", "dsa", "data structures and algorithms"]
  };

  function cleanToken(str) {
    return (str || "")
      .toLowerCase()
      .replace(/[^a-z0-9+#]/g, "")
      .trim();
  }

  function skillMatches(userSkill, requiredSkill) {
    const uRaw = (userSkill || "").toLowerCase().trim();
    const rRaw = (requiredSkill || "").toLowerCase().trim();

    if (!uRaw || !rRaw) return false;
    if (uRaw === rRaw) return true;

    const uClean = cleanToken(uRaw);
    const rClean = cleanToken(rRaw);
    if (uClean && uClean === rClean) return true;

    const aliases = SKILL_ALIASES[rRaw] || [];
    for (const alias of aliases) {
      const aRaw = alias.toLowerCase().trim();
      if (uRaw === aRaw) return true;
      const aClean = cleanToken(aRaw);
      if (uClean && aClean && uClean === aClean) return true;
    }

    return false;
  }

  const MASTER_SKILLS = [
    { name: "Python", regex: /\b(?:python|python3|py)\b/i },
    { name: "Java", regex: /\b(?:java|core\s*java|java\s*\d+)\b/i },
    { name: "JavaScript", regex: /\b(?:javascript|js|ecmascript|es6|vanillajs)\b/i },
    { name: "TypeScript", regex: /\b(?:typescript|ts)\b/i },
    { name: "C++", regex: /\b(?:c\+\+|cpp|c\s*plus\s*plus)\b/i },
    { name: "C#", regex: /\b(?:c\#|csharp|c\s*sharp)\b/i },
    { name: "C", regex: /\b(?:c\s*language|ansi\s*c|\bc\b(?=\s*programming|\s*developer|\s*coding|,|\/))\b/i },
    { name: "HTML", regex: /\b(?:html|html5)\b/i },
    { name: "CSS", regex: /\b(?:css|css3)\b/i },
    { name: "SQL", regex: /\b(?:sql|mysql|postgresql|postgres|sqlite|plsql|pl\/sql|mariadb|ms\s*sql|sql\s*server)\b/i },
    { name: "Kotlin", regex: /\bkotlin\b/i },
    { name: "Swift", regex: /\bswift\b/i },
    { name: "PHP", regex: /\bphp\b/i },
    { name: "Ruby", regex: /\b(?:ruby|ruby\s*on\s*rails)\b/i },
    { name: "Go", regex: /\b(?:golang|go\s*lang|\bgo\b(?=\s*developer|\s*programming|,|\/))\b/i },
    { name: "R", regex: /\b(?:r\s*language|\br\b(?=\s*programming|\s*studio|\s*data|,|\/))\b/i },
    { name: "React", regex: /\b(?:react|reactjs|react\.js)\b/i },
    { name: "Angular", regex: /\b(?:angular|angularjs|angular\.js)\b/i },
    { name: "Vue.js", regex: /\b(?:vue|vuejs|vue\.js)\b/i },
    { name: "Next.js", regex: /\b(?:next|nextjs|next\.js)\b/i },
    { name: "Redux", regex: /\b(?:redux|redux-toolkit|rtk)\b/i },
    { name: "Tailwind CSS", regex: /\b(?:tailwind|tailwindcss|tailwind\s*css)\b/i },
    { name: "Bootstrap", regex: /\bbootstrap\b/i },
    { name: "Responsive Design", regex: /\b(?:responsive\s*design|responsive\s*web\s*design|mobile\s*responsive|media\s*queries)\b/i },
    { name: "Node.js", regex: /\b(?:node|nodejs|node\.js)\b/i },
    { name: "Express", regex: /\b(?:express|expressjs|express\.js)\b/i },
    { name: "Django", regex: /\bdjango\b/i },
    { name: "Flask", regex: /\bflask\b/i },
    { name: "FastAPI", regex: /\bfastapi\b/i },
    { name: "Spring Boot", regex: /\b(?:spring\s*boot|spring\s*framework|spring)\b/i },
    { name: "APIs", regex: /\b(?:rest|restful|rest\s*api|rest\s*apis|restful\s*apis|api|apis|web\s*apis)\b/i },
    { name: "GraphQL", regex: /\bgraphql\b/i },
    { name: "MongoDB", regex: /\b(?:mongodb|mongo)\b/i },
    { name: "PostgreSQL", regex: /\b(?:postgresql|postgres)\b/i },
    { name: "MySQL", regex: /\bmysql\b/i },
    { name: "SQLite", regex: /\b(?:sqlite|sqlite3)\b/i },
    { name: "Redis", regex: /\bredis\b/i },
    { name: "Firebase", regex: /\b(?:firebase|firestore)\b/i },
    { name: "Databases", regex: /\b(?:database|databases|db|rdbms|nosql)\b/i },
    { name: "AWS", regex: /\b(?:aws|amazon\s*web\s*services|ec2|s3|lambda)\b/i },
    { name: "Azure", regex: /\b(?:azure|microsoft\s*azure)\b/i },
    { name: "GCP", regex: /\b(?:gcp|google\s*cloud|google\s*cloud\s*platform)\b/i },
    { name: "Docker", regex: /\bdocker\b/i },
    { name: "Kubernetes", regex: /\b(?:kubernetes|k8s)\b/i },
    { name: "Machine Learning", regex: /\b(?:machine\s*learning|ml|deep\s*learning|dl|artificial\s*intelligence|ai)\b/i },
    { name: "NumPy", regex: /\b(?:numpy|np)\b/i },
    { name: "Pandas", regex: /\b(?:pandas|pd)\b/i },
    { name: "Scikit-learn", regex: /\b(?:scikit-learn|scikit\s*learn|sklearn)\b/i },
    { name: "TensorFlow", regex: /\b(?:tensorflow|tf)\b/i },
    { name: "PyTorch", regex: /\bpytorch\b/i },
    { name: "Keras", regex: /\bkeras\b/i },
    { name: "OpenCV", regex: /\bopencv\b/i },
    { name: "NLP", regex: /\b(?:nlp|natural\s*language\s*processing)\b/i },
    { name: "Statistics", regex: /\b(?:statistics|stats|probability|statistical\s*analysis)\b/i },
    { name: "Mathematics", regex: /\b(?:mathematics|math|maths|linear\s*algebra|calculus)\b/i },
    { name: "Data Visualization", regex: /\b(?:data\s*visualization|dataviz|matplotlib|seaborn|tableau|power\s*bi|powerbi|plotly)\b/i },
    { name: "Android Studio", regex: /\b(?:android\s*studio|android\s*sdk|android\s*development|android\s*app)\b/i },
    { name: "XML", regex: /\bxml\b/i },
    { name: "Git", regex: /\b(?:git|github|gitlab|version\s*control)\b/i },
    { name: "Data Structures", regex: /\b(?:data\s*structures|data\s*structure|ds|dsa)\b/i },
    { name: "Algorithms", regex: /\b(?:algorithms|algorithm|algo|algos|dsa)\b/i },
    { name: "Linux", regex: /\b(?:linux|ubuntu|unix|bash|shell\s*scripting)\b/i },
    { name: "CI/CD", regex: /\b(?:ci\/cd|ci-cd|continuous\s*integration|jenkins|github\s*actions)\b/i },
    { name: "Unit Testing", regex: /\b(?:testing|unit\s*testing|junit|jest|pytest|selenium|cypress)\b/i },
    { name: "OOP", regex: /\b(?:oop|object\s*oriented|object-oriented)\b/i },
    { name: "System Design", regex: /\b(?:system\s*design|microservices)\b/i }
  ];

  // ==========================================
  // AUTHENTICATION & SESSION HANDLING
  // ==========================================

  function initAuthUI() {
    const user = getCurrentUser();
    const navActions = document.getElementById("nav-actions-container");

    if (!navActions) return;

    if (user) {
      navActions.innerHTML = `
        <a href="#" class="login" data-popup="dashboard" style="display:flex; align-items:center; gap:6px; font-weight:600;">
          <span>👤</span>
          <span>${user.name.split(" ")[0]}</span>
        </a>
        <button class="btn btn-small" data-popup="dashboard" id="nav-dash-btn">
          Dashboard ✦
        </button>
      `;
    } else {
      navActions.innerHTML = `
        <a href="#" class="login" data-popup="login" id="nav-login-btn">
          Login
        </a>
        <button class="btn btn-small" data-popup="signup" id="nav-signup-btn">
          Sign Up ✦
        </button>
      `;
    }

    // Re-bind click handlers for dynamic navbar links
    navActions.querySelectorAll("[data-popup]").forEach(el => {
      el.addEventListener("click", (e) => {
        e.preventDefault();
        const popupId = el.getAttribute("data-popup");
        if (popupId) openPopup(popupId);
      });
    });
  }

  // Handle Signup
  const btnSignup = document.getElementById("btn-do-signup");
  if (btnSignup) {
    btnSignup.addEventListener("click", () => {
      const name = (document.getElementById("signup-name")?.value || "").trim();
      const email = (document.getElementById("signup-email")?.value || "").trim().toLowerCase();
      const pass = (document.getElementById("signup-password")?.value || "").trim();
      const confirmPass = (document.getElementById("signup-confirm-password")?.value || "").trim();
      const edu = document.getElementById("signup-education")?.value || "Undergraduate";
      const year = document.getElementById("signup-year")?.value || "2026";
      const college = (document.getElementById("signup-college")?.value || "").trim();
      const degree = (document.getElementById("signup-degree")?.value || "").trim();
      const role = document.getElementById("signup-role")?.value || "software";
      const msg = document.getElementById("signup-msg");

      if (!msg) return;

      if (!name || !email || !pass || !confirmPass) {
        msg.style.display = "block";
        msg.innerHTML = `<div style="padding:10px; background:rgba(217,83,79,0.1); border-left:3px solid #d9534f; border-radius:6px; color:#b52b27; font-size:13px; font-weight:600;">Please fill in all required fields.</div>`;
        return;
      }

      if (!email.includes("@") || !email.includes(".")) {
        msg.style.display = "block";
        msg.innerHTML = `<div style="padding:10px; background:rgba(217,83,79,0.1); border-left:3px solid #d9534f; border-radius:6px; color:#b52b27; font-size:13px; font-weight:600;">Please enter a valid email address.</div>`;
        return;
      }

      if (pass.length < 6) {
        msg.style.display = "block";
        msg.innerHTML = `<div style="padding:10px; background:rgba(217,83,79,0.1); border-left:3px solid #d9534f; border-radius:6px; color:#b52b27; font-size:13px; font-weight:600;">Password must be at least 6 characters long.</div>`;
        return;
      }

      if (pass !== confirmPass) {
        msg.style.display = "block";
        msg.innerHTML = `<div style="padding:10px; background:rgba(217,83,79,0.1); border-left:3px solid #d9534f; border-radius:6px; color:#b52b27; font-size:13px; font-weight:600;">Passwords do not match.</div>`;
        return;
      }

      const users = getAllUsers();
      if (users.some(u => u.email === email)) {
        msg.style.display = "block";
        msg.innerHTML = `<div style="padding:10px; background:rgba(217,83,79,0.1); border-left:3px solid #d9534f; border-radius:6px; color:#b52b27; font-size:13px; font-weight:600;">An account with this email already exists. Please login.</div>`;
        return;
      }

      const newUser = {
        name,
        email,
        password: pass,
        education: edu,
        college: college || "Engineering College",
        degree: degree || "Computer Science",
        graduationYear: year,
        preferredRole: role,
        resumeData: null,
        skills: [],
        skillGaps: null,
        roadmap: null,
        roadmapProgress: 0,
        interviewResults: [],
        latestInterviewScore: null,
        appliedInternships: [],
        recentActivities: [
          { text: "Account created and profile initialized", time: "Just now" }
        ]
      };

      saveCurrentUser(newUser);
      initAuthUI();
      closeAllPopups();
      openPopup("dashboard");
      renderDashboard();
    });
  }

  // Handle Login
  const btnLogin = document.getElementById("btn-do-login");
  if (btnLogin) {
    btnLogin.addEventListener("click", () => {
      const email = (document.getElementById("login-email")?.value || "").trim().toLowerCase();
      const pass = (document.getElementById("login-password")?.value || "").trim();
      const msg = document.getElementById("login-msg");

      if (!msg) return;

      if (!email || !pass) {
        msg.style.display = "block";
        msg.innerHTML = `<div style="padding:10px; background:rgba(217,83,79,0.1); border-left:3px solid #d9534f; border-radius:6px; color:#b52b27; font-size:13px; font-weight:600;">Please enter your email and password.</div>`;
        return;
      }

      const users = getAllUsers();
      const user = users.find(u => u.email.toLowerCase() === email && u.password === pass);

      if (!user) {
        msg.style.display = "block";
        msg.innerHTML = `<div style="padding:10px; background:rgba(217,83,79,0.1); border-left:3px solid #d9534f; border-radius:6px; color:#b52b27; font-size:13px; font-weight:600;">Invalid email or password.</div>`;
        return;
      }

      saveCurrentUser(user);
      initAuthUI();
      closeAllPopups();
      openPopup("dashboard");
      renderDashboard();
    });
  }

  // Handle Demo Login
  const btnDemoLogin = document.getElementById("btn-demo-login");
  if (btnDemoLogin) {
    btnDemoLogin.addEventListener("click", () => {
      saveCurrentUser(DEFAULT_DEMO_USER);
      initAuthUI();
      closeAllPopups();
      openPopup("dashboard");
      renderDashboard();
    });
  }

  // Handle Interactive Demo Button
  const btnStartDemo = document.getElementById("btn-start-interactive-demo");
  if (btnStartDemo) {
    btnStartDemo.addEventListener("click", () => {
      if (!getCurrentUser()) {
        saveCurrentUser(DEFAULT_DEMO_USER);
      }
      initAuthUI();
      closeAllPopups();
      openPopup("dashboard");
      renderDashboard();
    });
  }

  // Handle Logout
  const btnLogout = document.getElementById("btn-do-logout");
  if (btnLogout) {
    btnLogout.addEventListener("click", () => {
      saveCurrentUser(null);
      initAuthUI();
      closeAllPopups();
      openPopup("login");
    });
  }

  // ==========================================
  // DASHBOARD RENDERER
  // ==========================================

  function renderDashboard() {
    let user = getCurrentUser();
    if (!user) {
      user = DEFAULT_DEMO_USER;
    }

    const roleInfo = ROLE_DATA[user.preferredRole] || ROLE_DATA.software;

    const nameEl = document.getElementById("dash-user-name");
    const subEl = document.getElementById("dash-user-subtitle");
    if (nameEl) nameEl.textContent = `Welcome, ${user.name}`;
    if (subEl) subEl.textContent = `${user.education || "Undergraduate"} • ${user.degree || "Computer Science"} • Target: ${roleInfo.name}`;

    // Update KPI 1: Resume Score
    const statResume = document.getElementById("dash-stat-resume");
    const statResumeSub = document.getElementById("dash-stat-resume-sub");
    if (statResume) {
      if (user.resumeData && user.resumeData.atsScore) {
        statResume.innerHTML = `${user.resumeData.atsScore}<small style="font-size:14px; color:#687783;">/100</small>`;
        if (statResumeSub) statResumeSub.textContent = `Resume Score: ${user.resumeData.resumeScore}/100`;
      } else {
        statResume.textContent = "--/100";
        if (statResumeSub) statResumeSub.textContent = "Upload to analyze";
      }
    }

    // Update KPI 2: Skill Match %
    const statSkills = document.getElementById("dash-stat-skills");
    const statSkillsSub = document.getElementById("dash-stat-skills-sub");
    if (statSkills) {
      if (user.skillGaps && user.skillGaps.percentage !== undefined) {
        statSkills.textContent = `${user.skillGaps.percentage}%`;
        if (statSkillsSub) statSkillsSub.textContent = `${user.skillGaps.matched.length} of ${user.skillGaps.matched.length + user.skillGaps.missing.length} skills`;
      } else if (user.skills && user.skills.length > 0) {
        const required = roleInfo.skills;
        const matched = required.filter(req => user.skills.some(s => skillMatches(s, req)));
        const pct = Math.round((matched.length / required.length) * 100);
        statSkills.textContent = `${pct}%`;
        if (statSkillsSub) statSkillsSub.textContent = `${matched.length} of ${required.length} skills`;
      } else {
        statSkills.textContent = "--%";
        if (statSkillsSub) statSkillsSub.textContent = "Analyze skill gaps";
      }
    }

    // Update KPI 3: Mock Interview Score
    const statInterview = document.getElementById("dash-stat-interview");
    const statInterviewSub = document.getElementById("dash-stat-interview-sub");
    if (statInterview) {
      if (user.latestInterviewScore) {
        statInterview.innerHTML = `${user.latestInterviewScore}<small style="font-size:14px; color:#687783;">/100</small>`;
        if (statInterviewSub) statInterviewSub.textContent = "Verified AI Assessment";
      } else {
        statInterview.textContent = "--/100";
        if (statInterviewSub) statInterviewSub.textContent = "Take mock interview";
      }
    }

    // Update KPI 4: Roadmap Progress
    const statRoadmap = document.getElementById("dash-stat-roadmap");
    const statRoadmapSub = document.getElementById("dash-stat-roadmap-sub");
    const dashRoadmapRole = document.getElementById("dash-roadmap-role-title");
    const dashRoadmapPct = document.getElementById("dash-roadmap-percent-text");
    const dashRoadmapBar = document.getElementById("dash-roadmap-bar");

    const progress = user.roadmapProgress || 0;
    if (statRoadmap) statRoadmap.textContent = `${progress}%`;
    if (statRoadmapSub) statRoadmapSub.textContent = progress > 0 ? "In progress" : "Start roadmap";
    if (dashRoadmapRole) dashRoadmapRole.textContent = `${roleInfo.name} Roadmap`;
    if (dashRoadmapPct) dashRoadmapPct.textContent = `${progress}% completed`;
    if (dashRoadmapBar) dashRoadmapBar.style.width = `${progress}%`;

    // Recent Activities Feed
    const activitiesEl = document.getElementById("dash-recent-activities");
    if (activitiesEl) {
      if (user.recentActivities && user.recentActivities.length > 0) {
        activitiesEl.innerHTML = user.recentActivities.map(a => `
          <div style="display:flex; justify-content:space-between; align-items:center; padding:6px 0; border-bottom:1px solid rgba(38,55,70,0.06); font-size:13px;">
            <span style="color:#263746; font-weight:500;">✦ ${a.text}</span>
            <span style="color:#71808b; font-size:11px;">${a.time}</span>
          </div>
        `).join("");
      } else {
        activitiesEl.innerHTML = `<p style="margin:0; font-size:13px; color:#687783;">No recent activity yet. Start by analyzing your resume or practicing mock interviews.</p>`;
      }
    }

    // Dash Continue Button
    const dashActionBtn = document.getElementById("dash-continue-btn");
    if (dashActionBtn) {
      dashActionBtn.onclick = () => {
        closeAllPopups();
        openPopup("roadmap");
      };
    }
  }

  // ==========================================
  // TEXT EXTRACTION ENGINE (PDF, DOCX, DOC, TXT)
  // ==========================================

  function extractRawStrings(arrayBuffer) {
    const bytes = new Uint8Array(arrayBuffer);
    let str = "";
    let chunk = "";
    for (let i = 0; i < bytes.length; i++) {
      const code = bytes[i];
      if ((code >= 32 && code <= 126) || code === 10 || code === 13 || code === 9) {
        chunk += String.fromCharCode(code);
      } else {
        if (chunk.length >= 3) {
          str += " " + chunk;
        }
        chunk = "";
      }
    }
    if (chunk.length >= 3) {
      str += " " + chunk;
    }
    return str;
  }

  async function extractTextFromResume(file) {
    const fileName = (file.name || "").toLowerCase();

    if (fileName.endsWith(".txt")) {
      return await file.text();
    }

    if (fileName.endsWith(".pdf")) {
      const arrayBuffer = await file.arrayBuffer();
      if (typeof pdfjsLib !== "undefined") {
        try {
          const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
          const pdf = await loadingTask.promise;
          let fullText = "";
          for (let i = 1; i <= pdf.numPages; i++) {
            const page = await pdf.getPage(i);
            const textContent = await page.getTextContent();
            const pageText = textContent.items.map(item => item.str).join(" ");
            fullText += pageText + "\n";
          }
          if (fullText.trim().length > 20) {
            return fullText;
          }
        } catch (err) {
          console.warn("PDF.js parse warning:", err);
        }
      }
      return extractRawStrings(arrayBuffer);
    }

    if (fileName.endsWith(".docx")) {
      const arrayBuffer = await file.arrayBuffer();
      if (typeof mammoth !== "undefined") {
        try {
          const result = await mammoth.extractRawText({ arrayBuffer: arrayBuffer });
          if (result && result.value && result.value.trim().length > 20) {
            return result.value;
          }
        } catch (err) {
          console.warn("Mammoth parse warning:", err);
        }
      }
      return extractRawStrings(arrayBuffer);
    }

    try {
      const text = await file.text();
      return text;
    } catch {
      const arrayBuffer = await file.arrayBuffer();
      return extractRawStrings(arrayBuffer);
    }
  }

  // ==========================================
  // RESUME ANALYSIS ENGINE
  // ==========================================

  function parseResumeContent(text, selectedRoleId) {
    const emailMatch = text.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/i);
    const phoneMatch = text.match(/(?:\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}|\b\d{10,12}\b/);
    const linkedinMatch = /linkedin\.com|linkedin/i.test(text);
    const githubMatch = /github\.com|github/i.test(text);

    const contactInfo = {
      email: emailMatch ? emailMatch[0] : null,
      phone: phoneMatch ? phoneMatch[0] : null,
      linkedin: linkedinMatch,
      github: githubMatch
    };

    const sections = {
      education: /\b(?:education|academic|academics|b\.?tech|m\.?tech|bca|mca|b\.?e|bachelor|master|degree|university|college|cgpa|gpa|percentage)\b/i.test(text),
      experience: /\b(?:experience|work\s*experience|employment|internship|intern|work\s*history|professional\s*experience)\b/i.test(text),
      projects: /\b(?:projects|academic\s*projects|personal\s*projects|key\s*projects|portfolio\s*projects|capstone)\b/i.test(text),
      skills: /\b(?:skills|technical\s*skills|technologies|tools|competencies|programming\s*languages|core\s*skills)\b/i.test(text),
      certifications: /\b(?:certification|certifications|certificate|certificates|certified|courses|licensed|credentials)\b/i.test(text),
      achievements: /\b(?:achievements|awards|accomplishments|honors|publications|extracurricular|hackathon|rank|winner)\b/i.test(text)
    };

    const detectedSkillsSet = new Set();
    MASTER_SKILLS.forEach(item => {
      if (item.regex.test(text)) {
        detectedSkillsSet.add(item.name);
      }
    });
    const detectedSkills = Array.from(detectedSkillsSet);

    const targetRole = ROLE_DATA[selectedRoleId] || ROLE_DATA.software;
    const requiredSkills = targetRole.skills;

    const matchedRoleSkills = requiredSkills.filter(req =>
      detectedSkills.some(ds => skillMatches(ds, req))
    );

    const missingRoleSkills = requiredSkills.filter(req =>
      !detectedSkills.some(ds => skillMatches(ds, req))
    );

    const roleMatchRatio = matchedRoleSkills.length / requiredSkills.length;
    const actionVerbsMatches = text.match(/\b(?:developed|implemented|engineered|designed|optimized|built|created|integrated|spearheaded|architected|resolved|deployed|managed|analyzed|collaborated|automated|refactored|led)\b/gi) || [];
    const metricMatches = text.match(/\b\d+%\b|\b\d+\+\s*(?:users|clients|stars|downloads|requests|projects)?\b|\b(?:improved|reduced|increased|optimized|accelerated)\s+by\s+\d+/gi) || [];
    const hasMetrics = metricMatches.length > 0;

    let skillsScore = Math.round((roleMatchRatio * 60) + Math.min(detectedSkills.length * 4, 40));
    skillsScore = Math.min(Math.max(skillsScore, 35), 98);

    let projectsScore = 50;
    if (sections.projects) projectsScore += 25;
    if (hasMetrics) projectsScore += 15;
    if (githubMatch) projectsScore += 10;
    projectsScore = Math.min(Math.max(projectsScore, 40), 98);

    let experienceScore = 50;
    if (sections.experience) experienceScore += 30;
    if (actionVerbsMatches.length >= 3) experienceScore += 15;
    experienceScore = Math.min(Math.max(experienceScore, 40), 98);

    let educationScore = 60;
    if (sections.education) educationScore += 30;
    if (/cgpa|gpa|percentage|b\.?tech/i.test(text)) educationScore += 8;
    educationScore = Math.min(Math.max(educationScore, 50), 98);

    let formattingScore = 45;
    if (contactInfo.email && contactInfo.phone) formattingScore += 25;
    if (linkedinMatch || githubMatch) formattingScore += 10;
    const presentCount = Object.values(sections).filter(Boolean).length;
    formattingScore += Math.min(presentCount * 5, 20);
    formattingScore = Math.min(Math.max(formattingScore, 45), 98);

    const overallScore = Math.round(
      (skillsScore * 0.30) +
      (projectsScore * 0.25) +
      (experienceScore * 0.20) +
      (educationScore * 0.15) +
      (formattingScore * 0.10)
    );

    let atsScore = 40;
    if (sections.education && sections.skills && (sections.projects || sections.experience)) atsScore += 25;
    if (contactInfo.email && contactInfo.phone) atsScore += 15;
    atsScore += Math.round(roleMatchRatio * 20);
    if (actionVerbsMatches.length >= 3) atsScore += 10;
    atsScore = Math.min(Math.max(atsScore, 35), 98);

    const strengths = [];
    if (detectedSkills.length >= 4) {
      strengths.push(`Strong technical skill coverage with ${detectedSkills.length} identified technologies.`);
    }
    if (sections.projects) {
      strengths.push("Hands-on technical projects section present.");
    }
    if (sections.education) {
      strengths.push("Education credentials and degree background are clearly specified.");
    }
    if (contactInfo.email && contactInfo.phone) {
      strengths.push("Complete contact info provided (Email and Phone).");
    }
    if (strengths.length < 3) {
      strengths.push("Clean resume structure compatible with ATS crawlers.");
    }

    const weaknesses = [];
    if (!sections.experience) {
      weaknesses.push("Limited formal work or internship experience section.");
    }
    if (!hasMetrics) {
      weaknesses.push("Missing quantifiable metrics and outcome figures in project descriptions.");
    }
    if (missingRoleSkills.length > 0) {
      weaknesses.push(`Missing important target role keywords: ${missingRoleSkills.slice(0, 3).join(", ")}.`);
    }
    if (!contactInfo.github) {
      weaknesses.push("Missing direct links to GitHub repositories or code samples.");
    }

    const recommendations = [];
    if (!hasMetrics) {
      recommendations.push("Quantify project achievements (e.g. 'Improved efficiency by 25%').");
    }
    if (missingRoleSkills.length > 0) {
      recommendations.push(`Naturally add missing keywords (${missingRoleSkills.slice(0, 3).join(", ")}) into project bullets.`);
    }
    if (!sections.certifications) {
      recommendations.push(`Earn role-relevant certifications in ${missingRoleSkills[0] || targetRole.name}.`);
    }

    let feedback = "";
    if (roleMatchRatio >= 0.75) {
      feedback = `Your resume strongly aligns with the <strong>${targetRole.name}</strong> role! You have verified coverage in ${matchedRoleSkills.slice(0, 4).join(", ")}.`;
    } else {
      feedback = `Your resume contains core foundations like <strong>${matchedRoleSkills.join(", ") || "core technologies"}</strong>, but the <strong>${targetRole.name}</strong> role also requires evidence of <strong>${missingRoleSkills.slice(0, 3).join(", ")}</strong>.`;
    }

    return {
      targetRole,
      contactInfo,
      sections,
      detectedSkills,
      matchedRoleSkills,
      missingRoleSkills,
      scores: {
        overall: overallScore,
        ats: atsScore,
        skills: skillsScore,
        projects: projectsScore,
        experience: experienceScore,
        education: educationScore,
        formatting: formattingScore
      },
      strengths,
      weaknesses,
      recommendations,
      feedback
    };
  }

  // ==========================================
  // RESUME ANALYZER UI EVENT HANDLERS
  // ==========================================

  const resumeFileInput = document.getElementById("resume-file-input");
  const resumeFileNameDisplay = document.getElementById("resume-file-name");
  const resumeRoleSelect = document.getElementById("resume-target-role");
  const runResumeBtn = document.getElementById("run-resume-analysis");
  const resumeResultContainer = document.getElementById("resume-result");
  const togglePasteResume = document.getElementById("toggle-paste-resume");
  const pasteResumeContainer = document.getElementById("paste-resume-container");
  const resumeTextInput = document.getElementById("resume-text-input");

  let selectedResumeFile = null;

  if (togglePasteResume && pasteResumeContainer) {
    togglePasteResume.addEventListener("click", (e) => {
      e.preventDefault();
      const isHidden = pasteResumeContainer.style.display === "none";
      pasteResumeContainer.style.display = isHidden ? "block" : "none";
      togglePasteResume.textContent = isHidden ? "📁 Or upload file instead" : "📝 Or paste resume text directly";
    });
  }

  if (resumeFileInput && resumeFileNameDisplay) {
    resumeFileInput.addEventListener("change", (e) => {
      const file = e.target.files && e.target.files[0];
      if (file) {
        selectedResumeFile = file;
        const sizeKb = Math.round(file.size / 1024);
        resumeFileNameDisplay.style.display = "block";
        resumeFileNameDisplay.innerHTML = `Resume: <strong>"${file.name}"</strong> (${sizeKb} KB)`;
      } else {
        selectedResumeFile = null;
        resumeFileNameDisplay.style.display = "none";
      }
    });
  }

  async function handleResumeAnalysis() {
    if (!resumeResultContainer) return;

    const pastedText = (resumeTextInput?.value || "").trim();
    if (!selectedResumeFile && pastedText.length < 20) {
      resumeResultContainer.style.display = "block";
      resumeResultContainer.innerHTML = `
        <div style="padding: 12px 14px; background: rgba(217, 83, 79, 0.1); border-left: 3px solid #d9534f; border-radius: 8px; color: #b52b27; font-weight: 600;">
          Please upload your resume first.
        </div>
      `;
      return;
    }

    const selectedRoleId = (resumeRoleSelect && resumeRoleSelect.value) ? resumeRoleSelect.value : "aiml";
    const roleName = ROLE_DATA[selectedRoleId] ? ROLE_DATA[selectedRoleId].name : "AI/ML Engineer";

    resumeResultContainer.style.display = "block";
    resumeResultContainer.innerHTML = `
      <div style="text-align: center; padding: 30px 20px;">
        <div class="pulse-dot" style="margin: 0 auto 14px auto; width: 14px; height: 14px;"></div>
        <strong style="font-size: 16px; color: #159a9c; display: block; margin-bottom: 6px;">
          Analyzing your resume...
        </strong>
        <p style="font-size: 13px; color: #687783; margin: 0;">
          Extracting text, evaluating ATS compatibility, and identifying skill gaps for ${roleName}...
        </p>
      </div>
    `;

    setTimeout(async () => {
      try {
        let text = pastedText;
        if (selectedResumeFile) {
          text = await extractTextFromResume(selectedResumeFile);
        }

        if (!text || text.trim().length < 25) {
          resumeResultContainer.innerHTML = `
            <div style="padding: 12px 14px; background: rgba(217, 83, 79, 0.1); border-left: 3px solid #d9534f; border-radius: 8px; color: #b52b27; font-weight: 600;">
              We couldn't extract enough text from this resume. Please ensure the file contains searchable text or upload a standard PDF/DOCX file.
            </div>
          `;
          return;
        }

        const analysis = parseResumeContent(text, selectedRoleId);

        // PERSIST IN USER PROFILE
        const user = getCurrentUser() || DEFAULT_DEMO_USER;
        user.resumeData = {
          fileName: selectedResumeFile ? selectedResumeFile.name : "Pasted Resume",
          resumeScore: analysis.scores.overall,
          atsScore: analysis.scores.ats,
          categoryScores: analysis.scores,
          detectedSkills: analysis.detectedSkills,
          strengths: analysis.strengths,
          weaknesses: analysis.weaknesses,
          recommendations: analysis.recommendations,
          feedback: analysis.feedback
        };
        user.skills = Array.from(new Set([...(user.skills || []), ...analysis.detectedSkills]));
        user.preferredRole = selectedRoleId;
        saveCurrentUser(user);
        addRecentActivity(`Analyzed resume "${user.resumeData.fileName}" (ATS: ${analysis.scores.ats}%)`);

        renderResumeResults(analysis);
      } catch (error) {
        console.error("Resume analysis error:", error);
        resumeResultContainer.innerHTML = `
          <div style="padding: 12px 14px; background: rgba(217, 83, 79, 0.1); border-left: 3px solid #d9534f; border-radius: 8px; color: #b52b27; font-weight: 600;">
            Unable to read this resume. Please upload a valid PDF, DOC, or DOCX file.
          </div>
        `;
      }
    }, 400);
  }

  function renderResumeResults(data) {
    const { targetRole, detectedSkills, matchedRoleSkills, missingRoleSkills, scores, strengths, weaknesses, recommendations, feedback } = data;

    const detectedSkillsHtml = detectedSkills.length > 0
      ? detectedSkills.map(s => `
          <span style="display:inline-block; padding: 4px 10px; margin: 3px; font-size: 12px; font-weight: 600; border-radius: 12px; background: rgba(21, 154, 156, 0.10); color: #159a9c; border: 1px solid rgba(21, 154, 156, 0.25);">
            ${s}
          </span>
        `).join("")
      : `<span style="color: #687783; font-style: italic;">No standard technical keywords detected</span>`;

    const matchedSkillsHtml = matchedRoleSkills.length > 0
      ? matchedRoleSkills.map(s => `
          <span style="display:inline-block; padding: 4px 10px; margin: 3px; font-size: 12px; font-weight: 600; border-radius: 12px; background: rgba(21, 154, 156, 0.12); color: #0f7a7c; border: 1px solid rgba(21, 154, 156, 0.35);">
            ✓ ${s}
          </span>
        `).join("")
      : `<span style="color: #687783; font-style: italic;">None</span>`;

    const missingSkillsHtml = missingRoleSkills.length > 0
      ? missingRoleSkills.map(s => `
          <span style="display:inline-block; padding: 4px 10px; margin: 3px; font-size: 12px; font-weight: 600; border-radius: 12px; background: rgba(217, 83, 79, 0.08); color: #b52b27; border: 1px solid rgba(217, 83, 79, 0.25);">
            + ${s}
          </span>
        `).join("")
      : `<span style="color: #159a9c; font-weight: 600;">✓ All key skills covered!</span>`;

    resumeResultContainer.innerHTML = `
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 14px; margin-bottom: 20px;">
        <div style="padding: 16px; background: rgba(255, 255, 255, 0.85); border: 1px solid rgba(21, 154, 156, 0.25); border-radius: 14px; text-align: center;">
          <div style="font-size: 11px; font-weight: 700; color: #52616f; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 4px;">
            RESUME SCORE
          </div>
          <div style="font-size: 34px; font-weight: 800; color: #159a9c;">
            ${scores.overall}<small style="font-size: 16px; color: #71808b; font-weight: 600;">/100</small>
          </div>
        </div>

        <div style="padding: 16px; background: rgba(255, 255, 255, 0.85); border: 1px solid rgba(21, 154, 156, 0.25); border-radius: 14px; text-align: center;">
          <div style="font-size: 11px; font-weight: 700; color: #52616f; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 4px;">
            ATS SCORE
          </div>
          <div style="font-size: 34px; font-weight: 800; color: #159a9c;">
            ${scores.ats}<small style="font-size: 16px; color: #71808b; font-weight: 600;">%</small>
          </div>
        </div>
      </div>

      <div style="margin-bottom: 22px; padding: 16px; background: rgba(255, 255, 255, 0.7); border: 1px solid rgba(38, 55, 70, 0.08); border-radius: 14px;">
        <div style="font-size: 12px; font-weight: 700; color: #263746; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 12px;">
          Score Breakdown
        </div>
        <div style="margin-bottom: 8px;">
          <div style="display:flex; justify-content:space-between; font-size:12px; font-weight:600; color:#52616f; margin-bottom:3px;">
            <span>Skills Coverage</span><span>${scores.skills}%</span>
          </div>
          <div class="popup-progress-bar"><div class="popup-progress-fill" style="width:${scores.skills}%;"></div></div>
        </div>
        <div style="margin-bottom: 8px;">
          <div style="display:flex; justify-content:space-between; font-size:12px; font-weight:600; color:#52616f; margin-bottom:3px;">
            <span>Projects Quality</span><span>${scores.projects}%</span>
          </div>
          <div class="popup-progress-bar"><div class="popup-progress-fill" style="width:${scores.projects}%;"></div></div>
        </div>
        <div style="margin-bottom: 8px;">
          <div style="display:flex; justify-content:space-between; font-size:12px; font-weight:600; color:#52616f; margin-bottom:3px;">
            <span>Experience & Impact</span><span>${scores.experience}%</span>
          </div>
          <div class="popup-progress-bar"><div class="popup-progress-fill" style="width:${scores.experience}%;"></div></div>
        </div>
        <div style="margin-bottom: 8px;">
          <div style="display:flex; justify-content:space-between; font-size:12px; font-weight:600; color:#52616f; margin-bottom:3px;">
            <span>Education</span><span>${scores.education}%</span>
          </div>
          <div class="popup-progress-bar"><div class="popup-progress-fill" style="width:${scores.education}%;"></div></div>
        </div>
        <div>
          <div style="display:flex; justify-content:space-between; font-size:12px; font-weight:600; color:#52616f; margin-bottom:3px;">
            <span>Formatting & Completeness</span><span>${scores.formatting}%</span>
          </div>
          <div class="popup-progress-bar"><div class="popup-progress-fill" style="width:${scores.formatting}%;"></div></div>
        </div>
      </div>

      <div style="margin-bottom: 20px;">
        <div style="font-size: 13px; font-weight: 700; color: #263746; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 8px;">
          ROLE-SPECIFIC SKILL GAPS (${targetRole.name})
        </div>
        <div style="margin-bottom: 10px;">
          <strong style="color: #263746; font-size: 13px; display:block; margin-bottom:4px;">Matched Skills:</strong>
          <div>${matchedSkillsHtml}</div>
        </div>
        <div>
          <strong style="color: #263746; font-size: 13px; display:block; margin-bottom:4px;">Missing / Recommended Keywords:</strong>
          <div>${missingSkillsHtml}</div>
        </div>
      </div>

      <div style="margin-bottom: 20px;">
        <div style="font-size: 13px; font-weight: 700; color: #263746; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 8px;">
          ALL DETECTED SKILLS (${detectedSkills.length})
        </div>
        <div>${detectedSkillsHtml}</div>
      </div>

      <div style="margin-bottom: 18px;">
        <div style="font-size: 13px; font-weight: 700; color: #263746; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 6px;">
          STRENGTHS
        </div>
        <ul style="margin: 0 0 0 20px; color: #263746; line-height: 1.6; font-size: 14px;">
          ${strengths.map(s => `<li>${s}</li>`).join("")}
        </ul>
      </div>

      <div style="margin-bottom: 18px;">
        <div style="font-size: 13px; font-weight: 700; color: #263746; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 6px;">
          WEAKNESSES
        </div>
        <ul style="margin: 0 0 0 20px; color: #263746; line-height: 1.6; font-size: 14px;">
          ${weaknesses.map(w => `<li>${w}</li>`).join("")}
        </ul>
      </div>

      <div style="margin-bottom: 18px;">
        <div style="font-size: 13px; font-weight: 700; color: #263746; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 6px;">
          RECOMMENDED IMPROVEMENTS
        </div>
        <ol style="margin: 0 0 0 20px; color: #263746; line-height: 1.6; font-size: 14px;">
          ${recommendations.map(r => `<li>${r}</li>`).join("")}
        </ol>
      </div>

      <div style="margin-top: 15px; padding: 14px 16px; background: rgba(21, 154, 156, 0.08); border-left: 3px solid #159a9c; border-radius: 8px; color: #263746; line-height: 1.6; font-size: 14px;">
        💡 <strong>Resume Feedback:</strong> ${feedback}
      </div>

      <div style="display:flex; flex-direction:column; gap:10px; margin-top:16px;">
        <button class="btn btn-primary full" id="transfer-to-skill-gap" type="button">
          Transfer to Skill Gap Analysis →
        </button>
        <button class="btn btn-secondary full" id="resume-to-roadmap" type="button">
          Generate Career Roadmap for this Role →
        </button>
      </div>
    `;

    // Connect to Skill Gap Button
    const transferBtn = document.getElementById("transfer-to-skill-gap");
    if (transferBtn) {
      transferBtn.addEventListener("click", () => {
        const skillRoleSelect = document.getElementById("skill-target-role");
        const skillTextarea = document.getElementById("skill-current-skills");

        if (skillRoleSelect && resumeRoleSelect) {
          skillRoleSelect.value = resumeRoleSelect.value;
        }

        if (skillTextarea && detectedSkills.length > 0) {
          skillTextarea.value = detectedSkills.join(", ");
        }

        closeAllPopups();
        openPopup("skills");
        runSkillGapAnalysis();
      });
    }

    // Connect to Roadmap Button
    const roadmapBtn = document.getElementById("resume-to-roadmap");
    if (roadmapBtn) {
      roadmapBtn.addEventListener("click", () => {
        closeAllPopups();
        openPopup("roadmap");
        generateRoadmapForUser(targetRole.name, missingRoleSkills);
      });
    }
  }

  if (runResumeBtn) {
    runResumeBtn.addEventListener("click", handleResumeAnalysis);
  }

  // ==========================================
  // SKILL GAP ANALYSIS
  // ==========================================

  function runSkillGapAnalysis() {
    const roleSelect = document.getElementById("skill-target-role");
    const skillsTextarea = document.getElementById("skill-current-skills");
    const resultContainer = document.getElementById("skill-gap-result");

    if (!roleSelect || !skillsTextarea || !resultContainer) return;

    let selectedRoleId = roleSelect.value.trim();
    if (!selectedRoleId) {
      const user = getCurrentUser();
      selectedRoleId = user?.preferredRole || "aiml";
      roleSelect.value = selectedRoleId;
    }

    let rawSkillsInput = skillsTextarea.value.trim();
    if (!rawSkillsInput) {
      const user = getCurrentUser();
      if (user && user.skills && user.skills.length > 0) {
        rawSkillsInput = user.skills.join(", ");
        skillsTextarea.value = rawSkillsInput;
      }
    }

    if (!selectedRoleId || !ROLE_DATA[selectedRoleId]) {
      resultContainer.style.display = "block";
      resultContainer.innerHTML = `
        <div style="padding: 12px; background: rgba(217, 83, 79, 0.1); border-left: 3px solid #d9534f; border-radius: 8px; color: #b52b27; font-weight: 600;">
          Please select a target role.
        </div>
      `;
      return;
    }

    if (!rawSkillsInput) {
      resultContainer.style.display = "block";
      resultContainer.innerHTML = `
        <div style="padding: 12px; background: rgba(217, 83, 79, 0.1); border-left: 3px solid #d9534f; border-radius: 8px; color: #b52b27; font-weight: 600;">
          Please enter at least one current skill.
        </div>
      `;
      return;
    }

    const userSkillList = rawSkillsInput
      .split(/[,;\n]+/)
      .map(s => s.trim())
      .filter(Boolean);

    const role = ROLE_DATA[selectedRoleId];
    const requiredSkills = role.skills;

    const matched = requiredSkills.filter(req =>
      userSkillList.some(userSkill => skillMatches(userSkill, req))
    );

    const missing = requiredSkills.filter(req =>
      !userSkillList.some(userSkill => skillMatches(userSkill, req))
    );

    const percentage = Math.round((matched.length / requiredSkills.length) * 100);

    let recommendation = "";
    if (missing.length === 0) {
      recommendation = `Outstanding! You have mastered all key skills for the ${role.name} role. You are well-prepared for technical interviews and applications!`;
    } else {
      let missingListText = "";
      if (missing.length === 1) {
        missingListText = missing[0];
        recommendation = `Your biggest skill gap is ${missingListText}. Focus on this skill first.`;
      } else if (missing.length === 2) {
        missingListText = `${missing[0]} and ${missing[1]}`;
        recommendation = `Your biggest skill gaps are ${missingListText}. Focus on these skills first.`;
      } else {
        const allExceptLast = missing.slice(0, -1).join(", ");
        const last = missing[missing.length - 1];
        missingListText = `${allExceptLast} and ${last}`;
        recommendation = `Your biggest skill gaps are ${missingListText}. Focus on these skills first.`;
      }
    }

    // PERSIST IN USER PROFILE
    const user = getCurrentUser() || DEFAULT_DEMO_USER;
    user.preferredRole = selectedRoleId;
    user.skills = Array.from(new Set([...(user.skills || []), ...userSkillList]));
    user.skillGaps = {
      targetRole: selectedRoleId,
      matched,
      missing,
      percentage,
      recommendation
    };
    saveCurrentUser(user);
    addRecentActivity(`Identified skill gaps for ${role.name} (${percentage}% match)`);

    resultContainer.style.display = "block";
    resultContainer.innerHTML = `
      <div style="font-size: 13px; font-weight: 700; color: #52616f; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 4px;">
        Skill Match:
      </div>
      <div style="font-size: 38px; font-weight: 800; color: #159a9c; margin-bottom: 16px;">
        ${percentage}%
      </div>

      <div style="margin-bottom: 14px;">
        <strong style="color: #263746; font-size: 15px;">Matched Skills:</strong>
        ${
          matched.length > 0
            ? `<ul style="margin: 6px 0 0 20px; color: #263746; line-height: 1.7;">
                ${matched.map(s => `<li>${s}</li>`).join("")}
              </ul>`
            : `<p style="margin: 4px 0 0 0; color: #687783; font-style: italic;">None</p>`
        }
      </div>

      <div style="margin-bottom: 16px;">
        <strong style="color: #263746; font-size: 15px;">Missing Skills:</strong>
        ${
          missing.length > 0
            ? `<ul style="margin: 6px 0 0 20px; color: #263746; line-height: 1.7;">
                ${missing.map(s => `<li>${s}</li>`).join("")}
              </ul>`
            : `<p style="margin: 4px 0 0 0; color: #687783; font-style: italic;">None</p>`
        }
      </div>

      <p style="margin: 0 0 16px 0; padding: 12px 14px; background: rgba(21, 154, 156, 0.08); border-left: 3px solid #159a9c; border-radius: 6px; color: #263746; line-height: 1.5;">
        💡 ${recommendation}
      </p>

      <div style="display:flex; flex-direction:column; gap:10px;">
        <button class="btn btn-primary full" id="btn-skill-to-roadmap" type="button">
          Generate Career Roadmap from Gaps →
        </button>
        <button class="btn btn-secondary full" id="btn-skill-to-interview" type="button">
          Practice AI Mock Interview for this Role →
        </button>
      </div>
    `;

    const btnSkillToRoadmap = document.getElementById("btn-skill-to-roadmap");
    if (btnSkillToRoadmap) {
      btnSkillToRoadmap.addEventListener("click", () => {
        closeAllPopups();
        openPopup("roadmap");
        generateRoadmapForUser(role.name, missing);
      });
    }

    const btnSkillToInterview = document.getElementById("btn-skill-to-interview");
    if (btnSkillToInterview) {
      btnSkillToInterview.addEventListener("click", () => {
        closeAllPopups();
        openPopup("interview");
        const intRoleSelect = document.getElementById("interview-role");
        if (intRoleSelect) intRoleSelect.value = selectedRoleId;
      });
    }
  }

  const analyzeSkillBtn = document.getElementById("run-skill-gap");
  if (analyzeSkillBtn) {
    analyzeSkillBtn.addEventListener("click", runSkillGapAnalysis);
  }

  // ==========================================
  // CAREER ROADMAP GENERATOR & INTERACTION
  // ==========================================

  const ROADMAP_TEMPLATES = {
    aiml: [
      {
        month: "MONTH 1",
        title: "Mathematics & Python Foundations",
        topics: [
          { name: "Linear Algebra & Calculus for ML", done: true },
          { name: "Python for Data Science (NumPy & Pandas)", done: true },
          { name: "Statistics & Probability Basics", done: false }
        ],
        time: "3 Weeks",
        priority: "Core"
      },
      {
        month: "MONTH 2",
        title: "Machine Learning & Scikit-Learn",
        topics: [
          { name: "Supervised & Unsupervised Learning", done: true },
          { name: "Scikit-learn Model Training & Hyperparameter Tuning", done: false },
          { name: "Exploratory Data Analysis & Feature Engineering", done: false }
        ],
        time: "4 Weeks",
        priority: "High"
      },
      {
        month: "MONTH 3",
        title: "Deep Learning & Model Deployment",
        topics: [
          { name: "Neural Networks & PyTorch / TensorFlow Basics", done: false },
          { name: "REST APIs & Model Serving with FastAPI", done: false },
          { name: "SQL & Database Integration", done: true }
        ],
        time: "4 Weeks",
        priority: "Medium"
      },
      {
        month: "MONTH 4",
        title: "End-to-End AI Project & Interview Preparation",
        topics: [
          { name: "Full Stack AI Capstone Project", done: false },
          { name: "Git / GitHub Workflow & Model Packaging with Docker", done: false },
          { name: "AI/ML Mock Interview & Resume Refinement", done: false }
        ],
        time: "3 Weeks",
        priority: "Core"
      }
    ],
    frontend: [
      {
        month: "MONTH 1",
        title: "HTML, CSS & JavaScript Mastery",
        topics: [
          { name: "Semantic HTML5 & Modern CSS3 Grid/Flexbox", done: true },
          { name: "JavaScript ES6+ & DOM Manipulation", done: true },
          { name: "Responsive Web Design & Mobile Queries", done: true }
        ],
        time: "3 Weeks",
        priority: "Core"
      },
      {
        month: "MONTH 2",
        title: "React.js & State Management",
        topics: [
          { name: "React Components, Hooks (useState, useEffect)", done: true },
          { name: "State Management with Redux Toolkit", done: false },
          { name: "Tailwind CSS & Component Libraries", done: false }
        ],
        time: "4 Weeks",
        priority: "High"
      },
      {
        month: "MONTH 3",
        title: "APIs, Routing & Performance",
        topics: [
          { name: "REST APIs & Async Fetch / Axios Integration", done: false },
          { name: "React Router & Single Page Applications", done: false },
          { name: "Web Performance & Lighthouse Auditing", done: false }
        ],
        time: "4 Weeks",
        priority: "High"
      },
      {
        month: "MONTH 4",
        title: "Capstone Application & Interview Readiness",
        topics: [
          { name: "Production E-Commerce or SaaS Dashboard Project", done: false },
          { name: "Git Version Control & CI/CD Deployment", done: false },
          { name: "Frontend Technical & Behavioral Mock Interviews", done: false }
        ],
        time: "3 Weeks",
        priority: "Core"
      }
    ],
    software: [
      {
        month: "MONTH 1",
        title: "Data Structures & Core Programming",
        topics: [
          { name: "C++ / Java / Python OOP Fundamentals", done: true },
          { name: "Arrays, Strings, Linked Lists, Stacks, Queues", done: true },
          { name: "Time & Space Complexity Analysis", done: true }
        ],
        time: "4 Weeks",
        priority: "Core"
      },
      {
        month: "MONTH 2",
        title: "Advanced Algorithms & Problem Solving",
        topics: [
          { name: "Trees, Graphs & Graph Traversals (BFS, DFS)", done: false },
          { name: "Dynamic Programming & Greedy Algorithms", done: false },
          { name: "Sorting & Searching Optimizations", done: false }
        ],
        time: "4 Weeks",
        priority: "High"
      },
      {
        month: "MONTH 3",
        title: "Database Management & System Architecture",
        topics: [
          { name: "SQL Queries, Indexing & Normalization", done: false },
          { name: "Object-Oriented Design & Design Patterns", done: false },
          { name: "REST APIs & Microservice Basics", done: false }
        ],
        time: "4 Weeks",
        priority: "High"
      },
      {
        month: "MONTH 4",
        title: "Full Capstone Project & Mock Interviews",
        topics: [
          { name: "Full Stack or Systems Engineering Project", done: false },
          { name: "Git Workflows & Unit Testing", done: false },
          { name: "Technical Coding Interviews & System Design", done: false }
        ],
        time: "3 Weeks",
        priority: "Core"
      }
    ]
  };

  function generateRoadmapForUser(roleTitle, missingSkills) {
    const user = getCurrentUser() || DEFAULT_DEMO_USER;
    const roleKey = user.preferredRole || "aiml";
    const baseMilestones = ROADMAP_TEMPLATES[roleKey] || ROADMAP_TEMPLATES.aiml;

    // Clone templates
    const milestones = JSON.parse(JSON.stringify(baseMilestones));

    // Inject any missing skills into month 2 / 3
    if (missingSkills && missingSkills.length > 0) {
      missingSkills.forEach((skill, idx) => {
        const targetMonth = idx % 2 === 0 ? 1 : 2;
        if (milestones[targetMonth]) {
          milestones[targetMonth].topics.push({
            name: `Focus Mastery: ${skill}`,
            done: false
          });
        }
      });
    }

    user.roadmap = milestones;
    saveCurrentUser(user);
    renderRoadmapUI();
  }

  function renderRoadmapUI() {
    const user = getCurrentUser() || DEFAULT_DEMO_USER;
    const roleInfo = ROLE_DATA[user.preferredRole] || ROLE_DATA.aiml;

    if (!user.roadmap) {
      const missing = user.skillGaps?.missing || [];
      generateRoadmapForUser(roleInfo.name, missing);
      return;
    }

    const titleEl = document.getElementById("roadmap-role-title");
    const textEl = document.getElementById("roadmap-progress-text");
    const fillEl = document.getElementById("roadmap-progress-fill");
    const container = document.getElementById("roadmap-milestones-container");

    if (titleEl) titleEl.textContent = `${roleInfo.name} Roadmap`;

    let totalTasks = 0;
    let completedTasks = 0;

    user.roadmap.forEach(m => {
      m.topics.forEach(t => {
        totalTasks++;
        if (t.done) completedTasks++;
      });
    });

    const progressPct = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
    user.roadmapProgress = progressPct;
    saveCurrentUser(user);

    if (textEl) textEl.textContent = `${progressPct}% completed`;
    if (fillEl) fillEl.style.width = `${progressPct}%`;

    if (container) {
      container.innerHTML = user.roadmap.map((m, mIdx) => {
        const mDoneCount = m.topics.filter(t => t.done).length;
        const mTotalCount = m.topics.length;
        const isMonthComplete = mDoneCount === mTotalCount && mTotalCount > 0;

        return `
          <div style="background:#f8fafb; border:1px solid rgba(38,55,70,0.1); border-radius:14px; padding:16px; margin-bottom:14px;">
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px; flex-wrap:wrap; gap:6px;">
              <div>
                <span style="font-size:10px; font-weight:800; color:#159a9c; letter-spacing:1px;">${m.month}</span>
                <h4 style="margin:2px 0 0 0; color:#263746; font-size:15px;">${m.title}</h4>
              </div>
              <div style="display:flex; align-items:center; gap:8px;">
                <span style="font-size:11px; padding:3px 8px; border-radius:12px; background:rgba(21,154,156,0.1); color:#159a9c; font-weight:600;">
                  ${m.time}
                </span>
                <span style="font-size:11px; padding:3px 8px; border-radius:12px; font-weight:700; ${isMonthComplete ? 'background:#e6f7f2; color:#0e8a70;' : 'background:#eef2f5; color:#52616f;'}">
                  ${isMonthComplete ? '✓ Completed' : `${mDoneCount}/${mTotalCount} Done`}
                </span>
              </div>
            </div>

            <div style="display:flex; flex-direction:column; gap:6px; margin-top:10px;">
              ${m.topics.map((t, tIdx) => `
                <label style="display:flex; align-items:center; gap:10px; font-size:13px; color:#263746; cursor:pointer; padding:4px 0;">
                  <input
                    type="checkbox"
                    data-midx="${mIdx}"
                    data-tidx="${tIdx}"
                    ${t.done ? 'checked' : ''}
                    style="accent-color:#159a9c; width:16px; height:16px; cursor:pointer;"
                  >
                  <span style="${t.done ? 'text-decoration:line-through; color:#71808b;' : 'font-weight:500;'}">
                    ${t.name}
                  </span>
                </label>
              `).join("")}
            </div>
          </div>
        `;
      }).join("");

      // Bind dynamic checkbox clicks
      container.querySelectorAll("input[type='checkbox']").forEach(cb => {
        cb.addEventListener("change", (e) => {
          const mIdx = parseInt(e.target.getAttribute("data-midx"), 10);
          const tIdx = parseInt(e.target.getAttribute("data-tidx"), 10);
          user.roadmap[mIdx].topics[tIdx].done = e.target.checked;
          saveCurrentUser(user);
          addRecentActivity(`Updated Roadmap task: "${user.roadmap[mIdx].topics[tIdx].name}"`);
          renderRoadmapUI();
          renderDashboard();
        });
      });
    }

    // Connect Roadmap to Interview
    const btnRoadmapToInterview = document.getElementById("btn-roadmap-to-interview");
    if (btnRoadmapToInterview) {
      btnRoadmapToInterview.onclick = () => {
        closeAllPopups();
        openPopup("interview");
      };
    }

    // Connect Roadmap to Skill Gap
    const btnRoadmapToSkills = document.getElementById("btn-roadmap-to-skills");
    if (btnRoadmapToSkills) {
      btnRoadmapToSkills.onclick = () => {
        closeAllPopups();
        openPopup("skills");
      };
    }
  }

  // ==========================================
  // AI MOCK INTERVIEW SIMULATOR
  // ==========================================

  const INTERVIEW_QUESTIONS = {
    aiml: [
      {
        category: "Technical",
        question: "Explain the difference between Supervised, Unsupervised, and Reinforcement Learning with practical real-world examples.",
        keywords: ["labeled", "unlabeled", "reward", "penalty", "classification", "clustering", "regression"],
        sampleConcept: "Supervised learning uses labeled dataset pairs (input-output). Unsupervised discovers hidden patterns in unlabeled data (clustering/PCA). Reinforcement learning trains agents via rewards and penalties in an environment."
      },
      {
        category: "Technical",
        question: "How do you detect and prevent Overfitting in machine learning models?",
        keywords: ["cross-validation", "regularization", "l1", "l2", "dropout", "early stopping", "data augmentation"],
        sampleConcept: "Overfitting happens when a model memorizes noise in training data. Key mitigations include k-fold cross-validation, L1/L2 regularization, pruning, dropout, and gathering more training data."
      },
      {
        category: "Technical",
        question: "Describe what Confusion Matrix metrics are (Precision, Recall, F1-Score) and when Precision is more critical than Recall.",
        keywords: ["precision", "recall", "f1", "false positive", "false negative", "accuracy", "tradeoff"],
        sampleConcept: "Precision = TP/(TP+FP), Recall = TP/(TP+FN). Precision is critical in spam filtering (where false positive means important email lost), while Recall is critical in medical diagnosis (where false negatives miss diseases)."
      },
      {
        category: "Behavioral",
        question: "Describe a challenging technical project you worked on. How did you resolve the primary bottleneck or bug?",
        keywords: ["project", "challenge", "debugging", "solution", "learned", "result", "improved"],
        sampleConcept: "Effective STAR response: State the context, task difficulty, root cause analysis and technical resolution, followed by measurable impact."
      }
    ],
    software: [
      {
        category: "Technical",
        question: "Explain how a Hash Table works internally and how collision resolutions like Chaining and Open Addressing function.",
        keywords: ["hash function", "collision", "chaining", "linked list", "open addressing", "o(1)", "bucket"],
        sampleConcept: "Hash tables map keys to index buckets using a hash function. Chaining stores collided entries in a linked list/BST, while Open Addressing probes subsequent open slots (linear/quadratic probing)."
      },
      {
        category: "Technical",
        question: "What are the four pillars of Object-Oriented Programming (OOP) and how do they improve software architecture?",
        keywords: ["encapsulation", "inheritance", "polymorphism", "abstraction", "reusability", "maintainability"],
        sampleConcept: "Encapsulation bundles data/methods. Abstraction hides complexity. Inheritance promotes code reuse. Polymorphism allows flexible runtime behavior (overriding/overloading)."
      },
      {
        category: "Technical",
        question: "What is the difference between SQL (Relational) and NoSQL (Document/Key-Value) databases, and when would you choose each?",
        keywords: ["acid", "schema", "relational", "mongodb", "postgresql", "scalability", "flexible"],
        sampleConcept: "SQL offers structured schemas, strict ACID compliance, and relational joins. NoSQL offers horizontal scalability, flexible schema-less documents, and fast reads for unstructured data."
      },
      {
        category: "Behavioral",
        question: "Tell me about a time you had to adapt quickly to a new technology or solve a critical bug under a tight deadline.",
        keywords: ["deadline", "learned", "prioritized", "debugged", "collaborated", "result"],
        sampleConcept: "STAR format answer detailing rapid learning, systematic debugging, collaboration with team, and on-time delivery."
      }
    ],
    frontend: [
      {
        category: "Technical",
        question: "Explain the Virtual DOM in React. How does reconciliation and diffing work to optimize web performance?",
        keywords: ["virtual dom", "reconciliation", "diffing", "render", "batching", "real dom", "performance"],
        sampleConcept: "React keeps a lightweight Virtual DOM representation in memory. When state changes, it diffs against the previous tree and batches minimal updates to the real browser DOM."
      },
      {
        category: "Technical",
        question: "What is the CSS Box Model and how does 'box-sizing: border-box' change layout calculations?",
        keywords: ["content", "padding", "border", "margin", "border-box", "width", "height"],
        sampleConcept: "The box model consists of Content, Padding, Border, and Margin. Setting border-box ensures specified width includes content, padding, and border, avoiding accidental overflow."
      },
      {
        category: "Technical",
        question: "What is Event Loop in JavaScript? Explain the difference between Microtasks (Promises) and Macrotasks (setTimeout).",
        keywords: ["event loop", "call stack", "microtask", "macrotask", "promise", "settimeout", "async"],
        sampleConcept: "The Event Loop monitors the call stack and task queues. Microtasks (Promise callbacks, process.nextTick) execute immediately after the current script and before the next macrotask (setTimeout, setInterval)."
      },
      {
        category: "Behavioral",
        question: "How do you ensure web applications are responsive across all devices and accessible to all users?",
        keywords: ["media queries", "responsive", "accessibility", "a11y", "semantic html", "mobile first", "testing"],
        sampleConcept: "Use mobile-first responsive design, flexible rem/percentages, semantic HTML tags, ARIA labels, and test across device viewports."
      }
    ]
  };

  let activeInterview = {
    role: "aiml",
    difficulty: "Intermediate",
    type: "technical",
    currentQuestionIndex: 0,
    questions: [],
    answers: [],
    scores: []
  };

  function startMockInterviewSession() {
    const roleSelect = document.getElementById("interview-role");
    const diffSelect = document.getElementById("interview-difficulty");
    const selectedType = document.querySelector("#interview-type-options .popup-option.selected")?.getAttribute("data-type") || "technical";

    const role = roleSelect?.value || "aiml";
    const difficulty = diffSelect?.value || "Intermediate";

    const questionList = INTERVIEW_QUESTIONS[role] || INTERVIEW_QUESTIONS.aiml;

    activeInterview = {
      role,
      difficulty,
      type: selectedType,
      currentQuestionIndex: 0,
      questions: questionList,
      answers: [],
      scores: []
    };

    document.getElementById("interview-setup-view").style.display = "none";
    document.getElementById("interview-active-view").style.display = "block";
    document.getElementById("interview-scorecard-view").style.display = "none";

    showInterviewQuestion();
  }

  function showInterviewQuestion() {
    const { currentQuestionIndex, questions } = activeInterview;
    const q = questions[currentQuestionIndex];

    const progBadge = document.getElementById("interview-q-progress-badge");
    const catBadge = document.getElementById("interview-q-category-badge");
    const bar = document.getElementById("interview-q-bar");
    const qText = document.getElementById("interview-question-text");
    const ansInput = document.getElementById("interview-answer-input");
    const evalCard = document.getElementById("interview-evaluation-card");
    const btnSubmit = document.getElementById("btn-submit-answer");

    if (progBadge) progBadge.textContent = `Question ${currentQuestionIndex + 1} of ${questions.length}`;
    if (catBadge) catBadge.textContent = q.category;
    if (bar) bar.style.width = `${Math.round(((currentQuestionIndex + 1) / questions.length) * 100)}%`;
    if (qText) qText.textContent = q.question;
    if (ansInput) {
      ansInput.value = "";
      ansInput.disabled = false;
    }
    if (evalCard) evalCard.style.display = "none";
    if (btnSubmit) {
      btnSubmit.style.display = "block";
      btnSubmit.disabled = false;
      btnSubmit.textContent = "Submit Answer for AI Evaluation →";
    }
  }

  function submitInterviewAnswer() {
    const ansInput = document.getElementById("interview-answer-input");
    const answer = (ansInput?.value || "").trim();
    const evalCard = document.getElementById("interview-evaluation-card");
    const scoreText = document.getElementById("interview-q-score");
    const feedbackText = document.getElementById("interview-q-feedback-text");
    const btnSubmit = document.getElementById("btn-submit-answer");

    if (!answer || answer.length < 10) {
      alert("Please enter a substantive answer (at least a sentence) to evaluate.");
      return;
    }

    if (ansInput) ansInput.disabled = true;
    if (btnSubmit) {
      btnSubmit.disabled = true;
      btnSubmit.textContent = "AI is evaluating your response...";
    }

    setTimeout(() => {
      const { currentQuestionIndex, questions } = activeInterview;
      const q = questions[currentQuestionIndex];

      // Evaluate answer via keyword density & response length
      const lowerAns = answer.toLowerCase();
      const matchedKeywords = q.keywords.filter(k => lowerAns.includes(k));
      const keywordRatio = matchedKeywords.length / q.keywords.length;

      let score = 6.0;
      if (answer.length > 50) score += 1.5;
      if (answer.length > 120) score += 1.0;
      score += Math.round(keywordRatio * 2.5 * 10) / 10;
      score = Math.min(Math.max(score, 5.0), 9.8);

      activeInterview.answers.push(answer);
      activeInterview.scores.push(score);

      if (evalCard) evalCard.style.display = "block";
      if (btnSubmit) btnSubmit.style.display = "none";
      if (scoreText) scoreText.textContent = `${score.toFixed(1)} / 10`;

      if (feedbackText) {
        let fb = "";
        if (score >= 8.5) {
          fb = `<strong>Excellent Response!</strong> You explained key concepts clearly (${matchedKeywords.join(", ") || "strong vocabulary"}). Your approach is well-structured and demonstrates depth.`;
        } else if (score >= 7.0) {
          fb = `<strong>Good Answer!</strong> You covered the main ideas (${matchedKeywords.join(", ") || "core principles"}). To improve, include more concrete examples or structural distinctions. <em>Concept takeaway: ${q.sampleConcept}</em>`;
        } else {
          fb = `<strong>Fair Attempt.</strong> Consider expanding on technical mechanisms. <em>Key concept: ${q.sampleConcept}</em>`;
        }
        feedbackText.innerHTML = fb;
      }
    }, 500);
  }

  function advanceInterviewQuestion() {
    activeInterview.currentQuestionIndex++;
    if (activeInterview.currentQuestionIndex < activeInterview.questions.length) {
      showInterviewQuestion();
    } else {
      showInterviewScorecard();
    }
  }

  function showInterviewScorecard() {
    document.getElementById("interview-setup-view").style.display = "none";
    document.getElementById("interview-active-view").style.display = "none";
    document.getElementById("interview-scorecard-view").style.display = "block";

    const totalScores = activeInterview.scores;
    const avgScore = totalScores.reduce((a, b) => a + b, 0) / totalScores.length;
    const overallPct = Math.round(avgScore * 10);
    const techScore = Math.min(Math.round(overallPct + (Math.random() * 4 - 2)), 98);
    const commScore = Math.min(Math.round(overallPct + (Math.random() * 6 - 3)), 96);

    const finalScoreEl = document.getElementById("interview-final-score");
    const finalSummaryEl = document.getElementById("interview-final-summary");
    const techEl = document.getElementById("interview-tech-score");
    const commEl = document.getElementById("interview-comm-score");
    const strengthsList = document.getElementById("interview-strengths-list");
    const weakList = document.getElementById("interview-weakness-list");

    if (finalScoreEl) finalScoreEl.innerHTML = `${overallPct}<small style="font-size:18px; color:#687783;">/100</small>`;
    if (techEl) techEl.textContent = `${techScore}%`;
    if (commEl) commEl.textContent = `${commScore}%`;

    const roleName = ROLE_DATA[activeInterview.role]?.name || "AI/ML Engineer";
    if (finalSummaryEl) {
      finalSummaryEl.textContent = `Great performance! You demonstrated solid readiness for ${roleName} technical interview rounds.`;
    }

    if (strengthsList) {
      strengthsList.innerHTML = `
        <li>Clear articulation of core engineering and ${roleName} principles.</li>
        <li>Structured approach to problem solving and scenario analysis.</li>
        <li>Good technical vocabulary and concept communication.</li>
      `;
    }

    if (weakList) {
      weakList.innerHTML = `
        <li>Incorporate deeper quantitative benchmarks when explaining design choices.</li>
        <li>Practice deep-dive architectural trade-offs for edge cases.</li>
      `;
    }

    // PERSIST IN PROFILE
    const user = getCurrentUser() || DEFAULT_DEMO_USER;
    if (!user.interviewResults) user.interviewResults = [];
    user.interviewResults.push({
      date: new Date().toISOString().split("T")[0],
      role: roleName,
      difficulty: activeInterview.difficulty,
      type: activeInterview.type,
      overallScore: overallPct,
      technicalScore: techScore,
      communicationScore: commScore
    });
    user.latestInterviewScore = overallPct;
    saveCurrentUser(user);
    addRecentActivity(`Scored ${overallPct}/100 in ${roleName} Mock Interview`);
    renderDashboard();

    const btnToInternships = document.getElementById("btn-interview-to-internships");
    if (btnToInternships) {
      btnToInternships.onclick = () => {
        closeAllPopups();
        openPopup("internships");
        renderInternships();
      };
    }

    const btnRetake = document.getElementById("btn-retake-interview");
    if (btnRetake) {
      btnRetake.onclick = () => {
        document.getElementById("interview-setup-view").style.display = "block";
        document.getElementById("interview-active-view").style.display = "none";
        document.getElementById("interview-scorecard-view").style.display = "none";
      };
    }
  }

  // Bind Mock Interview buttons
  const btnStartInt = document.getElementById("btn-start-interview");
  if (btnStartInt) btnStartInt.addEventListener("click", startMockInterviewSession);

  const btnSubmitAns = document.getElementById("btn-submit-answer");
  if (btnSubmitAns) btnSubmitAns.addEventListener("click", submitInterviewAnswer);

  const btnNextQ = document.getElementById("btn-next-question");
  if (btnNextQ) btnNextQ.addEventListener("click", advanceInterviewQuestion);

  // ==========================================
  // INTERNSHIP RECOMMENDATIONS
  // ==========================================

  const INTERNSHIP_DATABASE = [
    {
      id: 1,
      company: "Google",
      role: "aiml",
      title: "Machine Learning Engineering Intern",
      location: "Bengaluru, India",
      mode: "hybrid",
      requiredSkills: ["Python", "Machine Learning", "NumPy", "TensorFlow", "SQL"],
      stipend: "₹85,000 / month",
      duration: "6 Months",
      eligibility: "Pre-final / Final Year B.Tech / M.Tech"
    },
    {
      id: 2,
      company: "Microsoft",
      role: "software",
      title: "Software Engineering Intern",
      location: "Hyderabad, India",
      mode: "hybrid",
      requiredSkills: ["C++", "Java", "Data Structures", "Algorithms", "Git"],
      stipend: "₹80,000 / month",
      duration: "3 Months",
      eligibility: "All CS / IT Engineering Students"
    },
    {
      id: 3,
      company: "Amazon",
      role: "fullstack",
      title: "Full Stack Developer Intern",
      location: "Remote",
      mode: "remote",
      requiredSkills: ["React", "Node.js", "JavaScript", "SQL", "APIs"],
      stipend: "₹75,000 / month",
      duration: "4 Months",
      eligibility: "B.Tech / BCA / MCA Students"
    },
    {
      id: 4,
      company: "Razorpay",
      role: "frontend",
      title: "Frontend Engineering Intern",
      location: "Bengaluru, India",
      mode: "hybrid",
      requiredSkills: ["HTML", "CSS", "JavaScript", "React", "Tailwind CSS"],
      stipend: "₹45,000 / month",
      duration: "6 Months",
      eligibility: "Passionate Frontend Developers"
    },
    {
      id: 5,
      company: "Swiggy",
      role: "backend",
      title: "Backend Platform Intern",
      location: "Remote",
      mode: "remote",
      requiredSkills: ["Python", "Java", "SQL", "Databases", "APIs"],
      stipend: "₹50,000 / month",
      duration: "3 Months",
      eligibility: "Engineering Students (2025/2026/2027)"
    },
    {
      id: 6,
      company: "Zepto AI Labs",
      role: "data",
      title: "Data Science & Analytics Intern",
      location: "Mumbai, India",
      mode: "onsite",
      requiredSkills: ["Python", "Pandas", "SQL", "Statistics", "Data Visualization"],
      stipend: "₹40,000 / month",
      duration: "3 Months",
      eligibility: "Pre-final & Final Year Students"
    },
    {
      id: 7,
      company: "PhonePe",
      role: "android",
      title: "Android Mobile App Intern",
      location: "Bengaluru, India",
      mode: "hybrid",
      requiredSkills: ["Kotlin", "Java", "Android Studio", "APIs", "Git"],
      stipend: "₹60,000 / month",
      duration: "6 Months",
      eligibility: "Mobile App Developers"
    }
  ];

  function renderInternships() {
    const user = getCurrentUser() || DEFAULT_DEMO_USER;
    const userRole = user.preferredRole || "aiml";
    const userSkills = user.skills || [];

    const searchInput = document.getElementById("internship-search-input");
    const modeFilter = document.getElementById("internship-filter-mode");
    const listContainer = document.getElementById("internships-list");
    const matchInfo = document.getElementById("internship-match-info");

    const query = (searchInput?.value || "").toLowerCase().trim();
    const mode = modeFilter?.value || "all";

    const filtered = INTERNSHIP_DATABASE.filter(item => {
      const matchesQuery = !query ||
        item.title.toLowerCase().includes(query) ||
        item.company.toLowerCase().includes(query) ||
        item.requiredSkills.some(s => s.toLowerCase().includes(query));

      const matchesMode = mode === "all" || item.mode === mode;
      return matchesQuery && matchesMode;
    });

    // Sort: Preferred role opportunities first
    filtered.sort((a, b) => {
      if (a.role === userRole && b.role !== userRole) return -1;
      if (b.role === userRole && a.role !== userRole) return 1;
      return 0;
    });

    if (matchInfo) {
      matchInfo.textContent = `Showing ${filtered.length} verified opportunities tailored for ${user.name} (${ROLE_DATA[userRole]?.name || "Engineering"})`;
    }

    if (!listContainer) return;

    if (filtered.length === 0) {
      listContainer.innerHTML = `<div style="text-align:center; padding:30px; color:#687783;">No internships matching your filter criteria. Try searching with different keywords.</div>`;
      return;
    }

    listContainer.innerHTML = filtered.map(item => {
      const isApplied = (user.appliedInternships || []).includes(item.id);

      // Compute match score
      const matchedSkills = item.requiredSkills.filter(req =>
        userSkills.some(us => skillMatches(us, req))
      );
      let matchPct = Math.round((matchedSkills.length / item.requiredSkills.length) * 100);
      if (item.role === userRole) matchPct = Math.min(matchPct + 15, 96);
      matchPct = Math.max(matchPct, 65);

      return `
        <div style="background:#ffffff; border:1px solid rgba(38,55,70,0.12); border-radius:14px; padding:18px; box-shadow:0 4px 15px rgba(38,55,70,0.03); transition:0.2s;">
          <div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:8px; flex-wrap:wrap; gap:8px;">
            <div>
              <span style="font-size:11px; font-weight:800; color:#52616f; text-transform:uppercase; letter-spacing:1px;">
                ${item.company} • <span style="color:#159a9c;">${item.location}</span>
              </span>
              <h4 style="margin:2px 0 0 0; color:#263746; font-size:16px;">${item.title}</h4>
            </div>
            <div style="display:flex; align-items:center; gap:6px;">
              <span style="padding:4px 10px; border-radius:12px; font-size:12px; font-weight:800; background:rgba(21,154,156,0.12); color:#0f7a7c;">
                ${matchPct}% Match
              </span>
            </div>
          </div>

          <div style="margin:10px 0;">
            <span style="font-size:12px; font-weight:600; color:#52616f;">Required Skills:</span>
            <div style="display:flex; flex-wrap:wrap; gap:4px; margin-top:4px;">
              ${item.requiredSkills.map(s => {
                const hasSkill = userSkills.some(us => skillMatches(us, s));
                return `
                  <span style="font-size:11px; padding:2px 8px; border-radius:10px; font-weight:600; ${hasSkill ? 'background:#e6f7f2; color:#0e8a70; border:1px solid #b7e8dc;' : 'background:#f0f3f5; color:#52616f; border:1px solid rgba(38,55,70,0.08);'}">
                    ${hasSkill ? '✓ ' : ''}${s}
                  </span>
                `;
              }).join("")}
            </div>
          </div>

          <div style="display:flex; justify-content:space-between; align-items:center; margin-top:14px; padding-top:10px; border-top:1px solid rgba(38,55,70,0.06); flex-wrap:wrap; gap:8px;">
            <div style="font-size:12px; color:#687783;">
              <strong>${item.stipend}</strong> • ${item.duration}
            </div>
            <button
              class="btn btn-small btn-apply-internship"
              data-id="${item.id}"
              style="padding:8px 16px; font-size:12px; ${isApplied ? 'background:#e6f7f2; color:#0e8a70; border:1px solid #b7e8dc;' : ''}"
              type="button"
            >
              ${isApplied ? '✓ Applied' : 'Apply Now →'}
            </button>
          </div>
        </div>
      `;
    }).join("");

    // Bind Apply buttons
    listContainer.querySelectorAll(".btn-apply-internship").forEach(btn => {
      btn.addEventListener("click", (e) => {
        const id = parseInt(e.target.getAttribute("data-id"), 10);
        const item = INTERNSHIP_DATABASE.find(i => i.id === id);
        if (!item) return;

        if (!user.appliedInternships) user.appliedInternships = [];
        if (!user.appliedInternships.includes(id)) {
          user.appliedInternships.push(id);
          saveCurrentUser(user);
          addRecentActivity(`Applied for ${item.title} at ${item.company}`);
          alert(`🎉 Application submitted for ${item.title} at ${item.company}!\nProfile details and resume successfully shared with the recruiter.`);
          renderInternships();
          renderDashboard();
        }
      });
    });
  }

  const internshipSearch = document.getElementById("internship-search-input");
  if (internshipSearch) internshipSearch.addEventListener("input", renderInternships);

  const internshipFilter = document.getElementById("internship-filter-mode");
  if (internshipFilter) internshipFilter.addEventListener("change", renderInternships);

  // ==========================================
  // POPUP SYSTEM & GLOBAL ROUTING
  // ==========================================

  function openPopup(popupId) {
    // Route protection: Prompt login for dashboard if unauthenticated
    if (popupId === "dashboard") {
      const user = getCurrentUser();
      if (!user) {
        popupId = "login";
      }
    }

    const popup = document.getElementById(popupId);
    if (popup) {
      // Trigger dynamic renderers
      if (popupId === "dashboard") renderDashboard();
      if (popupId === "roadmap") renderRoadmapUI();
      if (popupId === "internships") renderInternships();
      if (popupId === "skills") {
        const user = getCurrentUser();
        if (user) {
          const roleSelect = document.getElementById("skill-target-role");
          const skillsText = document.getElementById("skill-current-skills");
          if (roleSelect && user.preferredRole) roleSelect.value = user.preferredRole;
          if (skillsText && user.skills && user.skills.length > 0) {
            skillsText.value = user.skills.join(", ");
          }
        }
      }

      popup.classList.add("active");
      document.body.style.overflow = "hidden";
    }
  }

  function closeAllPopups() {
    document.querySelectorAll(".popup-overlay").forEach(popup => {
      popup.classList.remove("active");
    });
    document.body.style.overflow = "";
  }

  // Open popups by data-popup
  document.querySelectorAll("[data-popup]").forEach(button => {
    button.addEventListener("click", (e) => {
      e.preventDefault();
      const popupId = button.getAttribute("data-popup");
      if (popupId) {
        openPopup(popupId);
      }
    });
  });

  // Make entire feature cards clickable
  document.querySelectorAll(".feature-card").forEach(card => {
    const link = card.querySelector("[data-popup]");
    if (link) {
      card.style.cursor = "pointer";
      card.addEventListener("click", (e) => {
        if (e.target.closest("a, button, input, textarea, select")) return;
        const popupId = link.getAttribute("data-popup");
        if (popupId) {
          openPopup(popupId);
        }
      });
    }
  });

  // Close buttons
  document.querySelectorAll(".popup-close").forEach(button => {
    button.addEventListener("click", (e) => {
      e.preventDefault();
      closeAllPopups();
    });
  });

  // Overlay click to close
  document.querySelectorAll(".popup-overlay").forEach(overlay => {
    overlay.addEventListener("click", (e) => {
      if (e.target === overlay) {
        closeAllPopups();
      }
    });
  });

  // ESC key to close
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      closeAllPopups();
    }
  });

  // Mobile menu toggle
  const menuBtn = document.querySelector(".menu-btn");
  const navLinks = document.querySelector(".nav-links");
  if (menuBtn && navLinks) {
    menuBtn.addEventListener("click", () => {
      navLinks.classList.toggle("show");
    });
  }

  // Option selection for popup-option cards
  document.querySelectorAll(".popup-option").forEach(option => {
    option.addEventListener("click", () => {
      const parent = option.closest(".popup-options") || option.parentElement;
      if (parent) {
        parent.querySelectorAll(".popup-option").forEach(item => {
          item.classList.remove("selected");
        });
      }
      option.classList.add("selected");
    });
  });

  // INITIALIZE ON LOAD
  initAuthUI();

});
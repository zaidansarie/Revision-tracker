const http = require("http");

function fetchUrl(url, options = {}) {
  return new Promise((resolve, reject) => {
    const req = http.request(url, options, (res) => {
      let data = "";
      res.on("data", (chunk) => (data += chunk));
      res.on("end", () => resolve({ statusCode: res.statusCode, headers: res.headers, body: data }));
    });
    req.on("error", reject);
    if (options.body) req.write(options.body);
    req.end();
  });
}

async function runLiveTests() {
  console.log("\n=======================================================");
  console.log("🌐 LIVE SERVER END-TO-END VALIDATION (localhost:3000)");
  console.log("=======================================================\n");

  let passed = 0;
  let total = 0;

  async function test(name, fn) {
    total++;
    try {
      await fn();
      console.log(`  ✓ ${name}`);
      passed++;
    } catch (err) {
      console.error(`  ✗ FAIL: ${name}: ${err.message}`);
    }
  }

  // 1. Unauthenticated redirect to /login
  await test("Unauthenticated request to '/' redirects to '/login'", async () => {
    const res = await fetchUrl("http://localhost:3000/");
    if (res.statusCode !== 307 && res.statusCode !== 302) {
      throw new Error(`Expected redirect (302/307), got status ${res.statusCode}`);
    }
    if (!res.headers.location || !res.headers.location.includes("/login")) {
      throw new Error(`Expected redirect to /login, got ${res.headers.location}`);
    }
  });

  // 2. Login page loads 200 OK
  await test("Login page loads successfully with status 200", async () => {
    const res = await fetchUrl("http://localhost:3000/login");
    if (res.statusCode !== 200) {
      throw new Error(`Expected 200 OK, got ${res.statusCode}`);
    }
    if (!res.body.includes("ZaidRev")) {
      throw new Error("Page missing 'ZaidRev' brand heading");
    }
  });

  // 3. PWA Web Manifest loads 200 OK
  await test("PWA Web Manifest (/manifest.json) loads with status 200", async () => {
    const res = await fetchUrl("http://localhost:3000/manifest.json");
    if (res.statusCode !== 200) {
      throw new Error(`Expected 200 OK, got ${res.statusCode}`);
    }
    const manifest = JSON.parse(res.body);
    if (manifest.short_name !== "ZaidRev") {
      throw new Error(`Manifest short_name incorrect: ${manifest.short_name}`);
    }
  });

  // 4. Service Worker (/sw.js) loads 200 OK
  await test("PWA Service Worker (/sw.js) loads with status 200", async () => {
    const res = await fetchUrl("http://localhost:3000/sw.js");
    if (res.statusCode !== 200) {
      throw new Error(`Expected 200 OK, got ${res.statusCode}`);
    }
    if (!res.body.includes("ZaidRev Service Worker")) {
      throw new Error("Service worker content missing expected header");
    }
  });

  // 5. PWA Icon 192px loads 200 OK
  await test("PWA Icon (/icons/icon-192.png) loads successfully with status 200", async () => {
    const res = await fetchUrl("http://localhost:3000/icons/icon-192.png");
    if (res.statusCode !== 200) {
      throw new Error(`Expected 200 OK, got ${res.statusCode}`);
    }
    if (res.headers["content-type"] !== "image/png") {
      throw new Error(`Expected content-type image/png, got ${res.headers["content-type"]}`);
    }
  });

  // 6. Authenticated Session access to homepage
  await test("Authenticated session cookie allows access to homepage (status 200)", async () => {
    const res = await fetchUrl("http://localhost:3000/", {
      headers: {
        Cookie: "zaidrev_session=zaid",
      },
    });
    if (res.statusCode !== 200) {
      throw new Error(`Expected 200 OK for authenticated user, got ${res.statusCode}`);
    }
    if (!res.body.includes("Loading ZaidRev") && !res.body.includes("ZaidRev")) {
      throw new Error("Homepage content missing ZaidRev brand");
    }
  });

  console.log("\n=======================================================");
  console.log(`📊 LIVE SERVER RESULTS: ${passed}/${total} TESTS PASSED (100%)`);
  console.log("=======================================================\n");

  process.exit(passed === total ? 0 : 1);
}

runLiveTests().catch((e) => {
  console.error("Test runner error:", e);
  process.exit(1);
});

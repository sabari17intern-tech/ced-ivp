const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  
  console.log('Navigating to local grant portal...');
  await page.goto('http://localhost:8080/ced-grant-management.html');
  await page.waitForTimeout(2000);

  console.log('Logging in as student gurusharan (9443533618)...');
  await page.fill('#login_user', '9443533618');
  await page.fill('#login_pass', '090630');
  await page.click('button:has-text("Sign in")');
  await page.waitForTimeout(2500);

  const bodyText = await page.innerText('body');
  console.log('\n--- Student Dashboard Content ---');
  if (bodyText.includes('CED Evaluation Round 1')) {
    console.log('SUCCESS: "CED Evaluation Round 1" found on Student Dashboard!');
  } else {
    console.log('WARNING: "CED Evaluation Round 1" not found on dashboard!');
  }

  if (bodyText.includes('8.5/10')) {
    console.log('SUCCESS: Score "8.5/10" is displayed on Student Dashboard!');
  } else {
    console.log('WARNING: Score "8.5/10" not found on dashboard!');
  }

  if (bodyText.includes('Arun Kumar R')) {
    console.log('SUCCESS: Reviewer name "Arun Kumar R" is displayed on Student Dashboard!');
  }

  await page.screenshot({ path: 'student_marks_reflected_test.png', fullPage: true });
  console.log('Saved screenshot to student_marks_reflected_test.png');

  await browser.close();
})();

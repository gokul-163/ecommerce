const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🚀 Starting E-commerce API Test Suite...\n');

// Colors for console output
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m',
  bold: '\x1b[1m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function runTest(testType, description) {
  log(`\n${colors.bold}${colors.blue}Running ${description}...${colors.reset}`);
  
  try {
    const command = testType === 'api' 
      ? 'npm run test:api'
      : testType === 'e2e'
      ? 'npm run test:e2e'
      : 'npm test';
    
    const output = execSync(command, { 
      encoding: 'utf8',
      stdio: 'pipe'
    });
    
    log(`✅ ${description} completed successfully!`, 'green');
    return { success: true, output };
  } catch (error) {
    log(`❌ ${description} failed!`, 'red');
    log(error.stdout || error.message, 'red');
    return { success: false, error: error.stdout || error.message };
  }
}

function generateTestReport(results) {
  const report = {
    timestamp: new Date().toISOString(),
    summary: {
      total: results.length,
      passed: results.filter(r => r.success).length,
      failed: results.filter(r => !r.success).length
    },
    details: results
  };

  const reportPath = path.join(__dirname, 'test-report.json');
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
  
  log(`\n📊 Test report saved to: ${reportPath}`, 'blue');
  return report;
}

function displaySummary(report) {
  log('\n' + '='.repeat(60), 'bold');
  log('📋 TEST SUMMARY', 'bold');
  log('='.repeat(60), 'bold');
  
  log(`Total Test Suites: ${report.summary.total}`, 'blue');
  log(`✅ Passed: ${report.summary.passed}`, 'green');
  log(`❌ Failed: ${report.summary.failed}`, 'red');
  
  if (report.summary.failed > 0) {
    log('\n❌ Failed Tests:', 'red');
    report.details
      .filter(r => !r.success)
      .forEach(result => {
        log(`  - ${result.description}`, 'red');
      });
  }
  
  log('\n' + '='.repeat(60), 'bold');
}

// Main test execution
async function runAllTests() {
  const results = [];
  
  // Run API tests
  results.push(runTest('api', 'API Endpoint Tests'));
  
  // Run E2E tests
  results.push(runTest('e2e', 'End-to-End Flow Tests'));
  
  // Run all tests with coverage
  log(`\n${colors.bold}${colors.blue}Running Full Test Suite with Coverage...${colors.reset}`);
  try {
    const coverageOutput = execSync('npm run test:coverage', { 
      encoding: 'utf8',
      stdio: 'pipe'
    });
    log('✅ Coverage report generated!', 'green');
    results.push({ success: true, description: 'Coverage Report', output: coverageOutput });
  } catch (error) {
    log('❌ Coverage generation failed!', 'red');
    results.push({ success: false, description: 'Coverage Report', error: error.stdout || error.message });
  }
  
  // Generate and display report
  const report = generateTestReport(results);
  displaySummary(report);
  
  // Exit with appropriate code
  process.exit(report.summary.failed > 0 ? 1 : 0);
}

// Handle command line arguments
const args = process.argv.slice(2);
const testType = args[0];

if (testType === 'api') {
  const result = runTest('api', 'API Endpoint Tests');
  process.exit(result.success ? 0 : 1);
} else if (testType === 'e2e') {
  const result = runTest('e2e', 'End-to-End Flow Tests');
  process.exit(result.success ? 0 : 1);
} else if (testType === 'coverage') {
  try {
    execSync('npm run test:coverage', { stdio: 'inherit' });
  } catch (error) {
    process.exit(1);
  }
} else {
  runAllTests();
}




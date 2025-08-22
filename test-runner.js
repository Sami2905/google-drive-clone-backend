#!/usr/bin/env node

const { execSync, exec } = require('child_process');
const fs = require('fs');
const path = require('path');

class TestRunner {
  constructor() {
    this.results = {
      backend: { passed: 0, failed: 0, errors: [] },
      frontend: { passed: 0, failed: 0, errors: [] },
      linting: { passed: 0, failed: 0, errors: [] },
      typeCheck: { passed: 0, failed: 0, errors: [] }
    };
    this.totalTests = 0;
    this.passedTests = 0;
    this.failedTests = 0;
  }

  log(message, type = 'info') {
    const colors = {
      info: '\x1b[36m',      // Cyan
      success: '\x1b[32m',   // Green
      error: '\x1b[31m',     // Red
      warning: '\x1b[33m',   // Yellow
      reset: '\x1b[0m'       // Reset
    };
    
    console.log(`${colors[type]}${message}${colors.reset}`);
  }

  async runCommand(command, cwd = process.cwd()) {
    return new Promise((resolve, reject) => {
      exec(command, { cwd }, (error, stdout, stderr) => {
        if (error) {
          reject({ error, stdout, stderr });
        } else {
          resolve({ stdout, stderr });
        }
      });
    });
  }

  async checkPrerequisites() {
    this.log('🔍 Checking prerequisites...', 'info');
    
    try {
      // Check if Node.js and npm are available
      await this.runCommand('node --version');
      await this.runCommand('npm --version');
      this.log('✅ Node.js and npm are available', 'success');
      
      // Check if backend dependencies are installed
      if (fs.existsSync('package.json')) {
        this.log('✅ Backend package.json found', 'success');
      } else {
        throw new Error('Backend package.json not found');
      }
      
      // Check if frontend dependencies are installed
      if (fs.existsSync('drive-frontend/package.json')) {
        this.log('✅ Frontend package.json found', 'success');
      } else {
        throw new Error('Frontend package.json not found');
      }
      
    } catch (error) {
      this.log(`❌ Prerequisites check failed: ${error.message}`, 'error');
      throw error;
    }
  }

  async installDependencies() {
    this.log('📦 Installing dependencies...', 'info');
    
    try {
      // Install backend dependencies
      this.log('Installing backend dependencies...', 'info');
      await this.runCommand('npm install');
      
      // Install frontend dependencies
      this.log('Installing frontend dependencies...', 'info');
      await this.runCommand('npm install', './drive-frontend');
      
      this.log('✅ Dependencies installed successfully', 'success');
    } catch (error) {
      this.log(`❌ Failed to install dependencies: ${error.stderr || error.message}`, 'error');
      throw error;
    }
  }

  async runBackendTests() {
    this.log('🧪 Running backend tests...', 'info');
    
    try {
      const result = await this.runCommand('npm test');
      this.results.backend.passed = 1;
      this.log('✅ Backend tests passed', 'success');
      this.passedTests++;
    } catch (error) {
      this.results.backend.failed = 1;
      this.results.backend.errors.push(error.stderr || error.stdout || error.message);
      this.log('❌ Backend tests failed', 'error');
      this.log(error.stderr || error.stdout || error.message, 'error');
      this.failedTests++;
    }
    this.totalTests++;
  }

  async runFrontendTests() {
    this.log('🧪 Running frontend tests...', 'info');
    
    try {
      // First check if test command exists
      const packageJson = JSON.parse(fs.readFileSync('./drive-frontend/package.json', 'utf8'));
      if (!packageJson.scripts || !packageJson.scripts.test) {
        // Add test script if it doesn't exist
        packageJson.scripts = packageJson.scripts || {};
        packageJson.scripts.test = 'jest';
        fs.writeFileSync('./drive-frontend/package.json', JSON.stringify(packageJson, null, 2));
      }
      
      const result = await this.runCommand('npm test', './drive-frontend');
      this.results.frontend.passed = 1;
      this.log('✅ Frontend tests passed', 'success');
      this.passedTests++;
    } catch (error) {
      this.results.frontend.failed = 1;
      this.results.frontend.errors.push(error.stderr || error.stdout || error.message);
      this.log('❌ Frontend tests failed', 'error');
      this.log(error.stderr || error.stdout || error.message, 'error');
      this.failedTests++;
    }
    this.totalTests++;
  }

  async runLinting() {
    this.log('🔍 Running linting checks...', 'info');
    
    try {
      // Check backend linting
      try {
        await this.runCommand('npx eslint src --ext .ts,.js');
        this.log('✅ Backend linting passed', 'success');
      } catch (error) {
        this.log('⚠️  Backend linting issues found:', 'warning');
        this.log(error.stdout, 'warning');
        this.results.linting.errors.push(`Backend: ${error.stdout}`);
      }
      
      // Check frontend linting
      try {
        await this.runCommand('npm run lint', './drive-frontend');
        this.log('✅ Frontend linting passed', 'success');
      } catch (error) {
        this.log('⚠️  Frontend linting issues found:', 'warning');
        this.log(error.stdout, 'warning');
        this.results.linting.errors.push(`Frontend: ${error.stdout}`);
      }
      
      if (this.results.linting.errors.length === 0) {
        this.results.linting.passed = 1;
        this.passedTests++;
      } else {
        this.results.linting.failed = 1;
        this.failedTests++;
      }
    } catch (error) {
      this.results.linting.failed = 1;
      this.results.linting.errors.push(error.message);
      this.log(`❌ Linting check failed: ${error.message}`, 'error');
      this.failedTests++;
    }
    this.totalTests++;
  }

  async runTypeChecking() {
    this.log('🔍 Running TypeScript type checking...', 'info');
    
    try {
      // Check backend types
      try {
        await this.runCommand('npx tsc --noEmit');
        this.log('✅ Backend TypeScript check passed', 'success');
      } catch (error) {
        this.log('❌ Backend TypeScript errors found:', 'error');
        this.log(error.stdout, 'error');
        this.results.typeCheck.errors.push(`Backend: ${error.stdout}`);
      }
      
      // Check frontend types
      try {
        await this.runCommand('npx tsc --noEmit', './drive-frontend');
        this.log('✅ Frontend TypeScript check passed', 'success');
      } catch (error) {
        this.log('❌ Frontend TypeScript errors found:', 'error');
        this.log(error.stdout, 'error');
        this.results.typeCheck.errors.push(`Frontend: ${error.stdout}`);
      }
      
      if (this.results.typeCheck.errors.length === 0) {
        this.results.typeCheck.passed = 1;
        this.passedTests++;
      } else {
        this.results.typeCheck.failed = 1;
        this.failedTests++;
      }
    } catch (error) {
      this.results.typeCheck.failed = 1;
      this.results.typeCheck.errors.push(error.message);
      this.log(`❌ TypeScript check failed: ${error.message}`, 'error');
      this.failedTests++;
    }
    this.totalTests++;
  }

  async checkBuildProcess() {
    this.log('🏗️  Testing build process...', 'info');
    
    try {
      // Build backend
      this.log('Building backend...', 'info');
      await this.runCommand('npm run build');
      this.log('✅ Backend build successful', 'success');
      
      // Build frontend
      this.log('Building frontend...', 'info');
      await this.runCommand('npm run build', './drive-frontend');
      this.log('✅ Frontend build successful', 'success');
      
      this.passedTests++;
    } catch (error) {
      this.log(`❌ Build failed: ${error.stderr || error.message}`, 'error');
      this.results.backend.errors.push(`Build error: ${error.stderr || error.message}`);
      this.failedTests++;
    }
    this.totalTests++;
  }

  generateReport() {
    this.log('\n📊 TEST RESULTS SUMMARY', 'info');
    this.log('=' * 50, 'info');
    
    const successRate = Math.round((this.passedTests / this.totalTests) * 100);
    
    this.log(`Total Tests: ${this.totalTests}`, 'info');
    this.log(`Passed: ${this.passedTests}`, 'success');
    this.log(`Failed: ${this.failedTests}`, 'error');
    this.log(`Success Rate: ${successRate}%`, successRate >= 80 ? 'success' : 'error');
    
    this.log('\n📋 DETAILED RESULTS:', 'info');
    
    // Backend results
    this.log(`\n🔧 Backend:`, 'info');
    this.log(`  Passed: ${this.results.backend.passed}`, this.results.backend.passed > 0 ? 'success' : 'error');
    this.log(`  Failed: ${this.results.backend.failed}`, this.results.backend.failed > 0 ? 'error' : 'success');
    if (this.results.backend.errors.length > 0) {
      this.results.backend.errors.forEach(error => {
        this.log(`    ❌ ${error}`, 'error');
      });
    }
    
    // Frontend results
    this.log(`\n🎨 Frontend:`, 'info');
    this.log(`  Passed: ${this.results.frontend.passed}`, this.results.frontend.passed > 0 ? 'success' : 'error');
    this.log(`  Failed: ${this.results.frontend.failed}`, this.results.frontend.failed > 0 ? 'error' : 'success');
    if (this.results.frontend.errors.length > 0) {
      this.results.frontend.errors.forEach(error => {
        this.log(`    ❌ ${error}`, 'error');
      });
    }
    
    // Linting results
    this.log(`\n🔍 Linting:`, 'info');
    this.log(`  Passed: ${this.results.linting.passed}`, this.results.linting.passed > 0 ? 'success' : 'error');
    this.log(`  Failed: ${this.results.linting.failed}`, this.results.linting.failed > 0 ? 'error' : 'success');
    if (this.results.linting.errors.length > 0) {
      this.results.linting.errors.forEach(error => {
        this.log(`    ⚠️  ${error}`, 'warning');
      });
    }
    
    // Type checking results
    this.log(`\n🔤 TypeScript:`, 'info');
    this.log(`  Passed: ${this.results.typeCheck.passed}`, this.results.typeCheck.passed > 0 ? 'success' : 'error');
    this.log(`  Failed: ${this.results.typeCheck.failed}`, this.results.typeCheck.failed > 0 ? 'error' : 'success');
    if (this.results.typeCheck.errors.length > 0) {
      this.results.typeCheck.errors.forEach(error => {
        this.log(`    ❌ ${error}`, 'error');
      });
    }
    
    // Recommendations
    this.log('\n💡 RECOMMENDATIONS:', 'info');
    if (this.failedTests > 0) {
      this.log('- Fix the failing tests before deploying to production', 'warning');
      this.log('- Review error messages above for specific issues', 'warning');
    }
    if (this.results.linting.errors.length > 0) {
      this.log('- Fix linting issues for better code quality', 'warning');
    }
    if (this.results.typeCheck.errors.length > 0) {
      this.log('- Fix TypeScript errors for type safety', 'warning');
    }
    if (successRate >= 80) {
      this.log('✅ Project is ready for production!', 'success');
    } else {
      this.log('❌ Project needs fixes before production deployment', 'error');
    }
  }

  async run() {
    try {
      this.log('🚀 Starting comprehensive test suite...', 'info');
      
      await this.checkPrerequisites();
      await this.installDependencies();
      
      // Run all tests
      await this.runLinting();
      await this.runTypeChecking();
      await this.runBackendTests();
      await this.runFrontendTests();
      await this.checkBuildProcess();
      
      this.generateReport();
      
      // Exit with error code if any tests failed
      process.exit(this.failedTests > 0 ? 1 : 0);
      
    } catch (error) {
      this.log(`💥 Test runner failed: ${error.message}`, 'error');
      process.exit(1);
    }
  }
}

// Run the test suite
const runner = new TestRunner();
runner.run();

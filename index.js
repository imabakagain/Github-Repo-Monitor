require('dotenv').config();
const fs = require('fs').promises;
const path = require('path');
const cron = require('node-cron');
const GitHubMonitor = require('./src/monitor');

class GitHubMonitorApp {
  constructor() {
    this.monitor = null;
    this.cronJob = null;
    this.config = null;
    this.repositories = [];
  }

  async init() {
    try {
      console.log('🚀 Starting GitHub Monitor...\n');
      
      // Load configuration
      await this.loadConfig();
      
      // Load repositories to monitor
      await this.loadRepositories();
      
      // Initialize monitor
      this.monitor = new GitHubMonitor(this.config);
      await this.monitor.init();
      
      console.log('✅ GitHub Monitor initialized successfully\n');
      
    } catch (error) {
      console.error('❌ Failed to initialize GitHub Monitor:', error.message);
      process.exit(1);
    }
  }

  async loadConfig() {
    // Validate required environment variables
    const requiredVars = [
      'GITHUB_TOKEN'
    ];

    const missingVars = requiredVars.filter(varName => !process.env[varName]);
    
    if (missingVars.length > 0) {
      throw new Error(`Missing required environment variables: ${missingVars.join(', ')}`);
    }

    this.config = {
      github: {
        token: process.env.GITHUB_TOKEN,
      },
      notification: {
        enabled: process.env.NOTIFICATION_ENABLED !== 'false', // 默认启用
        sound: process.env.NOTIFICATION_SOUND !== 'false', // 默认有声音
        timeout: parseInt(process.env.NOTIFICATION_TIMEOUT) || 10, // 默认10秒
      },
      monitor: {
        checkInterval: parseInt(process.env.CHECK_INTERVAL) || 30,
        logLevel: process.env.LOG_LEVEL || 'info',
      }
    };

    console.log('📝 Configuration loaded:');
    console.log(`  - GitHub token: ${this.config.github.token ? '✓ Configured' : '❌ Missing'}`);
    console.log(`  - Desktop notifications: ${this.config.notification.enabled ? '✓ Enabled' : '❌ Disabled'}`);
    console.log(`  - Notification sound: ${this.config.notification.sound ? '✓ Enabled' : '❌ Disabled'}`);
    console.log(`  - Notification timeout: ${this.config.notification.timeout} seconds`);
    console.log(`  - Check interval: ${this.config.monitor.checkInterval} minutes\n`);
  }

  async loadRepositories() {
    try {
      const reposPath = path.join(__dirname, 'config', 'repos.json');
      const reposData = await fs.readFile(reposPath, 'utf8');
      this.repositories = JSON.parse(reposData);
      
      if (!Array.isArray(this.repositories) || this.repositories.length === 0) {
        throw new Error('No repositories configured or invalid format');
      }

      const individualRepos = this.repositories.filter(config => config.type !== 'organization');
      const organizations = this.repositories.filter(config => config.type === 'organization');
      
      console.log(`📚 Loaded ${individualRepos.length} repositories and ${organizations.length} organizations to monitor:`);
      
      individualRepos.forEach((repo, index) => {
        console.log(`  ${index + 1}. ${repo.owner}/${repo.repo} - ${repo.description || 'No description'}`);
        console.log(`     Commits: ${repo.watchCommits !== false ? '✓' : '❌'} | Releases: ${repo.watchReleases !== false ? '✓' : '❌'}`);
      });
      
      organizations.forEach((org, index) => {
        console.log(`  O${index + 1}. Organization: ${org.org} - ${org.description || 'No description'}`);
        console.log(`     New Repos: ${org.watchNewRepos !== false ? '✓' : '❌'} | Commits: ${org.watchCommits !== false ? '✓' : '❌'} | Releases: ${org.watchReleases !== false ? '✓' : '❌'} | Exclude Forks: ${org.excludeForks !== false ? '✓' : '❌'}`);
      });
      
      console.log('');
      
    } catch (error) {
      if (error.code === 'ENOENT') {
        throw new Error('Repository configuration file (config/repos.json) not found');
      }
      throw new Error(`Failed to load repositories: ${error.message}`);
    }
  }

  async runCheck() {
    if (!this.monitor) {
      console.error('❌ Monitor not initialized');
      return;
    }

    try {
      await this.monitor.checkAllRepositories(this.repositories);
    } catch (error) {
      console.error('❌ Error during monitor check:', error.message);
    }
  }

  async startScheduledMonitoring() {
    if (this.cronJob) {
      this.cronJob.stop();
    }

    // Create cron expression for the specified interval
    const cronExpression = `*/${this.config.monitor.checkInterval} * * * *`;
    
    console.log(`⏰ Starting scheduled monitoring (every ${this.config.monitor.checkInterval} minutes)`);
    console.log(`   Next check will run at: ${this.getNextCheckTime()}\n`);

    this.cronJob = cron.schedule(cronExpression, async () => {
      await this.runCheck();
    });

    // Run initial check
    await this.runCheck();
  }

  getNextCheckTime() {
    const now = new Date();
    const nextCheck = new Date(now.getTime() + this.config.monitor.checkInterval * 60 * 1000);
    return nextCheck.toLocaleString();
  }

  async sendTestNotification() {
    if (!this.monitor) {
      console.error('❌ Monitor not initialized');
      return false;
    }

    return await this.monitor.sendTestNotification();
  }

  stop() {
    if (this.cronJob) {
      this.cronJob.stop();
      console.log('⏹️  Scheduled monitoring stopped');
    }
  }

  async handleCommand(command) {
    switch (command) {
      case 'test-notification':
      case 'test-email': // 保持向后兼容
        console.log('🔔 Testing notification system...\n');
        const success = await this.sendTestNotification();
        if (success) {
          console.log('✅ Test notification sent successfully!\n');
        } else {
          console.log('❌ Failed to send test notification. Please check your configuration.\n');
        }
        break;
        
      case 'check-now':
        console.log('🔍 Running manual check...\n');
        await this.runCheck();
        break;
        
      case 'start':
        await this.startScheduledMonitoring();
        break;
        
      default:
        console.log('❓ Unknown command. Available commands:');
        console.log('  - test-notification: Send a test notification');
        console.log('  - check-now: Run a manual check');
        console.log('  - start: Start scheduled monitoring (default)');
        break;
    }
  }
}

// Main execution
async function main() {
  const app = new GitHubMonitorApp();
  
  try {
    await app.init();
    
    // Get command from command line arguments
    const command = process.argv[2] || 'start';
    
    // Handle shutdown gracefully
    process.on('SIGINT', () => {
      console.log('\n🛑 Shutting down GitHub Monitor...');
      app.stop();
      process.exit(0);
    });

    process.on('SIGTERM', () => {
      console.log('\n🛑 Shutting down GitHub Monitor...');
      app.stop();
      process.exit(0);
    });

    // Execute command
    await app.handleCommand(command);
    
  } catch (error) {
    console.error('💥 Application error:', error.message);
    process.exit(1);
  }
}

// Start the application
if (require.main === module) {
  main();
}

module.exports = GitHubMonitorApp;
const fs = require('fs').promises;
const path = require('path');
const GitHubClient = require('./github-client');
const DesktopNotifier = require('./desktop-notifier');

class GitHubMonitor {
  constructor(config) {
    this.config = config;
    this.githubClient = new GitHubClient(config.github.token);
    this.notificationService = new DesktopNotifier(config.notification);
    this.stateFile = path.join(__dirname, '..', 'monitor-state.json');
    this.state = {};
  }

  async init() {
    // Test notification service connection
    try {
      const connected = await this.notificationService.testConnection();
      if (connected) {
        console.log('✅ Desktop notifications enabled');
      } else {
        console.log('ℹ️  Desktop notifications disabled');
      }
    } catch (error) {
      console.warn('⚠️  Notification service initialization failed:', error.message);
    }
    
    // Load previous state
    await this.loadState();
    
    console.log('GitHub Monitor initialized successfully');
  }

  async loadState() {
    try {
      const stateData = await fs.readFile(this.stateFile, 'utf8');
      this.state = JSON.parse(stateData);
      console.log('Previous monitor state loaded');
    } catch (error) {
      if (error.code === 'ENOENT') {
        console.log('No previous state found, starting fresh');
        this.state = {};
      } else {
        throw new Error(`Failed to load state: ${error.message}`);
      }
    }
  }

  async saveState() {
    try {
      await fs.writeFile(this.stateFile, JSON.stringify(this.state, null, 2));
      console.log('Monitor state saved');
    } catch (error) {
      console.error('Failed to save state:', error.message);
    }
  }

  getRepositoryKey(owner, repo) {
    return `${owner}/${repo}`;
  }

  getOrganizationKey(org) {
    return `org:${org}`;
  }

  async checkRepository(repoConfig) {
    const { owner, repo, branch } = repoConfig;
    const repoKey = this.getRepositoryKey(owner, repo);
    
    console.log(`Checking repository: ${repoKey}`);
    
    try {
      // Get repository info
      const repoInfo = await this.githubClient.getRepositoryInfo(owner, repo);
      
      // Initialize state for this repository if not exists
      if (!this.state[repoKey]) {
        this.state[repoKey] = {
          lastCommitSha: null,
          lastReleaseTag: null,
          lastCheck: null
        };
      }
      
      const repoState = this.state[repoKey];
      let hasUpdates = false;

      // Check for new commits
      if (repoConfig.watchCommits !== false) {
        const latestCommit = await this.githubClient.getLatestCommit(owner, repo, branch || repoInfo.defaultBranch);
        
        if (latestCommit) {
          if (repoState.lastCommitSha && repoState.lastCommitSha !== latestCommit.sha) {
            console.log(`📝 New commit found in ${repoKey}: ${latestCommit.sha.substring(0, 7)}`);
            
            // Send commit notification
            const notificationResult = await this.notificationService.sendCommitNotification(
              repoInfo,
              latestCommit
            );
            
            if (notificationResult.success) {
              console.log(`✅ Commit notification sent for ${repoKey}`);
            } else {
              console.error(`❌ Failed to send commit notification for ${repoKey}:`, notificationResult.error);
            }
            
            hasUpdates = true;
          }
          
          repoState.lastCommitSha = latestCommit.sha;
        }
      }

      // Check for new releases
      if (repoConfig.watchReleases !== false) {
        const latestRelease = await this.githubClient.getLatestRelease(owner, repo);
        
        if (latestRelease) {
          if (repoState.lastReleaseTag && repoState.lastReleaseTag !== latestRelease.tag) {
            console.log(`🎉 New release found in ${repoKey}: ${latestRelease.tag}`);
            
            // Send release notification
            const notificationResult = await this.notificationService.sendReleaseNotification(
              repoInfo,
              latestRelease
            );
            
            if (notificationResult.success) {
              console.log(`✅ Release notification sent for ${repoKey}`);
            } else {
              console.error(`❌ Failed to send release notification for ${repoKey}:`, notificationResult.error);
            }
            
            hasUpdates = true;
          }
          
          repoState.lastReleaseTag = latestRelease.tag;
        }
      }

      repoState.lastCheck = new Date().toISOString();
      
      if (!hasUpdates && repoState.lastCommitSha) {
        console.log(`✓ No new updates for ${repoKey}`);
      }
      
      return {
        repository: repoKey,
        hasUpdates,
        lastCommit: repoState.lastCommitSha,
        lastRelease: repoState.lastReleaseTag,
        lastCheck: repoState.lastCheck
      };
      
    } catch (error) {
      console.error(`❌ Error checking repository ${repoKey}:`, error.message);
      
      return {
        repository: repoKey,
        error: error.message,
        lastCheck: new Date().toISOString()
      };
    }
  }

  async checkOrganization(orgConfig) {
    const { org } = orgConfig;
    const orgKey = this.getOrganizationKey(org);
    
    console.log(`Checking organization: ${org}`);
    
    try {
      // Get organization info
      const orgInfo = await this.githubClient.getOrganizationInfo(org);
      
      // Get current repositories
      const currentRepos = await this.githubClient.getOrganizationRepositories(org, {
        excludeForks: orgConfig.excludeForks !== false,
        type: 'public'
      });
      
      // Initialize state for this organization if not exists
      if (!this.state[orgKey]) {
        this.state[orgKey] = {
          knownRepositories: [],
          lastCheck: null
        };
      }
      
      const orgState = this.state[orgKey];
      let hasNewRepos = false;
      const newRepositories = [];
      
      // Check for new repositories
      if (orgConfig.watchNewRepos !== false) {
        for (const repo of currentRepos) {
          const isKnown = orgState.knownRepositories.some(known => known.id === repo.id);
          
          if (!isKnown) {
            // This is a new repository
            if (orgState.knownRepositories.length > 0) { // Skip initial setup
              console.log(`🆕 New repository found in ${org}: ${repo.fullName}`);
              
              // Send new repository notification
              const notificationResult = await this.notificationService.sendNewRepositoryNotification(
                orgInfo,
                repo
              );
              
              if (notificationResult.success) {
                console.log(`✅ New repository notification sent for ${repo.fullName}`);
              } else {
                console.error(`❌ Failed to send new repository notification for ${repo.fullName}:`, notificationResult.error);
              }
              
              hasNewRepos = true;
              newRepositories.push(repo);
            }
            
            // Add to known repositories
            orgState.knownRepositories.push({
              id: repo.id,
              name: repo.name,
              fullName: repo.fullName,
              createdAt: repo.createdAt
            });
          }
        }
      }
      
      // Check existing repositories for commits and releases if configured
      if (orgConfig.watchCommits !== false || orgConfig.watchReleases !== false) {
        const reposToCheck = orgState.knownRepositories.slice(0, 10); // Limit to avoid API rate limits
        
        for (const knownRepo of reposToCheck) {
          try {
            const repoInfo = currentRepos.find(r => r.id === knownRepo.id);
            if (!repoInfo) continue; // Repository might have been deleted
            
            const [owner, repo] = repoInfo.fullName.split('/');
            const repoConfig = {
              owner,
              repo,
              watchCommits: orgConfig.watchCommits,
              watchReleases: orgConfig.watchReleases,
              branch: orgConfig.branch || repoInfo.defaultBranch
            };
            
            // Use existing repository checking logic
            await this.checkRepository(repoConfig);
            
            // Small delay to respect rate limits
            await new Promise(resolve => setTimeout(resolve, 500));
            
          } catch (error) {
            console.warn(`Warning: Failed to check repository ${knownRepo.fullName} in organization ${org}:`, error.message);
          }
        }
      }
      
      orgState.lastCheck = new Date().toISOString();
      
      if (!hasNewRepos && orgState.knownRepositories.length > 0) {
        console.log(`✓ No new repositories for organization ${org}`);
      }
      
      return {
        organization: org,
        hasNewRepos,
        newRepositories: newRepositories.map(r => r.fullName),
        totalKnownRepos: orgState.knownRepositories.length,
        lastCheck: orgState.lastCheck
      };
      
    } catch (error) {
      console.error(`❌ Error checking organization ${org}:`, error.message);
      
      return {
        organization: org,
        error: error.message,
        lastCheck: new Date().toISOString()
      };
    }
  }

  async checkAllRepositories(repositories) {
    console.log(`\n🔍 Starting monitor check at ${new Date().toLocaleString()}`);
    
    // Separate repositories and organizations
    const individualRepos = repositories.filter(config => config.type !== 'organization');
    const organizations = repositories.filter(config => config.type === 'organization');
    
    console.log(`Checking ${individualRepos.length} individual repositories and ${organizations.length} organizations...\n`);
    
    const results = [];
    
    // Check individual repositories
    for (const repoConfig of individualRepos) {
      try {
        const result = await this.checkRepository(repoConfig);
        results.push(result);
        
        // Small delay between checks to respect rate limits
        await new Promise(resolve => setTimeout(resolve, 1000));
        
      } catch (error) {
        console.error(`Error processing repository ${repoConfig.owner}/${repoConfig.repo}:`, error.message);
        results.push({
          repository: `${repoConfig.owner}/${repoConfig.repo}`,
          error: error.message,
          lastCheck: new Date().toISOString()
        });
      }
    }
    
    // Check organizations
    for (const orgConfig of organizations) {
      try {
        const result = await this.checkOrganization(orgConfig);
        results.push(result);
        
        // Longer delay for organizations to respect rate limits
        await new Promise(resolve => setTimeout(resolve, 2000));
        
      } catch (error) {
        console.error(`Error processing organization ${orgConfig.org}:`, error.message);
        results.push({
          organization: orgConfig.org,
          error: error.message,
          lastCheck: new Date().toISOString()
        });
      }
    }
    
    // Save updated state
    await this.saveState();
    
    // Print summary
    const repoResults = results.filter(r => r.repository);
    const orgResults = results.filter(r => r.organization);
    const updatedRepos = repoResults.filter(r => r.hasUpdates).length;
    const newReposFromOrgs = orgResults.filter(r => r.hasNewRepos).length;
    const totalNewRepos = orgResults.reduce((total, r) => total + (r.newRepositories ? r.newRepositories.length : 0), 0);
    const errorCount = results.filter(r => r.error).length;
    
    console.log(`\n📊 Monitor check completed:`);
    console.log(`  - Individual repositories checked: ${repoResults.length}`);
    console.log(`  - Organizations checked: ${orgResults.length}`);
    console.log(`  - Repository updates found: ${updatedRepos}`);
    if (orgResults.length > 0) {
      console.log(`  - New repositories found: ${totalNewRepos} (from ${newReposFromOrgs} organizations)`);
    }
    console.log(`  - Errors: ${errorCount}`);
    
    // Check rate limit
    try {
      const rateLimit = await this.githubClient.getRateLimit();
      console.log(`  - API rate limit: ${rateLimit.remaining}/${rateLimit.limit} remaining`);
      
      if (rateLimit.remaining < 100) {
        const resetTime = new Date(rateLimit.reset * 1000);
        console.warn(`⚠️  GitHub API rate limit is low. Resets at ${resetTime.toLocaleString()}`);
      }
    } catch (error) {
      console.warn('Could not check rate limit:', error.message);
    }
    
    console.log(''); // Empty line for readability
    
    return results;
  }

  async sendTestNotification() {
    console.log('Sending test notification...');
    
    const result = await this.notificationService.sendTestNotification();
    
    if (result.success) {
      console.log('✅ Test notification sent successfully');
      return true;
    } else {
      console.error('❌ Failed to send test notification:', result.error);
      return false;
    }
  }
}

module.exports = GitHubMonitor;
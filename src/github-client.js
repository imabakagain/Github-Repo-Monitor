const { Octokit } = require('@octokit/rest');

class GitHubClient {
  constructor(token) {
    if (!token) {
      throw new Error('GitHub token is required');
    }
    
    this.octokit = new Octokit({
      auth: token,
    });
  }

  async getLatestCommit(owner, repo, branch = 'main') {
    try {
      const { data } = await this.octokit.rest.repos.listCommits({
        owner,
        repo,
        sha: branch,
        per_page: 1,
      });
      
      if (data.length === 0) {
        return null;
      }
      
      const commit = data[0];
      return {
        sha: commit.sha,
        message: commit.commit.message,
        author: commit.commit.author.name,
        date: commit.commit.author.date,
        url: commit.html_url,
        branch: branch
      };
    } catch (error) {
      if (error.status === 409) {
        // Repository is empty, try master branch
        if (branch === 'main') {
          return this.getLatestCommit(owner, repo, 'master');
        }
      }
      throw new Error(`Failed to get latest commit for ${owner}/${repo}: ${error.message}`);
    }
  }

  async getLatestRelease(owner, repo) {
    try {
      const { data } = await this.octokit.rest.repos.getLatestRelease({
        owner,
        repo,
      });
      
      return {
        tag: data.tag_name,
        name: data.name,
        body: data.body,
        author: data.author.login,
        publishedAt: data.published_at,
        url: data.html_url,
        prerelease: data.prerelease,
        draft: data.draft
      };
    } catch (error) {
      if (error.status === 404) {
        return null; // No releases found
      }
      throw new Error(`Failed to get latest release for ${owner}/${repo}: ${error.message}`);
    }
  }

  async getRepositoryInfo(owner, repo) {
    try {
      const { data } = await this.octokit.rest.repos.get({
        owner,
        repo,
      });
      
      return {
        id: data.id,
        name: data.name,
        fullName: data.full_name,
        description: data.description,
        stars: data.stargazers_count,
        forks: data.forks_count,
        language: data.language,
        defaultBranch: data.default_branch,
        updatedAt: data.updated_at,
        url: data.html_url
      };
    } catch (error) {
      throw new Error(`Failed to get repository info for ${owner}/${repo}: ${error.message}`);
    }
  }

  async getRateLimit() {
    try {
      const { data } = await this.octokit.rest.rateLimit.get();
      return {
        limit: data.rate.limit,
        remaining: data.rate.remaining,
        reset: data.rate.reset,
        used: data.rate.used
      };
    } catch (error) {
      throw new Error(`Failed to get rate limit: ${error.message}`);
    }
  }

  async getOrganizationRepositories(org, options = {}) {
    try {
      const {
        type = 'public', // 'public', 'private', 'all'
        sort = 'created',
        direction = 'desc',
        per_page = 100,
        excludeForks = true
      } = options;

      let allRepos = [];
      let page = 1;
      let hasNextPage = true;

      while (hasNextPage) {
        const { data } = await this.octokit.rest.repos.listForOrg({
          org,
          type,
          sort,
          direction,
          per_page,
          page
        });

        if (data.length === 0) {
          hasNextPage = false;
          break;
        }

        // Filter out forks if requested
        const filteredRepos = excludeForks ? data.filter(repo => !repo.fork) : data;
        
        const formattedRepos = filteredRepos.map(repo => ({
          id: repo.id,
          name: repo.name,
          fullName: repo.full_name,
          description: repo.description,
          stars: repo.stargazers_count,
          forks: repo.forks_count,
          language: repo.language,
          defaultBranch: repo.default_branch,
          createdAt: repo.created_at,
          updatedAt: repo.updated_at,
          url: repo.html_url,
          isPrivate: repo.private,
          isFork: repo.fork,
          size: repo.size
        }));

        allRepos = allRepos.concat(formattedRepos);

        // Check if we've reached the end
        if (data.length < per_page) {
          hasNextPage = false;
        } else {
          page++;
        }
      }

      return allRepos;
    } catch (error) {
      throw new Error(`Failed to get repositories for organization ${org}: ${error.message}`);
    }
  }

  async getOrganizationInfo(org) {
    try {
      const { data } = await this.octokit.rest.orgs.get({
        org
      });

      return {
        id: data.id,
        login: data.login,
        name: data.name,
        description: data.description,
        blog: data.blog,
        location: data.location,
        email: data.email,
        publicRepos: data.public_repos,
        followers: data.followers,
        following: data.following,
        createdAt: data.created_at,
        updatedAt: data.updated_at,
        url: data.html_url,
        avatarUrl: data.avatar_url
      };
    } catch (error) {
      if (error.status === 404) {
        throw new Error(`Organization '${org}' not found or not accessible`);
      }
      throw new Error(`Failed to get organization info for ${org}: ${error.message}`);
    }
  }
}

module.exports = GitHubClient;
class NotificationService {
  constructor(config) {
    this.config = config;
    this.notifiers = [];
    this.initNotifiers();
  }

  initNotifiers() {
    // 子类需要实现此方法来初始化具体的通知器
    throw new Error('initNotifiers must be implemented by subclass');
  }

  async testConnection() {
    // 测试通知服务连接，子类可以覆盖此方法
    return true;
  }

  async sendCommitNotification(repoInfo, commitInfo) {
    // 发送commit通知，子类必须实现
    throw new Error('sendCommitNotification must be implemented by subclass');
  }

  async sendReleaseNotification(repoInfo, releaseInfo) {
    // 发送release通知，子类必须实现
    throw new Error('sendReleaseNotification must be implemented by subclass');
  }

  async sendTestNotification() {
    // 发送测试通知，子类必须实现
    throw new Error('sendTestNotification must be implemented by subclass');
  }

  // 通用方法：格式化仓库信息
  formatRepoInfo(repoInfo) {
    return {
      name: repoInfo.fullName || `${repoInfo.owner}/${repoInfo.repo}`,
      description: repoInfo.description || 'No description',
      url: repoInfo.url,
      stars: repoInfo.stars || 0,
      forks: repoInfo.forks || 0,
      language: repoInfo.language || 'Unknown'
    };
  }

  // 通用方法：格式化commit信息
  formatCommitInfo(commitInfo) {
    return {
      message: commitInfo.message,
      author: commitInfo.author,
      branch: commitInfo.branch,
      sha: commitInfo.sha,
      date: commitInfo.date,
      url: commitInfo.url
    };
  }

  // 通用方法：格式化release信息
  formatReleaseInfo(releaseInfo) {
    return {
      name: releaseInfo.name,
      tag: releaseInfo.tag,
      author: releaseInfo.author,
      publishedAt: releaseInfo.publishedAt,
      body: releaseInfo.body,
      url: releaseInfo.url,
      prerelease: releaseInfo.prerelease,
      draft: releaseInfo.draft
    };
  }
}

module.exports = NotificationService;
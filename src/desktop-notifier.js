const notifier = require('node-notifier');
const path = require('path');
const NotificationService = require('./notification-service');

class DesktopNotifier extends NotificationService {
  constructor(config = {}) {
    super(config);
    this.enabled = config.enabled !== false; // 默认启用
    this.sound = config.sound !== false; // 默认有声音
    this.timeout = config.timeout || 10; // 默认10秒自动关闭
  }

  initNotifiers() {
    // 桌面通知不需要特殊初始化
  }

  async testConnection() {
    if (!this.enabled) {
      return false;
    }
    return true;
  }

  async sendCommitNotification(repoInfo, commitInfo) {
    if (!this.enabled) {
      return { success: false, error: 'Desktop notifications disabled' };
    }

    const repo = this.formatRepoInfo(repoInfo);
    const commit = this.formatCommitInfo(commitInfo);

    try {
      notifier.notify({
        title: `🚀 New Commit - ${repo.name}`,
        message: `${commit.message.substring(0, 100)}${commit.message.length > 100 ? '...' : ''}\n\nBy: ${commit.author}\nSHA: ${commit.sha.substring(0, 7)}`,
        icon: this.getIconPath(),
        sound: this.sound,
        timeout: this.timeout,
        wait: false,
        open: commit.url // 点击通知时打开commit链接
      });

      return {
        success: true,
        message: 'Desktop notification sent'
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  async sendReleaseNotification(repoInfo, releaseInfo) {
    if (!this.enabled) {
      return { success: false, error: 'Desktop notifications disabled' };
    }

    const repo = this.formatRepoInfo(repoInfo);
    const release = this.formatReleaseInfo(releaseInfo);

    try {
      let message = `New release: ${release.tag}`;
      if (release.name && release.name !== release.tag) {
        message += ` (${release.name})`;
      }
      message += `\n\nBy: ${release.author}`;
      
      if (release.prerelease) {
        message += '\n⚠️ Pre-release';
      }

      notifier.notify({
        title: `🎉 New Release - ${repo.name}`,
        message: message,
        icon: this.getIconPath(),
        sound: this.sound,
        timeout: this.timeout,
        wait: false,
        open: release.url // 点击通知时打开release链接
      });

      return {
        success: true,
        message: 'Desktop notification sent'
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  async sendNewRepositoryNotification(orgInfo, repoInfo) {
    if (!this.enabled) {
      return { success: false, error: 'Desktop notifications disabled' };
    }

    try {
      let message = `New repository: ${repoInfo.name}`;
      if (repoInfo.description) {
        message += `\n\n${repoInfo.description.substring(0, 80)}${repoInfo.description.length > 80 ? '...' : ''}`;
      }
      message += `\n\nLanguage: ${repoInfo.language || 'Not specified'}`;
      message += `\nCreated: ${new Date(repoInfo.createdAt).toLocaleDateString()}`;

      notifier.notify({
        title: `🆕 New Repository - ${orgInfo.name || orgInfo.login}`,
        message: message,
        icon: this.getIconPath(),
        sound: this.sound,
        timeout: this.timeout,
        wait: false,
        open: repoInfo.url // 点击通知时打开repository链接
      });

      return {
        success: true,
        message: 'New repository notification sent'
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  async sendTestNotification() {
    if (!this.enabled) {
      return { success: false, error: 'Desktop notifications disabled' };
    }

    try {
      notifier.notify({
        title: '🧪 GitHub Monitor Test',
        message: `Test notification sent at ${new Date().toLocaleString()}\n\nIf you see this, desktop notifications are working!`,
        icon: this.getIconPath(),
        sound: this.sound,
        timeout: this.timeout,
        wait: false
      });

      return {
        success: true,
        message: 'Test desktop notification sent'
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  getIconPath() {
    // 尝试使用GitHub图标，如果不存在则使用默认图标
    try {
      const iconPath = path.join(__dirname, '..', 'assets', 'github-icon.png');
      return iconPath;
    } catch (error) {
      // 返回undefined让系统使用默认图标
      return undefined;
    }
  }

  // 设置通知配置
  setConfig(config) {
    if (config.enabled !== undefined) {
      this.enabled = config.enabled;
    }
    if (config.sound !== undefined) {
      this.sound = config.sound;
    }
    if (config.timeout !== undefined) {
      this.timeout = config.timeout;
    }
  }

  // 获取当前配置
  getConfig() {
    return {
      enabled: this.enabled,
      sound: this.sound,
      timeout: this.timeout
    };
  }
}

module.exports = DesktopNotifier;
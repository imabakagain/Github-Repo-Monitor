const nodemailer = require('nodemailer');

class EmailService {
  constructor(config) {
    this.config = config;
    this.transporter = null;
    this.initTransporter();
  }

  initTransporter() {
    this.transporter = nodemailer.createTransport({
      host: this.config.host,
      port: this.config.port,
      secure: this.config.secure,
      auth: {
        user: this.config.user,
        pass: this.config.pass,
      },
    });
  }

  async testConnection() {
    try {
      await this.transporter.verify();
      return true;
    } catch (error) {
      throw new Error(`Email service connection failed: ${error.message}`);
    }
  }

  generateCommitEmailHtml(repoInfo, commitInfo) {
    return `
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background-color: #24292e; color: white; padding: 20px; border-radius: 5px 5px 0 0; }
        .content { background-color: #f6f8fa; padding: 20px; border-radius: 0 0 5px 5px; }
        .commit-info { background-color: white; padding: 15px; margin: 10px 0; border-radius: 5px; border-left: 4px solid #28a745; }
        .meta { color: #586069; font-size: 14px; margin: 5px 0; }
        .button { display: inline-block; background-color: #0366d6; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; margin: 10px 0; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h2>🚀 New Commit in ${repoInfo.fullName}</h2>
        </div>
        <div class="content">
          <div class="commit-info">
            <h3>Latest Commit</h3>
            <p><strong>Message:</strong> ${commitInfo.message}</p>
            <div class="meta">
              <p><strong>Author:</strong> ${commitInfo.author}</p>
              <p><strong>Branch:</strong> ${commitInfo.branch}</p>
              <p><strong>Date:</strong> ${new Date(commitInfo.date).toLocaleString()}</p>
              <p><strong>SHA:</strong> <code>${commitInfo.sha.substring(0, 7)}</code></p>
            </div>
            <a href="${commitInfo.url}" class="button">View Commit</a>
          </div>
          
          <div style="margin-top: 20px; padding: 15px; background-color: white; border-radius: 5px;">
            <h4>Repository Info</h4>
            <p><strong>Description:</strong> ${repoInfo.description || 'No description'}</p>
            <p><strong>Language:</strong> ${repoInfo.language || 'Not specified'}</p>
            <p><strong>Stars:</strong> ⭐ ${repoInfo.stars} | <strong>Forks:</strong> 🍴 ${repoInfo.forks}</p>
            <a href="${repoInfo.url}" class="button">View Repository</a>
          </div>
        </div>
      </div>
    </body>
    </html>`;
  }

  generateReleaseEmailHtml(repoInfo, releaseInfo) {
    return `
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background-color: #24292e; color: white; padding: 20px; border-radius: 5px 5px 0 0; }
        .content { background-color: #f6f8fa; padding: 20px; border-radius: 0 0 5px 5px; }
        .release-info { background-color: white; padding: 15px; margin: 10px 0; border-radius: 5px; border-left: 4px solid #0366d6; }
        .meta { color: #586069; font-size: 14px; margin: 5px 0; }
        .button { display: inline-block; background-color: #0366d6; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; margin: 10px 0; }
        .release-body { background-color: #f8f9fa; padding: 10px; border-radius: 3px; margin: 10px 0; white-space: pre-wrap; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h2>🎉 New Release in ${repoInfo.fullName}</h2>
        </div>
        <div class="content">
          <div class="release-info">
            <h3>${releaseInfo.name || releaseInfo.tag}</h3>
            <div class="meta">
              <p><strong>Tag:</strong> <code>${releaseInfo.tag}</code></p>
              <p><strong>Author:</strong> ${releaseInfo.author}</p>
              <p><strong>Published:</strong> ${new Date(releaseInfo.publishedAt).toLocaleString()}</p>
              ${releaseInfo.prerelease ? '<p><strong>⚠️ Pre-release</strong></p>' : ''}
              ${releaseInfo.draft ? '<p><strong>📝 Draft</strong></p>' : ''}
            </div>
            ${releaseInfo.body ? `<div class="release-body">${releaseInfo.body}</div>` : ''}
            <a href="${releaseInfo.url}" class="button">View Release</a>
          </div>
          
          <div style="margin-top: 20px; padding: 15px; background-color: white; border-radius: 5px;">
            <h4>Repository Info</h4>
            <p><strong>Description:</strong> ${repoInfo.description || 'No description'}</p>
            <p><strong>Language:</strong> ${repoInfo.language || 'Not specified'}</p>
            <p><strong>Stars:</strong> ⭐ ${repoInfo.stars} | <strong>Forks:</strong> 🍴 ${repoInfo.forks}</p>
            <a href="${repoInfo.url}" class="button">View Repository</a>
          </div>
        </div>
      </div>
    </body>
    </html>`;
  }

  async sendCommitNotification(to, repoInfo, commitInfo) {
    const subject = `🚀 New commit in ${repoInfo.fullName}`;
    const html = this.generateCommitEmailHtml(repoInfo, commitInfo);
    
    return await this.sendEmail(to, subject, html);
  }

  async sendReleaseNotification(to, repoInfo, releaseInfo) {
    const subject = `🎉 New release ${releaseInfo.tag} in ${repoInfo.fullName}`;
    const html = this.generateReleaseEmailHtml(repoInfo, releaseInfo);
    
    return await this.sendEmail(to, subject, html);
  }

  async sendEmail(to, subject, html) {
    try {
      const mailOptions = {
        from: `${this.config.fromName} <${this.config.fromEmail}>`,
        to: to,
        subject: subject,
        html: html,
      };

      const info = await this.transporter.sendMail(mailOptions);
      return {
        success: true,
        messageId: info.messageId,
        response: info.response
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  async sendTestEmail(to) {
    const subject = 'GitHub Monitor Test Email';
    const html = `
    <html>
    <body style="font-family: Arial, sans-serif; padding: 20px;">
      <h2>🧪 GitHub Monitor Test Email</h2>
      <p>This is a test email from your GitHub Monitor service.</p>
      <p>If you receive this email, your email configuration is working correctly!</p>
      <p>Time sent: ${new Date().toLocaleString()}</p>
    </body>
    </html>`;
    
    return await this.sendEmail(to, subject, html);
  }
}

module.exports = EmailService;
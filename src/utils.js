const fs = require('fs').promises;
const path = require('path');

/**
 * Utility functions for GitHub Monitor
 */

/**
 * Format timestamp to readable string
 * @param {string|Date} timestamp 
 * @returns {string} Formatted timestamp
 */
function formatTimestamp(timestamp) {
  const date = new Date(timestamp);
  return date.toLocaleString('en-US', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false
  });
}

/**
 * Format duration in milliseconds to human readable string
 * @param {number} duration Duration in milliseconds
 * @returns {string} Human readable duration
 */
function formatDuration(duration) {
  const seconds = Math.floor(duration / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  
  if (hours > 0) {
    return `${hours}h ${minutes % 60}m ${seconds % 60}s`;
  } else if (minutes > 0) {
    return `${minutes}m ${seconds % 60}s`;
  } else {
    return `${seconds}s`;
  }
}

/**
 * Validate email address format
 * @param {string} email Email address to validate
 * @returns {boolean} True if valid email format
 */
function validateEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Validate GitHub repository format (owner/repo)
 * @param {string} repoString Repository string in owner/repo format
 * @returns {boolean} True if valid format
 */
function validateRepositoryFormat(repoString) {
  const repoRegex = /^[a-zA-Z0-9._-]+\/[a-zA-Z0-9._-]+$/;
  return repoRegex.test(repoString);
}

/**
 * Parse repository string to owner and repo
 * @param {string} repoString Repository string in owner/repo format
 * @returns {{owner: string, repo: string}} Parsed owner and repo
 */
function parseRepository(repoString) {
  if (!validateRepositoryFormat(repoString)) {
    throw new Error('Invalid repository format. Expected: owner/repo');
  }
  
  const [owner, repo] = repoString.split('/');
  return { owner, repo };
}

/**
 * Truncate text to specified length
 * @param {string} text Text to truncate
 * @param {number} length Maximum length
 * @param {string} suffix Suffix to add when truncated
 * @returns {string} Truncated text
 */
function truncateText(text, length = 100, suffix = '...') {
  if (!text || text.length <= length) {
    return text || '';
  }
  
  return text.substring(0, length - suffix.length) + suffix;
}

/**
 * Create directory if it doesn't exist
 * @param {string} dirPath Directory path
 */
async function ensureDirectory(dirPath) {
  try {
    await fs.access(dirPath);
  } catch (error) {
    if (error.code === 'ENOENT') {
      await fs.mkdir(dirPath, { recursive: true });
    } else {
      throw error;
    }
  }
}

/**
 * Read JSON file safely
 * @param {string} filePath Path to JSON file
 * @param {any} defaultValue Default value if file doesn't exist
 * @returns {Promise<any>} Parsed JSON data
 */
async function readJsonFile(filePath, defaultValue = null) {
  try {
    const data = await fs.readFile(filePath, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    if (error.code === 'ENOENT') {
      return defaultValue;
    }
    throw new Error(`Failed to read JSON file ${filePath}: ${error.message}`);
  }
}

/**
 * Write JSON file safely
 * @param {string} filePath Path to JSON file
 * @param {any} data Data to write
 */
async function writeJsonFile(filePath, data) {
  try {
    const jsonData = JSON.stringify(data, null, 2);
    await fs.writeFile(filePath, jsonData, 'utf8');
  } catch (error) {
    throw new Error(`Failed to write JSON file ${filePath}: ${error.message}`);
  }
}

/**
 * Sleep for specified milliseconds
 * @param {number} ms Milliseconds to sleep
 * @returns {Promise<void>}
 */
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Get time until next execution based on cron expression
 * @param {number} intervalMinutes Interval in minutes
 * @returns {string} Time until next execution
 */
function getTimeUntilNextExecution(intervalMinutes) {
  const now = new Date();
  const nextExecution = new Date(now.getTime() + intervalMinutes * 60 * 1000);
  
  return formatTimestamp(nextExecution);
}

/**
 * Generate random string of specified length
 * @param {number} length String length
 * @returns {string} Random string
 */
function generateRandomString(length = 10) {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  
  return result;
}

/**
 * Log with timestamp
 * @param {string} level Log level (info, warn, error)
 * @param {string} message Log message
 * @param {any} data Additional data to log
 */
function log(level, message, data = null) {
  const timestamp = formatTimestamp(new Date());
  const prefix = `[${timestamp}] [${level.toUpperCase()}]`;
  
  if (data) {
    console.log(prefix, message, data);
  } else {
    console.log(prefix, message);
  }
}

module.exports = {
  formatTimestamp,
  formatDuration,
  validateEmail,
  validateRepositoryFormat,
  parseRepository,
  truncateText,
  ensureDirectory,
  readJsonFile,
  writeJsonFile,
  sleep,
  getTimeUntilNextExecution,
  generateRandomString,
  log
};
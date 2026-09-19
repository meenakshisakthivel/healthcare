const fs = require('fs');
const path = require('path');

const dataDir = path.join(__dirname, '..', 'data');

const ensureDataDir = () => {
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }
};

const readJSON = (name) => {
  ensureDataDir();
  const filePath = path.join(dataDir, `${name}.json`);
  if (!fs.existsSync(filePath)) {
    fs.writeFileSync(filePath, '[]', 'utf8');
    return [];
  }
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    if (!content.trim()) return [];
    return JSON.parse(content);
  } catch (error) {
    return [];
  }
};

const writeJSON = (name, value) => {
  ensureDataDir();
  const filePath = path.join(dataDir, `${name}.json`);
  fs.writeFileSync(filePath, JSON.stringify(value, null, 2), 'utf8');
};

module.exports = {
  readJSON,
  writeJSON,
  dataDir
};

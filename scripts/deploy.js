const { execSync } = require('child_process');
const path = require('path');

const rootDir = path.join(__dirname, '..');
const argv = process.argv.slice(2);
const type = argv[0] || '';

const exceCMD = (cmd, options = {}) => {
  let result = '';
  try {
    result = execSync(cmd, {
      encoding: 'utf8',
      ...options
    });
  } catch (error) {
    console.error('cmd', cmd, error);
  }
  return result;
};

// 比较版本号
const compareVersions = (versionA, versionB) => {
  const segmentsA = versionA.split('.').map(Number);
  const segmentsB = versionB.split('.').map(Number);

  for (let i = 0; i < Math.max(segmentsA.length, segmentsB.length); i++) {
    const segmentA = segmentsA[i] || 0;
    const segmentB = segmentsB[i] || 0;

    if (segmentA > segmentB) {
      return 1;
    } else if (segmentA < segmentB) {
      return -1;
    }
  }

  return 0;
};

// 获取不超过目标版本号的最新版本号
const getLatestVersion = (versions, targetVersion = '99999.99999.99999') => {
  const filteredVersions = versions.filter(version => compareVersions(version, targetVersion) < 0);

  filteredVersions.sort((a, b) => compareVersions(b, a)); // 降序排列

  return filteredVersions[0];
};

/* ===== main start ===== */

console.info(exceCMD(`git --version`));
console.info(`process.env.GITHUB_ACTIONS: ${process.env.GITHUB_ACTIONS}`);
console.info(`process.env.GITHUB_HEAD_REF: ${process.env.GITHUB_HEAD_REF}`);

exceCMD(`git checkout main`, { cwd: rootDir });
// exceCMD(`git pull`, { cwd: rootDir });

const arrVersions = exceCMD(`git remote update origin --prune ` + `&& git branch -r`)
  .split('\n')
  .filter(item => {
    return !!item && /^origin\/release\//g.test(item.trim());
  })
  .map(item => item.trim().replace(/^origin\/release\//g, ''));

const objTypeName = {
  major: 0,
  feat: 1,
  fix: 2
};

const latestVersion = getLatestVersion(arrVersions) || '0.0.0';
console.log('latestVersion', latestVersion);

const latestVersionNums = latestVersion.split('.').map(item => parseInt(item));
// console.log('latestVersion', latestVersion);

const index = objTypeName[type] ?? 2;
console.log('type', type, index, objTypeName[type]);

for (let i = index; i < Object.keys(objTypeName).length; i++) {
  if (latestVersionNums[i] === void 0) {
    break;
  }
  if (i === index) {
    latestVersionNums[i]++;
  } else {
    latestVersionNums[i] = 0;
  }
}
const resultVersion = latestVersionNums.join('.');

console.log(`resultVersion: ${resultVersion}`);

console.info(
  exceCMD(
    `git checkout -b release/${resultVersion}` +
      `&& git push --set-upstream origin release/${resultVersion}`,
    { cwd: rootDir }
  )
);

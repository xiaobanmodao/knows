const Module = require('module');

const RUNTIME_REPOSITORIES = [
  'packages/math/repository',
  'packages/english/repository',
  'packages/physics/repository',
  'packages/chemistry/repository',
  'packages/biology/repository',
];

function checkRuntimePackageDependencies() {
  const originalLoad = Module._load;
  const failures = [];

  Module._load = function guardedLoad(request, parent, isMain) {
    if (request === 'crypto') {
      throw new Error('Node-only module "crypto" was loaded by a runtime package');
    }
    return originalLoad.call(this, request, parent, isMain);
  };

  try {
    RUNTIME_REPOSITORIES.forEach((repositoryPath) => {
      try {
        delete require.cache[require.resolve(`../${repositoryPath}`)];
        const repository = require(`../${repositoryPath}`);
        if (!repository || typeof repository.getSubjectHome !== 'function') {
          failures.push(`${repositoryPath}: repository 缺少 getSubjectHome()`);
        }
      } catch (error) {
        failures.push(`${repositoryPath}: ${error.message}`);
      }
    });
  } finally {
    Module._load = originalLoad;
  }

  if (failures.length) {
    throw new Error(`运行时分包依赖检查失败\n${failures.join('\n')}`);
  }

  return { checked: RUNTIME_REPOSITORIES.length };
}

if (require.main === module) {
  try {
    const result = checkRuntimePackageDependencies();
    console.log(`OK runtime package dependencies checked · repositories: ${result.checked}`);
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  }
}

module.exports = {
  RUNTIME_REPOSITORIES,
  checkRuntimePackageDependencies,
};

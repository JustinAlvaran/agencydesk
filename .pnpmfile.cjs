module.exports = {
  hooks: {
    readPackage(pkg) {
      if (pkg.name === '@a2ui/react' && pkg.version === '0.15.0') {
        // This release declares Zod as both a dependency and a peer. pnpm 10
        // otherwise replaces its Zod 3 dependency with the app's Zod 4 peer.
        // Keep its declared dependency (pinned in package.json), not an app peer.
        delete pkg.peerDependencies.zod;
      }
      return pkg;
    },
  },
};
